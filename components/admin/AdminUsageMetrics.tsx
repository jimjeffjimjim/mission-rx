'use client';

import React from 'react';
import {
  Calendar,
  RefreshCw,
  TrendingDown,
  Edit3,
} from 'lucide-react';
import { getSpecialtyColor } from '@/lib/specialtyColors';

export interface AdminUsageMetricsProps {
  timeframe: 'today' | 'week' | 'month' | 'all';
  setTimeframe: (tf: 'today' | 'week' | 'month' | 'all') => void;
  loadingAnalytics: boolean;
  fetchAnalytics: (tf: 'today' | 'week' | 'month' | 'all') => void;
  displayTopDispensed: Array<{ genericName: string; totalDispensed: number; category: string }>;
  maxDispensed: number;
  isTestingMode: boolean;
  isDeveloper: boolean;
  requireDeveloper: () => boolean;
  onEditDispenseItem: (item: { genericName: string; totalDispensed: number; category: string }) => void;
}

export default function AdminUsageMetrics({
  timeframe,
  setTimeframe,
  loadingAnalytics,
  fetchAnalytics,
  displayTopDispensed,
  maxDispensed,
  isTestingMode,
  isDeveloper,
  requireDeveloper,
  onEditDispenseItem,
}: AdminUsageMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Timeframe Filter Navigation */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600 stroke-[2.5]" />
          <span className="text-sm font-black text-slate-900">Filter Dispense Timeframe:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {(['today', 'week', 'month', 'all'] as const).map((tf) => {
            const labels = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' };
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-black transition-all border shrink-0 touch-manipulation cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {labels[tf]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => fetchAnalytics(timeframe)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Dispensed Medications Chart Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <TrendingDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Top Dispensed Medications</h3>
              <p className="text-xs text-slate-500 font-bold">Ranked by total quantity distributed to patients</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {displayTopDispensed.length} Formulations
          </span>
        </div>

        {loadingAnalytics ? (
          <div className="py-12 flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
            <span className="text-xs font-bold uppercase">Aggregating records...</span>
          </div>
        ) : displayTopDispensed.length === 0 ? (
          <div className="py-12 flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">
            No dispense transactions recorded for this timeframe yet.
          </div>
        ) : (
          <div className="space-y-3.5 pt-2 flex-1">
            {displayTopDispensed.map((item, idx) => {
              const style = getSpecialtyColor(item.category);
              const percentage = Math.min(100, Math.round((item.totalDispensed / maxDispensed) * 100));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-900 font-extrabold select-text">{item.genericName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-600 font-black">
                        {item.totalDispensed} units dispensed
                      </span>
                      {(isTestingMode || isDeveloper) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDeveloper && !isTestingMode) {
                              if (!requireDeveloper()) return;
                            }
                            onEditDispenseItem(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 transition-all border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
                          title="Developer: Edit total amount dispensed"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
