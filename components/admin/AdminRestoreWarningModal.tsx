'use client';

import React from 'react';
import { AlertTriangle, RotateCcw, Upload } from 'lucide-react';

export interface AdminRestoreWarningModalProps {
  isOpen: boolean;
  selectedBackupToRestore: any | null;
  restoringBackupId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AdminRestoreWarningModal({
  isOpen,
  selectedBackupToRestore,
  restoringBackupId,
  onCancel,
  onConfirm,
}: AdminRestoreWarningModalProps) {
  if (!isOpen || !selectedBackupToRestore) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 shrink-0 shadow-inner">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              Are you sure you want to restore this backup?
            </h3>
            <p className="text-xs font-semibold text-slate-600 leading-normal">
              Restoring will overwrite your active inventory and regulatory logs with the snapshot taken on{' '}
              <b>{new Date(selectedBackupToRestore.createdAt).toLocaleString()}</b>.
            </p>
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-800">
              ⚠️ This action cannot be undone unless you created a snapshot beforehand.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={Boolean(restoringBackupId)}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={Boolean(restoringBackupId)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {restoringBackupId ? (
              <RotateCcw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4 text-white stroke-[2.5]" />
            )}
            <span>{restoringBackupId ? 'Restoring Database...' : 'Confirm Overwrite & Restore'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
