'use client';

import React from 'react';
import {
  AlertTriangle,
  Check,
} from 'lucide-react';

export interface AdminReportLogEditModalProps {
  editingReportLog: any;
  setEditingReportLog: (log: any | null) => void;
  reportLogItemName: string;
  setReportLogItemName: (v: string) => void;
  reportLogAction: string;
  setReportLogAction: (v: string) => void;
  reportLogLots: string;
  setReportLogLots: (v: string) => void;
  reportLogQty: string;
  setReportLogQty: (v: string) => void;
  reportLogBottles: string;
  setReportLogBottles: (v: string) => void;
  reportLogDetails: string;
  setReportLogDetails: (v: string) => void;
  savingReportEdit: boolean;
  onConfirmReportLogEdit: () => void;
}

export default function AdminReportLogEditModal({
  editingReportLog,
  setEditingReportLog,
  reportLogItemName,
  setReportLogItemName,
  reportLogAction,
  setReportLogAction,
  reportLogLots,
  setReportLogLots,
  reportLogQty,
  setReportLogQty,
  reportLogBottles,
  setReportLogBottles,
  reportLogDetails,
  setReportLogDetails,
  savingReportEdit,
  onConfirmReportLogEdit,
}: AdminReportLogEditModalProps) {
  if (!editingReportLog) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 shadow-inner">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                Developer Report Record Revision
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                Developer Override
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-normal">
              Modifying this {editingReportLog._isDiscard ? 'waste disposal' : 'dispensary'} transaction updates official totals, patient usage history, and Supabase audit reports.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              Medication / Item Generic Name
            </label>
            <input
              type="text"
              value={reportLogItemName}
              onChange={(e) => setReportLogItemName(e.target.value)}
              className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Action Type
              </label>
              <select
                value={reportLogAction}
                onChange={(e) => setReportLogAction(e.target.value)}
                className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
              >
                <option value="DISPENSE">DISPENSE</option>
                <option value="DISPENSE_BOTTLE">DISPENSE_BOTTLE</option>
                <option value="DISCARD_EXPIRED">DISCARD_EXPIRED</option>
                <option value="DISCARD">DISCARD</option>
                <option value="UNDISPENSE">UNDISPENSE</option>
                <option value="RESTOCK">RESTOCK</option>
                <option value="EDIT">EDIT</option>
                <option value="AUDIT">AUDIT</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Lot Number(s)
              </label>
              <input
                type="text"
                value={reportLogLots}
                onChange={(e) => setReportLogLots(e.target.value)}
                placeholder="e.g. 4ME2261, LOT99"
                className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Units Delta (Negative for dispense/discard)
              </label>
              <input
                type="number"
                value={reportLogQty}
                onChange={(e) => setReportLogQty(e.target.value)}
                placeholder="e.g. -24"
                className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Containers / Bottles Delta
              </label>
              <input
                type="number"
                value={reportLogBottles}
                onChange={(e) => setReportLogBottles(e.target.value)}
                placeholder="e.g. 1"
                className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              Audit Details / Justification Notes
            </label>
            <textarea
              rows={2}
              value={reportLogDetails}
              onChange={(e) => setReportLogDetails(e.target.value)}
              placeholder="Clinical revision explanation..."
              className="w-full p-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setEditingReportLog(null)}
            className="min-h-[42px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReportLogEdit}
            disabled={savingReportEdit}
            className="min-h-[42px] px-5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{savingReportEdit ? 'Saving...' : 'Save Revisions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
