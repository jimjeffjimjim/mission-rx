'use client';

import React, { useState, useMemo } from 'react';
import { InventoryItem, FilterCategory, DispenseLog } from '@/types/inventory';
import { exportFormularyExcel, exportFormularyCSV } from '@/lib/adminExportUtils';

import AdminStatsHeader from './admin/AdminStatsHeader';
import AdminMedicationTable from './admin/AdminMedicationTable';
import AdminEquipmentTab from './admin/AdminEquipmentTab';
import AdminUsageAnalytics from './admin/AdminUsageAnalytics';
import AdminBackupsTab from './admin/AdminBackupsTab';
import AdminModalsContainer from './admin/AdminModalsContainer';
import { useAdminBackups } from './admin/useAdminBackups';
import { useAdminAnalytics } from './admin/useAdminAnalytics';
import { useAdminInventoryFilter } from './admin/useAdminInventoryFilter';
import { useAdminTestingMode } from './admin/useAdminTestingMode';
import { useAdminDispenseModal } from './admin/useAdminDispenseModal';

interface AdminPortalProps {
  items: InventoryItem[];
  onUpdateStock: (id: string, newBottles: number, newLoose: number) => void;
  onAdjustStock?: (id: string, bottleDelta: number, looseDelta: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onDiscardStock?: (params: {
    itemId: string;
    lotNumber?: string;
    bottlesToDiscard?: number;
    looseUnitsToDiscard?: number;
    discardAll?: boolean;
    reason?: string;
  }) => Promise<void> | void;
  onOpenDiscardModal?: (item: InventoryItem) => void;
  onOpenCreateModal: (defaultItem?: Partial<InventoryItem>) => void;
  onOpenCreateEquipmentModal?: () => void;
  onEditEquipmentItem?: (item: InventoryItem) => void;
  onOpenAuditLogs?: (searchQuery?: string) => void;
  onOpenPhysicalAuditModal?: () => void;
  onRefreshData?: () => void;
  userRole?: string;
  isReadOnly?: boolean;
  onAddTestAuditLog?: (log: DispenseLog) => void;
}

export default function AdminPortal({
  items,
  onUpdateStock,
  onAdjustStock,
  onEditItem,
  onDeleteItem,
  onDiscardStock,
  onOpenDiscardModal,
  onOpenCreateModal,
  onOpenCreateEquipmentModal,
  onEditEquipmentItem,
  onOpenAuditLogs,
  onOpenPhysicalAuditModal,
  onRefreshData,
  userRole = 'ADMIN',
  isReadOnly = false,
  onAddTestAuditLog,
}: AdminPortalProps) {
  const isReadOnlyMode = Boolean(isReadOnly || userRole === 'VIEWER');
  const [activeTab, setActiveTab] = useState<'TABLE' | 'EQUIPMENT' | 'USAGE' | 'BACKUPS'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [equipmentSubFilter, setEquipmentSubFilter] = useState<'ALL' | 'DIAGNOSTIC' | 'SURGICAL' | 'CONSUMABLES'>('ALL');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING'>('ALL');
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [detailedLogItem, setDetailedLogItem] = useState<any>(null);
  const [bottleMenuItemId, setBottleMenuItemId] = useState<string | null>(null);
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);

  // Modular custom hooks
  const backupsState = useAdminBackups({ activeTab, items, onRefreshData });
  const analyticsState = useAdminAnalytics({ activeTab, userRole, onRefreshData });
  const testingState = useAdminTestingMode({
    onRefreshData,
    fetchAnalytics: analyticsState.fetchAnalytics,
    timeframe: analyticsState.timeframe,
    activeTab,
    requireDeveloper: analyticsState.requireDeveloper,
    setAnalyticsLogs: analyticsState.setAnalyticsLogs,
    setTopDispensed: analyticsState.setTopDispensed,
  });

