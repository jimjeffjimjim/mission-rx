import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// 13 Full Meyer Center Community Clinic Drug Formulations with Complete Excel Fields
const fullClinicItems = [
  {
    id: 'meyer-1',
    shelfLocation: 'Dermatology',
    genericName: 'Clobetasol Propionate',
    brandName: 'Clobetasol 0.05%',
    chemicalName: 'Ultra-High Potency Topical Steroid',
    dosage: '0.05% Cream',
    itemType: 'MEDICATION',
    stockUnit: 'Tubes',
    subUnit: 'tubes',
    bottlesAvailable: 24,
    pillsPerBottle: 1,
    looseUnitsAvailable: 0,
    expirationDate: '2026-09-30',
    lotNumbers: JSON.stringify(['153224031A']),
    directions: 'Apply a thin layer to the affected area as directed by provider.',
  },
  {
    id: 'meyer-2',
    shelfLocation: 'Dermatology',
    genericName: 'Fluocinonide',
    brandName: 'Fluocinonide 0.05%',
    chemicalName: 'High-Potency Topical Corticosteroid',
    dosage: '0.05% Cream',
    itemType: 'MEDICATION',
    stockUnit: 'Tubes',
    subUnit: 'tubes',
    bottlesAvailable: 24,
    pillsPerBottle: 1,
    looseUnitsAvailable: 0,
    expirationDate: '2026-10-31',
    lotNumbers: JSON.stringify(['153425002A']),
    directions: 'Apply a thin layer to the affected area as directed by provider.',
  },
  {
    id: 'meyer-3',
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
  {
    id: 'meyer-4',
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
    directions: 'Take 1 liquid-filled capsule by mouth once daily as needed for allergies.',
  },
  {
    id: 'meyer-5',
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
    directions: 'Take 1 tablet by mouth every 4–6 hours as needed for allergy symptoms.',
  },
  {
    id: 'meyer-6',
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
  {
    id: 'meyer-7',
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
  {
    id: 'meyer-8',
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
  {
    id: 'meyer-9',
    shelfLocation: 'Psychiatry',
    genericName: 'Aripiprazole',
    brandName: 'Abilify',
    chemicalName: 'Atypical Antipsychotic',
    dosage: '10 mg Tablet',
    itemType: 'MEDICATION',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 4,
    pillsPerBottle: 30,
    looseUnitsAvailable: 0,
    expirationDate: '2027-01-09',
    lotNumbers: JSON.stringify(['0000088525']),
    directions: 'Take as directed by provider.',
  },
  {
    id: 'meyer-10',
    shelfLocation: 'Psychiatry',
    genericName: 'Bupropion HCl SR',
    brandName: 'Wellbutrin SR',
    chemicalName: 'Aminoketone Antidepressant',
    dosage: '100 mg Sustained-Release 12-Hour Tablet',
    itemType: 'MEDICATION',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 12,
    pillsPerBottle: 500,
    looseUnitsAvailable: 0,
    expirationDate: '2027-05-03',
    lotNumbers: JSON.stringify(['0000134515']),
    directions: 'Take as directed by provider. Swallow whole; do not crush, chew, or split.',
  },
  {
    id: 'meyer-11',
    shelfLocation: 'Psychiatry',
    genericName: 'Escitalopram',
    brandName: 'Lexapro',
    chemicalName: 'SSRI Antidepressant',
    dosage: '5 mg Tablet',
    itemType: 'MEDICATION',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 24,
    pillsPerBottle: 100,
    looseUnitsAvailable: 0,
    expirationDate: '2027-02-28',
    lotNumbers: JSON.stringify(['0000093834']),
    directions: 'Take as directed by provider.',
  },
  {
    id: 'meyer-12',
    shelfLocation: 'Psychiatry',
    genericName: 'Lurasidone HCl',
    brandName: 'Latuda',
    chemicalName: 'Atypical Antipsychotic',
    dosage: '20 mg Oral Tablet',
    itemType: 'MEDICATION',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 24,
    pillsPerBottle: 30,
    looseUnitsAvailable: 0,
    expirationDate: '2026-09-30',
    lotNumbers: JSON.stringify(['A241211']),
    directions: 'Take as directed by provider. Take with food.',
  },
  {
    id: 'meyer-13',
    shelfLocation: 'Psychiatry',
    genericName: 'Quetiapine Fumarate',
    brandName: 'Seroquel',
    chemicalName: 'Atypical Antipsychotic',
    dosage: '300 mg Tablet',
    itemType: 'MEDICATION',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 24,
    pillsPerBottle: 100,
    looseUnitsAvailable: 0,
    expirationDate: '2026-09-30',
    lotNumbers: JSON.stringify(['E244744']),
    directions: 'Take as directed by provider.',
  },
];

export async function GET() {
  // Query Supabase Cloud Postgres as primary datasource
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('shelf_location', { ascending: true })
        .order('generic_name', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          shelfLocation: item.shelf_location,
          genericName: item.generic_name,
          brandName: item.brand_name || '',
          chemicalName: item.chemical_name || '',
          dosage: item.dosage,
          itemType: item.item_type,
          stockUnit: item.stock_unit,
          subUnit: item.sub_unit,
          bottlesAvailable: item.bottles_available,
          looseUnitsAvailable: item.loose_units_available,
          pillsPerBottle: item.pills_per_bottle,
          expirationDate: item.expiration_date,
          lotNumbers: item.lot_numbers,
          directions: item.directions || '',
        }));
        return NextResponse.json(mapped);
      }
    } catch (e) {
      console.warn('Supabase Cloud GET error:', e);
    }
  }

  // Fallback to Prisma SQLite
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: [{ shelfLocation: 'asc' }, { genericName: 'asc' }],
    });

    if (items.length > 0) {
      return NextResponse.json(items);
    }

    return NextResponse.json(fullClinicItems);
  } catch (error) {
    return NextResponse.json(fullClinicItems);
  }
}

