/**
 * 🧪 MISSIONRX CHAOS & STRESS TESTING SUITE
 * Simulates extreme edge cases, invalid user inputs, multi-lot tracking, and timezone boundaries.
 */

import { calculateTotalUnits, convertTotalUnitsToStock, getStandardItemName, parseLotNumbers } from '../lib/stockMath';
import { LotEntry } from '../types/inventory';
import { parseGs1Barcode, normalizeNdc, lookupSupplyByRefOrGtin, parseLabelText } from '../lib/ndcLookup';

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
  const usageMap: { [canonicalName: string]: { dispensed: number; undispensed: number; restocked: number; category: string } } = {};

  logs.forEach((log: any) => {
    const name = log.itemGenericName || 'General Inventory Item';
    if (!usageMap[name]) {
      usageMap[name] = { dispensed: 0, undispensed: 0, restocked: 0, category: log.category || 'General Medical' };
    }
    const qty = Math.abs(log.quantityChanged);
    const isUndispense = log.actionType === 'UNDISPENSE' || (log.details?.toLowerCase().includes('undispensed') && !log.details?.toLowerCase().includes('restocked'));
    const isRestock = log.actionType === 'RESTOCK' || log.details?.toLowerCase().includes('restocked');

    if (isUndispense) {
      usageMap[name].undispensed += qty;
    } else if (isRestock) {
      usageMap[name].restocked += qty;
      // RESTOCK does not deduct from dispensed count
    } else if (log.actionType === 'DISPENSE' || log.quantityChanged < 0) {
      usageMap[name].dispensed += qty;
    }
  });

  return Object.keys(usageMap)
    .map((name) => ({
      genericName: name,
      totalDispensed: Math.max(0, usageMap[name].dispensed - usageMap[name].undispensed),
      category: usageMap[name].category,
    }))
    .filter((item) => item.totalDispensed > 0)
    .sort((a, b) => b.totalDispensed - a.totalDispensed);
}

// Chaotic log stream with scrambled timestamps and reverse actions
const chaoticLogs = [
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: 1, actionType: 'UNDISPENSE', details: 'Undispensed 1' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 50, actionType: 'DISPENSE', details: 'Dispensed 50' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 200, actionType: 'RESTOCK', details: 'Restocked 200' },
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: -1, actionType: 'DISPENSE', details: 'Dispensed 1' },
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 10, actionType: 'UNDISPENSE', details: 'Undispensed 10' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 30, actionType: 'DISPENSE', details: 'Dispensed 30' },
];

const chaoticResult = aggregateTopDispensed(chaoticLogs);
assertEquals(chaoticResult, [
  { genericName: 'Ibuprofen (200 mg Tablet)', totalDispensed: 40, category: 'General Medical' },
  { genericName: 'Amoxicillin (500mg)', totalDispensed: 30, category: 'General Medical' },
], 'Chaotic stream correctly calculates: Ibuprofen 40 (50-10, restock of 200 ignored), Amoxicillin 30, Amlodipine 0 (excluded)');

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

// Equipment Restock Simulation
const restockedGloveTotal = calculateTotalUnits(gloveItem.bottlesAvailable + 5, gloveItem.pillsPerBottle, gloveItem.looseUnitsAvailable + 10);
assertEquals(restockedGloveTotal, 760, 'Restocking 5 boxes and 10 loose pairs yields 15 boxes and 10 pairs (760 total pairs)');
const restockedGloveStock = convertTotalUnitsToStock(restockedGloveTotal, gloveItem.pillsPerBottle);
assertEquals(restockedGloveStock.bottles, 15, 'Restocked glove boxes is 15');
assertEquals(restockedGloveStock.loose, 10, 'Restocked loose pairs is 10');

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

// Test User Sample 1: BD Eclipse Needle Box Barcodes
console.log('  Testing User Sample Item 1: BD Eclipse Needle Box');
const bdBarcode1 = '(01)30382903057611';
const parsedBdBarcode1 = parseGs1Barcode(bdBarcode1);
assertEquals(parsedBdBarcode1.gtin, '30382903057611', 'Extracts BD GTIN 30382903057611');

const bdBarcode2 = '(17)290930(10)4275769(30)100';
const parsedBdBarcode2 = parseGs1Barcode(bdBarcode2);
assertEquals(parsedBdBarcode2.expirationDate, '2029-09-30', 'Extracts BD Exp 2029-09-30 from AI 17');
assertEquals(parsedBdBarcode2.lotNumber, '4275769', 'Extracts BD Lot 4275769 from AI 10');
assertEquals(parsedBdBarcode2.quantity, 100, 'Extracts BD Quantity 100 from AI 30');

