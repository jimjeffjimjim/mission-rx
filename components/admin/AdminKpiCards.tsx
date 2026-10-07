'use client';

import React from 'react';

export interface AdminKpiCardsProps {
  totalMedications: number;
  equipmentTotalCount: number;
  lowStockCount: number;
  expiringCount: number;
  totalBottles: number;
  activeTab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS';
  setActiveTab: (tab: 'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS') => void;
  adminStatusFilter: 'ALL' | 'LOW_STOCK' | 'EXPIRING';
  setAdminStatusFilter: (filter: 'ALL' | 'LOW_STOCK' | 'EXPIRING') => void;
}

export default function AdminKpiCards({
  totalMedications,
  equipmentTotalCount,
  lowStockCount,
  expiringCount,
  totalBottles,
  activeTab,
  setActiveTab,
  adminStatusFilter,
  setAdminStatusFilter,
}: AdminKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
        <span className="text-[11px] font-black uppercase text-slate-600 block">
          Medications
        </span>
        <span className="font-mono text-2xl font-black text-slate-900">
          {totalMedications}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setActiveTab('EQUIPMENT')}
        className={`text-left transition-all rounded-2xl p-3.5 border shadow-xs cursor-pointer ${
          activeTab === 'EQUIPMENT'
            ? 'bg-teal-700 border-teal-800 text-white shadow-md shadow-teal-700/30 scale-[1.02]'
            : 'bg-white/90 backdrop-blur-md border-amber-400/40 hover:bg-white'
        }`}
      >
        <span
          className={`text-[11px] font-black uppercase block ${
            activeTab === 'EQUIPMENT' ? 'text-teal-100' : 'text-teal-900'
          }`}
        >
          Equipment & Supplies
        </span>
        <span
          className={`font-mono text-2xl font-black ${
            activeTab === 'EQUIPMENT' ? 'text-white' : 'text-teal-900'
          }`}
        >
          {equipmentTotalCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveTab('TABLE');
          setAdminStatusFilter(
            adminStatusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK'
          );
        }}
        className={`text-left transition-all rounded-2xl p-3.5 border shadow-xs cursor-pointer ${
          adminStatusFilter === 'LOW_STOCK'
            ? 'bg-rose-600 border-rose-700 text-white shadow-md shadow-rose-500/30 scale-[1.02]'
            : 'bg-white/90 backdrop-blur-md border-amber-400/40 hover:bg-white'
        }`}
      >
        <span
          className={`text-[11px] font-black uppercase block ${
            adminStatusFilter === 'LOW_STOCK'
              ? 'text-rose-100'
              : 'text-rose-700'
          }`}
        >
          Low Stock Alerts
        </span>
        <span
          className={`font-mono text-2xl font-black ${
            adminStatusFilter === 'LOW_STOCK' ? 'text-white' : 'text-rose-700'
          }`}
        >
          {lowStockCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveTab('TABLE');
          setAdminStatusFilter(
            adminStatusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING'
          );
        }}
        className={`text-left transition-all rounded-2xl p-3.5 border shadow-xs cursor-pointer ${
          adminStatusFilter === 'EXPIRING'
            ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md shadow-amber-500/30 scale-[1.02]'
            : 'bg-white/90 backdrop-blur-md border-amber-400/40 hover:bg-white'
        }`}
      >
        <span
          className={`text-[11px] font-black uppercase block ${
            adminStatusFilter === 'EXPIRING'
              ? 'text-slate-900'
              : 'text-amber-900'
          }`}
        >
          Expiring (30d)
        </span>
        <span
          className={`font-mono text-2xl font-black ${
            adminStatusFilter === 'EXPIRING'
              ? 'text-slate-950'
              : 'text-amber-900'
          }`}
        >
          {expiringCount}
        </span>
      </button>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/40 shadow-xs select-text">
        <span className="text-[11px] font-black uppercase text-teal-800 block">
          Total Containers
        </span>
        <span className="font-mono text-2xl font-black text-teal-900">
          {totalBottles}
        </span>
      </div>
    </div>
  );
}
