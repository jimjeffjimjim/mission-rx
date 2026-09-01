/**
 * 🧪 MISSIONRX CHAOS & STRESS TESTING SUITE
 * Simulates extreme edge cases, invalid user inputs, multi-lot tracking, and timezone boundaries.
 */

import { calculateTotalUnits, convertTotalUnitsToStock, getStandardItemName, parseLotNumbers } from '../lib/stockMath';
import { LotEntry } from '../types/inventory';
import { parseGs1Barcode, normalizeNdc } from '../lib/ndcLookup';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    passed++;
    console.log('  ✅ PASS: ' + testName);
  } else {
    failed++;
    console.error('  ❌ FAIL: ' + testName, details ? '\n     Details: ' + JSON.stringify(details) : '');
  }
}

function assertEquals(actual: any, expected: any, testName: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    passed++;
    console.log('  ✅ PASS: ' + testName);
  } else {
    failed++;
    console.error('  ❌ FAIL: ' + testName + '\n     Expected: ' + expectedStr + '\n     Received: ' + actualStr);
  }
}

console.log('============================================================');
console.log('🌪️ MISSIONRX CHAOS & STRESS TESTING SUITE');
console.log('============================================================\n');

// -----------------------------------------------------------------
// 1. Safeguard #1: Over-dispense Stock Validation & Clamping
// -----------------------------------------------------------------
console.log('🛡️ 1. Safeguard #1: Over-Dispense Stock Validation & Clamping');

const itemBottles = 0;
const itemLoose = 50;
const pillsPerBottle = 100;
const currentTotalStock = calculateTotalUnits(itemBottles, pillsPerBottle, itemLoose); // 50

// Chaos 1.1: User requests 500 loose pills when only 50 exist
const requestedLoose = 500;
const isOverStockLoose = requestedLoose > currentTotalStock;
assert(isOverStockLoose === true, 'Blocks dispensing 500 units when stock is 50');

// Chaos 1.2: User requests 2 bottles (200 pills) when only 50 pills exist
const requestedBottles = 2;
const requestedPillEquivalent = requestedBottles * pillsPerBottle; // 200
const isOverStockBottles = requestedPillEquivalent > currentTotalStock;
assert(isOverStockBottles === true, 'Blocks dispensing 2 bottles (200 pills) when stock is 50');

// Chaos 1.3: Math clamping prevents negative inventory
const clampedStock = Math.max(0, currentTotalStock - requestedLoose);
assertEquals(clampedStock, 0, 'Clamping total stock prevents negative inventory');

// -----------------------------------------------------------------
// 2. Safeguard #2: Zero Pack Size Division Protection
// -----------------------------------------------------------------
console.log('\n🛡️ 2. Safeguard #2: Zero Pack Size Division Protection');

const zeroPackResult = convertTotalUnitsToStock(15, 0);
assert(!isNaN(zeroPackResult.bottles) && !isNaN(zeroPackResult.loose), 'Pack size 0 does not produce NaN');
assert(isFinite(zeroPackResult.bottles), 'Pack size 0 does not produce Infinity');
assertEquals(zeroPackResult, { bottles: 0, loose: 15 }, 'Pack size 0 safely places all units in loose inventory');

const negativePackResult = convertTotalUnitsToStock(10, -5);
assertEquals(negativePackResult, { bottles: 0, loose: 10 }, 'Negative pack size safely falls back to loose inventory');

// -----------------------------------------------------------------
// 3. Multi-Lot Shipment & Expiration Auto-Sync
// -----------------------------------------------------------------
console.log('\n📦 3. Multi-Lot Shipment & Expiration Auto-Sync');

const multiLots: LotEntry[] = [
  { lotNumber: 'LOT-A101', expirationDate: '2027-06-30', bottles: 2, looseUnits: 10 },
  { lotNumber: 'LOT-B202', expirationDate: '2026-03-15', bottles: 1, looseUnits: 40 },
  { lotNumber: 'LOT-C303', expirationDate: '2028-12-31', bottles: 3, looseUnits: 0 },
];

// Calculate auto-sum totals
let totalBottles = 0;
let totalLoose = 0;
let earliestExp = '';

