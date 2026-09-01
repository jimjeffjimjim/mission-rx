# Components Directory Guide

## Structure
- `AdminPortal.tsx` — Mega admin console (user administration, inventory table, reporting, backup/restore, audit logs).
- `AuthGate.tsx` — Wraps app to enforce PIN / Supabase session login.
- `InventoryCard.tsx` — Main card for medications/equipment with batch breakdown, stock progress, and warning badges.
- `FilterBar.tsx` — Sticky search bar, category chips, and sort buttons.
- `*Modal.tsx` — Specialized modal forms:
  - `ItemEditModal.tsx` / `EquipmentEditModal.tsx` — Medication / equipment creation & modification.
  - `PhysicalAuditModal.tsx` — Live count & batch reconciliation.
  - `BarcodeScannerModal.tsx` — Camera-based GS1 / UPC scanning.
  - `DeveloperQrModal.tsx` — QR generation for rapid testing.
  - `SpecialtyManagerModal.tsx` — Custom category management and color schemes.
  - `SpreadsheetImportModal.tsx` — Bulk spreadsheet reconciliation.
  - `AuditLogModal.tsx` — Full audit history drawer.

## Conventions
- Use Tailwind CSS v4 class utilities.
- Modals receive open/close state via props or callbacks.
- Avoid bloating single files when adding isolated features; consider extracting reusable sub-components.
