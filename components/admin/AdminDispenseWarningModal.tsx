'use client';

import React from 'react';
import {
  AlertTriangle,
  Check,
} from 'lucide-react';

export interface AdminDispenseWarningModalProps {
  isOpen: boolean;
  editingDispenseItem: { genericName: string; totalDispensed: number; category: string } | null;
  newDispenseAmt: number | string;
  setNewDispenseAmt: (v: number | string) => void;
  savingDispenseEdit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AdminDispenseWarningModal({
  isOpen,
  editingDispenseItem,
  newDispenseAmt,
  setNewDispenseAmt,
  savingDispenseEdit,
  onCancel,
  onConfirm,
}: AdminDispenseWarningModalProps) {
  if (!isOpen || !editingDispenseItem) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 shadow-inner">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              Are you sure?
            </h3>
            <p className="text-xs font-semibold text-slate-600 leading-normal">
              You are changing the total dispensed count for{' '}
              <span className="font-bold text-slate-900">{editingDispenseItem.genericName}</span>. Modifying dispensed
              totals directly alters clinical compliance tracking and dispensary statistics.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            New Total Units Dispensed:
          </label>
          <input
            type="number"
            value={newDispenseAmt}
            onChange={(e) => setNewDispenseAmt(e.target.value)}
            className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
            placeholder="e.g. 15"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={savingDispenseEdit}
            className="min-h-[44px] px-5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{savingDispenseEdit ? 'Saving...' : 'Yes, Modify Total'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
