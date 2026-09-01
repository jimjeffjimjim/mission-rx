'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem, LotEntry } from '@/types/inventory';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Stethoscope, 
  Boxes, 
  Calendar, 
  Layers, 
  AlertTriangle, 
  Check, 
  ShieldCheck,
  Tag
} from 'lucide-react';
import { calculateTotalUnits, convertTotalUnitsToStock, parseLotNumbers } from '@/lib/stockMath';

const PRESET_EQUIPMENT_CATEGORIES = [
  'Supplies',
  'Diagnostic Devices',
  'Surgical Instruments',
  'Consumables & PPE',
  'Wound Care',
  'Respiratory & Airway',
  'Emergency & Trauma',
  'Orthopedics & Splints',
  'Dental Supplies',
];

const PRESET_CONTAINER_UNITS = [
  'Units',
  'Boxes / Packs',
  'Kits / Trays / Sets',
  'Pairs',
  'Rolls',
  'Bags / Pouches',
  'Cartons / Cases',
  'Tubes',
  'Vials',
];

const PRESET_SUB_UNITS = [
  'pieces',
  'units',
  'kits',
  'pairs',
  'items',
  'rolls',
  'pads',
  'sets',
  'strips',
  'needles',
  'syringes',
  'catheters',
];

interface EquipmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (itemData: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
}

