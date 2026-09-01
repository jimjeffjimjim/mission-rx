import { calculateTotalUnits, convertTotalUnitsToStock, getStandardItemName } from '../lib/stockMath';

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

// Scenario 3.1: Dispense 3 Clotrimazole creams, then Undispense 3 Clotrimazole creams
const clotrimazoleLogs = [
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'DISPENSE', details: 'Dispensed 3 units' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'RESTOCK', details: 'Undispensed / Restocked 3 units back into inventory.' },
];
const clotrimazoleResult = aggregateTopDispensed(clotrimazoleLogs);
assertEquals(clotrimazoleResult.length, 0, 'Dispensing 3 creams and undispensing 3 creams nets to 0 (dropped from top dispensed list)');

// Scenario 3.1b: REVERSE CHRONOLOGICAL ORDER (as received from database desc) - Amlodipine 1 Dispense, 1 Undispense
const amlodipineReverseLogs = [
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: 1, actionType: 'RESTOCK', details: 'Undispensed / Restocked 1 units back into inventory.', createdAt: '2026-08-31T20:55:05Z' },
  { itemGenericName: 'Amlodipine Besylate (5 mg Tablet)', quantityChanged: -1, actionType: 'DISPENSE', details: 'Dispensed 1 units', createdAt: '2026-08-31T20:55:00Z' },
];
const amlodipineResult = aggregateTopDispensed(amlodipineReverseLogs);
assertEquals(amlodipineResult.length, 0, 'Reverse chronological order: Undispense coming before Dispense in array nets to exactly 0 (not 1)');

// Scenario 3.2: Dispense 5, Undispense 2 -> Net 3
const partialUndispenseLogs = [
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 5, actionType: 'DISPENSE', details: 'Dispensed 5 units' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 2, actionType: 'RESTOCK', details: 'Undispensed 2 units' },
];
const partialResult = aggregateTopDispensed(partialUndispenseLogs);
assertEquals(partialResult, [{ genericName: 'Amoxicillin (500mg)', totalDispensed: 3, category: 'General Medical' }], 'Dispense 5 and undispense 2 nets exactly 3 units');

// Scenario 3.3: Multiple medications ranking
const multiMedLogs = [
  { itemGenericName: 'Ibuprofen (200 mg Tablet)', quantityChanged: 100, actionType: 'DISPENSE', details: 'Dispensed 1 bottle' },
  { itemGenericName: 'Amoxicillin (500mg)', quantityChanged: 21, actionType: 'DISPENSE', details: 'Dispensed 21 loose units' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'DISPENSE', details: 'Dispensed 3 tubes' },
  { itemGenericName: 'Clotrimazole Cream (1oz, cream)', quantityChanged: 3, actionType: 'RESTOCK', details: 'Undispensed 3 tubes' },
];
const multiResult = aggregateTopDispensed(multiMedLogs);
assertEquals(multiResult, [
  { genericName: 'Ibuprofen (200 mg Tablet)', totalDispensed: 100, category: 'General Medical' },
  { genericName: 'Amoxicillin (500mg)', totalDispensed: 21, category: 'General Medical' }
], 'Correct ranking: Ibuprofen (100), Amoxicillin (21), Clotrimazole (0 - excluded)');

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

console.log('\n============================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
