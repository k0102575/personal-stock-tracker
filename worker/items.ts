import {
  APP_SQLITE_NOW_MODIFIER,
  EXPIRY_SOON_DAYS,
  ITEM_CATEGORIES,
  ITEM_SORTS,
  ITEM_STATUSES
} from "../src/shared/constants";
import type {
  DashboardSummary,
  ImportItemsResult,
  InventoryItem,
  InventoryItemInput,
  ItemListFilters,
  ItemSort
} from "../src/shared/types";
import type { Env, ItemRow, ItemUpdateInput } from "./env";
import { HttpError, escapeCsvCell, toIsoTimestamp } from "./utils";

const ALLOWED_CATEGORIES = new Set<string>(ITEM_CATEGORIES);
const ALLOWED_STATUSES = new Set<string>(ITEM_STATUSES);
const ALLOWED_SORTS = new Set<string>(ITEM_SORTS);
const CSV_HEADERS = [
  "id",
  "category",
  "brand",
  "name",
  "volume_or_unit",
  "current_quantity",
  "minimum_quantity",
  "purchase_source",
  "purchase_date",
  "opened_date",
  "expiry_date",
  "status",
  "memo",
  "created_at",
  "updated_at"
] as const;
const APP_TODAY_SQL = `date('now', '${APP_SQLITE_NOW_MODIFIER}')`;

