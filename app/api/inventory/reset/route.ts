import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Delete existing inventory items
    await prisma.inventoryItem.deleteMany({});

    const created = [];
    for (const item of rawItems) {
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

      const newItem = await prisma.inventoryItem.create({
        data: {
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
      });

      created.push(newItem);
    }

    return NextResponse.json({ success: true, count: created.length, items: created });
  } catch (error: any) {
    console.error('Failed to reset inventory to start:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
