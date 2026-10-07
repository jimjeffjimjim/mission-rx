'use client';

import React from 'react';
import {
  Search,
  Plus,
  Stethoscope,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import AdminEquipmentRow from './AdminEquipmentRow';

export interface AdminEquipmentTabProps {
  equipmentItems: InventoryItem[];
  equipmentSearchQuery: string;
  setEquipmentSearchQuery: (q: string) => void;
  equipmentSubFilter: 'ALL' | 'DIAGNOSTIC' | 'SURGICAL' | 'CONSUMABLES';
  setEquipmentSubFilter: (f: 'ALL' | 'DIAGNOSTIC' | 'SURGICAL' | 'CONSUMABLES') => void;
  handleOpenCreateEquipment: () => void;
  isReadOnlyMode: boolean;
  onOpenDispenseModal: (item: InventoryItem, mode: 'units' | 'bottles', tab: 'dispense' | 'restock' | 'undispense') => void;
  onDumpExpired: (item: InventoryItem) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onOpenAuditLogs?: (searchQuery?: string) => void;
  onEditEquipmentItem?: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function AdminEquipmentTab({
  equipmentItems,
  equipmentSearchQuery,
  setEquipmentSearchQuery,
  equipmentSubFilter,
  setEquipmentSubFilter,
  handleOpenCreateEquipment,
  isReadOnlyMode,
  onOpenDispenseModal,
  onDumpExpired,
  onAdjustStock,
  onUpdateStock,
  onOpenAuditLogs,
  onEditEquipmentItem,
  onEditItem,
  onDeleteItem,
}: AdminEquipmentTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            value={equipmentSearchQuery}
            onChange={(e) => setEquipmentSearchQuery(e.target.value)}
            placeholder="Search medical equipment, model, serial #, lot #, or storage location..."
            className="w-full pl-10 pr-4 min-h-[48px] bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden select-text"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(
              [
                { id: 'ALL', label: 'All Supplies' },
                { id: 'DIAGNOSTIC', label: '🩺 Diagnostic Devices' },
                { id: 'SURGICAL', label: '✂️ Surgical & Kits' },
                { id: 'CONSUMABLES', label: '🧤 Consumables & PPE' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEquipmentSubFilter(tab.id)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black transition-all border shrink-0 touch-manipulation cursor-pointer ${
                  equipmentSubFilter === tab.id
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isReadOnlyMode && (
            <button
              type="button"
              onClick={handleOpenCreateEquipment}
              className="min-h-[48px] px-4 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Medical Equipment</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-teal-900/5 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-4">Type / Category</th>
              <th className="py-3.5 px-4">Equipment / Model Name</th>
              <th className="py-3.5 px-4">Storage Location</th>
              <th className="py-3.5 px-4">Stock Count</th>
              <th className="py-3.5 px-4">Total Available</th>
              <th className="py-3.5 px-4">Serial / Lot #</th>
              <th className="py-3.5 px-4">Maintenance / Expiry</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {equipmentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto shadow-inner">
                      <Stethoscope className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800">No Medical Equipment Found</h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        Add clinical diagnostic devices, surgical instruments, and consumable hospital supplies to track physical clinic equipment.
                      </p>
                    </div>
                    {!isReadOnlyMode && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleOpenCreateEquipment}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          + Add First Equipment Item
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              equipmentItems.map((item) => (
                <AdminEquipmentRow
                  key={item.id}
                  item={item}
                  isReadOnlyMode={isReadOnlyMode}
                  onOpenDispenseModal={onOpenDispenseModal}
                  onDumpExpired={onDumpExpired}
                  onAdjustStock={onAdjustStock}
                  onUpdateStock={onUpdateStock}
                  onOpenAuditLogs={onOpenAuditLogs}
                  onEditEquipmentItem={onEditEquipmentItem}
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
