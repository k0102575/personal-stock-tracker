# Vanity Stock

Vanity Stock is a mobile-first PWA for tracking personal cosmetics, perfumes, ointments, and other personal care products. It is designed for one private admin user, with a lightweight Cloudflare Worker API, D1 persistence, and an offline-capable React frontend that stays fast on mobile.

## Stack

- Vite
- React
- TypeScript
- Cloudflare Workers
- Cloudflare D1
- TanStack Query
- React Router
- `vite-plugin-pwa`

## Features

- Secure single-admin login using a Worker secret and cookie session
- Dashboard with total items, low stock, expiring soon, expired, recent updates
- Inventory list with search, category filter, status filter, expiry filter, restock-needed toggle, and sort controls
- Item create, edit, delete, and detail screens
- CSV export and import flow for backups and restore
- Installable PWA with offline app shell, runtime caching for recent API data, and update notifications

## Project Structure

```text
.
|-- index.html
|-- migrations/
|   `-- 0001_initial.sql
|-- public/
|   |-- app-icon-maskable.svg
|   |-- app-icon.svg
|   `-- favicon.svg
|-- src/
|   |-- App.tsx
|   |-- components/
|   |   |-- AppShell.tsx
|   |   |-- EmptyState.tsx
|   |   `-- PwaStatus.tsx
|   |-- features/
|   |   |-- auth/
|   |   |   |-- AuthProvider.tsx
|   |   |   |-- LoginPage.tsx
|   |   |   `-- RequireAuth.tsx
|   |   |-- dashboard/
|   |   |   `-- DashboardPage.tsx
|   |   |-- items/
|   |   |   |-- InventoryPage.tsx
|   |   |   |-- ItemCard.tsx
|   |   |   |-- ItemDetailPage.tsx
|   |   |   `-- ItemFormPage.tsx
|   |   `-- settings/
|   |       `-- SettingsPage.tsx
|   |-- lib/
|   |   |-- api.ts
|   |   |-- inventory.ts
|   |   `-- offlineCache.ts
|   |-- shared/
|   |   |-- constants.ts
|   |   `-- types.ts
|   |-- main.tsx
|   `-- styles.css
|-- worker/
|   |-- auth.ts
|   |-- env.ts
|   |-- index.ts
|   |-- items.ts
|   `-- utils.ts
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
`-- wrangler.example.jsonc
```

## Architecture

- `src/`: React SPA, mobile-first layout, typed API client, route-based screens
- `worker/`: Cloudflare Worker API for auth, session validation, CRUD routes, dashboard summary, and CSV export
- `migrations/`: D1 schema for `items` and `sessions`
- `src/shared/`: shared frontend/backend TypeScript types and constants

The Worker is configured to run first only for `/api/*`. Static frontend assets are served through Cloudflare assets with SPA fallback for client-side routing.

For public GitHub safety, the real Wrangler config is not committed. This repo ships [wrangler.example.jsonc](/Users/kimseungmin/me/personal-stock-tracker/wrangler.example.jsonc), and your real `wrangler.jsonc` should be created locally and kept ignored by git.

## Data Model

### `items`

- `id`
- `category`
- `brand`
- `name`
- `volume_or_unit`
- `current_quantity`
- `minimum_quantity`
- `purchase_source`
- `purchase_date`
- `opened_date`
- `expiry_date`
- `status`
- `memo`
- `created_at`
- `updated_at`

### `sessions`

- `id`
- `token_hash`
- `created_at`
- `updated_at`
- `expires_at`

## API Routes

- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/dashboard-summary`
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `GET /api/export`
- `POST /api/import`

## Auth Flow

1. The frontend posts the password to `POST /api/login`.
2. The Worker compares it to `ADMIN_PASSWORD`.
3. On success, the Worker creates a random session token, stores only its SHA-256 hash in D1, and sends an `HttpOnly` cookie.
4. Protected routes call `GET /api/me` on app load and require a valid session cookie.
5. `POST /api/logout` clears the database session row and expires the cookie.

`Secure` cookies are enabled automatically on HTTPS deployments. Local `localhost` development falls back to non-secure cookies so login still works during dev.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create the D1 database

```bash
wrangler d1 create personal-inventory-tracker
```

Create your local config first:

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

Then update your local `wrangler.jsonc` with the returned `database_id`.

### 3. Configure the admin password

For local dev:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` and set `ADMIN_PASSWORD`.

For production:

```bash
wrangler secret put ADMIN_PASSWORD
```

### 4. Apply migrations

```bash
npm run db:migrate:local
```

### 5. Generate Cloudflare types

```bash
npm run cf-typegen
```

### 6. Start the app

```bash
npm run dev
```

This uses Vite for the frontend and the Cloudflare Vite plugin for Worker bindings during development.

## Deployment

### 1. Build locally

```bash
npm run build
```

### 2. Apply remote migrations

```bash
npm run db:migrate:remote
```

### 3. Add the production secret

```bash
wrangler secret put ADMIN_PASSWORD
```

### 4. Deploy

```bash
npm run deploy
```

## Environment Variables

Worker vars in your local `wrangler.jsonc`, copied from [wrangler.example.jsonc](/Users/kimseungmin/me/personal-stock-tracker/wrangler.example.jsonc):

- `SESSION_TTL_DAYS`: session lifetime in days, default `14`
- `COOKIE_NAME`: cookie key, default `vanity_stock_session`

Worker secret:

- `ADMIN_PASSWORD`: single admin password for the whole app

Local dev file:

- `.dev.vars`: local Worker secret storage

## PWA Notes

- Manifest is generated by `vite-plugin-pwa`
- Static assets are precached
- Recent `GET /api/*` responses use runtime caching for offline revisit support
- The app surfaces offline readiness and update availability with an in-app toast

## Zero-Cost-Oriented Design Choices

- Single admin session model
- D1 with raw SQL instead of a heavier ORM
- Worker-first API only on `/api/*`
- Minimal dependency surface
- No external auth service
