import { describe, it, expect } from 'vitest';
import {
  calculateTotalUnits,
  convertTotalUnitsToStock,
  getStandardItemName,
  filterAndNetDispensaryLogs,
  applyStockDiscard,
  filterDiscardLogs,
  aggregateTopDispensed,
} from '@/lib/stockMath';
import { InventoryItem } from '@/types/inventory';

describe('Stock Math & Bottle Borrowing', () => {
  it('calculates total units correctly', () => {
    expect(calculateTotalUnits(2, 100, 15)).toBe(215);
    expect(calculateTotalUnits(0, 100, 45)).toBe(45);
    expect(calculateTotalUnits(5, 1, 0)).toBe(5);
  });

  it('converts total units to stock breakdown', () => {
    expect(convertTotalUnitsToStock(215, 100)).toEqual({ bottles: 2, loose: 15 });
    expect(convertTotalUnitsToStock(99, 100)).toEqual({ bottles: 0, loose: 99 });
    expect(convertTotalUnitsToStock(100, 100)).toEqual({ bottles: 1, loose: 0 });
    expect(convertTotalUnitsToStock(3, 1)).toEqual({ bottles: 3, loose: 0 });
    expect(convertTotalUnitsToStock(0, 100)).toEqual({ bottles: 0, loose: 0 });
    expect(convertTotalUnitsToStock(-5, 100)).toEqual({ bottles: 0, loose: 0 });
  });

  it('handles bottle borrowing when dispensing 1 tablet from sealed bottle', () => {
    const currentTotal = calculateTotalUnits(1, 100, 0); // 100
    const afterDispense = Math.max(0, currentTotal - 1); // 99
    expect(convertTotalUnitsToStock(afterDispense, 100)).toEqual({ bottles: 0, loose: 99 });
  });

  it('dispensing entire bottle leaves 0 stock', () => {
    const currentTotal = calculateTotalUnits(1, 100, 0);
    const afterDispense = Math.max(0, currentTotal - 100);
    expect(convertTotalUnitsToStock(afterDispense, 100)).toEqual({ bottles: 0, loose: 0 });
  });
});

describe('Canonical Medication Naming', () => {
  it('formats standard item names', () => {
    expect(getStandardItemName('Clotrimazole Cream', '1oz, cream')).toBe('Clotrimazole Cream (1oz, cream)');
    expect(getStandardItemName('Clotrimazole Cream (1oz, cream)', '1oz, cream')).toBe('Clotrimazole Cream (1oz, cream)');
    expect(getStandardItemName('Amoxicillin', '500 mg')).toBe('Amoxicillin (500 mg)');
    expect(getStandardItemName('Ibuprofen (200 mg Tablet)', '200 mg')).toBe('Ibuprofen (200 mg Tablet)');
    expect(getStandardItemName('Acetaminophen', null)).toBe('Acetaminophen');
    expect(getStandardItemName('Acetaminophen', 'N/A')).toBe('Acetaminophen');
    expect(getStandardItemName('', '')).toBe('Medication Formulation');
  });
});

describe('Analytics Net Dispense Math', () => {
  it('nets out dispense when subsequently undispensed', () => {
    const clotrimazoleLogs = [
      { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'DISPENSE', details: 'Dispensed 3 units' },
      { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'UNDISPENSE', details: 'Undispensed 3 units back into inventory.' },
    ];
    const result = aggregateTopDispensed(clotrimazoleLogs as any);
    expect(result.length).toBe(0);
  });

  it('preserves restock without altering dispense count', () => {
    const restockTestLogs = [
      { itemGenericName: 'Metformin (500mg)', quantityChanged: 50, actionType: 'DISPENSE', details: 'Dispensed 50 units to patient' },
      { itemGenericName: 'Metformin (500mg)', quantityChanged: 100, actionType: 'RESTOCK', details: 'Restocked 100 units into inventory' },
    ];
    const result = aggregateTopDispensed(restockTestLogs as any);
    expect(result).toEqual([{ genericName: 'Metformin (500mg)', totalDispensed: 50, category: 'General Medical' }]);
  });

  it('correctly handles reverse-chronological logs from database', () => {
    const amlodipineReverseLogs = [
      { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: 1, actionType: 'UNDISPENSE', details: 'Undispensed 1 units back into inventory.', createdAt: '2026-08-31T20:55:05Z' },
      { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: -1, actionType: 'DISPENSE', details: 'Dispensed 1 units', createdAt: '2026-08-31T20:55:00Z' },
    ];
    const result = aggregateTopDispensed(amlodipineReverseLogs as any);
    expect(result.length).toBe(0);
  });

  it('strictly excludes dumped expired medications and discards from top dispensed', () => {
    const mixedLogs = [
      { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 0, actionType: 'AUDIT', details: '[EXPIRED WASTE DISPOSAL]: Expired medication dumped out and thrown away. Reset from 500 to 0.' },
      { itemGenericName: 'Quetiapine Fumarate (300 mg Tablet)', quantityChanged: -2400, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-2400 tablets) of Lot E244744.' },
      { itemGenericName: 'Pitavastatin Calcium (1 mg Oral Tablet)', quantityChanged: -2160, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-2160 tablets).' },
      { itemGenericName: 'Lurasidone HCl (20 mg Oral Tablet)', quantityChanged: -720, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-720 tablets) of Lot A241211.' },
    ];
    const result = aggregateTopDispensed(mixedLogs as any);
    expect(result.length).toBe(0);
  });

  it('correctly nets partial undispense', () => {
    const partialUndispenseLogs = [
      { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 5, actionType: 'DISPENSE', details: 'Dispensed 5 units' },
      { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 2, actionType: 'UNDISPENSE', details: 'Undispensed 2 units' },
    ];
    const result = aggregateTopDispensed(partialUndispenseLogs as any);
    expect(result).toEqual([{ genericName: 'Amoxicillin (500mg)', totalDispensed: 3, category: 'General Medical' }]);
  });
});

