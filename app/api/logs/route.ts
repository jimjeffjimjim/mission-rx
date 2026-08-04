import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { DispenseLog } from '@/types/inventory';

let logsFallbackCache: DispenseLog[] = [];

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

        if (cloudLogs && !error) {
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

  const items: any[] = Array.isArray(data) ? data : [data];
  const newLogs: DispenseLog[] = items.map((item) => ({
    id: item.id || ('log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)),
    itemId: item.itemId || 'unknown',
    itemGenericName: item.itemGenericName || 'General Inventory Item',
    quantityChanged: Number(item.quantityChanged) || 0,
    actionType: item.actionType || 'DISPENSE',
    userRole: item.userRole || 'STAFF',
    details: item.details || 'Routine medical supply transaction.',
    createdAt: item.createdAt || new Date().toISOString(),
  }));

  logsFallbackCache.unshift(...newLogs);

  // 1. Supabase Cloud Postgres Insertion (First)
  if (supabase && newLogs.length > 0) {
    try {
      const cloudRows = newLogs.map((l) => ({
        id: l.id,
        item_id: l.itemId,
        item_generic_name: l.itemGenericName,
        quantity_changed: l.quantityChanged,
        action_type: l.actionType,
        user_role: l.userRole,
        details: l.details,
        created_at: l.createdAt,
      }));
      await supabase.from('dispense_logs').insert(cloudRows);
    } catch (cloudErr) {
      console.warn('Failed saving audit logs to Supabase:', cloudErr);
    }
  }

  // 2. Prisma SQLite local backup
  try {
    for (const l of newLogs) {
      await prisma.dispenseLog.create({
        data: {
          itemId: l.itemId || 'unknown',
          quantityChanged: l.quantityChanged,
          actionType: l.actionType as any,
        },
      }).catch(() => null);
    }
  } catch (error) {
    // Expected on read-only serverless platforms
  }

  return NextResponse.json(newLogs.length === 1 ? newLogs[0] : newLogs, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, quantityChanged, details } = data;
    if (!id) {
      return NextResponse.json({ error: 'Missing log record id' }, { status: 400 });
    }

    const numericQty = Number(quantityChanged) || 0;
    const updatedDetails = details || 'Clinical usage log updated manually during audit review.';

    // 1. Update in Supabase Cloud Postgres
    if (supabase) {
      try {
        await supabase
          .from('dispense_logs')
          .update({
            quantity_changed: numericQty,
            details: updatedDetails,
          })
          .eq('id', id);
      } catch (cloudErr) {
        console.warn('Failed updating Supabase log:', cloudErr);
      }
    }

    // 2. Update local fallback cache
    const target = logsFallbackCache.find((l) => l.id === id);
    if (target) {
      target.quantityChanged = numericQty;
      if (details) target.details = updatedDetails;
    }

    // 3. Update local SQLite if accessible
    try {
      await prisma.dispenseLog.update({
        where: { id },
        data: { quantityChanged: numericQty },
      }).catch(() => null);
    } catch (dbErr) {
      // Ignore on serverless
    }

    return NextResponse.json({ success: true, id, quantityChanged: numericQty, details: updatedDetails });
  } catch (err: any) {
    console.error('Failed to update audit log:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
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

