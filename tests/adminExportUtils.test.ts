import { describe, it, expect } from 'vitest';
import {
  escapeXml,
  generateReportExcelXml,
  generateReportCSVString,
  generateFormularyExcelXml,
  generateFormularyCSVString,
} from '@/lib/adminExportUtils';
import { InventoryItem } from '@/types/inventory';
import { DispensaryReportEntry, DiscardReportEntry } from '@/lib/stockMath';

describe('Admin Export Utils - escapeXml', () => {
  it('escapes standard XML special characters', () => {
    expect(escapeXml('Amoxicillin & Clavulanate <500mg> "oral" \'capsule\'')).toBe(
      'Amoxicillin &amp; Clavulanate &lt;500mg&gt; &quot;oral&quot; &apos;capsule&apos;'
    );
  });

  it('handles null, undefined, and non-string values gracefully', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(123)).toBe('123');
    expect(escapeXml(0)).toBe('0');
  });

  it('preserves clean clinical medication names', () => {
    expect(escapeXml('Ibuprofen 200mg Tablet')).toBe('Ibuprofen 200mg Tablet');
  });
});

describe('Admin Export Utils - Formulary Generators', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'item-1',
      genericName: 'Amoxicillin & Clavulanate',
      brandName: 'Augmentin "Forte"',
      dosage: '500/125 mg',
      shelfLocation: 'Infectious Disease',
      bottlesAvailable: 5,
      looseUnitsAvailable: 10,
      pillsPerBottle: 20,
      itemType: 'MEDICATION',
      subUnit: 'tablets',
      expirationDate: '2027-01-01',
      lotNumbers: ['LOT-AUG-1', 'LOT-AUG-2'],
    },
  ];

  it('generates well-formed CSV with escaped quotes and BOM', () => {
    const { csv, fileName } = generateFormularyCSVString(mockItems);
    expect(fileName).toMatch(/^mission_rx_formulary_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Category,Generic Name,Brand Name,Dosage');
    expect(csv).toContain('"Augmentin ""Forte"""');
    expect(csv).toContain('"Amoxicillin & Clavulanate"');
    // Total calculation: 5 * 20 + 10 = 110
    expect(csv).toContain(',110,');
  });

  it('generates well-formed XML spreadsheet with escaped XML entities', () => {
    const { xml, fileName } = generateFormularyExcelXml(mockItems);
    expect(fileName).toMatch(/^mission_rx_formulary_\d{4}-\d{2}-\d{2}\.xls$/);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<Workbook');
    expect(xml).toContain('Amoxicillin &amp; Clavulanate');
    expect(xml).toContain('Augmentin &quot;Forte&quot;');
    expect(xml).toContain('<Data ss:Type="Number">110</Data>');
  });
});

describe('Admin Export Utils - Report Generators', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'item-1',
      genericName: 'Amoxicillin',
      dosage: '500 mg Capsule',
      shelfLocation: 'Infectious Disease',
      bottlesAvailable: 10,
      looseUnitsAvailable: 0,
      pillsPerBottle: 100,
      itemType: 'MEDICATION',
      expirationDate: '2027-01-01',
      lotNumbers: ['LOT-1'],
    },
  ];

  it('generates dispensary report CSV and Excel XML', () => {
    const dispensaryLogs: DispensaryReportEntry[] = [
      {
        id: 'disp-1',
        itemGenericName: 'Amoxicillin (500mg)',
        actionType: 'DISPENSE',
        quantityChanged: -30,
        effectiveQty: 30,
        createdAt: '2026-10-01T12:00:00Z',
        lotNumbers: ['LOT-1'],
        userRole: 'STAFF',
      },
    ];

    const { csv, fileName: csvFile } = generateReportCSVString({
      reportSubTab: 'DISPENSARY',
      discardReportLogs: [],
      dispensaryReportLogs: dispensaryLogs,
      items: mockItems,
    });
    expect(csvFile).toContain('mission_rx_dispensary_report_');
    expect(csv).toContain('"DISPENSE"');
    expect(csv).toContain('"-30"');

    const { xml, fileName: xmlFile } = generateReportExcelXml({
      reportSubTab: 'DISPENSARY',
      discardReportLogs: [],
      dispensaryReportLogs: dispensaryLogs,
    });
    expect(xmlFile).toContain('mission_rx_dispensary_report_');
    expect(xml).toContain('<Worksheet ss:Name="Dispensary Report">');
    expect(xml).toContain('Amoxicillin (500mg)');
  });

  it('generates discard / waste disposal report CSV and Excel XML', () => {
    const discardLogs: DiscardReportEntry[] = [
      {
        id: 'disc-1',
        itemGenericName: 'Expired Ciprofloxacin',
        actionType: 'DISCARD',
        quantityChanged: -50,
        effectivePillsDiscarded: 50,
        effectiveBottlesDiscarded: 1,
        createdAt: '2026-10-01T12:00:00Z',
        lotNumbers: ['LOT-EXPIRED'],
        userRole: 'ADMIN',
      },
    ];

    const { csv, fileName: csvFile } = generateReportCSVString({
      reportSubTab: 'DISCARD',
      discardReportLogs: discardLogs,
      dispensaryReportLogs: [],
      items: mockItems,
    });
    expect(csvFile).toContain('mission_rx_waste_disposal_report_');
    expect(csv).toContain('"DISCARD"');
    expect(csv).toContain('"-50"');

    const { xml, fileName: xmlFile } = generateReportExcelXml({
      reportSubTab: 'DISCARD',
      discardReportLogs: discardLogs,
      dispensaryReportLogs: [],
    });
    expect(xmlFile).toContain('mission_rx_waste_disposal_report_');
    expect(xml).toContain('<Worksheet ss:Name="Waste Disposal Log">');
    expect(xml).toContain('Expired Ciprofloxacin');
  });
});
