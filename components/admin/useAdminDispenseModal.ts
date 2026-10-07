'use client';

import { useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { calculateTotalUnits } from '@/lib/stockMath';

export function useAdminDispenseModal({
  onOpenDiscardModal,
  onDiscardStock,
  onDeleteItem,
  onOpenCreateEquipmentModal,
  onOpenCreateModal,
}: {
  onOpenDiscardModal?: (item: InventoryItem) => void;
  onDiscardStock?: (params: {
    itemId: string;
    lotNumber?: string;
    bottlesToDiscard?: number;
    looseUnitsToDiscard?: number;
    discardAll?: boolean;
    reason?: string;
  }) => Promise<void> | void;
  onDeleteItem?: (id: string) => void;
  onOpenCreateEquipmentModal?: () => void;
  onOpenCreateModal: (defaultItem?: Partial<InventoryItem>) => void;
}) {
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseItem, setDispenseItem] = useState<InventoryItem | null>(null);
  const [dispenseModalMode, setDispenseModalMode] = useState<'units' | 'bottles'>('units');
  const [dispenseModalTab, setDispenseModalTab] = useState<'dispense' | 'restock' | 'undispense'>('dispense');

  const handleOpenDispenseModal = (
    item: InventoryItem,
    mode: 'units' | 'bottles',
    tab: 'dispense' | 'restock' | 'undispense'
  ) => {
    setDispenseItem(item);
    setDispenseModalMode(mode);
    setDispenseModalTab(tab);
    setDispenseModalOpen(true);
  };

  const handleDumpExpired = (item: InventoryItem) => {
    if (onOpenDiscardModal) {
      onOpenDiscardModal(item);
      return;
    }
    const currentTotal = calculateTotalUnits(
      item.bottlesAvailable || 0,
      item.pillsPerBottle || 0,
      item.looseUnitsAvailable || 0
    );
    const confirmed = window.confirm(
      `Throw away expired stock for ${item.genericName}?\n\nCurrent stock: ${
        item.bottlesAvailable || 0
      } ${item.stockUnit || 'bottles'} + ${
        item.looseUnitsAvailable || 0
      } loose (${currentTotal} ${item.subUnit || 'units'}).\n\nThis will clear lot numbers, clear expiration date, and set pills to 0.\nThe medication card will be preserved in the catalog at 0 stock.\nThis does NOT count as dispensed to patients.`
    );
    if (!confirmed) return;
    if (onDiscardStock) {
      onDiscardStock({
        itemId: item.id,
        discardAll: true,
        reason: '[EXPIRED / WASTE]: Full stock discard approved via quick dump action',
      });
    } else if (onDeleteItem) {
      onDeleteItem(item.id);
    }
  };

  const handleOpenCreateEquipment = () => {
    if (onOpenCreateEquipmentModal) {
      onOpenCreateEquipmentModal();
      return;
    }
    onOpenCreateModal({
      genericName: '',
      brandName: '',
      dosage: 'Medical Supply / Device',
      shelfLocation: 'Supplies',
      itemType: 'Supply',
      stockUnit: 'Units',
      subUnit: 'pieces',
      pillsPerBottle: 1,
      expirationDate: '3000-01-01',
      bottlesAvailable: 1,
      looseUnitsAvailable: 0,
      lotNumbers: [],
      directions: 'Medical device / clinical supply for patient care.',
    });
  };

  return {
    dispenseModalOpen,
    setDispenseModalOpen,
    dispenseItem,
    setDispenseItem,
    dispenseModalMode,
    dispenseModalTab,
    setDispenseModalTab,
    handleOpenDispenseModal,
    handleDumpExpired,
    handleOpenCreateEquipment,
  };
}
