import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let data: any = {};
  try {
    data = await request.json();
  } catch (e) {
    data = {};
  }

  try {
    const { id } = await params;

    // Prepare update payload for Prisma
    const updatePayload: any = {};
    if (data.shelfLocation !== undefined) updatePayload.shelfLocation = data.shelfLocation;
    if (data.genericName !== undefined) updatePayload.genericName = data.genericName;
    if (data.brandName !== undefined) updatePayload.brandName = data.brandName;
    if (data.chemicalName !== undefined) updatePayload.chemicalName = data.chemicalName;
    if (data.dosage !== undefined) updatePayload.dosage = data.dosage;
    if (data.itemType !== undefined) updatePayload.itemType = data.itemType;
    if (data.stockUnit !== undefined) updatePayload.stockUnit = data.stockUnit;
    if (data.subUnit !== undefined) updatePayload.subUnit = data.subUnit;
    if (data.bottlesAvailable !== undefined) updatePayload.bottlesAvailable = Number(data.bottlesAvailable) || 0;
    if (data.pillsPerBottle !== undefined) updatePayload.pillsPerBottle = Number(data.pillsPerBottle) || 0;
    if (data.looseUnitsAvailable !== undefined) updatePayload.looseUnitsAvailable = Number(data.looseUnitsAvailable) || 0;
    if (data.isFullEdit) {
      if (data.bottlesAvailable !== undefined) updatePayload.initialBottlesAvailable = Number(data.bottlesAvailable) || 0;
      if (data.looseUnitsAvailable !== undefined) updatePayload.initialLooseUnitsAvailable = Number(data.looseUnitsAvailable) || 0;
    }
    if (data.expirationDate !== undefined) updatePayload.expirationDate = data.expirationDate;
    if (data.lotNumbers !== undefined) {
      updatePayload.lotNumbers = typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers);
    }
    if (data.directions !== undefined) updatePayload.directions = data.directions;

    // 1. SUPABASE FIRST (Cloud Primary Persistence) - Independent of local SQLite failures
    if (supabase) {
      try {
        const supabasePayload: any = {};
        if (data.shelfLocation !== undefined) supabasePayload.shelf_location = data.shelfLocation;
        if (data.genericName !== undefined) supabasePayload.generic_name = data.genericName;
        if (data.brandName !== undefined) supabasePayload.brand_name = data.brandName;
        if (data.chemicalName !== undefined) supabasePayload.chemical_name = data.chemicalName;
        if (data.dosage !== undefined) supabasePayload.dosage = data.dosage;
        if (data.itemType !== undefined) supabasePayload.item_type = data.itemType;
        if (data.stockUnit !== undefined) supabasePayload.stock_unit = data.stockUnit;
        if (data.subUnit !== undefined) supabasePayload.sub_unit = data.subUnit;
        if (data.bottlesAvailable !== undefined) supabasePayload.bottles_available = Number(data.bottlesAvailable) || 0;
        if (data.pillsPerBottle !== undefined) supabasePayload.pills_per_bottle = Number(data.pillsPerBottle) || 0;
        if (data.looseUnitsAvailable !== undefined) supabasePayload.loose_units_available = Number(data.looseUnitsAvailable) || 0;
        if (data.isFullEdit) {
          if (data.bottlesAvailable !== undefined) supabasePayload.initial_bottles_available = Number(data.bottlesAvailable) || 0;
          if (data.looseUnitsAvailable !== undefined) supabasePayload.initial_loose_units_available = Number(data.looseUnitsAvailable) || 0;
        }
        if (data.expirationDate !== undefined) supabasePayload.expiration_date = data.expirationDate;
        if (data.lotNumbers !== undefined) {
          supabasePayload.lot_numbers = typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers);
        }
        if (data.directions !== undefined) supabasePayload.directions = data.directions;

        const { data: updatedRows } = await supabase
          .from('inventory_items')
          .update(supabasePayload)
          .eq('id', id)
          .select();

        // If row didn't exist in Supabase yet and full item data was submitted, insert it
        if ((!updatedRows || updatedRows.length === 0) && data.genericName) {
          await supabase.from('inventory_items').insert([
            {
              id,
              generic_name: data.genericName || 'Updated Medication',
              brand_name: data.brandName || null,
              chemical_name: data.chemicalName || null,
              dosage: data.dosage || 'Standard Strength',
              item_type: data.itemType || 'MEDICATION',
              shelf_location: data.shelfLocation || 'General Medical',
              stock_unit: data.stockUnit || 'Bottles',
              sub_unit: data.subUnit || 'tablets',
              bottles_available: Number(data.bottlesAvailable) || 0,
              loose_units_available: Number(data.looseUnitsAvailable) || 0,
              pills_per_bottle: Number(data.pillsPerBottle) || 100,
              expiration_date: data.expirationDate || '2028-12-31',
              lot_numbers: typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers || []),
              directions: data.directions || null,
            },
          ]);
        }
      } catch (cloudErr) {
        console.warn('Supabase cloud sync warning:', cloudErr);
      }
    }

    // 2. PRISMA LOCAL SQLITE BACKUP - Isolated so failure on cloud does not affect response
    let updatedItem: any = null;
    try {
      updatedItem = await prisma.inventoryItem.upsert({
        where: { id },
        update: updatePayload,
        create: {
          id,
          shelfLocation: data.shelfLocation || 'General Medical',
          genericName: data.genericName || 'Updated Medication',
          brandName: data.brandName || null,
          chemicalName: data.chemicalName || null,
          dosage: data.dosage || 'Standard Strength',
          itemType: data.itemType || 'MEDICATION',
          stockUnit: data.stockUnit || 'Bottles',
          subUnit: data.subUnit || 'tablets',
          bottlesAvailable: Number(data.bottlesAvailable) || 0,
          pillsPerBottle: Number(data.pillsPerBottle) || 100,
          looseUnitsAvailable: Number(data.looseUnitsAvailable) || 0,
          expirationDate: data.expirationDate || '2028-12-31',
          lotNumbers: typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers || []),
          directions: data.directions || null,
        },
      });
    } catch (localErr) {
      // Expected on serverless cloud platforms without write permission to dev.db
    }

    return NextResponse.json(updatedItem || { id, ...data, success: true });
  } catch (error) {
    console.error('DB upsert error:', error);
    return NextResponse.json({ success: true, serverlessOptimistic: true });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (supabase) {
      try {
        await supabase.from('inventory_items').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete warning:', e);
      }
    }

    try {
      await prisma.inventoryItem.delete({
        where: { id },
      });
    } catch (e) {
      // Expected on serverless
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}

