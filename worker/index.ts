import type { SessionInfo } from "../src/shared/types";
import { cleanupExpiredSessions, createSession, destroySession, getAuthenticatedSession, verifyAdminPassword } from "./auth";
import type { Env } from "./env";
import { createItem, deleteItem, exportItemsCsv, getDashboardSummary, getItemById, importItemsCsv, listItems, parseFilters, updateItem } from "./items";
import { HttpError, errorResponse, json, readJson } from "./utils";

interface LoginPayload {
  password?: string;
}

interface ImportPayload {
  csv?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (!url.pathname.startsWith("/api/")) {
        return errorResponse(404, "Not found.");
      }

      if (request.method === "POST" && url.pathname === "/api/login") {
        return await handleLogin(request, env, ctx);
      }

      if (request.method === "POST" && url.pathname === "/api/logout") {
        return await handleLogout(request, env);
      }

      if (request.method === "GET" && url.pathname === "/api/me") {
        return await handleMe(request, env);
      }

      await requireSession(request, env);

      if (request.method === "GET" && url.pathname === "/api/dashboard-summary") {
        return json(await getDashboardSummary(env));
      }

      if (request.method === "GET" && url.pathname === "/api/export") {
        const csv = await exportItemsCsv(env);
        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="vanity-stock-export.csv"',
            "Cache-Control": "private, max-age=120"
          }
        });
      }

      if (request.method === "GET" && url.pathname === "/api/items") {
        return json(await listItems(env, parseFilters(url)));
      }

      if (request.method === "POST" && url.pathname === "/api/items") {
        return json(await createItem(env, await readJson(request)), { status: 201 });
      }

      if (request.method === "POST" && url.pathname === "/api/import") {
        return json(await handleImport(request, env), { status: 201 });
      }

      const itemIdMatch = url.pathname.match(/^\/api\/items\/([^/]+)$/);
      if (itemIdMatch) {
        const rawItemId = itemIdMatch[1];
        if (!rawItemId) {
          return errorResponse(400, "Item id is missing.");
        }
        const itemId = decodeURIComponent(rawItemId);

        if (request.method === "GET") {
          const item = await getItemById(env, itemId);
          return item ? json(item) : errorResponse(404, "Item not found.");
        }

        if (request.method === "PATCH") {
          return json(await updateItem(env, itemId, await readJson(request)));
        }

        if (request.method === "DELETE") {
          const deleted = await deleteItem(env, itemId);
          return deleted ? new Response(null, { status: 204 }) : errorResponse(404, "Item not found.");
        }
      }

      return errorResponse(404, "Route not found.");
    } catch (error) {
      if (error instanceof HttpError) {
        return errorResponse(error.status, error.message);
      }

      console.error("Unhandled API error", { error });
      return errorResponse(500, "Unexpected server error.");
    }
  }
};

async function handleLogin(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const payload = await readJson<LoginPayload>(request);
  if (!payload.password) {
    return errorResponse(400, "Password is required.");
  }

  const isValid = await verifyAdminPassword(env, payload.password);
  if (!isValid) {
    return errorResponse(401, "Invalid password.");
  }

  const { cookie, session } = await createSession(request, env);
  ctx.waitUntil(cleanupExpiredSessions(env));

  return json(session, {
    headers: {
      "Set-Cookie": cookie,
      "Cache-Control": "no-store"
    }
  });
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const clearedCookie = await destroySession(request, env);
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": clearedCookie,
      "Cache-Control": "no-store"
    }
  });
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const session = await getAuthenticatedSession(request, env);
  if (!session) {
    return errorResponse(401, "Session is invalid or expired.");
  }

  const body: SessionInfo = {
    authenticated: true,
    expiresAt: session.expiresAt
  };

  return json(body, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

async function handleImport(request: Request, env: Env) {
  const payload = await readJson<ImportPayload>(request);
  if (typeof payload.csv !== "string" || !payload.csv.trim()) {
    throw new HttpError(400, "CSV 내용이 필요합니다.");
  }

  return importItemsCsv(env, payload.csv);
}

async function requireSession(request: Request, env: Env) {
  const session = await getAuthenticatedSession(request, env);
  if (!session) {
    throw new HttpError(401, "Session is invalid or expired.");
  }
  return session;
}
