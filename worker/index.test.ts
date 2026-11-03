import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import type { Env } from "./env";

const routes = [
  ["GET", "/api/items"], ["GET", "/api/items/test"],
  ["POST", "/api/items"], ["PATCH", "/api/items/test"], ["DELETE", "/api/items/test"],
  ["GET", "/api/dashboard-summary"], ["GET", "/api/export"], ["POST", "/api/import"], ["GET", "/api/me"]
];
describe("server authentication", () => {
  it.each(routes)("rejects anonymous %s %s before accessing D1", async (method, path) => {
    const prepare = vi.fn(() => { throw new Error("must not access data"); });
    const response = await worker.fetch(new Request(`https://example.com${path}`, { method }), { DB: { prepare } } as unknown as Env, {} as ExecutionContext);
    expect(response.status).toBe(401);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(prepare).not.toHaveBeenCalled();
  });
});

it.each(["missing", "expired", "valid"])("validates %s tokens against D1", async (state) => {
  const session = { id: "session-id", expires_at: new Date(Date.now() + (state === "expired" ? -60000 : 60000)).toISOString() };
  const statement = { bind: vi.fn().mockReturnThis(), all: vi.fn().mockResolvedValue({ results: state === "missing" ? [] : [session] }), run: vi.fn().mockResolvedValue({}) };
  const prepare = vi.fn().mockReturnValue(statement);
  const response = await worker.fetch(new Request("https://example.com/api/me", { headers: { Cookie: "vanity_stock_session=opaque-token" } }), { DB: { prepare } } as unknown as Env, {} as ExecutionContext);
  expect(response.status).toBe(state === "valid" ? 200 : 401);
  expect(prepare).toHaveBeenCalled();
  if (state === "expired") expect(prepare).toHaveBeenCalledWith("DELETE FROM sessions WHERE id = ?");
});
