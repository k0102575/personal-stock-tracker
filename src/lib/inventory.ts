import { APP_TIME_ZONE, EXPIRY_SOON_DAYS } from "../shared/constants";
import { getCategoryLabel } from "../shared/labels";
import type { InventoryItem } from "../shared/types";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: APP_TIME_ZONE
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: APP_TIME_ZONE
});

export function formatDate(value: string | null): string {
  if (!value) {
    return "미입력";
  }

  const parsed = parseDateForDisplay(value);
  if (!parsed) {
    return value;
  }

  return dateFormatter.format(parsed);
}

export function getInventorySignals(item: InventoryItem) {
  const todayKey = getTodayKey();
  const expiry = item.expiryDate;
  const lowStock = item.currentQuantity <= item.minimumQuantity;
  const expired = Boolean(expiry && expiry < todayKey);
  const expiringSoon = Boolean(
    expiry &&
      expiry >= todayKey &&
      getDaysBetween(todayKey, expiry) <= EXPIRY_SOON_DAYS
  );

  return {
    lowStock,
    expired,
    expiringSoon
  };
}

export function getQuantityLabel(item: InventoryItem): string {
  return trimTrailingZeros(item.currentQuantity);
}

export function getMinimumLabel(item: InventoryItem): string {
  return trimTrailingZeros(item.minimumQuantity);
}

export function getItemSubtitle(item: InventoryItem): string {
  const pieces = [item.brand, item.volumeOrUnit].filter(Boolean);
  return pieces.length > 0 ? pieces.join(" / ") : getCategoryLabel(item.category);
}

export function getItemInitials(item: Pick<InventoryItem, "brand" | "name">): string {
  const source = item.brand || item.name;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getStockMeterValue(
  item: Pick<InventoryItem, "currentQuantity" | "minimumQuantity">,
  segments = 6
): number {
  if (item.currentQuantity <= 0) {
    return 0;
  }

  const threshold = Math.max(item.minimumQuantity, 1);
  const ratio = item.currentQuantity / threshold;

  if (ratio <= 1) {
    return 1;
  }

  if (ratio <= 1.5) {
    return Math.min(segments, 2);
  }

  if (ratio <= 2) {
    return Math.min(segments, 3);
  }

  if (ratio <= 3) {
    return Math.min(segments, 4);
  }

  if (ratio <= 4) {
    return Math.min(segments, 5);
  }

  return segments;
}

export function getDaysUntil(value: string | null): number | null {
  if (!value || !isDateOnly(value)) {
    return null;
  }

  return getDaysBetween(getTodayKey(), value);
}

export function toFormDefaults(item?: InventoryItem) {
  return {
    category: item?.category ?? "skincare",
    brand: item?.brand ?? "",
    name: item?.name ?? "",
    volumeOrUnit: item?.volumeOrUnit ?? "",
    currentQuantity: Math.round(item?.currentQuantity ?? 1),
    minimumQuantity: Math.round(item?.minimumQuantity ?? 1),
    purchaseSource: item?.purchaseSource ?? "",
    purchaseDate: item?.purchaseDate ?? null,
    openedDate: item?.openedDate ?? null,
    expiryDate: item?.expiryDate ?? null,
    status: item?.status ?? "active",
    memo: item?.memo ?? ""
  };
}

export function trimTrailingZeros(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function parseDateForDisplay(value: string): Date | null {
  if (isDateOnly(value)) {
    const { year, month, day } = parseDateParts(value);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTodayKey(): string {
  return dayKeyFormatter.format(new Date());
}

function getDaysBetween(fromDate: string, toDate: string): number {
  return Math.round(
    (toUtcDayValue(toDate) - toUtcDayValue(fromDate)) / (24 * 60 * 60 * 1000)
  );
}

function toUtcDayValue(value: string): number {
  const { year, month, day } = parseDateParts(value);
  return Date.UTC(year, month - 1, day);
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateParts(value: string): { year: number; month: number; day: number } {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return { year, month, day };
}