export function toInventoryItem(row: ItemRow): InventoryItem {
  return {
    id: row.id,
    category: row.category,
    brand: row.brand,
    name: row.name,
    volumeOrUnit: row.volume_or_unit,
    currentQuantity: Number(row.current_quantity),
    minimumQuantity: Number(row.minimum_quantity),
    purchaseSource: row.purchase_source,
    purchaseDate: row.purchase_date,
    openedDate: row.opened_date,
    expiryDate: row.expiry_date,
    status: row.status,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listItems(env: Env, filters: ItemListFilters): Promise<InventoryItem[]> {
  const params: unknown[] = [];
  let sql = `
    SELECT
      id,
      category,
      brand,
      name,
      volume_or_unit,
      current_quantity,
      minimum_quantity,
      purchase_source,
      purchase_date,
      opened_date,
      expiry_date,
      status,
      memo,
      created_at,
      updated_at
    FROM items
    WHERE 1 = 1
  `;

  if (filters.category && filters.category !== "all") {
    sql += " AND category = ?";
    params.push(filters.category);
  }

  if (filters.status && filters.status !== "all") {
    sql += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.restockOnly) {
    sql += " AND current_quantity <= minimum_quantity";
  }

  if (filters.expiry === "expired") {
    sql += ` AND expiry_date IS NOT NULL AND date(expiry_date) < ${APP_TODAY_SQL}`;
  } else if (filters.expiry === "soon") {
    sql += `
      AND expiry_date IS NOT NULL
      AND date(expiry_date) BETWEEN ${APP_TODAY_SQL} AND date(${APP_TODAY_SQL}, '+${EXPIRY_SOON_DAYS} day')
    `;
  }

  if (filters.query) {
    sql += `
      AND (
        lower(name) LIKE lower(?)
        OR lower(brand) LIKE lower(?)
        OR lower(memo) LIKE lower(?)
      )
    `;
    const like = `%${filters.query}%`;
    params.push(like, like, like);
  }

  sql += ` ORDER BY ${getSortSql(filters.sort)};`;
  const result = await env.DB.prepare(sql).bind(...params).all<ItemRow>();
  return result.results.map(toInventoryItem);
}

export async function getItemById(env: Env, id: string): Promise<InventoryItem | null> {
  const result = await env.DB.prepare(
    `
      SELECT
        id,
        category,
        brand,
        name,
        volume_or_unit,
        current_quantity,
        minimum_quantity,
        purchase_source,
        purchase_date,
        opened_date,
        expiry_date,
        status,
        memo,
        created_at,
        updated_at
      FROM items
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(id)
    .all<ItemRow>();

  const row = result.results[0];
  return row ? toInventoryItem(row) : null;
}

export async function createItem(env: Env, input: unknown): Promise<InventoryItem> {
  const parsed = validateItemInput(input);
  const id = crypto.randomUUID();
  const now = toIsoTimestamp();
  await env.DB.prepare(
    `
      INSERT INTO items (
        id,
        category,
        brand,
        name,
        volume_or_unit,
        current_quantity,
        minimum_quantity,
        purchase_source,
        purchase_date,
        opened_date,
        expiry_date,
        status,
        memo,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      id,
      parsed.category,
      parsed.brand,
      parsed.name,
      parsed.volumeOrUnit,
      parsed.currentQuantity,
      parsed.minimumQuantity,
      parsed.purchaseSource,
      parsed.purchaseDate,
      parsed.openedDate,
      parsed.expiryDate,
      parsed.status,
      parsed.memo,
      now,
      now
    )
    .run();

  const item = await getItemById(env, id);
  if (!item) {
    throw new HttpError(500, "Item was created but could not be loaded.");
  }
  return item;
}

export async function updateItem(
  env: Env,
  id: string,
  input: unknown
): Promise<InventoryItem> {
  const existing = await getItemById(env, id);
  if (!existing) {
    throw new HttpError(404, "Item not found.");
  }

  const parsed = validateItemInput(input, true);
  const fields: Array<[column: string, value: unknown]> = [];

  if ("category" in parsed) fields.push(["category", parsed.category]);
  if ("brand" in parsed) fields.push(["brand", parsed.brand]);
  if ("name" in parsed) fields.push(["name", parsed.name]);
  if ("volumeOrUnit" in parsed) fields.push(["volume_or_unit", parsed.volumeOrUnit]);
  if ("currentQuantity" in parsed) fields.push(["current_quantity", parsed.currentQuantity]);
  if ("minimumQuantity" in parsed) fields.push(["minimum_quantity", parsed.minimumQuantity]);
  if ("purchaseSource" in parsed) fields.push(["purchase_source", parsed.purchaseSource]);
  if ("purchaseDate" in parsed) fields.push(["purchase_date", parsed.purchaseDate]);
  if ("openedDate" in parsed) fields.push(["opened_date", parsed.openedDate]);
  if ("expiryDate" in parsed) fields.push(["expiry_date", parsed.expiryDate]);
  if ("status" in parsed) fields.push(["status", parsed.status]);
  if ("memo" in parsed) fields.push(["memo", parsed.memo]);

  if (fields.length === 0) {
    throw new HttpError(400, "At least one field is required to update an item.");
  }

  fields.push(["updated_at", toIsoTimestamp()]);
  const setClause = fields.map(([column]) => `${column} = ?`).join(", ");
  const values = fields.map(([, value]) => value);

  await env.DB.prepare(`UPDATE items SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();

  const updated = await getItemById(env, id);
  if (!updated) {
    throw new HttpError(500, "Updated item could not be loaded.");
  }
  return updated;
}

export async function deleteItem(env: Env, id: string): Promise<boolean> {
  const result = await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
  return Boolean(result.meta.changes);
}

export async function getDashboardSummary(env: Env): Promise<DashboardSummary> {
  const counts = await env.DB.prepare(
    `
      SELECT
        (SELECT COUNT(*) FROM items) AS total_items,
        (SELECT COUNT(*) FROM items WHERE current_quantity <= minimum_quantity) AS low_stock_count,
        (SELECT COUNT(*) FROM items WHERE expiry_date IS NOT NULL AND date(expiry_date) < ${APP_TODAY_SQL}) AS expired_count,
        (
          SELECT COUNT(*)
          FROM items
          WHERE expiry_date IS NOT NULL
          AND date(expiry_date) BETWEEN ${APP_TODAY_SQL} AND date(${APP_TODAY_SQL}, '+${EXPIRY_SOON_DAYS} day')
        ) AS expiring_soon_count
    `
  ).first<{
    total_items: number;
    low_stock_count: number;
    expired_count: number;
    expiring_soon_count: number;
  }>();

  const recentResult = await env.DB.prepare(
    `
      SELECT
        id,
        category,
        brand,
        name,
        volume_or_unit,
        current_quantity,
        minimum_quantity,
        purchase_source,
        purchase_date,
        opened_date,
        expiry_date,
        status,
        memo,
        created_at,
        updated_at
      FROM items
      ORDER BY updated_at DESC
      LIMIT 5
    `
  ).all<ItemRow>();

  const categoryResult = await env.DB.prepare(
    `
      SELECT category, COUNT(*) AS count
      FROM items
      GROUP BY category
      ORDER BY count DESC, category ASC
    `
  ).all<{ category: InventoryItem["category"]; count: number }>();

  return {
    totalItems: Number(counts?.total_items ?? 0),
    lowStockCount: Number(counts?.low_stock_count ?? 0),
    expiredCount: Number(counts?.expired_count ?? 0),
    expiringSoonCount: Number(counts?.expiring_soon_count ?? 0),
    recentItems: recentResult.results.map(toInventoryItem),
    categories: categoryResult.results.map((row) => ({
      category: row.category,
      count: Number(row.count)
    }))
  };
}

export async function exportItemsCsv(env: Env): Promise<string> {
  const items = await listItems(env, { sort: "updated_desc" });
  const rows = items.map((item) =>
    [
      item.id,
      item.category,
      item.brand,
      item.name,
      item.volumeOrUnit,
      item.currentQuantity,
      item.minimumQuantity,
      item.purchaseSource,
      item.purchaseDate,
      item.openedDate,
      item.expiryDate,
      item.status,
      item.memo,
      item.createdAt,
      item.updatedAt
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export async function importItemsCsv(
  env: Env,
  csvText: string
): Promise<ImportItemsResult> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    throw new HttpError(400, "CSV 파일이 비어 있습니다.");
  }

  const headerRow = rows[0];
  if (!headerRow) {
    throw new HttpError(400, "CSV 헤더를 읽을 수 없습니다.");
  }

  const dataRows = rows.slice(1);
  const normalizedHeaders = headerRow.map((value) => value.trim().replace(/^\uFEFF/, ""));
  if (
    normalizedHeaders.length !== CSV_HEADERS.length ||
    normalizedHeaders.some((value, index) => value !== CSV_HEADERS[index])
  ) {
    throw new HttpError(400, "지원하지 않는 CSV 형식입니다. 앱에서 내보낸 파일을 사용해주세요.");
  }

  let totalRows = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    if (!row) {
      continue;
    }

    if (row.every((value) => !value.trim())) {
      skippedCount += 1;
      continue;
    }

    totalRows += 1;

    if (row.length !== CSV_HEADERS.length) {
      throw new HttpError(400, `CSV ${index + 2}번째 줄 형식이 올바르지 않습니다.`);
    }

    const record = Object.fromEntries(
      CSV_HEADERS.map((header, columnIndex) => [header, row[columnIndex] ?? ""])
    ) as Record<(typeof CSV_HEADERS)[number], string>;

    const itemId = record.id.trim() || crypto.randomUUID();
    const existing = await env.DB.prepare("SELECT id FROM items WHERE id = ? LIMIT 1")
      .bind(itemId)
      .first<{ id: string }>();
    const importedItem = toImportedItem(record, index + 2);

    await env.DB.prepare(
      `
        INSERT INTO items (
          id,
          category,
          brand,
          name,
          volume_or_unit,
          current_quantity,
          minimum_quantity,
          purchase_source,
          purchase_date,
          opened_date,
          expiry_date,
          status,
          memo,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          category = excluded.category,
          brand = excluded.brand,
          name = excluded.name,
          volume_or_unit = excluded.volume_or_unit,
          current_quantity = excluded.current_quantity,
          minimum_quantity = excluded.minimum_quantity,
          purchase_source = excluded.purchase_source,
          purchase_date = excluded.purchase_date,
          opened_date = excluded.opened_date,
          expiry_date = excluded.expiry_date,
          status = excluded.status,
          memo = excluded.memo,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `
    )
      .bind(
        itemId,
        importedItem.category,
        importedItem.brand,
        importedItem.name,
        importedItem.volumeOrUnit,
        importedItem.currentQuantity,
        importedItem.minimumQuantity,
        importedItem.purchaseSource,
        importedItem.purchaseDate,
        importedItem.openedDate,
        importedItem.expiryDate,
        importedItem.status,
        importedItem.memo,
        importedItem.createdAt,
        importedItem.updatedAt
      )
      .run();

    if (existing) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  return {
    totalRows,
    createdCount,
    updatedCount,
    skippedCount
  };
}

export function parseFilters(url: URL): ItemListFilters {
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const expiry = url.searchParams.get("expiry");
  const sort = url.searchParams.get("sort");
  const query = url.searchParams.get("query")?.trim();
  const restockOnly = url.searchParams.get("restockOnly") === "true";
  const parsedCategory: NonNullable<ItemListFilters["category"]> =
    category && (category === "all" || ALLOWED_CATEGORIES.has(category))
      ? (category as NonNullable<ItemListFilters["category"]>)
      : "all";
  const parsedStatus: NonNullable<ItemListFilters["status"]> =
    status && (status === "all" || ALLOWED_STATUSES.has(status))
      ? (status as NonNullable<ItemListFilters["status"]>)
      : "all";
  const parsedExpiry: NonNullable<ItemListFilters["expiry"]> =
    expiry === "expired" || expiry === "soon" || expiry === "all"
      ? expiry
      : "all";
  const parsedSort: NonNullable<ItemListFilters["sort"]> = ALLOWED_SORTS.has(sort ?? "")
    ? (sort as NonNullable<ItemListFilters["sort"]>)
    : "updated_desc";

  return {
    category: parsedCategory,
    status: parsedStatus,
    expiry: parsedExpiry,
    sort: parsedSort,
    query: query || "",
    restockOnly
  };
}

function validateItemInput(
  input: unknown,
  partial = false
): InventoryItemInput | ItemUpdateInput {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "Item payload must be an object.");
  }

  const record = input as Record<string, unknown>;
  const output: ItemUpdateInput = {};

  if (!partial || "category" in record) {
    const category = toTrimmedString(record.category, "category");
    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new HttpError(400, "Category is invalid.");
    }
    output.category = category as InventoryItem["category"];
  }

  if (!partial || "brand" in record) {
    output.brand = toOptionalTrimmedString(record.brand);
  }

  if (!partial || "name" in record) {
    const name = toTrimmedString(record.name, "name");
    if (!name) {
      throw new HttpError(400, "Name is required.");
    }
    output.name = name;
  }

  if (!partial || "volumeOrUnit" in record) {
    output.volumeOrUnit = toOptionalTrimmedString(record.volumeOrUnit);
  }

  if (!partial || "currentQuantity" in record) {
    output.currentQuantity = toNonNegativeNumber(record.currentQuantity, "currentQuantity");
  }

  if (!partial || "minimumQuantity" in record) {
    output.minimumQuantity = toNonNegativeNumber(record.minimumQuantity, "minimumQuantity");
  }

  if (!partial || "purchaseSource" in record) {
    output.purchaseSource = toOptionalTrimmedString(record.purchaseSource);
  }

  if (!partial || "purchaseDate" in record) {
    output.purchaseDate = toDateString(record.purchaseDate, "purchaseDate");
  }

  if (!partial || "openedDate" in record) {
    output.openedDate = toDateString(record.openedDate, "openedDate");
  }

  if (!partial || "expiryDate" in record) {
    output.expiryDate = toDateString(record.expiryDate, "expiryDate");
  }

  if (!partial || "status" in record) {
    const status = toTrimmedString(record.status, "status");
    if (!ALLOWED_STATUSES.has(status)) {
      throw new HttpError(400, "Status is invalid.");
    }
    output.status = status as InventoryItem["status"];
  }

  if (!partial || "memo" in record) {
    output.memo = toOptionalTrimmedString(record.memo);
  }

  return partial ? output : (output as InventoryItemInput);
}

function getSortSql(sort: ItemSort | undefined): string {
  switch (sort) {
    case "expiry_asc":
      return "CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END, expiry_date ASC, updated_at DESC";
    case "name_asc":
      return "lower(name) ASC, updated_at DESC";
    case "updated_desc":
    default:
      return "updated_at DESC";
  }
}

function toTrimmedString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string.`);
  }
  return value.trim();
}

function toOptionalTrimmedString(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "Text fields must be strings.");
  }
  return value.trim();
}

function toNonNegativeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new HttpError(400, `${fieldName} must be a non-negative number.`);
  }
  return value;
}

