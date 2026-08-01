'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  FileText, 
  Table, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function SpreadsheetImportModal({ isOpen, onClose, onImportComplete }: SpreadsheetImportModalProps) {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<InventoryItem>[]>([]);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // CSV / Tabular Text Parser
  const parseSpreadsheetText = (text: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const rows: Partial<InventoryItem>[] = [];

    // Check if line 1 is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('generic') || firstLine.includes('item') || firstLine.includes('drug') || firstLine.includes('dosage');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab, comma, or pipe
      let cols: string[] = [];
      if (line.includes('\t')) cols = line.split('\t');
      else if (line.includes(',')) cols = line.split(',');
      else if (line.includes('|')) cols = line.split('|');
      else cols = [line];

      cols = cols.map((c) => c.replace(/^["']|["']$/g, '').trim());

      const genericName = cols[0] || 'Unspecified Drug';
      const brandName = cols[1] || '';
      const dosage = cols[2] || 'Standard Strength';
      const shelfLocation = cols[3] || 'General Medical';
      const bottlesAvailable = parseInt(cols[4], 10) || 1;
      const looseUnitsAvailable = parseInt(cols[5], 10) || 0;
      const expirationDate = cols[6] || '2028-12-31';
      const lotNumbers = cols[7] ? [cols[7]] : ['LOT-SPREADSHEET'];
      const directions = cols[8] || 'Take as directed by clinician.';

      rows.push({
        genericName,
        brandName,
        dosage,
        shelfLocation,
        stockUnit: 'Bottles',
        subUnit: 'tablets',
        bottlesAvailable,
        looseUnitsAvailable,
        pillsPerBottle: 100,
        expirationDate,
        lotNumbers: JSON.stringify(lotNumbers),
        directions,
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        parseSpreadsheetText(content);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseSpreadsheetText(pastedData);
  };

  const executeBulkImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRows),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(`Successfully imported ${result.count} medication formulations into active inventory!`);
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to import spreadsheet rows.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error executing bulk import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Import Formulary from Spreadsheet</h2>
              <p className="text-xs text-slate-500 font-bold">
                Batch-import medication inventory from CSV, Excel, or tabular clipboard data
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 my-4">
          <button
            type="button"
            onClick={() => setActiveTab('FILE')}
            className={`flex-1 min-h-[44px] rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all border ${
              activeTab === 'FILE'
                ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Upload CSV / File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PASTE')}
            className={`flex-1 min-h-[44px] rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all border ${
              activeTab === 'PASTE'
                ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Paste Raw Text / Table</span>
          </button>
        </div>

        {/* Mode 1: File Drag & Drop */}
        {activeTab === 'FILE' && (
          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl text-center bg-slate-50 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Select or Drag CSV / Excel file here</h4>
              <p className="text-xs text-slate-500 font-medium">Supports .csv, .txt, or tab-delimited files</p>
            </div>

            <input
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="inline-block px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              Choose File
            </label>
          </div>
        )}

        {/* Mode 2: Paste Raw Text */}
        {activeTab === 'PASTE' && (
          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <textarea
              rows={4}
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste tab-delimited or comma-separated text from Excel...&#10;Generic Name, Brand Name, Dosage, Category, Bottles, Loose, Expiration, Lot, Directions&#10;Lisinopril, Zestril, 10mg Tablet, Cardiology, 20, 0, 2028-12-31, LOT-101, Take daily"
              className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-teal-600 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
            />
            <button
              type="submit"
              className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all"
            >
              Parse Pasted Table
            </button>
          </form>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Parsed Live Preview Table */}
        {parsedRows.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-teal-600" />
                <span>Parsed Preview: {parsedRows.length} Formulations Ready to Import</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl max-h-[220px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase sticky top-0">
                  <tr>
                    <th className="p-2">Generic Name</th>
                    <th className="p-2">Dosage</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-center">Bottles</th>
                    <th className="p-2">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                  {parsedRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 text-slate-900">{r.genericName}</td>
                      <td className="p-2 font-mono">{r.dosage}</td>
                      <td className="p-2">{r.shelfLocation}</td>
                      <td className="p-2 text-center font-mono">{r.bottlesAvailable}</td>
                      <td className="p-2 font-mono">{r.expirationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || importing}
            onClick={executeBulkImport}
            className="min-h-[44px] px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Import {parsedRows.length} Medications</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
