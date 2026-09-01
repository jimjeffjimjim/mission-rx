'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Barcode, 
  Search, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Flashlight, 
  RotateCcw,
  Sparkles,
  Keyboard
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { lookupBarcodeOrNdc, ScannedMedicationData } from '@/lib/ndcLookup';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: ScannedMedicationData) => void;
  title?: string;
  subtitle?: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Bottle Barcode / NDC',
  subtitle = 'Point camera at manufacturer UPC, 2D GS1 DataMatrix, or NDC barcode on bottle.',
}: BarcodeScannerModalProps) {
  const [manualInput, setManualInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedMedicationData | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'missionrx-camera-reader';

  // Start Camera when modal opens
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen) {
      setCameraError(null);
      setScannedResult(null);
      setManualInput('');
      setIsSearching(false);

      // Delay slightly for modal DOM mount
      const timer = setTimeout(async () => {
        try {
          const element = document.getElementById(readerElementId);
          if (!element) return;

          html5QrCode = new Html5Qrcode(readerElementId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.ITF,
            ],
            verbose: false,
          });

          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.3333,
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleBarcodeDecoded(decodedText);
            },
            () => {
              // Ignore standard frame scan misses
            }
          );

          setIsCameraActive(true);
        } catch (err: any) {
          console.warn('Camera start error:', err);
          setCameraError(err?.message || 'Unable to access device camera. You can type or use a USB barcode gun below.');
          setIsCameraActive(false);
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {})
            .finally(() => {
              scannerRef.current = null;
              setIsCameraActive(false);
            });
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBarcodeDecoded = async (barcodeText: string) => {
    if (isSearching) return;
    setIsSearching(true);

    // Audio / Haptic feedback
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(100);
    }

    try {
      const match = await lookupBarcodeOrNdc(barcodeText);
      if (match) {
        setScannedResult(match);
        // Automatically transfer and close after 400ms preview
        setTimeout(() => {
          onScanSuccess(match);
          onClose();
        }, 400);
      } else {
        // Fallback with raw barcode
        const rawFallback: ScannedMedicationData = {
          genericName: `Item (Barcode ${barcodeText.slice(0, 10)})`,
          brandName: '',
          chemicalName: null,
          dosage: 'Standard Formulation',
          shelfLocation: 'General Medical',
          stockUnit: 'Bottles',
          subUnit: 'units',
          pillsPerBottle: 100,
          rawBarcode: barcodeText,
          source: 'MANUAL_NDC',
        };
        setScannedResult(rawFallback);
        setTimeout(() => {
          onScanSuccess(rawFallback);
          onClose();
        }, 500);
      }
    } catch (e) {
      console.error('Barcode lookup failure', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await handleBarcodeDecoded(manualInput.trim());
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 my-4 max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800 border border-teal-200 shadow-inner">
              <Barcode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Inbound Intake
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
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

        {/* Live Camera Viewfinder */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 min-h-[220px] flex items-center justify-center shadow-inner">
          <div id={readerElementId} className="w-full h-full max-h-[260px] overflow-hidden" />

          {/* Overlay Targeting Reticle */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="w-64 h-32 border-2 border-dashed border-teal-400/80 rounded-2xl relative shadow-lg">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-teal-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-teal-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-teal-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-teal-400 rounded-br" />
            </div>
            <span className="text-[11px] font-black uppercase text-white/90 bg-slate-950/80 px-3 py-1 rounded-full mt-2 backdrop-blur-xs tracking-wider border border-white/20">
              Align Barcode / 2D GS1 Inside Box
            </span>
          </div>

          {/* Searching Spinner Overlay */}
          {isSearching && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-10 animate-in fade-in duration-150">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-xs font-black text-teal-300">
                Searching FDA National Drug Code Directory...
              </span>
            </div>
          )}

          {/* Success Match Overlay */}
          {scannedResult && (
            <div className="absolute inset-0 bg-teal-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white z-20 animate-in fade-in duration-150 space-y-1.5">
              <div className="p-2 rounded-full bg-teal-400 text-teal-950">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-black text-white">{scannedResult.genericName}</h4>
              <p className="text-xs font-bold text-teal-200">
                {scannedResult.dosage} • {scannedResult.shelfLocation}
              </p>
              <span className="text-[10px] font-mono bg-teal-950/60 px-2 py-0.5 rounded-full text-teal-300">
                ✨ Auto-Filling Formulary Form...
              </span>
            </div>
          )}
        </div>

        {/* Camera Permission / Fallback Warning */}
        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Camera unavailable: You can scan with a USB barcode gun or enter the NDC below.</span>
          </div>
        )}

        {/* Manual Barcode / USB Gun Entry */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Manual Barcode, NDC, or USB Scanner Gun</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. 0093-2264-01, 300932264014, (01)0030093..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 min-h-[44px] px-3.5 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || isSearching}
              className="min-h-[44px] px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Lookup</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-semibold">
            Recognizes FDA NDC 10/11-digit codes, GS1 2D DataMatrix (Lot & Exp), UPC-A, and EAN-13.
          </p>
        </div>
      </div>
    </div>
  );
}
