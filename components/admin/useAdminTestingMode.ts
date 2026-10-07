'use client';

import { useState, useEffect } from 'react';

export function useAdminTestingMode({
  onRefreshData,
  fetchAnalytics,
  timeframe,
  activeTab,
  requireDeveloper,
  setAnalyticsLogs,
  setTopDispensed,
}: {
  onRefreshData?: () => void;
  fetchAnalytics: (tf: 'today' | 'week' | 'month' | 'all') => void;
  timeframe: 'today' | 'week' | 'month' | 'all';
  activeTab: string;
  requireDeveloper: () => boolean;
  setAnalyticsLogs: (logs: any[]) => void;
  setTopDispensed: (items: any[]) => void;
}) {
  const [isLocalTestMode, setIsLocalTestMode] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [isResettingInventory, setIsResettingInventory] = useState(false);
  const [testItemsMap, setTestItemsMap] = useState<
    Record<string, { bottles: number; loose: number }>
  >({});
  const [testSimulatedLogs, setTestSimulatedLogs] = useState<
    Array<{ genericName: string; quantity: number; category: string }>
  >([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mission_rx_testing_mode');
      const active = stored === 'true';
      setIsTestingMode(active);
      setIsLocalTestMode(active);
    }
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.testingMode === 'boolean') {
          setIsTestingMode(data.testingMode);
          setIsLocalTestMode(data.testingMode);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'mission_rx_testing_mode',
              data.testingMode ? 'true' : 'false'
            );
          }
        }
      })
      .catch(() => {});

    const handleStorageChange = () => {
      const stored = localStorage.getItem('mission_rx_testing_mode');
      const active = stored === 'true';
      setIsTestingMode(active);
      setIsLocalTestMode(active);
      if (!active) {
        setTestItemsMap({});
        setTestSimulatedLogs([]);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mission_rx_testing_mode_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mission_rx_testing_mode_change', handleStorageChange);
    };
  }, []);

  const handleResetInventoryToStart = async () => {
    if (
      !confirm(
        'Are you sure you want to reset default drug stock counts to initial levels? (Your newly added custom medications and all audit history will be preserved)'
      )
    )
      return;
    if (isTestingMode) {
      setTestItemsMap({});
      setTestSimulatedLogs([]);
      if (onRefreshData) onRefreshData();
      return;
    }
    setIsResettingInventory(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mission_rx_audit_queue');
        localStorage.removeItem('mission_rx_inventory_cache');
      }
      const res = await fetch('/api/inventory/reset', { method: 'POST' });
      if (res.ok) {
        if (activeTab === 'USAGE') fetchAnalytics(timeframe);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error('Failed to reset inventory:', e);
    } finally {
      setIsResettingInventory(false);
    }
  };

  const handleClearAuditLogs = async () => {
    if (isTestingMode) {
      if (!confirm('Clear simulated test logs?')) return;
      setTestSimulatedLogs([]);
      setAnalyticsLogs([]);
      return;
    }
    if (!requireDeveloper()) {
      alert(
        'Regulatory compliance protection: Real transaction audit logs are permanent and cannot be deleted.'
      );
      return;
    }
    if (
      !confirm(
        'DEVELOPER OVERRIDE: Permanently delete ALL audit log records from Supabase and SQLite databases? This action cannot be undone.'
      )
    )
      return;
    try {
      const res = await fetch('/api/logs?developer=true', { method: 'DELETE' });
      if (res.ok) {
        setAnalyticsLogs([]);
        setTopDispensed([]);
        alert('All transaction audit logs permanently deleted.');
        await fetchAnalytics(timeframe);
        if (onRefreshData) onRefreshData();
      } else {
        alert('Failed to delete audit logs.');
      }
    } catch (e) {
      console.error('Failed clearing audit logs:', e);
      alert('Error clearing audit logs.');
    }
  };

  const handleExitTestingMode = () => {
    setIsTestingMode(false);
    setIsLocalTestMode(false);
    setTestItemsMap({});
    setTestSimulatedLogs([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mission_rx_testing_mode', 'false');
    }
  };

  return {
    isLocalTestMode,
    isTestingMode,
    setIsTestingMode,
    isResettingInventory,
    testItemsMap,
    setTestItemsMap,
    testSimulatedLogs,
    setTestSimulatedLogs,
    handleResetInventoryToStart,
    handleClearAuditLogs,
    handleExitTestingMode,
  };
}
