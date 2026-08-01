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
    genericName: 'Aripiprazole',
    brandName: 'Abilify',
    chemicalName: 'Atypical Antipsychotic (D2 Partial Agonist)',
    category: 'Psychiatry',
    defaultDosage: '10 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take as directed by provider. Take at the same time each day.',
    contraindications: 'Black Box Warning: Increased risk of suicidal thinking and behavior in young adults. Monitor for metabolic symptoms and tardive dyskinesia.'
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
    contraindications: 'Contraindicated in patients with seizure disorders, bulimia or anorexia nervosa, or abrupt discontinuation of alcohol or benzodiazepines.'
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
    contraindications: 'Contraindicated with concomitant MAOI use or within 14 days of MAOI discontinuation. Monitor for serotonin syndrome.'
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
    contraindications: 'Contraindicated with strong CYP3A4 inhibitors (e.g., ketoconazole) and strong CYP3A4 inducers (e.g., rifampin, St. John\'s Wort).'
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
    contraindications: 'May cause sedation, orthostatic hypotension, and metabolic changes. Monitor HbA1c and lipid panel periodically.'
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
    contraindications: 'Strictly contraindicated in patients with known severe penicillin or beta-lactam hypersensitivity/anaphylaxis.'
  },
  {
    genericName: 'Amoxicillin/Clavulanic Acid',
    brandName: 'Augmentin',
    chemicalName: 'Beta-Lactam Penicillin Antibiotic + Beta-Lactamase Inhibitor',
    category: 'General Medical',
    defaultDosage: '875/125 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth every 12 hours with meal or snack to prevent GI discomfort.',
    contraindications: 'History of penicillin allergy or cholestatic jaundice/hepatic malfunction associated with amoxicillin-clavulanate.'
  },
  {
    genericName: 'Ciprofloxacin HCl',
    brandName: 'Cipro',
    chemicalName: 'Fluoroquinolone Antibiotic',
    category: 'General Medical',
    defaultDosage: '500 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth every 12 hours with plenty of water. Separate from calcium/magnesium antacids or dairy.',
    contraindications: 'Black Box Warning: Increased risk of tendonitis and tendon rupture, peripheral neuropathy, and CNS effects.'
  },
  {
    genericName: 'Doxycycline Hyclate',
    brandName: 'Vibramycin / Vibra-Tabs',
    chemicalName: 'Tetracycline Class Broad-Spectrum Antibiotic',
    category: 'General Medical',
    defaultDosage: '100 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth twice daily with full glass of water. Remain upright for at least 30 minutes after dosing.',
    contraindications: 'Avoid in pregnancy, lactation, and children under 8 years due to permanent tooth discoloration and bone inhibition.'
  },
  {
    genericName: 'Epinephrine Injectable',
    brandName: 'EpiPen / Adrenalin',
    chemicalName: 'Alpha- and Beta-Adrenergic Receptor Agonist',
    category: 'Allergy & Asthma',
    defaultDosage: '1 mg/ml Auto-Injector (0.3 mg dose)',
    defaultUnit: 'Vials',
    defaultSubUnit: 'injectors',
    typicalDirections: 'Inject intramuscularly directly into anterolateral thigh immediately upon onset of acute systemic allergic response / anaphylaxis.',
    contraindications: 'No definitive absolute contraindications during life-threatening anaphylaxis. Use caution with concurrent cardiothoracic stressors.'
  },
  {
    genericName: 'Albuterol Sulfate Inhaler',
    brandName: 'ProAir HFA / Ventolin HFA',
    chemicalName: 'Short-Acting Beta2-Agonist (SABA)',
    category: 'Allergy & Asthma',
    defaultDosage: '90 mcg / actuation (200 inhalations)',
    defaultUnit: 'Canisters',
    defaultSubUnit: 'inhalers',
    typicalDirections: 'Inhale 1-2 puffs by mouth every 4-6 hours as needed for bronchospasm or wheezing.',
    contraindications: 'Hypersensitivity to albuterol or milk proteins (for dry powder formulations). May induce reflex tachycardia.'
  },
  {
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin',
    chemicalName: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '200 mg Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1-2 tablets by mouth every 4-6 hours with food as needed for pain or fever (Maximum 1,200 mg/day OTC).',
    contraindications: 'Avoid in active peptic ulcer disease, acute renal injury, severe uncontrolled hypertension, or third-trimester pregnancy.'
  },
  {
    genericName: 'Hydrocortisone Ointment',
    brandName: 'Cortizone 10',
    chemicalName: 'Low-Potency Topical Corticosteroid',
    category: 'Over-The-Counter (OTC)',
    defaultDosage: '1% Ointment',
    defaultUnit: 'Tubes',
    defaultSubUnit: 'tubes',
    typicalDirections: 'Apply sparingly to affected skin up to 3-4 times daily for mild pruritus or inflammation.',
    contraindications: 'Do not use on undiagnosed bacterial, fungal, or viral skin infection without proper concomitant antimicrobial therapy.'
  },
  {
    genericName: 'Clindamycin HCl',
    brandName: 'Cleocin',
    chemicalName: 'Lincosamide Antibiotic',
    category: 'General Medical',
    defaultDosage: '300 mg Capsule',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'capsules',
    typicalDirections: 'Take 1 capsule by mouth every 6 hours with a full glass of water.',
    contraindications: 'Black Box Warning: Associated with severe pseudomammous colitis caused by Clostridioides difficile. Discontinue immediately if persistent diarrhea occurs.'
  },
  {
    genericName: 'Fluconazole',
    brandName: 'Diflucan',
    chemicalName: 'Triazole Antifungal Agent',
    category: 'General Medical',
    defaultDosage: '150 mg Oral Tablet',
    defaultUnit: 'Bottles',
    defaultSubUnit: 'tablets',
    typicalDirections: 'Take 1 tablet by mouth as a single dose for uncomplicated candidiasis.',
    contraindications: 'Contraindicated with medications known to prolong QTc interval that are metabolized by CYP3A4 (e.g., quinidine, pimozide, erythromycin).'
  },
  {
    genericName: 'Cefazolin Sodium',
    brandName: 'Ancef / Kefazol',
    chemicalName: 'First-Generation Cephalosporin Antibiotic',
    category: 'General Medical',
    defaultDosage: '1 g Powder for Injection',
    defaultUnit: 'Vials',
    defaultSubUnit: 'vials',
    typicalDirections: 'Reconstitute and administer intravenously or intramuscularly as directed by clinical protocol.',
    contraindications: 'Known severe immediate hypersensitivity (e.g., anaphylaxis) to cephalosporin antibiotics or severe penicillin reactions.'
  },
  {
    genericName: 'Ceftriaxone Sodium',
    brandName: 'Rocephin',
    chemicalName: 'Third-Generation Cephalosporin Antibiotic',
    category: 'General Medical',
    defaultDosage: '250 mg Powder for Injection',
    defaultUnit: 'Vials',
    defaultSubUnit: 'vials',
    typicalDirections: 'Reconstitute and inject intramuscularly or intravenously as directed by clinical protocol.',
    contraindications: 'Contraindicated in hyperbilirubinemic neonates and with concomitant IV calcium administration due to risk of precipitation.'
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
