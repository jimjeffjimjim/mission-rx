import { matchesClinicalQuery, searchSemanticFormulary } from '../lib/smartSearch';
import { InventoryItem } from '../types/inventory';

// Mock inventory fixtures representative of the MissionRx clinic stock
const mockInventory: InventoryItem[] = [
  {
    id: 'item-amox-500',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '500 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 10,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AMOX-500'],
  },
  {
    id: 'item-amox-250',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '250 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 5,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AMOX-250'],
  },
  {
    id: 'item-acetaminophen',
    genericName: 'Acetaminophen / Paracetamol',
    brandName: 'Tylenol',
    dosage: '500 mg Extra Strength Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Analgesic and Antipyretic',
    itemType: 'MEDICATION',
    bottlesAvailable: 20,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-TYL-500'],
  },
  {
    id: 'item-ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin IB',
    dosage: '200 mg Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    itemType: 'MEDICATION',
    bottlesAvailable: 15,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-IBU-200'],
  },
  {
    id: 'item-mupirocin',
    genericName: 'Mupirocin',
    brandName: 'Bactroban',
    dosage: '2% Topical Ointment',
    shelfLocation: 'Dermatology',
    chemicalName: 'Topical Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 8,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-MUP-02'],
  },
  {
    id: 'item-azithro',
    genericName: 'Azithromycin',
    brandName: 'Zithromax / Z-Pak',
    dosage: '250 mg Tablet',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Macrolide Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 12,
    looseUnitsAvailable: 0,
    pillsPerBottle: 6,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AZI-250'],
  },
  {
    id: 'item-atorva',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    dosage: '20 mg Oral Tablet',
    shelfLocation: 'Cardiology',
    chemicalName: 'HMG-CoA Reductase Inhibitor',
    itemType: 'MEDICATION',
    bottlesAvailable: 14,
    looseUnitsAvailable: 0,
    pillsPerBottle: 90,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-ATOR-20'],
  },
  {
    id: 'item-bp-cuff',
    genericName: 'Blood Pressure Cuff Adult',
    brandName: 'Welch Allyn Sphygmomanometer',
    dosage: 'Standard Adult 2-Tube',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
    bottlesAvailable: 4,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '3000-01-01',
    lotNumbers: ['N/A'],
  },
  {
    id: 'item-pulse-ox',
    genericName: 'Fingertip Pulse Oximeter',
    brandName: 'Nonin Onyx',
    dosage: 'Digital SpO2 Monitor',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
    bottlesAvailable: 6,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '3000-01-01',
    lotNumbers: ['N/A'],
  },
  {
    id: 'item-suture-kit',
    genericName: 'Suture Removal Kit Sterile',
    brandName: 'Dynarex',
    dosage: 'Stainless Steel Instruments',
    shelfLocation: 'Supplies',
    chemicalName: 'Surgical Supply',
    itemType: 'Supply',
    bottlesAvailable: 25,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '2029-06-30',
    lotNumbers: ['LOT-SUT-88'],
  },
];

let failed = 0;
let passed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

console.log('=== TEST SUITE: Lightweight Smart Search ===\n');

// 1. Brand-to-Generic Resolution
console.log('--- 1. Brand-to-Generic Resolution ---');
const tylenolMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Tylenol').isMatch);
assert(tylenolMatch?.id === 'item-acetaminophen', 'Query "Tylenol" matches Acetaminophen');

const advilMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Advil').isMatch);
assert(advilMatch?.id === 'item-ibuprofen', 'Query "Advil" matches Ibuprofen');

const bactrobanMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Bactroban').isMatch);
assert(bactrobanMatch?.id === 'item-mupirocin', 'Query "Bactroban" matches Mupirocin');

const zithroMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Zithromax').isMatch);
assert(zithroMatch?.id === 'item-azithro', 'Query "Zithromax" matches Azithromycin');

// 2. Order-Independent Multi-Token Queries
console.log('\n--- 2. Order-Independent Multi-Token Queries ---');
const q1 = '500 amox';
const q2 = 'amoxicillin 500';

