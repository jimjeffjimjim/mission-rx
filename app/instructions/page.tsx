'use client';

import React from 'react';
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
  Sparkles
} from 'lucide-react';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 shadow-2xs active:scale-95"
              title="Return to Application"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  MissionRx User Manual & Operating Guide
                </h1>
                <p className="text-xs font-bold text-slate-400">
                  Standard Operating Procedures & Clinical System Manual
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md active:scale-95 shrink-0"
          >
            Launch System
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Intro Hero Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Official Clinical Operating Guide</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              System Instructions & Clinical Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-3xl leading-relaxed">
              Welcome to the MissionRx Formulary & Medical Inventory Management System. This guide provides clear instructions on role-based access, inventory tracking, baseline stock rules, non-expiring supplies, disaster recovery backups, and administrative guidelines.
            </p>
          </div>
        </section>

        {/* Section 1: Access Credentials & Roles */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">1. Workstation Access Roles & PIN Credentials</h3>
              <p className="text-xs font-bold text-slate-500">Two-tiered security PIN access control</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-teal-900 text-sm">Doctor / Staff View</span>
                <span className="font-mono font-black text-xs bg-teal-200 text-teal-900 px-2 py-0.5 rounded-md">PIN: 1234</span>
              </div>
              <p className="text-xs text-teal-900 font-medium leading-relaxed">
                Designed for clinical providers. Displays medication cards, stock counts, specialty category badges, low-stock warnings, and expiration statuses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-900 text-sm">Admin Control Portal</span>
                <span className="font-mono font-black text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">PIN: 8888</span>
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Full inventory management access. Allows editing formulations, adding new drugs/supplies, bulk CSV imports, manual backups, and compliance logs.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Dynamic Baseline Stock vs. Testing Adjustments */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <RotateCcw className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">2. Baseline Stock Memory vs. Testing Adjustments</h3>
              <p className="text-xs font-bold text-slate-500">How stock resetting and official edits work</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-700 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Edit3 className="w-5 h-5 text-teal-600 shrink-0 stroke-[2.5] mt-0.5" />
              <div>
                <strong className="text-slate-900 font-extrabold block text-sm mb-1">
                  ✏️ Pencil Edit Button = Permanent Baseline Update
                </strong>
                When an Admin opens the Pencil Edit modal, modifies stock (e.g. changing 6 bottles to 10 bottles), and clicks <b>Save</b>, 10 bottles becomes the item's <b>NEW permanent Baseline Stock</b>.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-600 shrink-0 stroke-[2.5] mt-0.5" />
              <div>
                <strong className="text-slate-900 font-extrabold block text-sm mb-1">
                  ➖ / ➕ / Quick Number Box = Temporary Testing Adjustments
                </strong>
                Decrementing or incrementing stock using <code className="font-mono font-bold">-</code> / <code className="font-mono font-bold">+</code> buttons or typing in the quick number box on cards/tables counts as a temporary test dispense. Only current stock is adjusted; the baseline remains untouched.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-emerald-700 shrink-0 stroke-[2.5] mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-extrabold block text-sm mb-1">
                  🔄 Reset Stock Counts to Start = Baseline Restoration (Zero Data Loss)
                </strong>
                Clicking <b>"Reset Stock Counts to Start"</b> in the Admin Portal restores current stock for <b>ALL items</b> (both default 13 items AND newly added custom drugs) back to their saved baseline stock. <b>No newly added items are ever deleted!</b>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Units of Measure & Non-Expiring Supplies */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">3. Container Units, Decimals & Non-Expiring Supplies</h3>
              <p className="text-xs font-bold text-slate-500">Tracking pack sizes, liquid volumes, and non-expiring medical devices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Container Volume & Decimals (.5's)</span>
              </h4>
              <p className="leading-relaxed">
                Tracks both sealed pack containers (Bottles, Tubes, Vials, Inhalers, Cartons) and loose stock (grams <code className="font-mono font-bold">g</code>, milliliters <code className="font-mono font-bold">mL</code>, tablets, capsules, puffs, drops). Loose units support decimals (e.g. <code className="font-mono font-bold">1.5 mL</code>, <code className="font-mono font-bold">0.5 g</code>). Input fields cleanly empty on backspace without sticky zeroes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>N/A - Does Not Expire (Supplies & Devices)</span>
              </h4>
              <p className="leading-relaxed">
                For non-expiring medical devices, bandages, or mobility aids, check the <b>"N/A - Does Not Expire"</b> checkbox in the Edit modal. This sets the date to Year 3000 (<code className="font-mono font-bold">3000-01-01</code>) and displays a clean <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">🛡️ N/A (Non-Expiring)</span> badge.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Automated Backups & Disaster Recovery */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">4. Automated Weekly Backups & Storage Retention</h3>
              <p className="text-xs font-bold text-slate-500">Disaster recovery and storage protection</p>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            The system automatically generates weekly snapshots of your complete medication inventory and audit logs. Snapshots are stored in Supabase Cloud Postgres. An automated rolling retention policy keeps the <b>5 newest backup snapshots</b>, automatically pruning older ones to protect cloud storage space.
          </p>
        </section>

        {/* Section 5: Creator & Admin Zero Liability Legal Notice */}
        <section className="bg-rose-50/80 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4 text-rose-950">
          <div className="flex items-center gap-3 border-b border-rose-200 pb-4">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-800 border border-rose-300">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-950">5. Strict Creator & Admin Zero Liability Disclaimer</h3>
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
