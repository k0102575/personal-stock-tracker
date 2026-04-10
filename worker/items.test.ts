import { describe, expect, it } from "vitest";
import { importItemsCsv } from "./items";
import type { Env } from "./env";

interface StoredItemRecord {
  id: string;
  category: string;
  brand: string;
  name: string;
  volume_or_unit: string;
  current_quantity: number;
  minimum_quantity: number;
  purchase_source: string;
  purchase_date: string | null;
  opened_date: string | null;
  expiry_date: string | null;
  status: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

const CSV_HEADER =
  "id,category,brand,name,volume_or_unit,current_quantity,minimum_quantity,purchase_source,purchase_date,opened_date,expiry_date,status,memo,created_at,updated_at";

class FakeD1Database {
  readonly items = new Map<string, StoredItemRecord>();

  prepare(sql: string) {
    return new FakeStatement(this, sql);
  }
}

class FakeStatement {
  private params: unknown[] = [];

  constructor(
    private readonly db: FakeD1Database,
    private readonly sql: string
  ) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async first<T>() {
    if (this.sql.startsWith("SELECT id FROM items WHERE id = ? LIMIT 1")) {
      const itemId = String(this.params[0]);
      const item = this.db.items.get(itemId);
      return item ? ({ id: item.id } as T) : null;
    }

    throw new Error(`Unsupported first() SQL: ${this.sql}`);
  }

  async run() {
    if (this.sql.includes("INSERT INTO items")) {
      const [
        id,
        category,
        brand,
        name,
        volumeOrUnit,
        currentQuantity,
        minimumQuantity,
        purchaseSource,
        purchaseDate,
        openedDate,
        expiryDate,
        status,
        memo,
        createdAt,
        updatedAt
      ] = this.params;

      this.db.items.set(String(id), {
        id: String(id),
        category: String(category),
        brand: String(brand),
        name: String(name),
        volume_or_unit: String(volumeOrUnit),
        current_quantity: Number(currentQuantity),
        minimum_quantity: Number(minimumQuantity),
        purchase_source: String(purchaseSource),
        purchase_date: toNullableString(purchaseDate),
        opened_date: toNullableString(openedDate),
        expiry_date: toNullableString(expiryDate),
        status: String(status),
        memo: String(memo),
        created_at: String(createdAt),
        updated_at: String(updatedAt)
      });

      return {
        meta: {
          changes: 1
        }
      };
    }

    throw new Error(`Unsupported run() SQL: ${this.sql}`);
  }
}

function createEnv() {
  return {
    DB: new FakeD1Database(),
    ADMIN_PASSWORD: "secret"
  } as unknown as Env & { DB: FakeD1Database };
}

function toNullableString(value: unknown): string | null {
  return value == null ? null : String(value);
}

describe("importItemsCsv", () => {
  it("creates and updates rows from exported CSV", async () => {
    const env = createEnv();
    const createdCsv = [
      CSV_HEADER,
      "item-1,skincare,브랜드A,크림,50ml,2,1,올리브영,2026-04-01,2026-04-02,2026-05-01,active,첫 메모,2026-04-01T00:00:00.000Z,2026-04-02T00:00:00.000Z"
    ].join("\n");

    await expect(importItemsCsv(env, createdCsv)).resolves.toEqual({
      totalRows: 1,
      createdCount: 1,
      updatedCount: 0,
      skippedCount: 0
    });
    expect(env.DB.items.get("item-1")?.name).toBe("크림");

    const updatedCsv = [
      CSV_HEADER,
      "item-1,skincare,브랜드B,크림 리필,70ml,1,1,공식몰,2026-04-03,2026-04-04,2026-05-30,active,수정 메모,2026-04-01T00:00:00.000Z,2026-04-03T00:00:00.000Z"
    ].join("\n");

    await expect(importItemsCsv(env, updatedCsv)).resolves.toEqual({
      totalRows: 1,
      createdCount: 0,
      updatedCount: 1,
      skippedCount: 0
    });
    expect(env.DB.items.get("item-1")).toMatchObject({
      brand: "브랜드B",
      name: "크림 리필",
      volume_or_unit: "70ml"
    });
  });

  it("rejects unsupported CSV headers", async () => {
    const env = createEnv();

    await expect(importItemsCsv(env, "name,brand\n크림,브랜드")).rejects.toMatchObject({
      status: 400,
      message: "지원하지 않는 CSV 형식입니다. 앱에서 내보낸 파일을 사용해주세요."
    });
  });
});
