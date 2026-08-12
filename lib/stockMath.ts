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
