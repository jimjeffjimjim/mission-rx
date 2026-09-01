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
  lotNumbers: string | string[]; // JSON string array or array of strings
  directions?: string | null; // Directions / Provider Notes from Excel
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
