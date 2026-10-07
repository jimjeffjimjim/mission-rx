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
    const act = (log.actionType || '').toUpperCase();
    const detailsLower = (log.details || '').toLowerCase();

    const isAdministrative =
      act === 'AUDIT' ||
      act === 'EDIT' ||
      act === 'CREATE' ||
      act === 'DELETE';

    // Strictly exclude non-dispensary operational logs (EDIT, AUDIT, CREATE, DELETE, DISCARD, EXPIRED WASTE)
    const isDiscard =
      act.includes('DISCARD') ||
      act.includes('EXPIRED') ||
      act.includes('WASTE') ||
      ((!isAdministrative) && (
        detailsLower.includes('waste') ||
        detailsLower.includes('discard') ||
        detailsLower.includes('thrown away') ||
        detailsLower.includes('disposal') ||
        (detailsLower.includes('expired') && !detailsLower.includes('expiration date') && !detailsLower.includes('expiration:'))
      ));

    if (isDiscard || isAdministrative) {
      continue;
    }

    const isUndispense =
      act === 'UNDISPENSE' ||
      (detailsLower.includes('undispensed') && !detailsLower.includes('restocked'));
    const isRestock =
      !isUndispense &&
      (act === 'RESTOCK' || detailsLower.includes('restocked'));
    const isDispense =
      !isUndispense &&
      !isRestock &&
      !isDiscard &&
      !isAdministrative &&
      (act === 'DISPENSE' || act === 'DISPENSE_BOTTLE' || (Number(log.quantityChanged) < 0));

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
        const hasValidId = Boolean(
          log.itemId && prev.itemId && log.itemId !== 'unknown' && log.itemId !== 'test-item' && prev.itemId !== 'unknown' && prev.itemId !== 'test-item'
        );
        const idMatches = hasValidId && log.itemId === prev.itemId;
        const baseLog = logMedName.replace(/\s*\([^)]*\)/g, '').trim();
        const basePrev = prevMedName.replace(/\s*\([^)]*\)/g, '').trim();

        // Do not net if both logs have distinct dosage suffixes in parentheses
        const doseLogMatch = logMedName.match(/\(([^)]+)\)/);
        const dosePrevMatch = prevMedName.match(/\(([^)]+)\)/);
        const doseMismatch = Boolean(
          doseLogMatch &&
          dosePrevMatch &&
          doseLogMatch[1].trim().toLowerCase() !== dosePrevMatch[1].trim().toLowerCase()
        );

        const nameMatches = Boolean(
          !doseMismatch &&
          ((logMedName && prevMedName && logMedName === prevMedName) ||
          (baseLog && basePrev && baseLog === basePrev))
        );
        const isMatch = idMatches || nameMatches;

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

export interface DiscardReportEntry extends DispenseLog {
  effectivePillsDiscarded: number;
  effectiveBottlesDiscarded: number;
  discardLotNumber?: string;
  discardExpirationDate?: string;
}

/**
 * Extracts and normalizes all medication and supply discard / expired waste records.
 * Returns records sorted reverse-chronologically (newest first).
 */
