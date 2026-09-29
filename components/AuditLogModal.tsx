'use client';

import React, { useState, useEffect } from 'react';
import { DispenseLog } from '@/types/inventory';
import { X, Search, FileText, Download, ShieldCheck, Clock, User, Filter, ArrowUpRight, ArrowDownRight, RotateCcw, Trash2, Edit3, AlertTriangle, Check, Terminal, FlaskConical, FileSpreadsheet, PackageX } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogsCleared?: () => void;
  testLogs?: DispenseLog[];
  initialSearchQuery?: string;
  isReadOnly?: boolean;
  userRole?: string;
}

export default function AuditLogModal({
  isOpen,
  onClose,
  onLogsCleared,
  testLogs = [],
  initialSearchQuery = '',
  isReadOnly = false,
  userRole = 'STAFF',
}: AuditLogModalProps) {
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [editingLog, setEditingLog] = useState<DispenseLog | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editActionType, setEditActionType] = useState('DISPENSE');
  const [editQty, setEditQty] = useState<number | string>('');
  const [editBottles, setEditBottles] = useState<number | string>(0);
  const [editLots, setEditLots] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState<boolean>(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);

  const isDeveloper = userRole === 'DEVELOPER' || isDevUnlocked;

  const requireDeveloper = (): boolean => {
    if (isDeveloper) return true;
    const pin = prompt('Enter Developer PIN (7777) to authorize developer administrative edit/delete access:');
    if (pin === '7777') {
      setIsDevUnlocked(true);
      return true;
    }
    if (pin !== null) {
      alert('Incorrect Developer PIN.');
    }
    return false;
  };

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
    if (isTestingMode) {
      if (!confirm('Clear simulated test logs?')) return;
      setLogs([]);
      if (onLogsCleared) onLogsCleared();
      return;
    }
    if (!requireDeveloper()) {
      alert('Regulatory compliance protection: Real transaction audit logs are permanent and cannot be deleted.');
      return;
    }
    if (!confirm('DEVELOPER OVERRIDE: Are you sure you want to permanently delete ALL audit log records from the database? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/logs?developer=true', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        alert('All audit log records permanently deleted from Supabase & SQLite.');
        if (onLogsCleared) onLogsCleared();
      } else {
        alert('Failed to wipe audit logs.');
      }
    } catch (e) {
      console.error('Failed clearing logs:', e);
      alert('Error wiping audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingLog = (log: DispenseLog) => {
    setEditingLog(log);
    setEditItemName(log.itemGenericName || '');
    setEditActionType(log.actionType || 'DISPENSE');
    setEditQty(log.quantityChanged ?? 0);
    setEditBottles(log.dispensedBottles ?? 0);
    const rawLots = (log as any).lotNumbers;
    const lotsStr = Array.isArray(rawLots) ? rawLots.join(', ') : (rawLots || '');
    setEditLots(lotsStr);
    setEditDetails(log.details || '');
    setIsWarningOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingLog) return;
    setLoading(true);
    try {
      const splitLots = editLots.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLog.id,
          itemGenericName: editItemName,
          actionType: editActionType,
          quantityChanged: Number(editQty) || 0,
          dispensedBottles: Number(editBottles) || 0,
          lotNumbers: splitLots,
          details: editDetails,
          developer: isDeveloper,
        }),
      });
      if (res.ok) {
        setIsWarningOpen(false);
        setEditingLog(null);
        await fetchLogs();
        if (onLogsCleared) onLogsCleared();
      } else {
        alert('Failed to update audit log entry.');
      }
    } catch (e) {
      console.error('Failed editing log:', e);
      alert('Error updating audit log entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleLog = async (log: DispenseLog) => {
    if (!requireDeveloper()) return;
    if (!confirm(`DEVELOPER OVERRIDE: Permanently delete audit log record for "${log.itemGenericName || 'Item'}" (${log.actionType})? This removes it permanently from Supabase & SQLite.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?id=${encodeURIComponent(log.id)}&developer=true`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== log.id));
        await fetchLogs();
        if (onLogsCleared) onLogsCleared();
      } else {
        alert('Failed to delete log entry.');
      }
    } catch (e) {
      console.error('Failed deleting log:', e);
      alert('Error deleting log entry.');
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

  const handleExportExcel = () => {
    try {
      const escapeXml = (str: unknown) => {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const rowsXml = filteredLogs.map((l) => {
        const safeRole = l.isTestMode ? `${l.userRole || 'STAFF'} [TEST MODE]` : (l.userRole || 'STAFF');
        const lots = Array.isArray(l.lotNumbers) ? l.lotNumbers.join(', ') : (l.lotNumbers || 'N/A');
        const timestamp = l.createdAt ? formatLogDate(l.createdAt) : 'N/A';
        const actionType = l.actionType || 'LOG';
        const itemName = l.itemGenericName || 'N/A';
        const qty = Number(l.quantityChanged) || 0;
        const details = l.details || '';

        return `
    <Row ss:Height="20">
      <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(timestamp)}</Data></Cell>
      <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(actionType)}</Data></Cell>
      <Cell ss:StyleID="DataBold"><Data ss:Type="String">${escapeXml(itemName)}</Data></Cell>
      <Cell ss:StyleID="Number"><Data ss:Type="Number">${qty}</Data></Cell>
      <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(lots)}</Data></Cell>
      <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(safeRole)}</Data></Cell>
      <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(details)}</Data></Cell>
    </Row>`;
      }).join('');

      const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#042F2E"/>
   </Borders>
  </Style>
  <Style ss:ID="Data">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataBold">
   <Font ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="Number">
   <Font ss:Size="10" ss:Color="#0F172A" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Audit Log">
  <Table>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Column ss:Width="220"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="300"/>
   <Row ss:Height="26" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell><Data ss:Type="String">Action Type</Data></Cell>
    <Cell><Data ss:Type="String">Medication / Item</Data></Cell>
    <Cell><Data ss:Type="String">Quantity Changed</Data></Cell>
    <Cell><Data ss:Type="String">Lot / Serial Numbers</Data></Cell>
    <Cell><Data ss:Type="String">User Role</Data></Cell>
    <Cell><Data ss:Type="String">Audit Transaction Details</Data></Cell>
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mission_rx_audit_log_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export Excel spreadsheet:', err);
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
            {isDeveloper && (
              <span className="min-h-[42px] px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-2xs">
                <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Developer Access</span>
              </span>
            )}

            {(isDeveloper || isTestingMode) && !isReadOnly && (
              <button
                type="button"
                onClick={handleResetAuditLogs}
                className="min-h-[42px] px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                title={isDeveloper ? "Developer: Permanently wipe all audit log records" : "Reset simulated test logs"}
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isDeveloper ? 'Wipe Audit Logs' : 'Clear Test Logs'}</span>
              </button>
            )}

            {/* Download Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="min-h-[42px] px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all touch-manipulation active:scale-95 flex items-center gap-2 cursor-pointer border border-emerald-600"
              title="Download formatted Excel Spreadsheet (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200 stroke-[2.5]" />
              <span>Download Excel</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[42px] px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all touch-manipulation active:scale-95 flex items-center gap-2 cursor-pointer"
              title="Export standard CSV report"
            >
              <Download className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>Export CSV</span>
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
            {['ALL', 'DISPENSE', 'UNDISPENSE', 'RESTOCK', 'DISCARD', 'EDIT', 'AUDIT'].map((type) => {
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
              const isDiscard = log.actionType === 'DISCARD' || (log.details?.toLowerCase().includes('expired / waste') || log.details?.toLowerCase().includes('[expired'));
              const isDispense = !isDiscard && (log.actionType === 'DISPENSE' || (qtyNum < 0 && log.actionType !== 'RESTOCK' && log.actionType !== 'UNDISPENSE')) && log.actionType !== 'EDIT' && log.actionType !== 'AUDIT';
              const isUndispense = log.actionType === 'UNDISPENSE' || (log.details?.toLowerCase().includes('undispensed') && !log.details?.toLowerCase().includes('restocked'));
              const isRestock = log.actionType === 'RESTOCK' || log.details?.toLowerCase().includes('restocked');
              const isCreate = log.actionType === 'CREATE';
              const isEditOrAudit = log.actionType === 'EDIT' || log.actionType === 'AUDIT' || log.actionType === 'DELETE';
              const isPositive = (isRestock || isUndispense || (isCreate && qtyNum > 0)) && !isDispense && !isDiscard;
              const isNegative = (isDispense || isDiscard) && qtyNum !== 0;

              let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
              if (isDiscard || log.actionType === 'DISCARD') badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
              else if (isDispense) badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
              else if (isUndispense) badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
              else if (isRestock) badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              else if (log.actionType === 'EDIT' || log.actionType === 'AUDIT') badgeStyle = 'bg-blue-50 text-blue-900 border-blue-300';
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
                      {log.actionType === 'DISCARD' || isDiscard ? (
                        <PackageX className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                      ) : log.actionType === 'DISPENSE' ? (
                        <ArrowDownRight className="w-5 h-5 text-rose-600 stroke-[3]" />
                      ) : log.actionType === 'UNDISPENSE' ? (
                        <RotateCcw className="w-5 h-5 text-amber-600 stroke-[2.5]" />
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
                          isNegative ? 'text-rose-600' : isUndispense ? 'text-amber-700' : isRestock ? 'text-emerald-600' : isCreate && qtyNum > 0 ? 'text-teal-700' : 'text-slate-600'
                        }`}
                      >
                        {!isDiscard && (isEditOrAudit || qtyNum === 0) ? (
                          <span className="text-slate-500 font-bold text-xs">
                            {qtyNum === 0 ? 'No change' : qtyNum > 0 ? `+${qtyNum}` : `${qtyNum}`}
                          </span>
                        ) : log.dispensedUnit === 'bottle' || (isDiscard && (log.dispensedBottles || 0) > 0) ? (
                          <span>
                            {isPositive ? '+' : isNegative ? '-' : ''}{log.dispensedBottles || 1} bottle{(log.dispensedBottles || 1) !== 1 ? 's' : ''}
                            <span className="text-[10px] font-bold text-slate-400 block sm:text-right">
                              ({Math.abs(qtyNum)} pills)
                            </span>
                          </span>
                        ) : (
                          <span>{isPositive ? `+${Math.abs(qtyNum)}` : isNegative ? `-${Math.abs(qtyNum)}` : qtyNum}</span>
                        )}
                      </span>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDeveloper && !isTestingMode) {
                              if (!requireDeveloper()) return;
                            }
                            startEditingLog(log);
                          }}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border border-slate-200 hover:border-amber-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title="Developer: Edit Recorded Log"
                        >
                          <Edit3 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleLog(log)}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title="Developer: Permanently Delete Record"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Developer / Regulatory Edit Pop-up Dialog */}
        {isWarningOpen && editingLog && !isReadOnly && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 shadow-inner">
                  <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      Developer Record Revision
                    </h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Developer Override
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-normal">
                    You are modifying an official clinical transaction log for <span className="font-bold text-slate-900">{editingLog.itemGenericName || 'this item'}</span>. Updates will be saved permanently to Supabase and SQLite.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                    Medication / Generic Name
                  </label>
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                      Action Type
                    </label>
                    <select
                      value={editActionType}
                      onChange={(e) => setEditActionType(e.target.value)}
                      className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    >
                      <option value="DISPENSE">DISPENSE</option>
                      <option value="DISPENSE_BOTTLE">DISPENSE_BOTTLE</option>
                      <option value="DISCARD_EXPIRED">DISCARD_EXPIRED</option>
                      <option value="UNDISPENSE">UNDISPENSE</option>
                      <option value="RESTOCK">RESTOCK</option>
                      <option value="EDIT">EDIT</option>
                      <option value="AUDIT">AUDIT</option>
                      <option value="CREATE">CREATE</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                      Lot Numbers (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editLots}
                      onChange={(e) => setEditLots(e.target.value)}
                      placeholder="e.g. 4ME2261, LOT99"
                      className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                      Pill / Unit Delta (Negative for dispense/discard)
                    </label>
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      placeholder="e.g. -24"
                      className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                      Bottles Delta
                    </label>
                    <input
                      type="number"
                      value={editBottles}
                      onChange={(e) => setEditBottles(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                    Details / Reason for Revision
                  </label>
                  <textarea
                    rows={2}
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    placeholder="Clinical revision notes..."
                    className="w-full p-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsWarningOpen(false); setEditingLog(null); }}
                  className="min-h-[42px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  disabled={loading}
                  className="min-h-[42px] px-5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{loading ? 'Saving...' : 'Save Revisions'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

