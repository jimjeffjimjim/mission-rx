'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem, AuthRole } from '@/types/inventory';
import { differenceInDays, parseISO } from 'date-fns';
import { getSpecialtyColor } from '@/lib/specialtyColors';
import { 
  Pill, 
  Calendar, 
  Plus, 
  Minus, 
  Edit2, 
  Tag, 
  Layers, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface InventoryCardProps {
  item: InventoryItem;
  role: AuthRole;
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onEditItem: (item: InventoryItem) => void;
}

export default function InventoryCard({ item, role, onUpdateStock, onAdjustStock, onEditItem }: InventoryCardProps) {
  // Local state for direct numeric typing entry when in Admin mode
  const [editingBottles, setEditingBottles] = useState(false);
  const [bottlesInput, setBottlesInput] = useState(item.bottlesAvailable.toString());
  
  const [editingLoose, setEditingLoose] = useState(false);
  const [looseInput, setLooseInput] = useState(item.looseUnitsAvailable.toString());

  useEffect(() => {
    if (!editingBottles) {
      setBottlesInput(item.bottlesAvailable.toString());
    }
  }, [item.bottlesAvailable, editingBottles]);

  useEffect(() => {
    if (!editingLoose) {
      setLooseInput(item.looseUnitsAvailable.toString());
    }
  }, [item.looseUnitsAvailable, editingLoose]);

  // Dynamic Units of Measure (UOM)
  const containerLabel = item.stockUnit || 'Bottles';
  const subUnitLabel = item.subUnit || 'pills';

  // Get coordinated specialty color scheme
  const specialtyStyle = React.useMemo(() => {
    return getSpecialtyColor(item.shelfLocation);
  }, [item.shelfLocation]);

  // Parse lot numbers array safely with explicit string[] typing
  const lotList: string[] = React.useMemo(() => {
    try {
      if (typeof item.lotNumbers === 'string') {
        if (item.lotNumbers.startsWith('[')) {
          return JSON.parse(item.lotNumbers);
        }
        return item.lotNumbers.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    } catch (e) {
      return [String(item.lotNumbers)];
    }
  }, [item.lotNumbers]);

  // Expiration date evaluation
  const expStatus = React.useMemo(() => {
    if (item.expirationDate?.startsWith('3000') || item.expirationDate?.startsWith('2099') || item.expirationDate === 'N/A') {
      return { type: 'NON_EXPIRING', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold shadow-2xs', label: '🛡️ N/A - Non-Expiring' };
    }
    try {
      const expDate = parseISO(item.expirationDate);
      const daysRemaining = differenceInDays(expDate, new Date());
      if (isNaN(daysRemaining) || daysRemaining <= 0) {
        return { type: 'EXPIRED', color: 'bg-rose-600 text-white font-black border-rose-700 shadow-sm animate-pulse', label: '🚨 EXPIRED - Do Not Dispense' };
      }
      if (daysRemaining <= 30) {
        return { type: 'WARNING', color: 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-md shadow-amber-500/25', label: `⚠️ Exp in ${daysRemaining}d` };
      }
      return { type: 'GOOD', color: 'bg-slate-100 text-slate-700 border-slate-300 font-bold', label: `Exp: ${item.expirationDate}` };
    } catch (e) {
      return { type: 'GOOD', color: 'bg-slate-100 text-slate-700 border-slate-300 font-bold', label: `Exp: ${item.expirationDate}` };
    }
  }, [item.expirationDate]);

  // Low stock check
  const isLowStock = item.bottlesAvailable < 2 || (item.bottlesAvailable === 0 && item.looseUnitsAvailable < 20);
  const totalUnits = ((item.bottlesAvailable || 0) * (item.pillsPerBottle || 0)) + (item.looseUnitsAvailable || 0);

  // Stock mutation helpers
  const incrementBottles = () => {
    if (onAdjustStock) {
      onAdjustStock(item.id, 1, 0);
      setBottlesInput((prev) => (Number(prev || item.bottlesAvailable || 0) + 1).toString());
    } else {
      const newVal = item.bottlesAvailable + 1;
      onUpdateStock(item.id, newVal, item.looseUnitsAvailable);
      setBottlesInput(newVal.toString());
    }
  };

  const decrementBottles = () => {
    const currentVal = Number(bottlesInput !== undefined ? bottlesInput : item.bottlesAvailable || 0);
    if (currentVal <= 0 && item.bottlesAvailable <= 0) return;
    if (onAdjustStock) {
      onAdjustStock(item.id, -1, 0);
      setBottlesInput((prev) => Math.max(0, Number(prev || item.bottlesAvailable || 0) - 1).toString());
    } else {
      const newVal = Math.max(0, item.bottlesAvailable - 1);
      onUpdateStock(item.id, newVal, item.looseUnitsAvailable);
      setBottlesInput(newVal.toString());
    }
  };

  const incrementLoose = () => {
    if (onAdjustStock) {
      onAdjustStock(item.id, 0, 1);
      setLooseInput((prev) => (Number(prev || item.looseUnitsAvailable || 0) + 1).toString());
    } else {
      const newVal = item.looseUnitsAvailable + 1;
      onUpdateStock(item.id, item.bottlesAvailable, newVal);
      setLooseInput(newVal.toString());
    }
  };

  const decrementLoose = () => {
    const currentVal = Number(looseInput !== undefined ? looseInput : item.looseUnitsAvailable || 0);
    if (currentVal <= 0 && item.looseUnitsAvailable <= 0) return;
    if (onAdjustStock) {
      onAdjustStock(item.id, 0, -1);
      setLooseInput((prev) => Math.max(0, Number(prev || item.looseUnitsAvailable || 0) - 1).toString());
    } else {
      const newVal = Math.max(0, item.looseUnitsAvailable - 1);
      onUpdateStock(item.id, item.bottlesAvailable, newVal);
      setLooseInput(newVal.toString());
    }
  };

  const commitBottlesInput = () => {
    setEditingBottles(false);
    const parsed = parseInt(bottlesInput, 10);
    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setBottlesInput(val.toString());
    if (val !== item.bottlesAvailable) {
      onUpdateStock(item.id, val, item.looseUnitsAvailable);
    }
  };

  const commitLooseInput = () => {
    setEditingLoose(false);
    const parsed = parseFloat(looseInput);
    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setLooseInput(val.toString());
    if (val !== item.looseUnitsAvailable) {
      onUpdateStock(item.id, item.bottlesAvailable, val);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md card-hover p-4 sm:p-6 flex flex-col justify-between select-none ${specialtyStyle.borderLeft} ${specialtyStyle.cardGlow}`}>
      {/* Top Header Row */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-wider border shadow-2xs ${specialtyStyle.badge}`}>
            <Layers className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>{specialtyStyle.label}</span>
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs" title="Calculated Total Units (Sealed Container Packs + Open Loose Stock)">
              Total Stock: {totalUnits.toLocaleString()} {subUnitLabel}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs uppercase tracking-wider border ${expStatus.color}`}>
              <Calendar className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span>{expStatus.label}</span>
            </span>
          </div>
        </div>

        {/* Drug Names & Clinical Strength */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-snug select-text">
              {item.genericName}
            </h3>
            {isLowStock && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs shrink-0 animate-pulse">
                <AlertTriangle className="w-3 h-3 stroke-[3]" />
                <span>Low Stock</span>
              </span>
            )}
          </div>

          {(item.brandName || item.chemicalName) && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold select-text">
              {item.brandName && (
                <span className="text-slate-800 font-extrabold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  Brand: {item.brandName}
                </span>
              )}
              {item.chemicalName && (
                <span className="text-slate-500 font-medium italic">
                  ({item.chemicalName})
                </span>
              )}
            </div>
          )}

          <div className="pt-1.5 flex items-center gap-2 text-sm text-slate-600 font-medium select-text">
            <Pill className="w-4 h-4 text-teal-600 shrink-0 stroke-[2.5]" />
            <span>Form / Strength: <strong className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">{item.dosage}</strong></span>
          </div>

          {/* Directions / Provider Notes from Excel */}
          {item.directions && (
            <div className="pt-2 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 select-text">
              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5] mt-0.5" />
              <p className="font-medium text-slate-700 leading-relaxed">{item.directions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Stock Quantities Box */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          {/* Primary Stock Container */}
          <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl p-3 sm:p-3.5 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1 truncate" title={`Container size: ${item.pillsPerBottle || 0} ${subUnitLabel} per ${containerLabel.toLowerCase().replace(/s$/, '')}`}>
              {containerLabel} {item.pillsPerBottle > 0 ? `(${item.pillsPerBottle} ${subUnitLabel})` : ''}
            </span>
            
            {role === 'ADMIN' ? (
              <div className="flex items-center justify-between gap-1 mt-1">
                <button
                  onClick={decrementBottles}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:bg-rose-600 active:text-white text-slate-700 font-black text-lg border border-slate-300 flex items-center justify-center transition-all touch-manipulation shadow-2xs active:scale-95 cursor-pointer"
                  title={`Decrement ${containerLabel}`}
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>

                {editingBottles ? (
                  <input
                    type="number"
                    value={bottlesInput}
                    onChange={(e) => setBottlesInput(e.target.value)}
                    onBlur={commitBottlesInput}
                    onKeyDown={(e) => e.key === 'Enter' && commitBottlesInput()}
                    autoFocus
                    className="w-14 text-center h-12 bg-white border-2 border-teal-600 rounded-xl text-lg font-black text-teal-700 font-mono focus:outline-hidden shadow-inner"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setBottlesInput(item.bottlesAvailable.toString());
                      setEditingBottles(true);
                    }}
                    className="flex-1 min-h-[48px] text-center font-mono font-black text-2xl text-slate-900 hover:text-teal-700 transition-colors py-1 rounded-lg hover:bg-white/80 cursor-pointer"
                    title="Tap to type exact number"
                  >
                    {item.bottlesAvailable}
                  </button>
                )}

                <button
                  onClick={incrementBottles}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:bg-emerald-600 active:text-white text-slate-700 font-black text-lg border border-slate-300 flex items-center justify-center transition-all touch-manipulation shadow-2xs active:scale-95 cursor-pointer"
                  title={`Increment ${containerLabel}`}
                >
                  <Plus className="w-5 h-5 text-emerald-600 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 mt-1 select-text">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {item.bottlesAvailable}
                </span>
                <span className="text-xs text-slate-500 font-extrabold lowercase truncate">
                  {item.pillsPerBottle > 0 ? `(${item.pillsPerBottle} ${subUnitLabel} / ${containerLabel.toLowerCase().replace(/s$/, '')})` : 'sealed'}
                </span>
              </div>
            )}
          </div>

          {/* Sub-Unit Stock Counter */}
          <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl p-3 sm:p-3.5 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1 truncate">
              {subUnitLabel}
            </span>

            {role === 'ADMIN' ? (
              <div className="flex items-center justify-between gap-1 mt-1">
                <button
                  onClick={decrementLoose}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:bg-rose-600 active:text-white text-slate-700 font-black text-lg border border-slate-300 flex items-center justify-center transition-all touch-manipulation shadow-2xs active:scale-95 cursor-pointer"
                  title={`Decrement ${subUnitLabel}`}
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>

                {editingLoose ? (
                  <input
                    type="number"
                    value={looseInput}
                    onChange={(e) => setLooseInput(e.target.value)}
                    onBlur={commitLooseInput}
                    onKeyDown={(e) => e.key === 'Enter' && commitLooseInput()}
                    autoFocus
                    className="w-14 text-center h-12 bg-white border-2 border-teal-600 rounded-xl text-lg font-black text-teal-700 font-mono focus:outline-hidden shadow-inner"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setLooseInput(item.looseUnitsAvailable.toString());
                      setEditingLoose(true);
                    }}
                    className="flex-1 min-h-[48px] text-center font-mono font-black text-2xl text-slate-900 hover:text-teal-700 transition-colors py-1 rounded-lg hover:bg-white/80 cursor-pointer"
                    title="Tap to type exact number"
                  >
                    {item.looseUnitsAvailable}
                  </button>
                )}

                <button
                  onClick={incrementLoose}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:bg-emerald-600 active:text-white text-slate-700 font-black text-lg border border-slate-300 flex items-center justify-center transition-all touch-manipulation shadow-2xs active:scale-95 cursor-pointer"
                  title={`Increment ${subUnitLabel}`}
                >
                  <Plus className="w-5 h-5 text-emerald-600 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 mt-1 select-text">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {item.looseUnitsAvailable}
                </span>
                <span className="text-xs text-slate-500 font-extrabold lowercase truncate">{subUnitLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Section: Lot Numbers & Admin Edit Dialog */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 select-text">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
              <span>Lots:</span>
            </span>
            {lotList.length > 0 ? (
              lotList.map((lot: string, idx: number) => (
                <span
                  key={idx}
                  className="font-mono text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs"
                >
                  {lot}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic font-medium">No Lots attached</span>
            )}
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={() => onEditItem(item)}
              className="w-full mt-1 min-h-[48px] bg-slate-100 hover:bg-amber-50 hover:border-amber-400 text-slate-800 hover:text-amber-900 font-black text-xs sm:text-sm rounded-2xl border border-slate-300 flex items-center justify-center gap-2 transition-all touch-manipulation shadow-2xs active:scale-[0.98] animate-fadeIn cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
              <span>Edit Medication Details & Lot History</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
