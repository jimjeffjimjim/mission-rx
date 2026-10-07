'use client';

import React from 'react';
import { Minus, Plus, ArrowUpRight, PackageX } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

export interface AdminBottleMenuPopoverProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onOpenDispenseModal: (
    item: InventoryItem,
    mode: 'units' | 'bottles',
    tab: 'dispense' | 'restock' | 'undispense'
  ) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onDumpExpired: (item: InventoryItem) => void;
}

export default function AdminBottleMenuPopover({
  item,
  isOpen,
  onClose,
  onOpenDispenseModal,
  onAdjustStock,
  onUpdateStock,
  onDumpExpired,
}: AdminBottleMenuPopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150">
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenDispenseModal(item, 'bottles', 'dispense');
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors group cursor-pointer"
      >
        <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200">
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <div>
          <span className="text-xs font-black text-slate-900 block">Dispense Packs</span>
          <span className="text-[10px] font-semibold text-slate-400">Subtract sealed containers</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          if (onAdjustStock) {
            onAdjustStock(item.id, 1, 0);
          } else {
            onUpdateStock(item.id, item.bottlesAvailable + 1, item.looseUnitsAvailable);
          }
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors group cursor-pointer"
      >
        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200">
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <div>
          <span className="text-xs font-black text-slate-900 block">Restock +1</span>
          <span className="text-[10px] font-semibold text-slate-400">Add 1 sealed container</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenDispenseModal(item, 'bottles', 'undispense');
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors group cursor-pointer"
      >
        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200">
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <div>
          <span className="text-xs font-black text-slate-900 block">Undispense Packs</span>
          <span className="text-[10px] font-semibold text-slate-400">Return sealed containers</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          onDumpExpired(item);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors group cursor-pointer border-t border-slate-100"
      >
        <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-200">
          <PackageX className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xs font-black text-rose-900 block">Dump Expired (Set to 0)</span>
          <span className="text-[10px] font-semibold text-slate-400">Pills thrown away (not dispensed)</span>
        </div>
      </button>
    </div>
  );
}
