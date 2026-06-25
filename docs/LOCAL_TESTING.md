# Havanat — Local Dev Setup

This doc explains how to run the **frontend (Vite/React)** and **backend (Express + Drizzle + Neon)** together on localhost.

## Prerequisites

- Node 22.x
- pnpm or npm

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — DATABASE_URL + JWT_*_SECRET + Resend + Paystack + Google OAuth
npx drizzle-kit generate
npx drizzle-kit migrate
npx tsx src/db/seed.ts
npx tsx src/server.ts
```

The backend listens on **http://localhost:4000**.

### Mock accounts (all password: `password`)

| Email | Role | Tier |
|---|---|---|
| `admin@havanat.store` | admin | standard |
| `moderator@havanat.store` | moderator | standard |
| `rider@havanat.store` | rider | standard |
| `standard@havanat.store` | customer | standard |
| `deluxe@havanat.store` | customer | deluxe |
| `elite@havanat.store` | customer | elite |

### Useful endpoints

```
GET    /health
POST   /api/auth/register
POST   /api/auth/login        → { user, accessToken, refreshToken }
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products
GET    /api/products/:id
POST   /api/products          (admin/moderator)
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/orders/mine
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status (admin/moderator/rider)

GET    /api/riders/me
GET    /api/riders/jobs
PUT    /api/riders/deliveries/:id/status

GET    /api/content/homepage
GET    /api/content/delivery-zones
GET    /api/content/lookbook
GET    /api/content/banners

GET    /api/audit             (admin only)
```

All authed endpoints expect `Authorization: Bearer <accessToken>`.

## 2. Frontend

```bash
cd app
npm install
node node_modules/vite/bin/vite.js dev --port 3000
```

The frontend listens on **http://localhost:3000**.

## 3. Frontend ↔ Backend wiring

The frontend is currently **mocked** (localStorage + Zustand). To wire it to the real backend, you would:

1. Add a Vite proxy: `vite.config.ts` →
   ```ts
   server: {
     proxy: {
       '/api': { target: 'http://localhost:4000', changeOrigin: true },
     },
   }
   ```
2. Replace `useAuthStore`'s localStorage persistence with `fetch('/api/auth/login', ...)` etc.

This is the next major task — it replaces every mock store with a real API call.

## 4. Common gotchas

### SSL warning from Neon

```
SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
```

This is **informational**, not a problem. Neon requires SSL and our `?sslmode=require` is correct.

### Backend exits silently on import error

Check `/tmp/backend.log` for `Error [ERR_MODULE_NOT_FOUND]` etc.

### Migration / seed fails with "relation does not exist"

Run migrations first: `npx drizzle-kit migrate`, then `npx tsx src/db/seed.ts`.

### Frontend can't reach backend

CORS is configured for `http://localhost:3000` and `http://localhost:3001` and `http://localhost:3002` in `backend/.env`. Add more origins in `CORS_ORIGINS` if you run on a different port.

## 5. Deploying to Render

1. Create a new **Web Service** on Render pointing at the `backend` directory
2. Build command: `npm install && npx drizzle-kit migrate`
3. Start command: `npx tsx src/server.ts`
4. Add all env vars from `backend/.env.example`
5. Set `CORS_ORIGINS` to your production frontend URL
6. After first deploy, run seed via Render shell: `npx tsx src/db/seed.ts`

## 6. Deploying frontend to Vercel

1. Connect the repo
2. Root directory: `app`
3. Build command: `npm run build`
4. Output dir: `dist`
5. Add env var: `VITE_API_URL=https://api.havanat.store`

---

**Last updated:** June 2026