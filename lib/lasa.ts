export interface LASAAlert {
  drugName: string;
  tallManName: string;
  confusedWith: string;
  tallManConfusedWith: string;
  clinicalWarning: string;
}

export const LASA_REGISTRY: LASAAlert[] = [
  {
    drugName: 'Hydralazine',
    tallManName: 'hydra-LAA-zine',
    confusedWith: 'Hydroxyzine',
    tallManConfusedWith: 'hydra-O-zine',
    clinicalWarning: 'Severe risk of hypotension if vasodilator hydra-LAA-zine is accidentally administered instead of antihistamine/anxiolytic hydra-O-zine.'
  },
  {
    drugName: 'Hydroxyzine',
    tallManName: 'hydra-O-zine',
    confusedWith: 'Hydralazine',
    tallManConfusedWith: 'hydra-LAA-zine',
    clinicalWarning: 'Verify order: hydra-O-zine is an antihistamine; do not confuse with cardiovascular medication hydra-LAA-zine.'
  },
  {
    drugName: 'Bupropion',
    tallManName: 'bu-PRO-pi-on',
    confusedWith: 'Buspirone',
    tallManConfusedWith: 'bu-SPI-rone',
    clinicalWarning: 'bu-PRO-pi-on is an antidepressant (NDRI) with seizure risks at high doses, whereas bu-SPI-rone is an anxiolytic.'
  },
  {
    drugName: 'Buspirone',
    tallManName: 'bu-SPI-rone',
    confusedWith: 'Bupropion',
    tallManConfusedWith: 'bu-PRO-pi-on',
    clinicalWarning: 'bu-SPI-rone is indicated for generalized anxiety disorder; do not dispense in place of antidepressant bu-PRO-pi-on.'
  },
  {
    drugName: 'Clobetasol',
    tallManName: 'clo-BE-ta-sol',
    confusedWith: 'Clotrimazole',
    tallManConfusedWith: 'clo-TRI-ma-zole',
    clinicalWarning: 'clo-BE-ta-sol is an ultra-high potency steroid (can exacerbate fungal infections), whereas clo-TRI-ma-zole is an antifungal.'
  },
  {
    drugName: 'Clotrimazole',
    tallManName: 'clo-TRI-ma-zole',
    confusedWith: 'Clobetasol',
    tallManConfusedWith: 'clo-BE-ta-sol',
    clinicalWarning: 'clo-TRI-ma-zole is an antifungal cream; do not confuse with topical corticosteroid clo-BE-ta-sol.'
  },
  {
    drugName: 'Amoxicillin',
    tallManName: 'a-MOX-i-cil-lin',
    confusedWith: 'Ampicillin',
    tallManConfusedWith: 'am-pi-CIL-lin',
    clinicalWarning: 'Verify antibiotic selection and formulation between oral a-MOX-i-cil-lin and am-pi-CIL-lin.'
  },
  {
    drugName: 'Epinephrine',
    tallManName: 'e-pi-NEPH-rine',
    confusedWith: 'Ephedrine',
    tallManConfusedWith: 'e-PHED-rine',
    clinicalWarning: 'CRITICAL EMERGENCY WARNING: Do not confuse emergency anaphylaxis drug e-pi-NEPH-rine with vasopressor e-PHED-rine.'
  },
  {
    drugName: 'Cefazolin',
    tallManName: 'ce-FAZ-o-lin',
    confusedWith: 'Ceftriaxone / Cephradine',
    tallManConfusedWith: 'cef-TRI-ax-one / ce-PHRA-dine',
    clinicalWarning: 'Verify generation and dosing frequency among cephalosporin class antibacterials.'
  },
  {
    drugName: 'Ceftriaxone',
    tallManName: 'cef-TRI-ax-one',
    confusedWith: 'Cefazolin / Cefotaxime',
    tallManConfusedWith: 'ce-FAZ-o-lin / cef-o-TAX-ime',
    clinicalWarning: 'Verify specific third-generation cephalosporin indication; avoid IV calcium co-administration with cef-TRI-ax-one.'
  },
  {
    drugName: 'Fluocinonide',
    tallManName: 'flu-o-CIN-o-nide',
    confusedWith: 'Fluocinolone',
    tallManConfusedWith: 'flu-o-CIN-o-lone',
    clinicalWarning: 'Potency variance: flu-o-CIN-o-nide is a high-potency corticosteroid, whereas flu-o-CIN-o-lone is typically low-to-medium potency.'
  },
  {
    drugName: 'Clindamycin',
    tallManName: 'clin-da-MY-cin',
    confusedWith: 'Clithromycin / Erythromycin',
    tallManConfusedWith: 'cla-ri-thro-MY-cin',
    clinicalWarning: 'Distinguish lincosamide class (clin-da-MY-cin, risk of C. diff) from macrolide antibiotics (cla-ri-thro-MY-cin).'
  },
  {
    drugName: 'Albuterol',
    tallManName: 'al-BU-ter-ol',
    confusedWith: 'Albumin / Atenolol',
    tallManConfusedWith: 'al-BU-min / a-TEN-o-lol',
    clinicalWarning: 'Verify inhaled bronchodilator al-BU-ter-ol versus systemic cardio/fluid medications.'
  }
];

export function checkLASA(drugName: string | null | undefined): LASAAlert | undefined {
  if (!drugName) return undefined;
  const normalized = drugName.toLowerCase().trim();
  return LASA_REGISTRY.find(
    (alert) =>
      normalized.includes(alert.drugName.toLowerCase()) ||
      normalized.includes(alert.tallManName.toLowerCase().replace(/[^a-z]/gi, '')) ||
      alert.drugName.toLowerCase().includes(normalized)
  );
}
