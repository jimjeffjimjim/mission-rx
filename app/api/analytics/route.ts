import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

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
            return {
              id: l.id,
              itemId: l.item_id || 'unknown',
              itemGenericName: l.item_generic_name || 'Medication Formulation',
              quantityChanged: Number(l.quantity_changed) || 0,
              actionType: l.action_type || 'DISPENSE',
              userRole: l.user_role || 'STAFF',
              details: parsedMeta.details || '',
              category: 'General Medical',
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
        return {
          id: log.id,
          itemId: log.itemId,
          itemGenericName: log.item?.genericName || (log as any).itemGenericName || 'Medication Formulation',
          quantityChanged: log.quantityChanged,
          actionType: log.actionType,
          userRole: log.userRole || 'STAFF',
          details: parsedMeta.details || '',
          category: log.item?.shelfLocation || 'General Medical',
          createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          dispensedUnit: (log.dispensedUnit || parsedMeta.dispensedUnit) as any,
          dispensedBottles: log.dispensedBottles || parsedMeta.dispensedBottles || 0,
          dispensedPillsPerBottle: log.dispensedPillsPerBottle || parsedMeta.dispensedPillsPerBottle || 0,
          lotNumbers: lotList,
        };
      });
    }

    // Aggregate Top Dispensed Items
    const topMap: { [genericName: string]: { totalDispensed: number; category: string } } = {};

    formattedLogs.forEach((log: any) => {
      if (log.actionType === 'DISPENSE' || log.quantityChanged < 0) {
        const name = log.itemGenericName || 'General Inventory Item';
        const qty = Math.abs(log.quantityChanged);
        if (!topMap[name]) {
          topMap[name] = { totalDispensed: 0, category: log.category };
        }
        topMap[name].totalDispensed += qty;
      }
    });

    const topDispensedItems = Object.keys(topMap)
      .map((name) => ({
        genericName: name,
        totalDispensed: topMap[name].totalDispensed,
        category: topMap[name].category,
      }))
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
