'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Palette, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  RefreshCw,
  Tag
} from 'lucide-react';
import { 
  CustomSpecialtyConfig, 
  getCustomSpecialties, 
  saveCustomSpecialties, 
  DEFAULT_SPECIALTIES,
  buildSchemeForColor
} from '@/lib/specialtyColors';

interface SpecialtyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpecialtiesUpdated?: () => void;
}

const COLOR_OPTIONS = [
  { id: 'sky', name: 'Sky Blue', bg: 'bg-sky-500' },
  { id: 'teal', name: 'Teal Green', bg: 'bg-teal-500' },
  { id: 'rose', name: 'Rose Red', bg: 'bg-rose-500' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'pink', name: 'Pink', bg: 'bg-pink-500' },
  { id: 'indigo', name: 'Indigo Purple', bg: 'bg-indigo-500' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500' },
  { id: 'blue', name: 'Deep Blue', bg: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald Green', bg: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber Gold', bg: 'bg-amber-500' },
];

export default function SpecialtyManagerModal({ isOpen, onClose, onSpecialtiesUpdated }: SpecialtyManagerModalProps) {
  const [specialties, setSpecialties] = useState<CustomSpecialtyConfig[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('teal');

  useEffect(() => {
    if (isOpen) {
      setSpecialties(getCustomSpecialties());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    saveCustomSpecialties(specialties);
    if (onSpecialtiesUpdated) onSpecialtiesUpdated();
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all specialty categories and colors to clinic default presets?')) {
      setSpecialties(DEFAULT_SPECIALTIES);
      saveCustomSpecialties(DEFAULT_SPECIALTIES);
      if (onSpecialtiesUpdated) onSpecialtiesUpdated();
    }
  };

  const handleAddSpecialty = () => {
    if (!newName.trim()) return;
    const cleanId = newName.toLowerCase().trim();
    if (specialties.some((s) => s.id === cleanId)) {
      alert('A specialty with this name already exists.');
      return;
    }
    const updated = [...specialties, { id: cleanId, name: newName.trim(), color: newColor }];
    setSpecialties(updated);
    setNewName('');
  };

  const handleUpdateColor = (id: string, color: string) => {
    setSpecialties((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSpecialties((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <Palette className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Manage Specialties & Color Schemes</h2>
              <p className="text-xs text-slate-500 font-bold">
                Customize clinic category labels, visual tags, and theme colors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form to Add New Specialty */}
        <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">Add Custom Specialty Category</span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="e.g. Ophthalmology, Neurology..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 min-h-[44px] px-3.5 bg-white border border-slate-300 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNewColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all border-2 flex items-center justify-center shrink-0 ${
                    newColor === c.id ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {newColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSpecialty}
              className="min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Specialty</span>
            </button>
          </div>
        </div>

        {/* Existing Specialties List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2">
          {specialties.map((spec) => {
            const scheme = buildSchemeForColor(spec.color, spec.name);
            return (
              <div key={spec.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs uppercase ${scheme.badge}`}>
                    {spec.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Color Selector */}
                  <div className="flex items-center gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleUpdateColor(spec.id, c.id)}
                        className={`w-6 h-6 rounded-full ${c.bg} transition-all border ${
                          spec.color === c.id ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(spec.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="min-h-[44px] px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Specialties</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
