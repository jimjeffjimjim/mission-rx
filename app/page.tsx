'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { InventoryItem, AuthRole, FilterCategory, StatusFilter, DispenseLog } from '@/types/inventory';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import InventoryCard from '@/components/InventoryCard';
import ItemEditModal from '@/components/ItemEditModal';
import AdminPortal from '@/components/AdminPortal';
import AuditLogModal from '@/components/AuditLogModal';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { subscribeToClinicalUpdates } from '@/lib/supabase';
import { Layers, RefreshCw } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { calculateTotalUnits, convertTotalUnitsToStock } from '@/lib/stockMath';

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

  // Testing Sandbox Isolation State
  const [isTestingMode, setIsTestingMode] = useState<boolean>(false);
  const [testAuditLogs, setTestAuditLogs] = useState<DispenseLog[]>([]);
  const isTestingModeRef = useRef<boolean>(false);
  const baselineItemsRef = useRef<InventoryItem[]>([]);

  // Interaction resilience refs for rapid clicking & network debouncing
  const isUpdatingStockRef = useRef(false);
  const stockUpdateTimersRef = useRef<{ [id: string]: any }>({});
  const auditLogAccumulatorsRef = useRef<{ [key: string]: any }>({});
  const auditLogTimersRef = useRef<{ [key: string]: any }>({});
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

    const checkTestingMode = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('mission_rx_testing_mode');
        const active = stored === 'true';
        const wasActive = isTestingModeRef.current;
        isTestingModeRef.current = active;
        setIsTestingMode(active);

        // If exiting testing mode, cleanly revert to baseline or refetch from server
        if (wasActive && !active) {
          setTestAuditLogs([]);
          if (baselineItemsRef.current.length > 0) {
            setItems(baselineItemsRef.current);
            saveLocalCache(baselineItemsRef.current);
            baselineItemsRef.current = [];
          }
          fetchInventory();
        } else if (!wasActive && active) {
          // Entering test mode: capture snapshot
          if (itemsRef.current.length > 0) {
            baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
          }
        }
      }
    };

    checkTestingMode();

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.testingMode === 'boolean') {
          const active = data.testingMode;
          const wasActive = isTestingModeRef.current;
          isTestingModeRef.current = active;
          setIsTestingMode(active);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mission_rx_testing_mode', active ? 'true' : 'false');
          }
          if (wasActive && !active) {
            setTestAuditLogs([]);
            if (baselineItemsRef.current.length > 0) {
              setItems(baselineItemsRef.current);
              saveLocalCache(baselineItemsRef.current);
              baselineItemsRef.current = [];
            }
            fetchInventory();
          } else if (!wasActive && active && itemsRef.current.length > 0) {
            baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
          }
        }
      })
      .catch(() => {});

    window.addEventListener('storage', checkTestingMode);
    window.addEventListener('mission_rx_testing_mode_change', checkTestingMode);
    return () => {
      window.removeEventListener('storage', checkTestingMode);
      window.removeEventListener('mission_rx_testing_mode_change', checkTestingMode);
    };
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

  const [actorTag, setActorTag] = useState<string>('STAFF');

  const handleToggleAutofill = () => {
    const newVal = !isAutofillEnabled;
    setIsAutofillEnabled(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mission_rx_autofill_enabled', String(newVal));
    }
  };

  const handleSwitchRole = useCallback((newRole: AuthRole, newActor?: string) => {
    setRole(newRole);
    if (newActor) {
      setActorTag(newActor);
    } else if (newRole === 'ADMIN') {
      setActorTag('ADMIN');
    } else {
      setActorTag('STAFF');
    }
  }, []);

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
        // Clear any pending debounced stock updates to prevent race conditions during reset
        Object.keys(stockUpdateTimersRef.current).forEach((key) => {
          if (stockUpdateTimersRef.current[key]) {
            clearTimeout(stockUpdateTimersRef.current[key]);
            delete stockUpdateTimersRef.current[key];
          }
        });
        isUpdatingStockRef.current = false;
        itemsRef.current = data;
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
      userRole: actorTag || (role === 'LOCKED' ? 'STAFF' : role),
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
    // If in Testing Sandbox mode, mutate ONLY in-memory state without database persistence
    if (isTestingMode) {
      if (baselineItemsRef.current.length === 0 && itemsRef.current.length > 0) {
        baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
      }
      const target = itemsRef.current.find((i) => i.id === id);
      if (target) {
        const bottleDiff = newBottles - target.bottlesAvailable;
        const looseDiff = newLoose - target.looseUnitsAvailable;
        const totalChange = bottleDiff !== 0 ? bottleDiff : looseDiff;
        if (totalChange !== 0) {
          const actionType = totalChange < 0 ? 'DISPENSE' : 'RESTOCK';
          const unitType = bottleDiff !== 0 ? (target.stockUnit || 'bottles') : (target.subUnit || 'loose units');
          const verb = totalChange < 0 ? 'Dispensed' : 'Restocked';
          setTestAuditLogs((prev) => [
            {
              id: 'test-log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
              itemId: target.id,
              itemGenericName: `${target.genericName} (${target.dosage})`,
              quantityChanged: totalChange,
              actionType,
              userRole: `${actorTag} (TEST)`,
              details: `[TESTING MODE - NOT REAL]: ${verb} ${Math.abs(totalChange)} ${unitType} in test sandbox`,
              isTestMode: true,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, bottlesAvailable: newBottles, looseUnitsAvailable: newLoose } : item
        )
      );
      return;
    }

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
          const itemKey = `${target.id}_${unitType}`;
          if (!auditLogAccumulatorsRef.current[itemKey]) {
            auditLogAccumulatorsRef.current[itemKey] = {
              itemId: target.id,
              itemGenericName: `${target.genericName} (${target.dosage})`,
              quantityChanged: totalChange,
              unitType,
              newBottles,
              newLoose,
            };
          } else {
            auditLogAccumulatorsRef.current[itemKey].quantityChanged += totalChange;
            auditLogAccumulatorsRef.current[itemKey].newBottles = newBottles;
            auditLogAccumulatorsRef.current[itemKey].newLoose = newLoose;
          }

          if (auditLogTimersRef.current[itemKey]) {
            clearTimeout(auditLogTimersRef.current[itemKey]);
          }

          auditLogTimersRef.current[itemKey] = setTimeout(() => {
            const pending = auditLogAccumulatorsRef.current[itemKey];
            if (pending && pending.quantityChanged !== 0) {
              const pendingAction = pending.quantityChanged < 0 ? 'DISPENSE' : 'RESTOCK';
              const pendingVerb = pending.quantityChanged < 0 ? 'Dispensed to patient/department' : 'Restocked from clinical supplier';

              recordAuditLog({
                itemId: pending.itemId,
                itemGenericName: pending.itemGenericName,
                quantityChanged: pending.quantityChanged,
                actionType: pendingAction,
                details: `${pendingVerb}: ${Math.abs(pending.quantityChanged)} ${pending.unitType} [Remaining: ${pending.newBottles} bottles, ${pending.newLoose} loose]`,
              });
            }
            delete auditLogAccumulatorsRef.current[itemKey];
            delete auditLogTimersRef.current[itemKey];
          }, 100);
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

    // Debounce database sync to eliminate out-of-order network race conditions during rapid clicking
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
    }, 150);
  };

  // Delta adjustment for rapid multi-click "spamming" without closure or state batching race conditions
  const handleAdjustStock = (id: string, bottleDelta: number, looseDelta: number) => {
    // If in Testing Sandbox mode, mutate ONLY in-memory state without database persistence
    if (isTestingMode) {
      if (baselineItemsRef.current.length === 0 && itemsRef.current.length > 0) {
        baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
      }
      const target = itemsRef.current.find((i) => i.id === id);
      if (target) {
        const newBottles = Math.max(0, target.bottlesAvailable + bottleDelta);
        const newLoose = Math.max(0, target.looseUnitsAvailable + looseDelta);
        const actualBottleDiff = newBottles - target.bottlesAvailable;
        const actualLooseDiff = newLoose - target.looseUnitsAvailable;
        const totalChange = actualBottleDiff !== 0 ? actualBottleDiff : actualLooseDiff;
        if (totalChange !== 0) {
          const actionType = totalChange < 0 ? 'DISPENSE' : 'RESTOCK';
          const unitType = actualBottleDiff !== 0 ? (target.stockUnit || 'bottles') : (target.subUnit || 'loose units');
          const verb = totalChange < 0 ? 'Dispensed' : 'Restocked';
          setTestAuditLogs((prev) => [
            {
              id: 'test-log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
              itemId: target.id,
              itemGenericName: `${target.genericName} (${target.dosage})`,
              quantityChanged: totalChange,
              actionType,
              userRole: `${actorTag} (TEST)`,
              details: `[TESTING MODE - NOT REAL]: ${verb} ${Math.abs(totalChange)} ${unitType} in test sandbox`,
              isTestMode: true,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                bottlesAvailable: Math.max(0, item.bottlesAvailable + bottleDelta),
                looseUnitsAvailable: Math.max(0, item.looseUnitsAvailable + looseDelta),
              }
            : item
        )
      );
      return;
    }

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
      const unitType = actualBottleDiff !== 0 ? (target.stockUnit || 'bottles') : (target.subUnit || 'loose units');
      const itemKey = `${target.id}_${unitType}`;

      if (!auditLogAccumulatorsRef.current[itemKey]) {
        auditLogAccumulatorsRef.current[itemKey] = {
          itemId: target.id,
          itemGenericName: `${target.genericName} (${target.dosage})`,
          quantityChanged: totalChange,
          unitType,
          newBottles,
          newLoose,
        };
      } else {
        auditLogAccumulatorsRef.current[itemKey].quantityChanged += totalChange;
        auditLogAccumulatorsRef.current[itemKey].newBottles = newBottles;
        auditLogAccumulatorsRef.current[itemKey].newLoose = newLoose;
      }

      if (auditLogTimersRef.current[itemKey]) {
        clearTimeout(auditLogTimersRef.current[itemKey]);
      }

      auditLogTimersRef.current[itemKey] = setTimeout(() => {
        const pending = auditLogAccumulatorsRef.current[itemKey];
        if (pending && pending.quantityChanged !== 0) {
          const pendingAction = pending.quantityChanged < 0 ? 'DISPENSE' : 'RESTOCK';
          const pendingVerb = pending.quantityChanged < 0 ? 'Dispensed to patient/department' : 'Restocked from clinical supplier';

          recordAuditLog({
            itemId: pending.itemId,
            itemGenericName: pending.itemGenericName,
            quantityChanged: pending.quantityChanged,
            actionType: pendingAction,
            details: `${pendingVerb}: ${Math.abs(pending.quantityChanged)} ${pending.unitType} [Remaining: ${pending.newBottles} bottles, ${pending.newLoose} loose]`,
          });
        }
        delete auditLogAccumulatorsRef.current[itemKey];
        delete auditLogTimersRef.current[itemKey];
      }, 100);

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
          body: JSON.stringify({ ...latestItem, isFullEdit: false }),
        }).catch((e) => console.error('Failed to sync stock update', e));
      }
      delete stockUpdateTimersRef.current[id];
    }, 150);
  };

  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    // If in Testing Sandbox mode, save in-memory only without network requests
    if (isTestingMode) {
      if (baselineItemsRef.current.length === 0 && itemsRef.current.length > 0) {
        baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
      }
      if (itemData.id) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemData.id ? ({ ...i, ...itemData } as InventoryItem) : i))
        );
        setTestAuditLogs((prev) => [
          {
            id: 'test-edit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            itemId: itemData.id || 'test-item',
            itemGenericName: itemData.genericName || 'Medication',
            quantityChanged: 0,
            actionType: 'EDIT',
            userRole: `${actorTag} (TEST)`,
            details: `[TESTING MODE - NOT REAL]: Updated medication details for ${itemData.genericName} in sandbox`,
            isTestMode: true,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        const newItem: InventoryItem = {
          id: `test-item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          shelfLocation: itemData.shelfLocation || 'General Medical',
          genericName: itemData.genericName || 'New Medication',
          brandName: itemData.brandName || null,
          chemicalName: itemData.chemicalName || null,
          dosage: itemData.dosage || '10mg',
          itemType: itemData.itemType || 'TABLET',
          stockUnit: itemData.stockUnit || 'Bottles',
          subUnit: itemData.subUnit || 'pills',
          bottlesAvailable: Number(itemData.bottlesAvailable) || 0,
          pillsPerBottle: Number(itemData.pillsPerBottle) || 100,
          looseUnitsAvailable: Number(itemData.looseUnitsAvailable) || 0,
          expirationDate: itemData.expirationDate || new Date().toISOString().split('T')[0],
          lotNumbers: typeof itemData.lotNumbers === 'string' ? itemData.lotNumbers : JSON.stringify(itemData.lotNumbers || []),
          directions: itemData.directions || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        setTestAuditLogs((prev) => [
          {
            id: 'test-create-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            itemId: newItem.id,
            itemGenericName: newItem.genericName,
            quantityChanged: newItem.bottlesAvailable,
            actionType: 'CREATE',
            userRole: `${actorTag} (TEST)`,
            details: `[TESTING MODE - NOT REAL]: Created new test medication ${newItem.genericName}`,
            isTestMode: true,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setIsEditModalOpen(false);
      setActiveItem(null);
      return;
    }

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
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(`Failed to save medication to database: ${errData.error || res.statusText || 'Unknown error'}`);
          return;
        }
      } catch (e: any) {
        console.error('Error creating item', e);
        alert(`Network or connection error while saving medication: ${e?.message || 'Unknown exception'}`);
        return;
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    // If in Testing Sandbox mode, delete from in-memory array ONLY without database calls
    if (isTestingMode) {
      if (baselineItemsRef.current.length === 0 && itemsRef.current.length > 0) {
        baselineItemsRef.current = JSON.parse(JSON.stringify(itemsRef.current));
      }
      const target = itemsRef.current.find((i) => i.id === id);
      setTestAuditLogs((prev) => [
        {
          id: 'test-del-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          itemId: id,
          itemGenericName: target?.genericName || 'Medication Item',
          quantityChanged: 0,
          actionType: 'DELETE',
          userRole: `${actorTag} (TEST)`,
          details: `[TESTING MODE - NOT REAL]: Removed ${target?.genericName || 'medication'} in test sandbox`,
          isTestMode: true,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }

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
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Group and consolidate inventory by categories for Doctor View
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
      .map((category) => {
        const rawCategoryItems = groups[category] || [];
        
        // Merge identical medications for doctors (matching genericName + dosage + subUnit)
        const consolidatedMap = new Map<string, InventoryItem>();

        rawCategoryItems.forEach((item) => {
          const key = `${(item.genericName || '').trim().toLowerCase()}_${(item.dosage || '').trim().toLowerCase()}_${(item.subUnit || 'units').trim().toLowerCase()}`;
          
          if (!consolidatedMap.has(key)) {
            let itemLots: string[] = [];
            try {
              itemLots = Array.isArray(item.lotNumbers) 
                ? item.lotNumbers 
                : (typeof item.lotNumbers === 'string' ? JSON.parse(item.lotNumbers || '[]') : []);
            } catch (e) {
              itemLots = [];
            }
            consolidatedMap.set(key, { ...item, lotNumbers: itemLots });
          } else {
            const existing = consolidatedMap.get(key)!;
            const existingTotal = calculateTotalUnits(existing.bottlesAvailable || 0, existing.pillsPerBottle || 0, existing.looseUnitsAvailable || 0);
            const itemTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 0, item.looseUnitsAvailable || 0);
            const combinedTotal = existingTotal + itemTotal;

            const packSize = existing.pillsPerBottle || item.pillsPerBottle || 0;
            const { bottles, loose } = convertTotalUnitsToStock(combinedTotal, packSize);

            let existingLots: string[] = Array.isArray(existing.lotNumbers) ? existing.lotNumbers : [];
            let itemLots: string[] = [];
            try {
              itemLots = Array.isArray(item.lotNumbers)
                ? item.lotNumbers
                : (typeof item.lotNumbers === 'string' ? JSON.parse(item.lotNumbers || '[]') : []);
            } catch (e) {
              itemLots = [];
            }
            const mergedLots = Array.from(new Set([...existingLots, ...itemLots]));

            consolidatedMap.set(key, {
              ...existing,
              bottlesAvailable: bottles,
              looseUnitsAvailable: loose,
              lotNumbers: mergedLots,
            });
          }
        });

        return {
          category,
          items: Array.from(consolidatedMap.values()),
        };
      });
  }, [filteredItems]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28 selection:bg-teal-600 selection:text-white">
      {/* 4-Digit PIN Security Gate */}
      <AuthGate currentRole={role} onAuthenticate={handleSwitchRole} />

      {/* Main Header Navigation Bar */}
      <Header
        currentRole={role}
        onSwitchRole={handleSwitchRole}
        onOpenCreateModal={openCreateModal}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
      />

      {/* DEDICATED ADMIN CONTROL PORTAL VIEW */}
      <div className={role === 'ADMIN' ? 'max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 block animate-in fade-in duration-150' : 'hidden'}>
        <AdminPortal
          items={items}
          onUpdateStock={handleUpdateStock}
          onAdjustStock={handleAdjustStock}
          onEditItem={openEditModal}
          onDeleteItem={handleDeleteItem}
          onOpenCreateModal={openCreateModal}
          onOpenAuditLogs={() => setIsAuditModalOpen(true)}
          onRefreshData={fetchInventory}
          userRole={actorTag}
          onAddTestAuditLog={(log) => setTestAuditLogs((prev) => [log, ...prev])}
        />
      </div>

      {/* CLEAN DOCTOR STAFF VIEW */}
      <div className={role === 'STAFF' ? 'block animate-in fade-in duration-150' : 'hidden'}>
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
      </div>

      {/* Medication Create & Edit Modal Sheet */}
      <ItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={activeItem}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        isAutofillEnabled={isAutofillEnabled}
      />

      {/* Footer Legal & Compliance Navigation Bar */}
      <footer className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-16 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>MissionRx &copy; 2026 Pharmaceutical Inventory System</span>
          <span className="text-slate-300">•</span>
          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">v2.8 Live</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-bold text-slate-600">
          <Link href="/instructions" className="text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 font-extrabold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
            <span>📖 User Manual & Instructions</span>
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/privacy" className="hover:text-teal-700 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/terms" className="hover:text-amber-700 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>

      {/* Regulatory Compliance & Dispense Audit Log Viewer */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onLogsCleared={fetchInventory}
        testLogs={testAuditLogs}
      />
    </main>
  );
}
