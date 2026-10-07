'use client';

import React from 'react';
import {
  Minus,
  Plus,
  PackageX,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { calculateTotalUnits, parseLotNumbers } from '@/lib/stockMath';
import { differenceInDays, parseISO } from 'date-fns';

export interface AdminEquipmentRowProps {
  item: InventoryItem;
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

export default function AdminEquipmentRow({
  item,
  isReadOnlyMode,
  onOpenDispenseModal,
  onDumpExpired,
  onAdjustStock,
  onUpdateStock,
  onOpenAuditLogs,
  onEditEquipmentItem,
  onEditItem,
  onDeleteItem,
}: AdminEquipmentRowProps) {
  const style = getSpecialtyColor(item.shelfLocation);
  const lotList = parseLotNumbers(item.lotNumbers);
  const totalUnits = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 0, item.looseUnitsAvailable || 0);

  let isExp = false;
  let expText = 'Does Not Expire / Clinical Device';
  if (item.expirationDate && !item.expirationDate.startsWith('3000') && !item.expirationDate.startsWith('2099')) {
    try {
      const days = differenceInDays(parseISO(item.expirationDate), new Date());
      if (days < 0) {
        isExp = true;
        expText = `Expired (${Math.abs(days)}d ago)`;
      } else if (days <= 30) {
        isExp = true;
        expText = `Expiring in ${days}d`;
      } else {
        expText = `Expires ${new Date(item.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs uppercase font-extrabold ${style.badge}`}>
          {style.label}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="font-extrabold text-slate-900 text-sm">{item.genericName}</div>
        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
          {item.brandName && <span>Brand/Model: {item.brandName}</span>}
          {item.brandName && item.dosage && item.dosage !== 'N/A' && <span>•</span>}
          {item.dosage && item.dosage !== 'N/A' && <span>Spec: {item.dosage}</span>}
        </div>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
          {item.shelfLocation || 'General Medical'}
        </span>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="space-y-0.5 text-xs font-mono font-bold">
            <div>{item.bottlesAvailable || 0} {item.stockUnit || 'Units'}</div>
            {item.looseUnitsAvailable > 0 && (
              <div className="text-[11px] text-slate-500 font-medium">
                + {item.looseUnitsAvailable} {item.subUnit || 'pieces'}
              </div>
            )}
          </div>
          {!isReadOnlyMode && (
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'bottles', 'restock')}
              className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
              title={`Restock ${item.stockUnit || 'Units'} (+)`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        {isReadOnlyMode ? (
          <span className="font-mono font-black text-xs text-teal-900 bg-teal-50 border border-teal-300 px-2.5 py-1 rounded-xl shadow-2xs select-text">
            {totalUnits.toLocaleString()} {item.subUnit || 'units'}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'units', 'dispense')}
              className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title={`Dispense / Use ${item.subUnit || 'units'} (-)`}
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Use</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'units', 'dispense')}
              className="font-mono font-black text-xs text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 px-2.5 py-1 rounded-xl cursor-pointer transition-colors shadow-2xs"
            >
              {totalUnits.toLocaleString()} {item.subUnit || 'units'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDispenseModal(item, 'units', 'restock')}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
              title={`Restock ${item.subUnit || 'units'} (+)`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Restock</span>
            </button>
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        {lotList.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {lotList.map((lot, idx) => (
              <span key={idx} className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                {lot}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">N/A</span>
        )}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
            isExp ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isExp ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{expText}</span>
        </span>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          {!isReadOnlyMode && (
            <>
              <button
                type="button"
                onClick={() => onOpenDispenseModal(item, 'bottles', 'restock')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Restock</span>
              </button>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (onAdjustStock) {
                      onAdjustStock(item.id, -1, 0);
                    } else {
                      onUpdateStock(item.id, Math.max(0, (item.bottlesAvailable || 0) - 1), item.looseUnitsAvailable || 0);
                    }
                  }}
                  disabled={item.bottlesAvailable <= 0}
                  className="p-1 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onAdjustStock) {
                      onAdjustStock(item.id, 1, 0);
                    } else {
                      onUpdateStock(item.id, (item.bottlesAvailable || 0) + 1, item.looseUnitsAvailable || 0);
                    }
                  }}
                  className="p-1 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </>
          )}

          {onOpenAuditLogs && (
            <button
              type="button"
              onClick={() => onOpenAuditLogs(item.genericName)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDumpExpired(item)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
          >
            <PackageX className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {!isReadOnlyMode && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onEditEquipmentItem) {
                    onEditEquipmentItem(item);
                  } else {
                    onEditItem(item);
                  }
                }}
                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Permanently delete "${item.genericName}" from clinic inventory?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
