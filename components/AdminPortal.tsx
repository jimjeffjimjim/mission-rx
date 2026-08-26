'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem, FilterCategory, DispenseLog } from '@/types/inventory';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { 
  Plus, 
  Minus, 
  X,
  Edit2, 
  Trash2, 
  Search, 
  ShieldCheck, 
  BarChart3, 
  Table, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  RefreshCw,
  Activity,
  FileSpreadsheet,
  Palette,
  RotateCcw,
  KeyRound,
  Wrench,
  AlertTriangle,
  Check,
  Edit3,
  Database,
  Download,
  Upload,
  Clock,
  ShieldAlert,
  CheckCircle,
  HardDrive,
  FileText
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { calculateTotalUnits, convertTotalUnitsToStock } from '@/lib/stockMath';
import SpecialtyManagerModal from '@/components/SpecialtyManagerModal';
import SpreadsheetImportModal from '@/components/SpreadsheetImportModal';

interface AdminPortalProps {
  items: InventoryItem[];
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenAuditLogs?: () => void;
  onRefreshData?: () => void;
}

export default function AdminPortal({
  items,
  onUpdateStock,
  onAdjustStock,
  onEditItem,
  onDeleteItem,
  onOpenCreateModal,
  onOpenAuditLogs,
  onRefreshData,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'TABLE' | 'USAGE' | 'BACKUPS'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');

  // Test Mode & Dispense Modal State
  const [isLocalTestMode, setIsLocalTestMode] = useState(false);
  const [testItemsMap, setTestItemsMap] = useState<Record<string, { bottles: number; loose: number }>>({});
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseItem, setDispenseItem] = useState<InventoryItem | null>(null);
  const [dispenseAmount, setDispenseAmount] = useState<string>('');
  const [undispenseAmount, setUndispenseAmount] = useState<string>('');
  const [dispensingAction, setDispensingAction] = useState(false);

  // Weekly Backups State
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupTitle, setBackupTitle] = useState('');
  const [backupNotes, setBackupNotes] = useState('');
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [isRestoreWarningOpen, setIsRestoreWarningOpen] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<any | null>(null);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch weekly backups', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BACKUPS') {
      fetchBackups();
    }
  }, [activeTab]);

  const handleCreateWeeklyBackup = async () => {
    setCreatingBackup(true);
    try {
      let logsSnapshot = [];
      try {
        const logsRes = await fetch('/api/logs');
        if (logsRes.ok) logsSnapshot = await logsRes.json();
      } catch (e) {}

      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: backupTitle || `Weekly Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`,
          notes: backupNotes || 'Manual weekly snapshot triggered by administrator.',
          inventory: items,
          logs: logsSnapshot,
        }),
      });

      if (res.ok) {
        setBackupTitle('');
        setBackupNotes('');
        await fetchBackups();
      }
    } catch (e) {
      console.error('Failed creating backup:', e);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleConfirmRestoreBackup = async () => {
    if (!selectedBackupToRestore) return;
    setRestoringBackupId(selectedBackupToRestore.id);
    try {
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: selectedBackupToRestore.id }),
      });
      if (res.ok) {
        setIsRestoreWarningOpen(false);
        setSelectedBackupToRestore(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error('Failed to restore backup:', e);
    } finally {
      setRestoringBackupId(null);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('Delete this historical weekly backup snapshot?')) return;
    try {
      await fetch(`/api/backups?id=${id}`, { method: 'DELETE' });
      setBackups((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error('Failed deleting backup:', e);
    }
  };

  const handleDownloadBackupJSON = (backup: any) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mission_rx_weekly_backup_${backup.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modals state
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [isResettingInventory, setIsResettingInventory] = useState(false);

  // Testing mode and admin alert filter states
  const [isTestingMode, setIsTestingMode] = useState<boolean>(false);
  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING'>('ALL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mission_rx_testing_mode');
      const active = stored === 'true';
      setIsTestingMode(active);
      setIsLocalTestMode(active);
    }
    // Fetch global system setting
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.testingMode === 'boolean') {
          setIsTestingMode(data.testingMode);
          setIsLocalTestMode(data.testingMode);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mission_rx_testing_mode', data.testingMode ? 'true' : 'false');
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
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mission_rx_testing_mode_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mission_rx_testing_mode_change', handleStorageChange);
    };
  }, []);

  const handleRestoreFromJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!confirm(`Are you sure you want to restore from JSON file "${file.name}"? This will overwrite the current clinical database with the snapshot data.`)) {
        e.target.value = '';
        return;
      }
      setLoadingBackups(true);
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawBackup: parsed }),
      });
      if (res.ok) {
        alert('Database successfully restored from JSON backup file!');
        if (onRefreshData) onRefreshData();
        await fetchBackups();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to restore: ${errData.error || 'Invalid file format'}`);
      }
    } catch (err: any) {
      alert(`Invalid JSON file: ${err.message}`);
    } finally {
      setLoadingBackups(false);
      e.target.value = '';
    }
  };

  // Analytics State
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [analyticsLogs, setAnalyticsLogs] = useState<DispenseLog[]>([]);
  const [topDispensed, setTopDispensed] = useState<{ genericName: string; totalDispensed: number; category: string }[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [editingDispenseItem, setEditingDispenseItem] = useState<{ genericName: string; totalDispensed: number; category: string } | null>(null);
  const [newDispenseAmt, setNewDispenseAmt] = useState<number | string>('');
  const [isDispenseWarningOpen, setIsDispenseWarningOpen] = useState(false);
  const [savingDispenseEdit, setSavingDispenseEdit] = useState(false);

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
          userRole: 'ADMIN',
          details: `Manual adjustment of total amount dispensed from ${currentVal} to ${targetVal} units via Usage Analytics.`,
          createdAt: new Date().toISOString()
        })
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

  // Fetch Usage Analytics Data
  const fetchAnalytics = async (tf: 'today' | 'week' | 'month' | 'all') => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics?timeframe=${tf}`);
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

  const handleResetInventoryToStart = async () => {
    if (!confirm('Are you sure you want to reset default drug stock counts to initial levels? (Your newly added custom medications will be preserved and will NOT be deleted)')) {
      return;
    }
    setIsResettingInventory(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mission_rx_audit_queue');
        localStorage.removeItem('mission_rx_inventory_cache');
      }
      await fetch('/api/logs', { method: 'DELETE' });
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
    if (!confirm('Reset all audit logs?')) return;
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      if (activeTab === 'USAGE') fetchAnalytics(timeframe);
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  };

  // Apply Local Test Mode Sandbox Overlay
  const displayItems = isLocalTestMode ? items.map(item => {
    const testVal = testItemsMap[item.id];
    return testVal ? { ...item, bottlesAvailable: testVal.bottles, looseUnitsAvailable: testVal.loose } : item;
  }) : items;

  // Overall Stats
  const totalItems = displayItems.length;
  const lowStockCount = displayItems.filter(
    (i) => i.bottlesAvailable < 2 || (i.bottlesAvailable === 0 && i.looseUnitsAvailable < 20)
  ).length;
  const expiringCount = displayItems.filter((i) => {
    try {
      const expDate = parseISO(i.expirationDate);
      const days = differenceInDays(expDate, new Date());
      return !isNaN(days) && days <= 30;
    } catch (e) {
      return false;
    }
  }).length;

  const totalBottles = displayItems.reduce((acc, item) => acc + item.bottlesAvailable, 0);

  // Filter Table Items
  const filtered = displayItems.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.genericName.toLowerCase().includes(q);
      const matchBrand = (item.brandName || '').toLowerCase().includes(q);
      const matchChem = (item.chemicalName || '').toLowerCase().includes(q);
      const matchDosage = item.dosage.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchChem && !matchDosage) return false;
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

    if (adminStatusFilter === 'LOW_STOCK') {
      const isLow = item.bottlesAvailable < 2 || (item.bottlesAvailable === 0 && item.looseUnitsAvailable < 20);
      if (!isLow) return false;
    }
    if (adminStatusFilter === 'EXPIRING') {
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

  const maxDispensed = topDispensed.length > 0 ? topDispensed[0].totalDispensed : 1;

  return (
    <div className="space-y-6 pb-16 select-none max-w-full overflow-x-hidden">
      {/* ======================================================================================================= */}
      {/* [TESTING & DEV UTILITIES BLOCK - REMOVE BEFORE FINAL PRODUCTION DEPLOYMENT]                              */}
      {/* This entire section is tightly coupled here so you can delete or comment out this single div block      */}
      {/* to remove all testing hints, PIN reminders, Reset Stock Counts, and Clear Audit Logs features at once.  */}
      {/* ======================================================================================================= */}
      {isTestingMode && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Wrench className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>Dev & Testing Utilities</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Temporary</span>
              </span>
              <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-2">
                <span>Doctor PIN: <strong className="font-mono text-teal-400">1234</strong></span>
                <span>|</span>
                <span>Admin PIN: <strong className="font-mono text-amber-400">8888</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetInventoryToStart}
              disabled={isResettingInventory}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Reset default item stock counts to initial levels (custom medications are preserved)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingInventory ? 'animate-spin' : ''}`} />
              <span>Reset Stock Counts to Start</span>
            </button>

            <button
              type="button"
              onClick={handleClearAuditLogs}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Reset all audit log entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Audit Logs</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Portal Banner Header */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-5 sm:p-6 text-slate-950 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-slate-950" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 text-amber-400 shadow-md shrink-0">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  Admin Control Center
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-900/80">
                  Central Pharmaceutical Inventory & Dispense Analytics Management
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSpreadsheetModalOpen(true)}
                className="min-h-[44px] px-3.5 bg-slate-950 hover:bg-slate-900 text-teal-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-teal-400/30 cursor-pointer"
                title="Import from Excel/CSV spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400 stroke-[2.5]" />
                <span>Import Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSpecialtyModalOpen(true)}
                className="min-h-[44px] px-3.5 bg-slate-950 hover:bg-slate-900 text-purple-300 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-purple-400/30 cursor-pointer"
                title="Edit specialties and badge colors"
              >
                <Palette className="w-4 h-4 text-purple-300 stroke-[2.5]" />
                <span>Specialties & Colors</span>
              </button>

              {onOpenAuditLogs && (
                <button
                  type="button"
                  onClick={onOpenAuditLogs}
                  className="min-h-[44px] px-3.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-amber-400/30 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>Audit Logs</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isTestingMode) {
                    const pin = window.prompt("Enter Secret Admin Testing PIN:");
                    if (pin === '9110') {
                      localStorage.setItem('mission_rx_testing_mode', 'true');
                      setIsTestingMode(true);
                      setIsLocalTestMode(true);
                      window.dispatchEvent(new Event('mission_rx_testing_mode_change'));
                      fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ testingMode: true }),
                      }).catch(() => {});
                    } else if (pin !== null) {
                      alert("Incorrect PIN. Access denied.");
                    }
                  } else {
                    localStorage.setItem('mission_rx_testing_mode', 'false');
                    setIsTestingMode(false);
                    setIsLocalTestMode(false);
                    setTestItemsMap({});
                    window.dispatchEvent(new Event('mission_rx_testing_mode_change'));
                    fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ testingMode: false }),
                    }).catch(() => {});
                  }
                }}
                className={`min-h-[44px] px-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border cursor-pointer ${
                  isTestingMode
                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-amber-400/20'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
                title={isTestingMode ? "Testing Sandbox Active - Click to Exit and Reset Local Changes" : "Click to enter Testing Sandbox Mode"}
              >
                <Wrench className="w-4 h-4 stroke-[2.5]" />
                <span>{isTestingMode ? 'Testing Mode ON' : 'Test Mode'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenCreateModal}
                className="min-h-[44px] px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Medication</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
              <span className="text-[11px] font-black uppercase text-slate-600 block">Total Formulations</span>
              <span className="font-mono text-2xl font-black text-slate-900">{totalItems}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('TABLE');
                setAdminStatusFilter(adminStatusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK');
              }}
              className={`text-left transition-all rounded-2xl p-3.5 border shadow-xs cursor-pointer ${
                adminStatusFilter === 'LOW_STOCK'
                  ? 'bg-rose-600 border-rose-700 text-white shadow-md shadow-rose-500/30 scale-[1.02]'
                  : 'bg-white/90 backdrop-blur-md border-amber-400/40 hover:bg-white'
              }`}
              title="Click to view and filter low stock formulations"
            >
              <span className={`text-[11px] font-black uppercase block ${adminStatusFilter === 'LOW_STOCK' ? 'text-rose-100' : 'text-rose-700'}`}>Low Stock Alerts</span>
              <span className={`font-mono text-2xl font-black ${adminStatusFilter === 'LOW_STOCK' ? 'text-white' : 'text-rose-700'}`}>{lowStockCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('TABLE');
                setAdminStatusFilter(adminStatusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING');
              }}
              className={`text-left transition-all rounded-2xl p-3.5 border shadow-xs cursor-pointer ${
                adminStatusFilter === 'EXPIRING'
                  ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md shadow-amber-500/30 scale-[1.02]'
                  : 'bg-white/90 backdrop-blur-md border-amber-400/40 hover:bg-white'
              }`}
              title="Click to view formulations expiring within 30 days"
            >
              <span className={`text-[11px] font-black uppercase block ${adminStatusFilter === 'EXPIRING' ? 'text-slate-900' : 'text-amber-900'}`}>Expiring Within 30d</span>
              <span className={`font-mono text-2xl font-black ${adminStatusFilter === 'EXPIRING' ? 'text-slate-950' : 'text-amber-900'}`}>{expiringCount}</span>
            </button>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
              <span className="text-[11px] font-black uppercase text-teal-800 block">Total Sealed Bottles</span>
              <span className="font-mono text-2xl font-black text-teal-900">{totalBottles}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('TABLE')}
          className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border ${
            activeTab === 'TABLE'
              ? 'bg-slate-900 text-white border-slate-950 shadow-md scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Table className="w-4 h-4 stroke-[2.5]" />
          <span>Backdoor Inventory Table</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USAGE')}
          className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border ${
            activeTab === 'USAGE'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 stroke-[2.5]" />
          <span>Usage Reports & Dispense Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BACKUPS')}
          className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border ${
            activeTab === 'BACKUPS'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4 stroke-[2.5]" />
          <span>Weekly Backups & Recovery</span>
        </button>
      </div>

      {/* VIEW 1: BACKDOOR INVENTORY TABLE */}
      {activeTab === 'TABLE' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulations to edit, update counts, or modify lot numbers..."
                className="w-full pl-10 pr-4 min-h-[48px] bg-slate-50 border border-slate-300 focus:border-amber-600 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden select-text"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setAdminStatusFilter(adminStatusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
                className={`flex items-center gap-2 min-h-[48px] px-4 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 cursor-pointer ${
                  adminStatusFilter === 'LOW_STOCK'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/25 scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 stroke-[2.5] ${adminStatusFilter === 'LOW_STOCK' ? 'text-white animate-bounce' : 'text-rose-600'}`} />
                <span>Low Stock Alerts ({lowStockCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminStatusFilter(adminStatusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
                className={`flex items-center gap-2 min-h-[48px] px-4 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 cursor-pointer ${
                  adminStatusFilter === 'EXPIRING'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 stroke-[2.5] ${adminStatusFilter === 'EXPIRING' ? 'text-slate-950 animate-spin' : 'text-amber-600'}`} />
                <span>Expiring Within 30d ({expiringCount})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Generic & Brand Name</th>
                  <th className="py-3.5 px-4">Dosage / Form</th>
                  <th className="py-3.5 px-4 text-center">Sealed Packs (Volume)</th>
                  <th className="py-3.5 px-4 text-center">Open / Loose Stock</th>
                  <th className="py-3.5 px-4 text-center">Total Volume / Units</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Lot Numbers</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-bold text-sm">
                      No medication formulations found matching your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const style = getSpecialtyColor(item.shelfLocation);
                    let lotList: string[] = [];
                    try {
                      if (typeof item.lotNumbers === 'string') {
                        lotList = item.lotNumbers.startsWith('[')
                          ? JSON.parse(item.lotNumbers)
                          : item.lotNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
                      }
                    } catch (e) {
                      lotList = [];
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs uppercase ${style.badge}`}>
                            {style.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 select-text">
                          <div className="font-black text-slate-900">{item.genericName}</div>
                          {item.brandName && (
                            <div className="text-xs text-slate-500 font-bold">Brand: {item.brandName}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800 select-text">
                          {item.dosage}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => item.bottlesAvailable > 0 && (onAdjustStock ? onAdjustStock(item.id, -1, 0) : onUpdateStock(item.id, Math.max(0, item.bottlesAvailable - 1), item.looseUnitsAvailable))}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Dispense 1 Container (-1)"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <div className="flex flex-col items-center justify-center min-w-[80px] px-1">
                              <span className="font-mono font-black text-sm text-slate-900 select-text">
                                {item.bottlesAvailable} {item.stockUnit || 'Bottles'}
                              </span>
                              {item.pillsPerBottle > 0 && (
                                <span className="text-[10px] text-slate-500 font-bold tracking-tight">
                                  ({item.pillsPerBottle} {item.subUnit || 'pills'}/{(item.stockUnit || 'bottle').toLowerCase().replace(/s$/, '')})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => (onAdjustStock ? onAdjustStock(item.id, 1, 0) : onUpdateStock(item.id, item.bottlesAvailable + 1, item.looseUnitsAvailable))}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Restock 1 Container (+1)"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center select-text">
                          <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                            {item.looseUnitsAvailable || 0} {item.subUnit || 'pills'} loose
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const currentTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 0, item.looseUnitsAvailable || 0);
                                if (currentTotal > 0) {
                                  const newTotal = currentTotal - 1;
                                  const { bottles, loose } = convertTotalUnitsToStock(newTotal, item.pillsPerBottle || 0);
                                  if (isLocalTestMode) {
                                    setTestItemsMap((prev) => ({ ...prev, [item.id]: { bottles, loose } }));
                                  } else {
                                    onUpdateStock(item.id, bottles, loose);
                                  }
                                }
                              }}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                              title="Directly Dispense 1 Unit (-1)"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDispenseItem(item);
                                setDispenseAmount('');
                                setUndispenseAmount('');
                                setDispenseModalOpen(true);
                              }}
                              className="font-mono font-black text-xs text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 px-2.5 py-1 rounded-xl cursor-pointer transition-colors shadow-2xs"
                              title="Click to open Dispense & Undispense pop-up"
                            >
                              {calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 0, item.looseUnitsAvailable || 0).toLocaleString()} {item.subUnit || 'units'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDispenseItem(item);
                                setDispenseAmount('');
                                setUndispenseAmount('');
                                setDispenseModalOpen(true);
                              }}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-black border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
                              title="Click to open Undispense / Restock pop-up (+)"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700 select-text">
                          {item.expirationDate?.startsWith('3000') || item.expirationDate?.startsWith('2099') || item.expirationDate === 'N/A' ? (
                            <span className="font-extrabold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              🛡️ N/A (Non-Expiring)
                            </span>
                          ) : (
                            item.expirationDate
                          )}
                        </td>

                        <td className="py-3.5 px-4 select-text">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {lotList.length > 0 ? (
                              lotList.map((lot: string, idx: number) => (
                                <span key={idx} className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                                  {lot}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors active:scale-95"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete ${item.genericName}?`)) onDeleteItem(item.id);
                              }}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-colors active:scale-95"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permanent Admin System Documentation & Data Provenance Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">Clinical Inventory System Documentation & Provenance</h3>
            <p className="text-xs text-slate-400 font-semibold">
              Official compliance report detailing WHO, RxNorm, USP data sources, openFDA integration, and stock calculations.
            </p>
          </div>
        </div>

        <a
          href="/compliance"
          className="min-h-[44px] px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <FileText className="w-4 h-4 stroke-[2.5]" />
          <span>📋 Read System Compliance Report</span>
        </a>
      </div>

      {/* VIEW 2: USAGE REPORTS & DISPENSE ANALYTICS */}
      {activeTab === 'USAGE' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600 stroke-[2.5]" />
              <span className="text-sm font-black text-slate-900">Filter Dispense Timeframe:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {(['today', 'week', 'month', 'all'] as const).map((tf) => {
                const labels = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' };
                const isActive = timeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`min-h-[44px] px-4 rounded-xl text-xs font-black transition-all border shrink-0 touch-manipulation ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {labels[tf]}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => fetchAnalytics(timeframe)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Top Dispensed Medications</h3>
                  <p className="text-xs text-slate-500 font-medium">Ranked by total quantity distributed to patients</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {topDispensed.length} Formulations
              </span>
            </div>

            {loadingAnalytics ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-xs font-bold uppercase">Aggregating dispense records...</span>
              </div>
            ) : topDispensed.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                No dispense transactions recorded for this timeframe yet.
              </div>
            ) : (
              <div className="space-y-3.5 pt-2">
                {topDispensed.map((item, idx) => {
                  const style = getSpecialtyColor(item.category);
                  const percentage = Math.min(100, Math.round((item.totalDispensed / maxDispensed) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-slate-900 font-extrabold select-text">{item.genericName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-rose-600 font-black">
                            {item.totalDispensed} units dispensed
                          </span>
                          {isTestingMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDispenseItem(item);
                                setNewDispenseAmt(item.totalDispensed);
                                setIsDispenseWarningOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 transition-all border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
                              title="Edit total amount dispensed"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500 shadow-xs"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: WEEKLY BACKUPS & DISASTER RECOVERY */}
      {activeTab === 'BACKUPS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Info / Generator Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs tracking-wide">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Automated Weekly Backup System Active</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <Database className="w-8 h-8 text-emerald-400 shrink-0 stroke-[2.5]" />
                  <span>Weekly Inventory Snapshots & Recovery</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
                  Generate immutable snapshots of your entire drug inventory and regulatory audit logs. Backups are automatically archived in Supabase Cloud Postgres for audit resilience and disaster recovery.
                </p>
              </div>

              <div className="w-full lg:w-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shrink-0 shadow-lg min-w-[300px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Generate Manual Backup Snapshot
                </h4>
                <input
                  type="text"
                  value={backupTitle}
                  onChange={(e) => setBackupTitle(e.target.value)}
                  placeholder="Snapshot Title (Optional)..."
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl font-bold text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={backupNotes}
                  onChange={(e) => setBackupNotes(e.target.value)}
                  placeholder="Clinical notes or reason (Optional)..."
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl font-bold text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCreateWeeklyBackup}
                  disabled={creatingBackup}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {creatingBackup ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>{creatingBackup ? 'Creating Snapshot...' : 'Create Backup Snapshot Now'}</span>
                </button>

                {isTestingMode && (
                  <div className="pt-2 border-t border-slate-700/80">
                    <label className="w-full min-h-[40px] px-4 rounded-xl bg-slate-900 hover:bg-slate-950 border border-amber-400/50 text-amber-300 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Restore from JSON File (Testing)</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestoreFromJSONFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backups Archive List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <HardDrive className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Historical Weekly Backup Archives
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                {backups.length} archived {backups.length === 1 ? 'snapshot' : 'snapshots'}
              </span>
            </div>

            {loadingBackups ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <RotateCcw className="w-7 h-7 text-amber-500 animate-spin" />
                <span className="font-bold text-sm tracking-wider uppercase">Loading historical archives...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold text-sm space-y-2">
                <p>No weekly backups recorded yet.</p>
                <p className="text-xs font-semibold text-slate-400">Click the button above to generate your initial snapshot right away!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                          SNAPSHOT
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(backup.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h5 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {backup.title}
                      </h5>
                      {backup.notes && (
                        <p className="text-xs font-medium text-slate-600">
                          {backup.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-extrabold text-slate-700">
                        <span>📦 {backup.itemCount} Medications Archived</span>
                        <span>📑 {backup.logCount} Audit Logs Captured</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleDownloadBackupJSON(backup)}
                        className="min-h-[40px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Download full JSON backup snapshot"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>Export JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBackupToRestore(backup);
                          setIsRestoreWarningOpen(true);
                        }}
                        disabled={restoringBackupId === backup.id}
                        className="min-h-[40px] px-4 bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {restoringBackupId === backup.id ? (
                          <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <Upload className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                        )}
                        <span>Restore Backup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all border border-rose-200 cursor-pointer"
                        title="Delete backup archive"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Confirmation Pop-up Dialog for Restoring from Backup */}
      {isRestoreWarningOpen && selectedBackupToRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 shrink-0 shadow-inner">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Are you sure you want to restore this backup?
                </h3>
                <p className="text-xs font-semibold text-slate-600 leading-normal">
                  You are about to restore clinical inventory and audit logs to <span className="font-bold text-slate-900">{selectedBackupToRestore.title}</span> ({new Date(selectedBackupToRestore.createdAt).toLocaleDateString()}).
                </p>
                <p className="text-xs font-bold text-rose-600 pt-1">
                  ⚠️ This will overwrite your current medication stock levels and transaction records with this historical snapshot.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsRestoreWarningOpen(false); setSelectedBackupToRestore(null); }}
                className="min-h-[44px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreBackup}
                disabled={restoringBackupId !== null}
                className="min-h-[44px] px-5 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{restoringBackupId ? 'Restoring...' : 'Yes, Restore Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialty Manager Modal */}
      <SpecialtyManagerModal
        isOpen={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        onSpecialtiesUpdated={onRefreshData}
      />

      {/* Spreadsheet Importer Modal */}
      <SpreadsheetImportModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        onImportComplete={() => {
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* Dispense & Undispense Pop-Up Modal */}
      {dispenseModalOpen && dispenseItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 relative">
            <button
              type="button"
              onClick={() => {
                setDispenseModalOpen(false);
                setDispenseItem(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div className="p-3 rounded-2xl bg-teal-100 text-teal-700 border border-teal-300 shrink-0 shadow-inner">
                <CheckCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Dispense & Undispense Inventory
                </h3>
                <p className="text-xs font-semibold text-slate-600 leading-normal">
                  Adjust formulation volume for <span className="font-bold text-slate-900">{dispenseItem.genericName}</span> ({dispenseItem.dosage}).
                </p>
                <div className="pt-1">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-200">
                    Current Total: {calculateTotalUnits(dispenseItem.bottlesAvailable || 0, dispenseItem.pillsPerBottle || 0, dispenseItem.looseUnitsAvailable || 0).toLocaleString()} {dispenseItem.subUnit || 'units'}
                  </span>
                </div>
              </div>
            </div>

            {/* Directions Banner */}
            <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-teal-700" />
                <span>Dispensary Directions & Guidelines</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                • <strong>Dispense:</strong> Subtracts medication handed to patients and automatically logs usage in clinical compliance records.
              </p>
              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                • <strong>Undispense / Restock:</strong> Returns medication back to stock and removes the quantity from Top Dispensed usage charts.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              {/* Section 1: Dispense */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-rose-700 block mb-1">
                  1. How many did you dispense? (Subtract)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={dispenseAmount}
                    onChange={(e) => setDispenseAmount(e.target.value)}
                    className="flex-1 min-h-[46px] px-4 bg-white border border-slate-300 focus:border-rose-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner"
                    placeholder={`e.g. 30 ${dispenseItem.subUnit || 'units'}`}
                  />
                  <button
                    type="button"
                    disabled={!dispenseAmount || Number(dispenseAmount) <= 0 || dispensingAction}
                    onClick={async () => {
                      const amount = parseInt(dispenseAmount, 10);
                      if (isNaN(amount) || amount <= 0) return;
                      setDispensingAction(true);
                      try {
                        const currentTotal = calculateTotalUnits(dispenseItem.bottlesAvailable || 0, dispenseItem.pillsPerBottle || 0, dispenseItem.looseUnitsAvailable || 0);
                        const newTotal = Math.max(0, currentTotal - amount);
                        const { bottles, loose } = convertTotalUnitsToStock(newTotal, dispenseItem.pillsPerBottle || 0);

                        if (isLocalTestMode) {
                          setTestItemsMap((prev) => ({ ...prev, [dispenseItem.id]: { bottles, loose } }));
                        } else {
                          onUpdateStock(dispenseItem.id, bottles, loose);
                          await fetch('/api/logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              itemId: dispenseItem.id,
                              itemGenericName: dispenseItem.genericName,
                              quantityChanged: amount,
                              actionType: 'DISPENSE',
                              userRole: 'ADMIN',
                              details: `Dispensed ${amount} ${dispenseItem.subUnit || 'units'} directly via Backdoor Inventory table.`,
                              createdAt: new Date().toISOString(),
                            }),
                          }).catch(() => null);
                          if (onRefreshData) onRefreshData();
                        }
                        setDispenseModalOpen(false);
                        setDispenseItem(null);
                      } finally {
                        setDispensingAction(false);
                      }
                    }}
                    className="px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                    <span>Dispense</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Undispense */}
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
                  2. Undispense / Restock Amount (Add & Reverse Usage)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={undispenseAmount}
                    onChange={(e) => setUndispenseAmount(e.target.value)}
                    className="flex-1 min-h-[46px] px-4 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner"
                    placeholder={`e.g. 10 ${dispenseItem.subUnit || 'units'}`}
                  />
                  <button
                    type="button"
                    disabled={!undispenseAmount || Number(undispenseAmount) <= 0 || dispensingAction}
                    onClick={async () => {
                      const amount = parseInt(undispenseAmount, 10);
                      if (isNaN(amount) || amount <= 0) return;
                      setDispensingAction(true);
                      try {
                        const currentTotal = calculateTotalUnits(dispenseItem.bottlesAvailable || 0, dispenseItem.pillsPerBottle || 0, dispenseItem.looseUnitsAvailable || 0);
                        const newTotal = currentTotal + amount;
                        const { bottles, loose } = convertTotalUnitsToStock(newTotal, dispenseItem.pillsPerBottle || 0);

                        if (isLocalTestMode) {
                          setTestItemsMap((prev) => ({ ...prev, [dispenseItem.id]: { bottles, loose } }));
                        } else {
                          onUpdateStock(dispenseItem.id, bottles, loose);
                          await fetch('/api/logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              itemId: dispenseItem.id,
                              itemGenericName: dispenseItem.genericName,
                              quantityChanged: -amount,
                              actionType: 'DISPENSE',
                              userRole: 'ADMIN',
                              details: `Undispensed / Restocked ${amount} ${dispenseItem.subUnit || 'units'} back into inventory.`,
                              createdAt: new Date().toISOString(),
                            }),
                          }).catch(() => null);
                          if (onRefreshData) onRefreshData();
                        }
                        setDispenseModalOpen(false);
                        setDispenseItem(null);
                      } finally {
                        setDispensingAction(false);
                      }
                    }}
                    className="px-5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Undispense</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Pop-up Dialog for Editing Total Amount Dispensed */}
      {isDispenseWarningOpen && editingDispenseItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 shadow-inner">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Are you sure?
                </h3>
                <p className="text-xs font-semibold text-slate-600 leading-normal">
                  You are changing the total dispensed count for <span className="font-bold text-slate-900">{editingDispenseItem.genericName}</span>. Modifying dispensed totals directly alters clinical compliance tracking and dispensary statistics.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                New Total Units Dispensed:
              </label>
              <input
                type="number"
                value={newDispenseAmt}
                onChange={(e) => setNewDispenseAmt(e.target.value)}
                className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
                placeholder="e.g. 15"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsDispenseWarningOpen(false); setEditingDispenseItem(null); }}
                className="min-h-[44px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispenseEdit}
                disabled={savingDispenseEdit}
                className="min-h-[44px] px-5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{savingDispenseEdit ? 'Saving...' : 'Yes, Modify Total'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
