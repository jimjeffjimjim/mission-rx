/**
 * Utility functions for converting Total Stock Units to Sealed Containers and Loose Units.
 */
import { InventoryItem, LotEntry, DispenseLog } from '@/types/inventory';

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

/**
 * Evaluates whether a drug or supply formulation is expired.
 * Non-expiring / permanent devices ('3000-01-01', '2099', 'N/A') never expire.
 * If structured lot numbers exist, checks if any unexpired active lot remains.
 */
export function isFormulationExpired(
  expirationDate?: string | null,
  rawLots?: any,
  bottlesAvailable: number = 0,
  looseUnitsAvailable: number = 0
): boolean {
  if (!expirationDate || expirationDate.startsWith('3000') || expirationDate.startsWith('2099') || expirationDate === 'N/A') {
    return false;
  }

  // Parse structured lots if present
  let lots = rawLots;
  if (typeof lots === 'string' && lots.trim().startsWith('[')) {
    try {
      lots = JSON.parse(lots);
    } catch (e) {}
  }

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];

  if (Array.isArray(lots) && lots.length > 0 && typeof lots[0] === 'object') {
    const validLots = lots.filter(
      (l: any) => l && l.expirationDate && !l.expirationDate.startsWith('3000') && !l.expirationDate.startsWith('2099')
    );

    if (validLots.length > 0) {
      // If there is ANY lot that is unexpired and has stock (or if formulation has stock and lot is unexpired)
      const hasUnexpiredStock = validLots.some((l: any) => {
        const lotExp = String(l.expirationDate).slice(0, 10);
        const isNotExpired = lotExp >= todayIso;
        const lotStock = (Number(l.bottles) || 0) + (Number(l.looseUnits) || 0);
        return isNotExpired && (lotStock > 0 || (bottlesAvailable + looseUnitsAvailable) > 0);
      });
      if (hasUnexpiredStock) return false;

      // If all lots are expired
      const allExpired = validLots.every((l: any) => {
        const lotExp = String(l.expirationDate).slice(0, 10);
        return lotExp < todayIso;
      });
      if (allExpired) return true;
    }
  }

  const expIso = String(expirationDate).slice(0, 10);
  return expIso < todayIso;
}

/**
 * Normalizes and extracts structured lot entries from an inventory item,
 * ensuring each lot retains its parent item's expiration date and container size if not explicitly set.
 */
export function extractStructuredLots(item: Partial<InventoryItem>): LotEntry[] {
  let raw = item.lotNumbers;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      raw = JSON.parse(raw);
    } catch (e) {}
  }

  const results: LotEntry[] = [];
  const defaultExp = item.expirationDate && !item.expirationDate.startsWith('3000') && !item.expirationDate.startsWith('2099') && item.expirationDate !== 'N/A'
    ? item.expirationDate
    : undefined;

  const btls = Math.max(0, item.bottlesAvailable || 0);
  const loose = Math.max(0, item.looseUnitsAvailable || 0);
  const packSize = Math.max(0, item.pillsPerBottle || 0);

  if (Array.isArray(raw)) {
    raw.forEach((entry: any) => {
      if (typeof entry === 'object' && entry && (entry.lotNumber || entry.expirationDate)) {
        const lotNum = String(entry.lotNumber || '').trim();
        const exp = entry.expirationDate && !entry.expirationDate.startsWith('3000') && !entry.expirationDate.startsWith('2099') && entry.expirationDate !== 'N/A'
          ? String(entry.expirationDate).slice(0, 10)
          : defaultExp;
        if (lotNum && lotNum !== 'N/A') {
          results.push({
            lotNumber: lotNum,
            expirationDate: exp,
            bottles: Number(entry.bottles) || 0,
            looseUnits: Number(entry.looseUnits) || 0,
          });
        } else if (exp) {
          results.push({
            lotNumber: packSize > 0 ? `Batch (${packSize}ct)` : 'Batch',
            expirationDate: exp,
            bottles: Number(entry.bottles) || btls,
            looseUnits: Number(entry.looseUnits) || loose,
          });
        }
      } else if (typeof entry === 'string' && entry.trim()) {
        const str = entry.trim();
        if (str && str !== 'N/A') {
          results.push({
            lotNumber: str,
            expirationDate: defaultExp,
            bottles: btls,
            looseUnits: loose,
          });
        } else if (defaultExp && (btls > 0 || loose > 0)) {
          results.push({
            lotNumber: packSize > 0 ? `Batch (${packSize}ct)` : 'Batch',
            expirationDate: defaultExp,
            bottles: btls,
            looseUnits: loose,
          });
        }
      }
    });
  } else if (typeof raw === 'string' && raw.trim() && raw.trim() !== 'N/A') {
    raw.split(',').forEach((s) => {
      const lotNum = s.trim();
      if (lotNum && lotNum !== 'N/A') {
        results.push({
          lotNumber: lotNum,
          expirationDate: defaultExp,
          bottles: btls,
          looseUnits: loose,
        });
      }
    });
  }

  // If no lot numbers were parsed but item has an expiration date and stock
  if (results.length === 0 && defaultExp && (btls > 0 || loose > 0)) {
    results.push({
      lotNumber: packSize > 0 ? `Batch (${packSize}ct)` : 'Batch',
      expirationDate: defaultExp,
      bottles: btls,
      looseUnits: loose,
    });
  }

  return results;
}

