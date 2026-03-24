import type { ApiErrorResponse } from "../src/shared/types";
import { DEFAULT_SESSION_TTL_DAYS } from "../src/shared/constants";
import type { Env } from "./env";

const encoder = new TextEncoder();

export function json<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(status: number, error: string): Response {
  return json<ApiErrorResponse>(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (!name) {
      return accumulator;
    }
    accumulator[name] = decodeURIComponent(valueParts.join("="));
    return accumulator;
  }, {});
}

export function buildSetCookie(
  request: Request,
  env: Env,
  value: string,
  expiresAt: Date
): string {
  const secure = shouldUseSecureCookies(request);
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return [
    `${getCookieName(env)}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
    `Max-Age=${maxAge}`,
    `Expires=${expiresAt.toUTCString()}`
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildClearedCookie(request: Request, env: Env): string {
  const secure = shouldUseSecureCookies(request);
  return [
    `${getCookieName(env)}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ]
    .filter(Boolean)
    .join("; ");
}

export function getCookieName(env: Env): string {
  return env.COOKIE_NAME || "vanity_stock_session";
}

export function getSessionTtlDays(env: Env): number {
  const raw = Number(env.SESSION_TTL_DAYS ?? DEFAULT_SESSION_TTL_DAYS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_TTL_DAYS;
  }
  return Math.floor(raw);
}

export function shouldUseSecureCookies(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:" && url.hostname !== "localhost";
}

export function toIsoTimestamp(date = new Date()): string {
  return date.toISOString();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export function createSessionToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  const raw = btoa(String.fromCharCode(...bytes));
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function escapeCsvCell(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
