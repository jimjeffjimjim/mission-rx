import semanticIndexData from '@/data/bge_semantic_index.json';
import { InventoryItem } from '@/types/inventory';
import { MEDICAL_DICTIONARY, searchMedicalKnowledge, MedicalDrugEntry } from '@/lib/medicalKnowledge';
import { parseLotNumbers } from '@/lib/stockMath';

export interface SemanticMatchItem {
  id: string;
  genericName: string;
  brandName?: string;
  category?: string;
  dosage?: string;
  passage?: string;
  score: number;
}

interface BgeSemanticIndex {
  model: string;
  dimension: number;
  queryPrefix: string;
  items: Array<{
    id: string;
    genericName: string;
    brandName?: string;
    category?: string;
    dosage?: string;
    passage?: string;
    embedding: number[];
  }>;
  precomputedQueries: Record<string, number[]>;
}

const index = semanticIndexData as unknown as BgeSemanticIndex;

// Pre-create generic name to embedding lookup map for O(1) matching of dynamic database items
const nameToItemMap = new Map<string, typeof index.items[0]>();
if (index && index.items) {
  for (const it of index.items) {
    nameToItemMap.set(it.genericName.toLowerCase().trim(), it);
    if (it.brandName) {
      nameToItemMap.set(it.brandName.toLowerCase().trim(), it);
    }
  }
}

/**
 * Extracts normalized root word from a drug name (stripping salts like HCl, Oxalate, Fumarate, SR, XL, ER, 0.05%, etc.)
 */
export function getRootWord(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2)[0] || '';
}

/**
 * High-performance dot-product for normalized 1024-dimensional vectors.
 * Because BGE vectors are L2-normalized, dot product is identical to cosine similarity.
 */
export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Finds the closest precomputed query vector for a search string.
 * Supports exact phrase match, partial phrase match, or token blending.
 */
export function getQueryVector(query: string): number[] | null {
  if (!query || !index || !index.precomputedQueries) return null;
  const clean = query.toLowerCase().trim();

  // 1. Direct exact match in precomputed dictionary (e.g. "ear infection", "headache")
  if (index.precomputedQueries[clean]) {
    return index.precomputedQueries[clean];
  }

  // 2. Substring or word matching among precomputed queries
  const matchedKeys: string[] = [];
  for (const key of Object.keys(index.precomputedQueries)) {
    if (clean.includes(key) || key.includes(clean)) {
      matchedKeys.push(key);
    }
  }

  if (matchedKeys.length === 1) {
    return index.precomputedQueries[matchedKeys[0]];
  }

  if (matchedKeys.length > 1) {
    const dim = index.dimension || 1024;
    const combined = new Float64Array(dim);
    for (const k of matchedKeys) {
      const vec = index.precomputedQueries[k];
      for (let i = 0; i < dim; i++) {
        combined[i] += vec[i];
      }
    }
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += combined[i] * combined[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      const result: number[] = new Array(dim);
      for (let i = 0; i < dim; i++) result[i] = combined[i] / norm;
      return result;
    }
  }

  return null;
}

/**
 * Searches the precomputed BGE formulary index using vector dot-product.
 * Runs in ~0.2ms in browser memory or Vercel edge/serverless without needing PyTorch.
 */
