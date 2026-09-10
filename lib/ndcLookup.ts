import { MEDICAL_DICTIONARY, searchMedicalKnowledge, searchFdaKnowledge, MedicalDrugEntry } from '@/lib/medicalKnowledge';

export interface ScannedMedicationData {
  genericName: string;
  brandName: string;
  chemicalName: string | null;
  dosage: string;
  shelfLocation: string;
  stockUnit: string;
  subUnit: string;
  pillsPerBottle: number;
  lotNumber?: string;
  expirationDate?: string;
  directions?: string;
  rawBarcode: string;
  source: 'FDA_NDC_DATABASE' | 'LOCAL_FORMULARY' | 'GS1_DECODED' | 'MANUAL_NDC' | 'LABEL_OCR' | 'MEDICAL_SUPPLY_DATABASE';
  itemType?: 'Medication' | 'Supply';
  refNumber?: string;
  quantity?: number;
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
};

/**
 * Standardizes raw date strings (YYMMDD, 2026-OCT-31, OCT 2026, 2029-09-30) into YYYY-MM-DD
 */
export function normalizeDateString(rawDate: string): string | undefined {
  if (!rawDate) return undefined;
  const clean = rawDate.trim().toUpperCase();

  // Pattern: 2026-OCT-31 or 2026/OCT/31 or 2026-OCT
  const alphaMonthMatch = clean.match(/(\d{4})[-/]([A-Z]{3})(?:[-/](\d{1,2}))?/);
  if (alphaMonthMatch) {
    const year = alphaMonthMatch[1];
    const month = MONTH_MAP[alphaMonthMatch[2]] || '12';
    const day = alphaMonthMatch[3] ? alphaMonthMatch[3].padStart(2, '0') : '28';
    return `${year}-${month}-${day}`;
  }

  // Pattern: OCT 2026 or OCT-2026
  const monthYearMatch = clean.match(/([A-Z]{3})[-/\s]+(\d{4})/);
  if (monthYearMatch) {
    const month = MONTH_MAP[monthYearMatch[1]] || '12';
    const year = monthYearMatch[2];
    return `${year}-${month}-28`;
  }

  // Pattern: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // Pattern: MM/DD/YYYY or MM-DD-YYYY
  const usMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
  }

  // Pattern: YYMMDD (GS1 AI 17 standard)
  if (/^\d{6}$/.test(clean)) {
    const yy = parseInt(clean.substring(0, 2), 10);
    const mm = clean.substring(2, 4);
    const dd = clean.substring(4, 6);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const safeDay = dd === '00' ? '28' : dd;
    return `${year}-${mm}-${safeDay}`;
  }

  return undefined;
}

/**
 * Extracts GS1 Application Identifiers (AI) from 2D DataMatrix or GS1-128 barcode strings
 * (01) GTIN - 14 digits
 * (17) Expiration - YYMMDD
 * (10) Lot Number - up to 20 alphanumeric
 * (21) Serial Number - up to 20 alphanumeric
 * (30) Count / Quantity
 * (240) / (241) REF / Catalog / Product Code
 */