function toDateString(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${fieldName} must use YYYY-MM-DD format.`);
  }
  return value;
}

function toImportedItem(
  record: Record<(typeof CSV_HEADERS)[number], string>,
  rowNumber: number
): InventoryItemInput & { createdAt: string; updatedAt: string } {
  const input = validateItemInput({
    category: record.category,
    brand: record.brand,
    name: record.name,
    volumeOrUnit: record.volume_or_unit,
    currentQuantity: toImportedNumber(record.current_quantity, "current_quantity", rowNumber),
    minimumQuantity: toImportedNumber(record.minimum_quantity, "minimum_quantity", rowNumber),
    purchaseSource: record.purchase_source,
    purchaseDate: emptyToNull(record.purchase_date),
    openedDate: emptyToNull(record.opened_date),
    expiryDate: emptyToNull(record.expiry_date),
    status: record.status,
    memo: record.memo
  }) as InventoryItemInput;

  return {
    ...input,
    createdAt: toImportedTimestamp(record.created_at),
    updatedAt: toImportedTimestamp(record.updated_at)
  };
}

function toImportedNumber(value: string, fieldName: string, rowNumber: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `CSV ${rowNumber}번째 줄의 ${fieldName} 값이 올바르지 않습니다.`);
  }
  return parsed;
}

function toImportedTimestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return toIsoTimestamp();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "CSV의 생성일 또는 수정일 형식이 올바르지 않습니다.");
  }

  return parsed.toISOString();
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else if (char === "\r" && nextChar === "\n") {
        currentValue += "\n";
        index += 1;
      } else {
        currentValue += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentValue += char;
  }

  if (inQuotes) {
    throw new HttpError(400, "CSV 인용부호가 올바르게 닫히지 않았습니다.");
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}
