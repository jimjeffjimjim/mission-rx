'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { X, Plus, Trash2, Save, Tag, AlertCircle, Sparkles, Zap, CheckCircle2, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import { searchMedicalKnowledge, MedicalDrugEntry } from '@/lib/medicalKnowledge';
import { checkLASA, LASAAlert } from '@/lib/lasa';

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
  
  // Smart Auto-fill State linked to Global Master Toggle
  const [autofillEnabled, setAutofillEnabled] = useState(isAutofillEnabled);
  const [autofillSuggestion, setAutofillSuggestion] = useState<MedicalDrugEntry | null>(null);
  const [autofilledNotice, setAutofilledNotice] = useState(false);

  useEffect(() => {
    setAutofillEnabled(isAutofillEnabled);
  }, [isAutofillEnabled]);

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
    }
    setErrorMsg('');
    setNewLotInput('');
    setAutofillSuggestion(null);
    setAutofilledNotice(false);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const lasaAlert = checkLASA(formData.genericName || formData.brandName || '');

  const handleChange = (field: keyof InventoryItem, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Smart Clinical Formulary Auto-fill lookup
      if (autofillEnabled && (field === 'genericName' || field === 'brandName') && typeof value === 'string') {
        if (value.trim().length >= 3) {
          const matches = searchMedicalKnowledge(value);
          setAutofillSuggestion(matches.length > 0 ? matches[0] : null);
        } else {
          setAutofillSuggestion(null);
        }
      } else if (!autofillEnabled) {
        setAutofillSuggestion(null);
      }

      return updated;
    });
  };

  const applyAutofill = () => {
    if (!autofillSuggestion) return;
    setFormData((prev) => ({
      ...prev,
      genericName: autofillSuggestion.genericName,
      brandName: autofillSuggestion.brandName,
      chemicalName: autofillSuggestion.chemicalName,
      shelfLocation: autofillSuggestion.category,
      dosage: prev.dosage || autofillSuggestion.defaultDosage,
      stockUnit: autofillSuggestion.defaultUnit,
      subUnit: autofillSuggestion.defaultSubUnit,
      directions: prev.directions || `${autofillSuggestion.typicalDirections} [Contraindications: ${autofillSuggestion.contraindications}]`,
    }));
    setAutofillSuggestion(null);
    setAutofilledNotice(true);
    setTimeout(() => setAutofilledNotice(false), 4000);
  };

  const handleToggleAutofill = () => {
    const nextState = !autofillEnabled;
    setAutofillEnabled(nextState);
    if (!nextState) {
      setAutofillSuggestion(null);
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
      setErrorMsg('Generic Name, Dosage, and Expiration Date are strictly required for clinical compliance.');
      return;
    }

    const cleanedData = {
      ...formData,
      bottlesAvailable: Number(formData.bottlesAvailable) || 0,
      looseUnitsAvailable: Number(formData.looseUnitsAvailable) || 0,
      pillsPerBottle: Number(formData.pillsPerBottle) || 0,
      lotNumbers: JSON.stringify(formData.lotNumbers || []),
    };

    onSave(cleanedData);
    onClose();
  };

  const currentLots = (formData.lotNumbers as string[]) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 touch-none max-w-full overflow-x-hidden">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto overscroll-contain touch-pan-y max-w-full overflow-x-hidden">
        {/* Top Header Bar with Auto-Fill Toggle Switch */}
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

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleToggleAutofill}
              className={`min-h-[40px] px-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border touch-manipulation active:scale-95 shadow-2xs ${
                autofillEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
              title={autofillEnabled ? 'Click to disable Smart Medical Auto-Fill' : 'Click to enable Smart Medical Auto-Fill'}
            >
              {autofillEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                  <span>Autofill: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400 stroke-[2.5]" />
                  <span>Autofill: OFF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors touch-manipulation shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* LASA Safety Alert Warning Banner */}
        {lasaAlert && (
          <div className="mb-5 p-4 bg-amber-50/90 border-2 border-amber-400 rounded-2xl text-slate-900 shadow-md flex items-start gap-3.5 animate-fadeIn">
            <ShieldAlert className="w-7 h-7 text-amber-600 shrink-0 stroke-[2.5] mt-0.5" />
            <div className="space-y-1.5 text-xs min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black uppercase tracking-wider bg-amber-300 text-amber-950 px-2 py-0.5 rounded-md text-[10px] shadow-2xs">
                  ⚠️ LASA Safety Alert
                </span>
                <span className="font-mono font-black text-amber-950 text-xs sm:text-sm bg-white/80 px-2 py-0.5 rounded-md border border-amber-300">
                  {lasaAlert.tallManName}
                </span>
              </div>
              <p className="font-extrabold text-slate-900 text-xs">
                Commonly confused with: <span className="text-rose-700 font-black font-mono underline decoration-2">{lasaAlert.tallManConfusedWith}</span> ({lasaAlert.confusedWith})
              </p>
              <p className="font-medium text-slate-700 leading-relaxed text-[11px]">
                {lasaAlert.clinicalWarning}
              </p>
            </div>
          </div>
        )}

        {/* Smart Auto-Fill Recommendation Banner */}
        {autofillEnabled && autofillSuggestion && (
          <div className="mb-5 p-4 bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl text-white shadow-lg flex items-center justify-between gap-3 animate-fadeIn border border-teal-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest block text-emerald-200">Clinical Formulary Match Found!</span>
                <p className="text-xs sm:text-sm font-black truncate">
                  {autofillSuggestion.brandName} <span className="text-emerald-100 font-bold">({autofillSuggestion.category})</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={applyAutofill}
              className="min-h-[40px] px-4 bg-white text-teal-900 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md transition-all touch-manipulation shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-teal-800 text-teal-800" />
              <span className="hidden sm:inline">Auto-Fill Details</span>
              <span className="sm:hidden">Fill</span>
            </button>
          </div>
        )}

        {autofilledNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            <span>Successfully auto-completed drug strength, unit of measure, typical directions, and clinical contraindications!</span>
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
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              1. Pharmaceutical Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Generic Drug Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril, Sertraline, Amoxicillin"
                  value={formData.genericName || ''}
                  onChange={(e) => handleChange('genericName', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Brand / Commercial Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lipitor, Zoloft, Benadryl"
                  value={formData.brandName || ''}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Active Chemical / Compound
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACE Inhibitor, SSRI"
                  value={formData.chemicalName || ''}
                  onChange={(e) => handleChange('chemicalName', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Strength & Dosage Form *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 mg Oral Tablet"
                  value={formData.dosage || ''}
                  onChange={(e) => handleChange('dosage', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Directions / Clinical Notes (From Excel)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Take 1 tablet by mouth once daily as needed. (Starting stock: 29 bottles × 30 tablets = 870 tablets)"
                value={formData.directions || ''}
                onChange={(e) => handleChange('directions', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden leading-relaxed"
              />
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
                  value={formData.shelfLocation || 'General Medical'}
                  onChange={(e) => handleChange('shelfLocation', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-black text-slate-900 transition-all focus:outline-hidden"
                >
                  <option value="General Medical">🏥 General Medical</option>
                  <option value="Allergy & Asthma">🫁 Allergy & Asthma</option>
                  <option value="Cardiology">❤️ Cardiology</option>
                  <option value="Dental">🦷 Dental</option>
                  <option value="Dermatology">🌸 Dermatology</option>
                  <option value="Orthopedics">🦴 Orthopedics</option>
                  <option value="Psychiatry">💜 Psychiatry</option>
                  <option value="Pulmonology">💨 Pulmonology</option>
                  <option value="Over-The-Counter (OTC)">🌿 Over-The-Counter (OTC)</option>
                  <option value="Supplies">📦 Supplies</option>
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
                  <option value="Bottles">🍼 Bottles</option>
                  <option value="Tubes">🧴 Tubes</option>
                  <option value="Boxes / Packs">📦 Boxes / Packs</option>
                  <option value="Vials">🧪 Vials</option>
                  <option value="Inhalers / Canisters">💨 Inhalers / Canisters</option>
                  <option value="Packs">🎒 Packs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Sub-Unit Type (Loose)
                </label>
                <select
                  value={formData.subUnit || 'tablets'}
                  onChange={(e) => handleChange('subUnit', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                >
                  <option value="tablets">💊 Tablets</option>
                  <option value="capsules">💊 Capsules</option>
                  <option value="mL">💧 mL (Liquid)</option>
                  <option value="tubes">🧴 Tubes</option>
                  <option value="strips">🩸 Test Strips</option>
                  <option value="units">🔢 Individual Units</option>
                  <option value="needles">💉 Needles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Stock Count & Expiration */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              3. Physical Stock Counts & Expiration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {formData.stockUnit || 'Bottles'} Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bottlesAvailable || 0}
                  onChange={(e) => handleChange('bottlesAvailable', parseInt(e.target.value, 10) || 0)}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-black text-center text-slate-900 font-mono transition-all focus:outline-hidden shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Loose {formData.subUnit || 'Units'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.looseUnitsAvailable || 0}
                  onChange={(e) => handleChange('looseUnitsAvailable', parseInt(e.target.value, 10) || 0)}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-black text-center text-slate-900 font-mono transition-all focus:outline-hidden shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Units Per Box/Btl
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.pillsPerBottle || 100}
                  onChange={(e) => handleChange('pillsPerBottle', parseInt(e.target.value, 10) || 0)}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-base font-bold text-center text-slate-700 font-mono transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expirationDate || ''}
                  onChange={(e) => handleChange('expirationDate', e.target.value)}
                  className="w-full min-h-[48px] px-2.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 font-mono transition-all focus:outline-hidden"
                />
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
                placeholder="Type lot number (e.g., 153224031A) & tap Add..."
                value={newLotInput}
                onChange={(e) => setNewLotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLot();
                  }
                }}
                className="flex-1 min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={handleAddLot}
                className="min-h-[48px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-1 shrink-0 touch-manipulation shadow-xs active:scale-95"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold font-mono text-slate-900 shadow-2xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lot}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLot(idx)}
                      className="text-amber-700 hover:text-rose-600 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md hover:bg-rose-50 transition-colors ml-1"
                      title="Remove Lot"
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
                className="min-h-[48px] px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs sm:text-sm rounded-2xl border border-rose-300 transition-all flex items-center gap-1.5 touch-manipulation active:scale-95 shadow-2xs"
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
                className="min-h-[48px] px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm rounded-2xl transition-all touch-manipulation active:scale-95"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="min-h-[48px] px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
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
