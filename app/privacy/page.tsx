'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, FileText, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20 selection:bg-teal-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-black text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all border border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to MissionRx</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Healthcare Data Protection & System Disclaimers</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">MissionRx Privacy Policy</h1>
            <p className="text-sm sm:text-base text-teal-100/90 font-medium max-w-2xl">
              Data protection standards, local cache handling, zero-liability disclaimers, and clinical audit logging practices for MissionRx.
            </p>
            <div className="pt-2 text-xs font-bold text-teal-200/80 flex items-center gap-4">
              <span>Effective Date: August 2026</span>
              <span>•</span>
              <span>Version 2.5 (Ironclad Legal Edition)</span>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 leading-relaxed text-slate-700 text-sm sm:text-base">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">1</span>
              <span>Overview & Scope</span>
            </h2>
            <p>
              MissionRx ("System", "We", "Our") is a specialized pharmaceutical inventory management platform designed for hospital clinics, emergency dispensaries, and health centers. This Privacy Policy details our operational practices regarding data collection, storage, access control, security compliance, and liability disclaimers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">2</span>
              <span>HIPAA & Protected Health Information (PHI)</span>
            </h2>
            <p>
              MissionRx operates as a <strong>pharmaceutical stock tracking system</strong>. The core application tracks medication names, dosages, lot numbers, shelf locations, expiration dates, and sealed bottle counts.
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-950">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>No Direct Patient Identification Required</span>
              </div>
              <p>
                The system does not require or mandate entering patient names, Social Security Numbers, or medical record numbers. All dispense logs record transaction activity by medication formulation and quantity dispensed.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">3</span>
              <span>Information We Collect & Store</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>
                <strong>Formulary Inventory Data:</strong> Generic drug names, brand names, chemical classifications, dosages, stock units, bottle counts, expiration dates, and lot tracking numbers.
              </li>
              <li>
                <strong>Dispense Transaction Logs:</strong> Quantitative stock adjustments, dispense timestamps, action types (CREATE, EDIT, DISPENSE, RESTOCK), and clinical notes entered by staff.
              </li>
              <li>
                <strong>Local Browser Cache:</strong> Temporary client-side storage (<code className="bg-slate-100 px-2 py-0.5 rounded text-teal-700 font-mono text-xs">localStorage</code>) used strictly for immediate UI rendering, offline resilience, and audit queue batching.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">4</span>
              <span>Data Protection & Security Encryption</span>
            </h2>
            <p>
              We enforce multi-layer technical safeguards to protect hospital inventory data:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Lock className="w-4 h-4 text-teal-600" />
                  <span>TLS 1.3 Transport Encryption</span>
                </div>
                <p className="text-xs text-slate-600">All data transmitted between workstations and Supabase Cloud Postgres is encrypted via SSL/TLS protocol.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>4-Digit PIN Access Controls</span>
                </div>
                <p className="text-xs text-slate-600">Role-based access lock codes prevent unauthorized access to Doctor View and the Admin Control Portal.</p>
              </div>
            </div>
          </section>

          {/* Section 5 - CREATOR & ADMIN ZERO LIABILITY DISCLAIMER */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-rose-600 text-white text-xs font-black">5</span>
              <span>Software Creator & Administrator Disclaimer of Liability</span>
            </h2>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Absolute Limitation of Liability</span>
              </div>
              <p className="text-rose-900">
                The software creator(s), system developers, clinic directors, system administrators, volunteer doctors, volunteer healthcare providers, volunteer nurses, and clinic volunteers assume ZERO liability for any data loss, patient outcomes, dosing miscalculations, inventory miscounts, or clinical actions resulting from the use of MissionRx. All data is managed and verified at the sole responsibility of active medical users.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">6</span>
              <span>Data Retention & Backup Archives</span>
            </h2>
            <p>
              Inventory records and audit logs are retained to maintain regulatory compliance. System administrators can create encrypted weekly backup snapshots, download JSON archives, or export audit reports to CSV at any time.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-black">7</span>
              <span>Contact Information</span>
            </h2>
            <p>
              For privacy inquiries, audit compliance verification, or system security questions, contact your Lead Pharmacist or Hospital Systems Administrator.
            </p>
          </section>
        </div>

        {/* Back Link Footer */}
        <div className="text-center pt-4 flex items-center justify-center gap-3">
          <Link
            href="/instructions"
            className="inline-flex items-center gap-2 text-xs font-black text-teal-800 bg-teal-50 border border-teal-300 px-5 py-3 rounded-2xl shadow-xs hover:shadow-md transition-all"
          >
            <span>📖 User Manual & Instructions</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-800 hover:text-slate-900 bg-white border border-slate-300 px-5 py-3 rounded-2xl shadow-xs hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Main App</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
