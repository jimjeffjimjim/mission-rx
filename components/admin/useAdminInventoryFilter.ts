'use client';

import { useMemo } from 'react';
import { InventoryItem, FilterCategory } from '@/types/inventory';
import { differenceInDays, parseISO } from 'date-fns';
import { searchSemanticFormulary, matchesClinicalQuery } from '@/lib/smartSearch';

export function useAdminInventoryFilter({
  displayItems,
  searchQuery,
  selectedCategory,
  adminStatusFilter,
  equipmentSearchQuery,
  equipmentSubFilter,
}: {
  displayItems: InventoryItem[];
  searchQuery: string;
  selectedCategory: FilterCategory;
  adminStatusFilter: 'ALL' | 'LOW_STOCK' | 'EXPIRING';
  equipmentSearchQuery: string;
  equipmentSubFilter: 'ALL' | 'DIAGNOSTIC' | 'SURGICAL' | 'CONSUMABLES';
}) {
  const lowStockCount = useMemo(
    () =>
      displayItems.filter(
        (i) =>
          i.bottlesAvailable < 2 ||
          (i.bottlesAvailable === 0 && i.looseUnitsAvailable < 20)
      ).length,
    [displayItems]
  );

  const expiringCount = useMemo(
    () =>
      displayItems.filter((i) => {
        try {
          const expDate = parseISO(i.expirationDate);
          const days = differenceInDays(expDate, new Date());
          return !isNaN(days) && days <= 30;
        } catch {
          return false;
        }
      }).length,
    [displayItems]
  );

  const totalBottles = useMemo(
    () => displayItems.reduce((acc, item) => acc + item.bottlesAvailable, 0),
    [displayItems]
  );

  const semanticResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSemanticFormulary(searchQuery, 0.32, 25, displayItems);
  }, [searchQuery, displayItems]);

  const semanticMatchedNames = useMemo(() => {
    const names = new Set<string>();
    for (const match of semanticResults) {
      names.add(match.genericName.toLowerCase().trim());
      if (match.brandName) names.add(match.brandName.toLowerCase().trim());
      names.add(match.id);
    }
    return names;
  }, [semanticResults]);

  const filteredItems = useMemo(() => {
    const list = displayItems.filter((item) => {
      if (searchQuery.trim()) {
        const { isMatch } = matchesClinicalQuery(item, searchQuery, semanticMatchedNames);
        if (!isMatch) return false;
      }
      if (!searchQuery.trim() && selectedCategory !== 'ALL') {
        const itemCat = (item.shelfLocation || '').toLowerCase().trim();
        const filterCat = selectedCategory.toLowerCase().trim();
        if (itemCat !== filterCat) {
          if (filterCat.includes('otc') && itemCat.includes('otc')) return true;
          if (filterCat.includes('psych') && itemCat.includes('psych')) return true;
          if (
            (filterCat.includes('ortho') || filterCat.includes('splint')) &&
            (itemCat.includes('ortho') || itemCat.includes('splint'))
          )
            return true;
          return false;
        }
      }
      if (adminStatusFilter === 'LOW_STOCK') {
        const isLow =
          item.bottlesAvailable < 2 ||
          (item.bottlesAvailable === 0 && item.looseUnitsAvailable < 20);
        if (!isLow) return false;
      }
      if (adminStatusFilter === 'EXPIRING') {
        try {
          const expDate = parseISO(item.expirationDate);
          const days = differenceInDays(expDate, new Date());
          if (isNaN(days) || days > 30) return false;
        } catch {
          return false;
        }
      }
      return true;
    });

    if (searchQuery.trim()) {
      return list.sort((a, b) => {
        const scoreA = matchesClinicalQuery(a, searchQuery, semanticMatchedNames).score;
        const scoreB = matchesClinicalQuery(b, searchQuery, semanticMatchedNames).score;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.genericName.localeCompare(b.genericName);
      });
    }
    return list;
  }, [displayItems, searchQuery, selectedCategory, adminStatusFilter, semanticMatchedNames]);

  const equipmentItems = useMemo(() => {
    const list = displayItems.filter((i) => {
      const isSupply =
        i.shelfLocation === 'Supplies' ||
        i.itemType === 'Supply' ||
        (i.shelfLocation &&
          (i.shelfLocation.toLowerCase().includes('splint') ||
            [
              'Orthopedics & Splints',
              'Diagnostic Devices',
              'Surgical Instruments',
              'Consumables & PPE',
              'Wound Care',
              'Respiratory & Airway',
              'Emergency & Trauma',
              'Dental Supplies',
            ].includes(i.shelfLocation))) ||
        (i.stockUnit &&
          ['Units', 'Kits', 'Sets', 'Boxes / Packs', 'Boxes', 'Pairs', 'Ampoules'].includes(
            i.stockUnit
          ) &&
          i.shelfLocation === 'Supplies');
      if (!isSupply) return false;
      if (equipmentSearchQuery.trim()) {
        const { isMatch } = matchesClinicalQuery(i, equipmentSearchQuery);
        if (!isMatch) return false;
      }
      const text = (i.genericName + ' ' + (i.brandName || '') + ' ' + i.dosage).toLowerCase();
      if (equipmentSubFilter === 'DIAGNOSTIC') {
        return (
          text.includes('monitor') ||
          text.includes('cuff') ||
          text.includes('scope') ||
          text.includes('meter') ||
          text.includes('oximeter') ||
          text.includes('thermometer') ||
          text.includes('doppler') ||
          text.includes('diagnostic')
        );
      }
      if (equipmentSubFilter === 'SURGICAL') {
        return (
          text.includes('suture') ||
          text.includes('scalpel') ||
          text.includes('forcep') ||
          text.includes('scissor') ||
          text.includes('speculum') ||
          text.includes('blade') ||
          text.includes('kit') ||
          text.includes('instrument') ||
          text.includes('tray')
        );
      }
      if (equipmentSubFilter === 'CONSUMABLES') {
        return (
          text.includes('glove') ||
          text.includes('syringe') ||
          text.includes('needle') ||
          text.includes('gauze') ||
          text.includes('bandage') ||
          text.includes('swab') ||
          text.includes('tubing') ||
          text.includes('tape') ||
          text.includes('mask') ||
          text.includes('ppe')
        );
      }
      return true;
    });

    if (equipmentSearchQuery.trim()) {
      return list.sort((a, b) => {
        const scoreA = matchesClinicalQuery(a, equipmentSearchQuery).score;
        const scoreB = matchesClinicalQuery(b, equipmentSearchQuery).score;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.genericName.localeCompare(b.genericName);
      });
    }
    return list;
  }, [displayItems, equipmentSearchQuery, equipmentSubFilter]);

  const equipmentTotalCount = useMemo(
    () => displayItems.filter((i) => i.shelfLocation === 'Supplies' || i.itemType === 'Supply').length,
    [displayItems]
  );

  return {
    filteredItems,
    equipmentItems,
    equipmentTotalCount,
    lowStockCount,
    expiringCount,
    totalBottles,
  };
}
