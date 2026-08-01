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

      const id = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

      // 1. Mirror to Supabase cloud first if active
      if (supabase) {
        try {
          await supabase.from('inventory_items').insert([
            {
              id,
              generic_name: genericName,
              brand_name: brandName || null,
              chemical_name: chemicalName || null,
              dosage,
              item_type: itemType,
              shelf_location: shelfLocation,
              stock_unit: stockUnit,
              sub_unit: subUnit,
              bottles_available: bottlesAvailable,
              loose_units_available: looseUnitsAvailable,
              pills_per_bottle: pillsPerBottle,
              expiration_date: expirationDate,
              lot_numbers: lotNumbers,
              directions: directions || null,
            },
          ]);
        } catch (e) {
          console.warn('Supabase bulk sync warning:', e);
        }
      }

      // 2. Local SQLite backup
      let newItem: any = {
        id,
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
      };

      try {
        const dbItem = await prisma.inventoryItem.create({
          data: {
            id,
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
        if (dbItem) newItem = dbItem;
      } catch (e) {
        // Expected on serverless without SQLite write access
      }

      createdItems.push(newItem);
    }

    return NextResponse.json({ success: true, count: createdItems.length, items: createdItems });
  } catch (error: any) {
    console.error('Failed bulk inventory import:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