describe('Dispensary Audit Log Report', () => {
  it('removes matching dispense when fully undispensed', () => {
    const result = filterAndNetDispensaryLogs([
      { id: '1', itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: -3, actionType: 'DISPENSE', createdAt: '2026-09-01T10:00:00Z' },
      { id: '2', itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'UNDISPENSE', createdAt: '2026-09-01T10:05:00Z' },
    ] as any);
    expect(result.length).toBe(0);
  });

  it('keeps RESTOCK and reduces partial undispenses', () => {
    const result = filterAndNetDispensaryLogs([
      { id: '1', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: -10, actionType: 'DISPENSE', createdAt: '2026-09-01T10:00:00Z' },
      { id: '2', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 4, actionType: 'UNDISPENSE', createdAt: '2026-09-01T10:15:00Z' },
    ] as any);
    expect(result.length).toBe(1);
    expect(result[0].effectiveQty).toBe(6);
  });

  it('strictly excludes administrative logs (AUDIT, EDIT, CREATE, DELETE)', () => {
    const result = filterAndNetDispensaryLogs([
      { id: '1', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: -500, actionType: 'AUDIT', details: '[EXPIRED WASTE DISPOSAL] Thrown away', createdAt: '2026-09-01T12:00:00Z' },
      { id: '2', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 10, actionType: 'EDIT', details: 'Manual edit', createdAt: '2026-09-01T12:05:00Z' },
      { id: '3', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 0, actionType: 'CREATE', details: 'Initial creation', createdAt: '2026-09-01T12:10:00Z' },
      { id: '4', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 0, actionType: 'DELETE', details: 'Deleted item', createdAt: '2026-09-01T12:15:00Z' },
      { id: '5', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: -20, actionType: 'DISPENSE', createdAt: '2026-09-01T12:20:00Z' },
    ] as any);
    expect(result.length).toBe(1);
    expect(result[0].actionType).toBe('DISPENSE');
    expect(result[0].effectiveQty).toBe(20);
  });
});

describe('Stock Discard & Multi-Lot Expiration', () => {
  const multiLotItem: InventoryItem = {
    id: 'advil-123',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    dosage: '200 mg Tablet',
    itemType: 'MEDICATION',
    shelfLocation: 'General Medical',
    bottlesAvailable: 6,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2026-08-01',
    lotNumbers: [
      { lotNumber: '4ME2261', expirationDate: '2026-08-01', bottles: 1, looseUnits: 0 },
      { lotNumber: '5AE2669', expirationDate: '2026-10-31', bottles: 5, looseUnits: 0 }
    ] as any,
  };

  it('discards single lot and rolls forward expiration date', () => {
    const result = applyStockDiscard(multiLotItem, {
      lotNumber: '4ME2261',
      bottlesToDiscard: 1,
    });
    expect(result.totalPillsDiscarded).toBe(100);
    expect(result.bottlesDiscarded).toBe(1);
    expect(result.updatedItem.bottlesAvailable).toBe(5);
    expect(result.updatedItem.expirationDate).toBe('2026-10-31');
    expect(result.isFullyEmptied).toBe(false);
  });

  it('discard all stock sets quantity to 0 while preserving medication identity', () => {
    const result = applyStockDiscard(multiLotItem, { discardAll: true });
    expect(result.totalPillsDiscarded).toBe(600);
    expect(result.updatedItem.bottlesAvailable).toBe(0);
    expect(result.updatedItem.looseUnitsAvailable).toBe(0);
    expect(result.updatedItem.expirationDate).toBe('');
    expect(result.isFullyEmptied).toBe(true);
    expect(result.updatedItem.genericName).toBe('Ibuprofen');
  });

  it('filters and normalizes discard logs', () => {
    const rawLogs = [
      {
        id: 'log-1',
        itemGenericName: 'Pitavastatin Calcium (2 mg Tablet)',
        actionType: 'DISCARD',
        quantityChanged: -2160,
        dispensedBottles: 24,
        lotNumbers: ['22B0567'],
        createdAt: '2026-09-29T15:00:00Z',
        details: '[EXPIRED / WASTE]: Discarded 24 bottles of Lot 22B0567'
      },
      {
        id: 'log-2',
        itemGenericName: 'Amoxicillin (500mg)',
        actionType: 'DISPENSE',
        quantityChanged: -30,
        createdAt: '2026-09-29T15:10:00Z',
        details: 'Dispensed 30 units to patient'
      },
      {
        id: 'log-4',
        itemGenericName: 'Advil (200 mg Tablet)',
        actionType: 'DISCARD',
        quantityChanged: -100,
        dispensedBottles: 1,
        lotNumbers: ['4ME2261'],
        createdAt: '2026-09-29T15:30:00Z',
        details: '[EXPIRED / WASTE]: Discarded 1 bottle of Lot 4ME2261'
      }
    ];
    const discards = filterDiscardLogs(rawLogs as any);
    expect(discards.length).toBe(2);
    expect(discards[0].itemGenericName).toBe('Advil (200 mg Tablet)');
    expect(discards[0].effectivePillsDiscarded).toBe(100);
    expect(discards[0].effectiveBottlesDiscarded).toBe(1);
    expect(discards[1].itemGenericName).toBe('Pitavastatin Calcium (2 mg Tablet)');
    expect(discards[1].effectivePillsDiscarded).toBe(2160);
  });
});
