'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  BookOpen, 
  Database, 
  Calculator, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Info
} from 'lucide-react';

export default function CompliancePage() {
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
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white">
                  System Documentation & Compliance Report
                </h1>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  MissionRx Data Provenance, Stock Mathematics & Regulatory Governance
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/instructions"
            className="min-h-[44px] px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">User Manual</span>
          </Link>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-700">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
            <ShieldCheck className="w-80 h-80 text-amber-400" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Official Compliance Document • Version 2.4.1</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              MissionRx Clinical Inventory System Documentation
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-3xl leading-relaxed">
              Official operational and regulatory reference for clinic directors, pharmacy auditors, volunteer medical staff, and compliance officers documenting platform architecture, data sources, stock calculations, and security controls.
            </p>
          </div>
        </section>

        {/* Short Clinical Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 font-bold text-xs sm:text-sm flex items-center gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <p className="italic leading-relaxed">
            * Note: Reference information provided in this manual and software may not be completely accurate. Please use your own clinical judgment.
          </p>
        </div>

        {/* Section 1: Data Sources & Provenance */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                1. Pharmaceutical Reference Data Sources & Provenance
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Where medication names, formulations, dosage options, and clinical classifications originate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local Dictionary Provenance */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-2.5 py-1 rounded-md">
                  Local Clinical Dictionary
                </span>
                <span className="text-[11px] font-extrabold text-slate-500">Sub-Millisecond Offline Cache</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                The local dictionary (<code className="font-mono text-teal-800 bg-teal-50 px-1 py-0.5 rounded">MEDICAL_DICTIONARY</code>) provides zero-latency offline autocomplete for essential clinic medications. It was compiled from three authoritative health data standards:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><b>World Health Organization (WHO) Essential Medicines:</b> Establishes INN drug names, dosage forms, and primary care therapeutic categories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><b>U.S. NLM RxNorm Database:</b> Standardizes active ingredients, brand cross-references, and measurement units (mg, mL, mcg).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><b>USP Standard Drug Nomenclature:</b> Defines standard container types (Bottles, Tubes, Vials, Inhalers) and sub-units.</span>
                </li>
              </ul>
            </div>

            {/* openFDA Cloud API */}
            <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-700 stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-sky-900 bg-sky-100 px-2.5 py-1 rounded-md">
                  Official openFDA Cloud API
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-950 leading-relaxed">
                Connected directly to the U.S. FDA National Drug Code & Labeling database (<code className="font-mono text-sky-900 bg-sky-100 px-1 py-0.5 rounded">api.fda.gov/drug/label.json</code>) covering 100,000+ FDA-approved formulations.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-sky-950">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><b>Live Search Query:</b> Triggered automatically when typing 2+ characters in medication search.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><b>FDA Label Extraction:</b> Auto-extracts pharmacologic class, route of administration, and package insert guidelines.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Stock Mathematics */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Calculator className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                2. Inventory Stock Mathematics & Direct Total Editing
              </h3>
              <p className="text-xs font-bold text-slate-500">
                How container conversion and total units auto-adjustment operate.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-center text-sm sm:text-base font-black shadow-inner">
            Total Stock Units = (Sealed Containers × Pack Size) + Loose Units
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black uppercase text-slate-500 block mb-1">Sealed Containers (B)</span>
              <p className="text-xs font-semibold text-slate-700">
                Full unopened bottles, tubes, or vials: <code className="font-mono text-amber-700 font-bold">B = ⌊Total / PackSize⌋</code>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black uppercase text-slate-500 block mb-1">Loose Units (L)</span>
              <p className="text-xs font-semibold text-slate-700">
                Auto-calculated open stock: <code className="font-mono text-amber-700 font-bold">L = Total mod PackSize</code>. Direct loose editing is disabled to maintain math accuracy.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black uppercase text-slate-500 block mb-1">Total Stock Units (T)</span>
              <p className="text-xs font-semibold text-slate-700">
                Editing Total Units directly auto-adjusts sealed containers and remaining loose units.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Security & Governance */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                3. Role-Based Access Control (RBAC) & Governance
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Access permissions for medical staff vs clinic administrators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
              <span className="text-xs font-black uppercase text-teal-900 bg-teal-200 px-2.5 py-1 rounded-md">
                Doctor / Provider View
              </span>
              <h4 className="font-black text-slate-900 text-sm">Strictly Read-Only Access</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Doctors and volunteer healthcare providers have read-only access to search inventory, check stock levels, view formulation details, and consult guidelines. Zero editing rights exist in Doctor view.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-xs font-black uppercase text-amber-900 bg-amber-200 px-2.5 py-1 rounded-md">
                Admin Control Center
              </span>
              <h4 className="font-black text-slate-900 text-sm">Full Administrative Control</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Clinic administrators have complete authority to add/edit/delete medications, adjust sealed containers and Total Units, import Excel spreadsheets, review audit logs, and trigger weekly backups.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Legal Protection */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 stroke-[2.5]" />
            <h3 className="text-lg font-black text-white">4. Zero-Liability Volunteer Provider Protection</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            MissionRx, its software developers, clinic administrators, volunteer doctors, and healthcare staff assume zero legal liability for clinical decisions, dosage selections, or inventory discrepancies. Reference information provided from WHO, RxNorm, USP standards, and openFDA cloud APIs is provided for informational convenience only. Healthcare providers must independently verify all medication details prior to administration.
          </p>
        </section>

        {/* Permanent Footer Links */}
        <footer className="pt-6 border-t border-slate-200 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/instructions"
              className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold text-xs border border-teal-300 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-teal-700 stroke-[2.5]" />
              <span>📖 User Manual & Operating Guide</span>
            </Link>
            <Link
              href="/compliance"
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs border border-amber-300 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span>📋 System Documentation Report</span>
            </Link>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            MissionRx © 2026 Pharmaceutical Inventory System • Official Clinic Operations Document
          </p>
        </footer>
      </main>
    </div>
  );
}
