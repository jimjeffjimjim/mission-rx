'use client';

import React, { useState } from 'react';
import { AuthRole } from '@/types/inventory';
import { Shield, User, Plus, KeyRound, Sparkles, X, LayoutDashboard, ToggleLeft, ToggleRight, Zap } from 'lucide-react';

interface HeaderProps {
  currentRole: AuthRole;
  onSwitchRole: (newRole: AuthRole) => void;
  onOpenCreateModal: () => void;
  isAutofillEnabled?: boolean;
  onToggleAutofill?: () => void;
  onOpenAuditLogs?: () => void;
}

export default function Header({
  currentRole,
  onSwitchRole,
  onOpenCreateModal,
  isAutofillEnabled = true,
  onToggleAutofill,
  onOpenAuditLogs,
}: HeaderProps) {
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleRoleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentRole === 'ADMIN') {
      onSwitchRole('STAFF');
    } else {
      setShowAdminPrompt(true);
      setAdminPinInput('');
      setError(false);
    }
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '8888') {
      onSwitchRole('ADMIN');
      setShowAdminPrompt(false);
      setAdminPinInput('');
    } else {
      setError(true);
      setAdminPinInput('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 transition-all shadow-xs select-none max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 truncate">
                <span>MissionRx</span>
                {currentRole === 'ADMIN' ? (
                  <span className="text-[10px] sm:text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 shrink-0">
                    <LayoutDashboard className="w-3 h-3 text-amber-700" />
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                    Doctor View
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden md:block truncate">
                {currentRole === 'ADMIN'
                  ? 'Backdoor Administration & Central System Management'
                  : 'Real-Time Hospital Medication Tracking & Dispensary Search'}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleAutofill && (
              <button
                type="button"
                onClick={onToggleAutofill}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[48px] px-3 sm:px-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all touch-manipulation border active:scale-95 shadow-2xs ${
                  isAutofillEnabled
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                }`}
                title={isAutofillEnabled ? 'Click to disable Smart Clinical Autofill' : 'Click to enable Smart Clinical Autofill'}
              >
                {isAutofillEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 stroke-[2.5]" />
                    <span className="hidden lg:inline">Autofill: ON</span>
                    <span className="lg:hidden">AF ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 stroke-[2.5]" />
                    <span className="hidden lg:inline">Autofill: OFF</span>
                    <span className="lg:hidden">AF OFF</span>
                  </>
                )}
              </button>
            )}

            {currentRole === 'ADMIN' ? (
              <>
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-600/20 transition-all touch-manipulation"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                  <span className="hidden sm:inline">Add Medication</span>
                  <span className="sm:hidden">Add</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSwitchRole('STAFF');
                  }}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all touch-manipulation border active:scale-95 shadow-md bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-950 shrink-0 stroke-[2.5]" />
                  <span>Exit Admin</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRoleToggle}
                className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all touch-manipulation border active:scale-95 shadow-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              >
                <Shield className="w-4 h-4 text-slate-500 shrink-0 stroke-[2.5]" />
                <span className="hidden sm:inline">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Admin Unlock Modal Dialog */}
      {showAdminPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdminPrompt(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <KeyRound className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Admin Control PIN</h3>
                <p className="text-xs text-slate-500 font-medium">Enter PIN 8888 to access Admin Portal</p>
              </div>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center h-14 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl text-2xl tracking-[0.5em] font-mono font-bold text-slate-900 focus:outline-hidden transition-all shadow-inner"
              />

              {error && (
                <p className="text-xs text-rose-600 font-bold text-center animate-bounce">
                  Access Denied. Only Admin PIN (8888) is authorized.
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl transition-all touch-manipulation shadow-md shadow-amber-500/20 active:scale-[0.98]"
              >
                Open Admin Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
