import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DispenseLog } from '@/types/inventory';

let logsFallbackCache: DispenseLog[] = [
  {
    id: 'log-1',
    itemId: 'meyer-1',
    itemGenericName: 'Clobetasol Propionate (0.05% Cream)',
    quantityChanged: -2,
    actionType: 'DISPENSE',
    userRole: 'STAFF',
    details: 'Dispensed 2 tubes to outpatient dermatology patient. Lot #153224031A verified.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'log-2',
    itemId: 'meyer-3',
    itemGenericName: 'Cetirizine HCl / Zyrtec (10 mg Tablet)',
    quantityChanged: 5,
    actionType: 'RESTOCK',
    userRole: 'ADMIN',
    details: 'Restocked +5 bottles from central clinical supplier shipment. Lot #3495B1AA.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-3',
    itemId: 'meyer-14',
    itemGenericName: 'Epinephrine Injectable (1 mg/ml Auto-Injector)',
    quantityChanged: 0,
    actionType: 'AUDIT',
    userRole: 'ADMIN',
    details: 'Clinical safety audit performed. Verified expiration date (2027-04-30) and Tall Man lettering.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export async function GET() {
  try {
    const logs = await prisma.dispenseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    if (logs.length > 0) {
      const dbLogs = logs.map((l) => ({
        id: l.id,
        itemId: l.itemId,
        itemGenericName: (l as any).itemGenericName || 'Medication Transaction Record',
        quantityChanged: l.quantityChanged,
        actionType: (l.actionType as any) || 'DISPENSE',
        userRole: (l as any).userRole || 'STAFF',
        details: (l as any).details || 'Clinical inventory adjustment logged.',
        createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
      }));

      // Combine with memory logs avoiding duplicate IDs
      const map = new Map<string, DispenseLog>();
      [...logsFallbackCache, ...dbLogs].forEach((item) => map.set(item.id, item));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json(merged);
    }

    return NextResponse.json(logsFallbackCache);
  } catch (error) {
    return NextResponse.json(logsFallbackCache);
  }
}

export async function POST(request: Request) {
  let data: any = {};
  try {
    data = await request.json();
  } catch (e) {
    data = {};
  }

  const newLog: DispenseLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    itemId: data.itemId || 'unknown',
    itemGenericName: data.itemGenericName || 'General Inventory Item',
    quantityChanged: Number(data.quantityChanged) || 0,
    actionType: data.actionType || 'DISPENSE',
    userRole: data.userRole || 'STAFF',
    details: data.details || 'Routine medical supply transaction.',
    createdAt: new Date().toISOString(),
  };

  logsFallbackCache.unshift(newLog);

  try {
    await prisma.dispenseLog.create({
      data: {
        itemId: newLog.itemId || 'unknown',
        quantityChanged: newLog.quantityChanged,
        actionType: newLog.actionType as any,
      },
    });
  } catch (error) {
    // Save to runtime cache
  }

  return NextResponse.json(newLog, { status: 201 });
}

export async function DELETE() {
  logsFallbackCache = [];
  try {
    await prisma.dispenseLog.deleteMany({});
  } catch (e) {
    console.warn('Cleared memory log cache:', e);
  }
  return NextResponse.json({ success: true, message: 'All audit logs reset.' });
}
