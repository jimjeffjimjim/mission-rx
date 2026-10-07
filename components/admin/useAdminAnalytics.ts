'use client';

import { useState, useEffect, useMemo } from 'react';
import { DispenseLog } from '@/types/inventory';
import {
  filterAndNetDispensaryLogs,
  filterDiscardLogs,
  parseLotNumbers,
} from '@/lib/stockMath';

export function useAdminAnalytics({
  activeTab,
  userRole,
  onRefreshData,
}: {
  activeTab: string;
  userRole?: string;
  onRefreshData?: () => void;
}) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [analyticsLogs, setAnalyticsLogs] = useState<DispenseLog[]>([]);
  const [topDispensed, setTopDispensed] = useState<
    { genericName: string; totalDispensed: number; category: string }[]
  >([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const dispensaryReportLogs = useMemo(() => {
    return filterAndNetDispensaryLogs(analyticsLogs);
  }, [analyticsLogs]);

  const [reportSubTab, setReportSubTab] = useState<'DISPENSARY' | 'DISCARD'>('DISPENSARY');

  const discardReportLogs = useMemo(() => {
    return filterDiscardLogs(analyticsLogs);
  }, [analyticsLogs]);

  const totalPillsDiscarded = useMemo(() => {
    return discardReportLogs.reduce(
      (acc, log) => acc + (log.effectivePillsDiscarded || 0),
      0
    );
  }, [discardReportLogs]);

  const totalBottlesDiscarded = useMemo(() => {
    return discardReportLogs.reduce(
      (acc, log) => acc + (log.effectiveBottlesDiscarded || 0),
      0
    );
  }, [discardReportLogs]);

  const [editingDispenseItem, setEditingDispenseItem] = useState<{
    genericName: string;
    totalDispensed: number;
    category: string;
  } | null>(null);
  const [newDispenseAmt, setNewDispenseAmt] = useState<number | string>('');
  const [isDispenseWarningOpen, setIsDispenseWarningOpen] = useState(false);
  const [savingDispenseEdit, setSavingDispenseEdit] = useState(false);

  const fetchAnalytics = async (tf: 'today' | 'week' | 'month' | 'all') => {
    setLoadingAnalytics(true);
    try {
      const tzOffset =
        typeof window !== 'undefined' ? new Date().getTimezoneOffset() : 0;
      const res = await fetch(`/api/analytics?timeframe=${tf}&tzOffset=${tzOffset}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsLogs(data.logs || []);
        setTopDispensed(data.topDispensedItems || []);
      }
    } catch (e) {
      console.error('Failed to fetch usage analytics', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USAGE') {
      fetchAnalytics(timeframe);
    }
  }, [activeTab, timeframe]);

  const handleConfirmDispenseEdit = async () => {
    if (!editingDispenseItem) return;
    setSavingDispenseEdit(true);
    try {
      const currentVal = editingDispenseItem.totalDispensed;
      const targetVal = Number(newDispenseAmt) || 0;
      const diff = targetVal - currentVal;
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemGenericName: editingDispenseItem.genericName,
          quantityChanged: -diff,
          actionType: 'EDIT',
          userRole: userRole || 'ADMIN',
          details: `Manual adjustment of total amount dispensed from ${currentVal} to ${targetVal} units via Usage Analytics.`,
          createdAt: new Date().toISOString(),
        }),
      });
      setIsDispenseWarningOpen(false);
      setEditingDispenseItem(null);
      await fetchAnalytics(timeframe);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error('Failed updating dispensed amount:', e);
    } finally {
      setSavingDispenseEdit(false);
    }
  };

  // Developer Authorization State
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const isDeveloper = userRole === 'DEVELOPER' || isDevUnlocked;

  const requireDeveloper = (): boolean => {
    if (isDeveloper) return true;
    const pin = prompt(
      'Enter Developer PIN (7777) to authorize developer administrative edit/delete access:'
    );
    if (pin === '7777') {
      setIsDevUnlocked(true);
      return true;
    }
    if (pin !== null) {
      alert('Incorrect Developer PIN.');
    }
    return false;
  };

  // Report Row Edit Modal State
  const [editingReportLog, setEditingReportLog] = useState<any | null>(null);
  const [reportLogItemName, setReportLogItemName] = useState<string>('');
  const [reportLogQty, setReportLogQty] = useState<string>('');
  const [reportLogBottles, setReportLogBottles] = useState<string>('');
  const [reportLogAction, setReportLogAction] = useState<string>('DISPENSE');
  const [reportLogLots, setReportLogLots] = useState<string>('');
  const [reportLogDetails, setReportLogDetails] = useState<string>('');
  const [savingReportEdit, setSavingReportEdit] = useState<boolean>(false);

  const handleOpenReportLogEdit = (log: any, isDiscard: boolean) => {
    if (!requireDeveloper()) return;
    setEditingReportLog({ ...log, _isDiscard: isDiscard });
    setReportLogItemName(log.itemGenericName || '');
    const rawQty = isDiscard
      ? -(log.effectivePillsDiscarded || Math.abs(log.quantityChanged || 0))
      : log.quantityChanged ??
        (log.actionType === 'RESTOCK' ? log.effectiveQty : -log.effectiveQty);
    setReportLogQty(String(rawQty));
    setReportLogBottles(
      String(
        log.dispensedBottles || (isDiscard ? log.effectiveBottlesDiscarded : 0) || 0
      )
    );
    setReportLogAction(log.actionType || (isDiscard ? 'DISCARD_EXPIRED' : 'DISPENSE'));
    const rawParsedLots = parseLotNumbers(log.lotNumbers);
    const parsedLots =
      rawParsedLots.length > 0
        ? rawParsedLots.join(', ')
        : log.discardLotNumber || '';
    setReportLogLots(parsedLots);
    setReportLogDetails((log.details || '').split(' | METADATA: ')[0].trim());
  };

  const handleConfirmReportLogEdit = async () => {
    if (!editingReportLog) return;
    setSavingReportEdit(true);
    try {
      const splitLots = reportLogLots
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      let cleanDetails = reportLogDetails.split(' | METADATA: ')[0].trim();
      if (splitLots.length > 0 && /Lot\s+[a-zA-Z0-9_\-]+/i.test(cleanDetails)) {
        cleanDetails = cleanDetails.replace(
          /Lot\s+[a-zA-Z0-9_\-]+/gi,
          `Lot ${splitLots.join(', ')}`
        );
      }
      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReportLog.id,
          itemGenericName: reportLogItemName,
          actionType: reportLogAction,
          quantityChanged: Number(reportLogQty) || 0,
          dispensedBottles: Number(reportLogBottles) || 0,
          lotNumbers: splitLots,
          details: cleanDetails,
          developer: true,
        }),
      });

      if (res.ok) {
        setEditingReportLog(null);
        await fetchAnalytics(timeframe);
        if (onRefreshData) onRefreshData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Failed to update report record: ${errJson.error || 'Server error'}`);
      }
    } catch (e) {
      console.error('Failed editing report log:', e);
      alert('Error updating report record.');
    } finally {
      setSavingReportEdit(false);
    }
  };

  const handleDeleteReportLog = async (log: any, label: string) => {
    if (!requireDeveloper()) return;
    if (
      !confirm(
        `DEVELOPER OVERRIDE: Permanently delete this ${label} transaction record for "${
          log.itemGenericName || 'item'
        }"? This removes it permanently from Supabase & SQLite databases and updates analytics.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/logs?id=${encodeURIComponent(log.id)}&developer=true`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await fetchAnalytics(timeframe);
        if (onRefreshData) onRefreshData();
      } else {
        alert('Failed to delete report record.');
      }
    } catch (e) {
      console.error('Failed deleting report log:', e);
      alert('Error deleting report record.');
    }
  };

  return {
    timeframe,
    setTimeframe,
    analyticsLogs,
    setAnalyticsLogs,
    topDispensed,
    setTopDispensed,
    loadingAnalytics,
    fetchAnalytics,
    dispensaryReportLogs,
    reportSubTab,
    setReportSubTab,
    discardReportLogs,
    totalPillsDiscarded,
    totalBottlesDiscarded,
    editingDispenseItem,
    setEditingDispenseItem,
    newDispenseAmt,
    setNewDispenseAmt,
    isDispenseWarningOpen,
    setIsDispenseWarningOpen,
    savingDispenseEdit,
    handleConfirmDispenseEdit,
    isDeveloper,
    requireDeveloper,
    editingReportLog,
    setEditingReportLog,
    reportLogItemName,
    setReportLogItemName,
    reportLogQty,
    setReportLogQty,
    reportLogBottles,
    setReportLogBottles,
    reportLogAction,
    setReportLogAction,
    reportLogLots,
    setReportLogLots,
    reportLogDetails,
    setReportLogDetails,
    savingReportEdit,
    handleOpenReportLogEdit,
    handleConfirmReportLogEdit,
    handleDeleteReportLog,
  };
}
