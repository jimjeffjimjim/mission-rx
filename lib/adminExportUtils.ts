import { InventoryItem } from '@/types/inventory';
import { DispensaryReportEntry, DiscardReportEntry, parseLotNumbers } from '@/lib/stockMath';

export function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function triggerBlobDownload(content: string, mimeType: string, fileName: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generateReportExcelXml({
  reportSubTab,
  discardReportLogs,
  dispensaryReportLogs,
}: {
  reportSubTab: 'DISPENSARY' | 'DISCARD';
  discardReportLogs: DiscardReportEntry[];
  dispensaryReportLogs: DispensaryReportEntry[];
}): { xml: string; fileName: string } {
  const isDiscardReport = reportSubTab === 'DISCARD';
  const fileName = isDiscardReport
    ? `mission_rx_waste_disposal_report_${new Date().toISOString().split('T')[0]}.xls`
    : `mission_rx_dispensary_report_${new Date().toISOString().split('T')[0]}.xls`;

  const rowsXml = (isDiscardReport ? discardReportLogs : dispensaryReportLogs)
    .map((log: any) => {
      const lotArr = parseLotNumbers(log.lotNumbers);
      const lotStr = lotArr.length > 0 ? lotArr.join(', ') : log.discardLotNumber || 'N/A';
      const signedQty = isDiscardReport
        ? `-${log.effectivePillsDiscarded || Math.abs(log.quantityChanged || 0)}`
        : log.actionType === 'DISPENSE'
        ? `-${log.effectiveQty}`
        : `+${log.effectiveQty} (Restocked)`;
      const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : '';

      return `
      <Row ss:Height="20">
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(timeStr)}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(isDiscardReport ? 'DISCARD' : log.actionType)}</Data></Cell>
        <Cell ss:StyleID="DataBold"><Data ss:Type="String">${escapeXml(log.itemGenericName || 'Medication')}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(lotStr)}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(signedQty)}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(log.userRole || 'STAFF')}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(log.details || '')}</Data></Cell>
      </Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="${isDiscardReport ? '#BE123C' : '#0F766E'}" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataBold">
   <Font ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataCenter">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${isDiscardReport ? 'Waste Disposal Log' : 'Dispensary Report'}">
  <Table>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="220"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Column ss:Width="300"/>
   <Row ss:Height="26" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell><Data ss:Type="String">Action</Data></Cell>
    <Cell><Data ss:Type="String">Medication / Item</Data></Cell>
    <Cell><Data ss:Type="String">Lot / Serial #</Data></Cell>
    <Cell><Data ss:Type="String">Quantity Delta</Data></Cell>
    <Cell><Data ss:Type="String">User Role</Data></Cell>
    <Cell><Data ss:Type="String">Audit Details</Data></Cell>
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  return { xml, fileName };
}

export function exportReportExcel(params: {
  reportSubTab: 'DISPENSARY' | 'DISCARD';
  discardReportLogs: DiscardReportEntry[];
  dispensaryReportLogs: DispensaryReportEntry[];
}) {
  try {
    const { xml, fileName } = generateReportExcelXml(params);
    triggerBlobDownload(xml, 'application/vnd.ms-excel;charset=utf-8;', fileName);
  } catch (e) {
    console.error('Excel Report download error:', e);
  }
}

export function generateReportCSVString({
  reportSubTab,
  discardReportLogs,
  dispensaryReportLogs,
  items,
}: {
  reportSubTab: 'DISPENSARY' | 'DISCARD';
  discardReportLogs: DiscardReportEntry[];
  dispensaryReportLogs: DispensaryReportEntry[];
  items: InventoryItem[];
}): { csv: string; fileName: string } {
  const isDiscardReport = reportSubTab === 'DISCARD';
  const fileName = isDiscardReport
    ? `mission_rx_waste_disposal_report_${new Date().toISOString().split('T')[0]}.csv`
    : `mission_rx_dispensary_report_${new Date().toISOString().split('T')[0]}.csv`;

  const csvHeaders = [
    'Date',
    'Action',
    'Medication Name',
    'Lot Number',
    'Quantity Changed',
    'Staff Role',
    'Log Details',
  ];
  const dataList = isDiscardReport ? discardReportLogs : dispensaryReportLogs;
  const dataRows = dataList.map((log: any) => {
    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : '';
    const logName = (log.itemGenericName || '').toLowerCase();
    const corrItem = items.find((i) =>
      Boolean(
        (log.itemId && i.id === log.itemId) ||
          (logName && i.genericName.toLowerCase() === logName) ||
          (logName && logName.startsWith(i.genericName.toLowerCase()))
      )
    );

    const rawLogLots = parseLotNumbers(log.lotNumbers);
    const lotStr =
      rawLogLots.length > 0
        ? rawLogLots.join(', ')
        : log.discardLotNumber || parseLotNumbers(corrItem?.lotNumbers).join(', ') || 'N/A';
    const signedQty = isDiscardReport
      ? `-${log.effectivePillsDiscarded || Math.abs(log.quantityChanged || 0)}`
      : log.actionType === 'RESTOCK'
      ? `+${log.effectiveQty}`
      : `-${log.effectiveQty}`;

    return [
      `"${dateStr}"`,
      `"${isDiscardReport ? 'DISCARD' : log.actionType}"`,
      `"${(log.itemGenericName || 'Medication').replace(/"/g, '""')}"`,
      `"${lotStr.replace(/"/g, '""')}"`,
      `"${signedQty}"`,
      `"${(log.userRole || 'STAFF').replace(/"/g, '""')}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
    ];
  });

  const csv = '\uFEFF' + [csvHeaders.join(','), ...dataRows.map((r) => r.join(','))].join('\n');
  return { csv, fileName };
}

export function exportReportCSV(params: {
  reportSubTab: 'DISPENSARY' | 'DISCARD';
  discardReportLogs: DiscardReportEntry[];
  dispensaryReportLogs: DispensaryReportEntry[];
  items: InventoryItem[];
}) {
  try {
    const { csv, fileName } = generateReportCSVString(params);
    triggerBlobDownload(csv, 'text/csv;charset=utf-8;', fileName);
  } catch (e) {
    console.error('CSV Report download error:', e);
  }
}

export function generateFormularyExcelXml(displayItems: InventoryItem[]): { xml: string; fileName: string } {
  const fileName = `mission_rx_formulary_${new Date().toISOString().split('T')[0]}.xls`;
  const rowsXml = displayItems
    .map((item) => {
      const total = (item.bottlesAvailable || 0) * (item.pillsPerBottle || 1) + (item.looseUnitsAvailable || 0);
      const lots = parseLotNumbers(item.lotNumbers).join(', ') || 'N/A';
      const exp = item.expirationDate || 'N/A';
      return `<Row ss:Height="20">
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(item.shelfLocation || 'General')}</Data></Cell>
        <Cell ss:StyleID="DataBold"><Data ss:Type="String">${escapeXml(item.genericName || '')}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(item.brandName || '')}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(item.dosage || '')}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${item.bottlesAvailable || 0}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${item.looseUnitsAvailable || 0}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${item.pillsPerBottle || 0}</Data></Cell>
        <Cell ss:StyleID="DataBold"><Data ss:Type="Number">${total}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(item.subUnit || 'units')}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(exp)}</Data></Cell>
        <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(lots)}</Data></Cell>
      </Row>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataBold">
   <Font ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataCenter">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Formulary Inventory">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="200"/>
   <Column ss:Width="150"/>
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Row ss:Height="26" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Generic Name</Data></Cell>
    <Cell><Data ss:Type="String">Brand Name</Data></Cell>
    <Cell><Data ss:Type="String">Dosage / Form</Data></Cell>
    <Cell><Data ss:Type="String">Sealed Packs</Data></Cell>
    <Cell><Data ss:Type="String">Loose Units</Data></Cell>
    <Cell><Data ss:Type="String">Units/Pack</Data></Cell>
    <Cell><Data ss:Type="String">Total Units</Data></Cell>
    <Cell><Data ss:Type="String">Unit</Data></Cell>
    <Cell><Data ss:Type="String">Expiration Date</Data></Cell>
    <Cell><Data ss:Type="String">Lot Numbers</Data></Cell>
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  return { xml, fileName };
}

