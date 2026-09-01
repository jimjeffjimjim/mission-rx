# Library & Utilities Guide

## Structure
- `medicalKnowledge.ts` — Medical search & openFDA lookup. NOTE: Static dataset is stored in `@/data/medicalKnowledge.json`.
- `specialtyColors.ts` — Color mapping for pharmacy specialties/categories.
- `stockMath.ts` — Calculates total quantity, expiry flags, and stock health.
- `ndcLookup.ts` — FDA NDC API query and parser.
- `lasa.ts` — Look-Alike Sound-Alike drug safety check.
- `spreadsheetFormulary.ts` — Excel import parser.
- `prisma.ts` — Prisma client singleton.
- `supabase.ts` — Supabase client configuration.

## Conventions
- Large static datasets MUST live in `data/*.json` and be imported into TS utilities to prevent context bloat.
