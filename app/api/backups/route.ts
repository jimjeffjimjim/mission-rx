import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { parseLotNumbers } from '@/lib/stockMath';

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

    const formatted = dbBackups.map((b: any) => ({
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

    let finalLogs: any[] = [];
    if (Array.isArray(logs) && logs.length > 0) {
      finalLogs = logs.map((l: any) => ({
        id: l.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: l.itemId || l.item_id || 'unknown',
        itemGenericName: l.itemGenericName || l.item_generic_name || 'Medication Transaction Record',
        quantityChanged: Number(l.quantityChanged ?? l.quantity_changed) || 0,
        actionType: l.actionType || l.action_type || 'DISPENSE',
        userRole: l.userRole || l.user_role || 'STAFF',
        details: l.details || 'Clinical inventory adjustment logged.',
        createdAt: l.createdAt || l.created_at || new Date().toISOString(),
        lotNumbers: parseLotNumbers(l.lotNumbers ?? l.lot_numbers),
        dispensedBottles: Number(l.dispensedBottles ?? l.dispensed_bottles) || 0,
        dispensedUnit: l.dispensedUnit || l.dispensed_unit || null,
        dispensedPillsPerBottle: Number(l.dispensedPillsPerBottle ?? l.dispensed_pills_per_bottle) || 0,
        isTestMode: Boolean(l.isTestMode ?? l.is_test_mode),
      }));
    }

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
              lotNumbers: parseLotNumbers(l.lot_numbers),
              dispensedBottles: Number(l.dispensed_bottles) || 0,
              dispensedUnit: l.dispensed_unit || null,
              dispensedPillsPerBottle: Number(l.dispensed_pills_per_bottle) || 0,
              isTestMode: Boolean(l.is_test_mode),
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
              itemGenericName: (l as any).itemGenericName || 'Medication Transaction Record',
              quantityChanged: Number(l.quantityChanged) || 0,
              actionType: l.actionType || 'DISPENSE',
              userRole: l.userRole || 'STAFF',
              details: l.details || 'Clinical inventory adjustment logged.',
              createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
              lotNumbers: parseLotNumbers(l.lotNumbers),
              dispensedBottles: Number(l.dispensedBottles) || 0,
              dispensedUnit: l.dispensedUnit || null,
              dispensedPillsPerBottle: Number(l.dispensedPillsPerBottle) || 0,
              isTestMode: Boolean(l.isTestMode),
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
      logsSnapshot: finalLogs,
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

      // Restore historical audit & discard logs if present in backup snapshot
      if (Array.isArray(targetBackup.logs) && targetBackup.logs.length > 0) {
        const restoredLogs = targetBackup.logs.map((log: any) => {
          const rawLots = log.lotNumbers || log.lot_numbers || [];
          const lots = parseLotNumbers(rawLots);
          return {
            id: log.id || `log_restore_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            item_id: log.itemId || log.item_id || 'RESTORE',
            item_generic_name: log.itemGenericName || log.item_generic_name || 'Medication Transaction Record',
            quantity_changed: Number(log.quantityChanged ?? log.quantity_changed) || 0,
            action_type: log.actionType || log.action_type || 'DISPENSE',
            user_role: log.userRole || log.user_role || 'ADMIN',
            details: log.details || 'Clinical inventory adjustment logged.',
            created_at: log.createdAt || log.created_at || new Date().toISOString(),
            lot_numbers: JSON.stringify(lots),
            dispensed_bottles: Number(log.dispensedBottles ?? log.dispensed_bottles) || 0,
            dispensed_unit: log.dispensedUnit || log.dispensed_unit || null,
            dispensed_pills_per_bottle: Number(log.dispensedPillsPerBottle ?? log.dispensed_pills_per_bottle) || 0,
          };
        });

        for (let i = 0; i < restoredLogs.length; i += 100) {
          const batch = restoredLogs.slice(i, i + 100);
          await supabase.from('dispense_logs').upsert(batch, { onConflict: 'id' });
        }
      }

      // Add restoration audit log
      await supabase.from('dispense_logs').insert([{
        id: `log_restore_${Date.now()}`,
        item_id: targetBackup.inventory[0]?.id || 'RESTORE',
        item_generic_name: 'SYSTEM WIDE RESTORE',
        quantity_changed: 0,
        action_type: 'AUDIT',
        user_role: 'ADMIN',
        details: `Clinic inventory and audit trail successfully restored from historical weekly backup: "${targetBackup.title}".`,
        created_at: new Date().toISOString(),
      }]);
    }

    // 2. Synchronize SQLite local database if accessible
    try {
      if (Array.isArray(targetBackup.inventory) && targetBackup.inventory.length > 0) {
        await prisma.inventoryItem.deleteMany({}).catch(() => null);
        for (const item of targetBackup.inventory) {
          await prisma.inventoryItem.create({
            data: {
              id: item.id,
              shelfLocation: item.shelfLocation || item.shelf_location,
              genericName: item.genericName || item.generic_name,
              brandName: item.brandName || item.brand_name || null,
              chemicalName: item.chemicalName || item.chemical_name || null,
              dosage: item.dosage || '',
              itemType: item.itemType || item.item_type || 'TABLET',
              stockUnit: item.stockUnit || item.stock_unit || 'Bottles',
              subUnit: item.subUnit || item.sub_unit || 'pills',
              bottlesAvailable: item.bottlesAvailable ?? item.bottles_available ?? 0,
              pillsPerBottle: item.pillsPerBottle ?? item.pills_per_bottle ?? 0,
              looseUnitsAvailable: item.looseUnitsAvailable ?? item.loose_units_available ?? 0,
              expirationDate: item.expirationDate || item.expiration_date || '',
              lotNumbers: typeof item.lotNumbers === 'string' ? item.lotNumbers : JSON.stringify(item.lotNumbers || []),
              directions: item.directions || null,
            },
          }).catch(() => null);
        }
      }

      if (Array.isArray(targetBackup.logs) && targetBackup.logs.length > 0) {
        for (const log of targetBackup.logs) {
          const lots = parseLotNumbers(log.lotNumbers || log.lot_numbers);
          await prisma.dispenseLog.upsert({
            where: { id: log.id },
            update: {
              lotNumbers: JSON.stringify(lots),
              details: log.details || '',
              quantityChanged: Number(log.quantityChanged ?? log.quantity_changed) || 0,
            },
            create: {
              id: log.id,
              itemId: log.itemId || log.item_id || 'RESTORE',
              quantityChanged: Number(log.quantityChanged ?? log.quantity_changed) || 0,
              actionType: log.actionType || log.action_type || 'DISPENSE',
              userRole: log.userRole || log.user_role || 'ADMIN',
              details: log.details || 'Clinical inventory adjustment logged.',
              createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
              lotNumbers: JSON.stringify(lots),
              dispensedBottles: Number(log.dispensedBottles ?? log.dispensed_bottles) || 0,
              dispensedUnit: log.dispensedUnit || log.dispensed_unit || null,
              dispensedPillsPerBottle: Number(log.dispensedPillsPerBottle ?? log.dispensed_pills_per_bottle) || 0,
            },
          }).catch(() => null);
        }
      }
    } catch (dbErr) {
      // Ignore on serverless
    }

    return NextResponse.json({ success: true, message: `Successfully restored inventory and logs from backup: ${targetBackup.title}` });
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
