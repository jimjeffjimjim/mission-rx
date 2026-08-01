import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read seed file
    const seedPath = path.join(process.cwd(), 'prisma', 'meyer_full_clinic_drugs.json');
    if (!fs.existsSync(seedPath)) {
      return NextResponse.json({ error: 'Seed file not found' }, { status: 404 });
    }

    const fileData = fs.readFileSync(seedPath, 'utf8');
    const rawItems = JSON.parse(fileData);

    // 1. Reset Supabase Cloud Postgres
    if (supabase) {
      try {
        await supabase.from('inventory_items').delete().neq('id', 'non-existent');
      } catch (e) {
        console.warn('Supabase reset clear warning:', e);
      }
    }

    // 2. Reset Prisma SQLite
    await prisma.inventoryItem.deleteMany({}).catch(() => null);

    const created = [];
    let idx = 1;
    for (const item of rawItems) {
      const id = item.id || `meyer-${idx++}`;
      const genericName = item.genericName || item.inventoryItem || 'Clinic Medication';
      const brandName = item.brandName || '';
      const chemicalName = item.chemicalName || '';
      const dosage = item.dosage || item.strength || 'Standard Dose';
      const shelfLocation = item.shelfLocation || 'General Medical';
      const stockUnit = item.stockUnit || 'Bottles';
      const subUnit = item.subUnit || 'tablets';
      const bottlesAvailable = Number(item.startingStock) || Number(item.currentStock) || 10;
      const looseUnitsAvailable = Number(item.looseUnitsAvailable) || 0;
      const pillsPerBottle = Number(item.pillsPerBottle) || 100;
      const expirationDate = item.expirationDate || '2028-12-31';
      const lotNumbers = JSON.stringify(item.lot ? [item.lot] : ['LOT-MEYER']);
      const directions = item.directions || '';

      // Insert to Supabase Cloud
      if (supabase) {
        try {
          await supabase.from('inventory_items').insert([
            {
              id,
              shelf_location: shelfLocation,
              generic_name: genericName,
              brand_name: brandName,
              chemical_name: chemicalName,
              dosage,
              item_type: 'MEDICATION',
              stock_unit: stockUnit,
              sub_unit: subUnit,
              bottles_available: bottlesAvailable,
              loose_units_available: looseUnitsAvailable,
              pills_per_bottle: pillsPerBottle,
              expiration_date: expirationDate,
              lot_numbers: lotNumbers,
              directions,
            },
          ]);
        } catch (e) {
          // Fallback
        }
      }

      // Insert to Prisma SQLite
      const newItem = await prisma.inventoryItem.create({
        data: {
          id,
          genericName,
          brandName,
          chemicalName,
          dosage,
          itemType: 'MEDICATION',
          shelfLocation,
          stockUnit,
          subUnit,
          bottlesAvailable,
          looseUnitsAvailable,
          pillsPerBottle,
          expirationDate,
          lotNumbers,
          directions,
        },
      }).catch(() => null);

      created.push(newItem || { id, genericName });
    }

    return NextResponse.json({ success: true, count: created.length, items: created });
  } catch (error: any) {
    console.error('Failed to reset inventory to start:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
