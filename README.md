# BITO — Multi-Tenant POS SaaS

Point-of-sale checkout for a multi-tenant SaaS. One backend serves many businesses (tenants). A **cashier** logs in, searches the catalog, builds a cart, places an order, a payment provider confirms it via webhook, and the cashier sees a receipt. An **admin** at the same business can open a sales report with profit margin — a number the cashier can never reach.

**Stack:** Node.js + Express + TypeScript · MongoDB (replica set) · React + TypeScript + Vite + Chakra UI · Docker.

---

## Quick start (Docker — recommended)

Requirements: Docker + Docker Compose.

```bash
# 1. Copy env files (one per app)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. Start everything (MongoDB replica set + server + client)
docker compose up --build

# 3. Seed demo data (in a second terminal, after containers are healthy)
docker compose exec server npm run seed
```

> In Docker the server reads `server/.env` but its Mongo host is overridden to the
> `mongodb` compose service (see `docker-compose.yml`). For running directly (below),
> `server/.env` points at `localhost`.

Then open:

| Service | URL |
|---|---|
| Client (POS UI) | http://localhost:5173 |
| API | http://localhost:5000/api/v1 |

> MongoDB runs as a **single-node replica set** (`--replSet rs0`). Multi-document transactions (no-oversell guarantee, atomic payment) require this — the compose healthcheck initiates the replica set automatically.

---

## Demo accounts

All users share the password **`123456`**.

| Tenant | Role | Email |
|---|---|---|
| Tenant A | Admin | `admin.a@demo.uz` |
| Tenant A | Cashier | `cashier.a@demo.uz` |
| Tenant A | Cashier | `cashier.a2@demo.uz` |

- **Admin** sees the sales report (revenue / cost / margin).
- **Cashier** runs checkout — never sees cost or margin (enforced at the data layer).

---

## How to use (the full flow)

1. **Login** as a cashier (`cashier.a@demo.uz` / `123456`).
2. **POS** page — search the catalog, add products to the cart, set quantities.
3. **Place Order** — server re-reads real prices + stock, decrements stock atomically (rejects the whole order if any item would oversell), creates the order as `pending_payment`.
4. **Confirm payment** — the "Confirm payment" button stands in for the payment provider: it signs a webhook payload server-side with `WEBHOOK_SECRET` and runs it through the same idempotent webhook path, moving the order to `paid`.
5. **Receipt** — view items, quantities, line totals, grand total, status. No cost/margin anywhere.
6. **Report (admin only)** — login as `admin.a@demo.uz`, open Reports: top products by quantity, total revenue, total cost, total margin. Cached and invalidated when a new `paid` order lands.

---

## Local development (without Docker)

Needs a local MongoDB **running as a replica set** (`mongod --replSet rs0`, then `rs.initiate()`).

```bash
# Server
cd server
npm install
cp .env.example .env           # MONGODB_URI already points at localhost
npm run seed                   # seed demo data
npm run dev                    # http://localhost:5000

# Client (second terminal)
cd client
npm install
cp .env.example .env
npm run dev                    # http://localhost:5173
```

---

## Environment variables

`server/.env`:

| Var | Purpose |
|---|---|
| `SERVER_PORT` | API port (default 5000) |
| `MONGODB_URI` | Mongo connection — **must** include `?replicaSet=rs0`, never `directConnection=true` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Access + refresh token signing |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (refresh value also drives the cookie maxAge) |
| `WEBHOOK_SECRET` | HMAC-SHA256 shared secret for the payment webhook signature |
| `CLIENT_URL` | CORS origin allowed by the server |

`client/.env`:

| Var | Purpose |
|---|---|
| `VITE_API_URL` | API base the client calls |
| `CLIENT_PORT` | Dev server port (default 5173) |

---

## Architecture notes

See **[`DECISIONS.md`](./DECISIONS.md)** for the full rationale: tenant + role flow, N+1 fix and indexes, client-trust boundary, the no-oversell concurrency guarantee, margin protection at the data layer, webhook idempotency + out-of-order handling, and the missing-tenant decision.
