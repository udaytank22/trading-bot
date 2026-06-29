# Antigravity Prompt: Close Out Go-Live Gaps — TradeMind Trading-Bot

> Paste this whole document into Antigravity as a task brief, or split it phase-by-phase across multiple runs. It assumes the Phase 0-3 work from the previous refactor pass is already in place (CORS lockdown, scoped notifications, rate limiting, indexes, Puppeteer pooling, structured logging, Sentry, Zod validation, DataTable adoption, API factory, React Query, BullMQ, Docker, CI) — this prompt only covers what's still open, based on a verified re-audit of the current `main` branch plus a real load-test log.

## Ground rules

- Don't touch anything already marked "done" in the audit unless a step below explicitly says to change it.
- Keep the app runnable after each numbered item — commit/checkpoint between items rather than doing one giant change.
- Every fix below has a stated acceptance check; verify it before moving to the next item.
- Don't introduce a new hardcoded default/fallback secret, password, or wildcard CORS origin anywhere, including in test or seed scripts.

---

## prompts
## 1. Remove the hardcoded secret fallbacks and add boot-time env validation

**File:** `trading-bot-backend/src/config/index.js`

Currently:
```js
JWT_SECRET: process.env.JWT_SECRET || 'trademind_super_secret_access_key_9988',
REFRESH_SECRET: process.env.REFRESH_SECRET || 'trademind_super_secret_refresh_key_1122',
```
- Remove both `||` fallbacks.
- Add a small startup validation step (use `zod`, already a dependency) that checks `JWT_SECRET`, `REFRESH_SECRET`, and `DATABASE_URL` are present and non-empty, and calls `process.exit(1)` with a clear, readable error message if any are missing. Apply the same pattern to any other env var the app can't safely run without.
- Update `.env.example` and any test/CI env blocks (e.g. `.github/workflows/ci.yml` already sets `JWT_SECRET: testing-secret-key-123` — keep that, just make sure `REFRESH_SECRET` and a test `DATABASE_URL` are also present there) so nothing breaks.

**Acceptance:** starting the server with `JWT_SECRET` unset exits immediately with a readable error instead of starting up. Existing `.env` deployments with the secrets already set are unaffected.

---

## 2. Fix the `REDIS_URL` vs `REDIS_HOST`/`REDIS_PORT` mismatch

**File:** `trading-bot-backend/src/utils/queue.js` (and check `utils/cache.js` and anywhere else a Redis-style connection config is built)

Currently:
```js
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
};
```
`docker-compose.yml` only sets `REDIS_URL=redis://redis:6379` for the backend service — `REDIS_HOST`/`REDIS_PORT` are never set, so this silently falls back to `127.0.0.1`, which inside the container is not the `redis` service.

- Update the connection config to prefer `REDIS_URL` when set (most hosting platforms — Render, Railway, Heroku-style — inject this convention too), parsing host/port/password out of it, and fall back to `REDIS_HOST`/`REDIS_PORT` only when no URL is provided (useful for bare local dev without Docker).
- Apply the same fix everywhere a Redis connection is constructed in the backend, not just in `queue.js`.

**Acceptance:** running `docker-compose up`, the backend logs a successful Redis connection (no `ECONNREFUSED` loop), and BullMQ jobs (email send, bulk import) actually process.

---

## 3. Fix the permission-cache thundering herd

**Files:** `trading-bot-backend/src/utils/cache.js`, `trading-bot-backend/src/middleware/auth.middleware.js`

Right now `getUserFromCache`/`setUserInCache` only cache the *resolved* user object. Under concurrent requests for the same user, multiple requests can all miss the cache before the first lookup finishes, each independently re-running the 4-query `User → Role → RolePermission → Permission` lookup (confirmed in a load test: 50 duplicate lookups for what should have been 1).

