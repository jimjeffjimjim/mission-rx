import { describe, it, expect } from 'vitest';
import { matchesClinicalQuery, searchSemanticFormulary } from '@/lib/smartSearch';
import { InventoryItem } from '@/types/inventory';

const mockInventory: InventoryItem[] = [
  {
    id: 'item-amox-500',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '500 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 10,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AMOX-500'],
  },
  {
    id: 'item-amox-250',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosage: '250 mg Capsule',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Penicillin-Class Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 5,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AMOX-250'],
  },
  {
    id: 'item-acetaminophen',
    genericName: 'Acetaminophen / Paracetamol',
    brandName: 'Tylenol',
    dosage: '500 mg Extra Strength Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Analgesic and Antipyretic',
    itemType: 'MEDICATION',
    bottlesAvailable: 20,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-TYL-500'],
  },
  {
    id: 'item-ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin IB',
    dosage: '200 mg Tablet',
    shelfLocation: 'Over-The-Counter (OTC)',
    chemicalName: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    itemType: 'MEDICATION',
    bottlesAvailable: 15,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-IBU-200'],
  },
  {
    id: 'item-mupirocin',
    genericName: 'Mupirocin',
    brandName: 'Bactroban',
    dosage: '2% Topical Ointment',
    shelfLocation: 'Dermatology',
    chemicalName: 'Topical Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 8,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-MUP-02'],
  },
  {
    id: 'item-azithro',
    genericName: 'Azithromycin',
    brandName: 'Zithromax / Z-Pak',
    dosage: '250 mg Tablet',
    shelfLocation: 'Infectious Disease',
    chemicalName: 'Macrolide Antibacterial',
    itemType: 'MEDICATION',
    bottlesAvailable: 12,
    looseUnitsAvailable: 0,
    pillsPerBottle: 6,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-AZI-250'],
  },
  {
    id: 'item-atorva',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    dosage: '20 mg Oral Tablet',
    shelfLocation: 'Cardiology',
    chemicalName: 'HMG-CoA Reductase Inhibitor',
    itemType: 'MEDICATION',
    bottlesAvailable: 14,
    looseUnitsAvailable: 0,
    pillsPerBottle: 90,
    expirationDate: '2028-12-31',
    lotNumbers: ['LOT-ATOR-20'],
  },
  {
    id: 'item-bp-cuff',
    genericName: 'Blood Pressure Cuff Adult',
    brandName: 'Welch Allyn Sphygmomanometer',
    dosage: 'Standard Adult 2-Tube',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
    bottlesAvailable: 4,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '3000-01-01',
    lotNumbers: ['N/A'],
  },
  {
    id: 'item-pulse-ox',
    genericName: 'Fingertip Pulse Oximeter',
    brandName: 'Nonin Onyx',
    dosage: 'Digital SpO2 Monitor',
    shelfLocation: 'Supplies',
    chemicalName: 'Diagnostic Device',
    itemType: 'Supply',
    bottlesAvailable: 6,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '3000-01-01',
    lotNumbers: ['N/A'],
  },
  {
    id: 'item-suture-kit',
    genericName: 'Suture Removal Kit Sterile',
    brandName: 'Dynarex',
    dosage: 'Stainless Steel Instruments',
    shelfLocation: 'Supplies',
    chemicalName: 'Surgical Supply',
    itemType: 'Supply',
    bottlesAvailable: 25,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '2029-06-30',
    lotNumbers: ['LOT-SUT-88'],
  },
];

describe('Smart Search & Clinical Relevancy', () => {
  it('resolves brand to generic names (Tylenol, Advil, Bactroban, Zithromax)', () => {
    const tylenolMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Tylenol').isMatch);
    expect(tylenolMatch?.id).toBe('item-acetaminophen');

    const advilMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Advil').isMatch);
    expect(advilMatch?.id).toBe('item-ibuprofen');

    const bactrobanMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Bactroban').isMatch);
    expect(bactrobanMatch?.id).toBe('item-mupirocin');

    const zithroMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'Zithromax').isMatch);
    expect(zithroMatch?.id).toBe('item-azithro');
  });

  it('handles multi-token order independence', () => {
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

    expect(resultsQ1[0].item.id).toBe('item-amox-500');
    expect(resultsQ2[0].item.id).toBe('item-amox-500');
  });

  it('tolerates common clinical typos', () => {
    const typoResult1 = mockInventory.find((i) => matchesClinicalQuery(i, 'amoxcillin').isMatch);
    expect(typoResult1?.genericName).toBe('Amoxicillin');

    const typoResult2 = mockInventory.find((i) => matchesClinicalQuery(i, 'lipator').isMatch);
    expect(typoResult2?.id).toBe('item-atorva');
  });

  it('matches medical equipment and clinical shorthand', () => {
    const cuffMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'bp cuff').isMatch);
    expect(cuffMatch?.id).toBe('item-bp-cuff');

    const oximeterMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'oximeter').isMatch);
    expect(oximeterMatch?.id).toBe('item-pulse-ox');

    const sutureMatch = mockInventory.find((i) => matchesClinicalQuery(i, 'suture').isMatch);
    expect(sutureMatch?.id).toBe('item-suture-kit');
  });

  it('supports instant dynamic item addition without re-indexing', () => {
    const dynamicallyAddedItem: InventoryItem = {
      id: 'item-novel-live-123',
      genericName: 'Semaglutide',
      brandName: 'Ozempic',
      dosage: '0.5 mg/0.37 mL Pen',
      shelfLocation: 'General Medical',
      chemicalName: 'GLP-1 Receptor Agonist',
      itemType: 'MEDICATION',
      bottlesAvailable: 3,
      looseUnitsAvailable: 0,
      pillsPerBottle: 1,
      expirationDate: '2029-01-01',
      lotNumbers: ['LOT-SEMA-LIVE'],
    };

    const updatedList = [...mockInventory, dynamicallyAddedItem];
    const liveMatchOzempic = updatedList.find((i) => matchesClinicalQuery(i, 'Ozempic').isMatch);
    expect(liveMatchOzempic?.id).toBe('item-novel-live-123');

    const liveMatchPen = updatedList.find((i) => matchesClinicalQuery(i, 'semaglutide pen').isMatch);
    expect(liveMatchPen?.id).toBe('item-novel-live-123');
  });

  it('supports searchSemanticFormulary backward compatibility', () => {
    const semanticResults = searchSemanticFormulary('amox 500', 0.3, 10, mockInventory);
    expect(semanticResults.length).toBeGreaterThan(0);
    expect(semanticResults[0].id).toBe('item-amox-500');
  });
});
