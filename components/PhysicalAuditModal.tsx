'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, DispenseLog } from '@/types/inventory';
import { 
  X, 
  Check, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  ClipboardList, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { calculateTotalUnits, convertTotalUnitsToStock, getStandardItemName, parseLotNumbers } from '@/lib/stockMath';
import { getSpecialtyColor } from '@/lib/specialtyColors';

interface PhysicalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onBatchUpdateStock: (updates: Array<{ id: string; bottles: number; loose: number; logNote?: string }>) => Promise<void> | void;
  userRole?: string;
}

interface CountEntry {
  id: string;
  physicalBottles: string;
  physicalLoose: string;
  note: string;
}

export default function PhysicalAuditModal({
  isOpen,
  onClose,
  items,
  onBatchUpdateStock,
  userRole = 'ADMIN',
}: PhysicalAuditModalProps) {
  const [counts, setCounts] = useState<{ [id: string]: CountEntry }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MEDS' | 'SUPPLIES' | 'VARIANCE_ONLY'>('ALL');
  const [selectedShelf, setSelectedShelf] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Initialize counts with current system stock
  useEffect(() => {
    if (isOpen) {
      const initialCounts: { [id: string]: CountEntry } = {};
      items.forEach((item) => {
        initialCounts[item.id] = {
          id: item.id,
          physicalBottles: String(item.bottlesAvailable || 0),
          physicalLoose: String(item.looseUnitsAvailable || 0),
          note: '',
        };
      });
      setCounts(initialCounts);
      setShowPrintView(false);
    }
  }, [isOpen, items]);

  const uniqueShelves = useMemo(() => {
    const shelves = new Set<string>();
    items.forEach((i) => {
      if (i.shelfLocation) shelves.add(i.shelfLocation.trim());
    });
    return Array.from(shelves).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      const isSupply = item.shelfLocation === 'Supplies' || item.itemType === 'Supply';
      if (filterType === 'MEDS' && isSupply) return false;
      if (filterType === 'SUPPLIES' && !isSupply) return false;

      // Shelf filter
      if (selectedShelf !== 'ALL' && item.shelfLocation?.trim() !== selectedShelf) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.genericName.toLowerCase().includes(q);
        const matchBrand = (item.brandName || '').toLowerCase().includes(q);
        const matchShelf = (item.shelfLocation || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchShelf) return false;
      }

      // Variance Only filter
      if (filterType === 'VARIANCE_ONLY') {
        const entry = counts[item.id];
        if (!entry) return false;
        const physBottles = parseInt(entry.physicalBottles) || 0;
        const physLoose = parseInt(entry.physicalLoose) || 0;
        const physTotal = calculateTotalUnits(physBottles, item.pillsPerBottle || 1, physLoose);
        const expTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 1, item.looseUnitsAvailable || 0);
        if (physTotal === expTotal) return false;
      }

      return true;
    });
  }, [items, filterType, selectedShelf, searchQuery, counts]);

  // Overall Variance Summary
  const varianceSummary = useMemo(() => {
    let matched = 0;
    let deficits = 0;
    let surpluses = 0;
    let netUnitVariance = 0;

    items.forEach((item) => {
      const entry = counts[item.id];
      if (!entry) return;
      const physBottles = parseInt(entry.physicalBottles) || 0;
      const physLoose = parseInt(entry.physicalLoose) || 0;
      const physTotal = calculateTotalUnits(physBottles, item.pillsPerBottle || 1, physLoose);
      const expTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 1, item.looseUnitsAvailable || 0);
      const diff = physTotal - expTotal;

      if (diff === 0) {
        matched++;
      } else if (diff < 0) {
        deficits++;
        netUnitVariance += diff;
      } else {
        surpluses++;
        netUnitVariance += diff;
      }
    });

    return { matched, deficits, surpluses, netUnitVariance };
  }, [items, counts]);

  if (!isOpen) return null;

  const handleUpdateCount = (id: string, field: 'physicalBottles' | 'physicalLoose' | 'note', value: string) => {
    setCounts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleMatchAllToSystem = () => {
    const updated: { [id: string]: CountEntry } = {};
    items.forEach((item) => {
      updated[item.id] = {
        id: item.id,
        physicalBottles: String(item.bottlesAvailable || 0),
        physicalLoose: String(item.looseUnitsAvailable || 0),
        note: '',
      };
    });
    setCounts(updated);
  };

  const handleApplyReconciliation = async () => {
    const changes: Array<{ id: string; bottles: number; loose: number; logNote?: string }> = [];

    items.forEach((item) => {
      const entry = counts[item.id];
      if (!entry) return;

      const physBottles = Math.max(0, parseInt(entry.physicalBottles) || 0);
      const physLoose = Math.max(0, parseInt(entry.physicalLoose) || 0);
      const physTotal = calculateTotalUnits(physBottles, item.pillsPerBottle || 1, physLoose);
      const expTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 1, item.looseUnitsAvailable || 0);

      if (physTotal !== expTotal || physBottles !== (item.bottlesAvailable || 0) || physLoose !== (item.looseUnitsAvailable || 0)) {
        const diff = physTotal - expTotal;
        const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
        const note = entry.note.trim() ? ` [Note: ${entry.note.trim()}]` : '';
        const logNote = `Physical count reconciliation: adjusted from ${expTotal} to ${physTotal} units (${diffLabel} ${item.subUnit || 'units'})${note}`;

        changes.push({
          id: item.id,
          bottles: physBottles,
          loose: physLoose,
          logNote,
        });
      }
    });

    if (changes.length === 0) {
      alert('No variances found. Physical counts already match current system inventory perfectly!');
      onClose();
      return;
    }

    if (
      !confirm(
        `Reconcile and update ${changes.length} item(s) with physical audit counts?\n\nThis will update live dispensary inventory and generate formal compliance audit logs.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onBatchUpdateStock(changes);
      alert(`Successfully reconciled ${changes.length} inventory item(s)!`);
      onClose();
    } catch (e: any) {
      alert(`Error updating inventory: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="physical-audit-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:static print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto print:max-h-none print:inset-auto"
    >
      <div className="bg-white border-2 border-amber-500 rounded-3xl p-5 sm:p-7 max-w-6xl w-full shadow-2xl space-y-5 text-slate-900 my-6 max-h-[94vh] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:h-auto print:max-w-none print:w-full print:rounded-none print:block print:space-y-3">
        {/* PRINT-ONLY OFFICIAL WORKSHEET HEADER */}
        <div className="hidden print:block pb-3 mb-3 border-b-2 border-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Mission-Rx Clinical Inventory & Shelf Audit Worksheet
                </h1>
                <span className="text-[8pt] font-mono font-bold px-2 py-0.5 border border-slate-900 rounded-md">
                  PHYSICAL INTAKE
                </span>
              </div>
              <p className="text-[9pt] text-slate-700 font-semibold mt-0.5">
                On-shelf physical count verification & discrepancy reconciliation worksheet
              </p>
            </div>
            <div className="text-right text-[8.5pt] font-mono border-l-2 border-slate-300 pl-3">
              <div className="font-bold text-slate-900">
                DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-slate-600">
                TIME: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Metadata Ribbon */}
          <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-300 text-[8.5pt] font-semibold text-slate-800">
            <div>
              <span className="font-extrabold text-slate-900">Scope: </span>
              <span>{selectedShelf === 'ALL' ? 'All Shelves' : selectedShelf}</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900">Items on Sheet: </span>
              <span>{filteredItems.length} Items</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900">Auditor Name: </span>
              <span>____________________</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900">Clinic Station: </span>
              <span>____________________</span>
            </div>
          </div>

          {/* Instructions Banner */}
          <div className="mt-2 p-1.5 bg-slate-100 border border-slate-300 rounded text-[8pt] text-slate-700 font-medium">
            <strong>Clinical Instructions:</strong> Count on-hand physical stock across clinic storage. Write counted sealed container packs and loose units in the boxes provided. Note any lot number or expiration mismatches in discrepancy column.
          </div>
        </div>

        {/* Screen Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 shadow-inner">
              <ClipboardList className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Physical Stock Intake & Shelf Audit
                </h2>
                <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                  Audit Mode
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Walk clinic shelves, enter actual counted physical inventory, and reconcile variances in bulk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
              title="Print count worksheet for clipboard audit"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Worksheet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Variance Metrics Ribbon (Screen only) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:hidden">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Total Items Checked</span>
            <span className="font-mono text-xl font-black text-slate-900">{items.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-800 block">🟢 Exact Matches</span>
            <span className="font-mono text-xl font-black text-emerald-900">{varianceSummary.matched}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-black uppercase text-rose-800 block">🔴 Deficits (Missing)</span>
            <span className="font-mono text-xl font-black text-rose-900">{varianceSummary.deficits}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-black uppercase text-amber-800 block">🟡 Surpluses (Extra)</span>
            <span className="font-mono text-xl font-black text-amber-900">{varianceSummary.surpluses}</span>
          </div>
        </div>

        {/* Filters & Actions Bar (Screen only) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 print:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by formulation, brand, or shelf location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Shelf Filter */}
            <select
              value={selectedShelf}
              onChange={(e) => setSelectedShelf(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-hidden"
            >
              <option value="ALL">📁 All Shelf Locations ({uniqueShelves.length})</option>
              {uniqueShelves.map((shelf) => (
                <option key={shelf} value={shelf}>
                  📍 {shelf}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'MEDS', label: '💊 Meds' },
                  { id: 'SUPPLIES', label: '🩺 Supplies' },
                  { id: 'VARIANCE_ONLY', label: '⚠️ Variances Only' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleMatchAllToSystem}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all physical count fields to match current system numbers"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Match to System</span>
            </button>
          </div>
        </div>

        {/* Audit Count Sheet Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs flex-1 max-h-[50vh] print:max-h-none print:overflow-visible print:h-auto print:border print:border-slate-400 print:rounded-none print:shadow-none print:block print:w-full">
          <table className="w-full text-left border-collapse bg-white print:w-full print:table print:border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200 print:static print:table-header-group print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  Shelf / Location
                </th>
                <th className="py-3 px-3.5 print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  Formulation / Item
                </th>
                <th className="py-3 px-3.5 text-center print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  System Expected
                </th>
                <th className="py-3 px-3.5 text-center bg-amber-50/70 border-x border-amber-200 print:bg-transparent print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  Actual Physical Count
                </th>
                <th className="py-3 px-3.5 text-center print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  Variance
                </th>
                <th className="py-3 px-3.5 print:py-1.5 print:px-2 print:border print:border-slate-400 print:text-[8.5pt] print:font-black">
                  Discrepancy Reason / Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 print:divide-slate-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-semibold print:py-6">
                    No items match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const entry = counts[item.id] || {
                    id: item.id,
                    physicalBottles: String(item.bottlesAvailable || 0),
                    physicalLoose: String(item.looseUnitsAvailable || 0),
                    note: '',
                  };

                  const physBottles = parseInt(entry.physicalBottles) || 0;
                  const physLoose = parseInt(entry.physicalLoose) || 0;
                  const physTotal = calculateTotalUnits(physBottles, item.pillsPerBottle || 1, physLoose);
                  const expTotal = calculateTotalUnits(item.bottlesAvailable || 0, item.pillsPerBottle || 1, item.looseUnitsAvailable || 0);
                  const diff = physTotal - expTotal;
                  const isMatched = diff === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors print:border-b print:border-slate-300 print:break-inside-avoid print:page-break-inside-avoid ${
                        !isMatched ? (diff < 0 ? 'bg-rose-50/40' : 'bg-amber-50/40') : ''
                      }`}
                    >
                      {/* Shelf / Location */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap print:py-1.5 print:px-2 print:text-[8.5pt] print:border-r print:border-slate-300">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] print:bg-transparent print:p-0 print:font-extrabold">
                          📍 {item.shelfLocation || 'General Medical'}
                        </span>
                      </td>

                      {/* Item Name */}
                      <td className="py-2.5 px-3.5 print:py-1.5 print:px-2 print:text-[8.5pt] print:border-r print:border-slate-300">
                        <div className="font-extrabold text-slate-900 text-xs print:text-[9pt]">
                          {item.genericName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 print:text-[8pt] print:text-slate-700">
                          <span>{item.dosage}</span>
                          {item.pillsPerBottle && item.pillsPerBottle > 1 && (
                            <>
                              <span>•</span>
                              <span>Pack of {item.pillsPerBottle} {item.subUnit || 'units'}</span>
                            </>
                          )}
                        </div>
                        {/* Print-only Lot/Exp info */}
                        <div className="hidden print:block text-[7.5pt] font-mono text-slate-600 mt-0.5">
                          Exp: {item.expirationDate && !item.expirationDate.startsWith('3000') ? item.expirationDate.slice(0, 10) : 'Permanent'} • Lots: {parseLotNumbers(item.lotNumbers).join(', ') || 'N/A'}
                        </div>
                      </td>

                      {/* System Expected */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2 print:text-[8.5pt] print:border-r print:border-slate-300">
                        <div className="font-mono font-bold text-slate-900 text-xs print:text-[8.5pt]">
                          {item.bottlesAvailable || 0} {item.stockUnit || 'pks'} + {item.looseUnitsAvailable || 0} {item.subUnit || 'loose'}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono print:text-[7.5pt] print:text-slate-600 block">
                          ({expTotal.toLocaleString()} {item.subUnit || 'units'})
                        </span>
                      </td>

                      {/* Actual Physical Count Inputs */}
                      <td className="py-2 px-3 bg-amber-50/50 border-x border-amber-200 print:bg-transparent print:border-r print:border-slate-300 print:py-1.5 print:px-2">
                        {/* On-screen Input Mode */}
                        <div className="flex items-center justify-center gap-1.5 print:hidden">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={entry.physicalBottles}
                              onChange={(e) => handleUpdateCount(item.id, 'physicalBottles', e.target.value)}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-black text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
                              title={`Physical count of ${item.stockUnit || 'Bottles'}`}
                            />
                            <span className="text-[10px] font-bold text-slate-600">{item.stockUnit || 'pks'}</span>
                          </div>

                          <span className="text-slate-400 font-bold">+</span>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={entry.physicalLoose}
                              onChange={(e) => handleUpdateCount(item.id, 'physicalLoose', e.target.value)}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-black text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
                              title={`Physical count of loose ${item.subUnit || 'units'}`}
                            />
                            <span className="text-[10px] font-bold text-slate-600">{item.subUnit || 'loose'}</span>
                          </div>
                        </div>

                        {/* Printable Write-in Box for Clipboard Sheet */}
                        <div className="hidden print:flex items-center justify-center gap-1.5 font-mono text-[8.5pt]">
                          <div className="border border-slate-400 rounded px-2 py-0.5 text-center min-w-[36px] bg-slate-50 font-bold">
                            {entry.physicalBottles !== String(item.bottlesAvailable || 0) && entry.physicalBottles !== '' ? entry.physicalBottles : '____'}
                          </div>
                          <span className="text-[7.5pt] text-slate-600">{item.stockUnit || 'pks'}</span>
                          <span className="text-slate-400">+</span>
                          <div className="border border-slate-400 rounded px-2 py-0.5 text-center min-w-[36px] bg-slate-50 font-bold">
                            {entry.physicalLoose !== String(item.looseUnitsAvailable || 0) && entry.physicalLoose !== '' ? entry.physicalLoose : '____'}
                          </div>
                          <span className="text-[7.5pt] text-slate-600">{item.subUnit || 'loose'}</span>
                        </div>
                      </td>

                      {/* Variance Badge */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2 print:text-[8.5pt] print:border-r print:border-slate-300">
                        {/* Screen View */}
                        <div className="print:hidden">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Match (0)</span>
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <TrendingDown className="w-3 h-3 text-rose-700 stroke-[3]" />
                              <span>{diff} {item.subUnit || 'units'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <TrendingUp className="w-3 h-3 text-amber-700 stroke-[3]" />
                              <span>+{diff} {item.subUnit || 'units'}</span>
                            </span>
                          )}
                        </div>

                        {/* Print View */}
                        <div className="hidden print:block font-mono text-[8pt]">
                          {!isMatched ? (
                            <span className="font-extrabold text-slate-900">
                              {diff > 0 ? `+${diff}` : diff} {item.subUnit || 'u'}
                            </span>
                          ) : (
                            <span className="text-slate-400">[  ] Match</span>
                          )}
                        </div>
                      </td>

                      {/* Discrepancy Note */}
                      <td className="py-2 px-3.5 print:py-1.5 print:px-2 print:text-[8pt]">
                        {/* Screen View */}
                        <div className="print:hidden">
                          <input
                            type="text"
                            placeholder={!isMatched ? 'Reason for variance...' : 'Optional audit note...'}
                            value={entry.note}
                            onChange={(e) => handleUpdateCount(item.id, 'note', e.target.value)}
                            className={`w-full px-2.5 py-1 bg-white border rounded-lg text-xs font-semibold focus:outline-hidden ${
                              !isMatched && !entry.note
                                ? 'border-amber-400 bg-amber-50/30 placeholder-amber-700/60'
                                : 'border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>

                        {/* Print View */}
                        <div className="hidden print:block text-[8pt] text-slate-800">
                          {entry.note ? entry.note : <span className="text-slate-400">__________________________</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PRINT-ONLY SIGNATURE & VERIFICATION BLOCK */}
        <div className="hidden print:block mt-5 pt-3 border-t-2 border-slate-900 break-inside-avoid page-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-[8.5pt] font-semibold text-slate-800">
            <div className="space-y-3">
              <div>
                <div className="font-bold text-slate-900 mb-0.5">Auditor Physical Count Certification:</div>
                <p className="text-[7.5pt] text-slate-600 mb-2">
                  I certify that the physical stock counts above were counted directly on clinic storage shelves.
                </p>
                <div className="flex items-center gap-4 text-[8pt]">
                  <div>Auditor Signature: ___________________________</div>
                  <div>Date: _______________</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-bold text-slate-900 mb-0.5">Pharmacy Director / Clinic Lead Review:</div>
                <div className="flex items-center gap-3 text-[8pt] mb-2">
                  <span>[  ] Counts Verified & Approved</span>
                  <span>[  ] Recount Required</span>
                </div>
                <div className="flex items-center gap-4 text-[8pt]">
                  <div>Lead Signature: ___________________________</div>
                  <div>Date: _______________</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 print:hidden">
          <div className="text-xs font-semibold text-slate-500">
            <span>* Undispensed items and returns are automatically factored into system expected counts.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyReconciliation}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Applying Reconciled Counts...' : 'Save & Apply Physical Counts'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

