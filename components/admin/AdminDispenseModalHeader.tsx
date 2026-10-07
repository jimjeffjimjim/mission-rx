'use client';

import React from 'react';
import { Minus, Plus, RotateCcw, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

export interface AdminDispenseModalHeaderProps {
  dispenseItem: InventoryItem;
  dispenseModalTab: 'dispense' | 'restock' | 'undispense';
  setDispenseModalTab: (tab: 'dispense' | 'restock' | 'undispense') => void;
  currentTotal: number;
  subUOM: string;
  isSupply: boolean;
}

export default function AdminDispenseModalHeader({
  dispenseItem,
  dispenseModalTab,
  setDispenseModalTab,
  currentTotal,
  subUOM,
  isSupply,
}: AdminDispenseModalHeaderProps) {
  return (
    <>
      <div className="flex items-start gap-4 pr-8">
        <div
          className={`p-3 rounded-2xl border shrink-0 shadow-inner ${
            dispenseModalTab === 'dispense'
              ? 'bg-rose-100 text-rose-700 border-rose-300'
              : dispenseModalTab === 'restock'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          {dispenseModalTab === 'dispense' ? (
            <Minus className="w-7 h-7 stroke-[2.5]" />
          ) : dispenseModalTab === 'restock' ? (
            <Plus className="w-7 h-7 stroke-[2.5]" />
          ) : (
            <RotateCcw className="w-7 h-7 stroke-[2.5]" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 leading-snug">
            {dispenseModalTab === 'dispense'
              ? isSupply
                ? 'Dispense / Use Equipment or Supply'
                : 'Dispense to Patient'
              : dispenseModalTab === 'restock'
              ? isSupply
                ? 'Restock Equipment / Supplies (Add Stock)'
                : 'Restock Inventory (Add Stock)'
              : isSupply
              ? 'Undispense / Return Equipment'
              : 'Undispense (Undo Previous Dispense)'}
          </h3>
          <p className="text-xs font-semibold text-slate-600 leading-normal">
            Adjust inventory volume for{' '}
            <span className="font-bold text-slate-900">
              {dispenseItem.genericName}
            </span>{' '}
            {dispenseItem.dosage &&
              dispenseItem.dosage !== 'N/A' &&
              `(${dispenseItem.dosage})`}
            .
          </p>
          <div className="pt-1">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-200">
              Current Total: {currentTotal.toLocaleString()} {subUOM}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Action Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setDispenseModalTab('dispense')}
          className={`py-2 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            dispenseModalTab === 'dispense'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{isSupply ? 'Dispense / Use' : 'Dispense'}</span>
        </button>
        <button
          type="button"
          onClick={() => setDispenseModalTab('restock')}
          className={`py-2 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            dispenseModalTab === 'restock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Restock</span>
        </button>
        <button
          type="button"
          onClick={() => setDispenseModalTab('undispense')}
          className={`py-2 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            dispenseModalTab === 'undispense'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
          <span>Undispense</span>
        </button>
      </div>

      {/* Directions Banner */}
      <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-3 space-y-1 text-xs">
        <div className="font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 text-teal-700" />
          <span>
            {isSupply
              ? 'Medical Equipment & Supply Directions'
              : 'Clinical Inventory Guide'}
          </span>
        </div>
        {dispenseModalTab === 'dispense' && (
          <p className="text-[11px] font-semibold text-rose-900 leading-relaxed">
            • <strong>Dispense / Use:</strong> Subtracts equipment or supplies
            distributed for procedures/clinic and logs clinical usage.
          </p>
        )}
        {dispenseModalTab === 'restock' && (
          <p className="text-[11px] font-semibold text-emerald-900 leading-relaxed">
            • <strong>Restock:</strong> Adds newly received equipment shipment or
            supplies to shelf. Historical usage records remain completely unchanged.
          </p>
        )}
        {dispenseModalTab === 'undispense' && (
          <p className="text-[11px] font-semibold text-amber-900 leading-relaxed">
            • <strong>Undispense / Return:</strong> Reverses a mistaken or
            cancelled equipment usage, returns items to shelf, and deducts the
            quantity from usage charts.
          </p>
        )}
      </div>
    </>
  );
}
