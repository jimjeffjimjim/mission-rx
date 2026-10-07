'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  User,
  Edit3,
  PackageX,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { parseItemEditDiff } from '@/lib/stockMath';

export interface AdminDetailedLogModalProps {
  isOpen: boolean;
  logItem: any;
  onClose: () => void;
}

export default function AdminDetailedLogModal({
  isOpen,
  logItem,
  onClose,
}: AdminDetailedLogModalProps) {
  if (!isOpen || !logItem) return null;

  const dDate = logItem.createdAt ? new Date(logItem.createdAt) : new Date();
  const formattedFullDate =
    dDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) +
    ' • ' +
    dDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  const safeLots = Array.isArray(logItem.lotNumbers) ? logItem.lotNumbers : [];

  const actUpper = (logItem.actionType || '').toUpperCase();
  const detailsLower = (logItem.details || '').toLowerCase();
  const isAdministrative =
    actUpper === 'AUDIT' ||
    actUpper === 'EDIT' ||
    actUpper === 'CREATE' ||
    actUpper === 'DELETE';

  const isExplicitDiscard = actUpper === 'DISCARD' || actUpper === 'DISCARD_EXPIRED' || actUpper.includes('DISCARD');
  const isWasteOrExpired =
    (!isAdministrative) &&
    (detailsLower.includes('waste') ||
      detailsLower.includes('discard') ||
      detailsLower.includes('thrown away') ||
      detailsLower.includes('disposal') ||
      (detailsLower.includes('expired') && !detailsLower.includes('expiration date') && !detailsLower.includes('expiration:')));

  const isDiscard = isExplicitDiscard || isWasteOrExpired;
  const isEdit = actUpper === 'EDIT' || (detailsLower.includes(' -> ') && !isDiscard);
  const isUndispense = !isDiscard && (actUpper === 'UNDISPENSE' || (detailsLower.includes('undispensed') && !detailsLower.includes('restocked')));
  const isRestock = !isDiscard && (actUpper === 'RESTOCK' || detailsLower.includes('restocked'));
  const isAudit = actUpper === 'AUDIT';

  const transactionLabel = isEdit
    ? 'INVENTORY EDIT AUDIT RECORD'
    : isDiscard
    ? 'EXPIRED / WASTE DISCARD RECORD'
    : isUndispense
    ? 'UNDISPENSE TRANSACTION'
    : isRestock
    ? 'RESTOCK TRANSACTION'
    : isAudit
    ? 'PHYSICAL AUDIT ADJUSTMENT'
    : 'DISPENSE LOG TRANSACTION';

  const transactionBadgeStyle = isEdit
    ? 'bg-blue-50 text-blue-800 border-blue-300'
    : isDiscard
    ? 'bg-rose-50 text-rose-800 border-rose-300'
    : isUndispense
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : isRestock
    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
    : isAudit
    ? 'bg-amber-50 text-amber-900 border-amber-300'
    : 'bg-rose-50 text-rose-700 border-rose-300';

  const qtyLabel = isEdit
    ? 'Transaction Impact'
    : isDiscard
    ? 'Discarded Stock'
    : isUndispense
    ? 'Quantity Undispensed'
    : isRestock
    ? 'Quantity Restocked'
    : isAudit
    ? 'Audit Delta'
    : 'Quantity Distributed';

  const isPositive = isUndispense || isRestock;
  const qtyColor = isEdit
    ? 'text-blue-700'
    : isDiscard
    ? 'text-rose-600'
    : isUndispense
    ? 'text-amber-700'
    : isRestock
    ? 'text-emerald-600'
    : 'text-rose-600';

  const dateLabel = isEdit
    ? 'Updated At'
    : isDiscard
    ? 'Discarded At'
    : isUndispense
    ? 'Undispensed At'
    : isRestock
    ? 'Restocked At'
    : 'Dispensed At';

  const diffChanges = isEdit || (logItem.details && (logItem.details.includes(' -> ') || logItem.details.includes(' ➔ ') || logItem.details.includes(' --> '))) ? parseItemEditDiff(logItem.details) : [];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border shrink-0 shadow-xs ${isEdit ? 'bg-blue-50 text-blue-700 border-blue-200' : isDiscard ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
            {isEdit ? (
              <Edit3 className="w-7 h-7 stroke-[2.5]" />
            ) : isDiscard ? (
              <PackageX className="w-7 h-7 stroke-[2.5]" />
            ) : isUndispense ? (
              <RotateCcw className="w-7 h-7 stroke-[2.5]" />
            ) : isRestock ? (
              <ArrowUpRight className="w-7 h-7 stroke-[2.5]" />
            ) : (
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${transactionBadgeStyle}`}>
              {transactionLabel}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug truncate select-text">
              {logItem.itemGenericName || 'Formulation Record'}
            </h3>
            <p className="text-xs font-mono font-bold text-slate-400">ID: {logItem.id || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 text-xs font-bold text-slate-700 select-text">
          <div className="grid grid-cols-2 gap-3.5 border-b border-slate-200/80 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Brand Name</span>
              <span className="text-slate-900 font-extrabold">{logItem.brandName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Dosage Strength</span>
              <span className="text-slate-900 font-mono font-extrabold">{logItem.dosage || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 border-b border-slate-200/80 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Category Specialty</span>
              <span className="text-slate-900 font-extrabold">{logItem.shelfLocation || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                {qtyLabel}
              </span>
              {isEdit ? (
                <span className="font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                  Formulation Details Updated
                </span>
              ) : (
                <span className={`font-mono font-black text-sm ${qtyColor}`}>
                  {logItem.dispensedUnit === 'bottle' || (isDiscard && (logItem.dispensedBottles || 0) > 0) ? (
                    <>{isPositive ? '+' : '-'}{logItem.dispensedBottles || 1} bottle ({Math.abs(logItem.quantityChanged || 0)} {logItem.subUnit || 'pills'})</>
                  ) : (
                    <>{isPositive ? '+' : '-'}{Math.abs(logItem.quantityChanged || 0)} {logItem.subUnit || 'units'}</>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-slate-200/80 pb-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Lot Numbers Associated</span>
            <div className="flex flex-wrap gap-1">
              {safeLots.length > 0 ? (
                safeLots.map((lot: string, idx: number) => (
                  <span key={idx} className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                    {lot}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic font-semibold">No lot numbers registered</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pb-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{dateLabel}</span>
              <span className="text-slate-900 font-mono text-[11px] flex items-center gap-1.5 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formattedFullDate}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Supervised By Role</span>
              <span className="text-slate-900 flex items-center gap-1.5 pt-0.5 font-extrabold">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {logItem.userRole || 'STAFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Before -> After Diff Box for Edits */}
        {diffChanges.length > 0 && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-2.5 select-text">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-700" />
              <span className="text-[10px] uppercase font-black text-blue-900 tracking-wider">
                Before ➔ After Formulation Changes
              </span>
            </div>
            <div className="space-y-1.5">
              {diffChanges.map((change, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 text-xs font-semibold bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                  <span className="font-extrabold text-blue-950">{change.label}:</span>
                  <span className="font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 line-through text-[11px]">
                    {change.from}
                  </span>
                  <span className="text-blue-600 font-black">➔</span>
                  <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold text-[11px]">
                    {change.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-950/90 leading-relaxed select-text">
          <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider block mb-0.5">Compliance Log Details</span>
          {logItem.details || 'No additional notes provided for this transaction.'}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
