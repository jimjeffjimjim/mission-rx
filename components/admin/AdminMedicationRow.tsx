'use client';

import React from 'react';
import {
  Minus,
  Plus,
  PackageX,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { calculateTotalUnits, convertTotalUnitsToStock, parseLotNumbers } from '@/lib/stockMath';
import { differenceInDays, parseISO } from 'date-fns';
import AdminBottleMenuPopover from './AdminBottleMenuPopover';

export interface AdminMedicationRowProps {
  item: InventoryItem;
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

export default function AdminMedicationRow({
  item,
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
}: AdminMedicationRowProps) {
  const style = getSpecialtyColor(item.shelfLocation);
  const lotList = parseLotNumbers(item.lotNumbers);
  const totalUnits = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 0, item.looseUnitsAvailable || 0);

  let isExp = false;
  let expDays = 9999;
  if (item.expirationDate && !item.expirationDate.startsWith('3000') && !item.expirationDate.startsWith('2099') && item.expirationDate !== 'N/A') {
    try {
      expDays = differenceInDays(parseISO(item.expirationDate), new Date());
      if (expDays < 0) isExp = true;
    } catch {}
  }

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
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
        {isReadOnlyMode ? (
          <div className="flex flex-col items-center justify-center min-w-[80px] px-1 select-text">
            <span className="font-mono font-black text-sm text-slate-900">
              {item.bottlesAvailable} {item.stockUnit || 'Bottles'}
            </span>
            {item.pillsPerBottle > 0 && (
              <span className="text-[10px] text-slate-500 font-bold tracking-tight">
                ({item.pillsPerBottle} {item.subUnit || 'pills'}/{(item.stockUnit || 'bottle').toLowerCase().replace(/s$/, '')})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 relative">
            <button
              type="button"
              onClick={() => {
                if (item.bottlesAvailable <= 0) return;
                if (onAdjustStock) {
                  onAdjustStock(item.id, -1, 0);
                } else {
                  onUpdateStock(item.id, item.bottlesAvailable - 1, item.looseUnitsAvailable);
                }
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Quick Dispense 1 Container (-1)"
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
              onClick={() => setBottleMenuItemId(bottleMenuItemId === item.id ? null : item.id)}
              className={`w-8 h-8 rounded-xl border font-black flex items-center justify-center active:scale-95 cursor-pointer transition-all ${
                bottleMenuItemId === item.id
                  ? 'bg-teal-600 text-white border-teal-700 shadow-md'
                  : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border-slate-300'
              }`}
              title="Dispense / Restock / Undispense Sealed Packs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            <AdminBottleMenuPopover
              item={item}
              isOpen={bottleMenuItemId === item.id}
              onClose={() => setBottleMenuItemId(null)}
              onOpenDispenseModal={onOpenDispenseModal}
              onAdjustStock={onAdjustStock}
              onUpdateStock={onUpdateStock}
              onDumpExpired={onDumpExpired}
            />
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap text-center select-text">
        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
          {item.looseUnitsAvailable || 0} {item.subUnit || 'pills'} loose
        </span>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        {isReadOnlyMode ? (
          <div className="flex items-center justify-center">
            <span className="font-mono font-black text-xs text-teal-900 bg-teal-50 border border-teal-300 px-2.5 py-1 rounded-xl shadow-2xs select-text">
              {totalUnits.toLocaleString()} {item.subUnit || 'units'}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (totalUnits <= 0) return;
                if (onAdjustStock) {
                  onAdjustStock(item.id, 0, -1);
                } else {
                  const newTotal = totalUnits - 1;
                  const { bottles, loose } = convertTotalUnitsToStock(newTotal, item.pillsPerBottle || 0);
                  onUpdateStock(item.id, bottles, loose);
                }
              }}
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Directly Dispense 1 Unit (-1)"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'units', 'dispense')}
              className="font-mono font-black text-xs text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 px-2.5 py-1 rounded-xl cursor-pointer transition-colors shadow-2xs"
              title="Click to open Dispensary controls (Dispense, Restock, Undispense)"
            >
              {totalUnits.toLocaleString()} {item.subUnit || 'units'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'units', 'restock')}
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-black border border-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Click to open Restock / Add Stock pop-up (+)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700 select-text">
        {!item.expirationDate || item.expirationDate.trim() === '' || item.expirationDate === 'N/A' || item.expirationDate === 'NONE' ? (
          <span className="text-[11px] text-slate-400 font-semibold italic">— (No Expiration)</span>
        ) : item.expirationDate?.startsWith('3000') || item.expirationDate?.startsWith('2099') ? (
          <span className="font-extrabold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
            🛡️ N/A (Non-Expiring)
          </span>
        ) : totalUnits === 0 ? (
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            0 Stock (Discarded)
          </span>
        ) : isExp ? (
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[11px] text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Expired ({Math.abs(expDays)}d ago)</span>
            </span>
            {totalUnits > 0 && (
              <button
                type="button"
                onClick={() => onDumpExpired(item)}
                className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer transition-all shrink-0"
              >
                <PackageX className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Dump (0)</span>
              </button>
            )}
          </div>
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
        <div className="flex items-center justify-end gap-1.5">
          {onOpenAuditLogs && (
            <button
              type="button"
              onClick={() => onOpenAuditLogs(item.genericName)}
              className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
              title={`View Dispense & Audit History for ${item.genericName}`}
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDumpExpired(item)}
            disabled={totalUnits === 0}
            className={`p-2 rounded-xl border font-bold text-xs transition-all active:scale-95 ${
              totalUnits === 0
                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                : isExp
                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 shadow-2xs cursor-pointer'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 cursor-pointer'
            }`}
            title={totalUnits === 0 ? 'Stock is already 0' : 'Discard / Waste Stock: Open waste disposal modal'}
          >
            <PackageX className="w-4 h-4" />
          </button>

          {!isReadOnlyMode && (
            <>
              <button
                type="button"
                onClick={() => onEditItem(item)}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
                title="Edit Record"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Permanently delete "${item.genericName}" from the formulary catalog?\n\nThis will remove the entire medication card from inventory.`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
                title="Permanently delete medication card from formulary"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
