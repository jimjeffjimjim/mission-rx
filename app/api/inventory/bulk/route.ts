import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const items = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Array of items required' }, { status: 400 });
    }

    const createdItems = [];

    for (const itemData of items) {
      const genericName = itemData.genericName || 'Unspecified Formulation';
      const dosage = itemData.dosage || 'Standard Strength';
      const shelfLocation = itemData.shelfLocation || 'General Medical';
      const brandName = itemData.brandName || '';
      const chemicalName = itemData.chemicalName || '';
      const itemType = itemData.itemType || 'MEDICATION';
      const stockUnit = itemData.stockUnit || 'Bottles';
      const subUnit = itemData.subUnit || 'tablets';
      const bottlesAvailable = Number(itemData.bottlesAvailable) || 0;
      const looseUnitsAvailable = Number(itemData.looseUnitsAvailable) || 0;
      const pillsPerBottle = Number(itemData.pillsPerBottle) || 100;
      const expirationDate = itemData.expirationDate || '2028-12-31';
      const lotNumbers = typeof itemData.lotNumbers === 'string' ? itemData.lotNumbers : JSON.stringify(itemData.lotNumbers || []);
      const directions = itemData.directions || '';

      const newItem = await prisma.inventoryItem.create({
        data: {
          genericName,
          brandName,
          chemicalName,
          dosage,
          itemType,
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
      });

      // Mirror to Supabase cloud if active
      if (supabase) {
        try {
          await supabase.from('inventory_items').insert([
            {
              id: newItem.id,
              generic_name: newItem.genericName,
              brand_name: newItem.brandName,
              chemical_name: newItem.chemicalName,
              dosage: newItem.dosage,
              item_type: newItem.itemType,
              shelf_location: newItem.shelfLocation,
              stock_unit: newItem.stockUnit,
              sub_unit: newItem.subUnit,
              bottles_available: newItem.bottlesAvailable,
              loose_units_available: newItem.looseUnitsAvailable,
              pills_per_bottle: newItem.pillsPerBottle,
              expiration_date: newItem.expirationDate,
              lot_numbers: newItem.lotNumbers,
              directions: newItem.directions,
            },
          ]);
        } catch (e) {
          console.warn('Supabase bulk sync warning:', e);
        }
      }

      createdItems.push(newItem);
    }

    return NextResponse.json({ success: true, count: createdItems.length, items: createdItems });
  } catch (error: any) {
    console.error('Failed bulk inventory import:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
