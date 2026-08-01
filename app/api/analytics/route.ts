import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const whereClause: any = {};
    if (startDate) {
      whereClause.createdAt = {
        gte: startDate,
      };
    }

    // Fetch dispense logs with item relation
    const logs = await (prisma as any).dispenseLog.findMany({
      where: whereClause,
      include: {
        item: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    }).catch(() => []);

    // Format logs array safely
    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      itemId: log.itemId,
      itemGenericName: log.item?.genericName || 'Unknown Formulation',
      quantityChanged: log.quantityChanged,
      actionType: log.actionType,
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Aggregate Top Dispensed Items
    const topMap: { [genericName: string]: { totalDispensed: number; category: string } } = {};

    formattedLogs.forEach((log: any) => {
      if (log.actionType === 'DISPENSE' || log.quantityChanged < 0) {
        const name = log.itemGenericName;
        const qty = Math.abs(log.quantityChanged);
        if (!topMap[name]) {
          topMap[name] = { totalDispensed: 0, category: log.item?.shelfLocation || 'General Medical' };
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