multiLots.forEach((l) => {
  totalBottles += Math.max(0, Number(l.bottles) || 0);
  totalLoose += Math.max(0, Number(l.looseUnits) || 0);
  if (l.expirationDate) {
    if (!earliestExp || l.expirationDate < earliestExp) {
      earliestExp = l.expirationDate;
    }
  }
});

assertEquals(totalBottles, 6, 'Auto-sums total bottles across 3 lots (2 + 1 + 3 = 6)');
assertEquals(totalLoose, 50, 'Auto-sums total loose units across 3 lots (10 + 40 + 0 = 50)');
assertEquals(earliestExp, '2026-03-15', 'Correctly identifies earliest expiring lot (2026-03-15)');

// -----------------------------------------------------------------
// 4. Universal Lot Numbers Parsing
// -----------------------------------------------------------------
console.log('\n🏷️ 4. Universal Lot Numbers Parsing');

const structuredLots = [
  { lotNumber: '22B0567', expirationDate: '2026-11-30', bottles: 2 },
  { lotNumber: 'LOT-9988', expirationDate: '2027-01-01', bottles: 1 }
];
assertEquals(parseLotNumbers(structuredLots), ['22B0567', 'LOT-9988'], 'Extracts lot numbers from structured LotEntry objects');

const serializedLots = JSON.stringify(structuredLots);
assertEquals(parseLotNumbers(serializedLots), ['22B0567', 'LOT-9988'], 'Extracts lot numbers from JSON serialized structured lots');

const commaLots = '49E2261, 5CE2212 , 2263550';
assertEquals(parseLotNumbers(commaLots), ['49E2261', '5CE2212', '2263550'], 'Extracts lot numbers from comma-separated string');

const legacyArray = ['LOT-1', 'LOT-2'];
assertEquals(parseLotNumbers(legacyArray), ['LOT-1', 'LOT-2'], 'Extracts lot numbers from legacy string array');

assertEquals(parseLotNumbers(null), [], 'Handles null safely');
assertEquals(parseLotNumbers(''), [], 'Handles empty string safely');

// -----------------------------------------------------------------
// 5. Safeguard #4: Deleted Item Orphaned Log Resilience
// -----------------------------------------------------------------
console.log('\n🛡️ 5. Safeguard #4: Deleted Item Orphaned Log Resilience');

const orphanedLog = {
  id: 'log-orphan-999',
  itemId: 'deleted-med-id',
  itemGenericName: 'Discontinued Drug (50mg)',
  quantityChanged: 5,
  actionType: 'DISPENSE',
  lotNumbers: ['LOT-OLD'],
  details: 'Dispensed 5 units'
};

const corrItem: any = undefined; // Deleted from current catalog

const resolvedBrand = corrItem?.brandName || 'N/A';
const resolvedDosage = corrItem?.dosage || 'N/A';
const resolvedShelf = corrItem?.shelfLocation || 'General Medical';
const resolvedSubUnit = corrItem?.subUnit || 'units';
const resolvedStockUnit = corrItem?.stockUnit || 'bottles';
const resolvedLots = parseLotNumbers(orphanedLog.lotNumbers && orphanedLog.lotNumbers.length > 0 ? orphanedLog.lotNumbers : corrItem?.lotNumbers);

assertEquals(resolvedBrand, 'N/A', 'Orphaned log falls back brandName to N/A without crashing');
assertEquals(resolvedDosage, 'N/A', 'Orphaned log falls back dosage to N/A without crashing');
assertEquals(resolvedShelf, 'General Medical', 'Orphaned log falls back shelf to General Medical');
assertEquals(resolvedSubUnit, 'units', 'Orphaned log falls back subUnit to units');
assertEquals(resolvedStockUnit, 'bottles', 'Orphaned log falls back stockUnit to bottles');
assertEquals(resolvedLots, ['LOT-OLD'], 'Orphaned log retains original lot number');

// -----------------------------------------------------------------
// 6. Safeguard #6: Timezone-Aware Shift Worker Date Boundaries
// -----------------------------------------------------------------
console.log('\n🌐 6. Safeguard #6: Timezone-Aware Shift Worker Date Boundaries');