/**
 * Merges multiple lists of structured lot entries, combining stock for identical lots
 * and ordering by FEFO (First Expired, First Out).
 */
export function mergeStructuredLots(lotsA: LotEntry[], lotsB: LotEntry[]): LotEntry[] {
  const combined = [...lotsA, ...lotsB];
  const map = new Map<string, LotEntry>();

  combined.forEach((entry) => {
    const normLot = entry.lotNumber.toLowerCase().trim();
    const normExp = (entry.expirationDate || '').trim();
    const key = `${normLot}_${normExp}`;

    if (!map.has(key)) {
      map.set(key, { ...entry });
    } else {
      const existing = map.get(key)!;
      existing.bottles = (existing.bottles || 0) + (entry.bottles || 0);
      existing.looseUnits = (existing.looseUnits || 0) + (entry.looseUnits || 0);
    }
  });

  const merged = Array.from(map.values());

  // Sort FEFO (First Expired, First Out)
  merged.sort((a, b) => {
    if (!a.expirationDate && !b.expirationDate) return 0;
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return a.expirationDate.localeCompare(b.expirationDate);
  });

  return merged;
}

/**
 * Derives the earliest active (unexpired) expiration date from a collection of lots,
 * falling back to master item expiration if no valid unexpired lot date exists.
 */
export function getEarliestActiveExpiration(lots: LotEntry[], fallbackExp?: string): string {
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Look for unexpired lot dates
  const unexpired = lots.filter(
    (l) => l.expirationDate && l.expirationDate >= todayIso && !l.expirationDate.startsWith('3000') && !l.expirationDate.startsWith('2099')
  );
  if (unexpired.length > 0) {
    return unexpired[0].expirationDate!;
  }

  // 2. Look for fallback unexpired date
  if (fallbackExp && !fallbackExp.startsWith('3000') && !fallbackExp.startsWith('2099') && fallbackExp !== 'N/A') {
    if (fallbackExp >= todayIso) {
      return fallbackExp;
    }
  }

  // 3. Look for any lot date
  const anyLotExp = lots.filter((l) => l.expirationDate && !l.expirationDate.startsWith('3000') && !l.expirationDate.startsWith('2099'));
  if (anyLotExp.length > 0) {
    return anyLotExp[0].expirationDate!;
  }

  return fallbackExp || '3000-01-01';
}

