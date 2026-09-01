import medicalDictionaryData from '@/data/medicalKnowledge.json';

export interface MedicalDrugEntry {
  genericName: string;
  brandName: string;
  chemicalName: string;
  category: string;
  defaultDosage: string;
  dosageOptions?: string[];
  defaultUnit: string;
  defaultSubUnit: string;
  typicalDirections: string;
  contraindications: string;
}

export const MEDICAL_DICTIONARY: MedicalDrugEntry[] = medicalDictionaryData as MedicalDrugEntry[];

/**
 * Intelligent Multi-Tier Medical Relevancy Search Engine
 * Sorts suggestions by:
 * 1. Exact or prefix match on generic or brand name (top priority)
 * 2. Word boundary match (e.g. "xl" matching "Toprol XL")
 * 3. Substring inclusion on brand, generic, or chemical group
 */
export function searchMedicalKnowledge(query: string): MedicalDrugEntry[] {
  if (!query || query.trim().length < 1) return [];
  const normalized = query.toLowerCase().trim();

  const matches = MEDICAL_DICTIONARY.filter(
    (item) =>
      item.genericName.toLowerCase().includes(normalized) ||
      item.brandName.toLowerCase().includes(normalized) ||
      item.chemicalName.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized) ||
      item.defaultDosage.toLowerCase().includes(normalized)
  );

  // Score & sort matches for instant clinical relevance
  return matches.sort((a, b) => {
    const aGen = a.genericName.toLowerCase();
    const bGen = b.genericName.toLowerCase();
    const aBrd = a.brandName.toLowerCase();
    const bBrd = b.brandName.toLowerCase();

    // 1. Prefix matches get highest score
    const aStarts = aGen.startsWith(normalized) || aBrd.startsWith(normalized) || aBrd.includes(`/ ${normalized}`) ? 2 : 0;
    const bStarts = bGen.startsWith(normalized) || bBrd.startsWith(normalized) || bBrd.includes(`/ ${normalized}`) ? 2 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    // 2. Word border match (e.g., searching "HFA" or "XL")
    const aWord = aGen.includes(` ${normalized}`) || aBrd.includes(` ${normalized}`) ? 1 : 0;
    const bWord = bGen.includes(` ${normalized}`) || bBrd.includes(` ${normalized}`) ? 1 : 0;
    if (aWord !== bWord) return bWord - aWord;

    // 3. Alphabetical fallback
    return a.genericName.localeCompare(b.genericName);
  }).slice(0, 15); // Return top 15 most relevant results for smooth UI
}

export function getExactMedicalMatch(name: string): MedicalDrugEntry | undefined {
  if (!name) return undefined;
  const normalized = name.toLowerCase().trim();
  return MEDICAL_DICTIONARY.find(
    (item) =>
      item.genericName.toLowerCase() === normalized ||
      item.brandName.toLowerCase() === normalized
  );
}

/**
 * Quizlet & Flashcard Parser Helper
 */
export function parseQuizletText(text: string): Partial<MedicalDrugEntry> {
  if (!text || !text.trim()) return {};
  const cleaned = text.trim();

  if (cleaned.includes('\t')) {
    const parts = cleaned.split('\t').map((p) => p.trim()).filter(Boolean);
    const term = parts[0] || '';
    const def = parts.slice(1).join(' - ');

    const match = searchMedicalKnowledge(term)[0] || searchMedicalKnowledge(def)[0];
    if (match) {
      return { ...match, typicalDirections: def || match.typicalDirections };
    }
    return { genericName: term, typicalDirections: def };
  }

  const separators = [' - ', ' – ', ' : ', ':', '-'];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map((p) => p.trim()).filter(Boolean);
      const mainName = parts[0];
      const match = searchMedicalKnowledge(mainName)[0];
      if (match) {
        return {
          ...match,
          typicalDirections: parts.slice(1).join(' | ') || match.typicalDirections,
        };
      }
      return { genericName: mainName, typicalDirections: parts.slice(1).join(' | ') };
    }
  }

  const directMatch = searchMedicalKnowledge(cleaned)[0];
  if (directMatch) return directMatch;

  return { genericName: cleaned };
}

const fdaCache = new Map<string, MedicalDrugEntry[]>();

/**
 * Live FDA openFDA API Drug Lookup
 * Queries 100,000+ official FDA drug labels for unknown or custom medications.
 */
