import medicalDictionaryData from '../data/medicalKnowledge.json';
import { InventoryItem } from '../types/inventory';
import { MedicalDrugEntry, searchMedicalKnowledge } from './medicalKnowledge';
import { parseLotNumbers } from './stockMath';

export interface SemanticMatchItem {
  id: string;
  genericName: string;
  brandName?: string;
  category?: string;
  dosage?: string;
  passage?: string;
  score: number;
}

// Pre-build bidirectional brand <-> generic dictionaries
const brandToGenericMap = new Map<string, Set<string>>();
const genericToBrandMap = new Map<string, Set<string>>();
const allMedicalTerms = new Set<string>();

const medicalEntries = medicalDictionaryData as MedicalDrugEntry[];

function cleanToken(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function cleanTokens(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// Common clinical and equipment shorthand synonyms
const CLINICAL_EQUIPMENT_SYNONYMS: Record<string, string[]> = {
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

// Ingest medicalKnowledge.json into alias maps
for (const entry of medicalEntries) {
  const genClean = entry.genericName.toLowerCase().trim();
  const genBase = genClean.split('/')[0].trim();
  const genTokens = cleanTokens(entry.genericName);

  allMedicalTerms.add(genClean);
  if (genBase) allMedicalTerms.add(genBase);
  genTokens.forEach((t) => { if (t.length > 2) allMedicalTerms.add(t); });

  // Parse brand name variants (e.g. "Tylenol / Tylenol Extra Strength", "Advil / Motrin IB")
  const brandParts = entry.brandName
    .split(/[\/,;]/)
    .map((b) => b.trim().toLowerCase())
    .filter((b) => b.length > 0);

  for (const brand of brandParts) {
    // Strip common strength / formulation suffixes from brand key
    const brandBase = brand
      .replace(/\b(extra strength|regular strength|extended release|oral|topical|cream|ointment|tablet|capsule|\d+(\.\d+)?%?|\d+\s*mg)\b/gi, '')
      .trim();

    const brandKeys = new Set<string>([brand, cleanToken(brand)]);
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
      brandToGenericMap.get(bk)!.add(genClean);
      if (genBase) brandToGenericMap.get(bk)!.add(genBase);

      if (!genericToBrandMap.has(genClean)) {
        genericToBrandMap.set(genClean, new Set());
      }
      genericToBrandMap.get(genClean)!.add(bk);
      if (genBase) {
        if (!genericToBrandMap.has(genBase)) {
          genericToBrandMap.set(genBase, new Set());
        }
        genericToBrandMap.get(genBase)!.add(bk);
      }
    }
  }
}

/**
 * Extracts normalized root word from a drug name (stripping salts like HCl, Oxalate, Fumarate, SR, XL, ER, 0.05%, etc.)
 */
export function getRootWord(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2)[0] || '';
}

/**
 * Fast bounded Levenshtein edit distance.
 * Returns distance if <= maxLimit, otherwise returns maxLimit + 1.
 */
export function levenshteinDistance(s1: string, s2: string, maxLimit = 2): number {
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
      const val = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
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

/**
 * Checks if a token fuzzy matches a target word within allowed edit distance.
 */
function isFuzzyMatch(queryToken: string, targetWord: string): boolean {
  if (queryToken === targetWord) return true;
  const qLen = queryToken.length;
  const tLen = targetWord.length;

  if (qLen < 4 || tLen < 4) return false;

  // For words of length 4-6 allow 1 typo; length 7+ allow 2 typos
  const maxAllowedDist = qLen >= 7 && tLen >= 7 ? 2 : 1;
  return levenshteinDistance(queryToken, targetWord, maxAllowedDist) <= maxAllowedDist;
}

interface FieldMatchResult {
  matched: boolean;
  score: number;
}

/**
 * Matches a single query token against an item's fields and aliases.
 */
function matchSingleToken(
  token: string,
  fields: {
    genericTokens: string[];
    brandTokens: string[];
    dosageTokens: string[];
    chemTokens: string[];
    categoryTokens: string[];
    notesTokens: string[];
    lotsTokens: string[];
    rawGeneric: string;
    rawBrand: string;
    rawDosage: string;
    aliases: Set<string>;
  }
): FieldMatchResult {
  // 1. Exact match on generic or brand tokens
  if (fields.genericTokens.includes(token)) {
    return { matched: true, score: 95 };
  }
  if (fields.brandTokens.includes(token)) {
    return { matched: true, score: 90 };
  }

  // 2. Prefix match on generic or brand tokens
  if (fields.genericTokens.some((t) => t.startsWith(token))) {
    return { matched: true, score: 88 };
  }
  if (fields.brandTokens.some((t) => t.startsWith(token))) {
    return { matched: true, score: 85 };
  }

  // 3. Brand/Generic Aliases match (e.g. searching "Tylenol" matches Acetaminophen)
  if (fields.aliases.has(token) || Array.from(fields.aliases).some((a) => a.startsWith(token) || token.startsWith(a))) {
    return { matched: true, score: 82 };
  }

  // 4. Exact match on dosage (e.g. "500", "20mg", "10%")
  if (fields.dosageTokens.includes(token) || fields.rawDosage.includes(token)) {
    return { matched: true, score: 80 };
  }

  // 5. Lot numbers match
  if (fields.lotsTokens.some((lot) => lot.includes(token))) {
    return { matched: true, score: 85 };
  }

  // 6. Substring match in generic or brand
  if (fields.rawGeneric.includes(token) || fields.rawBrand.includes(token)) {
    return { matched: true, score: 75 };
  }

  // 7. Chemical name, category, or notes match
  if (fields.chemTokens.some((t) => t === token || t.startsWith(token))) {
    return { matched: true, score: 70 };
  }
  if (fields.categoryTokens.some((t) => t === token || t.startsWith(token))) {
    return { matched: true, score: 65 };
  }
  if (fields.notesTokens.some((t) => t === token || t.startsWith(token))) {
    return { matched: true, score: 60 };
  }

  // 8. Fuzzy typo tolerance check
  // Check against generic tokens
  for (const gt of fields.genericTokens) {
    if (isFuzzyMatch(token, gt)) {
      return { matched: true, score: 62 };
    }
  }
  // Check against brand tokens
  for (const bt of fields.brandTokens) {
    if (isFuzzyMatch(token, bt)) {
      return { matched: true, score: 60 };
    }
  }
  // Check against aliases
  for (const alias of fields.aliases) {
    const aliasTokens = cleanTokens(alias);
    for (const at of aliasTokens) {
      if (isFuzzyMatch(token, at)) {
        return { matched: true, score: 58 };
      }
    }
  }
  // Check against medical dictionary terms
  for (const term of allMedicalTerms) {
    if (isFuzzyMatch(token, term)) {
      // If the matched term is an alias for this item
      if (fields.aliases.has(term) || fields.genericTokens.includes(term) || fields.brandTokens.includes(term)) {
        return { matched: true, score: 55 };
      }
    }
  }

  return { matched: false, score: 0 };
}

/**
 * Intelligent Multi-Tier Clinical Relevancy Matcher.
 * Matches inventory items against queries using:
 * 1. Exact & Substring on full query.
 * 2. Multi-token order-independent evaluation (all tokens must match).
 * 3. Medical dictionary aliases (e.g. "Tylenol" -> Acetaminophen, "Advil" -> Ibuprofen, "Zithromax" -> Azithromycin).
 * 4. Equipment and clinical shorthand expansions (e.g. "bp cuff", "oximeter", "suture", "ppe").
 * 5. Fast typo tolerance via bounded Levenshtein distance.
 */
export function matchesClinicalQuery(
  item: InventoryItem,
  query: string,
  semanticMatchedNames?: Set<string>
): { isMatch: boolean; score: number } {
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) return { isMatch: true, score: 0 };

  const rawGeneric = (item.genericName || '').toLowerCase().trim();
  const rawBrand = (item.brandName || '').toLowerCase().trim();
  const rawChem = (item.chemicalName || '').toLowerCase().trim();
  const rawDosage = (item.dosage || '').toLowerCase().trim();
  const rawCategory = (item.shelfLocation || '').toLowerCase().trim();
  const rawDirections = (item.directions || '').toLowerCase().trim();

  // Tier 1: Exact full-string matches
  if (rawGeneric === cleanQ || rawBrand === cleanQ) {
    return { isMatch: true, score: 100 };
  }
  if (rawGeneric.startsWith(cleanQ) || rawBrand.startsWith(cleanQ)) {
    return { isMatch: true, score: 92 };
  }

  // Extract tokens
  const queryTokens = cleanTokens(cleanQ);
  if (queryTokens.length === 0) return { isMatch: true, score: 0 };

  const genericTokens = cleanTokens(rawGeneric);
  const brandTokens = cleanTokens(rawBrand);
  const dosageTokens = cleanTokens(rawDosage);
  const chemTokens = cleanTokens(rawChem);
  const categoryTokens = cleanTokens(rawCategory);
  const notesTokens = cleanTokens(rawDirections);
  const lotsTokens = item.lotNumbers ? cleanTokens(parseLotNumbers(item.lotNumbers).join(' ')) : [];

  // Build item aliases (bidirectional lookup)
  const aliases = new Set<string>();

  // Add aliases from brandToGenericMap & genericToBrandMap
  for (const gt of genericTokens) {
    const brands = genericToBrandMap.get(gt);
    if (brands) brands.forEach((b) => aliases.add(b));
  }
  const fullGenBase = rawGeneric.split('/')[0].trim();
  if (genericToBrandMap.has(fullGenBase)) {
    genericToBrandMap.get(fullGenBase)!.forEach((b) => aliases.add(b));
  }

  for (const bt of brandTokens) {
    const gens = brandToGenericMap.get(bt);
    if (gens) gens.forEach((g) => aliases.add(g));
  }
  const fullBrandBase = rawBrand.split('/')[0].trim();
  if (brandToGenericMap.has(fullBrandBase)) {
    brandToGenericMap.get(fullBrandBase)!.forEach((g) => aliases.add(g));
  }

  // Expand clinical & equipment synonyms if item or query uses them
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

  // Check if ALL query tokens find a match
  let totalScore = 0;
  let allMatched = true;
  let genericOrBrandMatched = false;

  for (const token of queryTokens) {
    // Check if the token itself has synonym expansions (e.g. "bp" -> "blood pressure")
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
    if (tokenRes.score >= 82) {
      genericOrBrandMatched = true;
    }
  }

  if (allMatched) {
    // Average the token scores and add multi-token relevance boost
    let finalScore = totalScore / queryTokens.length;
    if (queryTokens.length > 1) {
      finalScore += 6; // Bonus for multi-token precision (e.g. "500 amox")
    }
    if (genericOrBrandMatched) {
      finalScore += 4;
    }
    return { isMatch: true, score: Math.min(99, Math.round(finalScore)) };
  }

  // Tier 3: Substring match fallback for single word queries
  if (queryTokens.length === 1) {
    const single = queryTokens[0];
    if (rawGeneric.includes(single)) return { isMatch: true, score: 78 };
    if (rawBrand.includes(single)) return { isMatch: true, score: 75 };
    if (rawChem.includes(single)) return { isMatch: true, score: 70 };
    if (rawDosage.includes(single)) return { isMatch: true, score: 68 };
    if (rawCategory.includes(single)) return { isMatch: true, score: 65 };
    if (rawDirections.includes(single)) return { isMatch: true, score: 55 };
    if (lotsTokens.some((l) => l.includes(single))) return { isMatch: true, score: 85 };
  }

  // Tier 4: Direct medical dictionary search lookup integration
  const medMatches = searchMedicalKnowledge(cleanQ);
  for (const km of medMatches) {
    const kmGen = km.genericName.toLowerCase();
    const kmBrd = km.brandName.toLowerCase();
    const itemRoot = getRootWord(rawGeneric);
    const kmRoot = getRootWord(kmGen);

    if (itemRoot && kmRoot && (itemRoot === kmRoot || itemRoot.includes(kmRoot) || kmRoot.includes(itemRoot))) {
      return { isMatch: true, score: 84 };
    }
    if (rawBrand && kmBrd.includes(getRootWord(rawBrand))) {
      return { isMatch: true, score: 82 };
    }
  }

  // Tier 5: Legacy semanticMatchedNames Set compatibility
  if (semanticMatchedNames && semanticMatchedNames.size > 0) {
    for (const semName of semanticMatchedNames) {
      const semNorm = semName.toLowerCase().trim();
      const semRoot = getRootWord(semNorm);
      const itemRoot = getRootWord(rawGeneric);
      if (
        rawGeneric.includes(semNorm) ||
        semNorm.includes(rawGeneric) ||
        (itemRoot && semRoot && (itemRoot === semRoot || itemRoot.includes(semRoot) || semRoot.includes(itemRoot)))
      ) {
        return { isMatch: true, score: 50 };
      }
    }
  }

  return { isMatch: false, score: 0 };
}

/**
 * Searches the clinical formulary catalog and live items with high speed and zero dependencies.
 * Backwards-compatible replacement for searchSemanticFormulary.
 */
export function searchSemanticFormulary(
  query: string,
  threshold = 0.30,
  limit = 25,
  liveItems?: InventoryItem[]
): SemanticMatchItem[] {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.toLowerCase().trim();
  const scored: SemanticMatchItem[] = [];
  const seenIds = new Set<string>();

  // 1. Dynamic support for live inventory items
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

  // 2. Direct medical dictionary clinical search integration
  const medMatches = searchMedicalKnowledge(cleanQuery);
  for (const med of medMatches) {
    const medKey = med.genericName.toLowerCase().trim();
    if (!seenIds.has(medKey)) {
      scored.push({
        id: `med_${medKey.replace(/\s+/g, '_')}`,
        genericName: med.genericName,
        brandName: med.brandName,
        category: med.category,
        dosage: med.defaultDosage,
        passage: `${med.typicalDirections} | Contraindications: ${med.contraindications}`,
        score: 0.90,
      });
      seenIds.add(medKey);
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Searches the 70+ Medical Knowledge reference catalog to locate items that may not currently
 * be in physical clinic stock (so doctors can see it exists in the clinical formulary).
 */
export function searchReferenceCatalog(query: string): MedicalDrugEntry[] {
  if (!query || !query.trim()) return [];
  return searchMedicalKnowledge(query).slice(0, 10);
}
