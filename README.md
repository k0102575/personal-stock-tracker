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
- Inventory list with search, category filter, expiry filter, restock-needed toggle, and sort controls
- Item create, edit, delete, and detail screens
- XLSX 파일 업로드/다운로드 기반 백업 및 복구
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
- `worker/`: Cloudflare Worker API for auth, session validation, CRUD routes, dashboard summary, and XLSX export/import
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
- `expiry_date`
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

## 비공개 운영과 크롤러 정책

이 프로젝트는 **Workers + Workers Static Assets + D1** 배포를 유지합니다.
CI는 `wrangler.example.jsonc`에서 설정을 만들며, `/api/*`만 Worker를 먼저 실행합니다.
Pages로 전환하거나 정적 파일 헤더를 위해 Worker 실행 범위를 확대하지 않습니다.

- 유일한 HTML 진입점 `index.html`에 `noindex, nofollow, noarchive` 메타 태그가 있습니다. SPA의 로그인·내부 경로도 이 HTML을 사용합니다.
- `public/_headers`는 빌드의 정적 자산 디렉터리로 복사되어 **Workers Static Assets**가 정적 응답에 `X-Robots-Tag`를 적용합니다. Worker가 직접 만드는 응답에는 적용되지 않으므로 API 응답에는 Worker 코드에서 같은 헤더를 붙입니다.
- `public/robots.txt`는 `User-agent: *` / `Disallow: /`로 검색·AI 크롤러 모두에 전체 경로 접근 금지를 요청합니다. 별도 사용자 에이전트 허용 규칙이나 Sitemap 선언은 두지 않습니다.
- 저장소에는 sitemap 생성, canonical, 검색 등록, 구조화 데이터 설정이 없습니다. PWA manifest의 이름·아이콘·시작 URL은 설치 및 오프라인 사용에 필요하므로 유지합니다.