export function searchSemanticFormulary(
  query: string,
  threshold = 0.30,
  limit = 25,
  liveItems?: InventoryItem[]
): SemanticMatchItem[] {
  if (!query || !query.trim() || !index || !index.items) return [];

  const queryVector = getQueryVector(query);
  const cleanQuery = query.toLowerCase().trim();
  const scored: SemanticMatchItem[] = [];
  const seenIds = new Set<string>();

  // 1. Score pre-indexed formulary items with 1024-dim BGE dot product
  if (queryVector) {
    for (const item of index.items) {
      if (!item.embedding || item.embedding.length === 0) continue;
      const score = dotProduct(queryVector, item.embedding);
      if (score >= threshold) {
        scored.push({
          id: item.id,
          genericName: item.genericName,
          brandName: item.brandName,
          category: item.category,
          dosage: item.dosage,
          passage: item.passage,
          score: Math.round(score * 10000) / 10000,
        });
        seenIds.add(item.id);
        seenIds.add(item.genericName.toLowerCase().trim());
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
        score: 0.90, // High medical relevance match
      });
      seenIds.add(medKey);
    }
  }

  // 3. Dynamic support for live inventory items
  if (liveItems && liveItems.length > 0) {
    for (const item of liveItems) {
      const gNorm = item.genericName.toLowerCase().trim();
      const bNorm = (item.brandName || '').toLowerCase().trim();
      if (seenIds.has(item.id) || seenIds.has(gNorm)) continue;

      const cachedIndexed = nameToItemMap.get(gNorm) || (bNorm ? nameToItemMap.get(bNorm) : undefined);
      if (cachedIndexed && queryVector) {
        const score = dotProduct(queryVector, cachedIndexed.embedding);
        if (score >= threshold) {
          scored.push({
            id: item.id,
            genericName: item.genericName,
            brandName: item.brandName || '',
            category: item.shelfLocation,
            dosage: item.dosage,
            passage: cachedIndexed.passage,
            score: Math.round(score * 10000) / 10000,
          });
          seenIds.add(item.id);
          seenIds.add(gNorm);
          continue;
        }
      }

      // Check direct notes, directions, or chemical ingredient
      const textToSearch = `${item.genericName} ${item.brandName || ''} ${item.chemicalName || ''} ${item.directions || ''}`.toLowerCase();
      if (textToSearch.includes(cleanQuery)) {
        scored.push({
          id: item.id,
          genericName: item.genericName,
          brandName: item.brandName || '',
          category: item.shelfLocation,
          dosage: item.dosage,
          passage: item.directions || '',
          score: 0.85,
        });
        seenIds.add(item.id);
        seenIds.add(gNorm);
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Intelligent Multi-Tier Clinical Relevancy Matcher.
 * Matches inventory items against queries using:
 * 1. Exact & Substring on name, brand, chemical class, dosage, category, directions, lot numbers.
 * 2. Medical dictionary aliases (e.g. searching "Zyrtec" finds Cetirizine, "Lexapro" finds Escitalopram).
 * 3. Salt & formulation-insensitive root word matching.
 * 4. BGE Semantic Vector matches.
 */
export function matchesClinicalQuery(
  item: InventoryItem,
  query: string,
  semanticMatchedNames?: Set<string>
): { isMatch: boolean; score: number } {
  const q = query.toLowerCase().trim();
  if (!q) return { isMatch: true, score: 0 };

  const generic = item.genericName.toLowerCase();
  const brand = (item.brandName || '').toLowerCase();
  const chemical = (item.chemicalName || '').toLowerCase();
  const dosage = (item.dosage || '').toLowerCase();
  const category = (item.shelfLocation || '').toLowerCase();
  const directions = (item.directions || '').toLowerCase();

  // Tier 1: Exact matches
  if (generic === q || brand === q) return { isMatch: true, score: 100 };
  if (generic.startsWith(q) || brand.startsWith(q)) return { isMatch: true, score: 90 };

  // Tier 2: Substring inclusion
  if (generic.includes(q)) return { isMatch: true, score: 80 };
  if (brand.includes(q)) return { isMatch: true, score: 75 };
  if (chemical.includes(q)) return { isMatch: true, score: 70 };
  if (dosage.includes(q)) return { isMatch: true, score: 65 };
  if (category.includes(q)) return { isMatch: true, score: 60 };
  if (directions.includes(q)) return { isMatch: true, score: 55 };

  // Lot number match
  if (item.lotNumbers) {
    const lots = parseLotNumbers(item.lotNumbers).join(' ').toLowerCase();
    if (lots.includes(q)) return { isMatch: true, score: 95 };
  }

  // Tier 3: Medical Knowledge Brand <-> Generic cross resolution
  const medMatches = searchMedicalKnowledge(q);
  for (const km of medMatches) {
    const kmGen = km.genericName.toLowerCase();
    const kmBrd = km.brandName.toLowerCase();
    const itemRoot = getRootWord(generic);
    const kmRoot = getRootWord(kmGen);

    if (itemRoot && kmRoot && (itemRoot === kmRoot || itemRoot.includes(kmRoot) || kmRoot.includes(itemRoot))) {
      return { isMatch: true, score: 85 };
    }
    if (brand && kmBrd.includes(getRootWord(brand))) {
      return { isMatch: true, score: 85 };
    }
  }

  // Tier 4: Salt & formulation root matching (e.g. Escitalopram vs Escitalopram Oxalate)
  const itemRoot = getRootWord(generic);
  const qRoot = getRootWord(q);
  if (itemRoot && qRoot && qRoot.length >= 3) {
    if (itemRoot === qRoot || itemRoot.startsWith(qRoot) || qRoot.startsWith(itemRoot)) {
      return { isMatch: true, score: 75 };
    }
  }

  // Tier 5: Semantic vector matches from BGE-large
  if (semanticMatchedNames && semanticMatchedNames.size > 0) {
    for (const semName of semanticMatchedNames) {
      const semNorm = semName.toLowerCase().trim();
      const semRoot = getRootWord(semNorm);
      if (
        generic.includes(semNorm) ||
        semNorm.includes(generic) ||
        (itemRoot && semRoot && (itemRoot === semRoot || itemRoot.includes(semRoot) || semRoot.includes(itemRoot)))
      ) {
        return { isMatch: true, score: 50 };
      }
    }
  }

  return { isMatch: false, score: 0 };
}

/**
 * Searches the 70+ Medical Knowledge reference catalog to locate items that may not currently
 * be in physical clinic stock (so doctors can see it exists in the clinical formulary).
 */
export function searchReferenceCatalog(query: string): MedicalDrugEntry[] {
  if (!query || !query.trim()) return [];
  return searchMedicalKnowledge(query).slice(0, 10);
}
