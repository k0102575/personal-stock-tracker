// @vitest-environment jsdom
import { act, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";
import { api, ApiError } from "../../lib/api";

vi.mock("../../lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../lib/api")>();
  return { ...original, api: { ...original.api, getMe: vi.fn(), login: vi.fn(), logout: vi.fn() } };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); localStorage.clear(); });
function setup() {
  const client = new QueryClient();
  const protectedRender = vi.fn();
  function Protected() { protectedRender(); return <div>private</div>; }
  function LoginTarget() { const auth = useAuth(); return auth.isAuthenticated ? <Protected /> : null; }
  function State() { const auth = useAuth(); return <button onClick={() => void auth.login("password")}>{auth.isAuthenticated ? "authenticated" : "anonymous"}</button>; }
  render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter><State /><Routes><Route path="/" element={<RequireAuth><Protected /></RequireAuth>} /><Route path="/login" element={<LoginTarget />} /></Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
  return { client, protectedRender };
}
it("checks an anonymous session once and never mounts protected API consumers", async () => {
  vi.mocked(api.getMe).mockRejectedValue(new ApiError(401, "expired"));
  const { protectedRender } = setup();
  await waitFor(() => expect(api.getMe).toHaveBeenCalledTimes(1));
  await act(async () => { focusManager.setFocused(false); focusManager.setFocused(true); onlineManager.setOnline(false); onlineManager.setOnline(true); });
  expect(api.getMe).toHaveBeenCalledTimes(1);
  expect(protectedRender).not.toHaveBeenCalled();
});
it("does not retry a failed session request", async () => {
  vi.mocked(api.getMe).mockRejectedValue(new Error("unavailable"));
  const { client } = setup();
  await waitFor(() => expect(client.getQueryState(["session"])?.status).toBe("error"));
  expect(client.getQueryState(["session"])?.fetchFailureCount).toBe(1);
});
it("accepts login and removes protected content after a server 401", async () => {
  vi.mocked(api.getMe).mockResolvedValue(null as never);
  vi.mocked(api.login).mockResolvedValue({ authenticated: true, expiresAt: new Date(Date.now() + 60000).toISOString() });
  setup();
  await act(async () => { screen.getByRole("button").click(); });
  await screen.findByText("private");
  act(() => { window.dispatchEvent(new Event("session-expired")); });
  await waitFor(() => expect(screen.queryByText("private")).toBeNull());
});
