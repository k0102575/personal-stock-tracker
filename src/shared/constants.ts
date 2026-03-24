export const ITEM_CATEGORIES = [
  "skincare",
  "makeup",
  "perfume",
  "ointment",
  "bodycare",
  "haircare",
  "etc"
] as const;

export const ITEM_STATUSES = ["active", "used_up", "archived"] as const;

export const ITEM_SORTS = ["updated_desc", "expiry_asc", "name_asc"] as const;

export const EXPIRY_FILTERS = ["all", "expired", "soon"] as const;

export const DEFAULT_SESSION_TTL_DAYS = 14;
export const EXPIRY_SOON_DAYS = 30;
