'use client';

import React from 'react';
import { Table, Stethoscope, BarChart3, Database } from 'lucide-react';

export interface AdminTabNavigationProps {
  activeTab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS';
  setActiveTab: (tab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS') => void;
  equipmentTotalCount: number;
}

export default function AdminTabNavigation({
  activeTab,
  setActiveTab,
  equipmentTotalCount,
}: AdminTabNavigationProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
      <button
        type="button"
        onClick={() => setActiveTab('TABLE')}
        className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border cursor-pointer ${
          activeTab === 'TABLE'
            ? 'bg-slate-900 text-white border-slate-950 shadow-md scale-[1.02]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Table className="w-4 h-4 stroke-[2.5]" />
        <span>Medications & Formulations</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('EQUIPMENT')}
        className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border cursor-pointer ${
          activeTab === 'EQUIPMENT'
            ? 'bg-teal-700 text-white border-teal-800 shadow-md shadow-teal-700/20 scale-[1.02]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Stethoscope className="w-4 h-4 stroke-[2.5]" />
        <span>Medical Equipment & Supplies</span>
        <span
          className={`ml-1 px-2 py-0.5 text-[10px] rounded-full font-mono font-black ${
            activeTab === 'EQUIPMENT'
              ? 'bg-teal-800 text-teal-100'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}
        >
          {equipmentTotalCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('USAGE')}
        className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border cursor-pointer ${
          activeTab === 'USAGE'
            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <BarChart3 className="w-4 h-4 stroke-[2.5]" />
        <span>Usage Reports & Dispense Analytics</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('BACKUPS')}
        className={`min-h-[48px] px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all touch-manipulation border cursor-pointer ${
          activeTab === 'BACKUPS'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Database className="w-4 h-4 stroke-[2.5]" />
        <span>Weekly Backups & Recovery</span>
      </button>
    </div>
  );
}
