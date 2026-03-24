import type { InventoryItem, InventoryItemInput } from "../src/shared/types";

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  SESSION_TTL_DAYS?: string;
  COOKIE_NAME?: string;
}

export interface SessionRecord {
  id: string;
  token_hash: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ItemRow {
  id: string;
  category: InventoryItem["category"];
  brand: string;
  name: string;
  volume_or_unit: string;
  current_quantity: number;
  minimum_quantity: number;
  purchase_source: string;
  purchase_date: string | null;
  opened_date: string | null;
  expiry_date: string | null;
  status: InventoryItem["status"];
  memo: string;
  created_at: string;
  updated_at: string;
}

export type ItemUpdateInput = Partial<InventoryItemInput>;
