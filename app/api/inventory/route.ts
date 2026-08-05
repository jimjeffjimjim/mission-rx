import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { originalSpreadsheetInventory as fullClinicItems } from '@/lib/spreadsheetFormulary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      } else if (!error && (!data || data.length === 0)) {
        // Automatically seed Supabase Cloud Postgres with initial clinic formulations if empty
        try {
          const seedPayload = fullClinicItems.map(item => ({
            id: item.id,
            shelf_location: item.shelfLocation,
            generic_name: item.genericName,
            brand_name: item.brandName,
            chemical_name: item.chemicalName,
            dosage: item.dosage,
            item_type: item.itemType,
            stock_unit: item.stockUnit,
            sub_unit: item.subUnit,
            bottles_available: item.bottlesAvailable,
            loose_units_available: item.looseUnitsAvailable,
            pills_per_bottle: item.pillsPerBottle,
            expiration_date: item.expirationDate,
            lot_numbers: item.lotNumbers,
            directions: item.directions,
          }));
          await supabase.from('inventory_items').insert(seedPayload);
          return NextResponse.json(fullClinicItems);
        } catch (seedErr) {
          console.warn('Auto-seed warning:', seedErr);
          return NextResponse.json(fullClinicItems);
        }
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
