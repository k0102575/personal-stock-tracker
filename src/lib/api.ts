import type {
  DashboardSummary,
  ImportItemsResult,
  InventoryItem,
  InventoryItemInput,
  ItemListFilters,
  SessionInfo
} from "../shared/types";
import { readOfflineCache, saveOfflineCache } from "./offlineCache";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  cacheKey?: string
): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(path, {
      ...init,
      method,
      headers,
      credentials: "same-origin"
    });

    if (!response.ok) {
      let message = "요청 처리에 실패했습니다.";
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) {
          message = payload.error;
        }
      } catch {
        message = response.statusText || message;
      }
      throw new ApiError(response.status, message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T;
    if (method === "GET" && cacheKey) {
      saveOfflineCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    if (method === "GET" && cacheKey && !(error instanceof ApiError)) {
      const cached = readOfflineCache<T>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }
    throw error;
  }
}

function buildItemsQuery(filters: ItemListFilters): string {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.expiry && filters.expiry !== "all") {
    params.set("expiry", filters.expiry);
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.query?.trim()) {
    params.set("query", filters.query.trim());
  }

  if (filters.restockOnly) {
    params.set("restockOnly", "true");
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  login(password: string) {
    return request<SessionInfo>("/api/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
  },
  logout() {
    return request<void>("/api/logout", {
      method: "POST"
    });
  },
  getMe() {
    return request<SessionInfo>("/api/me", {}, "session");
  },
  getDashboardSummary() {
    return request<DashboardSummary>("/api/dashboard-summary", {}, "dashboard-summary");
  },
  getItems(filters: ItemListFilters) {
    const suffix = buildItemsQuery(filters);
    const cacheKey = `items:${suffix || "all"}`;
    return request<InventoryItem[]>(`/api/items${suffix}`, {}, cacheKey);
  },
  getItem(id: string) {
    return request<InventoryItem>(`/api/items/${id}`, {}, `item:${id}`);
  },
  createItem(payload: InventoryItemInput) {
    return request<InventoryItem>("/api/items", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateItem(id: string, payload: Partial<InventoryItemInput>) {
    return request<InventoryItem>(`/api/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  deleteItem(id: string) {
    return request<void>(`/api/items/${id}`, {
      method: "DELETE"
    });
  },
  importItems(csv: string) {
    return request<ImportItemsResult>("/api/import", {
      method: "POST",
      body: JSON.stringify({ csv })
    });
  },
  async exportItems() {
    const response = await fetch("/api/export", {
      method: "GET",
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new ApiError(response.status, "내보내기에 실패했습니다.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vanity-stock-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "문제가 발생했습니다.";
}
