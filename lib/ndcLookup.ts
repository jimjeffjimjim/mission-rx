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
  source: 'FDA_NDC_DATABASE' | 'LOCAL_FORMULARY' | 'GS1_DECODED' | 'MANUAL_NDC';
}

/**
 * Extracts GS1 Application Identifiers (AI) from 2D DataMatrix or GS1-128 barcode strings
 * (01) GTIN - 14 digits
 * (17) Expiration - YYMMDD
 * (10) Lot Number - up to 20 alphanumeric
 * (21) Serial Number - up to 20 alphanumeric
 */
export function parseGs1Barcode(raw: string): {
  gtin?: string;
  ndcCandidate?: string;
  lotNumber?: string;
  expirationDate?: string;
  serialNumber?: string;
} {
  const result: {
    gtin?: string;
    ndcCandidate?: string;
    lotNumber?: string;
    expirationDate?: string;
    serialNumber?: string;
  } = {};

  if (!raw) return result;

  // Normalize GS1 control characters or parentheses
  const clean = raw.trim();

  // Pattern 1: Parenthesized GS1 (01)...(17)...(10)...
  const ai01Match = clean.match(/\(01\)(\d{14})/);
  if (ai01Match) {
    result.gtin = ai01Match[1];
    // In the US, GTIN-14 often embeds an 10-digit NDC: 003 + 10-digit NDC + check digit
    // e.g. 00300932264018 -> NDC 0093-2264-01
    const sub = result.gtin.substring(3, 13);
    result.ndcCandidate = sub;
  }

  const ai17Match = clean.match(/\(17\)(\d{6})/);
  if (ai17Match) {
    const yymmdd = ai17Match[1];
    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = yymmdd.substring(2, 4);
    const dd = yymmdd.substring(4, 6);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const safeDay = dd === '00' ? '28' : dd;
    result.expirationDate = `${year}-${mm}-${safeDay}`;
  }

  const ai10Match = clean.match(/\(10\)([A-Za-z0-9_-]+)/);
  if (ai10Match) {
    result.lotNumber = ai10Match[1];
  }

  const ai21Match = clean.match(/\(21\)([A-Za-z0-9_-]+)/);
  if (ai21Match) {
    result.serialNumber = ai21Match[1];
  }

  // Pattern 2: Raw GS1 without parentheses with standard AI prefix
  if (!result.gtin && clean.startsWith('01') && clean.length >= 16) {
    result.gtin = clean.substring(2, 16);
    const sub = result.gtin.substring(3, 13);
    result.ndcCandidate = sub;
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

/**
 * Look up medication details via FDA NDC Directory or local formulary by barcode or NDC
 */
export async function lookupBarcodeOrNdc(rawInput: string): Promise<ScannedMedicationData | null> {
  const input = rawInput.trim();
  if (!input) return null;

  // 1. Try GS1 2D DataMatrix Parsing
  const gs1 = parseGs1Barcode(input);

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
