# BITO — POS Web Client (`apps/web`)

> Fast, responsive Point-of-Sale (POS) and sales reporting web interface built with **React 19**, **Vite**, **TypeScript**, **Chakra UI v3**, and **Zustand**.

---

## 🚀 Overview & Features

- 🛒 **Point-of-Sale (POS) Terminal**: Real-time product search, interactive cart management, dynamic quantity updates, line subtotaling, and one-click order dispatch.
- 🧾 **Digital Receipts**: Instant receipt generation with order metadata, line items, timestamps, and payment status.
- 📊 **Executive Sales Analytics (`ADMIN` role only)**: Top-performing products, revenue calculation, cost of goods sold (COGS), and net profit margin analytics.
- 🔐 **Dual-Token Auth & Auto-Refresh**: Access token retained securely in memory with seamless background rotation on HTTP 401 via Axios interceptors.
- 🌓 **Color Mode Switcher**: Built-in Light and Dark theme toggling with Chakra UI and `next-themes`.
- 📱 **Mobile & Tablet Adaptive**: Fully responsive layout optimized for touchscreens, mobile devices, and desktop checkout counters.

---

## 🛠️ Stack & Dependencies

| Tool | Purpose |
|:---|:---|
| **React 19** | Modern UI framework with concurrent features |
| **Vite** | High-performance build tool and dev server |
| **Chakra UI v3** | Modern, accessible component system |
| **Zustand** | Lightweight global state management (Auth and Cart stores) |
| **React Router 7** | Client-side routing with role-based `ProtectedRoute` guards |
| **Axios** | HTTP client with automatic JWT bearer injection and refresh interceptor |
| **Lucide / React Icons** | Clean vector iconography |

---

## 📁 Directory Structure

```
apps/web/src/
├── api/             # API request wrappers (auth, products, orders, reports)
├── assets/          # Static media and branding vectors
├── components/      # Reusable UI widgets (ProtectedRoute, DatePicker, AppStates)
├── hooks/           # Custom hooks (useAuth, useRefreshToken)
├── lib/             # Axios instance, toaster, color-mode utilities
├── pages/           # Screen views:
│   ├── LoginPage.tsx      # Multi-tenant credentials form + demo 1-click accounts
│   ├── PosPage.tsx        # Catalog search & shopping cart checkout
│   ├── ReceiptsPage.tsx   # Order history list
│   ├── ReceiptPage.tsx    # Detailed single order receipt
│   ├── ReportsPage.tsx    # Admin sales & margin metrics
│   ├── ForbiddenPage.tsx  # 403 Forbidden screen
│   └── NotFoundPage.tsx   # 404 Not Found screen
├── stores/          # Zustand state stores (auth, cart)
├── App.tsx          # Root routes and Navigation bar
└── main.tsx         # React root mounting and theme provider
```

---

## 🏃 Local Development

Run from the monorepo root:

```bash
# Start web client in dev mode (port 5173)
npm --workspace=apps/web run dev

# Or run both client and server concurrently
npm run dev
```

### Production Build
```bash
npm --workspace=apps/web run build
```
Static output is compiled to `dist/` ready for CDN distribution or Vercel static serving.
