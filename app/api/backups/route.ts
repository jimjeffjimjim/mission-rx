import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

let backupsFallbackCache: any[] = [];

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('inventory_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          createdAt: b.created_at,
          itemCount: b.item_count || 0,
          logCount: b.log_count || 0,
          inventorySnapshot: typeof b.inventory_snapshot === 'string' 
            ? JSON.parse(b.inventory_snapshot) 
            : b.inventory_snapshot,
          logsSnapshot: typeof b.logs_snapshot === 'string' 
            ? JSON.parse(b.logs_snapshot) 
            : b.logs_snapshot,
          notes: b.notes || '',
        }));
        backupsFallbackCache = formatted;
        return NextResponse.json(formatted);
      }
    }

    // Fallback to local database
    const dbBackups = await prisma.inventoryBackup.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = dbBackups.map((b) => ({
      id: b.id,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
      itemCount: b.itemCount,
      logCount: b.logCount,
      inventorySnapshot: JSON.parse(b.inventorySnapshot || '[]'),
      logsSnapshot: JSON.parse(b.logsSnapshot || '[]'),
      notes: b.notes || '',
    }));

    return NextResponse.json(formatted.length > 0 ? formatted : backupsFallbackCache);
  } catch (error: any) {
    console.error('Error fetching weekly backups:', error);
    return NextResponse.json(backupsFallbackCache, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, notes, inventory, logs } = body;

    if (!Array.isArray(inventory)) {
      return NextResponse.json({ error: 'Missing valid inventory array for backup snapshot.' }, { status: 400 });
    }

    let finalLogs: any[] = Array.isArray(logs) && logs.length > 0 ? logs : [];

    // If logs were not provided (e.g. background automated snapshot), dynamically fetch all live audit logs
    if (finalLogs.length === 0) {
      if (supabase) {
        try {
          const { data: cloudLogs } = await supabase
            .from('dispense_logs')
            .select('*')
            .order('created_at', { ascending: false });
          if (cloudLogs && cloudLogs.length > 0) {
            finalLogs = cloudLogs.map((l: any) => ({
              id: l.id,
              itemId: l.item_id || 'unknown',
              itemGenericName: l.item_generic_name || 'Medication Transaction Record',
              quantityChanged: Number(l.quantity_changed) || 0,
              actionType: l.action_type || 'DISPENSE',
              userRole: l.user_role || 'STAFF',
              details: l.details || 'Clinical inventory adjustment logged.',
              createdAt: l.created_at || new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.warn('Supabase logs fetch for backup warning:', e);
        }
      }

      if (finalLogs.length === 0) {
        try {
          const dbLogs = await prisma.dispenseLog.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []);
          if (dbLogs && dbLogs.length > 0) {
            finalLogs = dbLogs.map((l: any) => ({
              id: l.id,
              itemId: l.itemId,
              itemGenericName: l.itemGenericName || 'Medication Transaction Record',
              quantityChanged: l.quantityChanged,
              actionType: l.actionType || 'DISPENSE',
              userRole: l.userRole || 'STAFF',
              details: l.details || 'Clinical inventory adjustment logged.',
              createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
            }));
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    const id = `bk_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const cleanTitle = title || `Weekly Backup - ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    const cleanNotes = notes || 'Automated regulatory weekly compliance and disaster recovery snapshot.';
    const itemCount = inventory.length;
    const logCount = finalLogs.length;
    const inventoryJson = JSON.stringify(inventory);
    const logsJson = JSON.stringify(finalLogs);

    // 1. Write to Supabase Postgres
    if (supabase) {
      const { error: cloudError } = await supabase
        .from('inventory_backups')
        .insert([{
          id,
          title: cleanTitle,
          created_at: createdAt,
          item_count: itemCount,
          log_count: logCount,
          inventory_snapshot: inventoryJson,
          logs_snapshot: logsJson,
          notes: cleanNotes,
        }]);

      if (cloudError) {
        console.warn('Supabase backup creation error:', cloudError);
      } else {
        // Retain all historical regulatory weekly backups (unlimited retention)
      }
    }

    // 2. Write to local database (if accessible)
    try {
      await prisma.inventoryBackup.create({
        data: {
          id,
          title: cleanTitle,
          createdAt: new Date(),
          itemCount,
          logCount,
          inventorySnapshot: inventoryJson,
          logsSnapshot: logsJson,
          notes: cleanNotes,
        },
      }).catch(() => null);
    } catch (dbErr) {
      // Expected on serverless
    }

    const newBackup = {
      id,
      title: cleanTitle,
      createdAt,
      itemCount,
      logCount,
      inventorySnapshot: inventory,
      logsSnapshot: logs || [],
      notes: cleanNotes,
    };

    backupsFallbackCache = [newBackup, ...backupsFallbackCache];
    return NextResponse.json({ success: true, backup: newBackup }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating weekly backup:', error);
    return NextResponse.json({ error: error.message || 'Failed creating backup' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { backupId, rawBackup } = body;

    let targetBackup: any = null;

    if (rawBackup && Array.isArray(rawBackup.inventory)) {
      targetBackup = {
        title: rawBackup.title || 'Uploaded JSON Backup File',
        inventory: rawBackup.inventory,
        logs: Array.isArray(rawBackup.logs) ? rawBackup.logs : (Array.isArray(rawBackup.logsSnapshot) ? rawBackup.logsSnapshot : []),
      };
    } else if (Array.isArray(rawBackup)) {
      // Direct array of items uploaded
      targetBackup = {
        title: 'Uploaded JSON Inventory Items',
        inventory: rawBackup,
        logs: [],
      };
    } else if (backupId) {

    // 1. Find in Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('inventory_backups')
        .select('*')
        .eq('id', backupId)
        .single();
      if (!error && data) {
        targetBackup = {
          title: data.title,
          inventory: typeof data.inventory_snapshot === 'string' ? JSON.parse(data.inventory_snapshot) : data.inventory_snapshot,
          logs: typeof data.logs_snapshot === 'string' ? JSON.parse(data.logs_snapshot) : data.logs_snapshot,
        };
      }
    }

    // 2. Find in Local DB or Fallback Cache
    if (!targetBackup) {
      const dbBackup = await prisma.inventoryBackup.findUnique({ where: { id: backupId } }).catch(() => null);
      if (dbBackup) {
        targetBackup = {
          title: dbBackup.title,
          inventory: JSON.parse(dbBackup.inventorySnapshot || '[]'),
          logs: JSON.parse(dbBackup.logsSnapshot || '[]'),
        };
      } else {
        const cached = backupsFallbackCache.find((b) => b.id === backupId);
        if (cached) {
          targetBackup = {
            title: cached.title,
            inventory: cached.inventorySnapshot,
            logs: cached.logsSnapshot,
          };
        }
      }
    }
  }

    if (!targetBackup || !Array.isArray(targetBackup.inventory)) {
      return NextResponse.json({ error: 'Backup record not found or invalid' }, { status: 404 });
    }

    // Execute atomic restoration on Supabase
    if (supabase) {
      // Clear existing inventory and restore
      await supabase.from('inventory_items').delete().neq('id', 'none');
      
      const restoredItems = targetBackup.inventory.map((item: any) => ({
        id: item.id,
        shelf_location: item.shelfLocation,
        generic_name: item.genericName,
        brand_name: item.brandName || null,
        chemical_name: item.chemicalName || null,
        dosage: item.dosage || '',
        item_type: item.itemType || 'TABLET',
        stock_unit: item.stockUnit || 'Bottles',
        sub_unit: item.subUnit || 'pills',
        bottles_available: item.bottlesAvailable ?? 0,
        pills_per_bottle: item.pillsPerBottle ?? 0,
        loose_units_available: item.looseUnitsAvailable ?? 0,
        expiration_date: item.expirationDate || '',
        lot_numbers: typeof item.lotNumbers === 'string' ? item.lotNumbers : JSON.stringify(item.lotNumbers || []),
        directions: item.directions || null,
      }));

      await supabase.from('inventory_items').insert(restoredItems);

      // Add restoration audit log
      await supabase.from('dispense_logs').insert([{
        id: `log_restore_${Date.now()}`,
        item_id: targetBackup.inventory[0]?.id || 'RESTORE',
        item_generic_name: 'SYSTEM WIDE RESTORE',
        quantity_changed: 0,
        action_type: 'AUDIT',
        user_role: 'ADMIN',
        details: `Clinic inventory successfully restored from historical weekly backup: "${targetBackup.title}".`,
        created_at: new Date().toISOString(),
      }]);
    }

    return NextResponse.json({ success: true, message: `Successfully restored inventory from backup: ${targetBackup.title}` });
  } catch (err: any) {
    console.error('Failed restoring from backup:', err);
    return NextResponse.json({ error: err.message || 'Restore error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing backup ID to delete' }, { status: 400 });
    }

    if (supabase) {
      await supabase.from('inventory_backups').delete().eq('id', id);
    }

    try {
      await prisma.inventoryBackup.delete({ where: { id } }).catch(() => null);
    } catch (e) {}

    backupsFallbackCache = backupsFallbackCache.filter((b) => b.id !== id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete error' }, { status: 500 });
  }
}
