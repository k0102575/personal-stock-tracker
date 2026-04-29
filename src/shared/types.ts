import type {
  EXPIRY_FILTERS,
  ITEM_CATEGORIES,
  ITEM_SORTS
} from "./constants";

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ItemSort = (typeof ITEM_SORTS)[number];
export type ExpiryFilter = (typeof EXPIRY_FILTERS)[number];

export interface InventoryItem {
  id: string;
  category: ItemCategory;
  brand: string;
  name: string;
  volumeOrUnit: string;
  currentQuantity: number;
  minimumQuantity: number;
  purchaseSource: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemInput {
  category: ItemCategory;
  brand: string;
  name: string;
  volumeOrUnit: string;
  currentQuantity: number;
  minimumQuantity: number;
  purchaseSource: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  memo: string;
}

export interface ItemListFilters {
  category?: ItemCategory | "all";
  query?: string;
  restockOnly?: boolean;
  expiry?: ExpiryFilter;
  sort?: ItemSort;
}

export interface CategoryCount {
  category: ItemCategory;
  count: number;
}

export interface DashboardSummary {
  totalItems: number;
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  lowStockItems: InventoryItem[];
  expiringSoonItems: InventoryItem[];
  categories: CategoryCount[];
}

export interface SessionInfo {
  authenticated: true;
  expiresAt: string;
}

export interface ImportItemsResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
}

export interface ApiErrorResponse {
  error: string;
}
