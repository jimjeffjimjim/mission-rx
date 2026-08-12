'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthRole } from '@/types/inventory';
import { Lock, AlertCircle, KeyRound, BookOpen } from 'lucide-react';

interface AuthGateProps {
  currentRole: AuthRole;
  onAuthenticate: (role: AuthRole) => void;
}

export default function AuthGate({ currentRole, onAuthenticate }: AuthGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState<boolean>(false);

  useEffect(() => {
    const syncTestingMode = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('mission_rx_testing_mode');
        setIsTestingMode(stored === 'true');
      }
    };
    syncTestingMode();
    window.addEventListener('storage', syncTestingMode);
    window.addEventListener('mission_rx_testing_mode_change', syncTestingMode);
    window.addEventListener('testingModeChanged', syncTestingMode);
    return () => {
      window.removeEventListener('storage', syncTestingMode);
      window.removeEventListener('mission_rx_testing_mode_change', syncTestingMode);
      window.removeEventListener('testingModeChanged', syncTestingMode);
    };
  }, []);

  const handleToggleTestingMode = () => {
    const nextVal = !isTestingMode;
    setIsTestingMode(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mission_rx_testing_mode', nextVal ? 'true' : 'false');
      window.dispatchEvent(new Event('mission_rx_testing_mode_change'));
      window.dispatchEvent(new Event('testingModeChanged'));
    }
  };

  useEffect(() => {
    if (currentRole === 'LOCKED' && pin.length === 4) {
      if (pin === '1234') {
        setPin('');
        onAuthenticate('STAFF');
      } else if (pin === '8888') {
        setPin('');
        onAuthenticate('ADMIN');
      } else if (pin === '9110') {
        setPin('');
        setIsTestingModalOpen(true);
      } else {
        setError(true);
        const timer = setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, currentRole, onAuthenticate]);

  if (currentRole !== 'LOCKED') return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setError(false);
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-100 px-4 text-slate-900 font-sans selection:bg-teal-500 select-none">
      {/* Secret PIN 9110 Testing Mode Configuration Menu */}
      {isTestingModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-700 border border-amber-500/30">
                <KeyRound className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Testing Mode Control</h3>
                <p className="text-xs font-bold text-slate-500">Secret Administrator Menu (PIN 9110)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-black text-slate-900 block">System Testing Mode</span>
                  <span className="text-xs font-medium text-slate-500">
                    {isTestingMode
                      ? 'PIN reminders and database dev tools are visible.'
                      : 'Testing tools hidden. Clean production operational mode.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTestingMode}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isTestingMode ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isTestingMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-600 bg-teal-50 border border-teal-200/80 rounded-xl p-3">
              ℹ️ When turned <b>OFF</b>, all PIN reminder hints on the lock screen and dev/reset controls in the Admin portal are hidden for clinical safety and production readiness.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsTestingModalOpen(false)}
                className="w-full py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Close & Return to Lock Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient clinical background bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-slate-100 to-slate-100 pointer-events-none" />
      
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl transition-all">
        <div className="flex flex-col items-center space-y-2.5 mb-5 text-center">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">MissionRx Formulary</h1>
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Protected Medical Inventory Access
          </p>

          {/* User Manual Instructions Link (Only visible when 9110 Testing Toggle is ON) */}
          {isTestingMode && (
            <Link
              href="/instructions"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-700 stroke-[2.5]" />
              <span>📖 Read User Manual & Instructions</span>
            </Link>
          )}

          {/* ======================================================================================= */}
          {/* [TESTING MODE FEATURE - PIN HINTS - DELETE OR HIDE BEFORE FINAL PRODUCTION DEPLOYMENT]  */}
          {/* ======================================================================================= */}
          {isTestingMode && (
            <div className="mt-2 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
              <KeyRound className="w-3.5 h-3.5 text-teal-600 shrink-0 stroke-[2.5]" />
              <span>Doctor PIN: <strong className="font-mono text-teal-700 font-black">1234</strong></span>
              <span className="text-slate-300">|</span>
              <span>Admin PIN: <strong className="font-mono text-amber-700 font-black">8888</strong></span>
            </div>
          )}
          {/* ======================================================================================= */}
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center gap-4 my-5">
          {[0, 1, 2, 3].map((index) => {
            const isEntered = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 transform ${
                  error
                    ? 'bg-rose-600 scale-110 animate-bounce'
                    : isEntered
                    ? 'bg-teal-600 shadow-md shadow-teal-500/30 scale-110'
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold text-rose-700 bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-200 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{isTestingMode ? 'Invalid PIN. Try Doctor (1234) or Admin (8888)' : 'Invalid Access PIN. Please try again.'}</span>
          </div>
        )}

        {/* 48x48px Ergonomic Keypad Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="flex items-center justify-center min-h-[56px] rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-teal-600 active:text-white active:scale-95 text-2xl font-black text-slate-800 transition-all border border-slate-300/80 shadow-xs touch-manipulation"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleClear}
            className="flex items-center justify-center min-h-[56px] rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 active:bg-rose-600 active:text-white active:scale-95 text-xs font-extrabold uppercase tracking-wider text-slate-600 transition-all border border-slate-300 shadow-xs touch-manipulation"
          >
            Clear
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="flex items-center justify-center min-h-[56px] rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-teal-600 active:text-white active:scale-95 text-2xl font-black text-slate-800 transition-all border border-slate-300/80 shadow-xs touch-manipulation"
          >
            0
          </button>

          <button
            onClick={() => handleDelete()}
            className="flex items-center justify-center min-h-[56px] rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 active:bg-amber-600 active:text-white active:scale-95 text-xs font-extrabold uppercase tracking-wider text-slate-600 transition-all border border-slate-300 shadow-xs touch-manipulation"
          >
            Delete
          </button>
        </div>

        {/* Footer Legal Links */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-slate-500">
          {isTestingMode && (
            <>
              <Link href="/instructions" className="text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 font-extrabold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                <span>📖 User Manual</span>
              </Link>
              <span className="text-slate-300">•</span>
            </>
          )}
          <Link href="/privacy" className="hover:text-teal-700 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/terms" className="hover:text-amber-700 transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
