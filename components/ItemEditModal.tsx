'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Tag, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  Check,
  Globe
} from 'lucide-react';
import { searchMedicalKnowledge, searchFdaKnowledge, MedicalDrugEntry, MEDICAL_DICTIONARY } from '@/lib/medicalKnowledge';
import { getCustomSpecialties } from '@/lib/specialtyColors';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (itemData: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  isAutofillEnabled?: boolean;
}

export default function ItemEditModal({ isOpen, onClose, item, onSave, onDelete, isAutofillEnabled = true }: ItemEditModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    genericName: '',
    brandName: '',
    chemicalName: '',
    dosage: '',
    shelfLocation: 'General Medical',
    stockUnit: 'Bottles',
    subUnit: 'tablets',
    bottlesAvailable: 0,
    looseUnitsAvailable: 0,
    pillsPerBottle: 100,
    expirationDate: '',
    lotNumbers: [] as string[],
    directions: '',
  });

  const [newLotInput, setNewLotInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Smart Auto-fill & Quizlet State
  const [autofillEnabled, setAutofillEnabled] = useState(isAutofillEnabled);
  const [suggestions, setSuggestions] = useState<MedicalDrugEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDropdownField, setActiveDropdownField] = useState<'generic' | 'brand' | null>(null);
  const [autofilledNotice, setAutofilledNotice] = useState(false);
  const [showFormularyBrowser, setShowFormularyBrowser] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [formularySearchQuery, setFormularySearchQuery] = useState('');
  const [dosageOptionsList, setDosageOptionsList] = useState<string[]>([]);
  const [isCustomDosageSelected, setIsCustomDosageSelected] = useState(false);
  const [isSearchingFda, setIsSearchingFda] = useState(false);

  // Dynamic specialties
  const [specialtyList, setSpecialtyList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setAutofillEnabled(isAutofillEnabled);
  }, [isAutofillEnabled]);

  useEffect(() => {
    setSpecialtyList(getCustomSpecialties());
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      let parsedLots: string[] = [];
      if (Array.isArray(item.lotNumbers)) {
        parsedLots = item.lotNumbers;
      } else if (typeof item.lotNumbers === 'string') {
        try {
          if (item.lotNumbers.startsWith('[')) {
            parsedLots = JSON.parse(item.lotNumbers);
          } else {
            parsedLots = item.lotNumbers.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } catch (e) {
          parsedLots = [item.lotNumbers];
        }
      }

      setFormData({
        id: item.id,
        genericName: item.genericName || '',
        brandName: item.brandName || '',
        chemicalName: item.chemicalName || '',
        dosage: item.dosage || '',
        shelfLocation: item.shelfLocation || 'General Medical',
        stockUnit: item.stockUnit || 'Bottles',
        subUnit: item.subUnit || 'tablets',
        bottlesAvailable: item.bottlesAvailable || 0,
        looseUnitsAvailable: item.looseUnitsAvailable || 0,
        pillsPerBottle: item.pillsPerBottle || 100,
        expirationDate: item.expirationDate || '',
        lotNumbers: parsedLots,
        directions: item.directions || '',
      });

      // Check if item has known dosage options
      const match = searchMedicalKnowledge(item.genericName || '')[0] || searchMedicalKnowledge(item.brandName || '')[0];
      if (match && match.dosageOptions && match.dosageOptions.length > 0) {
        setDosageOptionsList(match.dosageOptions);
      } else {
        setDosageOptionsList([]);
      }
      setIsCustomDosageSelected(false);
    } else {
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 2);
      setFormData({
        genericName: '',
        brandName: '',
        chemicalName: '',
        dosage: '',
        shelfLocation: 'General Medical',
        stockUnit: 'Bottles',
        subUnit: 'tablets',
        bottlesAvailable: 1,
        looseUnitsAvailable: 0,
        pillsPerBottle: 100,
        expirationDate: defaultExp.toISOString().split('T')[0],
        lotNumbers: ['LOT-1001'],
        directions: '',
      });
      setDosageOptionsList([]);
      setIsCustomDosageSelected(false);
    }
    setErrorMsg('');
    setNewLotInput('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveDropdownField(null);
    setAutofilledNotice(false);
    setShowFormularyBrowser(false);
    setSelectedCategoryFilter('All');
    setFormularySearchQuery('');
    setIsSearchingFda(false);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof InventoryItem, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Instant Autocomplete Dropdown List (Exclusively for adding new medication)
      if (!item && autofillEnabled && (field === 'genericName' || field === 'brandName') && typeof value === 'string') {
        const queryText = value.trim();
        if (queryText.length >= 1) {
          const localMatches = searchMedicalKnowledge(queryText);
          setSuggestions(localMatches);
          setShowDropdown(true);
          setActiveDropdownField(field === 'genericName' ? 'generic' : 'brand');

          if (localMatches.length > 0 && localMatches[0].dosageOptions) {
            setDosageOptionsList(localMatches[0].dosageOptions);
          }

          // Trigger live openFDA API lookup for broader coverage
          if (queryText.length >= 2) {
            setIsSearchingFda(true);
            searchFdaKnowledge(queryText).then((fdaResults) => {
              setIsSearchingFda(false);
              if (fdaResults.length > 0) {
                setSuggestions((current) => {
                  const existingNames = new Set(current.map(c => c.genericName.toLowerCase()));
                  const newFdaEntries = fdaResults.filter(f => !existingNames.has(f.genericName.toLowerCase()));
                  const merged = [...current, ...newFdaEntries];
                  if (merged.length > 0 && merged[0].dosageOptions) {
                    setDosageOptionsList(merged[0].dosageOptions);
                  }
                  return merged;
                });
              }
            }).catch(() => setIsSearchingFda(false));
          }
        } else {
          setSuggestions([]);
          setShowDropdown(false);
          setActiveDropdownField(null);
          setIsSearchingFda(false);
        }
      }

      return updated;
    });
  };

  const applyMedicalEntry = (entry: MedicalDrugEntry) => {
    const opts = entry.dosageOptions && entry.dosageOptions.length > 0
      ? entry.dosageOptions
      : [entry.defaultDosage];

    setDosageOptionsList(opts);
    setIsCustomDosageSelected(false);

    setFormData((prev) => ({
      ...prev,
      genericName: entry.genericName,
      brandName: entry.brandName,
      chemicalName: entry.chemicalName,
      shelfLocation: entry.category,
      dosage: opts[0],
      stockUnit: entry.defaultUnit,
      subUnit: entry.defaultSubUnit,
      directions: prev.directions || `${entry.typicalDirections} [Contraindications: ${entry.contraindications}]`,
    }));
    setShowDropdown(false);
    setActiveDropdownField(null);
    setAutofilledNotice(true);
    setTimeout(() => setAutofilledNotice(false), 4000);
  };

  const handleToggleAutofill = () => {
    const nextState = !autofillEnabled;
    setAutofillEnabled(nextState);
    if (!nextState) {
      setShowDropdown(false);
      setActiveDropdownField(null);
    }
  };

  const handleAddLot = () => {
    if (!newLotInput.trim()) return;
    const currentLots = (formData.lotNumbers as string[]) || [];
    if (!currentLots.includes(newLotInput.trim())) {
      handleChange('lotNumbers', [...currentLots, newLotInput.trim()]);
    }
    setNewLotInput('');
  };

  const handleRemoveLot = (indexToRemove: number) => {
    const currentLots = (formData.lotNumbers as string[]) || [];
    handleChange(
      'lotNumbers',
      currentLots.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.genericName || !formData.dosage || !formData.expirationDate) {
      setErrorMsg('Generic Name, Dosage, and Expiration Date are strictly required.');
      return;
    }

    const cleanedData = {
      ...formData,
      bottlesAvailable: Number(formData.bottlesAvailable) || 0,
      looseUnitsAvailable: Number(formData.looseUnitsAvailable) || 0,
      pillsPerBottle: Number(formData.pillsPerBottle) || 0,
      lotNumbers: JSON.stringify(formData.lotNumbers || []),
      isFullEdit: true,
    };

    onSave(cleanedData);
    onClose();
  };

  const currentLots = (formData.lotNumbers as string[]) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 touch-none max-w-full overflow-x-hidden">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto overscroll-contain touch-pan-y max-w-full overflow-x-hidden">
        {/* Top Header Bar with Auto-Fill & Quizlet Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-5 gap-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                {item ? 'Edit Medication Record' : 'Add New Clinical Medication'}
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Pharmaceutical Formulary Entry & Safety Verify
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {!item && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormularyBrowser(!showFormularyBrowser);
                  }}
                  className={`min-h-[40px] px-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border active:scale-95 shadow-2xs ${
                    showFormularyBrowser
                      ? 'bg-teal-600 text-white border-teal-700 shadow-md'
                      : 'bg-teal-50 text-teal-950 border-teal-300 hover:bg-teal-100'
                  }`}
                  title="Browse full 100+ drug clinical database"
                >
                  <Sparkles className="w-4 h-4 text-teal-600 stroke-[2.5]" />
                  <span>Browse 100+ Drugs</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAutofill}
                  className={`min-h-[40px] px-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border active:scale-95 shadow-2xs ${
                    autofillEnabled
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                  title={autofillEnabled ? 'Click to disable Smart Medical Auto-Fill' : 'Click to enable Smart Medical Auto-Fill'}
                >
                  {autofillEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                      <span>Autofill: ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                      <span>Autofill: OFF</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Quick-Select Medical Formulary Database Browser */}
        {!item && showFormularyBrowser && (
          <div className="mb-6 p-4.5 bg-teal-50/95 border-2 border-teal-500/50 rounded-3xl shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-200/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-600 rounded-xl text-white shadow-xs">
                  <Sparkles className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-teal-950">
                    Clinical Medication Formulary Explorer
                  </h4>
                  <p className="text-xs text-teal-800 font-bold">
                    Click any medication below to instantly auto-fill all generic/brand names, chemical class, dosage strengths & clinical warnings.
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search 100+ drugs..."
                value={formularySearchQuery}
                onChange={(e) => setFormularySearchQuery(e.target.value)}
                className="min-h-[42px] px-3.5 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden sm:w-64 shadow-2xs"
              />
            </div>

            {/* Category Pill Filters */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {['All', 'Infectious Disease', 'Cardiology', 'Psychiatry', 'Endocrinology', 'Pulmonology', 'Dermatology', 'Over the Counter', 'Gastroenterology', 'Neurology', 'Rheumatology'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-teal-900 border border-teal-200 shadow-2xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Drug Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {(formularySearchQuery.trim() 
                ? searchMedicalKnowledge(formularySearchQuery) 
                : MEDICAL_DICTIONARY.filter(d => selectedCategoryFilter === 'All' || d.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()))
              ).slice(0, 30).map((entry, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    applyMedicalEntry(entry);
                    setShowFormularyBrowser(false);
                  }}
                  className="p-3.5 bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-white border border-teal-200/80 hover:border-teal-500 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-black text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                        {entry.genericName}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 shrink-0">
                        {entry.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-extrabold mt-0.5">
                      {entry.brandName ? `Brand: ${entry.brandName}` : 'Generic Formula'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      {entry.defaultDosage}
                    </span>
                    <span className="font-black text-teal-700 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      Auto-fill ✨
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {autofilledNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            <span>Formulation details, dosage strength, unit of measure, and directions populated!</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Core Drug Identification */}
          <div className="space-y-3 relative">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              1. Pharmaceutical Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative">
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Generic Drug Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril, Sertraline, Amoxicillin"
                  value={formData.genericName || ''}
                  onChange={(e) => handleChange('genericName', e.target.value)}
                  onFocus={() => {
                    if (!item && autofillEnabled && formData.genericName && formData.genericName.length >= 1) {
                      const matches = searchMedicalKnowledge(formData.genericName);
                      setSuggestions(matches);
                      setShowDropdown(matches.length > 0);
                      setActiveDropdownField('generic');
                    }
                  }}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />

                {/* Instant Autocomplete Suggestions Dropdown Box */}
                {!item && autofillEnabled && showDropdown && activeDropdownField === 'generic' && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-teal-500 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-slate-100 ring-4 ring-teal-500/10">
                    <div className="p-2.5 bg-teal-900 text-white text-[11px] font-black flex items-center justify-between px-3.5 sticky top-0 z-10 shadow-xs">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-300 fill-current" />
                        <span>FORMULARY & FDA LOOKUP ({suggestions.length} FOUND)</span>
                        {isSearchingFda && (
                          <span className="text-[10px] text-amber-300 font-bold animate-pulse flex items-center gap-1 ml-1">
                            <Globe className="w-3 h-3 animate-spin" /> Live FDA Search...
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-teal-200 uppercase tracking-wide font-extrabold">Click to fill</span>
                    </div>
                    {suggestions.map((entry, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyMedicalEntry(entry)}
                        className="w-full p-3 text-left hover:bg-teal-50 transition-all flex items-start justify-between gap-2.5 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm group-hover:text-teal-900">
                              {entry.genericName}
                            </span>
                            <span className="text-[10px] font-black uppercase bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
                              {entry.category}
                            </span>
                            {entry.brandName.includes('(FDA)') && (
                              <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-0.5">
                                <Globe className="w-3 h-3 text-amber-700" /> FDA DB
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-extrabold">
                            {entry.brandName ? `Brand: ${entry.brandName}` : 'Generic Form'} • <span className="text-teal-700 font-mono font-black">{entry.defaultDosage}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium truncate">
                            Class: {entry.chemicalName}
                          </div>
                        </div>
                        <span className="text-[11px] font-black uppercase bg-teal-100 group-hover:bg-teal-600 group-hover:text-white text-teal-900 px-2.5 py-1 rounded-xl transition-colors shrink-0 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>Autofill</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Brand / Commercial Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lipitor, Zoloft, Benadryl"
                  value={formData.brandName || ''}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  onFocus={() => {
                    if (!item && autofillEnabled && formData.brandName && formData.brandName.length >= 1) {
                      const matches = searchMedicalKnowledge(formData.brandName);
                      setSuggestions(matches);
                      setShowDropdown(matches.length > 0);
                      setActiveDropdownField('brand');
                    }
                  }}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />

                {!item && autofillEnabled && showDropdown && activeDropdownField === 'brand' && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-teal-500 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-slate-100 ring-4 ring-teal-500/10">
                    <div className="p-2.5 bg-teal-900 text-white text-[11px] font-black flex items-center justify-between px-3.5 sticky top-0 z-10 shadow-xs">
                      <span>✨ BRAND & COMMERCIAL MATCHES ({suggestions.length} FOUND)</span>
                      <span className="text-[10px] text-teal-200 uppercase tracking-wide font-extrabold">Click to fill all fields</span>
                    </div>
                    {suggestions.map((entry, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyMedicalEntry(entry)}
                        className="w-full p-3 text-left hover:bg-teal-50 transition-all flex items-start justify-between gap-2.5 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm group-hover:text-teal-900">
                              {entry.brandName || entry.genericName}
                            </span>
                            <span className="text-[10px] font-black uppercase bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
                              {entry.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-extrabold">
                            Generic: {entry.genericName} • <span className="text-teal-700 font-mono font-black">{entry.defaultDosage}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium truncate">
                            Class: {entry.chemicalName}
                          </div>
                        </div>
                        <span className="text-[11px] font-black uppercase bg-teal-100 group-hover:bg-teal-600 group-hover:text-white text-teal-900 px-2.5 py-1 rounded-xl transition-colors shrink-0 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>Autofill</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Active Chemical / Compound
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACE Inhibitor, SSRI, Corticosteroid"
                  value={formData.chemicalName || ''}
                  onChange={(e) => handleChange('chemicalName', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Strength & Dosage Form *</span>
                  {dosageOptionsList.length > 0 ? (
                    <span className="text-[10px] text-teal-800 font-black bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                      ✨ {dosageOptionsList.length} Dosage Varieties Found
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-700 font-bold">Preset suggestions below</span>
                  )}
                </label>

                {/* Dosage Strength Varieties Selector Dropdown */}
                {dosageOptionsList.length > 0 && (
                  <div className="mb-2">
                    <select
                      value={isCustomDosageSelected ? 'CUSTOM' : (formData.dosage || dosageOptionsList[0])}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setIsCustomDosageSelected(true);
                          handleChange('dosage', '');
                        } else {
                          setIsCustomDosageSelected(false);
                          handleChange('dosage', val);
                        }
                      }}
                      className="w-full min-h-[46px] px-3 bg-teal-50 border border-teal-300 focus:border-teal-600 rounded-xl text-xs font-black text-teal-950 shadow-2xs cursor-pointer focus:outline-hidden"
                    >
                      <option value="" disabled>-- Select Dosage Strength Variety --</option>
                      {dosageOptionsList.map((opt) => (
                        <option key={opt} value={opt}>
                          💊 {opt}
                        </option>
                      ))}
                      <option value="CUSTOM">✏️ Custom Dosage / Manual Entry...</option>
                    </select>
                  </div>
                )}

                {/* Manual Text Input (for Custom Dosage or when no preset list exists) */}
                {(dosageOptionsList.length === 0 || isCustomDosageSelected || !dosageOptionsList.includes(formData.dosage || '')) && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. 200 mg Tablet, 400 mg Tablet, 0.05% Cream (30g Tube)"
                    value={formData.dosage || ''}
                    onChange={(e) => handleChange('dosage', e.target.value)}
                    className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                  />
                )}

                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['200 mg Tablet', '400 mg Tablet', '500 mg Capsule', '10 mg Tablet', 'Medical Device / Supply'].map((formChip) => (
                    <button
                      key={formChip}
                      type="button"
                      onClick={() => {
                        setIsCustomDosageSelected(false);
                        handleChange('dosage', formChip);
                      }}
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer"
                    >
                      + {formChip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Directions, Storage & Clinical Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Apply thin layer as directed. [Storage: Store at Room Temp (20-25°C) / Do Not Freeze / Protect from Light]"
                value={formData.directions || ''}
                onChange={(e) => handleChange('directions', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden leading-relaxed"
              />
              <p className="text-[11px] italic font-semibold text-slate-500 mt-1 flex items-center gap-1">
                <span>* Note: Reference information may not be completely accurate. Please use your own clinical judgment.</span>
              </p>
            </div>
          </div>

          {/* Section 2: Clinical Category & Units of Measure (UOM) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              2. Categorization & Units of Measure (UOM)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Specialty Category *
                </label>
                <select
                  required
                  value={formData.shelfLocation || 'General Medical'}
                  onChange={(e) => handleChange('shelfLocation', e.target.value)}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-extrabold text-slate-900 transition-all focus:outline-hidden"
                >
                  {specialtyList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  {!specialtyList.some((s) => s.name === formData.shelfLocation) && (
                    <option value={formData.shelfLocation || 'General Medical'}>
                      {formData.shelfLocation || 'General Medical'}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Container Unit (UOM)
                </label>
                <select
                  value={formData.stockUnit || 'Bottles'}
                  onChange={(e) => handleChange('stockUnit', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                >
                  <option value="Bottles">🍼 Bottles (Tablets/Liquids)</option>
                  <option value="Tubes">🧴 Tubes (Creams/Ointments)</option>
                  <option value="Vials">🧪 Vials (Injectables/Drops)</option>
                  <option value="Inhalers">💨 Inhalers / Canisters</option>
                  <option value="Boxes / Packs">📦 Boxes / Cartons / Packs</option>
                  <option value="Ampoules">💉 Ampoules / Syringes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Sub-Unit Type (Loose/Vol)
                </label>
                <select
                  value={formData.subUnit || 'tablets'}
                  onChange={(e) => handleChange('subUnit', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                >
                  <option value="g">⚖️ g (Grams - Ointments/Creams)</option>
                  <option value="mL">💧 mL (Milliliters - Liquids)</option>
                  <option value="tablets">💊 Tablets</option>
                  <option value="capsules">💊 Capsules</option>
                  <option value="puffs">💨 Puffs / Actuations (Inhalers)</option>
                  <option value="drops">💧 Drops / gtt (Otic/Ophthalmic)</option>
                  <option value="strips">🩸 Test Strips</option>
                  <option value="units">🔢 Individual Units / Doses</option>
                  <option value="packets">🎒 Packets / Sachets</option>
                  <option value="suppositories">💊 Suppositories</option>
                  <option value="needles">💉 Needles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Stock Count & Expiration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                3. Physical Stock Counts & Container Volume
              </h3>
              <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Total Stock: {(((Number(formData.bottlesAvailable) || 0) * (Number(formData.pillsPerBottle) || 0)) + (Number(formData.looseUnitsAvailable) || 0)).toLocaleString()} {formData.subUnit || 'units'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {formData.stockUnit || 'Bottles'} Count
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={(formData.bottlesAvailable as any) === '' ? '' : (formData.bottlesAvailable ?? 0)}
                  onChange={(e) => handleChange('bottlesAvailable', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-black text-center text-slate-900 font-mono transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-tight text-teal-800 mb-1 truncate" title="The exact number of grams, mL, tablets, or actuations inside 1 sealed container">
                  Pack Size ({formData.subUnit || 'pills'}/{formData.stockUnit ? formData.stockUnit.replace(/s$/, '').toLowerCase() : 'btl'})
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={(formData.pillsPerBottle as any) === '' ? '' : (formData.pillsPerBottle ?? 100)}
                  onChange={(e) => handleChange('pillsPerBottle', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-bold text-center text-slate-700 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Loose {formData.subUnit || 'Units'} (Decimals OK)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={(formData.looseUnitsAvailable as any) === '' ? '' : (formData.looseUnitsAvailable ?? 0)}
                  onChange={(e) => handleChange('looseUnitsAvailable', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-black text-center text-slate-900 font-mono transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  required={formData.expirationDate !== '3000-01-01'}
                  disabled={formData.expirationDate === '3000-01-01'}
                  value={formData.expirationDate === '3000-01-01' ? '' : (formData.expirationDate || '')}
                  onChange={(e) => handleChange('expirationDate', e.target.value)}
                  className="w-full min-h-[48px] px-2.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 font-mono transition-all disabled:opacity-50"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="checkbox"
                    id="doesNotExpire"
                    checked={formData.expirationDate === '3000-01-01'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange('expirationDate', '3000-01-01');
                      } else {
                        const defaultExp = new Date();
                        defaultExp.setFullYear(defaultExp.getFullYear() + 2);
                        handleChange('expirationDate', defaultExp.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="doesNotExpire" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                    N/A - Does Not Expire (Supplies / Devices)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Lot Numbers */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              4. Manufacturer Lot Numbers & Recalls
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type lot number & tap Add..."
                value={newLotInput}
                onChange={(e) => setNewLotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLot();
                  }
                }}
                className="flex-1 min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 font-mono"
              />
              <button
                type="button"
                onClick={handleAddLot}
                className="min-h-[48px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-1 shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Lot</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentLots.length > 0 ? (
                currentLots.map((lot: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold font-mono text-slate-900"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lot}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLot(idx)}
                      className="text-amber-700 hover:text-rose-600 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md hover:bg-rose-50 ml-1"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">No active lot numbers added yet.</p>
              )}
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {item?.id ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Permanently delete medication card for ${formData.genericName}?`)) {
                    onDelete(item.id!);
                    onClose();
                  }
                }}
                className="min-h-[48px] px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs sm:text-sm rounded-2xl border border-rose-300 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="min-h-[48px] px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{item ? 'Save Updates' : 'Add Medication'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