export function exportFormularyExcel(displayItems: InventoryItem[]) {
  try {
    const { xml, fileName } = generateFormularyExcelXml(displayItems);
    triggerBlobDownload(xml, 'application/vnd.ms-excel;charset=utf-8;', fileName);
  } catch (e) {
    console.error('Formulary Excel export error:', e);
  }
}

export function generateFormularyCSVString(displayItems: InventoryItem[]): { csv: string; fileName: string } {
  const fileName = `mission_rx_formulary_${new Date().toISOString().split('T')[0]}.csv`;
  const csvHeaders = [
    'Category',
    'Generic Name',
    'Brand Name',
    'Dosage',
    'Sealed Packs',
    'Loose Units',
    'Units Per Pack',
    'Total Units',
    'Unit Type',
    'Expiration Date',
    'Lot Numbers',
  ];
  const dataRows = displayItems.map((item) => {
    const total = (item.bottlesAvailable || 0) * (item.pillsPerBottle || 1) + (item.looseUnitsAvailable || 0);
    const lots = parseLotNumbers(item.lotNumbers).join('; ');
    return [
      `"${(item.shelfLocation || '').replace(/"/g, '""')}"`,
      `"${(item.genericName || '').replace(/"/g, '""')}"`,
      `"${(item.brandName || '').replace(/"/g, '""')}"`,
      `"${(item.dosage || '').replace(/"/g, '""')}"`,
      item.bottlesAvailable || 0,
      item.looseUnitsAvailable || 0,
      item.pillsPerBottle || 0,
      total,
      `"${(item.subUnit || 'units').replace(/"/g, '""')}"`,
      `"${(item.expirationDate || '').replace(/"/g, '""')}"`,
      `"${lots.replace(/"/g, '""')}"`,
    ];
  });
  const csv = '\uFEFF' + [csvHeaders.join(','), ...dataRows.map((r) => r.join(','))].join('\n');
  return { csv, fileName };
}

export function exportFormularyCSV(displayItems: InventoryItem[]) {
  try {
    const { csv, fileName } = generateFormularyCSVString(displayItems);
    triggerBlobDownload(csv, 'text/csv;charset=utf-8;', fileName);
  } catch (e) {
    console.error('Formulary CSV export error:', e);
  }
}