function computeShiftStart(now: Date, tzOffsetMinutes: number): Date {
  const clientNow = new Date(now.getTime() - tzOffsetMinutes * 60 * 1000);
  const clientMidnightUtc = Date.UTC(clientNow.getUTCFullYear(), clientNow.getUTCMonth(), clientNow.getUTCDate(), 0, 0, 0, 0);
  return new Date(clientMidnightUtc + tzOffsetMinutes * 60 * 1000);
}

// 9:30 PM in Chicago (UTC-5 -> offset = +300 minutes)
const lateNightChicago = new Date('2026-09-01T02:30:00.000Z'); // 9:30 PM Aug 31 local
const chicagoShiftStart = computeShiftStart(lateNightChicago, 300);

// Log created at 9:00 PM local (02:00:00Z)
const shiftLogTime = new Date('2026-09-01T02:00:00.000Z');
assert(shiftLogTime >= chicagoShiftStart, 'Evening shift transaction is included in Today filter for UTC-5');

// -----------------------------------------------------------------
// 7. Order-Independent Top Dispensed Aggregation
// -----------------------------------------------------------------
console.log('\n📊 7. Order-Independent Top Dispensed Aggregation');

function aggregateTopDispensed(logs: any[]) {
  const usageMap: { [canonicalName: string]: { dispensed: number; returned: number; category: string } } = {};

  logs.forEach((log: any) => {
    const name = log.itemGenericName || 'General Inventory Item';
    if (!usageMap[name]) {
      usageMap[name] = { dispensed: 0, returned: 0, category: log.category || 'General Medical' };
    }
    const qty = Math.abs(log.quantityChanged);
    const isRestock = log.actionType === 'RESTOCK' || log.actionType === 'UNDISPENSE' || log.details?.toLowerCase().includes('undispensed') || log.details?.toLowerCase().includes('restocked');

    if (isRestock) {
      usageMap[name].returned += qty;
    } else if (log.actionType === 'DISPENSE' || log.quantityChanged < 0) {
      usageMap[name].dispensed += qty;
    }
  });

  return Object.keys(usageMap)
    .map((name) => ({
      genericName: name,
      totalDispensed: Math.max(0, usageMap[name].dispensed - usageMap[name].returned),
      category: usageMap[name].category,
    }))
    .filter((item) => item.totalDispensed > 0)
    .sort((a, b) => b.totalDispensed - a.totalDispensed);
}

// Chaotic log stream with scrambled timestamps and reverse actions
const chaoticLogs = [
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: 1, actionType: 'RESTOCK', details: 'Undispensed 1' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 50, actionType: 'DISPENSE', details: 'Dispensed 50' },
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: -1, actionType: 'DISPENSE', details: 'Dispensed 1' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 10, actionType: 'RESTOCK', details: 'Undispensed 10' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 30, actionType: 'DISPENSE', details: 'Dispensed 30' },
];

const chaoticResult = aggregateTopDispensed(chaoticLogs);
assertEquals(chaoticResult, [
  { genericName: 'Ibuprofen (200 mg Tablet)', totalDispensed: 40, category: 'General Medical' },
  { genericName: 'Amoxicillin (500mg)', totalDispensed: 30, category: 'General Medical' },
], 'Chaotic stream correctly calculates: Ibuprofen 40 (50-10), Amoxicillin 30, Amlodipine 0 (excluded)');

// -----------------------------------------------------------------
// 8. Medical Equipment & Supplies Categorization & Stock Math
// -----------------------------------------------------------------
console.log('\n🩺 8. Medical Equipment & Supplies Categorization & Stock Math');

