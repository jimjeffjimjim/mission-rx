'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldCheck, AlertTriangle, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
              <span>Medical Inventory Terms & Liability Protections</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">MissionRx Terms of Service</h1>
            <p className="text-sm sm:text-base text-amber-100/90 font-medium max-w-2xl">
              Binding terms of use, comprehensive liability waivers, creator/administrator indemnification, and clinical discretion mandates for MissionRx.
            </p>
            <div className="pt-2 text-xs font-bold text-amber-200/80 flex items-center gap-4">
              <span>Effective Date: August 2026</span>
              <span>•</span>
              <span>Version 2.5 (Ironclad Legal Edition)</span>
            </div>
          </div>
        </div>

        {/* Highlighted Absolute Liability Protection Banner */}
        <div className="bg-rose-950 border-2 border-rose-600 rounded-3xl p-6 text-rose-100 shadow-xl space-y-3">
          <div className="flex items-center gap-3 text-rose-400">
            <ShieldAlert className="w-8 h-8 shrink-0 stroke-[2.5]" />
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-rose-300">
                CRITICAL NOTICE: ABSOLUTE LIMITATION OF LIABILITY & INDEMNIFICATION
              </h2>
              <p className="text-xs font-bold text-rose-200/90">
                ZERO LIABILITY FOR CREATORS, DEVELOPERS, CLINIC DIRECTORS & SYSTEM ADMINISTRATORS
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-mono">
            BY USING MISSIONRX, ALL USERS, CLINICS, AND MEDICAL PERSONNEL AGREE THAT THE SOFTWARE CREATOR(S), SYSTEM DEVELOPERS, CLINIC DIRECTORS, AND SYSTEM ADMINISTRATORS SHALL HAVE ZERO LEGAL OR FINANCIAL LIABILITY WHATSOEVER FOR ANY CLINICAL DECISIONS, DOSING ERRORS, PHYSICAL INVENTORY MISCOUNTS, EXPIRED MEDICATION DISPENSING, DATA LOSS, OR PATIENT OUTCOMES.
          </p>
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
              By accessing or using the MissionRx Pharmaceutical Inventory Management System ("System"), hospital staff, attending physicians, nurses, pharmacists, clinic directors, and administrators ("Users") unconditionally agree to be bound by these Terms of Service. If you do not agree to every clause herein, you are strictly prohibited from using the system.
            </p>
          </section>

          {/* Section 2 - IRONCLAD LIABILITY WAIVER */}
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-rose-600 text-white text-xs font-black">2</span>
              <span>Zero Liability & Complete Release of Protected Parties</span>
            </h2>
            <p>
              To the maximum extent permitted under applicable law, the Software Creator(s), Lead Developers, System Administrators, Clinic Directors, Clinic Management, and Affiliates (collectively, the <strong>"Protected Parties"</strong>) shall be held completely immune and free from any and all legal, financial, regulatory, civil, or criminal liability arising from the operation, maintenance, or use of MissionRx.
            </p>
            
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono">
              <p className="font-bold text-amber-400 uppercase">A. Complete Disclaimer of Warranties ("AS IS"):</p>
              <p className="text-slate-300">
                THE SYSTEM IS PROVIDED ENTIRELY "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF ACCURACY, RELIABILITY, FITNESS FOR A PARTICULAR CLINICAL PURPOSE, OR UNINTERRUPTED AVAILABILITY.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2 text-xs font-mono">
              <p className="font-bold text-amber-400 uppercase">B. Exclusion of Damages:</p>
              <p className="text-slate-300">
                IN NO EVENT SHALL THE PROTECTED PARTIES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES—INCLUDING BUT NOT LIMITED TO PATIENT INJURY, MEDICAL MALPRACTICE CLAIMS, ADVERSE DRUG REACTIONS, EXPIRED MEDICATION DISPENSING, DOSING ERRORS, PHYSICAL STOCKOUTS, SYSTEM DOWNTIME, OR LOSS OF DATA.
              </p>
            </div>
          </section>

          {/* Section 3 - INDEMNIFICATION & HOLD HARMLESS */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">3</span>
              <span>Mandatory Hold Harmless & Indemnification</span>
            </h2>
            <p>
              All Users, clinics, and medical facilities using MissionRx explicitly covenant and agree to <strong>defend, indemnify, and hold harmless</strong> the Software Creator(s), System Developers, Clinic Directors, and System Administrators against any and all third-party claims, lawsuits, administrative actions, damages, liabilities, settlements, costs, and attorney's fees resulting from:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>Any clinical decision, diagnosis, prescription, or drug administration performed by medical staff.</li>
              <li>Failure by users to physically inspect drug containers, dosages, expiration dates, or lot numbers.</li>
              <li>Incorrect data entry, inventory miscounts, or user typographical errors.</li>
              <li>Unauthorized access resulting from shared PIN credentials, compromised passwords, or unattended workstations.</li>
              <li>Network outages, server downtime, or browser caching delays.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">4</span>
              <span>Clinical Discretion & Physical Verification Mandate</span>
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Auxiliary Tool Notice — 100% Physical Inspection Required</span>
              </div>
              <p>
                MissionRx is strictly an auxiliary stock management tool. It does not provide medical advice or prescribe treatment. Licensed medical personnel assume 100% sole responsibility for physically verifying medication containers, dosing strengths, expiration dates, and patient contraindications prior to administering any drug.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">5</span>
              <span>Workstation PIN Credentials & Lock Mandate</span>
            </h2>
            <p>
              Access is governed by 4-digit PIN credentials (<code>1234</code> Doctor View, <code>8888</code> Admin Control Portal). Users are strictly obligated to click <strong>"Lock"</strong> or close the browser session before leaving any workstation unattended. Sharing PIN codes with unauthorized individuals is grounds for immediate access termination.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">6</span>
              <span>System Availability & Backup Resilience</span>
            </h2>
            <p>
              System administrators should maintain regular weekly disaster recovery snapshots and download JSON backups via the Admin Portal to ensure continuity in the event of local hardware or connectivity disruptions.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">7</span>
              <span>Governing Law & Severability</span>
            </h2>
            <p>
              These Terms shall be governed by and construed under applicable healthcare information systems law. If any provision is deemed unenforceable, the remaining provisions shall remain in full force and effect.
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