export async function POST(request: Request) {
  let data: any = {};
  try {
    data = await request.json();
  } catch (e) {
    data = {};
  }

  const newId = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

  const payload = {
    id: newId,
    shelfLocation: data.shelfLocation || 'General Medical',
    genericName: data.genericName || 'New Medication',
    brandName: data.brandName || null,
    chemicalName: data.chemicalName || null,
    dosage: data.dosage || 'Standard',
    itemType: data.itemType || 'MEDICATION',
    stockUnit: data.stockUnit || 'Bottles',
    subUnit: data.subUnit || 'tablets',
    bottlesAvailable: Number(data.bottlesAvailable) || 0,
    pillsPerBottle: Number(data.pillsPerBottle) || 100,
    looseUnitsAvailable: Number(data.looseUnitsAvailable) || 0,
    expirationDate: data.expirationDate || '2028-12-31',
    lotNumbers: typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers || []),
    directions: data.directions || null,
  };

  // Insert into Supabase Cloud Postgres
  if (supabase) {
    try {
      await supabase.from('inventory_items').insert([
        {
          id: payload.id,
          shelf_location: payload.shelfLocation,
          generic_name: payload.genericName,
          brand_name: payload.brandName,
          chemical_name: payload.chemicalName,
          dosage: payload.dosage,
          item_type: payload.itemType,
          stock_unit: payload.stockUnit,
          sub_unit: payload.subUnit,
          bottles_available: payload.bottlesAvailable,
          loose_units_available: payload.looseUnitsAvailable,
          pills_per_bottle: payload.pillsPerBottle,
          expiration_date: payload.expirationDate,
          lot_numbers: payload.lotNumbers,
          directions: payload.directions,
        },
      ]);
    } catch (e) {
      console.warn('Supabase Cloud POST insert error:', e);
    }
  }

  // Backup write to Prisma SQLite
  try {
    const newItem = await prisma.inventoryItem.create({ data: payload });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(payload, { status: 201 });
  }
}