export function filterDiscardLogs(rawLogs: DispenseLog[]): DiscardReportEntry[] {
  if (!rawLogs || !Array.isArray(rawLogs) || rawLogs.length === 0) {
    return [];
  }

  const output: DiscardReportEntry[] = [];

  for (const log of rawLogs) {
    const actUpper = (log.actionType || '').toUpperCase();
    const detailsLower = (log.details || '').toLowerCase();

    const isAdministrative =
      actUpper === 'EDIT' ||
      actUpper === 'CREATE' ||
      actUpper === 'DELETE' ||
      (actUpper === 'AUDIT' && !detailsLower.includes('waste') && !detailsLower.includes('expired') && !detailsLower.includes('discard') && !detailsLower.includes('dump'));

    if (isAdministrative) {
      continue;
    }

    if (actUpper === 'RESTOCK' || actUpper === 'UNDISPENSE') {
      continue;
    }

    const isExplicitDiscard = actUpper === 'DISCARD' || actUpper === 'DISCARD_EXPIRED' || actUpper.includes('DISCARD');
    const isWasteOrExpired =
      detailsLower.includes('waste') ||
      detailsLower.includes('discard') ||
      detailsLower.includes('thrown away') ||
      detailsLower.includes('disposal') ||
      (detailsLower.includes('expired') && !detailsLower.includes('expiration date') && !detailsLower.includes('expiration:'));

    if (!isExplicitDiscard && !isWasteOrExpired) {
      continue;
    }

    const rawQty = Math.abs(Number(log.quantityChanged) || 0);
    let bottles = log.dispensedBottles || 0;
    let pills = rawQty;

    // If quantity was logged as 0 in older logs, extract from details string
    if (pills === 0 && log.details) {
      const match = log.details.match(/discarded\s*\(([0-9,]+)\s*(?:tablets|pills|units|tubes|pieces)/i);
      if (match) {
        pills = parseInt(match[1].replace(/,/g, ''), 10) || 0;
      }
      const bMatch = log.details.match(/([0-9,]+)\s*(?:bottles|tubes|boxes|packs)/i);
      if (bMatch) {
        bottles = parseInt(bMatch[1].replace(/,/g, ''), 10) || bottles;
      }
    }

    // Extract lot from log or details
    const lots = parseLotNumbers(log.lotNumbers);
    let lotStr = lots.length > 0 ? lots.join(', ') : '';
    if (!lotStr && log.details) {
      const lMatch = log.details.match(/lot\s*([a-z0-9_-]+)/i);
      if (lMatch) lotStr = lMatch[1];
    }

    output.push({
      ...log,
      actionType: 'DISCARD',
      effectivePillsDiscarded: pills,
      effectiveBottlesDiscarded: bottles,
      lotNumbers: lots.length > 0 ? lots : (lotStr ? [lotStr] : []),
      discardLotNumber: lotStr || undefined,
    });
  }

  return output.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export interface TopDispensedItem {
  genericName: string;
  totalDispensed: number;
  category: string;
}

/**
 * Aggregates net patient dispensing usage across logs:
 * - Strictly counts DISPENSE and DISPENSE_BOTTLE records.
 * - Accurately subtracts UNDISPENSE cancellations.
 * - STRICTLY EXCLUDES discards, expired waste dumps, restocks, audits, edits, creations, deletions.
 * - Returns items sorted descending by total units dispensed to patients.
 */
export function aggregateTopDispensed(logs: DispenseLog[] | any[]): TopDispensedItem[] {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return [];
  }

  const usageMap: { [canonicalKey: string]: { genericName: string; dispensed: number; undispensed: number; category: string } } = {};
  const idToKey = new Map<string, string>();

  logs.forEach((log: any) => {
    const rawName = (log.itemGenericName || 'General Inventory Item').trim();
    const hasValidId = Boolean(
      log.itemId &&
      log.itemId !== 'unknown' &&
      log.itemId !== 'test-item' &&
      log.itemId !== 'new-item'
    );
    const key = hasValidId && idToKey.has(log.itemId)
      ? idToKey.get(log.itemId)!
      : rawName.toLowerCase();

    if (hasValidId && !idToKey.has(log.itemId)) {
      idToKey.set(log.itemId, key);
    }

    if (!usageMap[key]) {
      usageMap[key] = { genericName: rawName, dispensed: 0, undispensed: 0, category: log.category || 'General Medical' };
    }

    const qty = Math.abs(Number(log.quantityChanged) || 0);
    const act = (log.actionType || '').toUpperCase();
    const detailsLower = (log.details || '').toLowerCase();

    const isAdministrative =
      act === 'AUDIT' ||
      act === 'EDIT' ||
      act === 'CREATE' ||
      act === 'DELETE';

    // STRICT DISCARD CHECK: Discarded or expired medications are NEVER counted as patient dispenses!
    const isDiscard =
      act.includes('DISCARD') ||
      act.includes('EXPIRED') ||
      act.includes('WASTE') ||
      ((!isAdministrative) && (
        detailsLower.includes('waste') ||
        detailsLower.includes('discard') ||
        detailsLower.includes('thrown away') ||
        detailsLower.includes('disposal') ||
        (detailsLower.includes('expired') && !detailsLower.includes('expiration date') && !detailsLower.includes('expiration:'))
      ));

    if (isDiscard || isAdministrative) {
      return;
    }

    const isUndispense =
      act === 'UNDISPENSE' ||
      (detailsLower.includes('undispensed') && !detailsLower.includes('restocked'));

    const isRestock =
      act === 'RESTOCK' ||
      detailsLower.includes('restocked');

    if (isUndispense) {
      usageMap[key].undispensed += qty;
    } else if (isRestock) {
      // Restocking adds inventory but does not count as dispensing
      return;
    } else if (act === 'DISPENSE' || act === 'DISPENSE_BOTTLE' || (Number(log.quantityChanged) < 0 && !isDiscard && !isAdministrative)) {
      usageMap[key].dispensed += qty;
    }
  });

  return Object.values(usageMap)
    .map((item) => ({
      genericName: item.genericName,
      totalDispensed: Math.max(0, item.dispensed - item.undispensed),
      category: item.category,
    }))
    .filter((item) => item.totalDispensed > 0)
    .sort((a, b) => b.totalDispensed - a.totalDispensed);
}

export interface DiscardResult {
  updatedItem: InventoryItem;
  totalPillsDiscarded: number;
  bottlesDiscarded: number;
  looseDiscarded: number;
  discardedLotNumber?: string;
  discardedLotExpiration?: string;
  isFullyEmptied: boolean;
}

/**
 * Executes a partial or full stock discard on an inventory item:
 * - If discardAll is true, zeroes out bottles, loose units, lots, and expiration.
 * - If lotNumber is specified, deducts only that lot's bottles and units, removes/updates the lot,
 *   and updates the expiration date to the earliest remaining active lot.
 */
export function applyStockDiscard(
  item: InventoryItem,
  options: {
    lotNumber?: string;
    bottlesToDiscard?: number;
    looseUnitsToDiscard?: number;
    discardAll?: boolean;
  }
): DiscardResult {
  const pSize = Math.max(1, item.pillsPerBottle || 1);
  const currentTotal = calculateTotalUnits(item.bottlesAvailable || 0, pSize, item.looseUnitsAvailable || 0);

  if (options.discardAll || currentTotal === 0) {
    const totalPills = currentTotal;
    const btls = item.bottlesAvailable || 0;
    const loose = item.looseUnitsAvailable || 0;
    const lots = parseLotNumbers(item.lotNumbers);

    return {
      updatedItem: {
        ...item,
        bottlesAvailable: 0,
        looseUnitsAvailable: 0,
        initialBottlesAvailable: 0,
        initialLooseUnitsAvailable: 0,
        lotNumbers: [],
        expirationDate: '',
      },
      totalPillsDiscarded: totalPills,
      bottlesDiscarded: btls,
      looseDiscarded: loose,
      discardedLotNumber: lots.length > 0 ? lots.join(', ') : undefined,
      discardedLotExpiration: item.expirationDate || undefined,
      isFullyEmptied: true,
    };
  }

  // Lot-specific or partial discard
  const currentLots = extractStructuredLots(item);
  let bToDeduct = Math.max(0, options.bottlesToDiscard || 0);
  let lToDeduct = Math.max(0, options.looseUnitsToDiscard || 0);
  const targetLotNum = (options.lotNumber || '').trim();

  // If lotNumber is specified, find that lot
  let discardedLotExp: string | undefined = undefined;
  if (targetLotNum) {
    const matchingLot = currentLots.find(
      (l) => l.lotNumber.toLowerCase().trim() === targetLotNum.toLowerCase()
    );
    if (matchingLot) {
      discardedLotExp = matchingLot.expirationDate;
      // If bottlesToDiscard was not specified, default to discarding this entire lot's stock
      if (bToDeduct === 0 && lToDeduct === 0) {
        bToDeduct = matchingLot.bottles || 0;
        lToDeduct = matchingLot.looseUnits || 0;
      }
    }
  }

  const pillsToDiscard = calculateTotalUnits(bToDeduct, pSize, lToDeduct);
  const newTotalUnits = Math.max(0, currentTotal - pillsToDiscard);
  const { bottles: newBottles, loose: newLoose } = convertTotalUnitsToStock(newTotalUnits, pSize);

  // Update structured lots
  const updatedLots: LotEntry[] = [];
  let remainingBottles = bToDeduct;
  let remainingLoose = lToDeduct;

  currentLots.forEach((lot) => {
    const isTarget = targetLotNum
      ? lot.lotNumber.toLowerCase().trim() === targetLotNum.toLowerCase()
      : true;

    if (isTarget && (remainingBottles > 0 || remainingLoose > 0)) {
      const bSub = Math.min(lot.bottles || 0, remainingBottles);
      const lSub = Math.min(lot.looseUnits || 0, remainingLoose);
      const remB = Math.max(0, (lot.bottles || 0) - bSub);
      const remL = Math.max(0, (lot.looseUnits || 0) - lSub);
      remainingBottles -= bSub;
      remainingLoose -= lSub;

      if (remB > 0 || remL > 0) {
        updatedLots.push({ ...lot, bottles: remB, looseUnits: remL });
      }
      // If the lot reached 0 stock, do NOT push it (it is removed)
    } else {
      updatedLots.push(lot);
    }
  });

  // Calculate new earliest expiration date from the remaining lots
  let newExp = '';
  if (newTotalUnits > 0) {
    if (updatedLots.length > 0) {
      newExp = getEarliestActiveExpiration(updatedLots, item.expirationDate);
    } else {
      newExp = item.expirationDate;
    }
  }

  return {
    updatedItem: {
      ...item,
      bottlesAvailable: newBottles,
      looseUnitsAvailable: newLoose,
      expirationDate: newExp,
      lotNumbers: updatedLots.length > 0 ? updatedLots : (newTotalUnits === 0 ? [] : item.lotNumbers),
    },
    totalPillsDiscarded: pillsToDiscard,
    bottlesDiscarded: bToDeduct,
    looseDiscarded: lToDeduct,
    discardedLotNumber: targetLotNum || undefined,
    discardedLotExpiration: discardedLotExp,
    isFullyEmptied: newTotalUnits === 0,
  };
}

export interface ItemEditChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

export interface ItemEditDiffResult {
  diffString: string;
  changes: ItemEditChange[];
}

/**
 * Compares an inventory item's before and after states and generates an exact, human-readable
 * audit trail diff showing what fields changed from what to what.
 * E.g., "Location: 'Shelf A' -> 'Dental B', Dosage: '10mg' -> '20mg'"
 */
export function generateItemEditDiff(
  before?: Partial<InventoryItem> | null,
  after?: Partial<InventoryItem> | null
): ItemEditDiffResult {
  if (!before && !after) {
    return { diffString: 'No formulation details recorded.', changes: [] };
  }
  if (!before && after) {
    return { diffString: 'Initial item record created.', changes: [] };
  }
  if (before && !after) {
    return { diffString: 'Item formulation record deleted.', changes: [] };
  }

  const b = before!;
  const a = after!;
  const changes: ItemEditChange[] = [];

  const normalizeStr = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
  const displayVal = (v: any) => {
    const s = normalizeStr(v);
    return s ? s.replace(/'/g, '’') : 'None';
  };

  // 1. Location / Shelf Location / Category
  if (a.shelfLocation !== undefined || (a as any).category !== undefined) {
    const bLoc = normalizeStr(b.shelfLocation !== undefined ? b.shelfLocation : (b as any).category);
    const aLoc = normalizeStr(a.shelfLocation !== undefined ? a.shelfLocation : (a as any).category);
    if (bLoc !== aLoc) {
      changes.push({
        field: 'shelfLocation',
        label: 'Location',
        from: displayVal(bLoc),
        to: displayVal(aLoc),
      });
    }
  }

  // 2. Generic Name
  if (a.genericName !== undefined) {
    const bGen = normalizeStr(b.genericName);
    const aGen = normalizeStr(a.genericName);
    if (bGen !== aGen) {
      changes.push({
        field: 'genericName',
        label: 'Generic Name',
        from: displayVal(bGen),
        to: displayVal(aGen),
      });
    }
  }

  // 3. Brand Name
  if (a.brandName !== undefined) {
    const bBrand = normalizeStr(b.brandName);
    const aBrand = normalizeStr(a.brandName);
    if (bBrand !== aBrand) {
      changes.push({
        field: 'brandName',
        label: 'Brand Name',
        from: displayVal(bBrand),
        to: displayVal(aBrand),
      });
    }
  }

  // 3b. Chemical Name
  if (a.chemicalName !== undefined) {
    const bChem = normalizeStr(b.chemicalName);
    const aChem = normalizeStr(a.chemicalName);
    if (bChem !== aChem) {
      changes.push({
        field: 'chemicalName',
        label: 'Chemical Name',
        from: displayVal(bChem),
        to: displayVal(aChem),
      });
    }
  }

  // 4. Dosage Strength
  if (a.dosage !== undefined) {
    const bDosage = normalizeStr(b.dosage);
    const aDosage = normalizeStr(a.dosage);
    if (bDosage !== aDosage) {
      changes.push({
        field: 'dosage',
        label: 'Dosage',
        from: displayVal(bDosage),
        to: displayVal(aDosage),
      });
    }
  }

  // 5. Item Type (Medication, OTC, Supply)
  if (a.itemType !== undefined) {
    const bType = normalizeStr(b.itemType);
    const aType = normalizeStr(a.itemType);
    if (bType !== aType) {
      changes.push({
        field: 'itemType',
        label: 'Item Type',
        from: displayVal(bType),
        to: displayVal(aType),
      });
    }
  }

  // 6. Stock Unit (Bottles, Boxes, Tubes, etc.)
  if (a.stockUnit !== undefined) {
    const bStockUnit = normalizeStr(b.stockUnit);
    const aStockUnit = normalizeStr(a.stockUnit);
    if (bStockUnit !== aStockUnit) {
      changes.push({
        field: 'stockUnit',
        label: 'Stock Unit',
        from: displayVal(bStockUnit),
        to: displayVal(aStockUnit),
      });
    }
  }

  // 7. Sub Unit (pills, tablets, mL, etc.)
  if (a.subUnit !== undefined) {
    const bSubUnit = normalizeStr(b.subUnit);
    const aSubUnit = normalizeStr(a.subUnit);
    if (bSubUnit !== aSubUnit) {
      changes.push({
        field: 'subUnit',
        label: 'Sub Unit',
        from: displayVal(bSubUnit),
        to: displayVal(aSubUnit),
      });
    }
  }

  // 8. Pills Per Bottle (Pack size)
  if (a.pillsPerBottle !== undefined) {
    const bPack = Number(b.pillsPerBottle) || 0;
    const aPack = Number(a.pillsPerBottle) || 0;
    if (bPack !== aPack) {
      changes.push({
        field: 'pillsPerBottle',
        label: 'Pack Size',
        from: String(bPack),
        to: String(aPack),
      });
    }
  }

  // 9. Directions / Clinical Notes
  if (a.directions !== undefined) {
    const bDir = normalizeStr(b.directions);
    const aDir = normalizeStr(a.directions);
    if (bDir !== aDir) {
      changes.push({
        field: 'directions',
        label: 'Directions',
        from: displayVal(bDir),
        to: displayVal(aDir),
      });
    }
  }

  // 10. Expiration Date
  if (a.expirationDate !== undefined) {
    const bExp = normalizeStr(b.expirationDate);
    const aExp = normalizeStr(a.expirationDate);
    if (bExp !== aExp) {
      changes.push({
        field: 'expirationDate',
        label: 'Expiration Date',
        from: displayVal(bExp),
        to: displayVal(aExp),
      });
    }
  }

  // 11. Bottles Available
  if (a.bottlesAvailable !== undefined) {
    const bBottles = Number(b.bottlesAvailable) || 0;
    const aBottles = Number(a.bottlesAvailable) || 0;
    if (bBottles !== aBottles) {
      changes.push({
        field: 'bottlesAvailable',
        label: 'Bottles Stock',
        from: String(bBottles),
        to: String(aBottles),
      });
    }
  }

  // 12. Loose Units Available
  if (a.looseUnitsAvailable !== undefined) {
    const bLoose = Number(b.looseUnitsAvailable) || 0;
    const aLoose = Number(a.looseUnitsAvailable) || 0;
    if (bLoose !== aLoose) {
      changes.push({
        field: 'looseUnitsAvailable',
        label: 'Loose Stock',
        from: String(bLoose),
        to: String(aLoose),
      });
    }
  }

  // 13. Lot Numbers
  if (a.lotNumbers !== undefined) {
    const bLots = parseLotNumbers(b.lotNumbers).sort().join(', ');
    const aLots = parseLotNumbers(a.lotNumbers).sort().join(', ');
    if (bLots !== aLots) {
      changes.push({
        field: 'lotNumbers',
        label: 'Lot Numbers',
        from: displayVal(bLots),
        to: displayVal(aLots),
      });
    }
  }

  if (changes.length === 0) {
    return {
      diffString: 'Updated formulation details (no tracked field changes).',
      changes: [],
    };
  }

  const diffString = changes
    .map((c) => `${c.label}: '${c.from}' -> '${c.to}'`)
    .join(', ');

  return { diffString, changes };
}

/**
 * Safely parses field diffs from an audit log's details string or metadata object.
 * Returns array of ItemEditChange objects for UI rendering.
 */
export function parseItemEditDiff(detailsText?: string, metaDiff?: any): ItemEditChange[] {
  if (Array.isArray(metaDiff) && metaDiff.length > 0) {
    return metaDiff.map((c: any) => ({
      field: String(c.field || 'field'),
      label: String(c.label || c.field || 'Field'),
      from: String(c.from ?? 'None'),
      to: String(c.to ?? 'None'),
    }));
  }

  if (!detailsText || typeof detailsText !== 'string') {
    return [];
  }

  const results: ItemEditChange[] = [];
  // Match patterns like: Label: 'Old' -> 'New'  OR  Label: 'Old' ➔ 'New'  OR  Label: Old -> New
  const regex = /([A-Za-z0-9\s/_-]+):\s*(?:'([^']*)'|"([^"]*)"|([^,'"\n->➔]+))\s*(?:->|➔|-->)\s*(?:'([^']*)'|"([^"]*)"|([^,'"\n|]+))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(detailsText)) !== null) {
    const label = match[1].trim();
    const from = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    const to = (match[5] ?? match[6] ?? match[7] ?? '').trim();

    if (label && (from || to)) {
      results.push({
        field: label.toLowerCase().replace(/[\s/_-]+/g, '_'),
        label,
        from,
        to,
      });
    }
  }

  return results;
}