export default function EquipmentEditModal({
  isOpen,
  onClose,
  item,
  onSave,
  onDelete,
}: EquipmentEditModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    genericName: '',
    brandName: '',
    chemicalName: null,
    dosage: 'Medical Supply / Device',
    shelfLocation: 'Supplies',
    itemType: 'Supply',
    stockUnit: 'Units',
    subUnit: 'pieces',
    bottlesAvailable: 1,
    looseUnitsAvailable: 0,
    pillsPerBottle: 1,
    expirationDate: '3000-01-01',
    directions: '',
    lotNumbers: [],
  });

  // Custom input states
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const [isCustomContainerUnit, setIsCustomContainerUnit] = useState(false);
  const [customContainerText, setCustomContainerText] = useState('');

  const [isCustomSubUnit, setIsCustomSubUnit] = useState(false);
  const [customSubUnitText, setCustomSubUnitText] = useState('');

  const [doesNotExpire, setDoesNotExpire] = useState(true);

  // Multi-Lot / Multi-Serial Tracking Rows
  const [lotEntries, setLotEntries] = useState<LotEntry[]>([]);

  useEffect(() => {
    if (item) {
      const parsedLots = parseLotNumbers(item.lotNumbers);
      let initialLots: LotEntry[] = [];

      if (Array.isArray(item.lotNumbers) && item.lotNumbers.length > 0 && typeof item.lotNumbers[0] === 'object') {
        initialLots = item.lotNumbers.map((l: any, idx: number) => ({
          id: l.id || `lot-${Date.now()}-${idx}`,
          lotNumber: l.lotNumber || '',
          expirationDate: l.expirationDate || item.expirationDate || '3000-01-01',
          bottles: Number(l.bottles) || 0,
          looseUnits: Number(l.looseUnits) || 0,
        }));
      } else if (parsedLots.length > 0) {
        initialLots = parsedLots.map((lot, idx) => ({
          id: `lot-${Date.now()}-${idx}`,
          lotNumber: lot,
          expirationDate: item.expirationDate || '3000-01-01',
          bottles: idx === 0 ? (item.bottlesAvailable || 0) : 0,
          looseUnits: idx === 0 ? (item.looseUnitsAvailable || 0) : 0,
        }));
      } else {
        initialLots = [{
          id: `lot-${Date.now()}`,
          lotNumber: '',
          expirationDate: item.expirationDate || '3000-01-01',
          bottles: item.bottlesAvailable || 0,
          looseUnits: item.looseUnitsAvailable || 0,
        }];
      }

      setLotEntries(initialLots);

      const isNoExp = !item.expirationDate || item.expirationDate.startsWith('3000') || item.expirationDate.startsWith('2099');
      setDoesNotExpire(isNoExp);

      // Check custom category
      const currentCat = item.shelfLocation || 'Supplies';
      if (!PRESET_EQUIPMENT_CATEGORIES.includes(currentCat)) {
        setIsCustomCategory(true);
        setCustomCategoryText(currentCat);
      } else {
        setIsCustomCategory(false);
        setCustomCategoryText('');
      }

      // Check custom container
      const currentContainer = item.stockUnit || 'Units';
      if (!PRESET_CONTAINER_UNITS.includes(currentContainer)) {
        setIsCustomContainerUnit(true);
        setCustomContainerText(currentContainer);
      } else {
        setIsCustomContainerUnit(false);
        setCustomContainerText('');
      }

      // Check custom sub unit
      const currentSub = item.subUnit || 'pieces';
      if (!PRESET_SUB_UNITS.includes(currentSub)) {
        setIsCustomSubUnit(true);
        setCustomSubUnitText(currentSub);
      } else {
        setIsCustomSubUnit(false);
        setCustomSubUnitText('');
      }

      setFormData({
        id: item.id,
        genericName: item.genericName || '',
        brandName: item.brandName || '',
        chemicalName: null,
        dosage: item.dosage || 'Medical Supply / Device',
        shelfLocation: currentCat,
        itemType: 'Supply',
        stockUnit: currentContainer,
        subUnit: currentSub,
        bottlesAvailable: item.bottlesAvailable || 0,
        looseUnitsAvailable: item.looseUnitsAvailable || 0,
        pillsPerBottle: Math.max(1, Number(item.pillsPerBottle) || 1),
        expirationDate: isNoExp ? '3000-01-01' : (item.expirationDate || ''),
        directions: item.directions || '',
        lotNumbers: parsedLots,
      });
    } else {
      setDoesNotExpire(true);
      setIsCustomCategory(false);
      setCustomCategoryText('');
      setIsCustomContainerUnit(false);
      setCustomContainerText('');
      setIsCustomSubUnit(false);
      setCustomSubUnitText('');

      setLotEntries([{
        id: `lot-${Date.now()}`,
        lotNumber: '',
        expirationDate: '3000-01-01',
        bottles: 1,
        looseUnits: 0,
      }]);

      setFormData({
        genericName: '',
        brandName: '',
        chemicalName: null,
        dosage: 'Medical Supply / Device',
        shelfLocation: 'Supplies',
        itemType: 'Supply',
        stockUnit: 'Units',
        subUnit: 'pieces',
        bottlesAvailable: 1,
        looseUnitsAvailable: 0,
        pillsPerBottle: 1,
        expirationDate: '3000-01-01',
        directions: '',
        lotNumbers: [],
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof InventoryItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Multi-Lot Handlers
  const handleAddLotRow = () => {
    const defaultExp = doesNotExpire ? '3000-01-01' : (formData.expirationDate || new Date().toISOString().split('T')[0]);
    setLotEntries((prev) => [
      ...prev,
      {
        id: `lot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lotNumber: '',
        expirationDate: defaultExp,
        bottles: 1,
        looseUnits: 0,
      },
    ]);
  };

  const handleUpdateLotRow = (index: number, field: keyof LotEntry, value: any) => {
    setLotEntries((prev) =>
      prev.map((lot, idx) => (idx === index ? { ...lot, [field]: value } : lot))
    );
  };

  const handleRemoveLotRow = (index: number) => {
    if (lotEntries.length <= 1) {
      setLotEntries([{
        id: `lot-${Date.now()}`,
        lotNumber: '',
        expirationDate: doesNotExpire ? '3000-01-01' : (formData.expirationDate || ''),
        bottles: 0,
        looseUnits: 0,
      }]);
      return;
    }
    setLotEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSyncLotsToStock = () => {
    let sumContainers = 0;
    let sumLoose = 0;
    let earliestExp = '';

    lotEntries.forEach((l) => {
      sumContainers += Math.max(0, Number(l.bottles) || 0);
      sumLoose += Math.max(0, Number(l.looseUnits) || 0);
      if (l.expirationDate && !l.expirationDate.startsWith('3000') && !l.expirationDate.startsWith('2099')) {
        if (!earliestExp || l.expirationDate < earliestExp) {
          earliestExp = l.expirationDate;
        }
      }
    });

    setFormData((prev) => ({
      ...prev,
      bottlesAvailable: sumContainers,
      looseUnitsAvailable: sumLoose,
      expirationDate: earliestExp || (doesNotExpire ? '3000-01-01' : prev.expirationDate),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = isCustomCategory ? (customCategoryText.trim() || 'Supplies') : (formData.shelfLocation || 'Supplies');
    const finalContainer = isCustomContainerUnit ? (customContainerText.trim() || 'Units') : (formData.stockUnit || 'Units');
    const finalSubUnit = isCustomSubUnit ? (customSubUnitText.trim() || 'pieces') : (formData.subUnit || 'pieces');
    const finalExp = doesNotExpire ? '3000-01-01' : (formData.expirationDate || '3000-01-01');

    const validLots = lotEntries
      .map((l) => ({
        id: l.id,
        lotNumber: l.lotNumber.trim(),
        expirationDate: l.expirationDate || finalExp,
        bottles: Math.max(0, Number(l.bottles) || 0),
        looseUnits: Math.max(0, Number(l.looseUnits) || 0),
      }))
      .filter((l) => l.lotNumber.length > 0 || l.bottles > 0 || l.looseUnits > 0);

    const submissionData: Partial<InventoryItem> = {
      ...formData,
      shelfLocation: finalCategory,
      stockUnit: finalContainer,
      subUnit: finalSubUnit,
      expirationDate: finalExp,
      itemType: 'Supply',
      chemicalName: null,
      pillsPerBottle: Math.max(1, Number(formData.pillsPerBottle) || 1),
      bottlesAvailable: Math.max(0, Number(formData.bottlesAvailable) || 0),
      looseUnitsAvailable: Math.max(0, Number(formData.looseUnitsAvailable) || 0),
      lotNumbers: validLots.length > 0 ? validLots : (formData.lotNumbers || []),
    };

    onSave(submissionData);
    onClose();
  };

  const currentTotal = calculateTotalUnits(
    Number(formData.bottlesAvailable) || 0,
    Number(formData.pillsPerBottle) || 1,
    Number(formData.looseUnitsAvailable) || 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-6 text-slate-900 my-8 max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-100 text-teal-800 border border-teal-200 shadow-inner">
              <Stethoscope className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{item ? 'Edit Medical Equipment / Supply' : 'Add Medical Equipment & Supplies'}</span>
                <span className="text-xs bg-teal-100 text-teal-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Equipment Manager
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Track diagnostic tools, surgical instruments, sterilization trays, and clinic consumable supplies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Section 1: Equipment Identification & Specs */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              1. Equipment Identification & Specifications
            </h3>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Equipment / Supply Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diagnostic Otoscope Set, Digital Blood Pressure Monitor, Nitrile Exam Gloves, Suture Removal Kit"
                value={formData.genericName || ''}
                onChange={(e) => handleChange('genericName', e.target.value)}
                className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
              />

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Digital BP Monitor',
                  'Diagnostic Otoscope Set',
                  'Pulse Oximeter',
                  'Blood Glucometer',
                  'Stethoscope',
                  'Nitrile Exam Gloves',
                  'Sterile Suture Kit',
                  'Gauze Bandage Rolls',
                  'Disposable Syringes',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChange('genericName', chip)}
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Brand / Manufacturer / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welch Allyn, Omron, Dynarex, 3M Littmann, Halyard"
                  value={formData.brandName || ''}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Specification / Size / Model #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adult Medium, Size Large, 18G 1.5 inch, Rechargeable LED, Set of 5"
                  value={formData.dosage || ''}
                  onChange={(e) => handleChange('dosage', e.target.value)}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Storage, Maintenance & Clinical Handling Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Requires 2x AA batteries. Autoclave after procedure. Store in dry emergency cart."
                value={formData.directions || ''}
                onChange={(e) => handleChange('directions', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Custom Category & Units of Measure */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              2. Categorization & Units of Measure (Customizable)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={isCustomCategory ? 'CUSTOM' : (formData.shelfLocation || 'Supplies')}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      handleChange('shelfLocation', e.target.value);
                    }
                  }}
                  className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-extrabold text-slate-900 transition-all focus:outline-hidden"
                >
                  {PRESET_EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      📁 {cat}
                    </option>
                  ))}
                  <option value="CUSTOM">✏️ Custom Category (Manual Entry)...</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name..."
                    value={customCategoryText}
                    onChange={(e) => {
                      setCustomCategoryText(e.target.value);
                      handleChange('shelfLocation', e.target.value);
                    }}
                    className="w-full mt-2 min-h-[42px] px-3 bg-teal-50/60 border border-teal-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                  />
                )}
              </div>

              {/* Container Unit */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Container Unit (UOM)
                </label>
                <select
                  value={isCustomContainerUnit ? 'CUSTOM' : (formData.stockUnit || 'Units')}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomContainerUnit(true);
                    } else {
                      setIsCustomContainerUnit(false);
                      handleChange('stockUnit', e.target.value);
                    }
                  }}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                >
                  {PRESET_CONTAINER_UNITS.map((u) => (
                    <option key={u} value={u}>
                      📦 {u}
                    </option>
                  ))}
                  <option value="CUSTOM">✏️ Custom Container Unit...</option>
                </select>

                {isCustomContainerUnit && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cases, Bundles, Trays..."
                    value={customContainerText}
                    onChange={(e) => {
                      setCustomContainerText(e.target.value);
                      handleChange('stockUnit', e.target.value);
                    }}
                    className="w-full mt-2 min-h-[42px] px-3 bg-teal-50/60 border border-teal-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                  />
                )}
              </div>

              {/* Sub-Unit Type */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Sub-Unit Type
                </label>
                <select
                  value={isCustomSubUnit ? 'CUSTOM' : (formData.subUnit || 'pieces')}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomSubUnit(true);
                    } else {
                      setIsCustomSubUnit(false);
                      handleChange('subUnit', e.target.value);
                    }
                  }}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                >
                  {PRESET_SUB_UNITS.map((sub) => (
                    <option key={sub} value={sub}>
                      🧩 {sub}
                    </option>
                  ))}
                  <option value="CUSTOM">✏️ Custom Sub-Unit...</option>
                </select>

                {isCustomSubUnit && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. cuffs, probes, meters..."
                    value={customSubUnitText}
                    onChange={(e) => {
                      setCustomSubUnitText(e.target.value);
                      handleChange('subUnit', e.target.value);
                    }}
                    className="w-full mt-2 min-h-[42px] px-3 bg-teal-50/60 border border-teal-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-hidden"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Physical Stock & Expiration / Sterilization */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                3. Physical Stock Counts & Packaging
              </h3>
              <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Total Stock: {currentTotal.toLocaleString()} {formData.subUnit || 'pieces'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Units Per {formData.stockUnit || 'Unit'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.pillsPerBottle || 1}
                  onChange={(e) => handleChange('pillsPerBottle', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                />
                <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
                  (e.g. 1 for single device, 100 for box of gloves)
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Packs / Containers Available
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.bottlesAvailable ?? 1}
                  onChange={(e) => handleChange('bottlesAvailable', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Loose {formData.subUnit || 'pieces'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.looseUnitsAvailable ?? 0}
                  onChange={(e) => handleChange('looseUnitsAvailable', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full min-h-[48px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                />
              </div>
            </div>

            {/* Expiration / Calibration Option */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doesNotExpire}
                    onChange={(e) => {
                      setDoesNotExpire(e.target.checked);
                      if (e.target.checked) {
                        handleChange('expirationDate', '3000-01-01');
                      } else {
                        const nextYear = new Date();
                        nextYear.setFullYear(nextYear.getFullYear() + 2);
                        handleChange('expirationDate', nextYear.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Does Not Expire / Permanent Clinical Device
                  </span>
                </label>
              </div>

              {!doesNotExpire && (
                <div className="pt-1">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Expiration / Sterilization / Calibration Date *
                  </label>
                  <input
                    type="date"
                    required={!doesNotExpire}
                    value={formData.expirationDate && !formData.expirationDate.startsWith('3000') ? formData.expirationDate : ''}
                    onChange={(e) => handleChange('expirationDate', e.target.value)}
                    className="w-full min-h-[44px] px-3.5 bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-sm font-bold text-slate-900 transition-all focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Multi-Lot / Serial Number Shipment Batches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>4. Serial Numbers & Shipment Batches</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Track individual equipment serial numbers, lot shipments, and quantities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncLotsToStock}
                  className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all flex items-center gap-1 cursor-pointer"
                  title="Sum up containers and loose units from all serial/lot rows into master stock"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Auto-Sum to Stock</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddLotRow}
                  className="px-2.5 py-1 text-xs font-black rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Serial / Lot Row</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {lotEntries.map((lot, index) => (
                <div
                  key={lot.id || index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl items-center text-xs"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Serial / Lot #{index + 1}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SN-88491, LOT-2026A"
                      value={lot.lotNumber}
                      onChange={(e) => handleUpdateLotRow(index, 'lotNumber', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:border-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Service / Expiry
                    </label>
                    <input
                      type="date"
                      value={lot.expirationDate && !lot.expirationDate.startsWith('3000') ? lot.expirationDate : ''}
                      onChange={(e) => handleUpdateLotRow(index, 'expirationDate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      {formData.stockUnit || 'Units'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lot.bottles ?? 0}
                      onChange={(e) => handleUpdateLotRow(index, 'bottles', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Loose {formData.subUnit || 'pcs'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lot.looseUnits ?? 0}
                      onChange={(e) => handleUpdateLotRow(index, 'looseUnits', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveLotRow(index)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {item?.id ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Permanently delete "${item.genericName}" from equipment inventory?`)) {
                    onDelete(item.id!);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Equipment</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Equipment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
