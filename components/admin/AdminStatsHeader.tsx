'use client';

import React from 'react';
import {
  ClipboardList,
  FileSpreadsheet,
  Palette,
  Activity,
  Wrench,
  Plus,
  Eye,
  ShieldCheck,
  Download,
  Stethoscope,
} from 'lucide-react';
import { APP_VERSION_LABEL } from '@/lib/version';
import AdminDevBanner from './AdminDevBanner';
import AdminKpiCards from './AdminKpiCards';
import AdminTabNavigation from './AdminTabNavigation';

export interface AdminStatsHeaderProps {
  totalMedications: number;
  equipmentTotalCount: number;
  lowStockCount: number;
  expiringCount: number;
  totalBottles: number;
  activeTab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS';
  setActiveTab: (tab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS') => void;
  adminStatusFilter: 'ALL' | 'LOW_STOCK' | 'EXPIRING';
  setAdminStatusFilter: (filter: 'ALL' | 'LOW_STOCK' | 'EXPIRING') => void;
  isReadOnlyMode: boolean;
  isTestingMode: boolean;
  setIsTestingMode: (v: boolean) => void;
  isResettingInventory: boolean;
  handleResetInventoryToStart: () => void;
  handleClearAuditLogs: () => void;
  handleExportFormularyExcel: () => void;
  handleExportFormularyCSV: () => void;
  handleOpenCreateEquipment: () => void;
  onOpenCreateModal: () => void;
  onOpenAuditLogs?: (searchQuery?: string) => void;
  onOpenPhysicalAuditModal?: () => void;
  setIsSpreadsheetModalOpen: (open: boolean) => void;
  setIsSpecialtyModalOpen: (open: boolean) => void;
  onExitTestingMode: () => void;
  isDeveloper?: boolean;
}

export default function AdminStatsHeader({
  totalMedications,
  equipmentTotalCount,
  lowStockCount,
  expiringCount,
  totalBottles,
  activeTab,
  setActiveTab,
  adminStatusFilter,
  setAdminStatusFilter,
  isReadOnlyMode,
  isTestingMode,
  setIsTestingMode,
  isResettingInventory,
  handleResetInventoryToStart,
  handleClearAuditLogs,
  handleExportFormularyExcel,
  handleExportFormularyCSV,
  handleOpenCreateEquipment,
  onOpenCreateModal,
  onOpenAuditLogs,
  onOpenPhysicalAuditModal,
  setIsSpreadsheetModalOpen,
  setIsSpecialtyModalOpen,
  onExitTestingMode,
  isDeveloper = false,
}: AdminStatsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Dev & Testing Utilities */}
      <AdminDevBanner
        isTestingMode={isTestingMode}
        isReadOnlyMode={isReadOnlyMode}
        isResettingInventory={isResettingInventory}
        handleResetInventoryToStart={handleResetInventoryToStart}
        handleClearAuditLogs={handleClearAuditLogs}
        isDeveloper={isDeveloper}
      />

      {/* Admin / Viewer Portal Banner Header */}
      <div
        className={`rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden ${
          isReadOnlyMode
            ? 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white border border-indigo-500/30'
            : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950'
        }`}
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          {isReadOnlyMode ? (
            <Eye className="w-64 h-64 text-white" />
          ) : (
            <ShieldCheck className="w-64 h-64 text-slate-950" />
          )}
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl shadow-md shrink-0 ${
                  isReadOnlyMode ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30' : 'bg-slate-950 text-amber-400'
                }`}
              >
                {isReadOnlyMode ? (
                  <Eye className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                ) : (
                  <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isReadOnlyMode ? 'text-white' : 'text-slate-950'}`}>
                    {isReadOnlyMode ? 'Viewer Portal & Formulary Archive' : 'Admin Control Center'}
                  </h2>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isReadOnlyMode
                        ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30'
                        : 'bg-slate-950/20 text-slate-950 border-slate-950/30 font-mono'
                    }`}
                  >
                    {APP_VERSION_LABEL}
                  </span>
                  {isReadOnlyMode && (
                    <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2.5 py-0.5 rounded-full">
                      Viewer (Stock Waste Permitted)
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm font-bold ${isReadOnlyMode ? 'text-indigo-200/90' : 'text-slate-900/80'}`}>
                  {isReadOnlyMode
                    ? 'Clinical Oversight, Data Verification & Stock Waste Access (PIN 8888)'
                    : 'Central Pharmaceutical Inventory & Dispense Analytics Management'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isReadOnlyMode ? (
                <>
                  {onOpenAuditLogs && (
                    <button
                      type="button"
                      onClick={() => onOpenAuditLogs()}
                      className="min-h-[44px] px-3.5 bg-indigo-900/80 hover:bg-indigo-900 text-indigo-100 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-indigo-400/40 cursor-pointer"
                    >
                      <Activity className="w-4 h-4 text-indigo-300 stroke-[2.5]" />
                      <span>Audit Logs</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportFormularyExcel}
                    className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-emerald-400/30 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-100 stroke-[2.5]" />
                    <span>Download Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFormularyCSV}
                    className="min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                    <span>Export CSV</span>
                  </button>
                </>
              ) : (
                <>
                  {onOpenPhysicalAuditModal && (
                    <button
                      type="button"
                      onClick={() => onOpenPhysicalAuditModal()}
                      className="min-h-[44px] px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-amber-500 cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Physical Audit Sheet</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSpreadsheetModalOpen(true)}
                    className="min-h-[44px] px-3.5 bg-slate-950 hover:bg-slate-900 text-teal-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-teal-400/30 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-400 stroke-[2.5]" />
                    <span>Import Spreadsheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSpecialtyModalOpen(true)}
                    className="min-h-[44px] px-3.5 bg-slate-950 hover:bg-slate-900 text-purple-300 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border border-purple-400/30 cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-purple-300 stroke-[2.5]" />
                    <span>Specialties & Colors</span>
                  </button>
                  {onOpenAuditLogs && (
                    <button
                      type="button"
                      onClick={() => onOpenAuditLogs()}
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
                        const pin = window.prompt('Enter Secret Admin Testing PIN:');
                        if (pin === '9110') {
                          setIsTestingMode(true);
                        } else if (pin !== null) {
                          alert('Incorrect PIN. Access denied.');
                        }
                      } else {
                        onExitTestingMode();
                      }
                    }}
                    className={`min-h-[44px] px-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 border cursor-pointer ${
                      isTestingMode
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-amber-400/20'
                        : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <Wrench className="w-4 h-4 stroke-[2.5]" />
                    <span>{isTestingMode ? 'Testing Mode ON' : 'Test Mode'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateEquipment}
                    className="min-h-[44px] px-3.5 bg-teal-900 hover:bg-teal-950 text-teal-200 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer border border-teal-700/50"
                  >
                    <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Equipment</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="min-h-[44px] px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Medication</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <AdminKpiCards
            totalMedications={totalMedications}
            equipmentTotalCount={equipmentTotalCount}
            lowStockCount={lowStockCount}
            expiringCount={expiringCount}
            totalBottles={totalBottles}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            adminStatusFilter={adminStatusFilter}
            setAdminStatusFilter={setAdminStatusFilter}
          />
        </div>
      </div>

      {/* Admin Section View Switcher Tabs */}
      <AdminTabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        equipmentTotalCount={equipmentTotalCount}
      />
    </div>
  );
}