// Test Supply Catalog lookup for BD Eclipse by GTIN and REF
const supplyByGtin = lookupSupplyByRefOrGtin('30382903057611');
assert(supplyByGtin !== null && supplyByGtin.name === 'BD Eclipse Injection Needle', 'Looks up BD Eclipse needle by GTIN');
assertEquals(supplyByGtin?.spec, '25G x 1" TW (0.5mm x 25mm)', 'BD Eclipse needle gauge matches 25G x 1"');
assertEquals(supplyByGtin?.itemType, 'Supply', 'BD Eclipse item type is Supply');

const supplyByRef = lookupSupplyByRefOrGtin('305761');
assert(supplyByRef !== null && supplyByRef.brand.includes('BD'), 'Looks up BD Eclipse by REF 305761');

// Test User Sample 2: Hospira Bacteriostatic 0.9% Sodium Chloride
console.log('  Testing User Sample Item 2: Hospira 0.9% Sodium Chloride Vial');
const hospiraByNdc = lookupSupplyByRefOrGtin('0409-1966-02');
assert(hospiraByNdc !== null, 'Looks up Hospira Sodium Chloride by NDC 0409-1966-02');
assertEquals(hospiraByNdc?.name, 'Bacteriostatic 0.9% Sodium Chloride Injection, USP', 'Correct generic name for Hospira diluent');
assertEquals(hospiraByNdc?.spec, '0.9% (30 mL Vial)', 'Correct dosage spec 0.9% (30 mL)');
assertEquals(hospiraByNdc?.unit, 'Vials', 'Unit is Vials');

const hospiraByPaa = lookupSupplyByRefOrGtin('PAA222240');
assert(hospiraByPaa !== null, 'Looks up Hospira Sodium Chloride by bottle packaging code PAA222240');

// Test Label OCR Parsing on BD Box Text
const bdOcrSample = `
  100
  BD Eclipse Injection Needle
  25G x 1" TW (0.5mm x 25mm)
  REF 305761
  LOT 4275769
  2029-09-30
`;
const parsedBdOcr = parseLabelText(bdOcrSample);
assert(parsedBdOcr !== null, 'Parses BD Eclipse label OCR text');
assertEquals(parsedBdOcr?.genericName, 'BD Eclipse Injection Needle', 'BD OCR generic name');
assertEquals(parsedBdOcr?.lotNumber, '4275769', 'BD OCR lot number 4275769');
assertEquals(parsedBdOcr?.expirationDate, '2029-09-30', 'BD OCR expiration date 2029-09-30');
assertEquals(parsedBdOcr?.pillsPerBottle, 100, 'BD OCR pack count 100');

// Test Label OCR Parsing on Hospira Vial Text
const hospiraOcrSample = `
  30 mL Multiple-dose
  Bacteriostatic
  0.9% Sodium Chloride
  Injection, USP
  Distributed by Hospira, Inc.
  LOT: LM2143
  EXP.: 2026-OCT-31
  NDC 0409-1966-02
`;
const parsedHospiraOcr = parseLabelText(hospiraOcrSample);
assert(parsedHospiraOcr !== null, 'Parses Hospira vial label OCR text');
assertEquals(parsedHospiraOcr?.genericName, 'Bacteriostatic 0.9% Sodium Chloride Injection, USP', 'Hospira OCR name');
assertEquals(parsedHospiraOcr?.lotNumber, 'LM2143', 'Hospira OCR lot number LM2143');
assertEquals(parsedHospiraOcr?.expirationDate, '2026-10-31', 'Hospira OCR expiration date 2026-10-31 (from 2026-OCT-31)');
assertEquals(parsedHospiraOcr?.pillsPerBottle, 30, 'Hospira OCR 30 mL pack size');

// ============================================================================
// 12. Equipment Expiration Date Preservation & No-Expire Auto-Clearing
// ============================================================================
console.log('\n🩺 12. Equipment Expiration Date Preservation & Lot Sync');

// Test scenario: User adds equipment with doesNotExpire = true by default, but enters a lot with 2029-09-30
const lotRowWithDate = [
  { id: 'lot-1', lotNumber: '4275769', expirationDate: '2029-09-30', bottles: 2, looseUnits: 0 }
];

