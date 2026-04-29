import type { InventoryItem, ItemSort } from '../shared/types';

export interface InventoryItemGroup {
  key: string;
  item: InventoryItem;
  items: InventoryItem[];
}

export function groupInventoryItems(
  items: InventoryItem[],
  sort: ItemSort = 'updated_desc',
): InventoryItemGroup[] {
  const groups = new Map<string, InventoryItem[]>();

  items.forEach((item) => {
    const key = getInventoryGroupKey(item);
    const currentItems = groups.get(key) ?? [];
    currentItems.push(item);
    groups.set(key, currentItems);
  });

  return Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const sortedItems = sortGroupItems(groupItems);
      return {
        key,
        item: createDisplayItem(sortedItems),
        items: sortedItems,
      };
    })
    .sort((a, b) => compareGroups(a, b, sort));
}

export function getGroupItemsForItem(
  items: InventoryItem[],
  targetItem: InventoryItem,
): InventoryItem[] {
  const targetKey = getInventoryGroupKey(targetItem);
  const dedupedItems = new Map<string, InventoryItem>();

  [targetItem, ...items].forEach((item) => {
    dedupedItems.set(item.id, item);
  });

  return sortGroupItems(
    Array.from(dedupedItems.values()).filter(
      (item) => getInventoryGroupKey(item) === targetKey,
    ),
  );
}

export function getInventoryGroupKey(
  item: Pick<InventoryItem, 'brand' | 'name'>,
): string {
  return `${normalizeGroupPart(item.name)}\u0000${normalizeGroupPart(item.brand)}`;
}

function createDisplayItem(items: InventoryItem[]): InventoryItem {
  const priorityItem = items[0];
  if (!priorityItem) {
    throw new Error('Cannot create a display item from an empty group.');
  }

  return {
    ...priorityItem,
    currentQuantity: sumQuantity(items, 'currentQuantity'),
    minimumQuantity: sumQuantity(items, 'minimumQuantity'),
    expiryDate: getPriorityExpiryDate(items),
    updatedAt: getLatestUpdatedAt(items),
    volumeOrUnit: getVolumeGroupLabel(items),
  };
}

function sortGroupItems(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => {
    const expiryComparison = compareNullableDate(a.expiryDate, b.expiryDate);
    if (expiryComparison !== 0) {
      return expiryComparison;
    }

    const updatedComparison = b.updatedAt.localeCompare(a.updatedAt);
    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    return a.volumeOrUnit.localeCompare(b.volumeOrUnit, 'ko-KR');
  });
}

function compareGroups(
  a: InventoryItemGroup,
  b: InventoryItemGroup,
  sort: ItemSort,
): number {
  if (sort === 'expiry_asc') {
    return compareNullableDate(a.item.expiryDate, b.item.expiryDate);
  }

  if (sort === 'name_asc') {
    const nameComparison = a.item.name.localeCompare(b.item.name, 'ko-KR');
    if (nameComparison !== 0) {
      return nameComparison;
    }
    return a.item.brand.localeCompare(b.item.brand, 'ko-KR');
  }

  return b.item.updatedAt.localeCompare(a.item.updatedAt);
}

function compareNullableDate(a: string | null, b: string | null): number {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  return a.localeCompare(b);
}

function getPriorityExpiryDate(items: InventoryItem[]): string | null {
  return items.find((item) => item.expiryDate)?.expiryDate ?? null;
}

function getLatestUpdatedAt(items: InventoryItem[]): string {
  return items.reduce(
    (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
    items[0]?.updatedAt ?? '',
  );
}

function getVolumeGroupLabel(items: InventoryItem[]): string {
  const volumeCounts = new Map<string, { count: number; label: string }>();

  items.forEach((item) => {
    const label = item.volumeOrUnit.trim() || '용량 미입력';
    const key = normalizeGroupPart(label);
    const current = volumeCounts.get(key);

    volumeCounts.set(key, {
      count: (current?.count ?? 0) + 1,
      label: current?.label ?? label,
    });
  });

  const volumes = Array.from(
    volumeCounts.values(),
    ({ count, label }) => (count > 1 ? `${label} × ${count}` : label),
  );

  if (volumes.length <= 2) {
    return volumes.join(' / ');
  }

  return `${volumes.slice(0, 2).join(' / ')} 외 ${volumes.length - 2}종`;
}

function sumQuantity(
  items: InventoryItem[],
  key: 'currentQuantity' | 'minimumQuantity',
): number {
  return items.reduce((sum, item) => sum + item[key], 0);
}

function normalizeGroupPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}
