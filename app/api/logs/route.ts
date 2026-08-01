import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
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
    // 1. Prioritize Supabase Cloud Postgres
    if (supabase) {
      try {
        const { data: cloudLogs, error } = await supabase
          .from('dispense_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (cloudLogs && !error && cloudLogs.length > 0) {
          const mapped: DispenseLog[] = cloudLogs.map((l: any) => ({
            id: l.id,
            itemId: l.item_id || 'unknown',
            itemGenericName: l.item_generic_name || 'Medication Transaction Record',
            quantityChanged: Number(l.quantity_changed) || 0,
            actionType: l.action_type || 'DISPENSE',
            userRole: l.user_role || 'STAFF',
            details: l.details || 'Clinical inventory adjustment logged.',
            createdAt: l.created_at || new Date().toISOString(),
          }));

          const map = new Map<string, DispenseLog>();
          [...mapped, ...logsFallbackCache].forEach((item) => map.set(item.id, item));
          return NextResponse.json(
            Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        }
      } catch (cloudErr) {
        console.warn('Supabase fetch logs warning:', cloudErr);
      }
    }

    // 2. Fallback to local SQLite database if cloud unreachable
    const logs = await prisma.dispenseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    }).catch(() => []);

    if (logs.length > 0) {
      const dbLogs: DispenseLog[] = logs.map((l) => ({
        id: l.id,
        itemId: l.itemId,
        itemGenericName: (l as any).itemGenericName || 'Medication Transaction Record',
        quantityChanged: l.quantityChanged,
        actionType: (l.actionType as any) || 'DISPENSE',
        userRole: (l as any).userRole || 'STAFF',
        details: (l as any).details || 'Clinical inventory adjustment logged.',
        createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
      }));

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

  // 1. Supabase Cloud Postgres Insertion (First)
  if (supabase) {
    try {
      await supabase.from('dispense_logs').insert([
        {
          id: newLog.id,
          item_id: newLog.itemId,
          item_generic_name: newLog.itemGenericName,
          quantity_changed: newLog.quantityChanged,
          action_type: newLog.actionType,
          user_role: newLog.userRole,
          details: newLog.details,
          created_at: newLog.createdAt,
        },
      ]);
    } catch (cloudErr) {
      console.warn('Failed saving audit log to Supabase:', cloudErr);
    }
  }

  // 2. Prisma SQLite local backup
  try {
    await prisma.dispenseLog.create({
      data: {
        itemId: newLog.itemId || 'unknown',
        quantityChanged: newLog.quantityChanged,
        actionType: newLog.actionType as any,
      },
    });
  } catch (error) {
    // Expected on read-only serverless platforms
  }

  return NextResponse.json(newLog, { status: 201 });
}

export async function DELETE() {
  logsFallbackCache = [];

  // 1. Clear Supabase Cloud Postgres table
  if (supabase) {
    try {
      await supabase.from('dispense_logs').delete().neq('id', 'none');
    } catch (cloudErr) {
      console.warn('Failed clearing Supabase logs:', cloudErr);
    }
  }

  // 2. Clear local SQLite
  try {
    await prisma.dispenseLog.deleteMany({});
  } catch (e) {
    console.warn('Cleared memory log cache:', e);
  }

  return NextResponse.json({ success: true, message: 'All audit logs reset.' });
}