export function parseGs1Barcode(raw: string): {
  gtin?: string;
  ndcCandidate?: string;
  lotNumber?: string;
  expirationDate?: string;
  serialNumber?: string;
  quantity?: number;
  refNumber?: string;
} {
  const result: {
    gtin?: string;
    ndcCandidate?: string;
    lotNumber?: string;
    expirationDate?: string;
    serialNumber?: string;
    quantity?: number;
    refNumber?: string;
  } = {};

  if (!raw) return result;

  const clean = raw.trim();

  // Pattern 1: Parenthesized GS1 (01)...(17)...(10)...(30)...
  const ai01Match = clean.match(/\(01\)(\d{14})/);
  if (ai01Match) {
    result.gtin = ai01Match[1];
    const sub = result.gtin.substring(3, 13);
    result.ndcCandidate = sub;
  }

  const ai17Match = clean.match(/\(17\)(\d{6})/);
  if (ai17Match) {
    result.expirationDate = normalizeDateString(ai17Match[1]);
  }

  const ai10Match = clean.match(/\(10\)([A-Za-z0-9_-]+?)(?=\(\d{2}\)|$)/);
  if (ai10Match) {
    result.lotNumber = ai10Match[1];
  }

  const ai30Match = clean.match(/\(30\)(\d+)/);
  if (ai30Match) {
    result.quantity = parseInt(ai30Match[1], 10);
  }

  const ai21Match = clean.match(/\(21\)([A-Za-z0-9_-]+?)(?=\(\d{2}\)|$)/);
  if (ai21Match) {
    result.serialNumber = ai21Match[1];
  }

  const ai240Match = clean.match(/\(24[01]\)([A-Za-z0-9_-]+?)(?=\(\d{2}\)|$)/);
  if (ai240Match) {
    result.refNumber = ai240Match[1];
  }

  // Pattern 2: Raw GS1 without parentheses
  // Check for starting with 01 (GTIN)
  if (!result.gtin && clean.startsWith('01') && clean.length >= 16) {
    result.gtin = clean.substring(2, 16);
    const sub = result.gtin.substring(3, 13);
    result.ndcCandidate = sub;

    // Remaining string could have 17, 10, 30
    const remainder = clean.substring(16);
    if (remainder.startsWith('17') && remainder.length >= 8) {
      result.expirationDate = normalizeDateString(remainder.substring(2, 8));
      const afterExp = remainder.substring(8);
      if (afterExp.startsWith('10')) {
        const lotMatch = afterExp.substring(2).match(/^([A-Za-z0-9_-]+?)(?:30(\d+)|$)/);
        if (lotMatch) {
          result.lotNumber = lotMatch[1];
          if (lotMatch[2]) result.quantity = parseInt(lotMatch[2], 10);
        }
      }
    }
  }

  // Check for starting with 17 (Expiration) without parentheses
  if (!result.expirationDate && clean.startsWith('17') && clean.length >= 8) {
    result.expirationDate = normalizeDateString(clean.substring(2, 8));
    const remainder = clean.substring(8);
    if (remainder.startsWith('10')) {
      const lotMatch = remainder.substring(2).match(/^([A-Za-z0-9_-]+?)(?:30(\d+)|$)/);
      if (lotMatch) {
        result.lotNumber = lotMatch[1];
        if (lotMatch[2]) result.quantity = parseInt(lotMatch[2], 10);
      }
    }
  }

  return result;
}

/**
 * Standardizes raw 10-digit or 11-digit NDC codes or UPC-A into standard dashed NDC format
 */
