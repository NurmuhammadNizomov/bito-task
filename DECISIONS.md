# DECISIONS.md

## 1. Tenant + Role Flow

Isolation at three layers:

- **JWT** carries `{ userId, role, tenantId }`. `tenantId` is never read from body/query/headers — only the token.
- **Middleware**: `authenticate` verifies the JWT, then loads the user by `userId` and rejects (401) if missing, inactive, or its tenant no longer matches — a valid signature alone never authorizes a deleted account. `requireTenant` rejects (403) any tenant claim that doesn't resolve to a real, active `Tenant`. `req.user` is typed via an Express `Request` augmentation (no casts).
- **Data layer**: every query includes `{ tenantId }`. No path reads another tenant's data.

Roles: `admin`, `cashier`. `requireRole('ADMIN')` guards the report.

## 2. Authentication

- **Access token**: 15 min, in React state only (never localStorage), sent as `Bearer`.
- **Refresh token**: HttpOnly cookie (`path=/api/v1/auth`), `SameSite=None; Secure` in prod / `Lax` on localhost. Lifetime parsed from `JWT_REFRESH_EXPIRES_IN` (single source for cookie `maxAge` + DB `expiresAt`).

Tokens are SHA-256 hashed; each refresh deletes the old doc and issues a new one (single-use rotation) — a replayed token finds no doc → 401. The 401 interceptor refreshes once and retries.

## 3. N+1 Fix & Indexes

Catalog search is one query + one `countDocuments` — no per-row lookups. The report is one pipeline (`$match → $unwind → $group → $facet`); `$facet` returns the top-products list **and** the grand totals in a single pass.

| Collection | Index | Why this order |
|---|---|---|
| `products` | `{ tenantId, name }` | tenant equality first, then name search/sort |
| `products` | `{ tenantId, sku }` | tenant + SKU search |
| `orders` | `{ tenantId, createdAt: -1 }` | tenant + recent-first / report range |
| `orders` | `{ tenantId, status }` | report counts only `paid` |
| `paymentevents` | `{ eventId }` unique | idempotency gate |
| `refreshtokens` | `{ tokenHash }` unique · `{ expiresAt }` TTL | lookup on refresh · auto-expire |

Rule: equality field first, sort/range second.

## 4. Client Trust Boundary

Server trusts **two fields** per line: `productId`, `quantity`. `unitPrice`/`costPrice` are re-read from the Product; the order total is computed server-side. Price/cost are snapshotted onto the order item so later catalog changes don't rewrite history. Client prices/totals/stock are ignored.

## 5. Oversell Prevention

`createOrder` runs in a transaction (needs the `--replSet rs0` replica set). Each line decrements atomically with a guard:

```js
updateOne({ _id, tenantId, isActive: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } }, { session })
```

`stock: { $gte: quantity }` is the lock: insufficient stock matches nothing (`modifiedCount === 0`) → the transaction throws 409, DB untouched, stock never negative.

**Where it holds**: two cashiers race the last unit → write conflict; `withTransaction` retries the loser against fresh data, the guard now fails → 409. Hard dependency: the replica set (no transaction on standalone `mongod`).

## 6. Margin Protection (data layer)

1. Cashier product reads use a select that excludes `costPrice`.
2. Receipt selects only `productName, quantity, unitPrice`.
3. Report is `requireRole('ADMIN')` — a cashier token gets 403 before any query.

A cashier with curl can never reach `costPrice`.

## 7. Webhook Idempotency + Edge Cases

- **HMAC** of the raw body in `X-Webhook-Signature`, verified constant-time → 401 on forgery.
- **Idempotency**: unique `eventId` on `PaymentEvent` → exactly one `pending_payment → paid`. Stores `{ tenantId, eventId, orderId, processedAt }`.
- **Out-of-order**: order not found yet → `200 accepted` (provider retries), not 404.
- **Tenant mismatch**: signed payload's `tenantId` ≠ order's → 403.
- **Atomic**: insert event + flip to paid in one transaction.
- **Cache**: invalidated by `sales:<tenantId>:` prefix on payment.
- **Demo provider**: `POST /api/orders/:id/pay` signs server-side with a stable `sim_<orderId>` id and runs the same handler — secret never reaches the client.

## 8. Missing/Unknown Tenant

No/empty `tenantId` → **403**, not processed. A missing claim means no valid context; processing could leak cross-tenant data. 403 reveals nothing about whether a tenant exists.

## 9. Priorities & Push-back

**Prioritized**: stage coherence, security boundaries (isolation, server-trusted prices, margin), oversell safety.

**Cut**: product CRUD (catalog is seeded, task needs only search); register endpoint (users seeded); multi-tenant seed (one demo tenant); i18n (English only); in-process TTL cache instead of Redis (correct on the single `docker compose` container; async signatures kept for a one-file Redis swap).

**Push-back**: the spec frames margin as one privileged number, but the boundary must hold on *every* cashier-reachable endpoint, not just the report — I'd want that stated up front, since it drives the data-layer design.
