import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database inventory item count before seeding...');
  const existingCount = await prisma.inventoryItem.count();
  if (existingCount > 0) {
    console.log(`Database currently has ${existingCount} items. Skipping seed to preserve custom medications.`);
    return;
  }
  console.log('Seeding full Meyer Center Community Clinic Medication Formulary...');

  const fullMeyerClinicItems = [
    // 1. Clobetasol Propionate
    {
      shelfLocation: 'Dermatology',
      genericName: 'Clobetasol Propionate',
      brandName: 'Clobetasol 0.05%',
      chemicalName: 'Ultra-High Potency Topical Steroid',
      dosage: '0.05% Cream',
      itemType: 'Medication',
      stockUnit: 'Tubes',
      subUnit: 'tubes',
      bottlesAvailable: 24,
      pillsPerBottle: 1,
      looseUnitsAvailable: 0,
      expirationDate: '2026-09-30',
      lotNumbers: JSON.stringify(['153224031A']),
      directions: 'Apply a thin layer to the affected area as directed by provider.',
    },
    // 2. Fluocinonide
    {
      shelfLocation: 'Dermatology',
      genericName: 'Fluocinonide',
      brandName: 'Fluocinonide 0.05%',
      chemicalName: 'High-Potency Topical Corticosteroid',
      dosage: '0.05% Cream',
      itemType: 'Medication',
      stockUnit: 'Tubes',
      subUnit: 'tubes',
      bottlesAvailable: 24,
      pillsPerBottle: 1,
      looseUnitsAvailable: 0,
      expirationDate: '2026-10-31',
      lotNumbers: JSON.stringify(['153425002A']),
      directions: 'Apply a thin layer to the affected area as directed by provider.',
    },
    // 3. Cetirizine 10mg Tablets
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Cetirizine HCl',
      brandName: 'Zyrtec Allergy',
      chemicalName: 'Second-Generation Antihistamine',
      dosage: '10 mg Tablet',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 29,
      pillsPerBottle: 30,
      looseUnitsAvailable: 0,
      expirationDate: '2028-05-31',
      lotNumbers: JSON.stringify(['3495B1AA']),
      directions: 'Take 1 tablet by mouth once daily as needed for allergies. (Starting stock: 29 bottles × 30 tablets = 870 tablets)',
    },
    // 4. Cetirizine Liquid Gels
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Cetirizine Liquid Gels',
      brandName: 'Zyrtec Allergy Liquid-Filled',
      chemicalName: 'Second-Generation Antihistamine',
      dosage: '10 mg Liquid-Filled Capsule',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'capsules',
      bottlesAvailable: 16,
      pillsPerBottle: 25,
      looseUnitsAvailable: 0,
      expirationDate: '2027-07-31',
      lotNumbers: JSON.stringify(['3495B1AA']),
      directions: 'Take 1 liquid-filled capsule by mouth once daily as needed for allergies. (Starting stock: 16 bottles × 25 capsules = 400 capsules)',
    },
    // 5. Diphenhydramine HCl
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Diphenhydramine HCl',
      brandName: 'Benadryl Allergy',
      chemicalName: 'First-Generation Antihistamine',
      dosage: '25 mg Tablet',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 72,
      pillsPerBottle: 48,
      looseUnitsAvailable: 0,
      expirationDate: '2027-02-28',
      lotNumbers: JSON.stringify(['EEA191']),
      directions: 'Take 1 tablet by mouth every 4–6 hours as needed for allergy symptoms. (Starting stock: 72 bottles × 48 tablets = 3,456 tablets)',
    },
    // 6. Neutrogena Hydro Boost Cleanser
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Facial Cleanser',
      brandName: 'Neutrogena Hydro Boost Hydrating Gel Cleanser',
      chemicalName: 'Gel Cleanser Fragrance Free',
      dosage: '0.5 fl oz Gel Cleanser',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'bottles',
      bottlesAvailable: 10,
      pillsPerBottle: 1,
      looseUnitsAvailable: 0,
      expirationDate: '2027-02-28',
      lotNumbers: JSON.stringify(['1965B2CC']),
      directions: 'Use according to package labeling or provider instructions.',
    },
    // 7. Neutrogena Hydro Boost SPF 50
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Hyaluronic Acid Moisturizer with Sunscreen',
      brandName: 'Neutrogena Hydro Boost Sunscreen SPF 50',
      chemicalName: 'Sunscreen / Facial Moisturizer',
      dosage: 'SPF 50 / 1.7 fl oz Lotion',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'bottles',
      bottlesAvailable: 10,
      pillsPerBottle: 1,
      looseUnitsAvailable: 0,
      expirationDate: '2027-02-28',
      lotNumbers: JSON.stringify(['1965B2CC']),
      directions: 'Use according to package labeling or provider instructions.',
    },
    // 8. Neutrogena Collagen Bank SPF 30
    {
      shelfLocation: 'Over-The-Counter (OTC)',
      genericName: 'Sunscreen / Collagen Bank SPF Moisturizer',
      brandName: 'Neutrogena Collagen Bank SPF 30',
      chemicalName: 'Sunscreen / Collagen Moisturizer',
      dosage: 'SPF 30 / 2.7 fl oz Lotion',
      itemType: 'OTC',
      stockUnit: 'Bottles',
      subUnit: 'bottles',
      bottlesAvailable: 48,
      pillsPerBottle: 1,
      looseUnitsAvailable: 0,
      expirationDate: '2027-01-13',
      lotNumbers: JSON.stringify(['04425CA']),
      directions: 'Use according to package labeling or provider instructions.',
    },
    // 9. Aripiprazole
    {
      shelfLocation: 'Psychiatry',
      genericName: 'Aripiprazole',
      brandName: 'Abilify',
      chemicalName: 'Atypical Antipsychotic',
      dosage: '10 mg Tablet',
      itemType: 'Medication',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 4,
      pillsPerBottle: 30,
      looseUnitsAvailable: 0,
      expirationDate: '2027-01-09',
      lotNumbers: JSON.stringify(['0000088525']),
      directions: 'Take as directed by provider. (Starting stock: 4 bottles × 30 tablets = 120 tablets)',
    },
    // 10. Bupropion HCl SR
    {
      shelfLocation: 'Psychiatry',
      genericName: 'Bupropion HCl SR',
      brandName: 'Wellbutrin SR',
      chemicalName: 'Aminoketone Antidepressant',
      dosage: '100 mg Sustained-Release 12-Hour Tablet',
      itemType: 'Medication',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 12,
      pillsPerBottle: 500,
      looseUnitsAvailable: 0,
      expirationDate: '2027-05-03',
      lotNumbers: JSON.stringify(['0000134515']),
      directions: 'Take as directed by provider. Swallow whole; do not crush, chew, or split. (Starting stock: 12 bottles × 500 tablets = 6,000 tablets)',
    },
    // 11. Escitalopram
    {
      shelfLocation: 'Psychiatry',
      genericName: 'Escitalopram',
      brandName: 'Lexapro',
      chemicalName: 'SSRI Antidepressant',
      dosage: '5 mg Tablet',
      itemType: 'Medication',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 24,
      pillsPerBottle: 100,
      looseUnitsAvailable: 0,
      expirationDate: '2027-02-28',
      lotNumbers: JSON.stringify(['0000093834']),
      directions: 'Take as directed by provider. (Starting stock: 24 bottles × 100 tablets = 2,400 tablets)',
    },
    // 12. Lurasidone HCl
    {
      shelfLocation: 'Psychiatry',
      genericName: 'Lurasidone HCl',
      brandName: 'Latuda',
      chemicalName: 'Atypical Antipsychotic',
      dosage: '20 mg Oral Tablet',
      itemType: 'Medication',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 24,
      pillsPerBottle: 30,
      looseUnitsAvailable: 0,
      expirationDate: '2026-09-30',
      lotNumbers: JSON.stringify(['A241211']),
      directions: 'Take as directed by provider. Take with food. (Starting stock: 24 bottles × 30 tablets = 720 tablets)',
    },
    // 13. Quetiapine Fumarate
    {
      shelfLocation: 'Psychiatry',
      genericName: 'Quetiapine',
      brandName: 'Seroquel',
      chemicalName: 'Atypical Antipsychotic',
      dosage: '300 mg Tablet',
      itemType: 'Medication',
      stockUnit: 'Bottles',
      subUnit: 'tablets',
      bottlesAvailable: 24,
      pillsPerBottle: 100,
      looseUnitsAvailable: 0,
      expirationDate: '2026-09-30',
      lotNumbers: JSON.stringify(['E244744']),
      directions: 'Take as directed by provider. (Starting stock: 24 bottles × 100 tablets = 2,400 tablets)',
    },
  ];

  for (const item of fullMeyerClinicItems) {
    await prisma.inventoryItem.create({ data: item });
  }

  console.log(`Successfully seeded ${fullMeyerClinicItems.length} full Meyer Center Clinic drug items!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
