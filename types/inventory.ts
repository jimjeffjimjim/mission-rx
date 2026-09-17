export interface LotEntry {
  id?: string;
  lotNumber: string;
  expirationDate?: string;
  bottles?: number;
  looseUnits?: number;
}

export interface InventoryItem {
  id: string;
  shelfLocation: string;
  genericName: string;
  brandName?: string | null;
  chemicalName?: string | null;
  dosage: string;
  itemType: string; // 'Medication' | 'OTC' | 'Supply'
  stockUnit?: string; // 'Bottles' | 'Tubes' | 'Boxes' | 'Vials' | 'Canisters' | 'Packs'
  subUnit?: string; // 'pills' | 'capsules' | 'mL' | 'g' | 'strips' | 'units'
  bottlesAvailable: number;
  pillsPerBottle: number;
  looseUnitsAvailable: number;
  initialBottlesAvailable?: number;
  initialLooseUnitsAvailable?: number;
  expirationDate: string; // YYYY-MM-DD
  lotNumbers: string | string[] | LotEntry[]; // JSON string array or array of strings or LotEntry objects
  directions?: string | null; // Directions / Provider Notes from Excel
  packageSizes?: number[]; // Distinct package sizes if consolidated from multiple container sizes (e.g. [100, 250, 500, 600])
  containerBreakdown?: string; // Formatted packaging summary (e.g. "6×100, 2×250, 1×500, 1×600")
  isConsolidated?: boolean; // Indicates if this card aggregates multiple container entries
  totalUnits?: number; // Pre-calculated total available units across all consolidated containers
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DispenseLog {
  id: string;
  itemId?: string;
  itemGenericName?: string;
  quantityChanged: number;
  actionType: 'DISPENSE' | 'RESTOCK' | 'UNDISPENSE' | 'EDIT' | 'CREATE' | 'DELETE' | 'AUDIT';
  userRole?: string;
  details?: string;
  isTestMode?: boolean;
  createdAt: string;
  dispensedUnit?: 'bottle' | 'unit';
  dispensedBottles?: number;
  dispensedPillsPerBottle?: number;
  lotNumbers?: string[];
}

export type AuthRole = 'LOCKED' | 'STAFF' | 'ADMIN';

export type FilterCategory =
  | 'ALL'
  | 'General Medical'
  | 'Allergy & Asthma'
  | 'Cardiology'
  | 'Dental'
  | 'Dermatology'
  | 'Orthopedics'
  | 'Psychiatry'
  | 'Pulmonology'
  | 'Over-The-Counter (OTC)'
  | 'Supplies';

export type StatusFilter = 'ALL' | 'LOW_STOCK' | 'EXPIRING';
