import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

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
          formattedLogs = cloudLogs.map((l: any) => ({
            id: l.id,
            itemId: l.item_id || 'unknown',
            itemGenericName: l.item_generic_name || 'Medication Formulation',
            quantityChanged: Number(l.quantity_changed) || 0,
            actionType: l.action_type || 'DISPENSE',
            category: 'General Medical',
            createdAt: l.created_at || new Date().toISOString(),
          }));
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

      formattedLogs = logs.map((log: any) => ({
        id: log.id,
        itemId: log.itemId,
        itemGenericName: log.item?.genericName || (log as any).itemGenericName || 'Medication Formulation',
        quantityChanged: log.quantityChanged,
        actionType: log.actionType,
        category: log.item?.shelfLocation || 'General Medical',
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      }));
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
