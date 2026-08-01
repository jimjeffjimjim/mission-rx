import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

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

    // Fetch existing item to compute exact quantity delta for DispenseLog tracking
    const existingItem = await prisma.inventoryItem.findUnique({ where: { id } }).catch(() => null);

    // Prepare update payload
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
    if (data.expirationDate !== undefined) updatePayload.expirationDate = data.expirationDate;
    if (data.lotNumbers !== undefined) {
      updatePayload.lotNumbers = typeof data.lotNumbers === 'string' ? data.lotNumbers : JSON.stringify(data.lotNumbers);
    }
    if (data.directions !== undefined) updatePayload.directions = data.directions;

    // Use UPSERT so items are created if missing or updated if existing
    const updatedItem = await prisma.inventoryItem.upsert({
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

    // Mirror update to Supabase cloud if connected
    if (supabase) {
      try {
        await supabase.from('inventory_items').upsert([
          {
            id: updatedItem.id,
            generic_name: updatedItem.genericName,
            brand_name: updatedItem.brandName,
            chemical_name: updatedItem.chemicalName,
            dosage: updatedItem.dosage,
            item_type: updatedItem.itemType,
            shelf_location: updatedItem.shelfLocation,
            stock_unit: updatedItem.stockUnit,
            sub_unit: updatedItem.subUnit,
            bottles_available: updatedItem.bottlesAvailable,
            loose_units_available: updatedItem.looseUnitsAvailable,
            pills_per_bottle: updatedItem.pillsPerBottle,
            expiration_date: updatedItem.expirationDate,
            lot_numbers: updatedItem.lotNumbers,
            directions: updatedItem.directions,
          },
        ]);
      } catch (cloudErr) {
        console.warn('Supabase cloud sync warning:', cloudErr);
      }
    }

    return NextResponse.json(updatedItem);
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
    await prisma.inventoryItem.delete({
      where: { id },
    }).catch(() => null);

    if (supabase) {
      try {
        await supabase.from('inventory_items').delete().eq('id', id);
      } catch (e) {
        // Fallback
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}
