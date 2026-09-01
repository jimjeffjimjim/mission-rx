import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { getStandardItemName } from '@/lib/stockMath';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';

    let startDate: Date | null = null;
    const now = new Date();

    if (timeframe === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch current inventory items to resolve canonical names and details
    let currentItems: any[] = [];
    if (supabase) {
      try {
        const { data: inv } = await supabase.from('inventory_items').select('id, generic_name, dosage, shelf_location, lot_numbers, stock_unit, sub_unit, pills_per_bottle');
        if (inv) currentItems = inv;
      } catch (e) {}
    }
    if (currentItems.length === 0) {
      try {
        currentItems = await prisma.inventoryItem.findMany();
      } catch (e) {}
    }

    const itemLookup = new Map<string, any>();
    currentItems.forEach((item: any) => {
      const gName = item.genericName || item.generic_name || '';
      const d = item.dosage || '';
      const stdName = getStandardItemName(gName, d);
      if (item.id) itemLookup.set(item.id, { ...item, canonicalName: stdName });
      if (gName) itemLookup.set(gName.toLowerCase(), { ...item, canonicalName: stdName });
    });

    let formattedLogs: any[] = [];

    // 1. Prioritize Supabase Cloud Postgres
    if (supabase) {
      try {
        let query = supabase.from('dispense_logs').select('*').order('created_at', { ascending: false }).limit(500);
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        const { data: cloudLogs, error } = await query;
        if (cloudLogs && !error && cloudLogs.length > 0) {
          formattedLogs = cloudLogs.map((l: any) => {
            const parsedMeta = parseLogDetails(l.details || '');
            let lotList = parsedMeta.lotNumbers;
            try {
              if (l.lot_numbers) {
                const addList = typeof l.lot_numbers === 'string' ? (l.lot_numbers.startsWith('[') ? JSON.parse(l.lot_numbers) : l.lot_numbers.split(',')) : l.lot_numbers;
                lotList = Array.from(new Set([...lotList, ...addList]));
              }
            } catch (e) {}

            const rawName = l.item_generic_name || 'Medication Formulation';
            const matched = (l.item_id && itemLookup.get(l.item_id)) || itemLookup.get(rawName.toLowerCase()) || null;
            const canonicalName = matched?.canonicalName || rawName;

            const detailsLower = (parsedMeta.details || l.details || '').toLowerCase();
            const isUndispense = l.action_type === 'RESTOCK' || l.action_type === 'UNDISPENSE' || detailsLower.includes('undispensed') || detailsLower.includes('restocked');
            const resolvedActionType = isUndispense ? 'RESTOCK' : (l.action_type || 'DISPENSE');
            const rawQty = Number(l.quantity_changed) || 0;
            const resolvedQty = isUndispense ? Math.abs(rawQty) : (resolvedActionType === 'DISPENSE' ? -Math.abs(rawQty) : rawQty);

            return {
              id: l.id,
              itemId: l.item_id || 'unknown',
              itemGenericName: canonicalName,
              quantityChanged: resolvedQty,
              actionType: resolvedActionType,
              userRole: l.user_role || 'STAFF',
              details: parsedMeta.details || '',
              category: matched?.shelfLocation || matched?.shelf_location || 'General Medical',
              createdAt: l.created_at || new Date().toISOString(),
              dispensedUnit: (l.dispensed_unit || parsedMeta.dispensedUnit) as any,
              dispensedBottles: Number(l.dispensed_bottles || parsedMeta.dispensedBottles) || 0,
              dispensedPillsPerBottle: Number(l.dispensed_pills_per_bottle || parsedMeta.dispensedPillsPerBottle) || 0,
              lotNumbers: lotList,
            };
          });
        }
      } catch (cloudErr) {
        console.warn('Supabase analytics fetch warning:', cloudErr);
      }
    }

    // 2. Fallback to local SQLite if cloud returns nothing or unreachable
    if (formattedLogs.length === 0) {
      const whereClause: any = {};
      if (startDate) {
        whereClause.createdAt = {
          gte: startDate,
        };
      }

      const logs = await prisma.dispenseLog.findMany({
        where: whereClause,
        include: {
          item: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 500,
      }).catch(() => []);

      formattedLogs = logs.map((log: any) => {
        const parsedMeta = parseLogDetails(log.details || '');
        let lotList = parsedMeta.lotNumbers;
        try {
          if (log.lotNumbers) {
            const addList = log.lotNumbers.startsWith('[') ? JSON.parse(log.lotNumbers) : log.lotNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
            lotList = Array.from(new Set([...lotList, ...addList]));
          }
        } catch (e) {}

        const rawName = log.item?.genericName || (log as any).itemGenericName || 'Medication Formulation';
        const rawDosage = log.item?.dosage;
        const matched = (log.itemId && itemLookup.get(log.itemId)) || itemLookup.get(rawName.toLowerCase()) || null;
        const canonicalName = matched?.canonicalName || getStandardItemName(rawName, rawDosage);

        const detailsLower = (parsedMeta.details || log.details || '').toLowerCase();
        const isUndispense = log.actionType === 'RESTOCK' || (log.actionType as string) === 'UNDISPENSE' || detailsLower.includes('undispensed') || detailsLower.includes('restocked');
        const resolvedActionType = isUndispense ? 'RESTOCK' : (log.actionType || 'DISPENSE');
        const rawQty = Number(log.quantityChanged) || 0;
        const resolvedQty = isUndispense ? Math.abs(rawQty) : (resolvedActionType === 'DISPENSE' ? -Math.abs(rawQty) : rawQty);

        return {
          id: log.id,
          itemId: log.itemId,
          itemGenericName: canonicalName,
          quantityChanged: resolvedQty,
          actionType: resolvedActionType,
          userRole: log.userRole || 'STAFF',
          details: parsedMeta.details || '',
          category: log.item?.shelfLocation || matched?.shelfLocation || 'General Medical',
          createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          dispensedUnit: (log.dispensedUnit || parsedMeta.dispensedUnit) as any,
          dispensedBottles: log.dispensedBottles || parsedMeta.dispensedBottles || 0,
          dispensedPillsPerBottle: log.dispensedPillsPerBottle || parsedMeta.dispensedPillsPerBottle || 0,
          lotNumbers: lotList,
        };
      });
    }

    // Aggregate Top Dispensed Items:
    // Net Patient Usage = Math.max(0, sum(dispenses) - sum(undispenses/restocks))
    const usageMap: { [canonicalName: string]: { dispensed: number; returned: number; category: string } } = {};

    formattedLogs.forEach((log: any) => {
      const name = log.itemGenericName || 'General Inventory Item';
      if (!usageMap[name]) {
        usageMap[name] = { dispensed: 0, returned: 0, category: log.category || 'General Medical' };
      }
      const qty = Math.abs(log.quantityChanged);
      const isRestock = log.actionType === 'RESTOCK' || log.actionType === 'UNDISPENSE' || log.details?.toLowerCase().includes('undispensed') || log.details?.toLowerCase().includes('restocked');
      
      if (isRestock) {
        usageMap[name].returned += qty;
      } else if (log.actionType === 'DISPENSE' || log.quantityChanged < 0) {
        usageMap[name].dispensed += qty;
      }
    });

    const topDispensedItems = Object.keys(usageMap)
      .map((name) => ({
        genericName: name,
        totalDispensed: Math.max(0, usageMap[name].dispensed - usageMap[name].returned),
        category: usageMap[name].category,
      }))
      .filter((item) => item.totalDispensed > 0)
      .sort((a, b) => b.totalDispensed - a.totalDispensed)
      .slice(0, 10);

    return NextResponse.json({
      logs: formattedLogs,
      topDispensedItems,
      timeframe,
    });
  } catch (error) {
    console.error('Error fetching Analytics & Dispense Logs:', error);
    return NextResponse.json({
      logs: [],
      topDispensedItems: [],
      timeframe: 'all',
    });
  }
}
