'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem, FilterCategory, DispenseLog } from '@/types/inventory';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { 
  Plus, 
  Minus, 
  Edit2, 
  Trash2, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  BarChart3, 
  Table, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  RefreshCw,
  Activity
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface AdminPortalProps {
  items: InventoryItem[];
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenCreateModal: () => void;
  onSwitchToDoctorView: () => void;
  onOpenAuditLogs?: () => void;
}

export default function AdminPortal({
  items,
  onUpdateStock,
  onEditItem,
  onDeleteItem,
  onOpenCreateModal,
  onSwitchToDoctorView,
  onOpenAuditLogs,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'TABLE' | 'USAGE'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');

  // Analytics State
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [analyticsLogs, setAnalyticsLogs] = useState<DispenseLog[]>([]);
  const [topDispensed, setTopDispensed] = useState<{ genericName: string; totalDispensed: number; category: string }[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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

  // Overall Stats
  const totalItems = items.length;
  const lowStockCount = items.filter(
    (i) => i.bottlesAvailable < 2 || (i.bottlesAvailable === 0 && i.looseUnitsAvailable < 20)
  ).length;
  const expiringCount = items.filter((i) => {
    try {
      const expDate = parseISO(i.expirationDate);
      const days = differenceInDays(expDate, new Date());
      return !isNaN(days) && days <= 30;
    } catch (e) {
      return false;
    }
  }).length;

  const totalBottles = items.reduce((acc, item) => acc + item.bottlesAvailable, 0);

  // Filter Table Items
  const filtered = items.filter((item) => {
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
    return true;
  });

  const maxDispensed = topDispensed.length > 0 ? topDispensed[0].totalDispensed : 1;

  const handleExitAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    onSwitchToDoctorView();
  };

  return (
    <div className="space-y-6 pb-16 select-none max-w-full overflow-x-hidden">
      {/* Admin Portal Banner Header */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-5 sm:p-6 text-slate-950 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-slate-950" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            <div className="flex flex-wrap items-center gap-2.5">
              {onOpenAuditLogs && (
                <button
                  type="button"
                  onClick={onOpenAuditLogs}
                  className="min-h-[48px] px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-amber-400/30 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>Compliance Audit Logs</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCreateModal}
                className="min-h-[48px] px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Medication</span>
              </button>

              {/* Exit Admin Portal Button */}
              <button
                type="button"
                onClick={handleExitAdmin}
                className="min-h-[48px] px-4 bg-white/90 hover:bg-white text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Exit Admin Portal</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
              <span className="text-[11px] font-black uppercase text-slate-600 block">Total Formulations</span>
              <span className="font-mono text-2xl font-black text-slate-900">{totalItems}</span>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
              <span className="text-[11px] font-black uppercase text-rose-700 block">Low Stock Alerts</span>
              <span className="font-mono text-2xl font-black text-rose-700">{lowStockCount}</span>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
              <span className="text-[11px] font-black uppercase text-amber-900 block">Expiring Within 30d</span>
              <span className="font-mono text-2xl font-black text-amber-900">{expiringCount}</span>
            </div>

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
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Generic & Brand Name</th>
                  <th className="py-3.5 px-4">Dosage / Form</th>
                  <th className="py-3.5 px-4 text-center">Bottles Count</th>
                  <th className="py-3.5 px-4 text-center">Loose Units</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Lot Numbers</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-bold text-sm">
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
                              onClick={() => onUpdateStock(item.id, Math.max(0, item.bottlesAvailable - 1), item.looseUnitsAvailable)}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Dispense 1 Bottle (-1)"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <span className="font-mono font-black text-base w-8 text-center text-slate-900 select-text">
                              {item.bottlesAvailable}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item.id, item.bottlesAvailable + 1, item.looseUnitsAvailable)}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Restock 1 Bottle (+1)"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item.id, item.bottlesAvailable, Math.max(0, item.looseUnitsAvailable - 1))}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Dispense 1 Loose Unit (-1)"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <span className="font-mono font-black text-base w-8 text-center text-slate-900 select-text">
                              {item.looseUnitsAvailable}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item.id, item.bottlesAvailable, item.looseUnitsAvailable + 1)}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-black border border-slate-300 flex items-center justify-center active:scale-95"
                              title="Restock 1 Loose Unit (+1)"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700 select-text">
                          {item.expirationDate}
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
                        <span className="font-mono text-rose-600 font-black">
                          {item.totalDispensed} units dispensed
                        </span>
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

          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Dispense & Restock Audit History</h3>
                  <p className="text-xs text-slate-500 font-medium">Automatic real-time log of stock movements</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Formulation Name</th>
                    <th className="py-3 px-4 text-center">Quantity Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-medium">
                  {analyticsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400 text-xs font-bold">
                        No transactions logged for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    analyticsLogs.map((log) => {
                      const isDispense = log.actionType === 'DISPENSE' || log.quantityChanged < 0;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                                isDispense
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                            >
                              {isDispense ? (
                                <>
                                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Dispensed</span>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Restocked</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 select-text">
                            {log.itemGenericName}
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-black">
                            <span className={isDispense ? 'text-rose-600' : 'text-emerald-600'}>
                              {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
