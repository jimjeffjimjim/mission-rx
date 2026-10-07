import { calculateTotalUnits, convertTotalUnitsToStock, getStandardItemName, filterAndNetDispensaryLogs, applyStockDiscard, filterDiscardLogs, aggregateTopDispensed, generateItemEditDiff, parseItemEditDiff } from '../lib/stockMath';
import { InventoryItem } from '../types/inventory';

// Test Runner Framework
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

function assertEquals(actual: any, expected: any, testName: string) {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isMatch, testName, `Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
}

console.log('\n============================================================');
console.log('🧪 MISSIONRX COMPREHENSIVE LOGIC VERIFICATION SUITE');
console.log('============================================================\n');

// -------------------------------------------------------------
// 1. Stock Math & Boundary Borrowing
// -------------------------------------------------------------
console.log('📦 1. Stock Math & Bottle Borrowing Tests:');

// Test 1.1: Total units calculation
assertEquals(calculateTotalUnits(2, 100, 15), 215, 'Calculate total units (2 bottles * 100 + 15 loose = 215)');
assertEquals(calculateTotalUnits(0, 100, 45), 45, 'Calculate total units with 0 bottles');
assertEquals(calculateTotalUnits(5, 1, 0), 5, 'Calculate total units for 1-pack items (creams/tubes)');

// Test 1.2: Convert total units to stock breakdown
assertEquals(convertTotalUnitsToStock(215, 100), { bottles: 2, loose: 15 }, 'Convert 215 units (pack 100) -> 2 bottles, 15 loose');
assertEquals(convertTotalUnitsToStock(99, 100), { bottles: 0, loose: 99 }, 'Convert 99 units (pack 100) -> 0 bottles, 99 loose');
assertEquals(convertTotalUnitsToStock(100, 100), { bottles: 1, loose: 0 }, 'Convert 100 units (pack 100) -> 1 bottle, 0 loose');
assertEquals(convertTotalUnitsToStock(3, 1), { bottles: 3, loose: 0 }, 'Convert 3 units (pack 1) -> 3 bottles, 0 loose');
assertEquals(convertTotalUnitsToStock(0, 100), { bottles: 0, loose: 0 }, 'Convert 0 units -> 0 bottles, 0 loose');
assertEquals(convertTotalUnitsToStock(-5, 100), { bottles: 0, loose: 0 }, 'Clamping negative total units to 0');

// Test 1.3: Dispensing 1 tablet from 1 unopened bottle of 100 (Bottle Borrowing)
const startBottles = 1;
const startLoose = 0;
const packSize = 100;
const currentTotal = calculateTotalUnits(startBottles, packSize, startLoose); // 100
const afterDispense1Total = Math.max(0, currentTotal - 1); // 99
const afterDispense1Stock = convertTotalUnitsToStock(afterDispense1Total, packSize);
assertEquals(afterDispense1Stock, { bottles: 0, loose: 99 }, 'Dispensing 1 tablet from 1 sealed bottle borrows from bottle (0 bottles, 99 loose)');

// Test 1.4: Dispensing 1 bottle (100 tablets) from 1 sealed bottle
const afterDispenseBottleTotal = Math.max(0, currentTotal - 100); // 0
const afterDispenseBottleStock = convertTotalUnitsToStock(afterDispenseBottleTotal, packSize);
assertEquals(afterDispenseBottleStock, { bottles: 0, loose: 0 }, 'Dispensing 1 bottle (100 tablets) drops stock to 0 bottles, 0 loose');

// -------------------------------------------------------------
// 2. Canonical Medication Naming
// -------------------------------------------------------------
console.log('\n🏷️ 2. Canonical Medication Naming Tests:');

assertEquals(getStandardItemName('Clotrimazole Cream', '1oz, cream'), 'Clotrimazole Cream (1oz, cream)', 'Combine name and dosage');
assertEquals(getStandardItemName('Clotrimazole Cream (1oz, cream)', '1oz, cream'), 'Clotrimazole Cream (1oz, cream)', 'Prevent duplicate dosage in name');
assertEquals(getStandardItemName('Amoxicillin', '500 mg'), 'Amoxicillin (500 mg)', 'Standard dosage formatting');
assertEquals(getStandardItemName('Ibuprofen (200 mg Tablet)', '200 mg'), 'Ibuprofen (200 mg Tablet)', 'Keep name when dosage is substring');
assertEquals(getStandardItemName('Acetaminophen', null), 'Acetaminophen', 'Handle null dosage');
assertEquals(getStandardItemName('Acetaminophen', 'N/A'), 'Acetaminophen', 'Handle N/A dosage');
assertEquals(getStandardItemName('', ''), 'Medication Formulation', 'Handle empty inputs');

// -------------------------------------------------------------
// 3. Analytics Net Dispense Math (Dispense vs Undispense)
// -------------------------------------------------------------
console.log('\n📊 3. Analytics Net Dispense Calculations:');

// Scenario 3.1: Dispense 3 Clotrimazole creams, then Undispense 3 Clotrimazole creams (reverses dispense)
const clotrimazoleLogs = [
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'DISPENSE', details: 'Dispensed 3 units' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'UNDISPENSE', details: 'Undispensed 3 units back into inventory.' },
];
const clotrimazoleResult = aggregateTopDispensed(clotrimazoleLogs);
assertEquals(clotrimazoleResult.length, 0, 'Dispensing 3 creams and undispensing 3 creams nets to 0 (dropped from top dispensed list)');

// Scenario 3.1b: Restocking does NOT undo dispensing
const restockTestLogs = [
  { itemGenericName: 'Metformin (500mg)', quantityChanged: 50, actionType: 'DISPENSE', details: 'Dispensed 50 units to patient' },
  { itemGenericName: 'Metformin (500mg)', quantityChanged: 100, actionType: 'RESTOCK', details: 'Restocked 100 units into inventory' },
];
const restockResult = aggregateTopDispensed(restockTestLogs);
assertEquals(restockResult, [{ genericName: 'Metformin (500mg)', totalDispensed: 50, category: 'General Medical' }], 'Restocking 100 does NOT undo previous 50 dispenses (dispensed count remains 50)');

// Scenario 3.1c: REVERSE CHRONOLOGICAL ORDER (as received from database desc) - Amlodipine 1 Dispense, 1 Undispense
const amlodipineReverseLogs = [
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: 1, actionType: 'UNDISPENSE', details: 'Undispensed 1 units back into inventory.', createdAt: '2026-08-31T20:55:05Z' },
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: -1, actionType: 'DISPENSE', details: 'Dispensed 1 units', createdAt: '2026-08-31T20:55:00Z' },
];
const amlodipineResult = aggregateTopDispensed(amlodipineReverseLogs);
assertEquals(amlodipineResult.length, 0, 'Reverse chronological order: Undispense coming before Dispense in array nets to exactly 0 (not 1)');

// Scenario 3.1d: Dumped Expired Medication does NOT count as dispensed
const expiredDumpLogs = [
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 0, actionType: 'AUDIT', details: '[EXPIRED WASTE DISPOSAL]: Expired medication dumped out and thrown away. Reset from 500 to 0.' },
];
const expiredDumpResult = aggregateTopDispensed(expiredDumpLogs);
assertEquals(expiredDumpResult.length, 0, 'Dumping expired pills (actionType AUDIT with 0 quantity) does NOT count as dispensed');

// Scenario 3.1e: Real Discarded Stock with negative quantityChanged MUST NOT count as dispensed
const userReportedDiscardLogs = [
  { itemGenericName: 'Quetiapine Fumarate (300 mg Tablet)', quantityChanged: -2400, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-2400 tablets) of Lot E244744.' },
  { itemGenericName: 'Pitavastatin Calcium (1 mg Oral Tablet)', quantityChanged: -2160, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-2160 tablets).' },
  { itemGenericName: 'Lurasidone HCl (20 mg Oral Tablet)', quantityChanged: -720, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 24 bottle(s) (-720 tablets) of Lot A241211.' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: -100, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 1 bottle(s) (-100 tablets) of Lot 4ME2261.' },
  { itemGenericName: 'Clobetasol Propionate (0.05% Cream)', quantityChanged: -19, actionType: 'DISCARD', details: '[EXPIRED / WASTE]: Discarded 19 tube(s) (-19 tubes) of Lot 153224031A.' },
];
const userDiscardResult = aggregateTopDispensed(userReportedDiscardLogs);
assertEquals(userDiscardResult.length, 0, 'Real discarded/waste medications (-2400, -2160, -720, -100, -19) NEVER count as dispensed');

// Scenario 3.2: Dispense 5, Undispense 2 -> Net 3
const partialUndispenseLogs = [
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 5, actionType: 'DISPENSE', details: 'Dispensed 5 units' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 2, actionType: 'UNDISPENSE', details: 'Undispensed 2 units' },
];
const partialResult = aggregateTopDispensed(partialUndispenseLogs);
assertEquals(partialResult, [{ genericName: 'Amoxicillin (500mg)', totalDispensed: 3, category: 'General Medical' }], 'Dispense 5 and undispense 2 nets exactly 3 units');

// Scenario 3.3: Multiple medications ranking with Restock and Undispense
const multiMedLogs = [
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 100, actionType: 'DISPENSE', details: 'Dispensed 1 bottle' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 500, actionType: 'RESTOCK', details: 'Restocked 5 bottles' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 21, actionType: 'DISPENSE', details: 'Dispensed 21 loose units' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'DISPENSE', details: 'Dispensed 3 tubes' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'UNDISPENSE', details: 'Undispensed 3 tubes' },
];
const multiResult = aggregateTopDispensed(multiMedLogs);
assertEquals(multiResult, [
  { genericName: 'Ibuprofen (200 mg Tablet)', totalDispensed: 100, category: 'General Medical' },
  { genericName: 'Amoxicillin (500mg)', totalDispensed: 21, category: 'General Medical' }
], 'Correct ranking: Ibuprofen (100 - unaffected by restock of 500), Amoxicillin (21), Clotrimazole (0 - excluded by undispense)');

// -------------------------------------------------------------
// 4. Lot Numbers Parsing & Formatting
// -------------------------------------------------------------
console.log('\n🔢 4. Lot Numbers Parsing & Formatting:');

function parseLots(lotNumbers: any): string[] {
  if (!lotNumbers) return [];
  if (Array.isArray(lotNumbers)) return lotNumbers.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof lotNumbers === 'string') {
    const trimmed = lotNumbers.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      } catch (e) {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

assertEquals(parseLots('["150225", "49E2261"]'), ['150225', '49E2261'], 'Parse JSON array string of lot numbers');
assertEquals(parseLots('150225, 49E2261, 2263550'), ['150225', '49E2261', '2263550'], 'Parse comma-separated string of lot numbers');
assertEquals(parseLots(['150225', 'LOT-A']), ['150225', 'LOT-A'], 'Pass-through native string array');
assertEquals(parseLots(null), [], 'Handle null lot numbers');
assertEquals(parseLots(''), [], 'Handle empty string lot numbers');

// -------------------------------------------------------------
// 5. Metadata Serialization & Parsing (parseLogDetails)
// -------------------------------------------------------------
console.log('\n💾 5. Metadata Serialization & Parsing (parseLogDetails):');

function parseLogDetails(detailsText: string) {
  let details = detailsText || '';
  let dispensedUnit: 'bottle' | 'unit' | null = null;
  let dispensedBottles = 0;
  let dispensedPillsPerBottle = 0;
  let lotNumbers: string[] = [];

  const splitIdx = details.indexOf(' | METADATA: ');
  if (splitIdx !== -1) {
    const metaStr = details.slice(splitIdx + ' | METADATA: '.length);
    details = details.slice(0, splitIdx);
    try {
      const meta = JSON.parse(metaStr);
      dispensedUnit = meta.dispensedUnit || null;
      dispensedBottles = meta.dispensedBottles || 0;
      dispensedPillsPerBottle = meta.dispensedPillsPerBottle || 0;
      lotNumbers = Array.isArray(meta.lotNumbers) ? meta.lotNumbers : [];
    } catch (e) {}
  }
  return { details, dispensedUnit, dispensedBottles, dispensedPillsPerBottle, lotNumbers };
}

const rawDetailsWithMeta = 'Dispensed 1 bottle (100 pills) | METADATA: {"dispensedUnit":"bottle","dispensedBottles":1,"dispensedPillsPerBottle":100,"lotNumbers":["49E2261"]}';
const parsed = parseLogDetails(rawDetailsWithMeta);

assertEquals(parsed.details, 'Dispensed 1 bottle (100 pills)', 'Extract clean details string without metadata suffix');
assertEquals(parsed.dispensedUnit, 'bottle', 'Extract dispensedUnit: bottle');
assertEquals(parsed.dispensedBottles, 1, 'Extract dispensedBottles: 1');
assertEquals(parsed.dispensedPillsPerBottle, 100, 'Extract dispensedPillsPerBottle: 100');
assertEquals(parsed.lotNumbers, ['49E2261'], 'Extract lotNumbers: ["49E2261"]');

// Plain details without metadata
const plainDetails = 'Routine clinic stock update';
const parsedPlain = parseLogDetails(plainDetails);
assertEquals(parsedPlain.details, 'Routine clinic stock update', 'Preserve plain details without metadata');
assertEquals(parsedPlain.dispensedUnit, null, 'dispensedUnit is null when no metadata present');

// -------------------------------------------------------------
// 6. Dispensary Audit Log Report (Netting & Filtering Logic)
// -------------------------------------------------------------
console.log('\n📊 6. Dispensary Audit Log Report (Netting & Filtering):');

// Scenario 6.1: Dispense 3 Clotrimazole creams, then Undispense 3 Clotrimazole creams -> Both removed
const dispReportTest1 = filterAndNetDispensaryLogs([
  { id: '1', itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: -3, actionType: 'DISPENSE', createdAt: '2026-09-01T10:00:00Z' },
  { id: '2', itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'UNDISPENSE', createdAt: '2026-09-01T10:05:00Z' },
] as any);
assertEquals(dispReportTest1.length, 0, 'Dispense 3 and Undispense 3 completely nets out and removes dispense from report');

// Scenario 6.2: Restock is preserved and never canceled by undispense
const dispReportTest2 = filterAndNetDispensaryLogs([
  { id: '1', itemGenericName: 'Metformin (500mg)', quantityChanged: -50, actionType: 'DISPENSE', createdAt: '2026-09-01T10:00:00Z' },
  { id: '2', itemGenericName: 'Metformin (500mg)', quantityChanged: 100, actionType: 'RESTOCK', createdAt: '2026-09-01T10:30:00Z' },
] as any);
assertEquals(dispReportTest2.length, 2, 'Restock and Dispense are both preserved in dispensary report');
assertEquals(dispReportTest2[0].actionType, 'RESTOCK', 'Newest log (Restock) appears first in reverse chronological order');
assertEquals(dispReportTest2[0].effectiveQty, 100, 'Restock effective quantity is 100');
assertEquals(dispReportTest2[1].actionType, 'DISPENSE', 'Dispense appears second');
assertEquals(dispReportTest2[1].effectiveQty, 50, 'Dispense effective quantity is 50');

// Scenario 6.3: Partial Undispense reduces dispense quantity
const dispReportTest3 = filterAndNetDispensaryLogs([
  { id: '1', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: -10, actionType: 'DISPENSE', createdAt: '2026-09-01T10:00:00Z' },
  { id: '2', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 4, actionType: 'UNDISPENSE', createdAt: '2026-09-01T10:15:00Z' },
] as any);
assertEquals(dispReportTest3.length, 1, 'Partial undispense leaves 1 dispense record');
assertEquals(dispReportTest3[0].effectiveQty, 6, 'Partial undispense reduced dispense effectiveQty from 10 to 6');

// Scenario 6.4: Reverse-chronological array input (newest first from DB)
const dispReportTest4 = filterAndNetDispensaryLogs([
  { id: '2', itemGenericName: 'Amlodipine (5mg)', quantityChanged: 1, actionType: 'UNDISPENSE', createdAt: '2026-09-01T11:05:00Z' },
  { id: '1', itemGenericName: 'Amlodipine (5mg)', quantityChanged: -1, actionType: 'DISPENSE', createdAt: '2026-09-01T11:00:00Z' },
] as any);
assertEquals(dispReportTest4.length, 0, 'Reverse chronological input correctly nets out and cancels the dispense');

// Scenario 6.5: Administrative logs (EDIT, AUDIT, CREATE, DELETE) are strictly excluded
const dispReportTest5 = filterAndNetDispensaryLogs([
  { id: '1', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: -500, actionType: 'AUDIT', details: '[EXPIRED WASTE DISPOSAL] Thrown away', createdAt: '2026-09-01T12:00:00Z' },
  { id: '2', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 10, actionType: 'EDIT', details: 'Manual edit', createdAt: '2026-09-01T12:05:00Z' },
  { id: '3', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 0, actionType: 'CREATE', details: 'Initial creation', createdAt: '2026-09-01T12:10:00Z' },
  { id: '4', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: 0, actionType: 'DELETE', details: 'Deleted item', createdAt: '2026-09-01T12:15:00Z' },
  { id: '5', itemGenericName: 'Ibuprofen (200mg)', quantityChanged: -20, actionType: 'DISPENSE', createdAt: '2026-09-01T12:20:00Z' },
] as any);
assertEquals(dispReportTest5.length, 1, 'Only DISPENSE is included; EDIT, AUDIT, CREATE, DELETE are excluded');
assertEquals(dispReportTest5[0].actionType, 'DISPENSE', 'Included log is DISPENSE');
assertEquals(dispReportTest5[0].effectiveQty, 20, 'Dispense effective quantity is 20');

// Scenario 6.6: Multi-medication sequence with subsequent dispenses
const dispReportTest6 = filterAndNetDispensaryLogs([
  { id: '1', itemId: 'med-1', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: -30, actionType: 'DISPENSE', createdAt: '2026-09-01T09:00:00Z' },
  { id: '2', itemId: 'med-2', itemGenericName: 'Ciprofloxacin (500mg)', quantityChanged: -14, actionType: 'DISPENSE', createdAt: '2026-09-01T09:10:00Z' },
  { id: '3', itemId: 'med-1', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 30, actionType: 'UNDISPENSE', createdAt: '2026-09-01T09:20:00Z' },
  { id: '4', itemId: 'med-1', itemGenericName: 'Amoxicillin (500mg)', quantityChanged: -15, actionType: 'DISPENSE', createdAt: '2026-09-01T09:30:00Z' },
  { id: '5', itemId: 'med-3', itemGenericName: 'Paracetamol (500mg)', quantityChanged: 100, actionType: 'RESTOCK', createdAt: '2026-09-01T09:40:00Z' },
] as any);
assertEquals(dispReportTest6.length, 3, 'Amoxicillin accidental 30-dispense removed; later 15-dispense, Cipro 14-dispense, and Paracetamol restock remain');
assertEquals(dispReportTest6.map(r => `${r.itemGenericName}: ${r.actionType} ${r.effectiveQty}`), [
  'Paracetamol (500mg): RESTOCK 100',
  'Amoxicillin (500mg): DISPENSE 15',
  'Ciprofloxacin (500mg): DISPENSE 14'
], 'Exact matching and reverse-chronological ordering confirmed');

// -------------------------------------------------------------
// 7. Stock Discard & Multi-Lot Expiration Tracking
// -------------------------------------------------------------
console.log('\n🗑️ 7. Stock Discard & Lot-Specific Expiration Tests:');

// Scenario 7.1: Multi-lot Drug (Advil) with 2 lots:
// Lot 4ME2261 (1 bottle, 100 pills, expired 2026-08-01)
// Lot 5AE2669 (5 bottles, 500 pills, valid until 2026-10-31)
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

const discardOneLotResult = applyStockDiscard(multiLotItem, {
  lotNumber: '4ME2261',
  bottlesToDiscard: 1,
});

assertEquals(discardOneLotResult.totalPillsDiscarded, 100, 'Discarding lot 4ME2261 discards exactly 100 pills');
assertEquals(discardOneLotResult.bottlesDiscarded, 1, 'Discarding lot 4ME2261 discards exactly 1 bottle');
assertEquals(discardOneLotResult.updatedItem.bottlesAvailable, 5, 'Remaining bottles is 5 (lot 5AE2669 preserved)');
assertEquals(discardOneLotResult.updatedItem.expirationDate, '2026-10-31', 'Expiration date rolled forward to earliest active remaining lot (2026-10-31)');
assertEquals(discardOneLotResult.isFullyEmptied, false, 'Item is not fully emptied');

// Scenario 7.2: Discard ALL stock (total waste)
const discardAllResult = applyStockDiscard(multiLotItem, {
  discardAll: true,
});
assertEquals(discardAllResult.totalPillsDiscarded, 600, 'Discard all discards all 600 pills');
assertEquals(discardAllResult.updatedItem.bottlesAvailable, 0, 'Bottles zeroed out');
assertEquals(discardAllResult.updatedItem.looseUnitsAvailable, 0, 'Loose units zeroed out');
assertEquals(discardAllResult.updatedItem.expirationDate, '', 'Expiration date cleared');
assertEquals(discardAllResult.updatedItem.lotNumbers, [], 'Lot numbers array emptied');
assertEquals(discardAllResult.isFullyEmptied, true, 'isFullyEmptied flag is true');
assertEquals(discardAllResult.updatedItem.genericName, 'Ibuprofen', 'Formulary card identity is preserved at 0 stock');

// -------------------------------------------------------------
// 8. Waste & Discard Reporting Normalization
// -------------------------------------------------------------
console.log('\n📋 8. Waste & Discard Log Normalization Tests:');

const rawDiscardTestLogs = [
  // 1. Pitavastatin discard
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
  // 2. Normal Patient Dispense (MUST BE EXCLUDED)
  {
    id: 'log-2',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISPENSE',
    quantityChanged: -30,
    createdAt: '2026-09-29T15:10:00Z',
    details: 'Dispensed 30 units to patient'
  },
  // 3. Normal Restock (MUST BE EXCLUDED)
  {
    id: 'log-3',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'RESTOCK',
    quantityChanged: 100,
    createdAt: '2026-09-29T15:20:00Z',
    details: 'Restocked 100 units'
  },
  // 4. Advil 1 bottle discard
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

const normalizedDiscards = filterDiscardLogs(rawDiscardTestLogs as any);
assertEquals(normalizedDiscards.length, 2, 'Only 2 discard records extracted (patient dispense and restock strictly excluded)');
assertEquals(normalizedDiscards[0].itemGenericName, 'Advil (200 mg Tablet)', 'Newest discard appears first');
assertEquals(normalizedDiscards[0].effectivePillsDiscarded, 100, 'Advil effective pills discarded is 100');
assertEquals(normalizedDiscards[0].effectiveBottlesDiscarded, 1, 'Advil effective bottles discarded is 1');
assertEquals(normalizedDiscards[0].discardLotNumber, '4ME2261', 'Advil discarded lot number extracted');
assertEquals(normalizedDiscards[1].itemGenericName, 'Pitavastatin Calcium (2 mg Tablet)', 'Pitavastatin appears second');
assertEquals(normalizedDiscards[1].effectivePillsDiscarded, 2160, 'Pitavastatin effective pills discarded is 2160');
assertEquals(normalizedDiscards[1].effectiveBottlesDiscarded, 24, 'Pitavastatin effective bottles discarded is 24');

// -------------------------------------------------------------
// 9. Inventory Edit Audit Trail Diff Tests
// -------------------------------------------------------------
console.log('\n📝 9. Inventory Edit Audit Trail Diff Tests:');

// Test 9.1: Single field change (e.g. shelfLocation changed from 'Shelf A' to 'Dental B')
const singleChangeDiff = generateItemEditDiff(
  { shelfLocation: 'Shelf A' },
  { shelfLocation: 'Dental B' }
);
assertEquals(
  singleChangeDiff.diffString,
  "Location: 'Shelf A' -> 'Dental B'",
  'Single field change generates exact Location before -> after diff'
);
assertEquals(
  singleChangeDiff.changes,
  [{ field: 'shelfLocation', label: 'Location', from: 'Shelf A', to: 'Dental B' }],
  'Single change parsed into structured change list'
);

// Test 9.2: Multiple field changes (location, dosage, pack size)
const multiChangeDiff = generateItemEditDiff(
  { shelfLocation: 'Shelf A', dosage: '10mg', pillsPerBottle: 100 },
  { shelfLocation: 'Dental B', dosage: '20mg', pillsPerBottle: 200 }
);
assertEquals(
  multiChangeDiff.diffString,
  "Location: 'Shelf A' -> 'Dental B', Dosage: '10mg' -> '20mg', Pack Size: '100' -> '200'",
  'Multiple field changes generate comma-separated diff string'
);
assertEquals(multiChangeDiff.changes.length, 3, 'Multiple field changes records 3 changes');

// Test 9.3: Null/empty to value change (brandName null/empty -> 'Advil')
const emptyToValDiff = generateItemEditDiff(
  { brandName: '' },
  { brandName: 'Advil' }
);
assertEquals(
  emptyToValDiff.diffString,
  "Brand Name: 'None' -> 'Advil'",
  'Empty to value change formats from as None'
);

// Test 9.4: No tracked changes returns empty diff summary
const noChangeDiff = generateItemEditDiff(
  { genericName: 'Amoxicillin', dosage: '500mg' },
  { genericName: 'Amoxicillin', dosage: '500mg' }
);
assertEquals(
  noChangeDiff.diffString,
  'Updated formulation details (no tracked field changes).',
  'No tracked changes returns standard no-changes string'
);
assertEquals(noChangeDiff.changes.length, 0, 'No changes returns empty changes array');

// Test 9.5: Round-trip diff string parsing via parseItemEditDiff
const parsedDiff = parseItemEditDiff("Location: 'Shelf A' -> 'Dental B', Dosage: '10mg' -> '20mg'");
assertEquals(parsedDiff.length, 2, 'parseItemEditDiff parses 2 field diff items from text');
assertEquals(parsedDiff[0], { field: 'location', label: 'Location', from: 'Shelf A', to: 'Dental B' }, 'First parsed diff entry is Location');
assertEquals(parsedDiff[1], { field: 'dosage', label: 'Dosage', from: '10mg', to: '20mg' }, 'Second parsed diff entry is Dosage');

// Test 9.6: Metadata array pass-through in parseItemEditDiff
const metaParsed = parseItemEditDiff('some details', [{ field: 'directions', label: 'Directions', from: 'Take 1 daily', to: 'Take 2 daily' }]);
assertEquals(metaParsed, [{ field: 'directions', label: 'Directions', from: 'Take 1 daily', to: 'Take 2 daily' }], 'parseItemEditDiff preserves structured metadata diff array');

// -------------------------------------------------------------
// 10. Discard Exclusion & Separation Verification Tests
// -------------------------------------------------------------
console.log('\n🚫 10. Discard Exclusion & Separation Verification Tests:');

// Test 10.1: Discards must be completely excluded from dispensary audit reports (filterAndNetDispensaryLogs)
const dispensaryMixedLogs = [
  {
    id: 'disp-1',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISPENSE',
    quantityChanged: -20,
    createdAt: '2026-09-30T10:00:00Z',
    details: 'Dispensed 20 capsules'
  },
  {
    id: 'disc-1',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISCARD',
    quantityChanged: -50,
    createdAt: '2026-09-30T11:00:00Z',
    details: '[EXPIRED / WASTE]: Discarded 50 expired capsules'
  },
  {
    id: 'disc-2',
    itemGenericName: 'Ibuprofen (200mg)',
    actionType: 'DISPENSE',
    quantityChanged: -30,
    createdAt: '2026-09-30T11:30:00Z',
    details: 'Damaged packaging disposal, thrown away into medical waste'
  },
  {
    id: 'restock-1',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'RESTOCK',
    quantityChanged: 100,
    createdAt: '2026-09-30T12:00:00Z',
    details: 'Restocked 100 capsules'
  }
];

const dispensaryFiltered = filterAndNetDispensaryLogs(dispensaryMixedLogs as any);
assertEquals(dispensaryFiltered.length, 2, 'Only 2 dispensary entries returned (both discards strictly excluded)');
assert(!dispensaryFiltered.some(l => (l.actionType || '').toUpperCase() === 'DISCARD'), 'No DISCARD actionType in dispensary report');
assert(!dispensaryFiltered.some(l => (l.details || '').toLowerCase().includes('thrown away')), 'No waste/thrown away records in dispensary report');
assertEquals(dispensaryFiltered[0].actionType, 'RESTOCK', 'Restock record preserved at index 0');
assertEquals(dispensaryFiltered[1].actionType, 'DISPENSE', 'Legitimate dispense preserved at index 1');

// Test 10.2: Discards must be excluded from aggregateTopDispensed
const topDispensedInput = [
  {
    itemGenericName: 'Paracetamol (500mg)',
    quantityChanged: -45,
    actionType: 'DISPENSE',
    details: 'Dispensed 45 tablets'
  },
  {
    itemGenericName: 'Doxycycline (100mg)',
    quantityChanged: -500,
    actionType: 'DISCARD',
    details: '[EXPIRED / WASTE]: Discarded 500 expired pills'
  },
  {
    itemGenericName: 'Ciprofloxacin (500mg)',
    quantityChanged: -120,
    actionType: 'DISPENSE',
    details: 'Disposal of contaminated lot, thrown away'
  }
];

const topDispensedOutput = aggregateTopDispensed(topDispensedInput as any);
assertEquals(topDispensedOutput.length, 1, 'Only legitimate dispenses included in top dispensed');
assertEquals(topDispensedOutput[0].genericName, 'Paracetamol (500mg)', 'Paracetamol is the only top dispensed item');
assertEquals(topDispensedOutput[0].totalDispensed, 45, 'Paracetamol total dispensed count is exactly 45');
assert(!topDispensedOutput.some(i => i.genericName.includes('Doxycycline')), 'Discarded Doxycycline completely absent from top dispensed');
assert(!topDispensedOutput.some(i => i.genericName.includes('Ciprofloxacin')), 'Wasted Ciprofloxacin completely absent from top dispensed');

// Test 10.3: Administrative EDIT updating expiration date must NOT be classified as discard in filterDiscardLogs
const editExpirationLogs = [
  {
    id: 'edit-1',
    itemGenericName: 'Metformin (500mg)',
    actionType: 'EDIT',
    quantityChanged: 0,
    createdAt: '2026-09-30T14:00:00Z',
    details: "Expiration Date: '2025-01-01' -> '2026-01-01', Location: 'Shelf A' -> 'Shelf B'"
  }
];

const discardFromEdit = filterDiscardLogs(editExpirationLogs as any);
assertEquals(discardFromEdit.length, 0, 'EDIT log modifying expiration date is NOT treated as a discard');

// Test 10.4: Undispense does NOT cancel or net out discard records
const undispenseVsDiscardLogs = [
  {
    itemGenericName: 'Azithromycin (250mg)',
    quantityChanged: -10,
    actionType: 'DISCARD',
    details: '[EXPIRED / WASTE]: Discarded 10 tablets'
  },
  {
    itemGenericName: 'Azithromycin (250mg)',
    quantityChanged: 10,
    actionType: 'UNDISPENSE',
    details: 'Undispensed 10 tablets'
  }
];

const dispensaryNetCheck = filterAndNetDispensaryLogs(undispenseVsDiscardLogs as any);
assertEquals(dispensaryNetCheck.length, 0, 'Dispensary report is empty because discard is excluded and orphaned undispense has no dispense to net');

const discardReportCheck = filterDiscardLogs(undispenseVsDiscardLogs as any);
assertEquals(discardReportCheck.length, 1, 'Discard report still contains the discard record (undispense cannot cancel discards)');
assertEquals(discardReportCheck[0].effectivePillsDiscarded, 10, 'Discard pills discarded remains 10');

// -------------------------------------------------------------
// 11. Hardened Inventory Edit Diff Generation & Delimiter Safety Tests
// -------------------------------------------------------------
console.log('\n📝 11. Hardened Inventory Edit Diff Generation & Delimiter Safety Tests:');

// Test 11.1: Chemical Name field diff tracking
const chemDiff = generateItemEditDiff(
  { chemicalName: 'Paracetamol' },
  { chemicalName: 'Acetaminophen' }
);
assertEquals(
  chemDiff.diffString,
  "Chemical Name: 'Paracetamol' -> 'Acetaminophen'",
  'Chemical Name change generates exact Chemical Name before -> after diff'
);
assertEquals(chemDiff.changes[0].field, 'chemicalName', 'Change field is chemicalName');

// Test 11.2: Apostrophe delimiter safety in field values
const apostropheDiff = generateItemEditDiff(
  { directions: "Patient's preference: 1 tab at bedtime" },
  { directions: "Doctor's orders: 2 tabs with food" }
);
assert(!apostropheDiff.diffString.includes("Patient's"), 'Raw single quote escaped to curly apostrophe in diff string');
const parsedApostrophe = parseItemEditDiff(apostropheDiff.diffString);
assertEquals(parsedApostrophe.length, 1, 'parseItemEditDiff parses diff with apostrophes cleanly without delimiter clipping');
assertEquals(parsedApostrophe[0].label, 'Directions', 'Parsed label is Directions');

// Test 11.3: Directions containing colons and arrows
const colonArrowDiff = parseItemEditDiff("Directions: 'Take at: 08:00 AM' -> 'Take at: 12:00 PM', Location: 'Shelf A' -> 'Shelf B'");
assertEquals(colonArrowDiff.length, 2, 'parseItemEditDiff successfully handles colons within quoted values');
assertEquals(colonArrowDiff[0].from, 'Take at: 08:00 AM', 'Parsed from value preserves colon');
assertEquals(colonArrowDiff[0].to, 'Take at: 12:00 PM', 'Parsed to value preserves colon');

// -------------------------------------------------------------
// 12. Robust Undispense Netting & Double-Counting Safeguards
// -------------------------------------------------------------
console.log('\n🛡️ 12. Robust Undispense Netting & Double-Counting Safeguards:');

// Test 12.1: Generic itemId ('unknown' or 'test-item') on distinct drugs must NEVER cross-cancel
const crossDrugGenericIdLogs = [
  {
    id: 'disp-1',
    itemId: 'unknown',
    itemGenericName: 'Ibuprofen (200mg)',
    actionType: 'DISPENSE',
    quantityChanged: -20,
    createdAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'undisp-1',
    itemId: 'unknown',
    itemGenericName: 'Paracetamol (500mg)',
    actionType: 'UNDISPENSE',
    quantityChanged: 20,
    createdAt: '2026-09-30T10:30:00Z',
  }
];
const genericIdReport = filterAndNetDispensaryLogs(crossDrugGenericIdLogs as any);
assertEquals(genericIdReport.length, 1, 'Generic unknown itemId does NOT cause cross-medication cancellation');
assertEquals(genericIdReport[0].itemGenericName, 'Ibuprofen (200mg)', 'Ibuprofen dispense preserved; Paracetamol undispense does not cross-net');

// Test 12.2: Overlapping medication prefixes must NOT cancel each other (e.g. Amoxicillin vs Amoxicillin / Clavulanate)
const overlappingPrefixLogs = [
  {
    id: 'disp-amox',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISPENSE',
    quantityChanged: -30,
    createdAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'undisp-clav',
    itemGenericName: 'Amoxicillin / Clavulanate (875mg)',
    actionType: 'UNDISPENSE',
    quantityChanged: 30,
    createdAt: '2026-09-30T10:30:00Z',
  }
];
const prefixReport = filterAndNetDispensaryLogs(overlappingPrefixLogs as any);
assertEquals(prefixReport.length, 1, 'Distinct combination drugs (Amoxicillin / Clavulanate) do NOT cancel plain Amoxicillin');
assertEquals(prefixReport[0].itemGenericName, 'Amoxicillin (500mg)', 'Amoxicillin dispense strictly preserved');

// Test 12.3: Same medication with dosage variations DOES correctly net out
const sameMedDosageVariationLogs = [
  {
    id: 'disp-amox-base',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISPENSE',
    quantityChanged: -20,
    createdAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'undisp-amox-nobase',
    itemGenericName: 'Amoxicillin',
    actionType: 'UNDISPENSE',
    quantityChanged: 20,
    createdAt: '2026-09-30T10:30:00Z',
  }
];
const sameMedReport = filterAndNetDispensaryLogs(sameMedDosageVariationLogs as any);
assertEquals(sameMedReport.length, 0, 'Same medication with and without dosage suffix cleanly nets out');

// Test 12.4: Case-insensitive Top Dispensed aggregation
const caseInsensitiveTopLogs = [
  { itemGenericName: 'Ibuprofen (200mg)', quantityChanged: -15, actionType: 'DISPENSE' },
  { itemGenericName: 'ibuprofen (200mg)', quantityChanged: -10, actionType: 'DISPENSE' },
  { itemGenericName: 'IBUPROFEN (200mg)', quantityChanged: 5, actionType: 'UNDISPENSE' }
];
const caseTopResult = aggregateTopDispensed(caseInsensitiveTopLogs as any);
assertEquals(caseTopResult.length, 1, 'Differently cased medication names aggregate into single item without double counting');
assertEquals(caseTopResult[0].totalDispensed, 20, 'Net dispensed correctly sums (15 + 10 - 5 = 20)');

// -------------------------------------------------------------
// 13. Developer Authorization & Discard Normalization Tests
// -------------------------------------------------------------
console.log('\n🔒 13. Developer Authorization & Discard Normalization Tests:');

// Test 13.1: Legacy expired waste dump with actionType AUDIT is captured in discard report
const legacyAuditWasteLogs = [
  {
    id: 'audit-waste-1',
    itemGenericName: 'Doxycycline Hyclate (100 mg Capsule)',
    actionType: 'AUDIT',
    quantityChanged: -100,
    createdAt: '2026-09-30T11:00:00Z',
    details: '[EXPIRED WASTE DISPOSAL]: Expired lot dumped out into medical destruction receptacle'
  },
  {
    id: 'audit-reconcile-1',
    itemGenericName: 'Metformin (500 mg Tablet)',
    actionType: 'AUDIT',
    quantityChanged: -5,
    createdAt: '2026-09-30T11:30:00Z',
    details: 'Physical count reconciliation: adjusted from 100 to 95 units (-5 units)'
  }
];
const legacyDiscards = filterDiscardLogs(legacyAuditWasteLogs as any);
assertEquals(legacyDiscards.length, 1, 'Only genuine expired waste audit log is in discard report; routine physical audit reconciliation excluded');
assertEquals(legacyDiscards[0].itemGenericName, 'Doxycycline Hyclate (100 mg Capsule)', 'Correct waste item captured');
assertEquals(legacyDiscards[0].effectivePillsDiscarded, 100, 'Effective pills discarded is 100');

// -------------------------------------------------------------
// 14. Advanced Inventory Edit & Cross-Netting Boundary Tests
// -------------------------------------------------------------
console.log('\n🔬 14. Advanced Inventory Edit & Cross-Netting Boundary Tests:');

// Test 14.1: Category fallback in generateItemEditDiff
const categoryDiff = generateItemEditDiff(
  { category: 'Dental' } as any,
  { category: 'Cardiology' } as any
);
assertEquals(
  categoryDiff.diffString,
  "Location: 'Dental' -> 'Cardiology'",
  'category property fallback generates exact Location diff'
);
assertEquals(categoryDiff.changes[0].field, 'shelfLocation', 'Change field is shelfLocation');

// Test 14.2: Distinct dosage strengths must NOT cancel each other in filterAndNetDispensaryLogs
const distinctDoseLogs = [
  {
    id: 'disp-amox-500',
    itemGenericName: 'Amoxicillin (500mg)',
    actionType: 'DISPENSE',
    quantityChanged: -30,
    createdAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'undisp-amox-250',
    itemGenericName: 'Amoxicillin (250mg)',
    actionType: 'UNDISPENSE',
    quantityChanged: 30,
    createdAt: '2026-09-30T10:30:00Z',
  }
];
const distinctDoseReport = filterAndNetDispensaryLogs(distinctDoseLogs as any);
assertEquals(distinctDoseReport.length, 1, 'Distinct dosage strengths (500mg vs 250mg) do NOT cancel each other');
assertEquals(distinctDoseReport[0].itemGenericName, 'Amoxicillin (500mg)', '500mg dispense strictly preserved');
assertEquals(distinctDoseReport[0].effectiveQty, 30, '500mg effectiveQty remains 30');

// Test 14.3: Matching itemId maps across name variations in aggregateTopDispensed
const itemIdAggregateLogs = [
  {
    itemId: 'item-unique-123',
    itemGenericName: 'Ibuprofen (200mg)',
    actionType: 'DISPENSE',
    quantityChanged: -50,
  },
  {
    itemId: 'item-unique-123',
    itemGenericName: 'Ibuprofen',
    actionType: 'UNDISPENSE',
    quantityChanged: 20,
  }
];
const itemAggResult = aggregateTopDispensed(itemIdAggregateLogs as any);
assertEquals(itemAggResult.length, 1, 'Same itemId aggregates into single Top Dispensed entry');
assertEquals(itemAggResult[0].totalDispensed, 30, 'Net dispensed correctly reflects undispense against same itemId (50 - 20 = 30)');

// Test 14.4: parseItemEditDiff parses Unicode arrow (➔) and ascii arrows identically
const unicodeArrowDiff = parseItemEditDiff("Location: 'Shelf A' ➔ 'Dental B', Pack Size: '100' --> '200'");
assertEquals(unicodeArrowDiff.length, 2, 'parseItemEditDiff parses Unicode and extended arrows cleanly');
assertEquals(unicodeArrowDiff[0].label, 'Location', 'First parsed change is Location');
assertEquals(unicodeArrowDiff[0].from, 'Shelf A', 'Parsed from value is Shelf A');
assertEquals(unicodeArrowDiff[0].to, 'Dental B', 'Parsed to value is Dental B');
assertEquals(unicodeArrowDiff[1].label, 'Pack Size', 'Second parsed change is Pack Size');
assertEquals(unicodeArrowDiff[1].from, '100', 'Parsed from value is 100');
assertEquals(unicodeArrowDiff[1].to, '200', 'Parsed to value is 200');

console.log('\n============================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
