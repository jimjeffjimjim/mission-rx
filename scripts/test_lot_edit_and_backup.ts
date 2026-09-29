import { parseLotNumbers, filterDiscardLogs } from '../lib/stockMath';

function parseLogDetails(detailsText: string) {
  let details = detailsText || '';
  let dispensedUnit: 'bottle' | 'unit' | null = null;
  let dispensedBottles = 0;
  let dispensedPillsPerBottle = 0;
  let lotNumbers: string[] = [];

  const splitIdx = details.indexOf(' | METADATA: ');
  if (splitIdx !== -1) {
    const metaStr = details.slice(splitIdx + ' | METADATA: '.length);
    details = details.slice(0, splitIdx);
    try {
      const meta = JSON.parse(metaStr);
      dispensedUnit = meta.dispensedUnit || null;
      dispensedBottles = meta.dispensedBottles || 0;
      dispensedPillsPerBottle = meta.dispensedPillsPerBottle || 0;
      lotNumbers = Array.isArray(meta.lotNumbers) ? meta.lotNumbers : [];
    } catch (e) {}
  }
  return { details, dispensedUnit, dispensedBottles, dispensedPillsPerBottle, lotNumbers };
}

console.log('Testing lot update and backup logic...');

// 1. Simulate an existing discard log in DB before edit
const originalLog = {
  id: 'log-test-1',
  item_id: 'item-1',
  item_generic_name: 'Quetiapine Fumarate (300 mg Tablet)',
  quantity_changed: -2400,
  action_type: 'DISCARD',
  user_role: 'ADMIN',
  details: '[EXPIRED / WASTE]: All remaining stock discarded (24 bottles, 2,400 tablets). Lot E244744 • Exp 2026-09-30. | METADATA: {"dispensedUnit":"bottle","dispensedBottles":24,"dispensedPillsPerBottle":100,"lotNumbers":["E244744"]}',
  created_at: new Date().toISOString(),
  lot_numbers: JSON.stringify(['E244744']),
  dispensed_bottles: 24,
  dispensed_unit: 'bottle',
  dispensed_pills_per_bottle: 100,
};

// 2. User edits lot number to 'LOT-NEW-999'
const editPayload = {
  id: 'log-test-1',
  itemGenericName: 'Quetiapine Fumarate (300 mg Tablet)',
  actionType: 'DISCARD',
  quantityChanged: -2400,
  dispensedBottles: 24,
  lotNumbers: ['LOT-NEW-999'],
  details: '[EXPIRED / WASTE]: All remaining stock discarded (24 bottles, 2,400 tablets). Lot E244744 • Exp 2026-09-30.',
};

// Simulate PUT handler logic
const normalizedLots = parseLotNumbers(editPayload.lotNumbers);
let baseDetails = (editPayload.details || '').split(' | METADATA: ')[0].trim();
if (normalizedLots && normalizedLots.length > 0 && /Lot\s+[a-zA-Z0-9_\-]+/i.test(baseDetails)) {
  baseDetails = baseDetails.replace(/Lot\s+[a-zA-Z0-9_\-]+/gi, `Lot ${normalizedLots.join(', ')}`);
}

const metaObj = {
  dispensedUnit: 'bottle',
  dispensedBottles: 24,
  dispensedPillsPerBottle: 100,
  lotNumbers: normalizedLots,
};
const fullDetailsWithMeta = `${baseDetails} | METADATA: ${JSON.stringify(metaObj)}`;

// Updated DB record
const updatedLog = {
  ...originalLog,
  details: fullDetailsWithMeta,
  lot_numbers: JSON.stringify(normalizedLots),
};

console.log('Updated details:', baseDetails);
if (!baseDetails.includes('Lot LOT-NEW-999')) {
  throw new Error('Base details should include new lot number');
}
if (baseDetails.includes('E244744')) {
  throw new Error('Base details should NOT contain old lot number');
}

// 3. Simulate GET logs mapping
const parsedMeta = parseLogDetails(updatedLog.details);
const directLots = parseLotNumbers(updatedLog.lot_numbers);
const resolvedLots = directLots.length > 0 ? directLots : parsedMeta.lotNumbers;

console.log('Resolved lots in GET:', resolvedLots);
if (resolvedLots.length !== 1 || resolvedLots[0] !== 'LOT-NEW-999') {
  throw new Error(`Resolved lots incorrect: ${JSON.stringify(resolvedLots)}`);
}

// 4. Simulate filterDiscardLogs
const discardRows = filterDiscardLogs([
  {
    id: updatedLog.id,
    itemId: updatedLog.item_id,
    itemGenericName: updatedLog.item_generic_name,
    quantityChanged: updatedLog.quantity_changed,
    actionType: updatedLog.action_type as any,
    userRole: updatedLog.user_role,
    details: parsedMeta.details,
    createdAt: updatedLog.created_at,
    dispensedBottles: updatedLog.dispensed_bottles,
    dispensedUnit: updatedLog.dispensed_unit as any,
    dispensedPillsPerBottle: updatedLog.dispensed_pills_per_bottle,
    lotNumbers: resolvedLots,
  }
]);

console.log('Discard row output:', discardRows[0]?.discardLotNumber, discardRows[0]?.lotNumbers);
if (discardRows[0]?.discardLotNumber !== 'LOT-NEW-999') {
  throw new Error('Discard row discardLotNumber should be LOT-NEW-999');
}
if (!discardRows[0]?.lotNumbers.includes('LOT-NEW-999')) {
  throw new Error('Discard row lotNumbers should contain LOT-NEW-999');
}

// 5. Simulate Backup Snapshot serialization
const backupLogs = [
  {
    id: updatedLog.id,
    itemId: updatedLog.item_id,
    itemGenericName: updatedLog.item_generic_name,
    quantityChanged: updatedLog.quantity_changed,
    actionType: updatedLog.action_type,
    userRole: updatedLog.user_role,
    details: parsedMeta.details,
    createdAt: updatedLog.created_at,
    lotNumbers: resolvedLots,
    dispensedBottles: 24,
    dispensedUnit: 'bottle',
    dispensedPillsPerBottle: 100,
  }
];

const backupSnapshot = JSON.stringify(backupLogs);
const restoredLogsFromBackup = JSON.parse(backupSnapshot);

console.log('Restored log from backup snapshot:', restoredLogsFromBackup[0]);
if (restoredLogsFromBackup[0].lotNumbers[0] !== 'LOT-NEW-999') {
  throw new Error('Backup snapshot lost lot number');
}
if (restoredLogsFromBackup[0].actionType !== 'DISCARD') {
  throw new Error('Backup snapshot lost discard actionType');
}

console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
