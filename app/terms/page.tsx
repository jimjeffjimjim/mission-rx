'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldCheck, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-md">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">Terms of Service</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Medical Inventory System Terms & Conditions</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">MissionRx Terms of Service</h1>
            <p className="text-sm sm:text-base text-amber-100/90 font-medium max-w-2xl">
              Terms of use, user responsibilities, PIN access security standards, and medical liability disclaimers for MissionRx.
            </p>
            <div className="pt-2 text-xs font-bold text-amber-200/80 flex items-center gap-4">
              <span>Effective Date: August 2026</span>
              <span>•</span>
              <span>Version 2.4</span>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 leading-relaxed text-slate-700 text-sm sm:text-base">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing or using the MissionRx Pharmaceutical Inventory Management System ("System"), hospital staff, attending physicians, pharmacists, and administrators ("Users") agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the system.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">2</span>
              <span>Authorized Use & Credentials</span>
            </h2>
            <p>
              MissionRx is designed exclusively for authorized medical personnel in clinical environments. Access is governed by role-based PIN credentials:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>
                <strong>Doctor View PIN (<code>1234</code>):</strong> Authorized for licensed physicians, clinical staff, and dispensaries to perform real-time drug lookups and record clinical dispenses.
              </li>
              <li>
                <strong>Admin Portal PIN (<code>8888</code>):</strong> Restricted to designated pharmacy directors and system administrators for master formulary edits, spreadsheet imports, stock count resets, and backup operations.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">3</span>
              <span>User Responsibilities & Workstation Security</span>
            </h2>
            <p>
              Users are strictly responsible for maintaining PIN confidentiality and securing active workstations:
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Workstation Locking Requirement</span>
              </div>
              <p>
                Users must click <strong>"Lock"</strong> or log out prior to leaving any workstation unattended. Sharing PIN credentials with unauthorized personnel is strictly prohibited.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">4</span>
              <span>Inventory Accuracy & Physical Verification</span>
            </h2>
            <p>
              While MissionRx provides automated bottle decrementing, loose pill calculation, and critical supply alerts, clinical personnel are responsible for physically inspecting medication stock, confirming lot numbers, and verifying expiration dates prior to patient administration.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">5</span>
              <span>Clinical Disclaimer & Limitation of Liability</span>
            </h2>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Not a Substitute for Independent Clinical Judgment</span>
              </div>
              <p>
                MissionRx is an inventory tracking software tool. It does not provide medical diagnoses, prescribe treatments, or substitute for licensed medical evaluation or independent prescription verification. System providers shall not be held liable for clinical dosing errors or physical inventory miscounts resulting from inaccurate user data entries.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">6</span>
              <span>System Availability & Backup Resilience</span>
            </h2>
            <p>
              MissionRx includes local cache fallbacks for offline resilience. Administrators are advised to create periodic weekly disaster recovery snapshots and download JSON backups via the Admin Portal to ensure compliance continuity.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">7</span>
              <span>Modifications to Terms</span>
            </h2>
            <p>
              System administrators reserve the right to revise these Terms of Service to comply with evolving pharmaceutical regulation standards. Continued use of MissionRx after updates constitutes acceptance of the modified terms.
            </p>
          </section>
        </div>

        {/* Back Link Footer */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black text-amber-800 hover:text-amber-900 bg-white border border-amber-200 px-5 py-3 rounded-2xl shadow-xs hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to MissionRx Main Formulary</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