- Change the cache to store an in-flight `Promise` for a given `userId` the moment a lookup starts (not just the resolved value afterward), so concurrent requests for the same user await the same pending promise instead of each starting their own DB query.
- Keep the existing TTL-based caching of the resolved value once it's available.
- Make sure `invalidateUserCache`/`invalidateAllUserCaches` still work correctly with the new in-flight-promise approach (e.g. when a user's role/permissions change).

**Acceptance:** write a quick test or manual check that fires 20 concurrent requests for the same just-logged-in user and confirms the underlying Prisma `User`/`Role`/`RolePermission`/`Permission` queries run once, not 20 times (you can verify with Prisma's query logging, same as the load test log did).

---

## 4. Set an explicit Postgres connection pool size

**Files:** `trading-bot-backend/prisma/schema.prisma` / deployment `DATABASE_URL` / `.env.example`

Prisma defaulted to a 5-connection pool in the load test (visible in its own startup log line). That's too small for any real concurrency.

- Document (in `.env.example` and the README/runbook) that `DATABASE_URL` should include `?connection_limit=N` tuned to the deployment's Postgres plan (a reasonable starting point for a single backend instance is 10-20; leave headroom under your Postgres max connections, accounting for migrations/seed scripts also connecting).
- If you have access to a PgBouncer (or your Postgres host offers a pooled connection string, e.g. Supabase/Neon's pooled URL), prefer that for production over relying solely on Prisma's built-in pool.

**Acceptance:** the Prisma startup log no longer shows the default 5-connection pool in any environment meant to take real traffic; a quick concurrent-request test (e.g. 50 simultaneous list requests from different users) doesn't show requests queueing for a free connection.

---

## 5. Re-run the load test with realistic concurrency

**New/updated file:** your load-testing script (k6, Artillery, or similar)

The existing test fired 1,500 requests from one logged-in account/IP, which mostly measured the per-user rate limiter (87% got `429`'d) rather than real capacity.

- Seed (or reuse existing seed data for) at least 50-100 distinct test users across a couple of roles, and have the script log in as a rotating set of them (ideally closer to 1,000 distinct virtual users if your tool supports it, e.g. k6 with a pool of generated/seeded accounts) rather than reusing one token.
- Mix realistic traffic: mostly `GET` list/detail requests, a smaller proportion of `POST`/`PUT` writes, matching how the app is actually used (not 500 rapid-fire hits to a single endpoint).
- Capture and report: requests/sec achieved, `429` rate, p50/p95/p99 latency, and any `5xx` errors — after items 1-4 above are done, not before (otherwise you're re-measuring the same bottlenecks).

**Acceptance:** a load-test report showing sustained traffic at roughly your 1,000 req/min target across many distinct users, with an acceptable `429` rate (near zero for legitimate per-user traffic) and p99 latency in a range you're comfortable with (sub-second for simple list endpoints is a reasonable bar).

---

## 6. Extend query-filter hardening to the modules that actually need it

**Files:** `trading-bot-backend/src/modules/inquiries/inquiries.service.js` (priority — it's the busiest/most complex), then audit the others (`invoices`, `shipments`, `clients`, `products`, `suppliers` — whichever build a `where` clause from `req.query` by hand)

`utils/queryHelper.js`'s `getSearchAndFilters`/`getSortingParams` were correctly hardened against bracket-notation operator injection (`?status[not]=X`), but only `auditLogs` actually calls them. `inquiries.service.js` still does:
```js
if (status) {
  where.currentStatus = status;   // no check that `status` is a string, not an object
}
```
- Either route `inquiries.service.js`'s `getAllInquiries` (and the equivalent list functions in other modules with hand-built filters) through `getSearchAndFilters`, or add a small Zod query-schema (you already use Zod for bodies) on each module's `GET /` route that validates `status`, `statuses`, `clientId`, `clientIds`, `search`, etc. are the expected scalar/array-of-scalar shapes before they ever reach Prisma.
- Do this module by module; verify each module's existing filter behavior (search, status filter, client filter, etc.) still works exactly as before for legitimate requests.

**Acceptance:** `GET /api/inquiries?status[not]=CLOSED` (or any bracket-notation variant on any filterable field, on any module you've touched) returns a 400, not a 200 with unexpectedly-filtered results.

---

## 7. Add a server-side maximum page size

**Files:** every `*.service.js` that builds `take`/`skip` from `query.pageSize` (currently: `take = pageSize ? parseInt(pageSize) : undefined`)

- Add a shared helper (in `utils/queryHelper.js`, alongside `getPaginationParams`) that clamps `pageSize` to a sane maximum (e.g. 200) and a sane default (e.g. 20-50) regardless of what the client sends, and always returns a defined `take` — never `undefined`.
- Roll this out to every module's list service function.
- Update the 4 known frontend call sites that currently pass `paginate: 'false'` (`features/settings/components/VendorsTab.jsx`, `features/settings/components/ClientsTab.jsx`, `features/inquiries/InquiriesPage.jsx`'s client-filter fetch, `features/invoices/InvoiceDetailsPage.jsx`) to pass an explicit, reasonable `pageSize` instead (e.g. 500 for dropdown-style reference data, paginated properly if the list is the actual page content).

**Acceptance:** calling any list endpoint with no `pageSize`, or an absurdly large one (`?pageSize=999999`), returns at most the clamped maximum rows, never the full table.

---

## 8. Decide on Socket.io multi-instance support — implement or document as not-yet-done

**File:** `trading-bot-backend/src/server.js`, `package.json`

`production_runbook.md` describes a Redis-backed Socket.io adapter for multi-instance broadcasting that doesn't exist in code yet (`@socket.io/redis-adapter` isn't installed, no `io.adapter(...)` call).

- If you plan to run more than one backend instance soon: add `@socket.io/redis-adapter`, wire it up in `server.js` using the same Redis connection config from item 2, and verify chat/notifications broadcast correctly across two locally-run instances behind a shared Redis.
- If this isn't needed yet: update `production_runbook.md` (section D and the architecture overview) to clearly mark this as **not yet implemented**, so on-call doesn't waste time debugging "Redis pub/sub" for a feature that was never built.

**Acceptance:** either (a) two backend instances correctly relay a chat message/notification between users connected to different instances, or (b) the runbook no longer claims this capability exists.

---

## 9. Fix the CI workflow's missing database

**File:** `.github/workflows/ci.yml`

The workflow provisions a Redis service for tests but not Postgres, while `tests/clients.test.js` (and likely the others) `require('../src/server')` and make real Prisma queries.

- Add a `postgres` service container to the workflow (matching the version used elsewhere in the project), set `DATABASE_URL` in the test job's `env` to point at it, and run `npx prisma migrate deploy` (or equivalent) as a step before `npm test` so the schema exists.
- Run the workflow on a test PR and confirm the test job is actually green, not silently passing despite a DB connection error.

**Acceptance:** the CI job shows real test execution against a real (ephemeral) Postgres instance, and fails if a test's DB-dependent assertion actually fails — not just whenever the suite happens to throw before reaching that assertion.

---

## 10. Decide on notification coverage and apply consistently

**Files:** `trading-bot-backend/src/modules/{purchaseOrders,invoices,shipments,payments}/*.service.js`, `trading-bot-backend/src/modules/notifications/notifications.service.js`

After removing the old blanket notification broadcast, `notifyUser`/`notifyRole` are currently only called from `inquiries.service.js`. Other modules send no in-app notifications at all now.

- Decide with the product owner which actions should notify which users (e.g.: PO sent → notify the supplier-facing team; invoice approved → notify the client's assigned employee; shipment status change → notify relevant staff).
- Add explicit `notifyUser(...)`/`notifyRole(...)` calls at those specific points in the relevant service functions, the same pattern already used in `inquiries.service.js` — never reintroduce a blanket "notify everyone on every write" hook.

**Acceptance:** performing the agreed-upon actions in each module triggers a notification to the intended recipient(s) only, visible in their notification list and via their `user_<id>` socket room — and unrelated users see nothing.

---

## Optional cleanup (low priority, do opportunistically)

- Remove the now-unused `const puppeteer = require('puppeteer');` import in `invoices.service.js` (all 3 call sites use `browserPool` now).
- Remove the now-unused `paginate` destructuring from `query` in service functions where the unbounded branch was already removed.
- Delete the now-dead standalone `createAuditLog()` export in `auditLogs.service.js` (the Prisma `$use` middleware in `config/db.js` is the single source of truth for audit logs now).
- Move the access token out of `localStorage` in `web/src/services/apiClient.js` into in-memory storage, matching what was already done for the refresh token.
