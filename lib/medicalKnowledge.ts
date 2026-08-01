export interface MedicalDrugEntry {
  genericName: string;
  brandName: string;
  chemicalName: string;
  category: string;
  defaultDosage: string;
  defaultUnit: string;
  defaultSubUnit: string;
  typicalDirections: string;
  contraindications: string;
}

export const MEDICAL_DICTIONARY: MedicalDrugEntry[] = [
  {
    genericName: 'Clobetasol Propionate',
    brandName: 'Clobetasol 0.05%',
    chemicalName: 'Ultra-High Potency Topical Corticosteroid',
    category: 'Dermatology',
    defaultDosage: '0.05% Cream',
    defaultUnit: 'Tubes',
    defaultSubUnit: 'tubes',
    typicalDirections: 'Apply a thin layer to the affected area as directed by provider.',
    contraindications: 'Do not use on open wounds, viral skin lesions (e.g., herpes, varicella), or face/groin without specialist guidance.'
  },
  {
    genericName: 'Fluocinonide',
    brandName: 'Fluocinonide 0.05%',
    chemicalName: 'High-Potency Topical Corticosteroid',
    category: 'Dermatology',
    defaultDosage: '0.05% Cream',
    defaultUnit: 'Tubes',
    defaultSubUnit: 'tubes',
    typicalDirections: 'Apply a thin layer to the affected area as directed by provider.',
    contraindications: 'Avoid prolonged use (>2 consecutive weeks) to prevent skin atrophy and systemic absorption.'
  },
  {
    genericName: 'Cetirizine HCl',
    brandName: 'Zyrtec Allergy',
    chemicalName: 'Second-Generation Antihistamine',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '10 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth once daily as needed for allergies.',
    contraindications: 'Known allergy to cetirizine or hydroxyzine; use caution with concurrent CNS depressants or alcohol.'
  },
  {
    genericName: 'Diphenhydramine HCl',
    brandName: 'Benadryl Allergy',
    chemicalName: 'First-Generation Antihistamine',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '25 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth every 4–6 hours as needed for allergy symptoms.',
    contraindications: 'May cause severe sedation. Avoid operating machinery. Caution in patients with narrow-angle glaucoma or urinary retention.'
  },
  {
    genericName: 'Lisinopril',
    brandName: 'Zestril / Prinivil',
    chemicalName: 'ACE Inhibitor',
    category: 'Cardiology',
    defaultDosage: '10 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth once daily.',
    contraindications: 'Contraindicated in pregnancy and patients with a history of angioedema related to previous ACE inhibitor treatment.'
  },
  {
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    chemicalName: 'HMG-CoA Reductase Inhibitor (Statin)',
    category: 'Cardiology',
    defaultDosage: '20 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth daily in the evening.',
    contraindications: 'Active liver disease or unexplained persistent elevations of serum transaminases. Avoid in pregnancy/nursing.'
  },
  {
    genericName: 'Metoprolol Succinate',
    brandName: 'Toprol XL',
    chemicalName: 'Beta-1 Selective Beta Blocker',
    category: 'Cardiology',
    defaultDosage: '50 mg Extended-Release Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth once daily with or immediately after a meal.',
    contraindications: 'Severe bradycardia, second- or third-degree heart block, overt heart failure, or cardiogenic shock.'
  },
  {
    genericName: 'Aripiprazole',
    brandName: 'Abilify',
    chemicalName: 'Atypical Antipsychotic (D2 Partial Agonist)',
    category: 'Psychiatry',
    defaultDosage: '10 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider. Take at the same time each day.',
    contraindications: 'Black Box Warning: Increased risk of suicidal thinking and behavior in young adults.'
  },
  {
    genericName: 'Bupropion HCl SR',
    brandName: 'Wellbutrin SR',
    chemicalName: 'Norepinephrine-Dopamine Reuptake Inhibitor (NDRI)',
    category: 'Psychiatry',
    defaultDosage: '100 mg Sustained-Release Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider. Swallow whole; do not crush, chew, or split.',
    contraindications: 'Contraindicated in patients with seizure disorders, bulimia or anorexia nervosa.'
  },
  {
    genericName: 'Escitalopram',
    brandName: 'Lexapro',
    chemicalName: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    category: 'Psychiatry',
    defaultDosage: '5 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider.',
    contraindications: 'Contraindicated with concomitant MAOI use or within 14 days of MAOI discontinuation.'
  },
  {
    genericName: 'Lurasidone HCl',
    brandName: 'Latuda',
    chemicalName: 'Atypical Antipsychotic',
    category: 'Psychiatry',
    defaultDosage: '20 mg Oral Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider. Take with food (at least 350 calories).',
    contraindications: 'Contraindicated with strong CYP3A4 inhibitors (e.g., ketoconazole) and inducers (e.g., rifampin).'
  },
  {
    genericName: 'Quetiapine Fumarate',
    brandName: 'Seroquel',
    chemicalName: 'Atypical Antipsychotic',
    category: 'Psychiatry',
    defaultDosage: '300 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider.',
    contraindications: 'May cause sedation, orthostatic hypotension, and metabolic changes.'
  },
  {
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    chemicalName: 'Beta-Lactam Penicillin Antibiotic',
    category: 'General Medical',
    defaultDosage: '500 mg Capsule',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'capsules',
    typicalDirections: 'Take 1 capsule by mouth three times daily (every 8 hours) until all medication is gone.',
    contraindications: 'Strictly contraindicated in patients with known severe penicillin hypersensitivity.'
  },
  {
    genericName: 'Amoxicillin/Clavulanic Acid',
    brandName: 'Augmentin',
    chemicalName: 'Penicillin Antibiotic + Beta-Lactamase Inhibitor',
    category: 'General Medical',
    defaultDosage: '875/125 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth every 12 hours with meal or snack.',
    contraindications: 'History of penicillin allergy or cholestatic jaundice associated with amoxicillin-clavulanate.'
  },
  {
    genericName: 'Ciprofloxacin HCl',
    brandName: 'Cipro',
    chemicalName: 'Fluoroquinolone Antibiotic',
    category: 'General Medical',
    defaultDosage: '500 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth every 12 hours with plenty of water.',
    contraindications: 'Black Box Warning: Increased risk of tendonitis and tendon rupture.'
  },
  {
    genericName: 'Doxycycline Hyclate',
    brandName: 'Vibramycin',
    chemicalName: 'Tetracycline Class Broad-Spectrum Antibiotic',
    category: 'General Medical',
    defaultDosage: '100 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth twice daily with full glass of water. Remain upright for 30 mins.',
    contraindications: 'Avoid in pregnancy, lactation, and children under 8 years due to permanent tooth discoloration.'
  },
  {
    genericName: 'Epinephrine Injectable',
    brandName: 'EpiPen / Adrenalin',
    chemicalName: 'Alpha- and Beta-Adrenergic Receptor Agonist',
    category: 'Allergy & Asthma',
    defaultDosage: '1 mg/ml Auto-Injector (0.3 mg dose)',
    defaultUnit: 'Vials',
    defaultSubUnit: 'injectors',
    typicalDirections: 'Inject IM directly into outer thigh immediately upon acute systemic allergic response.',
    contraindications: 'No absolute contraindications in life-threatening anaphylaxis.'
  },
  {
    genericName: 'Albuterol Sulfate Inhaler',
    brandName: 'ProAir HFA / Ventolin HFA',
    chemicalName: 'Short-Acting Beta2-Agonist (SABA)',
    category: 'Allergy & Asthma',
    defaultDosage: '90 mcg / actuation',
    defaultUnit: 'Canisters',
    defaultSubUnit: 'inhalers',
    typicalDirections: 'Inhale 1-2 puffs by mouth every 4-6 hours as needed for bronchospasm or wheezing.',
    contraindications: 'Hypersensitivity to albuterol or milk proteins.'
  },
  {
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin',
    chemicalName: 'NSAID Anti-Inflammatory',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '200 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1-2 tablets by mouth every 4-6 hours with food as needed for pain or fever.',
    contraindications: 'Avoid in active peptic ulcer disease, acute renal injury, or third-trimester pregnancy.'
  },
  {
    genericName: 'Hydrocortisone Ointment',
    brandName: 'Cortizone 10',
    chemicalName: 'Low-Potency Topical Corticosteroid',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '1% Ointment',
    defaultUnit: 'Tubes',
    defaultSubUnit: 'tubes',
    typicalDirections: 'Apply sparingly to affected skin up to 3-4 times daily.',
    contraindications: 'Do not use on undiagnosed bacterial, fungal, or viral skin infection.'
  }
];

