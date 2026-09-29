import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { DispenseLog } from '@/types/inventory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let logsFallbackCache: DispenseLog[] = [];

function parseLogDetails(detailsText: string) {
  let details = detailsText || '';
  let dispensedUnit: 'bottle' | 'unit' | null = null;
  let dispensedBottles = 0;
  let dispensedPillsPerBottle = 0;
  let lotNumbers: string[] = [];

  const splitIdx = details.indexOf(' | METADATA: ');
  if (splitIdx !== -1) {
    const metaStr = details.slice(splitIdx + ' | METADATA: '.length);
    details = details.slice(0, splitIdx);
    try {
      const meta = JSON.parse(metaStr);
      dispensedUnit = meta.dispensedUnit || null;
      dispensedBottles = meta.dispensedBottles || 0;
      dispensedPillsPerBottle = meta.dispensedPillsPerBottle || 0;
      lotNumbers = Array.isArray(meta.lotNumbers) ? meta.lotNumbers : [];
    } catch (e) {}
  }
  return { details, dispensedUnit, dispensedBottles, dispensedPillsPerBottle, lotNumbers };
}

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
          const mapped: DispenseLog[] = cloudLogs.map((l: any) => {
            const parsedMeta = parseLogDetails(l.details || '');
            let lotList = parsedMeta.lotNumbers;
            try {
              if (l.lot_numbers) {
                const addList = typeof l.lot_numbers === 'string' ? (l.lot_numbers.startsWith('[') ? JSON.parse(l.lot_numbers) : l.lot_numbers.split(',')) : l.lot_numbers;
                lotList = Array.from(new Set([...lotList, ...addList]));
              }
            } catch (e) {}
            const detailsLower = (parsedMeta.details || l.details || '').toLowerCase();
            const isUndispense = l.action_type === 'UNDISPENSE' || (detailsLower.includes('undispensed') && !detailsLower.includes('restocked'));
            const isRestock = l.action_type === 'RESTOCK' || detailsLower.includes('restocked');
            const isDiscard = l.action_type === 'DISCARD' || detailsLower.includes('waste') || detailsLower.includes('discard') || detailsLower.includes('expired');
            const resolvedActionType = isUndispense ? 'UNDISPENSE' : (isRestock ? 'RESTOCK' : (isDiscard ? 'DISCARD' : (l.action_type || 'DISPENSE')));
            const rawQty = Number(l.quantity_changed) || 0;
            const resolvedQty = (isUndispense || isRestock) ? Math.abs(rawQty) : ((resolvedActionType === 'DISPENSE' || resolvedActionType === 'DISCARD') ? -Math.abs(rawQty) : rawQty);

            return {
              id: l.id,
              itemId: l.item_id || 'unknown',
              itemGenericName: l.item_generic_name || 'Medication Transaction Record',
              quantityChanged: resolvedQty,
              actionType: resolvedActionType as any,
              userRole: l.user_role || 'STAFF',
              details: parsedMeta.details || 'Clinical inventory adjustment logged.',
              createdAt: l.created_at || new Date().toISOString(),
              dispensedUnit: (l.dispensed_unit || parsedMeta.dispensedUnit) as any,
              dispensedBottles: Number(l.dispensed_bottles || parsedMeta.dispensedBottles) || 0,
              dispensedPillsPerBottle: Number(l.dispensed_pills_per_bottle || parsedMeta.dispensedPillsPerBottle) || 0,
              lotNumbers: lotList,
              isTestMode: l.is_test_mode || false,
            };
          });

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

    const dbLogs: DispenseLog[] = logs.map((l) => {
      let lotList: string[] = [];
      try {
        if (l.lotNumbers) {
          lotList = l.lotNumbers.startsWith('[') ? JSON.parse(l.lotNumbers) : l.lotNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } catch (e) {}

      const detailsLower = (l.details || '').toLowerCase();
      const isUndispense = l.actionType === 'UNDISPENSE' || (detailsLower.includes('undispensed') && !detailsLower.includes('restocked'));
      const isRestock = l.actionType === 'RESTOCK' || detailsLower.includes('restocked');
      const resolvedActionType = isUndispense ? 'UNDISPENSE' : (isRestock ? 'RESTOCK' : (l.actionType || 'DISPENSE'));
      const rawQty = Number(l.quantityChanged) || 0;
      const resolvedQty = (isUndispense || isRestock) ? Math.abs(rawQty) : (resolvedActionType === 'DISPENSE' ? -Math.abs(rawQty) : rawQty);

      return {
        id: l.id,
        itemId: l.itemId,
        itemGenericName: (l as any).itemGenericName || 'Medication Transaction Record',
        quantityChanged: resolvedQty,
        actionType: resolvedActionType as any,
        userRole: l.userRole || 'STAFF',
        details: l.details || 'Clinical inventory adjustment logged.',
        createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
        dispensedUnit: l.dispensedUnit as any,
        dispensedBottles: l.dispensedBottles || 0,
        dispensedPillsPerBottle: l.dispensedPillsPerBottle || 0,
        lotNumbers: lotList,
        isTestMode: l.isTestMode || false,
      };
    });

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
  const newLogs: any[] = items.map((item) => ({
    id: item.id || ('log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)),
    itemId: item.itemId || 'unknown',
    itemGenericName: item.itemGenericName || 'General Inventory Item',
    quantityChanged: Number(item.quantityChanged) || 0,
    actionType: item.actionType || 'DISPENSE',
    userRole: item.userRole || 'STAFF',
    details: item.details || 'Routine medical supply transaction.',
    createdAt: item.createdAt || new Date().toISOString(),
    dispensedUnit: item.dispensedUnit || null,
    dispensedBottles: item.dispensedBottles || 0,
    dispensedPillsPerBottle: item.dispensedPillsPerBottle || 0,
    lotNumbers: Array.isArray(item.lotNumbers) ? item.lotNumbers : (item.lotNumbers ? [String(item.lotNumbers)] : []),
  }));

  logsFallbackCache.unshift(...newLogs);

  // 1. Supabase Cloud Postgres Insertion (First)
  if (supabase && newLogs.length > 0) {
    try {
      const cloudRows = newLogs.map((l) => {
        const metadataString = JSON.stringify({
          dispensedUnit: l.dispensedUnit,
          dispensedBottles: l.dispensedBottles,
          dispensedPillsPerBottle: l.dispensedPillsPerBottle,
          lotNumbers: l.lotNumbers,
        });
        return {
          id: l.id,
          item_id: l.itemId,
          item_generic_name: l.itemGenericName,
          quantity_changed: l.quantityChanged,
          action_type: l.actionType,
          user_role: l.userRole,
          details: `${l.details} | METADATA: ${metadataString}`,
          created_at: l.createdAt,
        };
      });
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
          userRole: l.userRole || 'STAFF',
          details: l.details || '',
          dispensedUnit: l.dispensedUnit || null,
          dispensedBottles: l.dispensedBottles || 0,
          dispensedPillsPerBottle: l.dispensedPillsPerBottle || 0,
          lotNumbers: JSON.stringify(l.lotNumbers || []),
          isTestMode: l.isTestMode || false,
        },
      }).catch(() => null);
    }
  } catch (error) {
    // Expected on read-only serverless platforms
  }

  return NextResponse.json(newLogs, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      quantityChanged,
      details,
      actionType,
      itemGenericName,
      lotNumbers,
      dispensedBottles,
      dispensedUnit,
      dispensedPillsPerBottle,
      createdAt,
      userRole,
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing log record id' }, { status: 400 });
    }

    const numericQty = quantityChanged !== undefined ? Number(quantityChanged) : undefined;
    const updatedDetails = details !== undefined ? details : 'Clinical usage log updated manually during audit review.';

    // 1. Update in Supabase Cloud Postgres
    if (supabase) {
      try {
        const updatePayload: any = {};
        if (numericQty !== undefined) updatePayload.quantity_changed = numericQty;
        if (details !== undefined) updatePayload.details = updatedDetails;
        if (actionType !== undefined) updatePayload.action_type = actionType;
        if (itemGenericName !== undefined) updatePayload.item_generic_name = itemGenericName;
        if (lotNumbers !== undefined) {
          updatePayload.lot_numbers = typeof lotNumbers === 'string' ? lotNumbers : JSON.stringify(lotNumbers);
        }
        if (dispensedBottles !== undefined) updatePayload.dispensed_bottles = Number(dispensedBottles) || 0;
        if (dispensedUnit !== undefined) updatePayload.dispensed_unit = dispensedUnit;
        if (dispensedPillsPerBottle !== undefined) updatePayload.dispensed_pills_per_bottle = Number(dispensedPillsPerBottle) || 0;
        if (createdAt !== undefined) updatePayload.created_at = createdAt;
        if (userRole !== undefined) updatePayload.user_role = userRole;

        await supabase
          .from('dispense_logs')
          .update(updatePayload)
          .eq('id', id);
      } catch (cloudErr) {
        console.warn('Failed updating Supabase log:', cloudErr);
      }
    }

    // 2. Update local fallback cache
    const target = logsFallbackCache.find((l) => l.id === id);
    if (target) {
      if (numericQty !== undefined) target.quantityChanged = numericQty;
      if (details !== undefined) target.details = updatedDetails;
      if (actionType !== undefined) target.actionType = actionType;
      if (itemGenericName !== undefined) target.itemGenericName = itemGenericName;
      if (lotNumbers !== undefined) target.lotNumbers = Array.isArray(lotNumbers) ? lotNumbers : [String(lotNumbers)];
      if (dispensedBottles !== undefined) target.dispensedBottles = Number(dispensedBottles) || 0;
      if (dispensedUnit !== undefined) target.dispensedUnit = dispensedUnit;
      if (dispensedPillsPerBottle !== undefined) target.dispensedPillsPerBottle = Number(dispensedPillsPerBottle) || 0;
      if (createdAt !== undefined) target.createdAt = createdAt;
      if (userRole !== undefined) target.userRole = userRole;
    }

    // 3. Update local SQLite if accessible
    try {
      const sqlitePayload: any = {};
      if (numericQty !== undefined) sqlitePayload.quantityChanged = numericQty;
      if (details !== undefined) sqlitePayload.details = updatedDetails;
      if (actionType !== undefined) sqlitePayload.actionType = actionType;
      if (itemGenericName !== undefined) sqlitePayload.itemGenericName = itemGenericName;
      if (lotNumbers !== undefined) {
        sqlitePayload.lotNumbers = typeof lotNumbers === 'string' ? lotNumbers : JSON.stringify(lotNumbers);
      }
      if (dispensedBottles !== undefined) sqlitePayload.dispensedBottles = Number(dispensedBottles) || 0;
      if (dispensedUnit !== undefined) sqlitePayload.dispensedUnit = dispensedUnit;
      if (dispensedPillsPerBottle !== undefined) sqlitePayload.dispensedPillsPerBottle = Number(dispensedPillsPerBottle) || 0;
      if (createdAt !== undefined) sqlitePayload.createdAt = new Date(createdAt);
      if (userRole !== undefined) sqlitePayload.userRole = userRole;

      await prisma.dispenseLog.update({
        where: { id },
        data: sqlitePayload,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isTestMode = searchParams.get('test_mode') === 'true';
    const isDeveloper = searchParams.get('developer') === 'true' || searchParams.get('role') === 'DEVELOPER';

    // 1. Allow deleting a specific log entry if ID is provided
    if (id) {
      if (supabase) {
        try {
          await supabase.from('dispense_logs').delete().eq('id', id);
        } catch (cloudErr) {
          console.warn('Failed deleting log from Supabase:', cloudErr);
        }
      }

      try {
        await prisma.dispenseLog.delete({ where: { id } }).catch(() => null);
      } catch (e) {}

      logsFallbackCache = logsFallbackCache.filter((l) => l.id !== id);
      return NextResponse.json({ success: true, deletedId: id });
    }

    // 2. Allow Developer or Test Mode to clear all audit logs
    if (isDeveloper || isTestMode) {
      if (supabase && isDeveloper) {
        try {
          await supabase.from('dispense_logs').delete().neq('id', '');
        } catch (e) {
          console.warn('Supabase clear logs error:', e);
        }
      }

      try {
        await prisma.dispenseLog.deleteMany({}).catch(() => null);
      } catch (e) {}

      logsFallbackCache = [];
      return NextResponse.json({ success: true, message: 'Audit logs cleared by developer authorization.' });
    }

    return NextResponse.json(
      { error: 'Regulatory Protection: Live clinical transaction audit logs are protected. Developer authorization required to delete.' },
      { status: 403 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

