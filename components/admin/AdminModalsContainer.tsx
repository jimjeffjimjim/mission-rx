'use client';

import React from 'react';
import SpecialtyManagerModal from '@/components/SpecialtyManagerModal';
import SpreadsheetImportModal from '@/components/SpreadsheetImportModal';
import AdminDispenseModal from './AdminDispenseModal';
import AdminDispenseWarningModal from './AdminDispenseWarningModal';
import AdminDetailedLogModal from './AdminDetailedLogModal';
import AdminReportLogEditModal from './AdminReportLogEditModal';
import { useAdminDispenseModal } from './useAdminDispenseModal';
import { useAdminTestingMode } from './useAdminTestingMode';
import { useAdminAnalytics } from './useAdminAnalytics';

export interface AdminModalsContainerProps {
  isReadOnlyMode: boolean;
  isSpecialtyModalOpen: boolean;
  setIsSpecialtyModalOpen: (v: boolean) => void;
  isSpreadsheetModalOpen: boolean;
  setIsSpreadsheetModalOpen: (v: boolean) => void;
  dispenseState: ReturnType<typeof useAdminDispenseModal>;
  testingState: ReturnType<typeof useAdminTestingMode>;
  analyticsState: ReturnType<typeof useAdminAnalytics>;
  onAddTestAuditLog?: (log: any) => void;
  onUpdateStock: (id: string, bottles: number, loose: number) => void;
  userRole?: string;
  onRefreshData?: () => void;
  detailedModalOpen: boolean;
  setDetailedModalOpen: (v: boolean) => void;
  detailedLogItem: any;
  setDetailedLogItem: (v: any) => void;
}

export default function AdminModalsContainer({
  isReadOnlyMode,
  isSpecialtyModalOpen,
  setIsSpecialtyModalOpen,
  isSpreadsheetModalOpen,
  setIsSpreadsheetModalOpen,
  dispenseState,
  testingState,
  analyticsState,
  onAddTestAuditLog,
  onUpdateStock,
  userRole,
  onRefreshData,
  detailedModalOpen,
  setDetailedModalOpen,
  detailedLogItem,
  setDetailedLogItem,
}: AdminModalsContainerProps) {
  return (
    <>
      {/* Specialty and Category Colors Management Modal */}
      {isSpecialtyModalOpen && !isReadOnlyMode && (
        <SpecialtyManagerModal
          isOpen={isSpecialtyModalOpen}
          onClose={() => setIsSpecialtyModalOpen(false)}
          onSpecialtiesUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Bulk Spreadsheet Import Modal */}
      {isSpreadsheetModalOpen && !isReadOnlyMode && (
        <SpreadsheetImportModal
          isOpen={isSpreadsheetModalOpen}
          onClose={() => setIsSpreadsheetModalOpen(false)}
          onImportComplete={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Dispense, Restock & Undispense Pop-Up Modal */}
      <AdminDispenseModal
        isOpen={Boolean(
          dispenseState.dispenseModalOpen &&
            dispenseState.dispenseItem &&
            !isReadOnlyMode
        )}
        dispenseItem={dispenseState.dispenseItem}
        onClose={() => {
          dispenseState.setDispenseModalOpen(false);
          dispenseState.setDispenseItem(null);
        }}
        dispenseModalTab={dispenseState.dispenseModalTab}
        setDispenseModalTab={dispenseState.setDispenseModalTab}
        dispenseModalMode={dispenseState.dispenseModalMode}
        isTestingMode={testingState.isTestingMode}
        setTestItemsMap={testingState.setTestItemsMap}
        setTestSimulatedLogs={testingState.setTestSimulatedLogs}
        onAddTestAuditLog={onAddTestAuditLog}
        onUpdateStock={onUpdateStock}
        userRole={userRole}
        onRefreshData={onRefreshData}
        onDumpExpired={dispenseState.handleDumpExpired}
      />

      {/* Warning Confirmation Pop-up Dialog for Editing Total Amount Dispensed */}
      <AdminDispenseWarningModal
        isOpen={Boolean(
          analyticsState.isDispenseWarningOpen &&
            analyticsState.editingDispenseItem
        )}
        editingDispenseItem={analyticsState.editingDispenseItem}
        newDispenseAmt={analyticsState.newDispenseAmt}
        setNewDispenseAmt={analyticsState.setNewDispenseAmt}
        savingDispenseEdit={analyticsState.savingDispenseEdit}
        onCancel={() => {
          analyticsState.setIsDispenseWarningOpen(false);
          analyticsState.setEditingDispenseItem(null);
        }}
        onConfirm={analyticsState.handleConfirmDispenseEdit}
      />

      {/* Detailed Dispense Audit Modal Pop-up */}
      <AdminDetailedLogModal
        isOpen={Boolean(detailedModalOpen && detailedLogItem)}
        logItem={detailedLogItem}
        onClose={() => {
          setDetailedModalOpen(false);
          setDetailedLogItem(null);
        }}
      />

      {/* Developer Report Record Revision Modal */}
      <AdminReportLogEditModal
        editingReportLog={analyticsState.editingReportLog}
        setEditingReportLog={analyticsState.setEditingReportLog}
        reportLogItemName={analyticsState.reportLogItemName}
        setReportLogItemName={analyticsState.setReportLogItemName}
        reportLogAction={analyticsState.reportLogAction}
        setReportLogAction={analyticsState.setReportLogAction}
        reportLogLots={analyticsState.reportLogLots}
        setReportLogLots={analyticsState.setReportLogLots}
        reportLogQty={analyticsState.reportLogQty}
        setReportLogQty={analyticsState.setReportLogQty}
        reportLogBottles={analyticsState.reportLogBottles}
        setReportLogBottles={analyticsState.setReportLogBottles}
        reportLogDetails={analyticsState.reportLogDetails}
        setReportLogDetails={analyticsState.setReportLogDetails}
        savingReportEdit={analyticsState.savingReportEdit}
        onConfirmReportLogEdit={analyticsState.handleConfirmReportLogEdit}
      />
    </>
  );
}
