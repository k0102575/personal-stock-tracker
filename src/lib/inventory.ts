import { EXPIRY_SOON_DAYS } from "../shared/constants";
import { getCategoryLabel } from "../shared/labels";
import type { InventoryItem } from "../shared/types";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

export function formatDate(value: string | null): string {
  if (!value) {
    return "미입력";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

export function getInventorySignals(item: InventoryItem) {
  const today = startOfDay(new Date());
  const expiry = item.expiryDate ? startOfDay(new Date(item.expiryDate)) : null;
  const lowStock = item.currentQuantity <= item.minimumQuantity;
  const expired = Boolean(expiry && expiry.getTime() < today.getTime());
  const expiringSoon = Boolean(
    expiry &&
      expiry.getTime() >= today.getTime() &&
      expiry.getTime() <= today.getTime() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000
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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
