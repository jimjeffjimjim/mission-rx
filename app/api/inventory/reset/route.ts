import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { originalSpreadsheetInventory } from '@/lib/spreadsheetFormulary';

export async function POST() {
  try {
    // NON-DESTRUCTIVE RESET: Only reset stock counts of default formulary items. 
    // Do NOT delete custom user-added medications!

    // 1. Reset counts in Supabase Cloud Postgres
    if (supabase) {
      try {
        const { data: existingItems, error: fetchErr } = await supabase
          .from('inventory_items')
          .select('*');

        if (!fetchErr && existingItems) {
          // Update default items back to initial counts; leave custom medications intact
          for (const orig of originalSpreadsheetInventory) {
            const existing = existingItems.find(
              (i: any) => i.id === orig.id || (i.generic_name === orig.genericName && i.shelf_location === orig.shelfLocation)
            );
            if (existing) {
              await supabase
                .from('inventory_items')
                .update({
                  bottles_available: orig.bottlesAvailable,
                  loose_units_available: orig.looseUnitsAvailable,
                  pills_per_bottle: orig.pillsPerBottle,
                })
                .eq('id', existing.id);
            } else {
              // If default item was missing from database, insert it
              await supabase.from('inventory_items').insert([{
                id: orig.id,
                shelf_location: orig.shelfLocation,
                generic_name: orig.genericName,
                brand_name: orig.brandName || null,
                chemical_name: orig.chemicalName || null,
                dosage: orig.dosage,
                item_type: orig.itemType,
                stock_unit: orig.stockUnit,
                sub_unit: orig.subUnit,
                bottles_available: orig.bottlesAvailable,
                loose_units_available: orig.looseUnitsAvailable,
                pills_per_bottle: orig.pillsPerBottle,
                expiration_date: orig.expirationDate,
                lot_numbers: orig.lotNumbers,
                directions: orig.directions,
              }]);
            }
          }
        }
      } catch (e) {
        console.warn('Supabase non-destructive reset warning:', e);
      }
    }

    // 2. Reset counts in local Prisma SQLite without deleting user-added medications
    try {
      const existingPrismaItems = await prisma.inventoryItem.findMany();
      for (const orig of originalSpreadsheetInventory) {
        const existing = existingPrismaItems.find(
          (i) => i.id === orig.id || (i.genericName === orig.genericName && i.shelfLocation === orig.shelfLocation)
        );
        if (existing) {
          await prisma.inventoryItem.update({
            where: { id: existing.id },
            data: {
              bottlesAvailable: orig.bottlesAvailable,
              looseUnitsAvailable: orig.looseUnitsAvailable,
              pillsPerBottle: orig.pillsPerBottle,
            },
          });
        } else {
          await prisma.inventoryItem.create({
            data: {
              id: orig.id,
              genericName: orig.genericName,
              brandName: orig.brandName || null,
              chemicalName: orig.chemicalName || null,
              dosage: orig.dosage,
              itemType: orig.itemType as any,
              shelfLocation: orig.shelfLocation,
              stockUnit: orig.stockUnit,
              subUnit: orig.subUnit,
              bottlesAvailable: orig.bottlesAvailable,
              looseUnitsAvailable: orig.looseUnitsAvailable,
              pillsPerBottle: orig.pillsPerBottle,
              expirationDate: orig.expirationDate,
              lotNumbers: orig.lotNumbers,
              directions: orig.directions,
            },
          });
        }
      }
    } catch (e) {
      // Expected on read-only serverless runtimes
    }

    // Return the updated full inventory (including preserved custom items)
    let finalItems: any[] = [];
    if (supabase) {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .order('shelf_location', { ascending: true })
        .order('generic_name', { ascending: true });
      if (data) {
        finalItems = data.map((item: any) => ({
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
      }
    }
    if (finalItems.length === 0) {
      finalItems = await prisma.inventoryItem
        .findMany({ orderBy: [{ shelfLocation: 'asc' }, { genericName: 'asc' }] })
        .catch(() => originalSpreadsheetInventory);
    }

    return NextResponse.json({ success: true, count: finalItems.length, items: finalItems });
  } catch (error: any) {
    console.error('Failed to reset stock counts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