  const dispenseState = useAdminDispenseModal({
    onOpenDiscardModal,
    onDiscardStock,
    onDeleteItem,
    onOpenCreateEquipmentModal,
    onOpenCreateModal,
  });

  const displayItems = testingState.isLocalTestMode
    ? items.map((item) => {
        const testVal = testingState.testItemsMap[item.id];
        return testVal ? { ...item, bottlesAvailable: testVal.bottles, looseUnitsAvailable: testVal.loose } : item;
      })
    : items;

  const filterState = useAdminInventoryFilter({
    displayItems,
    searchQuery,
    selectedCategory,
    adminStatusFilter,
    equipmentSearchQuery,
    equipmentSubFilter,
  });

  const displayTopDispensed = useMemo(() => {
    if (!testingState.isTestingMode || testingState.testSimulatedLogs.length === 0) {
      return analyticsState.topDispensed;
    }
    const map = new Map<string, { genericName: string; totalDispensed: number; category: string }>();
    analyticsState.topDispensed.forEach((item) => map.set(item.genericName.toLowerCase().trim(), { ...item }));
    testingState.testSimulatedLogs.forEach((log) => {
      const key = log.genericName.toLowerCase().trim();
      if (map.has(key)) {
        map.get(key)!.totalDispensed += log.quantity;
      } else {
        map.set(key, { genericName: log.genericName, totalDispensed: log.quantity, category: log.category || 'General Medical' });
      }
    });
    return Array.from(map.values()).filter((i) => i.totalDispensed > 0).sort((a, b) => b.totalDispensed - a.totalDispensed);
  }, [analyticsState.topDispensed, testingState.isTestingMode, testingState.testSimulatedLogs]);

  const maxDispensed = displayTopDispensed.length > 0 ? displayTopDispensed[0].totalDispensed : 1;

