'use client';

import React, { useState, useEffect } from 'react';
import { FilterCategory, StatusFilter } from '@/types/inventory';
import { getSpecialtyColor, getCustomSpecialties } from '@/lib/specialtyColors';
import { Search, AlertTriangle, Clock, X, ShieldAlert } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: FilterCategory;
  onCategoryChange: (cat: FilterCategory) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  itemCount: number;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  itemCount,
}: FilterBarProps) {
  const [categories, setCategories] = useState<{ label: string; value: FilterCategory }[]>([
    { label: 'All Specialties', value: 'ALL' },
  ]);

  useEffect(() => {
    const custom = getCustomSpecialties();
    const dynamicCats = [
      { label: 'All Specialties', value: 'ALL' as FilterCategory },
      ...custom.map((c) => ({ label: c.name, value: c.name as FilterCategory })),
    ];
    setCategories(dynamicCats);
  }, [selectedCategory]);

  return (
    <section className="bg-slate-100/95 border-b border-slate-200 px-4 py-3 space-y-3 sticky top-[69px] z-30 backdrop-blur-md transition-all shadow-xs select-none">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Search Bar & Status Alert Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Drug Name, Brand, Chemical Ingredient, or Strength..."
              className="w-full pl-11 pr-11 min-h-[48px] bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 shadow-2xs transition-all focus:outline-hidden select-text"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Quick Critical Alerts */}
          <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onStatusChange(selectedStatus === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
              className={`flex items-center gap-2 min-h-[48px] px-4 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 ${
                selectedStatus === 'LOW_STOCK'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/25 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-rose-200'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 stroke-[2.5] ${selectedStatus === 'LOW_STOCK' ? 'text-white animate-bounce' : 'text-rose-600'}`} />
              <span>Low Stock Alerts</span>
            </button>

            <button
              onClick={() => onStatusChange(selectedStatus === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
              className={`flex items-center gap-2 min-h-[48px] px-4 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 ${
                selectedStatus === 'EXPIRING'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-amber-200'
              }`}
            >
              <Clock className={`w-4 h-4 stroke-[2.5] ${selectedStatus === 'EXPIRING' ? 'text-slate-950 animate-spin' : 'text-amber-600'}`} />
              <span>Expiring Within 30d</span>
            </button>

            <button
              onClick={() => onStatusChange(selectedStatus === 'LASA_ALERT' ? 'ALL' : 'LASA_ALERT')}
              className={`flex items-center gap-2 min-h-[48px] px-4 rounded-2xl text-xs font-black transition-all border shrink-0 touch-manipulation shadow-2xs active:scale-95 ${
                selectedStatus === 'LASA_ALERT'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/25 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-amber-300'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 stroke-[2.5] ${selectedStatus === 'LASA_ALERT' ? 'text-white' : 'text-amber-600'}`} />
              <span>LASA Risk Drugs</span>
            </button>
          </div>
        </div>

        {/* Dynamic Color-Coded Category Navigation Pills */}
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-200/80">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0 hidden sm:inline">Categories:</span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              const style = getSpecialtyColor(cat.value === 'ALL' ? '' : cat.value);
              
              return (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap shrink-0 touch-manipulation border flex items-center justify-center active:scale-95 ${
                    isSelected ? style.tabSelected : style.tabUnselected
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="shrink-0 flex items-center gap-1.5 bg-white px-3.5 min-h-[44px] rounded-xl border border-slate-300 shadow-2xs text-xs font-bold text-slate-700">
            <span className="font-mono text-teal-700 font-black">{itemCount}</span>
            <span className="hidden sm:inline">{itemCount === 1 ? 'Formulation' : 'Formulations'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
