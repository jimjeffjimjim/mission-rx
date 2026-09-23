import semanticIndexData from '@/data/bge_semantic_index.json';
import { InventoryItem } from '@/types/inventory';
import { MEDICAL_DICTIONARY } from '@/lib/medicalKnowledge';

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
 * Automatically supports newly added live inventory items!
 */
export function searchSemanticFormulary(
  query: string,
  threshold = 0.32,
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

  // 2. Dynamic support for any newly added inventory items not yet in bge_semantic_index.json
  if (liveItems && liveItems.length > 0) {
    for (const item of liveItems) {
      const gNorm = item.genericName.toLowerCase().trim();
      const bNorm = (item.brandName || '').toLowerCase().trim();

      // If already scored from the index, continue
      if (seenIds.has(item.id) || seenIds.has(gNorm)) continue;

      // Check if we have an embedding for this drug name in the index cache
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

      // If it's a completely new custom drug added by the admin, check directions & clinical indication notes
      const textToSearch = `${item.genericName} ${item.brandName || ''} ${item.chemicalName || ''} ${item.directions || ''}`.toLowerCase();
      if (textToSearch.includes(cleanQuery)) {
        scored.push({
          id: item.id,
          genericName: item.genericName,
          brandName: item.brandName || '',
          category: item.shelfLocation,
          dosage: item.dosage,
          passage: item.directions || '',
          score: 0.85, // Direct text relevance
        });
        seenIds.add(item.id);
        seenIds.add(gNorm);
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