참고: [Workers 정적 자산 헤더](https://developers.cloudflare.com/workers/static-assets/headers/).

### 기존 검색 등록 URL이 있는 경우의 적용 순서

2026-11-03 운영자 확인: 기존 검색 등록 URL이 없으므로 최종 전체 크롤링 차단을 바로 적용할 수 있습니다. Cloudflare 대시보드 설정은 별도 확인이 필요합니다. 아래 단계적 적용 절차는 향후 기존 등록 URL이 발견되는 경우를 위한 참고입니다.
이 커밋의 최종 상태는 전체 크롤링 차단입니다. **기존 등록 URL이 있거나 확인되지 않았다면 그대로 한 번에 배포하지 말고** 다음 순서로 운영자가 적용합니다.

1. Search Console 등에서 운영 도메인·별칭의 기존 등록 URL을 확인합니다. 외부 검색 관리 도구에 제출했던 sitemap이 있으면 제출을 해제합니다.
2. 먼저 메타 태그와 헤더를 적용하되, 등록된 HTML URL은 robots.txt에서 일시적으로 크롤링 가능하게 둡니다. 전체 허용 단계라면 `User-agent: *` / `Disallow:`를 사용합니다. API 서버 인증은 계속 유지합니다.
3. URL 검사·재크롤링으로 크롤러가 `noindex`를 수신하고 검색 제외를 처리했는지 확인합니다. 급한 경우 검색엔진의 임시 삭제 요청도 병행하되 영구 삭제로 간주하지 않습니다.
4. 검색 제외를 확인한 뒤 이 저장소의 최종 `Disallow: /`를 적용합니다. 기존 등록이 없다고 확인되면 최종 상태를 바로 적용할 수 있습니다.

robots.txt를 먼저 차단하면 크롤러가 HTML/헤더의 noindex를 읽지 못하며 외부 링크로 알려진 URL이 검색 결과에 남을 수 있습니다. robots.txt에 `Noindex:`를 넣는 것으로 해결되지 않습니다.
어느 규칙도 악성 크롤러의 접근, 기존 수집 데이터 삭제, 모든 검색엔진의 즉시 제외를 보장하지 않습니다. `noarchive`의 지원 여부도 크롤러마다 다릅니다.
[Google noindex 안내](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

### 인증과 요청 동작

- 초기 방문에는 HttpOnly 쿠키 확인을 위한 `/api/me` 요청 한 번이 필요합니다. 클라이언트 JavaScript에서 쿠키 유무를 읽어 이를 생략하지 않습니다.
- 익명 판정(null)은 현재 탭에서 새로고침·명시적 세션 확인·로그인 전까지 유지하며 포커스/재연결로 자동 조회하지 않습니다. 세션 조회 오류는 자동 재시도하지 않습니다.
- 로그인 세션은 기존 30초 freshness와 포커스/재연결 확인을 유지합니다. 만료 시각 및 서버 401은 로그인 화면으로 복귀시키며, 만료된 오프라인 세션으로 접근하지 않습니다.
- `RequireAuth`가 확인 대기·비로그인 상태에서 내부 화면을 마운트하지 않아 재고·대시보드 조회가 시작되지 않습니다. 로그아웃은 불필요한 전체 query 무효화 대신 데이터 query를 취소·제거합니다.
- 서버는 재고 조회/수정/삭제, 대시보드, 엑셀 가져오기/내보내기에 D1 세션의 해시와 만료를 검사합니다. 비로그인 요청은 401이며 쿠키가 없으면 D1도 조회하지 않습니다. 로그인은 비밀번호를 검사하고, 로그아웃은 쿠키에 대응하는 세션만 삭제합니다.
- 세션 쿠키는 HttpOnly, SameSite=Strict이며 HTTPS에서 Secure입니다. robots/noindex는 보안 경계가 아닙니다. HTML/JS/PWA 파일 자체는 공개이고 개인정보는 API 인증으로 보호합니다.
- 기존 PWA precache와 최근 API/로컬 데이터의 오프라인 캐시는 유지합니다. 오프라인 저장은 기기 내 데이터이므로 공용 기기에서 사용하지 않는 것이 운영 전제입니다. 서비스 워커의 navigation fallback은 `/api`를 제외해 API 탐색 요청을 HTML로 대체하지 않습니다.

### 수동 Cloudflare 설정 (코드 변경에 포함되지 않음)

운영 도메인의 Cloudflare 대시보드에서 AI Crawl Control의 크롤러 차단과 Bot/AI 봇 차단 옵션을 확인하고 활성화합니다. 가능 여부·메뉴는 계정/플랜/도메인에 따라 다르며, zone WAF 규칙은 workers.dev 주소까지 자동 보호하지 않습니다.
Cloudflare 관리형 robots.txt를 사용한다면 실제 `/robots.txt` 내용에 전체 차단과 충돌하는 허용 규칙이 없는지 확인합니다. 로그인 `/api/login`에는 WAF rate limiting 등으로 비밀번호 무차별 대입을 제한하는 설정도 권장합니다. 현재 코드에는 로그인 횟수 제한이 없습니다.
더 강한 외부 접근 통제가 필요하면 Cloudflare Access를 별도로 구성하고 설치형 PWA·세션·오프라인 복귀를 점검합니다. 이번 변경은 대시보드 설정, 실제 배포, 원격 마이그레이션, 서비스 삭제를 수행하지 않습니다.

참고: [AI Crawl Control 차단](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/), [관리형 robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/).

배포 승인 후 검증할 응답: `/`, `/login`, `/inventory`의 메타 태그와 헤더, `/robots.txt`의 전체 차단, 정적 JS의 헤더, 익명 `/api/items`·`/api/dashboard-summary`·`/api/export`의 401. 오래 열린 PWA에는 업데이트 적용/새로고침이 필요할 수 있습니다.
주의: 현재 GitHub Actions는 main push 또는 main의 workflow_dispatch에서 원격 마이그레이션·secret 동기화·배포를 자동 실행합니다. 위 단계적 적용을 결정하기 전에 main에 push하거나 배포 workflow를 실행하지 마세요.
