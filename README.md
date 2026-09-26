# BITO — Multi-Tenant POS SaaS (Turborepo Monorepo)

> Production-grade Point-of-Sale (POS) and sales reporting web application for multi-tenant retail and hospitality operations. Designed with strict tenant isolation, cryptographic HMAC webhooks, atomic oversell prevention, margin security at the data layer, and single-command Turborepo developer workflows.

---

## 🏗️ Architecture & Project Structure

The project is structured as a **Turborepo monorepo** with npm workspaces:

```
bito-task/
├── api/                      # Vercel Serverless Function entrypoint (routes to Express)
│   └── index.ts              # Connects MongoDB before invoking the Express handler
├── apps/
│   ├── server/               # Node.js + Express + TypeScript + Mongoose API
│   │   ├── src/
│   │   │   ├── common/       # Utilities (HMAC, JWT, cache, transaction, logger)
│   │   │   ├── config/       # Environment parsing (Zod) & MongoDB replica-set config
│   │   │   ├── middleware/   # Auth, role guard, tenant boundary, validation, error handler
│   │   │   ├── modules/      # Auth, Orders, Products, Receipts, Reports, Payments (Webhooks)
│   │   │   ├── routes/       # Express route aggregator mounted at /api/v1
│   │   │   ├── seed/         # Multi-tenant catalog & user seed script
│   │   │   ├── app.ts        # Express application configuration & static SPA serving
│   │   │   └── server.ts     # Standalone HTTP server listener (port 5000)
│   │   └── package.json
│   └── web/                  # React 19 + TypeScript + Vite + Chakra UI POS Frontend
│       ├── src/
│       │   ├── api/          # Axios API contract endpoints (Auth, Products, Orders, Reports)
│       │   ├── components/   # ProtectedRoute, DatePicker, AppStates
│       │   ├── hooks/        # useAuth, useRefreshToken
│       │   ├── lib/          # Custom toaster, Chakra UI theme, color-mode
│       │   ├── pages/        # Login, POS, Orders (Receipts), Reports, 403, 404
│       │   └── stores/       # Zustand auth & POS cart store
│       └── package.json
├── docker-compose.yml        # Multi-container setup (MongoDB replica set + API + Web)
├── turbo.json                # Turborepo task pipelines (build, dev, lint)
├── vercel.json               # Vercel serverless function & SPA rewrite configuration
└── DECISIONS.md              # Technical decision log & security boundary specifications
```

---

## ⚡ Quick Start

### Option A: Docker Compose (Recommended)

Requires Docker and Docker Compose. Automatically configures a **MongoDB single-node replica set** (`--replSet rs0`) required for atomic multi-document transactions.

```bash
# 1. Start all services (MongoDB replica set + API server + Client)
docker compose up --build

# 2. In a second terminal, seed the database with demo tenants, products, and users
docker compose exec server npm run seed
```

Access the applications:
- **POS Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

### Option B: Local Turborepo Development

Requires Node.js 20+ and a MongoDB instance running as a replica set (`mongod --replSet rs0`).

```bash
# 1. Install root & workspace dependencies
npm install

# 2. Seed database
npm run seed

# 3. Start development servers concurrently via Turborepo
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 👥 Demo Accounts

All pre-seeded demo accounts share the password: **`123456`**.

| Tenant | Role | Email | Privileges & Boundaries |
|:---|:---|:---|:---|
| **Tenant A** | `ADMIN` | `admin.a@demo.uz` | Full POS checkout + Sales analytics (Revenue, Cost, Profit Margin). |
| **Tenant A** | `CASHIER` | `cashier.a@demo.uz` | Catalog search, cart, order placement, receipts. **Cost & Margin strictly inaccessible.** |
| **Tenant A** | `CASHIER` | `cashier.a2@demo.uz` | Secondary cashier account for testing concurrent checkout and oversell prevention. |

---

## 🔄 Core End-to-End Workflow

1. **Authentication**:
   - Cashier or Admin signs in.
   - Server returns a short-lived **15-minute Access Token** (kept in client memory) and sets a secure **HttpOnly Refresh Cookie** (`path=/api/v1/auth`).
2. **Catalog Search & Cart**:
   - Cashier searches products with single-query debounce.
   - Cashier responses exclude `costPrice` at the database projection level.
3. **Atomic Order Placement**:
   - Cashier submits cart.
   - Server validates prices against the database, locks stock inside a MongoDB transaction (`stock: { $gte: quantity }`), and flags order as `pending_payment`.
   - If stock is insufficient, transaction rolls back immediately with HTTP 409.
4. **Payment Confirmation (HMAC Webhook)**:
   - "Confirm payment" simulates the provider by signing payload with `WEBHOOK_SECRET` via HMAC-SHA256 (`X-Webhook-Signature`).
   - Webhook handler verifies signature, checks idempotency on `PaymentEvent`, and marks order `paid`.
5. **Receipt**:
   - Line items, applied taxes, and totals rendered.
6. **Analytics Report (Admin Only)**:
   - Aggregation pipeline calculates top products, total revenue, COGS, and profit margin in a single pass.
   - Result is cached with in-memory TTL and automatically invalidated upon new `paid` order events.

---

## 🌐 Vercel Deployment Guide

The repository includes a ready-to-deploy configuration for **Vercel**:

### 1. Vercel Project Settings
- **Root Directory**: Leave **blank** / `./` (Do not set to `client` or `apps/web`).
- **Build Command**: `npm run build` (Turborepo compiles both `apps/server` and `apps/web`).
- **Output Directory**: `apps/web/dist`

### 2. Environment Variables in Vercel
Add the following in Vercel Dashboard -> **Settings** -> **Environment Variables**:

| Variable | Value / Description |
|:---|:---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas replica-set connection URI |
| `JWT_SECRET` | 32+ character random secret for access tokens |
| `JWT_REFRESH_SECRET` | 32+ character random secret for refresh tokens |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `WEBHOOK_SECRET` | Shared secret for signing payment webhooks |
| `CLIENT_URL` | Your production frontend URL (e.g., `https://bito-task.vercel.app`) |
| `VITE_API_URL` | `/api/v1` (or your full production domain) |

---

## 📡 API Endpoints (`/api/v1`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, receive JWT access token & refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token cookie and receive new access token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token in database & clear cookie |
| `GET`  | `/api/v1/products` | Cashier / Admin | Search and browse catalog products (cost price stripped for cashier) |
| `POST` | `/api/v1/orders` | Cashier / Admin | Place order with atomic inventory decrement |
| `GET`  | `/api/v1/orders/:id` | Cashier / Admin | Fetch order and receipt details |
| `POST` | `/api/v1/orders/:id/pay` | Cashier / Admin | Demo payment simulation (signs and dispatches HMAC webhook) |
| `POST` | `/api/v1/webhooks/payment` | Public (Signed) | Process payment provider webhook (`X-Webhook-Signature` required) |
| `GET`  | `/api/v1/reports/sales` | **Admin Only** | Fetch aggregated sales report with revenue, cost, and margin |
| `GET`  | `/health` | Public | System health check |

---

## 📄 License

MIT © 2026 Nurmuhammad Nizomov