export function normalizeNdc(rawNdc: string): string[] {
  const digits = rawNdc.replace(/[^0-9]/g, '');
  const candidates: string[] = [];

  if (digits.length === 10) {
    // 10 digits can be 4-4-2, 5-3-2, or 5-4-1
    candidates.push(`${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`);
    candidates.push(`${digits.slice(0, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`);
    candidates.push(`${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`);
  } else if (digits.length === 11) {
    // Standard 11-digit HIPAA 5-4-2 format
    candidates.push(`${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`);
  } else if (digits.length === 12) {
    // UPC-A with leading 3 (pharmaceutical indicator)
    const ndc10 = digits.slice(1, 11);
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 9)}-${ndc10.slice(9)}`);
    candidates.push(`${ndc10.slice(0, 4)}-${ndc10.slice(4, 8)}-${ndc10.slice(8)}`);
  }

  return candidates;
}

export interface MedicalSupplyEntry {
  gtinList?: string[];
  refNumbers?: string[];
  ndcList?: string[];
  keywords: string[];
  name: string;
  brand: string;
  spec: string;
  category: string;
  unit: string;
  subUnit: string;
  packSize: number;
  itemType: 'Supply' | 'Medication';
  chemicalName?: string;
  directions?: string;
}

export const MEDICAL_SUPPLIES_CATALOG: MedicalSupplyEntry[] = [
  // --- BD Needles & Syringes ---
  {
    gtinList: ['30382903057611', '030382903057611', '00382903057611', '382903057611'],
    refNumbers: ['305761', '305762', '305763', '305767', '305768'],
    keywords: ['bd eclipse', 'eclipse needle', 'eclipse injection needle', 'bd eclipse injection needle'],
    name: 'BD Eclipse Injection Needle',
    brand: 'BD (Becton Dickinson)',
    spec: '25G x 1" TW (0.5mm x 25mm)',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'needles',
    packSize: 100,
    itemType: 'Supply',
    directions: 'Single use hypodermic safety needle for injection. Dispose in sharps container.'
  },
  {
    gtinList: ['30382903051950'],
    refNumbers: ['305195', '305196', '305197', '305198', '305199'],
    keywords: ['precisionglide', 'bd precisionglide', 'hypodermic needle'],
    name: 'BD PrecisionGlide Hypodermic Needle',
    brand: 'BD (Becton Dickinson)',
    spec: '21G x 1.5" (0.8mm x 38mm)',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'needles',
    packSize: 100,
    itemType: 'Supply',
  },
  {
    refNumbers: ['309657', '309658'],
    keywords: ['bd syringe 3ml', 'luer-lok 3ml', 'luer lock syringe 3ml'],
    name: 'BD Luer-Lok Disposable Syringe (3 mL)',
    brand: 'BD (Becton Dickinson)',
    spec: '3 mL Luer-Lok Tip',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'syringes',
    packSize: 100,
    itemType: 'Supply',
  },
  {
    refNumbers: ['309604', '309605'],
    keywords: ['bd syringe 10ml', 'luer-lok 10ml'],
    name: 'BD Luer-Lok Disposable Syringe (10 mL)',
    brand: 'BD (Becton Dickinson)',
    spec: '10 mL Luer-Lok Tip',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'syringes',
    packSize: 100,
    itemType: 'Supply',
  },

  // --- Hospira Diluents, Injectables & Solutions ---
  {
    ndcList: ['0409-1966-02', '00409-1966-02', '0409196602', 'PAA222240', '409196602', '0409-1966-03'],
    keywords: ['bacteriostatic', 'sodium chloride 0.9%', 'bacteriostatic sodium chloride', 'bacteriostatic 0.9% sodium chloride', 'bacteriostatic 0.9%'],
    name: 'Bacteriostatic 0.9% Sodium Chloride Injection, USP',
    brand: 'Hospira, Inc. (Pfizer)',
    chemicalName: 'Sodium Chloride 9 mg/mL with Benzyl Alcohol 0.9% (Preservative)',
    spec: '0.9% (30 mL Vial)',
    category: 'General Medical',
    unit: 'Vials',
    subUnit: 'mL',
    packSize: 30,
    itemType: 'Medication',
    directions: 'For drug diluent use only. Multiple-dose vial. Sterile, nonpyrogenic.'
  },
  {
    ndcList: ['0409-4888-02', '0409-4888-10', '0409-4888-20', '0409-4888-50'],
    keywords: ['sterile water for injection', 'sterile water vial'],
    name: 'Sterile Water for Injection, USP',
    brand: 'Hospira, Inc. (Pfizer)',
    chemicalName: 'Sterile Water for Injection (Preservative-Free)',
    spec: '30 mL Multiple-Dose Vial',
    category: 'General Medical',
    unit: 'Vials',
    subUnit: 'mL',
    packSize: 30,
    itemType: 'Medication',
    directions: 'For drug diluent use only. Sterile, nonpyrogenic. Do not inject without solute.'
  },
  {
    ndcList: ['0409-4276-01', '0409-4276-02'],
    keywords: ['lidocaine 1%', 'lidocaine hcl 1%', 'lidocaine injection 1%'],
    name: 'Lidocaine HCl 1% Injection, USP',
    brand: 'Hospira, Inc. (Pfizer)',
    chemicalName: 'Lidocaine Hydrochloride 10 mg/mL',
    spec: '1% (50 mL Multiple-Dose)',
    category: 'General Medical',
    unit: 'Vials',
    subUnit: 'mL',
    packSize: 50,
    itemType: 'Medication',
    directions: 'Local or regional anesthesia. Infiltrate subcutaneously or intradermally.'
  },

  // --- Consumables & PPE ---
  {
    refNumbers: ['1764', '0536-1764-01'],
    keywords: ['alcohol prep', 'alcohol prep pads', 'rugby alcohol', 'sterile alcohol prep'],
    name: 'Alcohol Prep Pads (70% Isopropyl Alcohol)',
    brand: 'Rugby Laboratories',
    spec: 'Medium 2-Ply Saturated 70% IPA',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'pads',
    packSize: 200,
    itemType: 'Supply',
    directions: 'Topical antiseptic skin cleanser prior to injection or blood draw.'
  },
  {
    keywords: ['nitrile exam gloves', 'nitrile gloves', 'powder-free exam gloves'],
    name: 'Nitrile Exam Gloves (Powder-Free)',
    brand: 'Dynarex / Medline',
    spec: 'Non-Sterile Powder-Free (Medium / Large)',
    category: 'Consumables & PPE',
    unit: 'Boxes / Packs',
    subUnit: 'gloves',
    packSize: 100,
    itemType: 'Supply',
    directions: 'Single use medical examination gloves for clinical barrier protection.'
  },
  {
    keywords: ['suture removal kit', 'suture kit'],
    name: 'Sterile Suture Removal Kit',
    brand: 'Dynarex',
    spec: 'Includes Metal Forceps & Littauer Scissor',
    category: 'Surgical Instruments',
    unit: 'Units',
    subUnit: 'kits',
    packSize: 1,
    itemType: 'Supply',
  }
];

/**
 * Searches the medical supply catalog by GTIN, REF number, NDC, or text keywords
 */
export function lookupSupplyByRefOrGtin(term: string): MedicalSupplyEntry | null {
  if (!term) return null;
  const clean = term.trim().toLowerCase();
  const digitsOnly = clean.replace(/[^0-9]/g, '');

  for (const item of MEDICAL_SUPPLIES_CATALOG) {
    // Check GTIN match
    if (item.gtinList && item.gtinList.some(g => g.toLowerCase() === clean || (digitsOnly && g.includes(digitsOnly)))) {
      return item;
    }
    // Check REF number match
    if (item.refNumbers && item.refNumbers.some(r => r.toLowerCase() === clean || clean.includes(r.toLowerCase()))) {
      return item;
    }
    // Check NDC match
    if (item.ndcList && item.ndcList.some(n => n.toLowerCase() === clean || (digitsOnly && n.replace(/[^0-9]/g, '') === digitsOnly))) {
      return item;
    }
    // Check Keyword match
    if (item.keywords.some(kw => clean.includes(kw))) {
      return item;
    }
  }

  return null;
}

/**
 * Parses raw text extracted from a photo or label OCR
 */
export function parseLabelText(rawText: string): ScannedMedicationData | null {
  if (!rawText || !rawText.trim()) return null;
  const text = rawText.trim();
  const lowerText = text.toLowerCase();

  // 1. Extract Lot Number
  let extractedLot: string | undefined = undefined;
  const lotMatch = text.match(/(?:LOT|Lot|BATCH|Batch|B\.No\.?)[\s:#.]*([A-Za-z0-9_-]{3,20})/);
  if (lotMatch) {
    extractedLot = lotMatch[1].trim();
  }

  // 2. Extract Expiration Date
  let extractedExp: string | undefined = undefined;
  const expMatch = text.match(/(?:EXP|Exp|EXPIRY|USE BEFORE|EXP\.)[\s:#.]*([A-Za-z0-9-/.\s]{5,15})/i);
  if (expMatch) {
    extractedExp = normalizeDateString(expMatch[1]);
  }
  if (!extractedExp) {
    // Check standalone dates (e.g. 2029-09-30, 2026-OCT-31)
    const dateMatch = text.match(/\b(20\d{2}[-/][A-Za-z]{3}[-/]\d{1,2}|20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b/);
    if (dateMatch) {
      extractedExp = normalizeDateString(dateMatch[1]);
    }
  }

  // 3. Extract REF number
  let extractedRef: string | undefined = undefined;
  const refMatch = text.match(/REF[\s:#.]*([A-Za-z0-9_-]{4,15})/i);
  if (refMatch) {
    extractedRef = refMatch[1].trim();
  }

  // 4. Extract NDC
  let extractedNdc: string | undefined = undefined;
  const ndcMatch = text.match(/(?:NDC[\s:#.]*)?(\d{4,5}-\d{3,4}-\d{1,2})/i);
  if (ndcMatch) {
    extractedNdc = ndcMatch[1].trim();
  }

  // 5. Extract Quantity / Pack size
  let extractedQty: number | undefined = undefined;
  const qtyMatch = text.match(/(?:^|\s)(\d{1,4})\s*(?:count|ct|needles|tablets|capsules|pads|gloves|pcs|each|TW)\b/i);
  if (qtyMatch) {
    extractedQty = parseInt(qtyMatch[1], 10);
  }
  if (!extractedQty) {
    // Check for volume e.g. 30 mL
    const volMatch = text.match(/(\d{1,4})\s*mL\b/i);
    if (volMatch) {
      extractedQty = parseInt(volMatch[1], 10);
    }
  }
  if (!extractedQty) {
    // Check standalone number line like "100"
    const lineNumMatch = text.match(/(?:^|\n)\s*(\d{2,4})\s*(?:\n|$)/);
    if (lineNumMatch) {
      extractedQty = parseInt(lineNumMatch[1], 10);
    }
  }

  // 6. Match against Medical Supplies Catalog
  const supplyMatch = (extractedRef ? lookupSupplyByRefOrGtin(extractedRef) : null)
    || (extractedNdc ? lookupSupplyByRefOrGtin(extractedNdc) : null)
    || lookupSupplyByRefOrGtin(lowerText);

  if (supplyMatch) {
    return {
      genericName: supplyMatch.name,
      brandName: supplyMatch.brand,
      chemicalName: supplyMatch.chemicalName || null,
      dosage: supplyMatch.spec,
      shelfLocation: supplyMatch.category,
      stockUnit: supplyMatch.unit,
      subUnit: supplyMatch.subUnit,
      pillsPerBottle: extractedQty || supplyMatch.packSize,
      lotNumber: extractedLot,
      expirationDate: extractedExp,
      directions: supplyMatch.directions,
      rawBarcode: extractedNdc || extractedRef || text.slice(0, 30),
      source: 'LABEL_OCR',
      itemType: supplyMatch.itemType,
      refNumber: extractedRef,
      quantity: extractedQty || supplyMatch.packSize,
    };
  }

  // 7. Match against Medical Drug Dictionary
  const localMatch = searchMedicalKnowledge(lowerText);
  if (localMatch.length > 0) {
    const med = localMatch[0];
    return {
      genericName: med.genericName,
      brandName: med.brandName,
      chemicalName: med.chemicalName || null,
      dosage: med.defaultDosage,
      shelfLocation: med.category,
      stockUnit: med.defaultUnit,
      subUnit: med.defaultSubUnit,
      pillsPerBottle: extractedQty || 100,
      lotNumber: extractedLot,
      expirationDate: extractedExp,
      directions: med.typicalDirections,
      rawBarcode: extractedNdc || text.slice(0, 30),
      source: 'LABEL_OCR',
      itemType: 'Medication',
      quantity: extractedQty || 100,
    };
  }

  // 8. Fallback structured extraction
  const firstLine = text.split('\n').map(l => l.trim()).filter(Boolean)[0] || 'Scanned Medical Item';
  return {
    genericName: firstLine.slice(0, 40),
    brandName: 'Commercial Manufacturer',
    chemicalName: null,
    dosage: 'Standard Formulation',
    shelfLocation: 'General Medical',
    stockUnit: 'Boxes / Packs',
    subUnit: 'units',
    pillsPerBottle: extractedQty || 1,
    lotNumber: extractedLot,
    expirationDate: extractedExp,
    rawBarcode: extractedNdc || extractedRef || text.slice(0, 30),
    source: 'LABEL_OCR',
    itemType: 'Supply',
    refNumber: extractedRef,
    quantity: extractedQty || 1,
  };
}

/**
 * Look up medication details via FDA NDC Directory or local formulary by barcode or NDC
 */
export async function lookupBarcodeOrNdc(rawInput: string): Promise<ScannedMedicationData | null> {
  const input = rawInput.trim();
  if (!input) return null;

  // 1. Try GS1 2D DataMatrix / GS1-128 Parsing
  const gs1 = parseGs1Barcode(input);

  // 2. Check Medical Supplies & Device Catalog (GTIN, REF, NDC, or Keyword)
  const supplyMatch = (gs1.gtin ? lookupSupplyByRefOrGtin(gs1.gtin) : null)
    || (gs1.refNumber ? lookupSupplyByRefOrGtin(gs1.refNumber) : null)
    || (gs1.ndcCandidate ? lookupSupplyByRefOrGtin(gs1.ndcCandidate) : null)
    || lookupSupplyByRefOrGtin(input);

  if (supplyMatch) {
    return {
      genericName: supplyMatch.name,
      brandName: supplyMatch.brand,
      chemicalName: supplyMatch.chemicalName || null,
      dosage: supplyMatch.spec,
      shelfLocation: supplyMatch.category,
      stockUnit: supplyMatch.unit,
      subUnit: supplyMatch.subUnit,
      pillsPerBottle: gs1.quantity || supplyMatch.packSize,
      lotNumber: gs1.lotNumber || undefined,
      expirationDate: gs1.expirationDate || undefined,
      directions: supplyMatch.directions,
      rawBarcode: input,
      source: 'MEDICAL_SUPPLY_DATABASE',
      itemType: supplyMatch.itemType,
      refNumber: gs1.refNumber || supplyMatch.refNumbers?.[0],
      quantity: gs1.quantity || supplyMatch.packSize,
    };
  }

  // 2. Check local formulary database first for instant sub-millisecond response
  const localMatch = searchMedicalKnowledge(input);
  if (localMatch.length > 0) {
    const entry = localMatch[0];
    return {
      genericName: entry.genericName,
      brandName: entry.brandName,
      chemicalName: entry.chemicalName || null,
      dosage: entry.defaultDosage,
      shelfLocation: entry.category || 'General Medical',
      stockUnit: entry.defaultUnit || 'Bottles',
      subUnit: entry.defaultSubUnit || 'tablets',
      pillsPerBottle: 100,
      lotNumber: gs1.lotNumber || undefined,
      expirationDate: gs1.expirationDate || undefined,
      directions: entry.typicalDirections || undefined,
      rawBarcode: input,
      source: 'LOCAL_FORMULARY',
    };
  }

  // 3. Query OpenFDA NDC Directory API
  const ndcCandidates = normalizeNdc(gs1.ndcCandidate || input);
  const searchTerms = [input, ...(gs1.gtin ? [gs1.gtin] : []), ...ndcCandidates];

  for (const term of searchTerms) {
    try {
      const url = `https://api.fda.gov/drug/ndc.json?search=packaging.package_ndc:"${encodeURIComponent(
        term
      )}"+product_ndc:"${encodeURIComponent(term)}"+generic_name:"${encodeURIComponent(term)}"&limit=1`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          const genericName = item.generic_name || item.brand_name || 'Prescription Drug';
          const brandName = item.brand_name ? `${item.brand_name} (${item.labeler_name || 'FDA'})` : (item.labeler_name || '');
          const dosageForm = item.dosage_form || 'Tablet';
          const activeIngredients = item.active_ingredients?.map((i: any) => `${i.name} ${i.strength}`).join(', ') || item.pharm_class?.[0] || null;
          const strength = item.active_ingredients?.[0]?.strength ? `${item.active_ingredients[0].strength} ${dosageForm}` : dosageForm;

          // Determine Category
          let category = 'General Medical';
          const pharmClass = (item.pharm_class || []).join(' ').toLowerCase();
          if (pharmClass.includes('anti-bacterial') || pharmClass.includes('antibiotic')) {
            category = 'Antibiotics';
          } else if (pharmClass.includes('cardio') || pharmClass.includes('hypertens') || pharmClass.includes('beta blocker')) {
            category = 'Cardiovascular';
          } else if (pharmClass.includes('analgesic') || pharmClass.includes('anti-inflammatory') || pharmClass.includes('nsaid')) {
            category = 'Pain & Analgesics';
          } else if (pharmClass.includes('respiratory') || pharmClass.includes('bronchodilat')) {
            category = 'Pulmonology';
          } else if (pharmClass.includes('dermatol') || pharmClass.includes('topical')) {
            category = 'Dermatology';
          }

          // Determine packaging
          const isTopical = dosageForm.toLowerCase().includes('cream') || dosageForm.toLowerCase().includes('ointment') || dosageForm.toLowerCase().includes('gel');
          const isLiquid = dosageForm.toLowerCase().includes('liquid') || dosageForm.toLowerCase().includes('suspension') || dosageForm.toLowerCase().includes('solution');

          let stockUnit = 'Bottles';
          let subUnit = 'tablets';
          let packSize = 100;

          if (isTopical) {
            stockUnit = 'Tubes';
            subUnit = 'tubes';
            packSize = 1;
          } else if (isLiquid) {
            stockUnit = 'Bottles';
            subUnit = 'mL';
            packSize = 100;
          } else if (dosageForm.toLowerCase().includes('capsule')) {
            subUnit = 'capsules';
          }

          return {
            genericName: genericName.charAt(0).toUpperCase() + genericName.slice(1),
            brandName: brandName,
            chemicalName: activeIngredients,
            dosage: strength,
            shelfLocation: category,
            stockUnit,
            subUnit,
            pillsPerBottle: packSize,
            lotNumber: gs1.lotNumber || undefined,
            expirationDate: gs1.expirationDate || undefined,
            directions: 'Take as prescribed by physician. Refer to manufacturer package insert.',
            rawBarcode: input,
            source: 'FDA_NDC_DATABASE',
          };
        }
      }
    } catch (err) {
      // Continue to next search term on network failure
    }
  }

  // 4. If GS1 was parsed with Lot/Exp but no FDA match, return structured entry
  if (gs1.lotNumber || gs1.expirationDate) {
    return {
      genericName: `Scanned Item (${input.slice(0, 10)})`,
      brandName: 'Commercial Manufacturer',
      chemicalName: null,
      dosage: 'Standard Formulation',
      shelfLocation: 'General Medical',
      stockUnit: 'Bottles',
      subUnit: 'units',
      pillsPerBottle: 100,
      lotNumber: gs1.lotNumber,
      expirationDate: gs1.expirationDate,
      directions: 'Manufacturer packaging.',
      rawBarcode: input,
      source: 'GS1_DECODED',
    };
  }

  return null;
}