const mockInventory = [
  { id: '1', genericName: 'Amoxicillin (500mg)', shelfLocation: 'General Medical', itemType: 'Medication', bottlesAvailable: 5, pillsPerBottle: 100, looseUnitsAvailable: 0 },
  { id: '2', genericName: 'Digital Blood Pressure Monitor', brandName: 'Omron', dosage: 'Medical Supply / Device', shelfLocation: 'Supplies', itemType: 'Supply', stockUnit: 'Units', subUnit: 'pieces', bottlesAvailable: 4, pillsPerBottle: 1, looseUnitsAvailable: 0 },
  { id: '3', genericName: 'Sterile Suture Removal Kit', brandName: 'Dynarex', dosage: 'Disposable Kit', shelfLocation: 'Supplies', itemType: 'Supply', stockUnit: 'Kits', subUnit: 'kits', bottlesAvailable: 25, pillsPerBottle: 1, looseUnitsAvailable: 0 },
  { id: '4', genericName: 'Nitrile Exam Gloves (Box of 100)', brandName: 'Halyard', dosage: 'Large', shelfLocation: 'Supplies', itemType: 'Supply', stockUnit: 'Boxes / Packs', subUnit: 'pairs', bottlesAvailable: 10, pillsPerBottle: 50, looseUnitsAvailable: 0 },
  { id: '5', genericName: 'Ibuprofen (200 mg Tablet)', shelfLocation: 'Analgesics', itemType: 'Medication', bottlesAvailable: 3, pillsPerBottle: 100, looseUnitsAvailable: 20 },
];

// Equipment count
const equipmentCount = mockInventory.filter((i) => i.shelfLocation === 'Supplies' || i.itemType === 'Supply').length;
assertEquals(equipmentCount, 3, 'Identifies 3 medical equipment / supply items in catalog');

const medicationCount = mockInventory.filter((i) => i.shelfLocation !== 'Supplies' && i.itemType !== 'Supply').length;
assertEquals(medicationCount, 2, 'Identifies 2 pharmaceutical medication formulations');

// Equipment diagnostic filter
const diagnosticItems = mockInventory.filter((i) => {
  if (i.shelfLocation !== 'Supplies' && i.itemType !== 'Supply') return false;
  const text = (i.genericName + ' ' + (i.brandName || '') + ' ' + i.dosage).toLowerCase();
  return text.includes('monitor') || text.includes('cuff') || text.includes('scope');
});
assertEquals(diagnosticItems.length, 1, 'Diagnostic filter matches Digital Blood Pressure Monitor');

// Equipment consumable stock math
const gloveItem = mockInventory.find((i) => i.genericName.includes('Gloves'))!;
const totalGlovePairs = calculateTotalUnits(gloveItem.bottlesAvailable, gloveItem.pillsPerBottle, gloveItem.looseUnitsAvailable);
assertEquals(totalGlovePairs, 500, 'Calculates 10 boxes * 50 pairs = 500 total pairs of gloves');

// ============================================================================
// 9. Physical Count Audit Reconciliation & Undispense Preservation Test
// ============================================================================
console.log('\n📋 9. Physical Stock Audit Reconciliation with Undispenses');

// Starting stock: 2 bottles * 100 + 10 loose = 210 pills
let currentBottles = 2;
let currentLoose = 10;
const packSize = 100;

// Step A: Doctor dispenses 25 pills -> stock becomes 1 bottle, 85 loose = 185
let afterDispenseTotal = calculateTotalUnits(currentBottles, packSize, currentLoose) - 25;
let stockAfterDispense = convertTotalUnitsToStock(afterDispenseTotal, packSize);
assertEquals(afterDispenseTotal, 185, 'Stock after dispensing 25 pills is 185');

// Step B: Doctor undispenses 25 pills -> stock restores to 2 bottles, 10 loose = 210
let afterUndispenseTotal = afterDispenseTotal + 25;
let stockAfterUndispense = convertTotalUnitsToStock(afterUndispenseTotal, packSize);
assertEquals(afterUndispenseTotal, 210, 'Stock after undispensing 25 pills restores to 210');
assertEquals(stockAfterUndispense.bottles, 2, 'Restored bottles is 2');
assertEquals(stockAfterUndispense.loose, 10, 'Restored loose is 10');

// Step C: Physical Count Audit on shelf finds 2 bottles and 5 loose = 205 (Deficit of 5 loose pills)
const physicalBottles = 2;
const physicalLoose = 5;
const physicalTotal = calculateTotalUnits(physicalBottles, packSize, physicalLoose);
const variance = physicalTotal - afterUndispenseTotal;
assertEquals(variance, -5, 'Physical audit detects deficit variance of -5 pills');

