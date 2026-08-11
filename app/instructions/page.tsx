'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ArrowLeft, 
  KeyRound, 
  ShieldCheck, 
  RotateCcw, 
  Edit3, 
  Package, 
  Calendar, 
  Database, 
  Layers,
  Sparkles,
  Search,
  Lock,
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  History,
  Info
} from 'lucide-react';

export default function InstructionsPage() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'doctor' | 'admin' | 'glossary' | 'faq'>('quickstart');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 pb-20">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 shadow-2xs active:scale-95"
              title="Return to Main Application"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white">
                  MissionRx User Manual & Beginner Guide
                </h1>
                <p className="text-[11px] sm:text-xs font-bold text-slate-400">
                  Step-by-step instructions for clinic staff, doctors, and admins
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <span>Launch App</span>
            <ArrowLeft className="w-4 h-4 rotate-180 stroke-[2.5]" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Beginner Welcome Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Beginner-Friendly Operating Guide</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome to MissionRx Inventory System
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-3xl leading-relaxed">
              No prior software or technical experience needed! This manual will show you step-by-step how to look up medications, check stock levels, add new supplies, and manage clinic inventory safely.
            </p>
          </div>
        </section>

        {/* Navigation Tabs for Beginner Sections */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-400 stroke-[2.5]" />
            <span>🚀 60-Second Quick Start</span>
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeTab === 'doctor'
                ? 'bg-teal-700 text-white border-teal-800 shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-500 stroke-[2.5]" />
            <span>🩺 Doctor & Staff Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>⚙️ Admin & Manager Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeTab === 'glossary'
                ? 'bg-indigo-700 text-white border-indigo-800 shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400 stroke-[2.5]" />
            <span>📖 Easy Terms Glossary</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-rose-700 text-white border-rose-800 shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-rose-400 stroke-[2.5]" />
            <span>❓ Beginner FAQ</span>
          </button>
        </div>

        {/* TAB 1: 60-SECOND QUICK START */}
        {activeTab === 'quickstart' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🚀 60-Second Quick Start Cheat Sheet</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h4 className="font-black text-base text-slate-900">Log In with Your 4-Digit PIN</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Type your 4-digit security PIN on the lock screen keypad:
                </p>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-bold">
                  <div className="flex items-center justify-between text-teal-800">
                    <span>Doctor / Staff View</span>
                    <span className="font-mono bg-teal-100 px-2 py-0.5 rounded font-black">1234</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-800">
                    <span>Admin Control Portal</span>
                    <span className="font-mono bg-amber-100 px-2 py-0.5 rounded font-black">8888</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h4 className="font-black text-base text-slate-900">Search & Filter Medications</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Use the top Search Bar to type any drug name, brand name, ingredient, or strength (e.g. <i>"Amoxicillin"</i> or <i>"Cream"</i>).
                </p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Tap category pills (e.g. <i>Dermatology</i>, <i>Cardiology</i>, <i>Supplies</i>, <i>Mobility Aid</i>) to filter items instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h4 className="font-black text-base text-slate-900">Lock Station When Walking Away</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  To protect patient privacy and clinic security, click the red <b>"Lock"</b> button in the top-right header whenever you leave your computer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR & STAFF GUIDE */}
        {activeTab === 'doctor' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
                  <BookOpen className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">🩺 Doctor & Staff View Guide (PIN 1234)</h3>
                  <p className="text-xs font-bold text-slate-500">Everything you need to look up drugs and check stock</p>
                </div>
              </div>

              <div className="space-y-5 text-xs font-medium text-slate-700 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-600" />
                    <span>How to Read Medication Cards</span>
                  </h4>
                  <p>Each drug is presented on a clean visual card showing:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-800 font-semibold">
                    <li><b>Generic Name & Brand Name:</b> The primary medical name and brand equivalent.</li>
                    <li><b>Form & Strength:</b> Dosage formulation (e.g. <i>10 mg Oral Tablet</i> or <i>0.05% Cream</i>).</li>
                    <li><b>Total Stock Badge:</b> The calculated sum of all sealed containers + loose stock combined (e.g. <i>720 Total Tablets</i>).</li>
                    <li><b>Sealed Packs:</b> Number of unopened bottles, tubes, or cartons in stock.</li>
                    <li><b>Loose Units:</b> Number of open loose pills, grams (<code className="font-mono font-bold">g</code>), or milliliters (<code className="font-mono font-bold">mL</code>).</li>
                    <li><b>Expiration Status:</b> Color-coded pill showing expiration date or <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">🛡️ N/A (Non-Expiring)</span> for devices.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Understanding Warnings & Alerts</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-rose-700">🚨 EXPIRED:</strong> Do not dispense. The medication has passed its expiration date.</li>
                    <li><strong className="text-amber-800">⚠️ Expiring Soon:</strong> Item expires within 30 days. Prioritize dispensing older stock first.</li>
                    <li><strong className="text-rose-700">Low Stock Badge:</strong> Inventory is running low (fewer than 2 sealed containers or 20 loose units remaining).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN & MANAGER GUIDE */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">⚙️ Admin & Inventory Manager Guide (PIN 8888)</h3>
                  <p className="text-xs font-bold text-slate-500">Restocking, adding formulations, and managing stock baselines</p>
                </div>
              </div>

              <div className="space-y-5 text-xs font-medium text-slate-700 leading-relaxed">
                {/* 1. Adjusting Stock */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>1. Dispensing & Restocking Stock (➖ and ➕ Buttons)</span>
                  </h4>
                  <p>
                    On any medication card or in the Admin table, click <code className="font-mono font-bold text-rose-700">-</code> to dispense or <code className="font-mono font-bold text-emerald-700">+</code> to restock containers or loose units. You can also tap the number text directly to type an exact count.
                  </p>
                </div>

                {/* 2. Baseline Stock vs Pencil Edit */}
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                  <h4 className="font-extrabold text-teal-950 text-sm flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-700" />
                    <span>2. Pencil Edit Modal (Setting Permanent Baseline Stock)</span>
                  </h4>
                  <p className="text-teal-950">
                    Clicking the <b>Pencil icon</b> on an item opens the official Edit Modal. When you change stock here and click <b>Save</b>, that quantity becomes the item's <b>NEW permanent Baseline Stock</b>.
                  </p>
                  <p className="text-teal-950">
                    If you test dispense using <code className="font-mono font-bold">-</code> or <code className="font-mono font-bold">+</code> afterwards, clicking <b>"Reset Stock Counts to Start"</b> will revert back to the baseline set in the Pencil modal. <b>Custom drugs are NEVER deleted!</b>
                  </p>
                </div>

                {/* 3. Non-Expiring Supplies */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>3. Non-Expiring Supplies & Medical Devices</span>
                  </h4>
                  <p>
                    When adding or editing medical supplies, crutches, or devices, check the <b>"N/A - Does Not Expire"</b> checkbox. This sets the date to Year 3000 (<code className="font-mono font-bold">3000-01-01</code>) and removes false expiration alerts.
                  </p>
                </div>

                {/* 4. CSV Import & Disaster Recovery */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <span>4. Backups & CSV Spreadsheet Uploads</span>
                  </h4>
                  <p>
                    In the Admin Portal, use <b>"Import Spreadsheet CSV"</b> to bulk-upload formulary files from Excel. Tap <b>"Download Backup"</b> to save an offline JSON disaster recovery file anytime. Automated weekly snapshots retain the 5 newest backups to protect cloud storage space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EASY TERMS GLOSSARY */}
        {activeTab === 'glossary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Layers className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">📖 Everyday Language Terminology Glossary</h3>
                  <p className="text-xs font-bold text-slate-500">Simple definitions for common inventory terms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Sealed Packs / Containers</span>
                  <p>Unopened stock containers straight from the manufacturer (e.g. 1 unopened bottle of 100 tablets, 1 sealed tube of cream, 1 vial).</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Pack Size</span>
                  <p>The total volume or unit quantity inside 1 sealed container (e.g. 30 grams per tube, 15 mL per bottle, 100 pills per bottle).</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Loose Units</span>
                  <p>Individual pills, grams (<code className="font-mono font-bold">g</code>), or milliliters (<code className="font-mono font-bold">mL</code>) in an opened container. Supports decimals like <code className="font-mono font-bold">1.5 mL</code>.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Baseline Stock</span>
                  <p>The saved starting stock count for an item. Reverted to when clicking "Reset Stock" during testing. Updated only when saving through the Pencil Edit modal.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Lot Numbers</span>
                  <p>Manufacturer identification numbers printed on physical containers for safety and tracking during drug recall alerts.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">Active Chemical / Compound</span>
                  <p>The active drug class or active pharmacological compound (e.g. <i>Topical Corticosteroid</i>, <i>ACE Inhibitor</i>, <i>Antihistamine</i>).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BEGINNER FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                  <HelpCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">❓ Frequently Asked Questions (FAQ)</h3>
                  <p className="text-xs font-bold text-slate-500">Quick solutions for common beginner questions</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-700 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Q: What if I make a mistake and minus the wrong medication count?
                  </h4>
                  <p>
                    Simply click the green <code className="font-mono font-bold text-emerald-700">+</code> button to add it right back! If you were doing test dispenses, clicking <b>"Reset Stock Counts to Start"</b> in the Admin Portal will restore all stock back to your saved baseline.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Q: Will clicking "Reset Stock Counts to Start" delete my newly added drugs?
                  </h4>
                  <p>
                    <b>No!</b> The reset function is 100% non-destructive. It only resets stock numbers back to your baseline. All custom drugs, medical devices, and supplies you added will remain safe in your inventory.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Q: How do I handle supplies or medical devices that don't have expiration dates?
                  </h4>
                  <p>
                    Open the item's Pencil Edit modal and check the box that says <b>"N/A - Does Not Expire (Supplies / Devices)"</b>. This marks the item as non-expiring and removes warning alerts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Q: Is patient health information (PHI) stored in this app?
                  </h4>
                  <p>
                    <b>No.</b> MissionRx tracks drug inventory counts, dosage forms, lot numbers, and expiration dates. No patient names or personal health records are stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Strict Creator & Admin Zero Liability Legal Notice */}
        <section className="bg-rose-50/80 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4 text-rose-950">
          <div className="flex items-center gap-3 border-b border-rose-200 pb-4">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-800 border border-rose-300">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-950">Creator & Admin Zero Liability Disclaimer</h3>
              <p className="text-xs font-bold text-rose-800">Legal limitation of liability</p>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            MissionRx is provided strictly as an administrative organizational software tool. System creators, software developers, and clinic administrative personnel assume <b>ZERO LIABILITY</b> for clinical dispensing decisions, medication administration, medical dosage accuracy, patient outcomes, or regulatory compliance. Licensed healthcare providers remain solely responsible for verifying physical drug labels, lot numbers, and expiration dates prior to dispensing.
          </p>
        </section>

      </main>
    </div>
  );
}
