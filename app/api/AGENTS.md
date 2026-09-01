# API Routes Guide

## Structure
All backend handlers use Next.js App Router route handlers (`route.ts`):
- `app/api/inventory/` — Main CRUD endpoints for inventory items and batches.
- `app/api/analytics/` — Aggregations, consumption rates, and reporting stats.
- `app/api/backups/` — Database export and restore handlers.
- `app/api/logs/` — Audit logging endpoint.
- `app/api/settings/` — Application-level settings persistence.

## Conventions
- Use standard `NextResponse.json({ ... })` responses.
- Catch errors and return proper HTTP status codes.
- Query database through `@/lib/prisma`.
