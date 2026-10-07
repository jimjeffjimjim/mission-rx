'use client';

import React from 'react';
import {
  Database,
  CheckCircle,
  Shield,
  RotateCcw,
  HardDrive,
  Clock,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import AdminRestoreWarningModal from './AdminRestoreWarningModal';
import { useAdminBackups } from './useAdminBackups';

export interface AdminBackupsTabProps {
  state?: ReturnType<typeof useAdminBackups>;
  backups?: any[];
  loadingBackups?: boolean;
  creatingBackup?: boolean;
  backupTitle?: string;
  setBackupTitle?: (v: string) => void;
  backupNotes?: string;
  setBackupNotes?: (v: string) => void;
  restoringBackupId?: string | null;
  isRestoreWarningOpen?: boolean;
  setIsRestoreWarningOpen?: (v: boolean) => void;
  selectedBackupToRestore?: any | null;
  setSelectedBackupToRestore?: (v: any | null) => void;
  isReadOnlyMode: boolean;
  isTestingMode: boolean;
  handleCreateWeeklyBackup?: () => void;
  handleConfirmRestoreBackup?: () => void;
  handleDeleteBackup?: (id: string) => void;
  handleDownloadBackupJSON?: (backup: any) => void;
  handleRestoreFromJSONFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AdminBackupsTab(props: AdminBackupsTabProps) {
  const {
    isReadOnlyMode,
    isTestingMode,
    state,
  } = props;

  const backups = state?.backups ?? props.backups ?? [];
  const loadingBackups = state?.loadingBackups ?? props.loadingBackups ?? false;
  const creatingBackup = state?.creatingBackup ?? props.creatingBackup ?? false;
  const backupTitle = state?.backupTitle ?? props.backupTitle ?? '';
  const setBackupTitle = state?.setBackupTitle ?? props.setBackupTitle ?? (() => {});
  const backupNotes = state?.backupNotes ?? props.backupNotes ?? '';
  const setBackupNotes = state?.setBackupNotes ?? props.setBackupNotes ?? (() => {});
  const restoringBackupId = state?.restoringBackupId ?? props.restoringBackupId ?? null;
  const isRestoreWarningOpen = state?.isRestoreWarningOpen ?? props.isRestoreWarningOpen ?? false;
  const setIsRestoreWarningOpen = state?.setIsRestoreWarningOpen ?? props.setIsRestoreWarningOpen ?? (() => {});
  const selectedBackupToRestore = state?.selectedBackupToRestore ?? props.selectedBackupToRestore ?? null;
  const setSelectedBackupToRestore = state?.setSelectedBackupToRestore ?? props.setSelectedBackupToRestore ?? (() => {});
  const handleCreateWeeklyBackup = state?.handleCreateWeeklyBackup ?? props.handleCreateWeeklyBackup ?? (() => {});
  const handleConfirmRestoreBackup = state?.handleConfirmRestoreBackup ?? props.handleConfirmRestoreBackup ?? (() => {});
  const handleDeleteBackup = state?.handleDeleteBackup ?? props.handleDeleteBackup ?? (() => {});
  const handleDownloadBackupJSON = state?.handleDownloadBackupJSON ?? props.handleDownloadBackupJSON ?? (() => {});
  const handleRestoreFromJSONFile = state?.handleRestoreFromJSONFile ?? props.handleRestoreFromJSONFile ?? (() => {});
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Info / Generator Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs tracking-wide">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Automated Weekly Backup System Active</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Weekly Inventory Snapshots & Recovery</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
              Generate immutable snapshots of your entire drug inventory and regulatory audit logs. Backups are automatically archived in Supabase Cloud Postgres for audit resilience and disaster recovery.
            </p>
          </div>

          {isReadOnlyMode ? (
            <div className="w-full lg:w-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 shrink-0 shadow-lg min-w-[300px]">
              <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Read-Only Viewer Mode</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Database snapshot creation and rollback restorations are restricted to Admin (PIN 7890).
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                You can safely view historical archives and download full JSON snapshots below.
              </p>
            </div>
          ) : (
            <div className="w-full lg:w-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shrink-0 shadow-lg min-w-[300px]">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Generate Manual Backup Snapshot
              </h4>
              <input
                type="text"
                value={backupTitle}
                onChange={(e) => setBackupTitle(e.target.value)}
                placeholder="Snapshot Title (Optional)..."
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl font-bold text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
              <input
                type="text"
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="Clinical notes or reason (Optional)..."
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl font-bold text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCreateWeeklyBackup}
                disabled={creatingBackup}
                className="w-full min-h-[44px] px-4 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {creatingBackup ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>{creatingBackup ? 'Creating Snapshot...' : 'Create Backup Snapshot Now'}</span>
              </button>

              {isTestingMode && (
                <div className="pt-2 border-t border-slate-700/80">
                  <label className="w-full min-h-[40px] px-4 rounded-xl bg-slate-900 hover:bg-slate-950 border border-amber-400/50 text-amber-300 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Restore from JSON File (Testing)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreFromJSONFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backups Archive List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <HardDrive className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Historical Weekly Backup Archives
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            {backups.length} archived {backups.length === 1 ? 'snapshot' : 'snapshots'}
          </span>
        </div>

        {loadingBackups ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <RotateCcw className="w-7 h-7 text-amber-500 animate-spin" />
            <span className="font-bold text-sm tracking-wider uppercase">Loading historical archives...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold text-sm space-y-2">
            <p>No weekly backups recorded yet.</p>
            <p className="text-xs font-semibold text-slate-400">Click the button above to generate your initial snapshot right away!</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                      SNAPSHOT
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(backup.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h5 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {backup.title}
                  </h5>
                  {backup.notes && (
                    <p className="text-xs font-medium text-slate-600">
                      {backup.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-extrabold text-slate-700">
                    <span>📦 {backup.itemCount} Medications Archived</span>
                    <span>📑 {backup.logCount} Audit Logs Captured</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownloadBackupJSON(backup)}
                    className="min-h-[40px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Download full JSON backup snapshot"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Export JSON</span>
                  </button>

                  {!isReadOnlyMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBackupToRestore(backup);
                          setIsRestoreWarningOpen(true);
                        }}
                        disabled={restoringBackupId === backup.id}
                        className="min-h-[40px] px-4 bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {restoringBackupId === backup.id ? (
                          <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <Upload className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                        )}
                        <span>Restore Backup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all border border-rose-200 cursor-pointer"
                        title="Delete backup archive"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Confirmation Pop-up Dialog for Restoring from Backup */}
      <AdminRestoreWarningModal
        isOpen={Boolean(isRestoreWarningOpen && selectedBackupToRestore && !isReadOnlyMode)}
        selectedBackupToRestore={selectedBackupToRestore}
        restoringBackupId={restoringBackupId}
        onCancel={() => {
          setIsRestoreWarningOpen(false);
          setSelectedBackupToRestore(null);
        }}
        onConfirm={handleConfirmRestoreBackup}
      />
    </div>
  );
}
