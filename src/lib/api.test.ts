// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { api } from "./api";
import { saveOfflineCache } from "./offlineCache";

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
it.each([true, false])("offline session validity: expired=%s", async (expired) => {
  const session = { authenticated: true, expiresAt: new Date(Date.now() + (expired ? -60000 : 60000)).toISOString() };
  saveOfflineCache("session", session);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  if (expired) await expect(api.getMe()).rejects.toThrow("offline");
  else await expect(api.getMe()).resolves.toEqual(session);
});
it("does not fall back to cached data when the server rejects a session", async () => {
  saveOfflineCache("session", { authenticated: true, expiresAt: new Date(Date.now() + 60000).toISOString() });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "expired" }), { status: 401 })));
  await expect(api.getMe()).rejects.toMatchObject({ status: 401 });
});