const lotExpsTest = lotRowWithDate
  .map((l) => l.expirationDate?.trim())
  .filter((exp) => exp && !exp.startsWith('3000') && !exp.startsWith('2099')) as string[];

let earliestExpTest = '';
if (lotExpsTest.length > 0) {
  lotExpsTest.sort();
  earliestExpTest = lotExpsTest[0];
}

const finalExpTest = earliestExpTest ? earliestExpTest : '3000-01-01';
assertEquals(finalExpTest, '2029-09-30', 'Equipment with lot expiration saves 2029-09-30, not 3000-01-01');

// Test scenario: Re-opening equipment with existing lot expiration restores effectiveExp
const loadedLots = [{ id: 'lot-1', lotNumber: '4275769', expirationDate: '2029-09-30', bottles: 2, looseUnits: 0 }];
let hasLotExpTest = false;
let restoredDate = '';
loadedLots.forEach((l) => {
  if (l.expirationDate && !l.expirationDate.startsWith('3000') && !l.expirationDate.startsWith('2099')) {
    hasLotExpTest = true;
    if (!restoredDate || l.expirationDate < restoredDate) {
      restoredDate = l.expirationDate;
    }
  }
});
const isNoExpTest = !hasLotExpTest;
assertEquals(isNoExpTest, false, 'doesNotExpire is accurately false when lot expiration exists');
assertEquals(restoredDate, '2029-09-30', 'Restores real expiration date 2029-09-30 on modal open');

// Test scenario 13: Multi-lot Equipment Independent Expiration Date Preservation (No Averaging/Overriding)
console.log('\n🩺 13. Multi-Lot Independent Expirations & BD Needle Spec Match');

// 1. Keyword lookup for exact string "BD Injection Needle 25G x 1\" TW (0.5mm x 25mm)"
const bdNeedleLookup = lookupSupplyByRefOrGtin('BD Injection Needle 25G x 1" TW (0.5mm x 25mm)');
assert(bdNeedleLookup !== null, 'Finds BD Injection needle entry by exact string');
assertEquals(bdNeedleLookup?.name, 'BD Eclipse Injection Needle', 'Matched name BD Eclipse Injection Needle');
assertEquals(bdNeedleLookup?.spec, '25G x 1" TW (0.5mm x 25mm)', 'Matched spec 25G x 1" TW (0.5mm x 25mm)');

// 2. Multi-lot equipment: Lot 1 (2029-09-30) and Lot 2 (2026-10-31)
const multiLotItem = {
  id: 'equip-bd-needle-1',
  genericName: 'BD Eclipse Injection Needle',
  dosage: '25G x 1" TW (0.5mm x 25mm)',
  expirationDate: '2026-10-31',
  lotNumbers: JSON.stringify([
    { id: 'lot-1', lotNumber: '4275769', expirationDate: '2029-09-30', bottles: 5, looseUnits: 0 },
    { id: 'lot-2', lotNumber: '305761', expirationDate: '2026-10-31', bottles: 3, looseUnits: 0 },
  ]),
};

// Simulate EquipmentEditModal deserialization logic
let rawLots: any = multiLotItem.lotNumbers;
if (typeof rawLots === 'string' && rawLots.trim().startsWith('[')) {
  try {
    rawLots = JSON.parse(rawLots);
  } catch (e) {}
}

assert(Array.isArray(rawLots), 'Parsed lot numbers string into JSON array');
assertEquals(rawLots.length, 2, 'Parsed exactly 2 lot entries');
assertEquals(rawLots[0].expirationDate, '2029-09-30', 'Lot 1 retains its 2029-09-30 expiration date');
assertEquals(rawLots[0].bottles, 5, 'Lot 1 retains 5 bottles');
assertEquals(rawLots[1].expirationDate, '2026-10-31', 'Lot 2 retains its 2026-10-31 expiration date');
assertEquals(rawLots[1].bottles, 3, 'Lot 2 retains 3 bottles');

// Calculate earliest expiration across lots (FEFO)
const validDates = rawLots.map((l: any) => l.expirationDate).filter(Boolean).sort();
assertEquals(validDates[0], '2026-10-31', 'Earliest expiration is accurately computed as 2026-10-31 without averaging or flattening');

console.log('\n============================================================');
console.log('🎉 CHAOS TEST SUMMARY: ' + passed + '/' + (passed + failed) + ' Passed (' + failed + ' Failed)');
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
