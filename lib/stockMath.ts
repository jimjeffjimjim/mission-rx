/**
 * Utility functions for converting Total Stock Units to Sealed Containers and Loose Units.
 */

export interface StockBreakdown {
  bottles: number;
  loose: number;
}

/**
 * Calculates total units given bottles, packSize, and loose units.
 */
export function calculateTotalUnits(bottles: number, packSize: number, loose: number): number {
  const b = Math.max(0, Number(bottles) || 0);
  const p = Math.max(0, Number(packSize) || 0);
  const l = Math.max(0, Number(loose) || 0);
  return (b * p) + l;
}

/**
 * Converts a desired total unit amount into full sealed containers and loose units.
 * If total units decrease or increase, this automatically adjusts bottles and loose units.
 */
export function convertTotalUnitsToStock(totalUnits: number, packSize: number): StockBreakdown {
  const safeTotal = Math.max(0, Math.round(Number(totalUnits) || 0));
  const safePack = Math.max(0, Math.round(Number(packSize) || 0));

  if (safePack <= 0) {
    return { bottles: 0, loose: safeTotal };
  }

  const bottles = Math.floor(safeTotal / safePack);
  const loose = safeTotal % safePack;

  return { bottles, loose };
}

/**
 * Generates the standardized canonical display name for a formulary item,
 * preventing duplicate keys or split names (e.g. "Clotrimazole Cream" vs "Clotrimazole Cream (1oz, cream)").
 */
export function getStandardItemName(genericName?: string | null, dosage?: string | null): string {
  const gName = (genericName || '').trim();
  const dStr = (dosage || '').trim();
  if (!dStr || dStr.toLowerCase() === 'n/a') {
    return gName || 'Medication Formulation';
  }
  if (gName.toLowerCase().includes(dStr.toLowerCase())) {
    return gName;
  }
  return `${gName} (${dStr})`;
}

/**
 * Universal lot number parser that safely extracts string lot numbers from:
 * - string arrays: ["22B0567", "LOT-441"]
 * - JSON strings: '["22B0567", "LOT-441"]'
 * - comma-separated strings: '22B0567, LOT-441'
 * - structured LotEntry objects: [{ lotNumber: "22B0567", expirationDate: "2026-12-31" }]
 */
export function parseLotNumbers(rawLots: any): string[] {
  if (!rawLots) return [];
  if (Array.isArray(rawLots)) {
    return rawLots
      .map((item) => (typeof item === 'object' && item && item.lotNumber ? item.lotNumber : String(item)))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof rawLots === 'string') {
    const trimmed = rawLots.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === 'object' && item && item.lotNumber ? item.lotNumber : String(item)))
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch (e) {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
