import { describe, expect, it } from "vitest";
import { importItemsSheet } from "./items";
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
  expiry_date: string | null;
  status: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

const SHEET_HEADER =
  "id\tcategory\tbrand\tname\tvolume_or_unit\tcurrent_quantity\tminimum_quantity\tpurchase_source\tpurchase_date\texpiry_date\tstatus\tmemo\tcreated_at\tupdated_at";

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

describe("importItemsSheet", () => {
  it("creates and updates rows from exported sheet text", async () => {
    const env = createEnv();
    const createdSheet = [
      SHEET_HEADER,
      "item-1\tskincare\t브랜드A\t크림\t50ml\t2\t1\t올리브영\t2026-04-01\t2026-05-01\tin_stock\t첫 메모\t2026-04-01T00:00:00.000Z\t2026-04-02T00:00:00.000Z"
    ].join("\n");

    await expect(importItemsSheet(env, createdSheet)).resolves.toEqual({
      totalRows: 1,
      createdCount: 1,
      updatedCount: 0,
      skippedCount: 0
    });
    expect(env.DB.items.get("item-1")?.name).toBe("크림");

    const updatedSheet = [
      SHEET_HEADER,
      "item-1\tskincare\t브랜드B\t크림 리필\t70ml\t1\t1\t공식몰\t2026-04-03\t2026-05-30\tin_stock\t수정 메모\t2026-04-01T00:00:00.000Z\t2026-04-03T00:00:00.000Z"
    ].join("\n");

    await expect(importItemsSheet(env, updatedSheet)).resolves.toEqual({
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

  it("rejects unsupported sheet headers", async () => {
    const env = createEnv();

    await expect(importItemsSheet(env, "name\tbrand\n크림\t브랜드")).rejects.toMatchObject({
      status: 400,
      message: "지원하지 않는 스프레드시트 형식입니다. 앱에서 복사한 헤더를 그대로 사용해주세요."
    });
  });
});
