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
            const isUndispense = l.action_type === 'RESTOCK' || l.action_type === 'UNDISPENSE' || detailsLower.includes('undispensed') || detailsLower.includes('restocked');
            const resolvedActionType = isUndispense ? 'RESTOCK' : (l.action_type || 'DISPENSE');
            const rawQty = Number(l.quantity_changed) || 0;
            const resolvedQty = isUndispense ? Math.abs(rawQty) : (resolvedActionType === 'DISPENSE' ? -Math.abs(rawQty) : rawQty);

            return {
              id: l.id,
              itemId: l.item_id || 'unknown',
              itemGenericName: l.item_generic_name || 'Medication Transaction Record',
              quantityChanged: resolvedQty,
              actionType: resolvedActionType,
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
      const isUndispense = l.actionType === 'RESTOCK' || (l.actionType as string) === 'UNDISPENSE' || detailsLower.includes('undispensed') || detailsLower.includes('restocked');
      const resolvedActionType = isUndispense ? 'RESTOCK' : (l.actionType || 'DISPENSE');
      const rawQty = Number(l.quantityChanged) || 0;
      const resolvedQty = isUndispense ? Math.abs(rawQty) : (resolvedActionType === 'DISPENSE' ? -Math.abs(rawQty) : rawQty);

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isTestMode = searchParams.get('test_mode') === 'true';

    if (!isTestMode) {
      return NextResponse.json(
        { error: 'Regulatory Protection: Live clinical transaction audit logs are permanent and cannot be deleted.' },
        { status: 403 }
      );
    }

    logsFallbackCache = [];
    return NextResponse.json({ success: true, message: 'Simulated test audit logs cleared.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