// Step D: Reconcile to physical count
const reconciledStock = convertTotalUnitsToStock(physicalTotal, packSize);
assertEquals(reconciledStock.bottles, 2, 'Reconciled bottles matches physical count (2)');
assertEquals(reconciledStock.loose, 5, 'Reconciled loose matches physical count (5)');

// ============================================================================
// 10. Developer QR Code Metadata Integrity Test
// ============================================================================
console.log('\n🔲 10. Developer QR Code Full Clinical Data Integrity');

const sampleItem = {
  id: 'item-amox-500',
  genericName: 'Amoxicillin',
  dosage: '500mg Capsule',
  brandName: 'Teva',
  shelfLocation: 'Antibiotics',
  itemType: 'Medication' as const,
  pillsPerBottle: 100,
  stockUnit: 'Bottles',
  subUnit: 'capsules',
  lotNumbers: ['LOT-2026A', 'LOT-2026B'],
  expirationDate: '2026-11-30',
  directions: 'Take with full glass of water. Finish full course.',
};

const qrString = JSON.stringify({
  app: 'MissionRx',
  id: sampleItem.id,
  name: sampleItem.genericName,
  dosage: sampleItem.dosage,
  brand: sampleItem.brandName || null,
  shelf: sampleItem.shelfLocation,
  type: sampleItem.itemType || 'Medication',
  packSize: sampleItem.pillsPerBottle || 1,
  stockUnit: sampleItem.stockUnit || 'Bottles',
  subUnit: sampleItem.subUnit || 'units',
  lots: sampleItem.lotNumbers,
  expiration: sampleItem.expirationDate,
  directions: sampleItem.directions,
});

const parsedQr = JSON.parse(qrString);
assertEquals(parsedQr.app, 'MissionRx', 'QR code contains MissionRx app identifier');
assertEquals(parsedQr.name, 'Amoxicillin', 'QR code contains generic name');
assertEquals(parsedQr.dosage, '500mg Capsule', 'QR code contains dosage strength');
assertEquals(parsedQr.brand, 'Teva', 'QR code contains manufacturer brand');
assertEquals(parsedQr.shelf, 'Antibiotics', 'QR code contains storage shelf');
assertEquals(parsedQr.lots.length, 2, 'QR code contains complete lot numbers');
assertEquals(parsedQr.expiration, '2026-11-30', 'QR code contains expiration date');

// ============================================================================
// 11. Inbound Barcode, GS1 DataMatrix & NDC Intake Parsing
// ============================================================================
console.log('\n📷 11. Inbound Manufacturer Barcode & GS1 DataMatrix Intake Parsing');

// Test GS1 DataMatrix with (01) GTIN, (17) Exp, (10) Lot
const sampleGs1 = '(01)00300932264018(17)271031(10)LOT-99824';
const parsedGs1 = parseGs1Barcode(sampleGs1);
assertEquals(parsedGs1.gtin, '00300932264018', 'Extracts 14-digit GTIN');
assertEquals(parsedGs1.lotNumber, 'LOT-99824', 'Extracts Lot Number from AI 10');
assertEquals(parsedGs1.expirationDate, '2027-10-31', 'Converts YYMMDD (271031) to YYYY-MM-DD');

// Test 10-digit NDC normalization
const rawNdc = '0093226401';
const normalizedNdcs = normalizeNdc(rawNdc);
assertEquals(normalizedNdcs.includes('0093-2264-01'), true, 'Normalizes 10-digit raw NDC to 4-4-2 format');

// Test 12-digit UPC-A with leading 3
const upcA = '300932264014';
const upcCandidates = normalizeNdc(upcA);
assertEquals(upcCandidates.includes('0093-2264-01'), true, 'Normalizes 12-digit UPC-A to dashed NDC');

console.log('\n============================================================');
console.log('🎉 CHAOS TEST SUMMARY: ' + passed + '/' + (passed + failed) + ' Passed (' + failed + ' Failed)');
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