export async function searchFdaKnowledge(query: string): Promise<MedicalDrugEntry[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  if (fdaCache.has(q)) {
    return fdaCache.get(q) || [];
  }

  try {
    const encoded = encodeURIComponent(query.trim());
    // Search openFDA for generic_name or brand_name or active_ingredient
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"+openfda.brand_name:"${encoded}"&limit=5`;
    
    let res = await fetch(url).catch(() => null);
    
    // Fallback search if strict openFDA fields returned empty
    if (!res || !res.ok) {
      const fallbackUrl = `https://api.fda.gov/drug/label.json?search="${encoded}"&limit=4`;
      res = await fetch(fallbackUrl).catch(() => null);
    }

    if (!res || !res.ok) return [];

    const data = await res.json();
    if (!data || !data.results || !Array.isArray(data.results)) return [];

    const parsedResults: MedicalDrugEntry[] = [];

    for (const item of data.results) {
      const openfda = item.openfda || {};
      const genericName = openfda.generic_name?.[0] || openfda.substance_name?.[0] || item.active_ingredient?.[0]?.split('\n')?.[0] || query;
      const brandName = openfda.brand_name?.[0] || '';
      
      // Determine chemical class / group
      const pharmClass = openfda.pharm_class_epc?.[0] || openfda.pharm_class_cs?.[0] || 'FDA Registered Pharmaceutical';
      
      // Determine specialty category based on FDA pharm class
      let category = 'General Medical';
      const pharmLower = pharmClass.toLowerCase();
      if (pharmLower.includes('anti-bacterial') || pharmLower.includes('antibiotic') || pharmLower.includes('antiviral') || pharmLower.includes('antifungal')) {
        category = 'Infectious Disease';
      } else if (pharmLower.includes('cardio') || pharmLower.includes('hypertension') || pharmLower.includes('beta blocker') || pharmLower.includes('calcium channel') || pharmLower.includes('statin') || pharmLower.includes('ace inhibitor')) {
        category = 'Cardiology';
      } else if (pharmLower.includes('psych') || pharmLower.includes('ssri') || pharmLower.includes('antidepressant') || pharmLower.includes('antipsychotic')) {
        category = 'Psychiatry';
      } else if (pharmLower.includes('analgesic') || pharmLower.includes('nsaid') || pharmLower.includes('anti-inflammatory')) {
        category = 'Over the Counter';
      } else if (pharmLower.includes('respiratory') || pharmLower.includes('asthma') || pharmLower.includes('bronchodilator')) {
        category = 'Pulmonology';
      } else if (pharmLower.includes('gastro') || pharmLower.includes('proton pump') || pharmLower.includes('laxative')) {
        category = 'Gastroenterology';
      } else if (pharmLower.includes('endocrine') || pharmLower.includes('diabetic') || pharmLower.includes('thyroid')) {
        category = 'Endocrinology';
      } else if (pharmLower.includes('dermatol') || pharmLower.includes('topical')) {
        category = 'Dermatology';
      }

      // Determine dosage forms / options
      const dosageForm = openfda.dosage_form?.[0] || 'Tablet / Capsule';
      const route = openfda.route?.[0] || 'Oral';
      const defaultDosage = `${dosageForm} (${route})`;

      const dosageOptions = [
        defaultDosage,
        `Standard ${dosageForm}`,
        `Extended Release ${dosageForm}`,
        `Custom Dosage...`
      ];

      // Extract brief directions snippet
      let directionsSnippet = 'Take as directed by healthcare provider.';
      if (item.dosage_and_administration && Array.isArray(item.dosage_and_administration)) {
        const rawDir = item.dosage_and_administration[0] || '';
        const firstSentence = rawDir.split('.')[0];
        if (firstSentence && firstSentence.length > 10 && firstSentence.length < 180) {
          directionsSnippet = firstSentence.trim() + '.';
        }
      }

      // Extract warnings / contraindications
      let contraSnippet = 'Consult official FDA package insert.';
      if (item.contraindications && Array.isArray(item.contraindications)) {
        const rawContra = item.contraindications[0] || '';
        const firstSentence = rawContra.split('.')[0];
        if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
          contraSnippet = firstSentence.trim() + '.';
        }
      }

      // Capitalize generic & brand names cleanly
      const cleanGeneric = genericName.charAt(0).toUpperCase() + genericName.slice(1).toLowerCase();
      const cleanBrand = brandName ? (brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()) : '';

      parsedResults.push({
        genericName: cleanGeneric,
        brandName: cleanBrand ? `${cleanBrand} (FDA)` : 'FDA Formula',
        chemicalName: pharmClass,
        category,
        defaultDosage,
        dosageOptions,
        defaultUnit: route.toLowerCase().includes('topical') ? 'Tubes' : 'Bottles',
        defaultSubUnit: route.toLowerCase().includes('topical') ? 'g' : 'tablets',
        typicalDirections: `${directionsSnippet} (Note: FDA reference data; exercise clinical judgment.)`,
        contraindications: contraSnippet,
      });
    }

    const unique = parsedResults.filter((v, i, a) => a.findIndex(t => t.genericName.toLowerCase() === v.genericName.toLowerCase()) === i);

    fdaCache.set(q, unique);
    return unique;
  } catch (e) {
    console.warn('openFDA API fetch warning:', e);
    return [];
  }
}
