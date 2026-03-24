import type { SessionInfo } from "../src/shared/types";
import type { Env, SessionRecord } from "./env";
import {
  addDays,
  buildClearedCookie,
  buildSetCookie,
  createSessionToken,
  getCookieName,
  getSessionTtlDays,
  parseCookies,
  safeEqual,
  sha256,
  toIsoTimestamp
} from "./utils";

export interface AuthenticatedSession {
  sessionId: string;
  expiresAt: string;
}

export async function verifyAdminPassword(env: Env, password: string): Promise<boolean> {
  return Boolean(env.ADMIN_PASSWORD) && safeEqual(env.ADMIN_PASSWORD, password);
}

export async function createSession(
  request: Request,
  env: Env
): Promise<{ cookie: string; session: SessionInfo }> {
  const token = createSessionToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = addDays(now, getSessionTtlDays(env));
  const sessionId = crypto.randomUUID();
  const nowIso = toIsoTimestamp(now);
  const expiresAtIso = toIsoTimestamp(expiresAt);

  await env.DB.prepare(
    `
      INSERT INTO sessions (id, token_hash, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `
  )
    .bind(sessionId, tokenHash, nowIso, nowIso, expiresAtIso)
    .run();

  return {
    cookie: buildSetCookie(request, env, token, expiresAt),
    session: {
      authenticated: true,
      expiresAt: expiresAtIso
    }
  };
}

export async function destroySession(request: Request, env: Env): Promise<string> {
  const token = parseCookies(request)[getCookieName(env)];
  if (token) {
    const tokenHash = await sha256(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return buildClearedCookie(request, env);
}

export async function getAuthenticatedSession(
  request: Request,
  env: Env
): Promise<AuthenticatedSession | null> {
  const token = parseCookies(request)[getCookieName(env)];
  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);
  const result = await env.DB.prepare(
    `
      SELECT id, token_hash, created_at, updated_at, expires_at
      FROM sessions
      WHERE token_hash = ?
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .all<SessionRecord>();

  const session = result.results[0];
  if (!session) {
    return null;
  }

  const expiresAtMs = Date.parse(session.expires_at);
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session.id).run();
    return null;
  }

  await env.DB.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
    .bind(toIsoTimestamp(), session.id)
    .run();

  return {
    sessionId: session.id,
    expiresAt: session.expires_at
  };
}

export async function cleanupExpiredSessions(env: Env): Promise<void> {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .bind(toIsoTimestamp())
    .run();
}
