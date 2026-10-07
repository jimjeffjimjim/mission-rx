'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { parseLotNumbers, DiscardReportEntry } from '@/lib/stockMath';

export interface AdminDiscardReportTableProps {
  logs: DiscardReportEntry[];
  items: InventoryItem[];
  isReadOnlyMode: boolean;
  onViewDetailedLog: (modalData: any) => void;
  onOpenReportLogEdit: (log: any, isDiscard: boolean) => void;
  onDeleteReportLog: (log: any, label: string) => void;
}

export default function AdminDiscardReportTable({
  logs,
  items,
  isReadOnlyMode,
  onViewDetailedLog,
  onOpenReportLogEdit,
  onDeleteReportLog,
}: AdminDiscardReportTableProps) {
  if (logs.length === 0) {
    return (
      <div className="py-12 flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">
        No expired medication or supply discards logged for this timeframe.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto border border-slate-200 rounded-2xl">
      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-rose-50/70 text-rose-900 text-[10px] font-black uppercase tracking-wider border-b border-rose-200">
            <th className="py-3 px-3">Date Discarded</th>
            <th className="py-3 px-3">Medication</th>
            <th className="py-3 px-3 text-center">Action</th>
            <th className="py-3 px-3 text-center">Expired Lot #</th>
            <th className="py-3 px-3 text-center">Discarded Stock</th>
            <th className="py-3 px-3 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
          {logs.map((log) => {
            const dateObj = log.createdAt ? new Date(log.createdAt) : new Date();
            const formattedDate =
              dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }) +
              ' ' +
              dateObj.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

            const logName = (log.itemGenericName || '').toLowerCase();
            const corrItem = items.find(
              (i) =>
                Boolean(
                  (log.itemId && i.id === log.itemId) ||
                  (logName && i.genericName.toLowerCase() === logName) ||
                  (logName && logName.startsWith(i.genericName.toLowerCase()))
                )
            );

            const rawParsedLots = parseLotNumbers(log.lotNumbers);
            const lotList = rawParsedLots.length > 0 ? rawParsedLots : log.discardLotNumber ? [log.discardLotNumber] : [];

            return (
              <tr key={log.id} className="hover:bg-rose-50/30 transition-colors">
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                  {formattedDate}
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-extrabold select-text">
                  {log.itemGenericName || 'General Item'}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-300">
                    DISCARD
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center select-text">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {lotList.length > 0 ? (
                      lotList.map((lot, lIdx) => (
                        <span key={lIdx} className="font-mono text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1 py-0.5 rounded">
                          {lot}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">N/A</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-rose-600">
                  {log.effectiveBottlesDiscarded > 0 ? (
                    <span className="flex flex-col items-center">
                      <span>-{log.effectiveBottlesDiscarded} {corrItem?.stockUnit || 'bottle'}{log.effectiveBottlesDiscarded === 1 ? '' : 's'}</span>
                      <span className="text-[9px] font-bold text-rose-400">
                        (-{log.effectivePillsDiscarded} {corrItem?.subUnit || 'pills'})
                      </span>
                    </span>
                  ) : (
                    <span>-{log.effectivePillsDiscarded} {corrItem?.subUnit || 'units'}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const modalData = {
                          ...log,
                          actionType: 'DISCARD',
                          quantityChanged: -log.effectivePillsDiscarded,
                          isRestock: false,
                          lotNumbers: lotList,
                          brandName: corrItem?.brandName || 'N/A',
                          dosage: corrItem?.dosage || 'N/A',
                          shelfLocation: corrItem?.shelfLocation || 'N/A',
                          subUnit: corrItem?.subUnit || 'pills',
                        };
                        onViewDetailedLog(modalData);
                      }}
                      className="text-[11px] text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg font-black cursor-pointer shadow-2xs"
                    >
                      View Details
                    </button>
                    {!isReadOnlyMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenReportLogEdit(log, true)}
                          className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 transition-all cursor-pointer shadow-2xs"
                          title="Developer: Edit Discard Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReportLog(log, 'Expired / Discard')}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 transition-all cursor-pointer shadow-2xs"
                          title="Developer: Delete Discard Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
