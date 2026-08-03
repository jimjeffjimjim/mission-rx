'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, AuthRole, FilterCategory, StatusFilter } from '@/types/inventory';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import InventoryCard from '@/components/InventoryCard';
import ItemEditModal from '@/components/ItemEditModal';
import AdminPortal from '@/components/AdminPortal';
import AuditLogModal from '@/components/AuditLogModal';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { checkLASA } from '@/lib/lasa';
import { subscribeToClinicalUpdates } from '@/lib/supabase';
import { Layers, RefreshCw } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const LOCAL_CACHE_KEY = 'mission_rx_inventory_cache';

export default function Home() {
  // App launches with 4-Digit PIN Gate requiring 1234 for Doctors (Staff) or 8888 for Admin Control Portal
  const [role, setRole] = useState<AuthRole>('LOCKED');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');

  // Master Autofill & Modal states
  const [isAutofillEnabled, setIsAutofillEnabled] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  // Interaction resilience refs for rapid clicking & network debouncing
  const isUpdatingStockRef = useRef(false);
  const stockUpdateTimersRef = useRef<{ [id: string]: any }>({});
  const lockResetTimerRef = useRef<any>(null);
  const isProcessingQueueRef = useRef(false);
  const itemsRef = useRef<InventoryItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAutofill = localStorage.getItem('mission_rx_autofill_enabled');
      if (savedAutofill !== null) {
        setIsAutofillEnabled(savedAutofill === 'true');
      }

      // Check local cache for immediate render
      const localCached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  const saveLocalCache = (newItems: InventoryItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(newItems));
      } catch (e) {
        console.warn('Failed to save to local cache:', e);
      }
    }
  };

  const handleToggleAutofill = () => {
    const nextVal = !isAutofillEnabled;
    setIsAutofillEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mission_rx_autofill_enabled', String(nextVal));
    }
  };

  // Process pending audit logs sequentially in bulk batches to prevent dropping events during rapid clicking
  const processAuditQueue = async () => {
    if (isProcessingQueueRef.current || typeof window === 'undefined') return;
    const rawQueue = localStorage.getItem('mission_rx_audit_queue');
    if (!rawQueue) return;

    let queue: any[] = [];
    try {
      queue = JSON.parse(rawQueue);
    } catch (e) {
      localStorage.removeItem('mission_rx_audit_queue');
      return;
    }

    if (!Array.isArray(queue) || queue.length === 0) return;

    isProcessingQueueRef.current = true;
    const batch = queue.slice(0, 100);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      if (res.ok || (res.status !== 500 && res.status !== 504)) {
        const currentRaw = localStorage.getItem('mission_rx_audit_queue');
        if (currentRaw) {
          try {
            const currentQueue: any[] = JSON.parse(currentRaw);
            const sentIds = new Set(batch.map((b: any) => b.id));
            const remainingQueue = currentQueue.filter((item: any) => !sentIds.has(item.id));
            localStorage.setItem('mission_rx_audit_queue', JSON.stringify(remainingQueue));
          } catch (e) {
            localStorage.setItem('mission_rx_audit_queue', JSON.stringify([]));
          }
        }
      }
    } catch (err) {
      // Network offline or temporary interruption; retry in next loop
    }
    isProcessingQueueRef.current = false;
  };

  useEffect(() => {
    const queueTimer = setInterval(processAuditQueue, 300);
    return () => clearInterval(queueTimer);
  }, []);

  // Fetch inventory from API
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        saveLocalCache(data);

        // Check if an automated weekly backup is due (every 7 days)
        if (typeof window !== 'undefined' && Array.isArray(data) && data.length > 0) {
          const lastBackup = localStorage.getItem('mission_rx_last_auto_backup');
          const now = Date.now();
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (!lastBackup || now - Number(lastBackup) > sevenDaysMs) {
            localStorage.setItem('mission_rx_last_auto_backup', String(now));
            fetch('/api/backups', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `Automated Weekly Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`,
                notes: 'Scheduled automatic weekly background backup of clinical formulary stock and audit logs.',
                inventory: data,
                logs: [],
              }),
            }).catch(() => null);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch inventory items', e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchInventory();
    const unsubscribe = subscribeToClinicalUpdates(() => {
      // Do not fetch and overwrite local state if the user is actively making rapid edits
      if (!isUpdatingStockRef.current) {
        fetchInventory();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Helper to record clinical transaction logs into persistent queue instantly
  const recordAuditLog = (logData: {
    itemId: string;
    itemGenericName: string;
    quantityChanged: number;
    actionType: 'DISPENSE' | 'RESTOCK' | 'EDIT' | 'CREATE' | 'DELETE' | 'AUDIT';
    details: string;
  }) => {
    if (typeof window === 'undefined') return;
    const payload = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...logData,
      userRole: role === 'LOCKED' ? 'STAFF' : role,
      createdAt: new Date().toISOString(),
    };

    try {
      const rawQueue = localStorage.getItem('mission_rx_audit_queue');
      const queue = rawQueue ? JSON.parse(rawQueue) : [];
      queue.push(payload);
      localStorage.setItem('mission_rx_audit_queue', JSON.stringify(queue));
      setTimeout(processAuditQueue, 10);
    } catch (e) {
      // Fallback direct network transmission if storage fails
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) => console.warn('Audit log direct write error:', err));
    }
  };

  // Rapid Optimistic stock updates with Debounced DB Sync & Instant Audit Queueing
  const handleUpdateStock = (id: string, newBottles: number, newLoose: number) => {
    // Lock real-time subscription refreshes during active user interactions
    isUpdatingStockRef.current = true;
    if (lockResetTimerRef.current) clearTimeout(lockResetTimerRef.current);
    lockResetTimerRef.current = setTimeout(() => {
      isUpdatingStockRef.current = false;
    }, 2500);

    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        const bottleDiff = newBottles - target.bottlesAvailable;
        const looseDiff = newLoose - target.looseUnitsAvailable;
        const totalChange = bottleDiff !== 0 ? bottleDiff : looseDiff;
        const actionType = totalChange < 0 ? 'DISPENSE' : 'RESTOCK';
        const unitType = bottleDiff !== 0 ? (target.stockUnit || 'bottles') : (target.subUnit || 'loose units');
        const verb = totalChange < 0 ? 'Dispensed to patient/department' : 'Restocked from clinical supplier';

        if (totalChange !== 0) {
          recordAuditLog({
            itemId: target.id,
            itemGenericName: `${target.genericName} (${target.dosage})`,
            quantityChanged: totalChange,
            actionType,
            details: `${verb}: ${Math.abs(totalChange)} ${unitType} [Remaining: ${newBottles} bottles, ${newLoose} loose]`,
          });
        }
      }

      const updated = prev.map((item) =>
        item.id === id
          ? { ...item, bottlesAvailable: newBottles, looseUnitsAvailable: newLoose }
          : item
      );

      saveLocalCache(updated);
      return updated;
    });

    // Debounce database sync by 400ms to eliminate out-of-order network race conditions during rapid clicking
    if (stockUpdateTimersRef.current[id]) {
      clearTimeout(stockUpdateTimersRef.current[id]);
    }

    stockUpdateTimersRef.current[id] = setTimeout(() => {
      const latestItem = itemsRef.current.find((i) => i.id === id);
      const payload = latestItem ? latestItem : { bottlesAvailable: newBottles, looseUnitsAvailable: newLoose };
      fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => console.error('Failed to sync stock update', e));
      delete stockUpdateTimersRef.current[id];
    }, 400);
  };

  // Delta adjustment for rapid multi-click "spamming" without closure or state batching race conditions
  const handleAdjustStock = (id: string, bottleDelta: number, looseDelta: number) => {
    isUpdatingStockRef.current = true;
    if (lockResetTimerRef.current) clearTimeout(lockResetTimerRef.current);
    lockResetTimerRef.current = setTimeout(() => {
      isUpdatingStockRef.current = false;
    }, 2500);

    // Synchronously update itemsRef so immediate successive clicks instantly read the newest stock counts
    const targetIndex = itemsRef.current.findIndex((i) => i.id === id);
    if (targetIndex === -1) return;

    const target = itemsRef.current[targetIndex];
    const newBottles = Math.max(0, target.bottlesAvailable + bottleDelta);
    const newLoose = Math.max(0, target.looseUnitsAvailable + looseDelta);
    const actualBottleDiff = newBottles - target.bottlesAvailable;
    const actualLooseDiff = newLoose - target.looseUnitsAvailable;
    const totalChange = actualBottleDiff !== 0 ? actualBottleDiff : actualLooseDiff;

    if (totalChange !== 0) {
      const actionType = totalChange < 0 ? 'DISPENSE' : 'RESTOCK';
      const unitType = actualBottleDiff !== 0 ? (target.stockUnit || 'bottles') : (target.subUnit || 'loose units');
      const verb = totalChange < 0 ? 'Dispensed to patient/department' : 'Restocked from clinical supplier';

      recordAuditLog({
        itemId: target.id,
        itemGenericName: `${target.genericName} (${target.dosage})`,
        quantityChanged: totalChange,
        actionType,
        details: `${verb}: ${Math.abs(totalChange)} ${unitType} [Remaining: ${newBottles} bottles, ${newLoose} loose]`,
      });

      const updatedItem = { ...target, bottlesAvailable: newBottles, looseUnitsAvailable: newLoose };
      itemsRef.current = itemsRef.current.map((item) => (item.id === id ? updatedItem : item));
      saveLocalCache(itemsRef.current);
      setItems([...itemsRef.current]);
    }

    if (stockUpdateTimersRef.current[id]) {
      clearTimeout(stockUpdateTimersRef.current[id]);
    }
    stockUpdateTimersRef.current[id] = setTimeout(() => {
      const latestItem = itemsRef.current.find((i) => i.id === id);
      if (latestItem) {
        fetch(`/api/inventory/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestItem),
        }).catch((e) => console.error('Failed to sync stock update', e));
      }
      delete stockUpdateTimersRef.current[id];
    }, 400);
  };

  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    if (itemData.id) {
      setItems((prev) => {
        const updated = prev.map((i) => (i.id === itemData.id ? ({ ...i, ...itemData } as InventoryItem) : i));
        saveLocalCache(updated);
        return updated;
      });

      recordAuditLog({
        itemId: itemData.id,
        itemGenericName: itemData.genericName || 'Medication Formulation',
        quantityChanged: 0,
        actionType: 'EDIT',
        details: `Updated formulation details, dosage strength (${itemData.dosage}), or lot tracking history.`,
      });

      try {
        await fetch(`/api/inventory/${itemData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
      } catch (e) {
        console.error('Error updating item', e);
      }
    } else {
      try {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (res.ok) {
          const newItem = await res.json();
          setItems((prev) => {
            const updated = [...prev, newItem];
            saveLocalCache(updated);
            return updated;
          });

          recordAuditLog({
            itemId: newItem.id || 'new-item',
            itemGenericName: `${newItem.genericName} (${newItem.dosage})`,
            quantityChanged: Number(newItem.bottlesAvailable) || 0,
            actionType: 'CREATE',
            details: `Created new clinic drug formulation in ${newItem.shelfLocation || 'General Medical'}.`,
          });
        }
      } catch (e) {
        console.error('Error creating item', e);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveLocalCache(updated);
      return updated;
    });

    if (target) {
      recordAuditLog({
        itemId: id,
        itemGenericName: target.genericName || 'Removed Medication',
        quantityChanged: -target.bottlesAvailable,
        actionType: 'DELETE',
        details: `Permanently retired drug formulation from active dispensary catalog.`,
      });
    }

    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting item', e);
    }
  };

  const openCreateModal = () => {
    setActiveItem(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setActiveItem(item);
    setIsEditModalOpen(true);
  };

  // Filter & Search Evaluation for Doctor View
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const genericMatch = item.genericName.toLowerCase().includes(q);
        const brandMatch = (item.brandName || '').toLowerCase().includes(q);
        const chemMatch = (item.chemicalName || '').toLowerCase().includes(q);
        const dosageMatch = item.dosage.toLowerCase().includes(q);
        if (!genericMatch && !brandMatch && !chemMatch && !dosageMatch) return false;
      }

      if (selectedCategory !== 'ALL') {
        const itemCat = (item.shelfLocation || '').toLowerCase().trim();
        const filterCat = selectedCategory.toLowerCase().trim();
        if (itemCat !== filterCat) {
          if (filterCat.includes('otc') && itemCat.includes('otc')) return true;
          if (filterCat.includes('psych') && itemCat.includes('psych')) return true;
          return false;
        }
      }

      if (selectedStatus === 'LOW_STOCK') {
        const isLow = item.bottlesAvailable < 2 || (item.bottlesAvailable === 0 && item.looseUnitsAvailable < 20);
        if (!isLow) return false;
      } else if (selectedStatus === 'EXPIRING') {
        try {
          const expDate = parseISO(item.expirationDate);
          const days = differenceInDays(expDate, new Date());
          if (isNaN(days) || days > 30) return false;
        } catch (e) {
          return false;
        }
      } else if (selectedStatus === 'LASA_ALERT') {
        const alert = checkLASA(item.genericName || item.brandName);
        if (!alert) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Group inventory by categories for Doctor View
  const groupedInventory = useMemo(() => {
    const groups: { [key: string]: InventoryItem[] } = {};
    const specialtyOrder = [
      'General Medical',
      'Allergy & Asthma',
      'Cardiology',
      'Dental',
      'Dermatology',
      'Orthopedics',
      'Psychiatry',
      'Pulmonology',
      'Over-The-Counter (OTC)',
      'Supplies',
    ];

    filteredItems.forEach((item) => {
      const loc = item.shelfLocation || 'General Medical';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        const idxA = specialtyOrder.indexOf(a);
        const idxB = specialtyOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((category) => ({
        category,
        items: groups[category],
      }));
  }, [filteredItems]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28 selection:bg-teal-600 selection:text-white">
      {/* 4-Digit PIN Security Gate */}
      <AuthGate currentRole={role} onAuthenticate={(newRole) => setRole(newRole)} />

      {/* Main Header Navigation Bar */}
      <Header
        currentRole={role}
        onSwitchRole={(newRole) => setRole(newRole)}
        onOpenCreateModal={openCreateModal}
        isAutofillEnabled={isAutofillEnabled}
        onToggleAutofill={handleToggleAutofill}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
      />

      {/* DEDICATED ADMIN CONTROL PORTAL VIEW */}
      {role === 'ADMIN' ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6">
          <AdminPortal
            items={items}
            onUpdateStock={handleUpdateStock}
            onAdjustStock={handleAdjustStock}
            onEditItem={openEditModal}
            onDeleteItem={handleDeleteItem}
            onOpenCreateModal={openCreateModal}
            onSwitchToDoctorView={() => setRole('STAFF')}
            onOpenAuditLogs={() => setIsAuditModalOpen(true)}
            onRefreshData={fetchInventory}
          />
        </div>
      ) : (
        /* CLEAN DOCTOR STAFF VIEW */
        <>
          {/* Filter Bar with Color-Coded Category Tabs */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            itemCount={filteredItems.length}
          />

          {/* Responsive Layout Container */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-7">
            {loading && items.length === 0 ? (
              <div className="py-28 flex flex-col items-center justify-center space-y-3.5 text-slate-500">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                <span className="font-extrabold text-sm tracking-wider uppercase">Loading hospital formulary...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 bg-white border border-slate-200/90 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3.5 shadow-xs">
                <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-500">
                  <Layers className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No formulations match your search</h3>
                <p className="text-xs font-medium text-slate-500 max-w-md">
                  Try clarifying your keyword query, switching active specialty tabs, or deselecting critical alert toggles above.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="mt-2 min-h-[48px] px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all touch-manipulation active:scale-95"
                >
                  Reset Filter Tabs
                </button>
              </div>
            ) : (
              /* Doctor View Grouped Specialty Cards */
              <div className="space-y-10">
                {groupedInventory.map(({ category, items: groupItems }) => {
                  const style = getSpecialtyColor(category);
                  return (
                    <section key={category} className="space-y-4">
                      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs select-none ${style.borderLeft}`}>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-2.5">
                          <span>{style.label}</span> 
                        </h2>
                        <span className={`font-mono text-xs font-black px-3 py-1 rounded-xl border shadow-2xs ${style.countBadge}`}>
                          {groupItems.length} {groupItems.length === 1 ? 'Formulation' : 'Formulations'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {groupItems.map((item) => (
                          <InventoryCard
                            key={item.id}
                            item={item}
                            role={role}
                            onUpdateStock={handleUpdateStock}
                            onAdjustStock={handleAdjustStock}
                            onEditItem={openEditModal}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Medication Create & Edit Modal Sheet */}
      <ItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={activeItem}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        isAutofillEnabled={isAutofillEnabled}
      />

      {/* Regulatory Compliance & Dispense Audit Log Viewer */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onLogsCleared={fetchInventory}
      />
    </main>
  );
}
