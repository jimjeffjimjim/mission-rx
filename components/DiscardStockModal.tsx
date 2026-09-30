'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, LotEntry } from '@/types/inventory';
import { 
  X, 
  Trash2, 
  PackageX, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  Layers, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { calculateTotalUnits, extractStructuredLots, parseLotNumbers } from '@/lib/stockMath';

interface DiscardStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onDiscard: (options: {
    itemId: string;
    lotNumber?: string;
    bottlesToDiscard: number;
    looseUnitsToDiscard: number;
    discardAll: boolean;
    reason?: string;
  }) => Promise<void> | void;
}

export default function DiscardStockModal({
  isOpen,
  onClose,
  item,
  onDiscard,
}: DiscardStockModalProps) {
  const [selectedLotNumber, setSelectedLotNumber] = useState<string>('');
  const [bottlesToDiscard, setBottlesToDiscard] = useState<number>(0);
  const [looseUnitsToDiscard, setLooseUnitsToDiscard] = useState<number>(0);
  const [discardReason, setDiscardReason] = useState<string>('Expired Medication');
  const [customReason, setCustomReason] = useState<string>('');
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);
  const [mode, setMode] = useState<'SPECIFIC_LOT' | 'ALL_STOCK'>('SPECIFIC_LOT');

  const structuredLots = useMemo(() => {
    if (!item) return [];
    return extractStructuredLots(item);
  }, [item]);

  const hasMultipleLots = structuredLots.length > 1;

  const packSize = Math.max(1, item?.pillsPerBottle || 1);
  const totalAvailableUnits = item
    ? calculateTotalUnits(item.bottlesAvailable || 0, packSize, item.looseUnitsAvailable || 0)
    : 0;

  // Initialize defaults whenever modal opens for an item
  useEffect(() => {
    if (isOpen && item) {
      const lots = extractStructuredLots(item);
      if (lots.length > 0) {
        // Find if there is an expired lot to prioritize
        const todayIso = new Date().toISOString().split('T')[0];
        const expiredLot = lots.find((l) => l.expirationDate && l.expirationDate < todayIso);
        const defaultLot = expiredLot || lots[0];

        setSelectedLotNumber(defaultLot.lotNumber);
        setBottlesToDiscard(defaultLot.bottles || (lots.length === 1 ? item.bottlesAvailable : 1));
        setLooseUnitsToDiscard(defaultLot.looseUnits || 0);
        setMode('SPECIFIC_LOT');
      } else {
        setSelectedLotNumber('');
        setBottlesToDiscard(item.bottlesAvailable || 0);
        setLooseUnitsToDiscard(item.looseUnitsAvailable || 0);
        setMode('ALL_STOCK');
      }
      setDiscardReason('Expired Medication');
      setCustomReason('');
    }
  }, [isOpen, item]);

  // When selected lot changes, sync default quantities
  const handleSelectLot = (lotNum: string) => {
    setSelectedLotNumber(lotNum);
    const lot = structuredLots.find((l) => l.lotNumber.toLowerCase().trim() === lotNum.toLowerCase().trim());
    if (lot) {
      setBottlesToDiscard(lot.bottles || 0);
      setLooseUnitsToDiscard(lot.looseUnits || 0);
      setMode('SPECIFIC_LOT');
    }
  };

  if (!isOpen || !item) return null;

  const selectedLot = structuredLots.find(
    (l) => l.lotNumber.toLowerCase().trim() === selectedLotNumber.toLowerCase().trim()
  );

  const calculatedDiscardUnits = mode === 'ALL_STOCK'
    ? totalAvailableUnits
    : calculateTotalUnits(bottlesToDiscard, packSize, looseUnitsToDiscard);

  const finalReason = discardReason === 'Other'
    ? (customReason.trim() || 'Clinical Waste Discard')
    : discardReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDiscarding) return;

    if (calculatedDiscardUnits <= 0 && mode !== 'ALL_STOCK') {
      alert('Please specify a positive quantity of bottles or units to discard.');
      return;
    }

    if (mode === 'SPECIFIC_LOT' && !selectedLotNumber && hasMultipleLots) {
      alert('Please select which lot number to discard.');
      return;
    }

    setIsDiscarding(true);
    try {
      await onDiscard({
        itemId: item.id,
        lotNumber: mode === 'SPECIFIC_LOT' ? selectedLotNumber : undefined,
        bottlesToDiscard: mode === 'ALL_STOCK' ? (item.bottlesAvailable || 0) : bottlesToDiscard,
        looseUnitsToDiscard: mode === 'ALL_STOCK' ? (item.looseUnitsAvailable || 0) : looseUnitsToDiscard,
        discardAll: mode === 'ALL_STOCK',
        reason: `[EXPIRED / WASTE]: ${finalReason}`,
      });
      onClose();
    } catch (err: any) {
      console.error('Discard execution error:', err);
      alert(`Failed to execute discard: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDiscarding(false);
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-x-hidden">
      <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 text-slate-900 relative my-auto max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isDiscarding}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 shrink-0 shadow-inner">
            <PackageX className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              Discard Expired Medication / Bottle
            </h3>
            <p className="text-xs font-semibold text-slate-600 leading-normal">
              Safely record waste and discard specific expired bottles without wiping unaffected stock.
            </p>
          </div>
        </div>

        {/* Medication Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-sm text-slate-900">{item.genericName}</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 mt-0.5">
              <span>{item.dosage}</span>
              {item.brandName && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-bold">{item.brandName}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right self-end sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total On-Hand</span>
            <span className="font-mono text-sm font-black text-teal-800">
              {item.bottlesAvailable || 0} {item.stockUnit || 'bottles'} ({totalAvailableUnits} {item.subUnit || 'pills'})
            </span>
          </div>
        </div>

        {/* If Multiple Lots Exist: Lot Breakdown Table */}
        {hasMultipleLots && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                <span>Multiple Lots Detected — Select Lot to Discard:</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">{structuredLots.length} active lots</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {structuredLots.map((lot, idx) => {
                const isSelected = mode === 'SPECIFIC_LOT' && selectedLotNumber.toLowerCase().trim() === lot.lotNumber.toLowerCase().trim();
                const isExpired = lot.expirationDate && lot.expirationDate < todayIso;

                return (
                  <div
                    key={lot.id || idx}
                    onClick={() => handleSelectLot(lot.lotNumber)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          Lot {lot.lotNumber}
                        </span>
                        {lot.expirationDate && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{isExpired ? 'EXPIRED: ' : 'Exp: '}{lot.expirationDate}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-500">
                        Contains: {lot.bottles || 0} {item.stockUnit || 'bottle'}{(lot.bottles || 0) !== 1 ? 's' : ''}
                        {(lot.looseUnits || 0) > 0 ? ` + ${lot.looseUnits} loose` : ''} ({calculateTotalUnits(lot.bottles || 0, packSize, lot.looseUnits || 0)} {item.subUnit || 'pills'})
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLot(lot.lotNumber);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold text-[11px] border border-slate-200 hover:border-rose-300 transition-colors"
                        >
                          Select Lot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discard Mode Toggle: Specific Lot vs All Stock */}
        {hasMultipleLots && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMode('SPECIFIC_LOT')}
              className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SPECIFIC_LOT'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <PackageX className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Discard Specific Lot/Bottle</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('ALL_STOCK')}
              className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'ALL_STOCK'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Discard ALL Stock (0)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SPECIFIC_LOT' ? (
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Quantity of {selectedLot ? `Lot ${selectedLot.lotNumber}` : 'Expired Stock'} to Discard:
                </span>
                {selectedLot && (
                  <button
                    type="button"
                    onClick={() => {
                      setBottlesToDiscard(selectedLot.bottles || 0);
                      setLooseUnitsToDiscard(selectedLot.looseUnits || 0);
                    }}
                    className="text-[11px] font-black text-teal-700 hover:underline cursor-pointer"
                  >
                    Select All in this Lot ({selectedLot.bottles || 0} btl)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                    {item.stockUnit || 'Bottles'} to Discard
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={item.bottlesAvailable || 0}
                    value={bottlesToDiscard}
                    onChange={(e) => setBottlesToDiscard(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full min-h-[44px] px-3 bg-white border border-slate-300 focus:border-rose-500 rounded-xl text-center font-mono text-base font-black text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                    Loose {item.subUnit || 'Pills'} to Discard
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={packSize}
                    value={looseUnitsToDiscard}
                    onChange={(e) => setLooseUnitsToDiscard(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full min-h-[44px] px-3 bg-white border border-slate-300 focus:border-rose-500 rounded-xl text-center font-mono text-base font-black text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-600 border-t border-slate-200/80">
                <span>Calculated Volume to Dump:</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {calculatedDiscardUnits} {item.subUnit || 'pills'} ({bottlesToDiscard} {item.stockUnit || 'bottles'})
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                <span>Full Card Discard (Dump Entire Inventory)</span>
              </div>
              <p className="text-xs font-medium text-rose-800 leading-relaxed">
                This will throw away all <strong>{totalAvailableUnits} {item.subUnit || 'units'}</strong> ({item.bottlesAvailable || 0} {item.stockUnit || 'bottles'}).
                Lot numbers and expiration date will be cleared, while keeping the medication card preserved in inventory at 0 stock.
              </p>
            </div>
          )}

          {/* Reason Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Disposal Reason / Regulatory Note:
            </label>
            <select
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
              className="w-full min-h-[42px] px-3 bg-white border border-slate-300 focus:border-rose-500 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden"
            >
              <option value="Expired Medication">Expired Medication (Passed Exp Date)</option>
              <option value="Damaged Container / Broken Seal">Damaged Container / Broken Seal</option>
              <option value="Contaminated or Degraded Formulation">Contaminated or Degraded Formulation</option>
              <option value="Manufacturer Drug Recall">Manufacturer Drug Recall</option>
              <option value="Routine Clinical Disposal">Routine Clinical Disposal</option>
              <option value="Other">Other (Enter custom reason below)...</option>
            </select>

            {discardReason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify clinical disposal reason..."
                className="w-full min-h-[40px] px-3 bg-white border border-slate-300 focus:border-rose-500 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden mt-1"
                autoFocus
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isDiscarding}
              className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isDiscarding || (mode === 'SPECIFIC_LOT' && calculatedDiscardUnits <= 0)}
              className="min-h-[44px] px-5 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <PackageX className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isDiscarding
                  ? 'Recording Discard...'
                  : mode === 'ALL_STOCK'
                  ? `Confirm Waste (${totalAvailableUnits} ${item.subUnit || 'pills'})`
                  : `Confirm Waste (${calculatedDiscardUnits} ${item.subUnit || 'pills'})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
