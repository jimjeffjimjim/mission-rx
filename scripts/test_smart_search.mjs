import fs from 'fs';
import path from 'path';

// Load medicalKnowledge.json
const dataPath = path.resolve('data/medicalKnowledge.json');
const medicalEntries = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Pre-build bidirectional brand <-> generic dictionaries
const brandToGenericMap = new Map();
const genericToBrandMap = new Map();
const allMedicalTerms = new Set();

function cleanToken(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function cleanTokens(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

const CLINICAL_EQUIPMENT_SYNONYMS = {
  bp: ['blood pressure', 'sphygmomanometer', 'cuff', 'vital signs'],
  cuff: ['blood pressure cuff', 'bp cuff', 'sphygmomanometer'],
  oximeter: ['pulse oximeter', 'pulse ox', 'spo2', 'oxygen saturation', 'pulse'],
  oximetry: ['pulse oximeter', 'pulse ox', 'spo2'],
  spo2: ['pulse oximeter', 'oximeter'],
  suture: ['suture kit', 'sutures', 'nylon', 'silk', 'chromic', 'vicryl', 'needle'],
  scalpel: ['blade', 'surgical blade', 'surgical instrument'],
  gauze: ['gauze pad', 'sponge', 'bandage', 'wound care', 'dressing'],
  ppe: ['nitrile exam gloves', 'gloves', 'mask', 'protective gown', 'face shield'],
  glove: ['nitrile exam gloves', 'exam gloves', 'gloves'],
  gloves: ['nitrile exam gloves', 'exam gloves', 'latex gloves'],
  syringe: ['luer lock syringe', 'syringes', 'injection', 'tuberculin'],
  syringes: ['luer lock syringe', 'injection', 'tuberculin'],
  needle: ['injection needle', 'hypodermic', 'safetyglide', 'pen needle'],
  needles: ['injection needle', 'hypodermic', 'safetyglide', 'pen needle'],
  splint: ['wrist splint', 'ankle splint', 'orthopedic brace', 'support'],
  sling: ['arm sling', 'deluxe arm sling', 'econo arm sling'],
  otc: ['over the counter', 'over-the-counter'],
  sx: ['surgical', 'surgery'],
  dx: ['diagnostic', 'examination'],
};

for (const entry of medicalEntries) {
  const genClean = entry.genericName.toLowerCase().trim();
  const genBase = genClean.split('/')[0].trim();
  const genTokens = cleanTokens(entry.genericName);

  allMedicalTerms.add(genClean);
  if (genBase) allMedicalTerms.add(genBase);
  genTokens.forEach((t) => { if (t.length > 2) allMedicalTerms.add(t); });

  const brandParts = entry.brandName
    .split(/[\/,;]/)
    .map((b) => b.trim().toLowerCase())
    .filter((b) => b.length > 0);

  for (const brand of brandParts) {
    const brandBase = brand
      .replace(/\b(extra strength|regular strength|extended release|oral|topical|cream|ointment|tablet|capsule|\d+(\.\d+)?%?|\d+\s*mg)\b/gi, '')
      .trim();

    const brandKeys = new Set([brand, cleanToken(brand)]);
    if (brandBase && brandBase !== brand) {
      brandKeys.add(brandBase);
      brandKeys.add(cleanToken(brandBase));
    }

    for (const bk of brandKeys) {
      if (bk.length < 2) continue;
      allMedicalTerms.add(bk);

      if (!brandToGenericMap.has(bk)) {
        brandToGenericMap.set(bk, new Set());
      }
      brandToGenericMap.get(bk).add(genClean);
      if (genBase) brandToGenericMap.get(bk).add(genBase);

      if (!genericToBrandMap.has(genClean)) {
        genericToBrandMap.set(genClean, new Set());
      }
      genericToBrandMap.get(genClean).add(bk);
      if (genBase) {
        if (!genericToBrandMap.has(genBase)) {
          genericToBrandMap.set(genBase, new Set());
        }
        genericToBrandMap.get(genBase).add(bk);
      }
    }
  }
}

export function getRootWord(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2)[0] || '';
}

export function levenshteinDistance(s1, s2, maxLimit = 2) {
  if (s1 === s2) return 0;
  const l1 = s1.length;
  const l2 = s2.length;
  if (Math.abs(l1 - l2) > maxLimit) return maxLimit + 1;
  if (l1 === 0) return l2;
  if (l2 === 0) return l1;

  let prev = new Array(l2 + 1);
  let curr = new Array(l2 + 1);

  for (let j = 0; j <= l2; j++) prev[j] = j;

  for (let i = 1; i <= l1; i++) {
    curr[0] = i;
    let minRow = curr[0];
    const c1 = s1.charCodeAt(i - 1);

    for (let j = 1; j <= l2; j++) {
      const c2 = s2.charCodeAt(j - 1);
      const cost = c1 === c2 ? 0 : 1;
      const val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr[j] = val;
      if (val < minRow) minRow = val;
    }

    if (minRow > maxLimit) return maxLimit + 1;
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[l2];
}

function isFuzzyMatch(queryToken, targetWord) {
  if (queryToken === targetWord) return true;
  const qLen = queryToken.length;
  const tLen = targetWord.length;
  if (qLen < 4 || tLen < 4) return false;
  const maxAllowedDist = qLen >= 7 && tLen >= 7 ? 2 : 1;
  return levenshteinDistance(queryToken, targetWord, maxAllowedDist) <= maxAllowedDist;
}

function matchSingleToken(token, fields) {
  if (fields.genericTokens.includes(token)) return { matched: true, score: 95 };
  if (fields.brandTokens.includes(token)) return { matched: true, score: 90 };
  if (fields.genericTokens.some((t) => t.startsWith(token))) return { matched: true, score: 88 };
  if (fields.brandTokens.some((t) => t.startsWith(token))) return { matched: true, score: 85 };
  if (fields.aliases.has(token) || Array.from(fields.aliases).some((a) => a.startsWith(token) || token.startsWith(a))) {
    return { matched: true, score: 82 };
  }
  if (fields.dosageTokens.includes(token) || fields.rawDosage.includes(token)) return { matched: true, score: 80 };
  if (fields.lotsTokens.some((lot) => lot.includes(token))) return { matched: true, score: 85 };
  if (fields.rawGeneric.includes(token) || fields.rawBrand.includes(token)) return { matched: true, score: 75 };
  if (fields.chemTokens.some((t) => t === token || t.startsWith(token))) return { matched: true, score: 70 };
  if (fields.categoryTokens.some((t) => t === token || t.startsWith(token))) return { matched: true, score: 65 };
  if (fields.notesTokens.some((t) => t === token || t.startsWith(token))) return { matched: true, score: 60 };

  for (const gt of fields.genericTokens) {
    if (isFuzzyMatch(token, gt)) return { matched: true, score: 62 };
  }
  for (const bt of fields.brandTokens) {
    if (isFuzzyMatch(token, bt)) return { matched: true, score: 60 };
  }
  for (const alias of fields.aliases) {
    for (const at of cleanTokens(alias)) {
      if (isFuzzyMatch(token, at)) return { matched: true, score: 58 };
    }
  }
  for (const term of allMedicalTerms) {
    if (isFuzzyMatch(token, term)) {
      if (fields.aliases.has(term) || fields.genericTokens.includes(term) || fields.brandTokens.includes(term)) {
        return { matched: true, score: 55 };
      }
    }
  }

  return { matched: false, score: 0 };
}

export function matchesClinicalQuery(item, query, semanticMatchedNames) {
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) return { isMatch: true, score: 0 };

  const rawGeneric = (item.genericName || '').toLowerCase().trim();
  const rawBrand = (item.brandName || '').toLowerCase().trim();
  const rawChem = (item.chemicalName || '').toLowerCase().trim();
  const rawDosage = (item.dosage || '').toLowerCase().trim();
  const rawCategory = (item.shelfLocation || '').toLowerCase().trim();
  const rawDirections = (item.directions || '').toLowerCase().trim();

  if (rawGeneric === cleanQ || rawBrand === cleanQ) return { isMatch: true, score: 100 };
  if (rawGeneric.startsWith(cleanQ) || rawBrand.startsWith(cleanQ)) return { isMatch: true, score: 92 };

  const queryTokens = cleanTokens(cleanQ);
  if (queryTokens.length === 0) return { isMatch: true, score: 0 };

  const genericTokens = cleanTokens(rawGeneric);
  const brandTokens = cleanTokens(rawBrand);
  const dosageTokens = cleanTokens(rawDosage);
  const chemTokens = cleanTokens(rawChem);
  const categoryTokens = cleanTokens(rawCategory);
  const notesTokens = cleanTokens(rawDirections);
  const lotsTokens = item.lotNumbers ? cleanTokens(JSON.stringify(item.lotNumbers)) : [];

  const aliases = new Set();
  for (const gt of genericTokens) {
    const brands = genericToBrandMap.get(gt);
    if (brands) brands.forEach((b) => aliases.add(b));
  }
  const fullGenBase = rawGeneric.split('/')[0].trim();
  if (genericToBrandMap.has(fullGenBase)) {
    genericToBrandMap.get(fullGenBase).forEach((b) => aliases.add(b));
  }

  for (const bt of brandTokens) {
    const gens = brandToGenericMap.get(bt);
    if (gens) gens.forEach((g) => aliases.add(g));
  }
  const fullBrandBase = rawBrand.split('/')[0].trim();
  if (brandToGenericMap.has(fullBrandBase)) {
    brandToGenericMap.get(fullBrandBase).forEach((g) => aliases.add(g));
  }

  for (const [key, syns] of Object.entries(CLINICAL_EQUIPMENT_SYNONYMS)) {
    const itemHasKey =
      rawGeneric.includes(key) ||
      rawBrand.includes(key) ||
      rawCategory.includes(key) ||
      syns.some((s) => rawGeneric.includes(s) || rawBrand.includes(s) || rawCategory.includes(s));

    if (itemHasKey) {
      aliases.add(key);
      syns.forEach((s) => aliases.add(s));
    }
  }

  const fields = {
    genericTokens,
    brandTokens,
    dosageTokens,
    chemTokens,
    categoryTokens,
    notesTokens,
    lotsTokens,
    rawGeneric,
    rawBrand,
    rawDosage,
    aliases,
  };

  let totalScore = 0;
  let allMatched = true;
  let genericOrBrandMatched = false;

  for (const token of queryTokens) {
    let tokenRes = matchSingleToken(token, fields);

    if (!tokenRes.matched && CLINICAL_EQUIPMENT_SYNONYMS[token]) {
      for (const syn of CLINICAL_EQUIPMENT_SYNONYMS[token]) {
        const synRes = matchSingleToken(syn, fields);
        if (synRes.matched) {
          tokenRes = { matched: true, score: synRes.score - 5 };
          break;
        }
      }
    }

    if (!tokenRes.matched) {
      allMatched = false;
      break;
    }

    totalScore += tokenRes.score;
    if (tokenRes.score >= 82) genericOrBrandMatched = true;
  }

  if (allMatched) {
    let finalScore = totalScore / queryTokens.length;
    if (queryTokens.length > 1) finalScore += 6;
    if (genericOrBrandMatched) finalScore += 4;
    return { isMatch: true, score: Math.min(99, Math.round(finalScore)) };
  }

  if (queryTokens.length === 1) {
    const single = queryTokens[0];
    if (rawGeneric.includes(single)) return { isMatch: true, score: 78 };
    if (rawBrand.includes(single)) return { isMatch: true, score: 75 };
    if (rawChem.includes(single)) return { isMatch: true, score: 70 };
    if (rawDosage.includes(single)) return { isMatch: true, score: 68 };
    if (rawCategory.includes(single)) return { isMatch: true, score: 65 };
    if (rawDirections.includes(single)) return { isMatch: true, score: 55 };
  }

  return { isMatch: false, score: 0 };
}

export function searchSemanticFormulary(query, threshold = 0.3, limit = 25, liveItems) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.toLowerCase().trim();
  const scored = [];
  const seenIds = new Set();

  if (liveItems && liveItems.length > 0) {
    for (const item of liveItems) {
      const match = matchesClinicalQuery(item, cleanQuery);
      if (match.isMatch) {
        const normalizedScore = Math.round((match.score / 100) * 10000) / 10000;
        if (normalizedScore >= threshold) {
          scored.push({
            id: item.id,
            genericName: item.genericName,
            brandName: item.brandName || '',
            category: item.shelfLocation,
            dosage: item.dosage,
            passage: item.directions || '',
            score: normalizedScore,
          });
          seenIds.add(item.id);
          seenIds.add(item.genericName.toLowerCase().trim());
        }
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// -------------------------------------------------------------
// RUN TESTS
// -------------------------------------------------------------
const mockInventory = [
  {
    id: 'item-amox-500',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '500 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-amox-250',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '250 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-acetaminophen',
    genericName: 'Acetaminophen / Paracetamol',
    brandName: 'Tylenol',
    dosage: '500 mg Extra Strength Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Analgesic and Antipyretic',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin IB',
    dosage: '200 mg Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-mupirocin',
    genericName: 'Mupirocin',
    brandName: 'Bactroban',
    dosage: '2% Topical Ointment',
    shelfLocation: 'Dermatology',
    chemicalName: 'Topical Antibacterial',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-azithro',
    genericName: 'Azithromycin',
    brandName: 'Zithromax / Z-Pak',
    dosage: '250 mg Tablet',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Macrolide Antibacterial',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-atorva',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    dosage: '20 mg Oral Tablet',
    shelfLocation: 'Cardiology',
    chemicalName: 'HMG-CoA Reductase Inhibitor',
    itemType: 'MEDICATION',
  },
  {
    id: 'item-bp-cuff',
    genericName: 'Blood Pressure Cuff Adult',
    brandName: 'Welch Allyn Sphygmomanometer',
    dosage: 'Standard Adult 2-Tube',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
  },
  {
    id: 'item-pulse-ox',
    genericName: 'Fingertip Pulse Oximeter',
    brandName: 'Nonin Onyx',
    dosage: 'Digital SpO2 Monitor',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
  },
  {
    id: 'item-suture-kit',
    genericName: 'Suture Removal Kit Sterile',
    brandName: 'Dynarex',
    dosage: 'Stainless Steel Instruments',
    shelfLocation: 'Supplies',
    chemicalName: 'Surgical Supply',
    itemType: 'Supply',
  },
];

let failed = 0;
let passed = 0;

function assert(condition, testName, detail) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

console.log('=== TEST SUITE: Lightweight Smart Search ===\n');

console.log('--- 1. Brand-to-Generic Resolution ---');
const tylenolMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Tylenol').isMatch);
assert(tylenolMatch && tylenolMatch.id === 'item-acetaminophen', 'Query "Tylenol" matches Acetaminophen', tylenolMatch ? tylenolMatch.id : 'None');

const advilMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Advil').isMatch);
assert(advilMatch && advilMatch.id === 'item-ibuprofen', 'Query "Advil" matches Ibuprofen', advilMatch ? advilMatch.id : 'None');

const bactrobanMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Bactroban').isMatch);
assert(bactrobanMatch && bactrobanMatch.id === 'item-mupirocin', 'Query "Bactroban" matches Mupirocin', bactrobanMatch ? bactrobanMatch.id : 'None');

const zithroMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Zithromax').isMatch);
assert(zithroMatch && zithroMatch.id === 'item-azithro', 'Query "Zithromax" matches Azithromycin', zithroMatch ? zithroMatch.id : 'None');

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
assert(resultsQ1.length > 0 && resultsQ2.length > 0 && resultsQ1[0].item.id === resultsQ2[0].item.id, 'Both token orders yield the exact same top formulation');

console.log('\n--- 3. Typo Tolerance ---');
const typo1 = 'amoxcillin';
const typoResult1 = mockInventory.find((i) => matchesClinicalQuery(i, typo1).isMatch);
assert(typoResult1 && typoResult1.genericName === 'Amoxicillin', `Typo "${typo1}" correctly matches Amoxicillin`, typoResult1 ? typoResult1.genericName : 'None');

const typo2 = 'lipator';
const typoResult2 = mockInventory.find((i) => matchesClinicalQuery(i, typo2).isMatch);
assert(typoResult2 && typoResult2.id === 'item-atorva', `Typo "${typo2}" correctly matches Lipitor / Atorvastatin`, typoResult2 ? typoResult2.id : 'None');

console.log('\n--- 4. Medical Equipment Matching ---');
const cuffMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'bp cuff').isMatch);
assert(cuffMatch && cuffMatch.id === 'item-bp-cuff', 'Query "bp cuff" matches Blood Pressure Cuff', cuffMatch ? cuffMatch.id : 'None');

const oximeterMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'oximeter').isMatch);
assert(oximeterMatch && oximeterMatch.id === 'item-pulse-ox', 'Query "oximeter" matches Pulse Oximeter', oximeterMatch ? oximeterMatch.id : 'None');

const sutureMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'suture').isMatch);
assert(sutureMatch && sutureMatch.id === 'item-suture-kit', 'Query "suture" matches Suture Removal Kit', sutureMatch ? sutureMatch.id : 'None');

console.log('\n--- 5. Instant Dynamic Item Addition ---');
const dynamicallyAddedItem = {
  id: 'item-novel-live-123',
  genericName: 'Semaglutide',
  brandName: 'Ozempic',
  dosage: '0.5 mg/0.37 mL Pen',
  shelfLocation: 'General Medical',
  chemicalName: 'GLP-1 Receptor Agonist',
  itemType: 'MEDICATION',
};

const updatedList = [...mockInventory, dynamicallyAddedItem];
const liveMatchOzempic = updatedList.find((i) => matchesClinicalQuery(i, 'Ozempic').isMatch);
assert(liveMatchOzempic && liveMatchOzempic.id === 'item-novel-live-123', 'Instantly finds newly created item by brand "Ozempic"');

const liveMatchPen = updatedList.find((i) => matchesClinicalQuery(i, 'semaglutide pen').isMatch);
assert(liveMatchPen && liveMatchPen.id === 'item-novel-live-123', 'Instantly finds newly created item by multi-token "semaglutide pen"');

console.log('\n--- 6. searchSemanticFormulary API Compatibility ---');
const semanticResults = searchSemanticFormulary('amox 500', 0.3, 10, mockInventory);
assert(semanticResults.length > 0, 'searchSemanticFormulary returns results');
assert(semanticResults.length > 0 && semanticResults[0].id === 'item-amox-500', 'searchSemanticFormulary top result is item-amox-500');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}
