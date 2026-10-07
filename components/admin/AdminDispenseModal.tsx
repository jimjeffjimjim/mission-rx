'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import {
  calculateTotalUnits,
  convertTotalUnitsToStock,
  parseLotNumbers,
} from '@/lib/stockMath';
import AdminDispenseModalHeader from './AdminDispenseModalHeader';
import AdminDispenseTabContent from './AdminDispenseTabContent';

export interface AdminDispenseModalProps {
  isOpen: boolean;
  dispenseItem: InventoryItem | null;
  onClose: () => void;
  dispenseModalTab: 'dispense' | 'restock' | 'undispense';
  setDispenseModalTab: (tab: 'dispense' | 'restock' | 'undispense') => void;
  dispenseModalMode: 'units' | 'bottles';
  isTestingMode: boolean;
  setTestItemsMap: React.Dispatch<
    React.SetStateAction<Record<string, { bottles: number; loose: number }>>
  >;
  setTestSimulatedLogs: React.Dispatch<
    React.SetStateAction<
      Array<{ genericName: string; quantity: number; category: string }>
    >
  >;
  onAddTestAuditLog?: (log: any) => void;
  onUpdateStock: (id: string, bottles: number, loose: number) => void;
  userRole?: string;
  onRefreshData?: () => void;
  onDumpExpired: (item: InventoryItem) => void;
}

export default function AdminDispenseModal({
  isOpen,
  dispenseItem,
  onClose,
  dispenseModalTab,
  setDispenseModalTab,
  dispenseModalMode,
  isTestingMode,
  setTestItemsMap,
  setTestSimulatedLogs,
  onAddTestAuditLog,
  onUpdateStock,
  userRole,
  onRefreshData,
  onDumpExpired,
}: AdminDispenseModalProps) {
  const [dispenseAmount, setDispenseAmount] = useState<string>('');
  const [restockAmount, setRestockAmount] = useState<string>('');
  const [undispenseAmount, setUndispenseAmount] = useState<string>('');
  const [dispensingAction, setDispensingAction] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDispenseAmount('');
      setRestockAmount('');
      setUndispenseAmount('');
      setDispensingAction(false);
    }
  }, [isOpen, dispenseItem]);

  if (!isOpen || !dispenseItem) return null;

  const isSupply =
    dispenseItem.shelfLocation === 'Supplies' ||
    dispenseItem.itemType === 'Supply';
  const subUOM = dispenseItem.subUnit || (isSupply ? 'pieces' : 'pills');
  const pillsPerBottle = Math.max(1, dispenseItem.pillsPerBottle || 1);
  const currentTotal = calculateTotalUnits(
    dispenseItem.bottlesAvailable || 0,
    pillsPerBottle,
    dispenseItem.looseUnitsAvailable || 0
  );
  const isBottle = dispenseModalMode === 'bottles';
  const itemLots = parseLotNumbers(dispenseItem.lotNumbers);
  const fullName =
    dispenseItem.dosage && dispenseItem.dosage !== 'N/A'
      ? `${dispenseItem.genericName} (${dispenseItem.dosage})`
      : dispenseItem.genericName;

  const handleAction = async (action: 'dispense' | 'restock' | 'undispense') => {
    const rawVal =
      action === 'dispense'
        ? dispenseAmount
        : action === 'restock'
        ? restockAmount
        : undispenseAmount;
    const inputAmt = Math.max(0, parseInt(rawVal, 10) || 0);
    if (inputAmt <= 0) return;

    const pillAmount = isBottle ? inputAmt * pillsPerBottle : inputAmt;
    const bottleAmount = isBottle ? inputAmt : 0;
    if (action === 'dispense' && pillAmount > currentTotal) return;

    setDispensingAction(true);
    try {
      const newTotal =
        action === 'dispense'
          ? Math.max(0, currentTotal - pillAmount)
          : currentTotal + pillAmount;
      const { bottles, loose } = convertTotalUnitsToStock(
        newTotal,
        pillsPerBottle
      );
      const containerDesc = isBottle
        ? `${bottleAmount} ${
            dispenseItem.stockUnit || (isSupply ? 'box(es)' : 'bottle(s)')
          } (${pillAmount} ${subUOM})`
        : `${pillAmount} ${subUOM}`;

      if (isTestingMode) {
        setTestItemsMap((prev) => ({
          ...prev,
          [dispenseItem.id]: { bottles, loose },
        }));
        if (action !== 'restock') {
          const simQty = action === 'dispense' ? pillAmount : -pillAmount;
          setTestSimulatedLogs((prev) => [
            ...prev,
            {
              genericName: fullName,
              quantity: simQty,
              category: dispenseItem.shelfLocation || 'General Medical',
            },
          ]);
        }
        if (onAddTestAuditLog) {
          onAddTestAuditLog({
            id: `test-${action}-${Date.now()}`,
            itemId: dispenseItem.id,
            itemGenericName: fullName,
            quantityChanged: pillAmount,
            actionType: action.toUpperCase(),
            userRole: userRole ? `${userRole} (TEST)` : 'ADMIN (TEST)',
            details: `[TESTING MODE - NOT REAL]: ${action}d ${containerDesc}`,
            isTestMode: true,
            createdAt: new Date().toISOString(),
            dispensedUnit: isBottle ? 'bottle' : 'unit',
            dispensedBottles: bottleAmount,
            dispensedPillsPerBottle: pillsPerBottle,
            lotNumbers: itemLots,
          });
        }
      } else {
        onUpdateStock(dispenseItem.id, bottles, loose);
        const actionLogType =
          action === 'dispense'
            ? 'DISPENSE'
            : action === 'restock'
            ? 'RESTOCK'
            : 'UNDISPENSE';
        const qtyChanged = action === 'dispense' ? -pillAmount : pillAmount;
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: dispenseItem.id,
            itemGenericName: fullName,
            quantityChanged: qtyChanged,
            actionType: actionLogType,
            userRole: userRole || 'ADMIN',
            details:
              action === 'dispense'
                ? `Dispensed ${containerDesc} directly via Backdoor Inventory table.`
                : action === 'restock'
                ? `Restocked ${containerDesc} into ${
                    isSupply ? 'equipment ' : ''
                  }inventory.`
                : `Undispensed ${containerDesc} back into inventory (reversed dispense).`,
            createdAt: new Date().toISOString(),
            dispensedUnit: isBottle ? 'bottle' : 'unit',
            dispensedBottles: bottleAmount,
            dispensedPillsPerBottle: pillsPerBottle,
            lotNumbers: itemLots,
          }),
        }).catch(() => null);
        if (onRefreshData) onRefreshData();
      }
      onClose();
    } finally {
      setDispensingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <AdminDispenseModalHeader
          dispenseItem={dispenseItem}
          dispenseModalTab={dispenseModalTab}
          setDispenseModalTab={setDispenseModalTab}
          currentTotal={currentTotal}
          subUOM={subUOM}
          isSupply={isSupply}
        />

        <AdminDispenseTabContent
          dispenseModalTab={dispenseModalTab}
          dispenseItem={dispenseItem}
          isBottle={isBottle}
          subUOM={subUOM}
          pillsPerBottle={pillsPerBottle}
          currentTotal={currentTotal}
          dispenseAmount={dispenseAmount}
          setDispenseAmount={setDispenseAmount}
          restockAmount={restockAmount}
          setRestockAmount={setRestockAmount}
          undispenseAmount={undispenseAmount}
          setUndispenseAmount={setUndispenseAmount}
          dispensingAction={dispensingAction}
          handleAction={handleAction}
          onDumpExpired={onDumpExpired}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