export function searchMedicalKnowledge(query: string): MedicalDrugEntry[] {
  if (!query || query.trim().length < 2) return [];
  const normalized = query.toLowerCase().trim();
  return MEDICAL_DICTIONARY.filter(
    (item) =>
      item.genericName.toLowerCase().includes(normalized) ||
      item.brandName.toLowerCase().includes(normalized) ||
      item.chemicalName.toLowerCase().includes(normalized)
  );
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
 * Accepts raw Quizlet term/definition text, tab-delimited flashcard exports, or study lines.
 * Examples:
 *   "Lisinopril - 10 mg Tablet - Cardiology - Take 1 tablet daily"
 *   "Lipitor\tAtorvastatin 20mg - Cardiology - 1 tab daily"
 */
export function parseQuizletText(text: string): Partial<MedicalDrugEntry> {
  if (!text || !text.trim()) return {};
  const cleaned = text.trim();

  // Try tab-delimited Quizlet export format (Term \t Definition)
  if (cleaned.includes('\t')) {
    const parts = cleaned.split('\t').map((p) => p.trim()).filter(Boolean);
    const term = parts[0] || '';
    const def = parts.slice(1).join(' - ');

    const match = searchMedicalKnowledge(term)[0] || searchMedicalKnowledge(def)[0];
    if (match) {
      return { ...match, typicalDirections: def || match.typicalDirections };
    }

    return {
      genericName: term,
      typicalDirections: def,
    };
  }

  // Try dash-separated or colon-separated Quizlet flashcard text
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
      return {
        genericName: mainName,
        typicalDirections: parts.slice(1).join(' | '),
      };
    }
  }

  // Fallback: search dictionary directly
  const directMatch = searchMedicalKnowledge(cleaned)[0];
  if (directMatch) return directMatch;

  return { genericName: cleaned };
}
