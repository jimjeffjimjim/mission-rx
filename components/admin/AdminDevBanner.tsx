'use client';

import React from 'react';
import { Wrench, RotateCcw, Trash2 } from 'lucide-react';

export interface AdminDevBannerProps {
  isTestingMode: boolean;
  isReadOnlyMode: boolean;
  isResettingInventory: boolean;
  handleResetInventoryToStart: () => void;
  handleClearAuditLogs: () => void;
  isDeveloper?: boolean;
}

export default function AdminDevBanner({
  isTestingMode,
  isReadOnlyMode,
  isResettingInventory,
  handleResetInventoryToStart,
  handleClearAuditLogs,
  isDeveloper = false,
}: AdminDevBannerProps) {
  if (!isTestingMode && !isDeveloper) return null;

  return (
    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
          <Wrench className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <span>{isDeveloper ? 'Developer & Testing Utilities' : 'Dev & Testing Utilities'}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {isDeveloper ? 'Developer (7777)' : 'Temporary'}
            </span>
          </span>
          <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-2">
            <span>
              Doctor: <strong className="font-mono text-teal-400">1234</strong>
            </span>
            <span>|</span>
            <span>
              Viewer: <strong className="font-mono text-indigo-400">8888</strong>
            </span>
            <span>|</span>
            <span>
              Admin: <strong className="font-mono text-amber-400">7890</strong>
            </span>
            <span>|</span>
            <span>
              Developer: <strong className="font-mono text-emerald-400">7777</strong>
            </span>
          </p>
        </div>
      </div>

      {!isReadOnlyMode && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetInventoryToStart}
            disabled={isResettingInventory}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Reset default item stock counts to initial levels"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isResettingInventory ? 'animate-spin' : ''}`}
            />
            <span>Reset Stock Counts to Start</span>
          </button>

          <button
            type="button"
            onClick={handleClearAuditLogs}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Reset all audit log entries"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Audit Logs</span>
          </button>
        </div>
      )}
    </div>
  );
}