  return (
    <div className="space-y-6 pb-16 select-none max-w-full overflow-x-hidden">
      <AdminStatsHeader
        totalMedications={displayItems.length}
        equipmentTotalCount={filterState.equipmentTotalCount}
        lowStockCount={filterState.lowStockCount}
        expiringCount={filterState.expiringCount}
        totalBottles={filterState.totalBottles}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminStatusFilter={adminStatusFilter}
        setAdminStatusFilter={setAdminStatusFilter}
        isReadOnlyMode={isReadOnlyMode}
        isTestingMode={testingState.isTestingMode}
        setIsTestingMode={testingState.setIsTestingMode}
        isResettingInventory={testingState.isResettingInventory}
        handleResetInventoryToStart={testingState.handleResetInventoryToStart}
        handleClearAuditLogs={testingState.handleClearAuditLogs}
        handleExportFormularyExcel={() => exportFormularyExcel(displayItems)}
        handleExportFormularyCSV={() => exportFormularyCSV(displayItems)}
        handleOpenCreateEquipment={dispenseState.handleOpenCreateEquipment}
        onOpenCreateModal={onOpenCreateModal}
        onOpenAuditLogs={onOpenAuditLogs}
        onOpenPhysicalAuditModal={onOpenPhysicalAuditModal}
        setIsSpreadsheetModalOpen={setIsSpreadsheetModalOpen}
        setIsSpecialtyModalOpen={setIsSpecialtyModalOpen}
        onExitTestingMode={testingState.handleExitTestingMode}
        isDeveloper={analyticsState.isDeveloper}
      />

      {activeTab === 'TABLE' && (
        <AdminMedicationTable
          items={filterState.filteredItems}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          adminStatusFilter={adminStatusFilter}
          setAdminStatusFilter={setAdminStatusFilter}
          lowStockCount={filterState.lowStockCount}
          expiringCount={filterState.expiringCount}
          handleExportFormularyExcel={() => exportFormularyExcel(displayItems)}
          handleExportFormularyCSV={() => exportFormularyCSV(displayItems)}
          isReadOnlyMode={isReadOnlyMode}
          bottleMenuItemId={bottleMenuItemId}
          setBottleMenuItemId={setBottleMenuItemId}
          onOpenDispenseModal={dispenseState.handleOpenDispenseModal}
          onDumpExpired={dispenseState.handleDumpExpired}
          onAdjustStock={onAdjustStock}
          onUpdateStock={onUpdateStock}
          onOpenAuditLogs={onOpenAuditLogs}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      )}

      {activeTab === 'EQUIPMENT' && (
        <AdminEquipmentTab
          equipmentItems={filterState.equipmentItems}
          equipmentSearchQuery={equipmentSearchQuery}
          setEquipmentSearchQuery={setEquipmentSearchQuery}
          equipmentSubFilter={equipmentSubFilter}
          setEquipmentSubFilter={setEquipmentSubFilter}
          handleOpenCreateEquipment={dispenseState.handleOpenCreateEquipment}
          isReadOnlyMode={isReadOnlyMode}
          onOpenDispenseModal={dispenseState.handleOpenDispenseModal}
          onDumpExpired={dispenseState.handleDumpExpired}
          onAdjustStock={onAdjustStock}
          onUpdateStock={onUpdateStock}
          onOpenAuditLogs={onOpenAuditLogs}
          onEditEquipmentItem={onEditEquipmentItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      )}

      {activeTab === 'USAGE' && (
        <AdminUsageAnalytics
          timeframe={analyticsState.timeframe}
          setTimeframe={analyticsState.setTimeframe}
          loadingAnalytics={analyticsState.loadingAnalytics}
          fetchAnalytics={analyticsState.fetchAnalytics}
          displayTopDispensed={displayTopDispensed}
          maxDispensed={maxDispensed}
          dispensaryReportLogs={analyticsState.dispensaryReportLogs}
          discardReportLogs={analyticsState.discardReportLogs}
          totalPillsDiscarded={analyticsState.totalPillsDiscarded}
          totalBottlesDiscarded={analyticsState.totalBottlesDiscarded}
          reportSubTab={analyticsState.reportSubTab}
          setReportSubTab={analyticsState.setReportSubTab}
          items={displayItems}
          isReadOnlyMode={isReadOnlyMode}
          isTestingMode={testingState.isTestingMode}
          isDeveloper={analyticsState.isDeveloper}
          requireDeveloper={analyticsState.requireDeveloper}
          onEditDispenseItem={(item) => {
            analyticsState.setEditingDispenseItem(item);
            analyticsState.setNewDispenseAmt(item.totalDispensed);
            analyticsState.setIsDispenseWarningOpen(true);
          }}
          onViewDetailedLog={(item) => {
            setDetailedLogItem(item);
            setDetailedModalOpen(true);
          }}
          onOpenReportLogEdit={analyticsState.handleOpenReportLogEdit}
          onDeleteReportLog={analyticsState.handleDeleteReportLog}
        />
      )}

      {activeTab === 'BACKUPS' && (
        <AdminBackupsTab
          state={backupsState}
          isReadOnlyMode={isReadOnlyMode}
          isTestingMode={testingState.isTestingMode}
        />
      )}

      <AdminModalsContainer
        isReadOnlyMode={isReadOnlyMode}
        isSpecialtyModalOpen={isSpecialtyModalOpen}
        setIsSpecialtyModalOpen={setIsSpecialtyModalOpen}
        isSpreadsheetModalOpen={isSpreadsheetModalOpen}
        setIsSpreadsheetModalOpen={setIsSpreadsheetModalOpen}
        dispenseState={dispenseState}
        testingState={testingState}
        analyticsState={analyticsState}
        onAddTestAuditLog={onAddTestAuditLog}
        onUpdateStock={onUpdateStock}
        userRole={userRole}
        onRefreshData={onRefreshData}
        detailedModalOpen={detailedModalOpen}
        setDetailedModalOpen={setDetailedModalOpen}
        detailedLogItem={detailedLogItem}
        setDetailedLogItem={setDetailedLogItem}
      />
    </div>
  );
}
