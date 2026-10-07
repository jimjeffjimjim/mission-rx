'use client';

import React from 'react';
import {
  FileText,
  PackageX,
  FileSpreadsheet,
  Download,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { DispensaryReportEntry, DiscardReportEntry } from '@/lib/stockMath';
import { exportReportExcel, exportReportCSV } from '@/lib/adminExportUtils';
import AdminUsageMetrics from './AdminUsageMetrics';
import AdminDispensaryReportTable from './AdminDispensaryReportTable';
import AdminDiscardReportTable from './AdminDiscardReportTable';

export interface AdminUsageAnalyticsProps {
  timeframe: 'today' | 'week' | 'month' | 'all';
  setTimeframe: (tf: 'today' | 'week' | 'month' | 'all') => void;
  loadingAnalytics: boolean;
  fetchAnalytics: (tf: 'today' | 'week' | 'month' | 'all') => void;
  displayTopDispensed: Array<{ genericName: string; totalDispensed: number; category: string }>;
  maxDispensed: number;
  dispensaryReportLogs: DispensaryReportEntry[];
  discardReportLogs: DiscardReportEntry[];
  totalPillsDiscarded: number;
  totalBottlesDiscarded: number;
  reportSubTab: 'DISPENSARY' | 'DISCARD';
  setReportSubTab: (tab: 'DISPENSARY' | 'DISCARD') => void;
  items: InventoryItem[];
  isReadOnlyMode: boolean;
  isTestingMode: boolean;
  isDeveloper: boolean;
  requireDeveloper: () => boolean;
  onEditDispenseItem: (item: { genericName: string; totalDispensed: number; category: string }) => void;
  onViewDetailedLog: (modalData: any) => void;
  onOpenReportLogEdit: (log: any, isDiscard: boolean) => void;
  onDeleteReportLog: (log: any, label: string) => void;
}

export default function AdminUsageAnalytics({
  timeframe,
  setTimeframe,
  loadingAnalytics,
  fetchAnalytics,
  displayTopDispensed,
  maxDispensed,
  dispensaryReportLogs,
  discardReportLogs,
  totalPillsDiscarded,
  totalBottlesDiscarded,
  reportSubTab,
  setReportSubTab,
  items,
  isReadOnlyMode,
  isTestingMode,
  isDeveloper,
  requireDeveloper,
  onEditDispenseItem,
  onViewDetailedLog,
  onOpenReportLogEdit,
  onDeleteReportLog,
}: AdminUsageAnalyticsProps) {
  const handleExportExcel = () => {
    exportReportExcel({
      reportSubTab,
      discardReportLogs,
      dispensaryReportLogs,
    });
  };

  const handleExportCSV = () => {
    exportReportCSV({
      reportSubTab,
      discardReportLogs,
      dispensaryReportLogs,
      items,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Top Dispensed */}
        <AdminUsageMetrics
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          loadingAnalytics={loadingAnalytics}
          fetchAnalytics={fetchAnalytics}
          displayTopDispensed={displayTopDispensed}
          maxDispensed={maxDispensed}
          isTestingMode={isTestingMode}
          isDeveloper={isDeveloper}
          requireDeveloper={requireDeveloper}
          onEditDispenseItem={onEditDispenseItem}
        />

        {/* Column 2: Detailed Dispensary or Waste Disposal Log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  reportSubTab === 'DISCARD' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {reportSubTab === 'DISCARD' ? (
                  <PackageX className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-black">
                  {reportSubTab === 'DISCARD' ? 'Expired & Waste Disposal Log' : 'Dispensary Audit Log Report'}
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  {reportSubTab === 'DISCARD'
                    ? `${totalPillsDiscarded} total units (${totalBottlesDiscarded} containers) discarded`
                    : 'Patient dispenses and inventory restocks'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setReportSubTab('DISPENSARY')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    reportSubTab === 'DISPENSARY'
                      ? 'bg-white text-teal-800 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dispensary ({dispensaryReportLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportSubTab('DISCARD')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    reportSubTab === 'DISCARD'
                      ? 'bg-rose-600 text-white shadow-2xs font-black'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  <PackageX className="w-3.5 h-3.5" />
                  <span>Expired / Waste ({discardReportLogs.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className={`min-h-[38px] px-3.5 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  reportSubTab === 'DISCARD'
                    ? 'bg-rose-700 hover:bg-rose-800 border-rose-600'
                    : 'bg-emerald-700 hover:bg-emerald-800 border-emerald-600'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Download Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="min-h-[38px] px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="py-12 flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
              <span className="text-xs font-bold uppercase">Retrieving transaction records...</span>
            </div>
          ) : reportSubTab === 'DISCARD' ? (
            <AdminDiscardReportTable
              logs={discardReportLogs}
              items={items}
              isReadOnlyMode={isReadOnlyMode}
              onViewDetailedLog={onViewDetailedLog}
              onOpenReportLogEdit={onOpenReportLogEdit}
              onDeleteReportLog={onDeleteReportLog}
            />
          ) : (
            <AdminDispensaryReportTable
              logs={dispensaryReportLogs}
              items={items}
              isReadOnlyMode={isReadOnlyMode}
              onViewDetailedLog={onViewDetailedLog}
              onOpenReportLogEdit={onOpenReportLogEdit}
              onDeleteReportLog={onDeleteReportLog}
            />
          )}
        </div>
      </div>
    </div>
  );
}
