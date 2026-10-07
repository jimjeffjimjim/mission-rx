'use client';

import React from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import AdminMedicationRow from './AdminMedicationRow';

export interface AdminMedicationTableProps {
  items: InventoryItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  adminStatusFilter: 'ALL' | 'LOW_STOCK' | 'EXPIRING';
  setAdminStatusFilter: (f: 'ALL' | 'LOW_STOCK' | 'EXPIRING') => void;
  lowStockCount: number;
  expiringCount: number;
  handleExportFormularyExcel: () => void;
  handleExportFormularyCSV: () => void;
  isReadOnlyMode: boolean;
  bottleMenuItemId: string | null;
  setBottleMenuItemId: (id: string | null) => void;
  onOpenDispenseModal: (item: InventoryItem, mode: 'units' | 'bottles', tab: 'dispense' | 'restock' | 'undispense') => void;
  onDumpExpired: (item: InventoryItem) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onOpenAuditLogs?: (searchQuery?: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function AdminMedicationTable({
  items,
  searchQuery,
  setSearchQuery,
  adminStatusFilter,
  setAdminStatusFilter,
  lowStockCount,
  expiringCount,
  handleExportFormularyExcel,
  handleExportFormularyCSV,
  isReadOnlyMode,
  bottleMenuItemId,
  setBottleMenuItemId,
  onOpenDispenseModal,
  onDumpExpired,
  onAdjustStock,
  onUpdateStock,
  onOpenAuditLogs,
  onEditItem,
  onDeleteItem,
}: AdminMedicationTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by medication, symptom, brand, lot, strength (e.g. ear infection, rash, lot#)..."
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

          <button
            type="button"
            onClick={handleExportFormularyExcel}
            className="flex items-center gap-1.5 min-h-[48px] px-3.5 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 cursor-pointer"
            title="Download Excel Spreadsheet (.xls) of inventory"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportFormularyCSV}
            className="flex items-center gap-1.5 min-h-[48px] px-3.5 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer"
            title="Export CSV of inventory"
          >
            <Download className="w-4 h-4 text-slate-600 stroke-[2.5]" />
            <span>Export CSV</span>
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-bold text-sm">
                  No medication formulations found matching your query.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <AdminMedicationRow
                  key={item.id}
                  item={item}
                  isReadOnlyMode={isReadOnlyMode}
                  bottleMenuItemId={bottleMenuItemId}
                  setBottleMenuItemId={setBottleMenuItemId}
                  onOpenDispenseModal={onOpenDispenseModal}
                  onDumpExpired={onDumpExpired}
                  onAdjustStock={onAdjustStock}
                  onUpdateStock={onUpdateStock}
                  onOpenAuditLogs={onOpenAuditLogs}
                  onEditItem={onEditItem}
                  onDeleteItem={onDeleteItem}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
