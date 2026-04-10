import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate, getDaysUntil, getInventorySignals } from "./inventory";
import type { InventoryItem } from "../shared/types";

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "item-1",
    category: "skincare",
    brand: "브랜드",
    name: "테스트 품목",
    volumeOrUnit: "1개",
    currentQuantity: 2,
    minimumQuantity: 1,
    purchaseSource: "",
    purchaseDate: null,
    openedDate: null,
    expiryDate: "2026-04-10",
    status: "active",
    memo: "",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides
  };
}

describe("inventory utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date-only values in Korean locale", () => {
    expect(formatDate("2026-04-10")).toBe("2026년 4월 10일");
  });

  it("computes expiry signals using Korea time day boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T00:30:00+09:00"));

    expect(getInventorySignals(createItem({ expiryDate: "2026-04-09" }))).toMatchObject({
      expired: true,
      expiringSoon: false
    });
    expect(getInventorySignals(createItem({ expiryDate: "2026-04-10" }))).toMatchObject({
      expired: false,
      expiringSoon: true
    });
  });

  it("returns remaining days from the same Korea time baseline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T08:30:00+09:00"));

    expect(getDaysUntil("2026-04-10")).toBe(0);
    expect(getDaysUntil("2026-04-15")).toBe(5);
  });
});