const resultsQ1 = mockInventory
  .map((i) => ({ item: i, ...matchesClinicalQuery(i, q1) }))
  .filter((r) => r.isMatch)
  .sort((a, b) => b.score - a.score);

const resultsQ2 = mockInventory
  .map((i) => ({ item: i, ...matchesClinicalQuery(i, q2) }))
  .filter((r) => r.isMatch)
  .sort((a, b) => b.score - a.score);

assert(resultsQ1.length > 0 && resultsQ1[0].item.id === 'item-amox-500', '"500 amox" top result is Amoxicillin 500mg');
assert(resultsQ2.length > 0 && resultsQ2[0].item.id === 'item-amox-500', '"amoxicillin 500" top result is Amoxicillin 500mg');
assert(resultsQ1[0].item.id === resultsQ2[0].item.id, 'Both token orders yield the exact same top formulation');

// 3. Typo Tolerance (Levenshtein Distance)
console.log('\n--- 3. Typo Tolerance ---');
const typo1 = 'amoxcillin'; // missing 'i'
const typoResult1 = mockInventory.find((i) => matchesClinicalQuery(i, typo1).isMatch);
assert(typoResult1?.genericName === 'Amoxicillin', `Typo "${typo1}" correctly matches Amoxicillin`);

const typo2 = 'lipator'; // typo for Lipitor
const typoResult2 = mockInventory.find((i) => matchesClinicalQuery(i, typo2).isMatch);
assert(typoResult2?.id === 'item-atorva', `Typo "${typo2}" correctly matches Lipitor / Atorvastatin`);

// 4. Medical Equipment & Clinical Shorthand
console.log('\n--- 4. Medical Equipment Matching ---');
const cuffMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'bp cuff').isMatch);
assert(cuffMatch?.id === 'item-bp-cuff', 'Query "bp cuff" matches Blood Pressure Cuff');

const oximeterMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'oximeter').isMatch);
assert(oximeterMatch?.id === 'item-pulse-ox', 'Query "oximeter" matches Pulse Oximeter');

const sutureMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'suture').isMatch);
assert(sutureMatch?.id === 'item-suture-kit', 'Query "suture" matches Suture Removal Kit');

// 5. Instant Live Addition (Zero Re-indexing Required)
console.log('\n--- 5. Instant Dynamic Item Addition ---');
const dynamicallyAddedItem: InventoryItem = {
  id: 'item-novel-live-123',
  genericName: 'Semaglutide',
  brandName: 'Ozempic',
  dosage: '0.5 mg/0.37 mL Pen',
  shelfLocation: 'General Medical',
  chemicalName: 'GLP-1 Receptor Agonist',
  itemType: 'MEDICATION',
  bottlesAvailable: 3,
  looseUnitsAvailable: 0,
  pillsPerBottle: 1,
  expirationDate: '2029-01-01',
  lotNumbers: ['LOT-SEMA-LIVE'],
};

const updatedList = [...mockInventory, dynamicallyAddedItem];
const liveMatchOzempic = updatedList.find((i) => matchesClinicalQuery(i, 'Ozempic').isMatch);
assert(liveMatchOzempic?.id === 'item-novel-live-123', 'Instantly finds newly created item by brand "Ozempic"');

const liveMatchPen = updatedList.find((i) => matchesClinicalQuery(i, 'semaglutide pen').isMatch);
assert(liveMatchPen?.id === 'item-novel-live-123', 'Instantly finds newly created item by multi-token "semaglutide pen"');

// 6. searchSemanticFormulary Backwards Compatibility
console.log('\n--- 6. searchSemanticFormulary API Compatibility ---');
const semanticResults = searchSemanticFormulary('amox 500', 0.3, 10, mockInventory);
assert(semanticResults.length > 0, 'searchSemanticFormulary returns results');
assert(semanticResults[0].id === 'item-amox-500', 'searchSemanticFormulary top result is item-amox-500');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
