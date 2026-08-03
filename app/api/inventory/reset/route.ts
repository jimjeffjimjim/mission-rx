import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { originalSpreadsheetInventory } from '@/lib/spreadsheetFormulary';

export async function POST() {
  try {
    // 1. Clear Supabase Cloud Postgres table
    if (supabase) {
      try {
        await supabase.from('inventory_items').delete().neq('id', 'none');
      } catch (e) {
        console.warn('Supabase reset clear warning:', e);
      }
    }

    // 2. Clear local Prisma SQLite database
    await prisma.inventoryItem.deleteMany({}).catch(() => null);

    const cloudRows = originalSpreadsheetInventory.map((item) => ({
      id: item.id,
      shelf_location: item.shelfLocation,
      generic_name: item.genericName,
      brand_name: item.brandName || null,
      chemical_name: item.chemicalName || null,
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

    // 3. Batch insert into Supabase Cloud Postgres
    if (supabase) {
      try {
        await supabase.from('inventory_items').insert(cloudRows);
      } catch (e) {
        console.warn('Supabase cloud reset batch insert warning:', e);
      }
    }

    // 4. Fallback/Local backup insertion into Prisma SQLite
    const created = [];
    for (const item of originalSpreadsheetInventory) {
      const newItem = await prisma.inventoryItem.create({
        data: {
          id: item.id,
          genericName: item.genericName,
          brandName: item.brandName || null,
          chemicalName: item.chemicalName || null,
          dosage: item.dosage,
          itemType: item.itemType as any,
          shelfLocation: item.shelfLocation,
          stockUnit: item.stockUnit,
          subUnit: item.subUnit,
          bottlesAvailable: item.bottlesAvailable,
          looseUnitsAvailable: item.looseUnitsAvailable,
          pillsPerBottle: item.pillsPerBottle,
          expirationDate: item.expirationDate,
          lotNumbers: item.lotNumbers,
          directions: item.directions,
        },
      }).catch(() => null);

      created.push(newItem || item);
    }

    return NextResponse.json({ success: true, count: originalSpreadsheetInventory.length, items: originalSpreadsheetInventory });
  } catch (error: any) {
    console.error('Failed to reset inventory to start:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

