<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mission-RX Codebase Map & AI Context Guide

## Tech Stack
- **Framework**: Next.js (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide React icons
- **Database**: SQLite via Prisma ORM (`prisma/schema.prisma`)
- **Auth**: Supabase Auth
- **Deployment**: Netlify

## Directory Responsibilities

- `app/` — App router pages and endpoints:
  - `app/page.tsx` — Main dashboard / inventory browser
  - `app/compliance/` — Compliance & regulatory documentation
  - `app/instructions/` — User workflows & clinical guide
  - `app/privacy/`, `app/terms/` — Legal static pages
  - `app/api/` — Backend Route Handlers (inventory, analytics, backups, logs, settings)

- `components/` — UI components and modals:
  - `components/AdminPortal.tsx` — Full administrative suite (tabs for users, inventory, logs, settings)
  - `components/AuthGate.tsx` — Supabase authentication wrapper & role protection
  - `components/InventoryCard.tsx` — Medication & supply card view
  - `components/FilterBar.tsx` — Category/specialty filtering & search bar
  - `components/*Modal.tsx` — Modals (ItemEdit, EquipmentEdit, PhysicalAudit, BarcodeScanner, DeveloperQr, SpecialtyManager, SpreadsheetImport, AuditLog)

- `lib/` — Business logic & utilities:
  - `lib/medicalKnowledge.ts` — Medical search engine & FDA lookup (data loaded from `@/data/medicalKnowledge.json`)
  - `lib/specialtyColors.ts` — Category/specialty color palette styling & schemes
  - `lib/stockMath.ts` — Expiration tracking, unit math, and stock levels
  - `lib/ndcLookup.ts` — FDA National Drug Code lookup API wrapper
  - `lib/lasa.ts` — Look-Alike Sound-Alike drug safety checks
  - `lib/spreadsheetFormulary.ts` — Excel/spreadsheet import parsing
  - `lib/prisma.ts` — Prisma client instance singleton
  - `lib/supabase.ts` — Supabase client configuration

- `data/` — Static reference datasets (`.json` format to keep TS files lean):
  - `data/medicalKnowledge.json` — 70+ verified clinical drug entries

- `types/` — Global TypeScript definitions:
  - `types/inventory.ts` — Core interfaces (`InventoryItem`, `AuditLogEntry`, etc.)

- `prisma/` — Schema & migrations:
  - `prisma/schema.prisma` — Database schema source of truth
  - `prisma/seed.ts` — Database initial seed script