/**
 * Coordinated formulation consolidation for the Doctor View.
 * Groups identical genericName + dosage + subUnit items into a single card:
 * - Aggregates total available stock across all containers
 * - Accurately sums sealed bottles and loose units
 * - Builds a packaging breakdown (e.g. "6×100, 2×250, 1×500, 1×600")
 * - Merges and preserves every lot number with its expiration date and quantities (FEFO sorted)
 * - Computes the earliest unexpired expiration date
 */
export function consolidateDoctorFormulations(rawCategoryItems: InventoryItem[]): InventoryItem[] {
  const groups = new Map<string, InventoryItem[]>();

  rawCategoryItems.forEach((item) => {
    const key = `${(item.genericName || '').trim().toLowerCase()}_${(item.dosage || '').trim().toLowerCase()}_${(item.subUnit || 'units').trim().toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  const consolidatedList: InventoryItem[] = [];

  groups.forEach((items) => {
    if (items.length === 1) {
      const single = items[0];
      const lots = extractStructuredLots(single);
      const totalUnits = calculateTotalUnits(single.bottlesAvailable || 0, single.pillsPerBottle || 0, single.looseUnitsAvailable || 0);
      consolidatedList.push({
        ...single,
        totalUnits,
        lotNumbers: lots,
        packageSizes: single.pillsPerBottle > 0 ? [single.pillsPerBottle] : [],
        isConsolidated: false,
      });
      return;
    }

    // Multiple container entries for this formulation -> Coordinate into a single card
    const primary = items[0];

    let totalBottles = 0;
    let totalLoose = 0;
    let totalUnits = 0;
    let mergedLots: LotEntry[] = [];
    const sizeMap = new Map<number, number>(); // packSize -> count of bottles
    const brandSet = new Set<string>();
    let bestDirections = primary.directions || '';

    items.forEach((item) => {
      const b = Math.max(0, item.bottlesAvailable || 0);
      const l = Math.max(0, item.looseUnitsAvailable || 0);
      const p = Math.max(0, item.pillsPerBottle || 0);

      totalBottles += b;
      totalLoose += l;
      totalUnits += calculateTotalUnits(b, p, l);

      if (p > 0) {
        sizeMap.set(p, (sizeMap.get(p) || 0) + b);
      }

      if (item.brandName?.trim()) {
        item.brandName.split('/').forEach((bPart) => {
          const trimmed = bPart.trim();
          if (trimmed) brandSet.add(trimmed);
        });
      }

      if (!bestDirections && item.directions?.trim()) {
        bestDirections = item.directions.trim();
      }

      const itemLots = extractStructuredLots(item);
      mergedLots = mergeStructuredLots(mergedLots, itemLots);
    });

    // Package sizes sorted ascending
    const packageSizes = Array.from(sizeMap.keys()).sort((a, b) => a - b);

    // Formatted container breakdown e.g. "6×100, 2×250, 1×500, 1×600"
    const containerBreakdown = packageSizes
      .map((size) => `${sizeMap.get(size)}×${size}`)
      .join(', ');

    // Coordinated Brand Name
    const combinedBrand = brandSet.size > 0 ? Array.from(brandSet).join(' / ') : primary.brandName;

    // Earliest Active FEFO Expiration
    const earliestExp = getEarliestActiveExpiration(mergedLots, primary.expirationDate);

    consolidatedList.push({
      ...primary,
      brandName: combinedBrand,
      directions: bestDirections,
      bottlesAvailable: totalBottles,
      looseUnitsAvailable: totalLoose,
      totalUnits,
      expirationDate: earliestExp,
      lotNumbers: mergedLots,
      packageSizes,
      containerBreakdown,
      isConsolidated: true,
    });
  });

  return consolidatedList;
}

export interface DispensaryReportEntry extends DispenseLog {
  effectiveQty: number;
  isRemoved?: boolean;
}

/**
 * Filters and nets dispense logs specifically for the Dispensary Audit Log Report:
 * 1. Strictly includes only RESTOCK and DISPENSE logs.
 * 2. Strictly excludes administrative / maintenance logs (EDIT, AUDIT, CREATE, DELETE).
 * 3. When an item is UNDISPENSED, it reverses / cancels out the corresponding preceding DISPENSE
 *    record for that medication respectively (netting out), so neither the accidental dispense
 *    nor its undispense reversal clutters this report.
 * 4. Returns records sorted reverse-chronologically (newest first).
 */
export function filterAndNetDispensaryLogs(rawLogs: DispenseLog[]): DispensaryReportEntry[] {
  if (!rawLogs || !Array.isArray(rawLogs) || rawLogs.length === 0) {
    return [];
  }

  // 1. Sort chronologically (oldest to newest) to process transactions in real-time sequence
  const chronologicalLogs = [...rawLogs].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  const outputLogs: DispensaryReportEntry[] = [];

  for (const log of chronologicalLogs) {
    // Strictly exclude non-dispensary operational logs (EDIT, AUDIT, CREATE, DELETE)
    if (
      log.actionType === 'AUDIT' ||
      log.actionType === 'EDIT' ||
      log.actionType === 'CREATE' ||
      log.actionType === 'DELETE'
    ) {
      continue;
    }

    const detailsLower = (log.details || '').toLowerCase();
    const isUndispense =
      log.actionType === 'UNDISPENSE' ||
      (detailsLower.includes('undispensed') && !detailsLower.includes('restocked'));
    const isRestock =
      !isUndispense &&
      (log.actionType === 'RESTOCK' || detailsLower.includes('restocked'));
    const isDispense =
      !isUndispense &&
      !isRestock &&
      (log.actionType === 'DISPENSE' || log.quantityChanged !== 0);

    if (isRestock) {
      const qty = Math.abs(Number(log.quantityChanged) || 0);
      if (qty > 0) {
        outputLogs.push({
          ...log,
          actionType: 'RESTOCK',
          effectiveQty: qty,
        });
      }
    } else if (isDispense) {
      const qty = Math.abs(Number(log.quantityChanged) || 0);
      if (qty > 0) {
        outputLogs.push({
          ...log,
          actionType: 'DISPENSE',
          effectiveQty: qty,
        });
      }
    } else if (isUndispense) {
      let undispenseQty = Math.abs(Number(log.quantityChanged) || 0);
      const logMedName = (log.itemGenericName || '').toLowerCase().trim();

      // Search backward for matching uncancelled dispense of this medication
      for (let i = outputLogs.length - 1; i >= 0; i--) {
        const prev = outputLogs[i];
        if (prev.actionType !== 'DISPENSE' || prev.isRemoved || prev.effectiveQty <= 0) {
          continue;
        }

        const prevMedName = (prev.itemGenericName || '').toLowerCase().trim();
        const isMatch = Boolean(
          (log.itemId && prev.itemId && log.itemId === prev.itemId) ||
          (logMedName && prevMedName && (logMedName === prevMedName || logMedName.startsWith(prevMedName) || prevMedName.startsWith(logMedName)))
        );

        if (isMatch) {
          if (undispenseQty >= prev.effectiveQty) {
            undispenseQty -= prev.effectiveQty;
            prev.effectiveQty = 0;
            prev.isRemoved = true;
          } else {
            prev.effectiveQty -= undispenseQty;
            if (prev.dispensedBottles && prev.dispensedPillsPerBottle) {
              prev.dispensedBottles = Math.max(0, Math.floor(prev.effectiveQty / prev.dispensedPillsPerBottle));
            }
            undispenseQty = 0;
          }

          if (undispenseQty <= 0) break;
        }
      }
      // Note: The UNDISPENSE transaction itself is NOT appended to outputLogs (it cancels out the dispense)
    }
  }

  // Filter out removed / zeroed dispenses and return reverse-chronological order (newest first)
  return outputLogs
    .filter((entry) => !entry.isRemoved && entry.effectiveQty > 0)
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
}


