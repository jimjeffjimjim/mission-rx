'use client';

import { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';

export function useAdminBackups({
  activeTab,
  items,
  onRefreshData,
}: {
  activeTab: string;
  items: InventoryItem[];
  onRefreshData?: () => void;
}) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupTitle, setBackupTitle] = useState('');
  const [backupNotes, setBackupNotes] = useState('');
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [isRestoreWarningOpen, setIsRestoreWarningOpen] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<any | null>(null);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch weekly backups', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BACKUPS') {
      fetchBackups();
    }
  }, [activeTab]);

  const handleCreateWeeklyBackup = async () => {
    setCreatingBackup(true);
    try {
      let logsSnapshot = [];
      try {
        const logsRes = await fetch('/api/logs');
        if (logsRes.ok) logsSnapshot = await logsRes.json();
      } catch (e) {}

      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:
            backupTitle ||
            `Weekly Snapshot - ${new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}`,
          notes: backupNotes || 'Manual weekly snapshot triggered by administrator.',
          inventory: items,
          logs: logsSnapshot,
        }),
      });

      if (res.ok) {
        setBackupTitle('');
        setBackupNotes('');
        await fetchBackups();
      }
    } catch (e) {
      console.error('Failed creating backup:', e);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleConfirmRestoreBackup = async () => {
    if (!selectedBackupToRestore) return;
    setRestoringBackupId(selectedBackupToRestore.id);
    try {
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: selectedBackupToRestore.id }),
      });
      if (res.ok) {
        setIsRestoreWarningOpen(false);
        setSelectedBackupToRestore(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error('Failed to restore backup:', e);
    } finally {
      setRestoringBackupId(null);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('Delete this historical weekly backup snapshot?')) return;
    try {
      await fetch(`/api/backups?id=${id}`, { method: 'DELETE' });
      setBackups((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error('Failed deleting backup:', e);
    }
  };

  const handleDownloadBackupJSON = (backup: any) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `mission_rx_weekly_backup_${backup.title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreFromJSONFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (
        !confirm(
          `Are you sure you want to restore from JSON file "${file.name}"? This will overwrite the current clinical database with the snapshot data.`
        )
      ) {
        e.target.value = '';
        return;
      }
      setLoadingBackups(true);
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawBackup: parsed }),
      });
      if (res.ok) {
        alert('Database successfully restored from JSON backup file!');
        if (onRefreshData) onRefreshData();
        await fetchBackups();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to restore: ${errData.error || 'Invalid file format'}`);
      }
    } catch (err: any) {
      alert(`Invalid JSON file: ${err.message}`);
    } finally {
      setLoadingBackups(false);
      e.target.value = '';
    }
  };

  return {
    backups,
    loadingBackups,
    creatingBackup,
    backupTitle,
    setBackupTitle,
    backupNotes,
    setBackupNotes,
    restoringBackupId,
    isRestoreWarningOpen,
    setIsRestoreWarningOpen,
    selectedBackupToRestore,
    setSelectedBackupToRestore,
    handleCreateWeeklyBackup,
    handleConfirmRestoreBackup,
    handleDeleteBackup,
    handleDownloadBackupJSON,
    handleRestoreFromJSONFile,
  };
}
