'use client';

import React, { useState, useEffect } from 'react';
import { DispenseLog } from '@/types/inventory';
import { X, Search, FileText, Download, ShieldCheck, Clock, User, Filter, ArrowUpRight, ArrowDownRight, RotateCcw, Trash2, Edit3, AlertTriangle, Check, Terminal, FlaskConical } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogsCleared?: () => void;
  testLogs?: DispenseLog[];
  initialSearchQuery?: string;
}

export default function AuditLogModal({ isOpen, onClose, onLogsCleared, testLogs = [], initialSearchQuery = '' }: AuditLogModalProps) {
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [editingLog, setEditingLog] = useState<DispenseLog | null>(null);
  const [editQty, setEditQty] = useState<number | string>('');
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState<boolean>(false);

  useEffect(() => {
    const checkTest = () => {
      if (typeof window !== 'undefined') {
        setIsTestingMode(localStorage.getItem('mission_rx_testing_mode') === 'true');
      }
    };
    checkTest();
    window.addEventListener('storage', checkTest);
    window.addEventListener('mission_rx_testing_mode_change', checkTest);
    return () => {
      window.removeEventListener('storage', checkTest);
      window.removeEventListener('mission_rx_testing_mode_change', checkTest);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
        }
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialSearchQuery || '');
      fetchLogs();
    }
  }, [isOpen, initialSearchQuery]);

  const handleResetAuditLogs = async () => {
    if (!isTestingMode) {
      alert('Regulatory compliance protection: Real transaction audit logs are permanent and cannot be deleted.');
      return;
    }
    if (!confirm('Clear simulated test logs?')) return;
    setLogs([]);
    if (onLogsCleared) onLogsCleared();
  };

  const startEditingLog = (log: DispenseLog) => {
    setEditingLog(log);
    setEditQty(log.quantityChanged);
    setIsWarningOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingLog) return;
    setLoading(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLog.id,
          quantityChanged: Number(editQty) || 0,
          details: `${editingLog.details || ''} (Manual regulatory revision: quantity changed from ${editingLog.quantityChanged} to ${editQty})`,
        }),
      });
      if (res.ok) {
        setIsWarningOpen(false);
        setEditingLog(null);
        await fetchLogs();
        if (onLogsCleared) onLogsCleared();
      }
    } catch (e) {
      console.error('Failed editing log:', e);
    } finally {
      setLoading(false);
    }
  };

  const safeLogs = React.useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
  const safeTestLogs = React.useMemo(() => (Array.isArray(testLogs) ? testLogs : []), [testLogs]);

  const displayedLogs = React.useMemo(() => {
    if (isTestingMode && safeTestLogs.length > 0) {
      return [...safeTestLogs, ...safeLogs];
    }
    return safeLogs;
  }, [safeLogs, safeTestLogs, isTestingMode]);

  const filteredLogs = React.useMemo(() => {
    const list = Array.isArray(displayedLogs) ? displayedLogs : [];
    return list.filter((log) => {
      if (!log || typeof log !== 'object') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(log.itemGenericName || '').toLowerCase().includes(q);
        const matchDetails = String(log.details || '').toLowerCase().includes(q);
        const matchRole = String(log.userRole || '').toLowerCase().includes(q);
        const lots = Array.isArray(log.lotNumbers) 
          ? log.lotNumbers.join(' ').toLowerCase() 
          : String(log.lotNumbers || '').toLowerCase();
        const matchLots = lots.includes(q);
        if (!matchName && !matchDetails && !matchRole && !matchLots) return false;
      }
      if (selectedAction !== 'ALL' && log.actionType !== selectedAction) {
        return false;
      }
      return true;
    });
  }, [displayedLogs, searchQuery, selectedAction]);

  const formatLogDate = (rawDate: any): string => {
    if (!rawDate) return 'Recent';
    try {
      const parsed = typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'MMM dd, yyyy • h:mm:ss a');
      }
      return String(rawDate);
    } catch (e) {
      return String(rawDate || 'Recent');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Timestamp', 'Action Type', 'Medication Name', 'Quantity Changed', 'Lot Numbers', 'User Role', 'Audit Details'];
      const rows = filteredLogs.map((l) => {
        const safeRole = String(l.userRole || 'STAFF').replace(/"/g, '""');
        const lots = Array.isArray(l.lotNumbers) ? l.lotNumbers.join(', ') : (l.lotNumbers || 'N/A');
        return [
          l.createdAt ? `"${String(l.createdAt).replace(/"/g, '""')}"` : '""',
          l.actionType ? `"${String(l.actionType).replace(/"/g, '""')}"` : '""',
          `"${String(l.itemGenericName || '').replace(/"/g, '""')}"`,
          Number(l.quantityChanged) || 0,
          `"${lots.replace(/"/g, '""')}"`,
          l.isTestMode ? `"${safeRole} [TEST MODE - NOT REAL]"` : `"${safeRole}"`,
          `"${String(l.details || '').replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mission_rx_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-5 select-none overflow-x-hidden">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.5] text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Regulatory Compliance & Dispense Audit Log
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500">
                Complete tamper-evident timestamped transaction history for clinical supervision
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            {isTestingMode && (
              <button
                type="button"
                onClick={handleResetAuditLogs}
                className="min-h-[42px] px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Reset simulated test logs"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Clear Test Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[42px] px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all touch-manipulation active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>Export CSV Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by drug name, user role (STAFF/ADMIN), or lot details..."
              className="w-full pl-10 pr-4 min-h-[44px] bg-slate-50 focus:bg-white border border-slate-300 focus:border-amber-500 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden select-text"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1 hidden lg:inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {['ALL', 'DISPENSE', 'RESTOCK', 'EDIT', 'AUDIT'].map((type) => {
              const isSelected = selectedAction === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedAction(type)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type === 'ALL' ? 'All Activity' : type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chronological Table List */}
        <div className="overflow-y-auto flex-1 py-4 space-y-3 overscroll-contain">
          {loading && logs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <RotateCcw className="w-7 h-7 text-amber-500 animate-spin" />
              <span className="font-bold text-sm tracking-wider uppercase">Loading transaction records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-bold text-sm">
              No clinical transaction audit records found matching your filter criteria.
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const qtyNum = Number(log.quantityChanged) || 0;
              const isDispense = log.actionType === 'DISPENSE' || (qtyNum < 0 && log.actionType !== 'RESTOCK');
              const isRestock = log.actionType === 'RESTOCK' || log.details?.toLowerCase().includes('undispensed') || log.details?.toLowerCase().includes('restocked');
              const isPositive = isRestock && !isDispense;
              const isNegative = isDispense;

              let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
              if (isDispense) badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
              else if (isRestock) badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              else if (log.actionType === 'EDIT' || log.actionType === 'AUDIT') badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300';
              else if (log.actionType === 'CREATE') badgeStyle = 'bg-teal-50 text-teal-800 border-teal-300';
              else if (log.actionType === 'DELETE') badgeStyle = 'bg-red-50 text-red-800 border-red-300';

              const formattedDate = formatLogDate(log.createdAt);
              const isTestRecord = Boolean(
                log.isTestMode ||
                (log.userRole && String(log.userRole).includes('(TEST)')) ||
                (log.details && String(log.details).includes('TESTING MODE'))
              );

              const safeKey = `log-${log.id || 'entry'}-${index}`;

              return (
                <div
                  key={safeKey}
                  className={`p-4 rounded-2xl border shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-text ${
                    isTestRecord
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-2xl border flex items-center justify-center shrink-0 ${badgeStyle}`}
                    >
                      {log.actionType === 'DISPENSE' ? (
                        <ArrowDownRight className="w-5 h-5 text-rose-600 stroke-[3]" />
                      ) : log.actionType === 'RESTOCK' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <FileText className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isTestRecord && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 bg-amber-400 text-slate-950 border-amber-500 shadow-xs font-mono animate-pulse">
                            <FlaskConical className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                            <span>TESTING MODE • NOT REAL</span>
                          </span>
                        )}
                        <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                          {log.actionType || 'ACTIVITY'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          log.userRole === 'DEVELOPER'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {log.userRole === 'DEVELOPER' ? (
                            <Terminal className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <User className="w-3 h-3 text-slate-500" />
                          )}
                          {log.userRole || 'STAFF'}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {log.itemGenericName || 'Medication Transaction Record'}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 leading-normal">
                        {log.details || 'Routine clinical dispensary action.'}
                      </p>
                      {(() => {
                        const rawLots = (log as any).lotNumbers;
                        let parsedLots: string[] = [];
                        if (Array.isArray(rawLots)) {
                          parsedLots = rawLots;
                        } else if (typeof rawLots === 'string') {
                          try {
                            if (rawLots.startsWith('[')) {
                              const p = JSON.parse(rawLots);
                              parsedLots = Array.isArray(p) ? p : [String(p)];
                            } else {
                              parsedLots = rawLots.split(',').map((s: string) => s.trim()).filter(Boolean);
                            }
                          } catch (e) {
                            parsedLots = [rawLots];
                          }
                        }
                        if (parsedLots.length === 0) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-amber-800 font-extrabold uppercase self-center mr-1 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                              Lot #:
                            </span>
                            {parsedLots.map((lot, idx) => (
                              <span key={idx} className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                                {lot}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quantity & Action Controls */}
                  <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:hidden">Qty Change</span>
                      <span
                        className={`font-mono font-black text-sm sm:text-base ${
                          isNegative ? 'text-rose-600' : isPositive ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {log.dispensedUnit === 'bottle' ? (
                          <span>
                            {isPositive ? '+' : '-'}{log.dispensedBottles || 1} bottle{(log.dispensedBottles || 1) !== 1 ? 's' : ''}
                            <span className="text-[10px] font-bold text-slate-400 block sm:text-right">
                              ({Math.abs(qtyNum)} pills)
                            </span>
                          </span>
                        ) : (
                          <span>{isPositive ? `+${Math.abs(qtyNum)}` : isNegative ? `-${Math.abs(qtyNum)}` : qtyNum}</span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditingLog(log)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border border-slate-200 hover:border-amber-300 transition-all shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                      title="Edit recorded dispensed quantity"
                    >
                      <Edit3 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Warning Confirmation Pop-up Dialog for Editing Dispensed Amount */}
        {isWarningOpen && editingLog && (
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
                    You are modifying an official clinical transaction log for <span className="font-bold text-slate-900">{editingLog.itemGenericName || 'this item'}</span>. Altering regulatory usage records changes historical compliance totals and dispense reporting.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  New Recorded Quantity (Dispensed is negative, Restock is positive):
                </label>
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full min-h-[46px] px-4 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-base font-black text-slate-950 focus:outline-hidden shadow-inner select-text"
                  placeholder="e.g. -2"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsWarningOpen(false); setEditingLog(null); }}
                  className="min-h-[44px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  disabled={loading}
                  className="min-h-[44px] px-5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{loading ? 'Saving...' : 'Yes, Modify Record'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

