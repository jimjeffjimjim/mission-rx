'use client';

import React from 'react';
import { Minus, Plus, RotateCcw, AlertTriangle, PackageX } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

export interface AdminDispenseTabContentProps {
  dispenseModalTab: 'dispense' | 'restock' | 'undispense';
  dispenseItem: InventoryItem;
  isBottle: boolean;
  subUOM: string;
  pillsPerBottle: number;
  currentTotal: number;
  dispenseAmount: string;
  setDispenseAmount: (v: string) => void;
  restockAmount: string;
  setRestockAmount: (v: string) => void;
  undispenseAmount: string;
  setUndispenseAmount: (v: string) => void;
  dispensingAction: boolean;
  handleAction: (action: 'dispense' | 'restock' | 'undispense') => Promise<void>;
  onDumpExpired: (item: InventoryItem) => void;
  onClose: () => void;
}

export default function AdminDispenseTabContent({
  dispenseModalTab,
  dispenseItem,
  isBottle,
  subUOM,
  pillsPerBottle,
  currentTotal,
  dispenseAmount,
  setDispenseAmount,
  restockAmount,
  setRestockAmount,
  undispenseAmount,
  setUndispenseAmount,
  dispensingAction,
  handleAction,
  onDumpExpired,
  onClose,
}: AdminDispenseTabContentProps) {
  const dispensePillAmt = isBottle
    ? (Number(dispenseAmount) || 0) * pillsPerBottle
    : Number(dispenseAmount) || 0;
  const isOverStock =
    dispenseAmount !== '' &&
    Number(dispenseAmount) > 0 &&
    dispensePillAmt > currentTotal;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      {dispenseModalTab === 'dispense' && (
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-rose-700 block">
            Quantity Dispensed to Patient (Subtract)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                value={dispenseAmount}
                onChange={(e) => setDispenseAmount(e.target.value)}
                className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-rose-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
                placeholder={
                  isBottle
                    ? `e.g. 1 ${dispenseItem.stockUnit || 'bottle'}`
                    : `e.g. 30 ${subUOM}`
                }
                autoFocus
              />
              {isBottle && dispenseAmount && !isNaN(Number(dispenseAmount)) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-rose-50 text-rose-700 font-extrabold border border-rose-200 px-2 py-0.5 rounded-md">
                  = {dispensePillAmt} {subUOM}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={
                !dispenseAmount ||
                Number(dispenseAmount) <= 0 ||
                isOverStock ||
                dispensingAction
              }
              onClick={() => handleAction('dispense')}
              className="px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              <span>Dispense</span>
            </button>
          </div>
          {isOverStock && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Insufficient Stock:</strong> You requested{' '}
                {dispensePillAmt.toLocaleString()} {subUOM}, but only{' '}
                {currentTotal.toLocaleString()} {subUOM} exist in inventory.
              </span>
            </div>
          )}
        </div>
      )}

      {dispenseModalTab === 'restock' && (
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
            Quantity to Restock / Add to Inventory
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
                placeholder={
                  isBottle
                    ? `e.g. 5 ${dispenseItem.stockUnit || 'bottles'}`
                    : `e.g. 100 ${subUOM}`
                }
                autoFocus
              />
              {isBottle && restockAmount && !isNaN(Number(restockAmount)) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200 px-2 py-0.5 rounded-md">
                  = {Number(restockAmount) * pillsPerBottle} {subUOM}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={
                !restockAmount ||
                Number(restockAmount) <= 0 ||
                dispensingAction
              }
              onClick={() => handleAction('restock')}
              className="px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Restock</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Restocking increases on-hand count without affecting historical patient dispensing data.
          </p>
        </div>
      )}

      {dispenseModalTab === 'undispense' && (
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-amber-800 block">
            Quantity to Undispense / Undo Dispense (Deduct from Dispensed)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                value={undispenseAmount}
                onChange={(e) => setUndispenseAmount(e.target.value)}
                className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
                placeholder={
                  isBottle
                    ? `e.g. 1 ${dispenseItem.stockUnit || 'bottle'}`
                    : `e.g. 10 ${subUOM}`
                }
                autoFocus
              />
              {isBottle &&
                undispenseAmount &&
                !isNaN(Number(undispenseAmount)) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-amber-50 text-amber-800 font-extrabold border border-amber-200 px-2 py-0.5 rounded-md">
                    = {Number(undispenseAmount) * pillsPerBottle} {subUOM}
                  </span>
                )}
            </div>
            <button
              type="button"
              disabled={
                !undispenseAmount ||
                Number(undispenseAmount) <= 0 ||
                dispensingAction
              }
              onClick={() => handleAction('undispense')}
              className="px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span>Undispense</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Undispensing restores inventory stock AND reverses/deducts this quantity from clinical dispense charts.
          </p>
        </div>
      )}

      {/* Expired Stock Disposal Quick Action */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
        <div>
          <span className="text-xs font-black text-rose-950 block">
            Expired Stock Disposal
          </span>
          <span className="text-[11px] font-semibold text-rose-700">
            Pills expired and thrown away? Set count to 0 without recording a patient dispense.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const itemToDump = dispenseItem;
            onClose();
            onDumpExpired(itemToDump);
          }}
          disabled={currentTotal === 0}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs whitespace-nowrap active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
          title="Dump expired pills and set stock count to 0"
        >
          <PackageX className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Dump Out (Set to 0)</span>
        </button>
      </div>
    </div>
  );
}
