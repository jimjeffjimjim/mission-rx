'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem } from '@/types/inventory';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  Search, 
  KeyRound, 
  ShieldAlert, 
  Check, 
  Layers, 
  Stethoscope, 
  Pill, 
  Calendar, 
  Tag, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { parseLotNumbers } from '@/lib/stockMath';
import { getSpecialtyColor } from '@/lib/specialtyColors';

interface DeveloperQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export default function DeveloperQrModal({
  isOpen,
  onClose,
  items,
}: DeveloperQrModalProps) {
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK_SHEET'>('SINGLE');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [bulkQrMap, setBulkQrMap] = useState<{ [id: string]: string }>({});
  const [generatingBulk, setGeneratingBulk] = useState(false);

  // Set default selected item
  useEffect(() => {
    if (isOpen && items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [isOpen, items, selectedItemId]);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) =>
        i.genericName.toLowerCase().includes(q) ||
        (i.brandName || '').toLowerCase().includes(q) ||
        (i.shelfLocation || '').toLowerCase().includes(q) ||
        i.dosage.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Construct comprehensive QR string
  const generateQrString = (item: InventoryItem): string => {
    const lots = parseLotNumbers(item.lotNumbers);
    const exp = item.expirationDate && !item.expirationDate.startsWith('3000') ? item.expirationDate : 'Permanent / Does Not Expire';
    
    return JSON.stringify({
      app: 'MissionRx',
      id: item.id,
      name: item.genericName,
      dosage: item.dosage,
      brand: item.brandName || null,
      shelf: item.shelfLocation,
      type: item.itemType || 'Medication',
      packSize: item.pillsPerBottle || 1,
      stockUnit: item.stockUnit || 'Bottles',
      subUnit: item.subUnit || 'units',
      lots: lots,
      expiration: exp,
      directions: item.directions || null,
    }, null, 2);
  };

  // Generate QR Code for Selected Item
  useEffect(() => {
    if (selectedItem && isPinUnlocked) {
      const qrText = generateQrString(selectedItem);
      QRCode.toDataURL(qrText, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    }
  }, [selectedItem, isPinUnlocked]);

  // Generate Bulk QR Codes when entering Bulk Sheet Tab
  useEffect(() => {
    if (activeTab === 'BULK_SHEET' && isPinUnlocked) {
      setGeneratingBulk(true);
      const promises = items.map((item) => {
        const qrText = generateQrString(item);
        return QRCode.toDataURL(qrText, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 140,
        }).then((url) => ({ id: item.id, url }));
      });

      Promise.all(promises)
        .then((results) => {
          const map: { [id: string]: string } = {};
          results.forEach((r) => {
            map[r.id] = r.url;
          });
          setBulkQrMap(map);
        })
        .catch((err) => console.error('Bulk QR generation error', err))
        .finally(() => setGeneratingBulk(false));
    }
  }, [activeTab, isPinUnlocked, items]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === '7777') {
      setIsPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleDownloadSingleQr = () => {
    if (!qrDataUrl || !selectedItem) return;
    const link = document.createElement('a');
    link.download = `QR_${selectedItem.genericName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div
      id="developer-qr-modal-root"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:static print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto print:max-h-none print:inset-auto"
    >
      <div className="bg-white border-2 border-indigo-500 rounded-3xl p-5 sm:p-7 max-w-5xl w-full shadow-2xl space-y-6 text-slate-900 my-6 max-h-[94vh] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:h-auto print:max-w-none print:w-full print:rounded-none print:block print:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-inner">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Developer QR & Clinical Label Portal
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-300">
                  Developer Mode
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Generate high-density offline QR labels with complete embedded clinical formulation data.
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

        {/* PIN Authentication Gate */}
        {!isPinUnlocked ? (
          <div className="py-12 px-4 max-w-md mx-auto w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Developer Access Required</h3>
              <p className="text-xs font-semibold text-slate-500">
                Enter the developer security code to unlock the full clinical QR generation engine.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3.5 pt-2">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter 4-Digit Developer PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-slate-900 focus:outline-hidden"
              />

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 animate-shake">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Invalid Security PIN. Access Restricted.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Unlock Developer QR Hub</span>
              </button>
            </form>
          </div>
        ) : (
          /* Main Developer QR Workspace */
          <div className="space-y-5 flex-1 overflow-y-auto pr-1 print:overflow-visible print:p-0 print:m-0 print:space-y-2">
            {/* View Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SINGLE')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    activeTab === 'SINGLE'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏷️ Single Bottle / Device Label
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('BULK_SHEET')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    activeTab === 'BULK_SHEET'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🖨️ Bulk Shelf Label Sheet ({items.length} Items)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintLabels}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>Print Clinical Labels</span>
                </button>
              </div>
            </div>

            {/* TAB 1: SINGLE ITEM QR LABEL */}
            {activeTab === 'SINGLE' && selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left Column: Item Selector */}
                <div className="md:col-span-5 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 print:hidden">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Select Medication or Equipment:
                  </label>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      const style = getSpecialtyColor(item.shelfLocation);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                              : 'hover:bg-slate-200/70 text-slate-800'
                          }`}
                        >
                          <div className="truncate">
                            <div className="text-xs font-extrabold truncate">{item.genericName}</div>
                            <div className={`text-[11px] font-semibold truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {item.dosage} • {item.shelfLocation}
                            </div>
                          </div>
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected ? 'bg-indigo-800 text-indigo-100' : style.badge
                          }`}>
                            {item.itemType === 'Supply' ? 'Supply' : 'Rx'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: High-Density Clinical QR Label Card */}
                <div className="md:col-span-7 space-y-4 print:col-span-12 print:w-full print:max-w-xl print:mx-auto">
                  <div className="p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden print:shadow-none print:break-inside-avoid">
                    {/* QR Code Container */}
                    <div className="shrink-0 bg-white p-2 border border-slate-200 rounded-2xl shadow-inner flex flex-col items-center">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="Item QR Code" className="w-44 h-44 object-contain" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400 font-bold">
                          Generating QR...
                        </div>
                      )}
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase">
                        MissionRx Clinical QR
                      </span>
                    </div>

                    {/* Label Metadata Text */}
                    <div className="space-y-2 flex-1 text-left select-text">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          📍 {selectedItem.shelfLocation || 'General Medical'}
                        </span>
                        <h3 className="text-base font-black text-slate-950 leading-tight pt-1">
                          {selectedItem.genericName}
                        </h3>
                        <p className="text-xs font-extrabold text-indigo-700">
                          {selectedItem.dosage}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1 text-[11px] font-semibold text-slate-600">
                        {selectedItem.brandName && (
                          <div>
                            <span className="text-slate-400">Mfg / Brand:</span> <strong>{selectedItem.brandName}</strong>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">Lot / Serial:</span>{' '}
                          <strong className="font-mono text-slate-900">
                            {parseLotNumbers(selectedItem.lotNumbers).join(', ') || 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Expiration:</span>{' '}
                          <strong className="text-slate-900">
                            {selectedItem.expirationDate && !selectedItem.expirationDate.startsWith('3000')
                              ? selectedItem.expirationDate
                              : 'Does Not Expire'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Packaging:</span>{' '}
                          <strong className="text-slate-900">
                            {selectedItem.pillsPerBottle || 1} {selectedItem.subUnit || 'units'} per {selectedItem.stockUnit || 'pack'}
                          </strong>
                        </div>
                      </div>

                      {selectedItem.directions && (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-medium text-slate-600 leading-snug">
                          {selectedItem.directions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 print:hidden">
                    <button
                      type="button"
                      onClick={handleDownloadSingleQr}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download QR PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintLabels}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4 stroke-[2.5]" />
                      <span>Print Single Adhesive Label</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BULK SHELF LABELS SHEET */}
            {activeTab === 'BULK_SHEET' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600">
                    Showing printable shelf QR labels for all <strong>{items.length}</strong> items in the catalog.
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    Avery 2x4" Sheet Compatible
                  </span>
                </div>

                {generatingBulk ? (
                  <div className="py-16 text-center text-slate-500 font-bold text-xs">
                    Rendering all high-density QR codes...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-2 print:gap-2 print:w-full">
                    {items.map((item) => {
                      const qrUrl = bulkQrMap[item.id];
                      const lots = parseLotNumbers(item.lotNumbers);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-slate-300 rounded-2xl flex items-center gap-3 shadow-2xs text-left print:border-slate-400 print:shadow-none print:break-inside-avoid print:page-break-inside-avoid"
                        >
                          <div className="shrink-0 bg-white p-1 border border-slate-200 rounded-xl">
                            {qrUrl ? (
                              <img src={qrUrl} alt="QR" className="w-16 h-16 object-contain" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-100 rounded-lg animate-pulse" />
                            )}
                          </div>
                          <div className="truncate space-y-0.5 flex-1">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              📍 {item.shelfLocation}
                            </span>
                            <div className="text-xs font-black text-slate-900 truncate">
                              {item.genericName}
                            </div>
                            <div className="text-[11px] font-extrabold text-indigo-700 truncate">
                              {item.dosage}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              Lot: {lots[0] || 'N/A'} • Exp: {item.expirationDate?.slice(0, 7) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
