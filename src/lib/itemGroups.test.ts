import { describe, expect, it } from 'vitest';
import { getGroupItemsForItem, groupInventoryItems } from './itemGroups';
import type { InventoryItem } from '../shared/types';

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    category: 'skincare',
    brand: '에스트라',
    name: '아토베리어크림',
    volumeOrUnit: '30ml',
    currentQuantity: 1,
    minimumQuantity: 1,
    purchaseSource: '',
    purchaseDate: null,
    expiryDate: '2028-07-02',
    memo: '',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('item group utils', () => {
  it('groups items by name and brand while aggregating stock numbers', () => {
    const groups = groupInventoryItems([
      createItem({
        id: 'item-30',
        volumeOrUnit: '30ml',
        currentQuantity: 2,
        minimumQuantity: 1,
        expiryDate: '2028-07-02',
      }),
      createItem({
        id: 'item-100',
        volumeOrUnit: '100ml',
        currentQuantity: 1,
        minimumQuantity: 1,
        expiryDate: '2028-12-10',
      }),
    ]);

    expect(groups).toHaveLength(1);
    const group = groups[0];
    if (!group) {
      throw new Error('Expected a grouped item.');
    }
    expect(group.item.currentQuantity).toBe(3);
    expect(group.item.minimumQuantity).toBe(2);
    expect(group.item.expiryDate).toBe('2028-07-02');
    expect(group.item.volumeOrUnit).toBe('30ml / 100ml');
  });

  it('finds the other items that share the selected item group', () => {
    const target = createItem({ id: 'item-30', volumeOrUnit: '30ml' });
    const sibling = createItem({
      id: 'item-100',
      volumeOrUnit: '100ml',
      expiryDate: '2028-12-10',
    });
    const unrelated = createItem({
      id: 'other',
      brand: '다른 브랜드',
      name: '아토베리어크림',
    });

    expect(getGroupItemsForItem([sibling, unrelated], target).map((item) => item.id)).toEqual([
      'item-30',
      'item-100',
    ]);
  });

  it('shows repeated same-volume items with an inline count', () => {
    const groups = groupInventoryItems([
      createItem({ id: 'item-a', volumeOrUnit: '50gml' }),
      createItem({ id: 'item-b', volumeOrUnit: '50gml' }),
    ]);
    const group = groups[0];
    if (!group) {
      throw new Error('Expected a grouped item.');
    }

    expect(group.item.volumeOrUnit).toBe('50gml × 2');
  });
});
