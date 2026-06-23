# HAVANAT

> Where Style Meets Elegance. A luxury Nigerian fashion e-commerce platform.

This monorepo contains:

| Folder | Purpose | Stack |
|--------|---------|-------|
| [`app/`](./app/) | Customer storefront + Admin / Moderator / Rider dashboards | React 19 + TypeScript + Vite + Tailwind + Zustand |
| [`backend/`](./backend/) | REST API (auth, products, orders, returns, riders, audit log, CMS) | Node 22 + Express + TypeScript + Postgres (Drizzle) + JWT |
| [`docs/FRONTEND.md`](./docs/FRONTEND.md) | Frontend deep-dive: architecture, design system, all dashboards, audit log, mobile responsiveness |
| [`docs/BACKEND.md`](./docs/BACKEND.md) | Backend deep-dive: schema, API surface, audit, deploy to Vercel |

---

## Quick start

### Frontend

```bash
cd app
npm install
npm run dev          # → http://localhost:3000
```

Login at `/login` with any demo account (password: `password`).

| Role | Email |
|------|-------|
| Admin | `admin@havanat.com` |
| Moderator | `moderator@havanat.com` |
| Rider | `rider@havanat.com` |
| Customer (Standard / Deluxe / Elite) | `standard@havanat.com` / `deluxe@havanat.com` / `elite@havanat.com` |

### Backend

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL, JWT secrets
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev                   # → http://localhost:4000
```

`GET http://localhost:4000/health` → `{ ok: true, env, time }`

---

## Deploying the frontend to Vercel

1. Import `Ayibadiepreye/HAVANAT` from GitHub
2. **Root Directory:** `app`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`
6. Add env var: `VITE_API_BASE_URL` (when you have the backend up)
7. Deploy

## Deploying the backend to Vercel

See [`docs/BACKEND.md`](./docs/BACKEND.md) for the full guide. Short version:

1. Provision a Postgres DB (Neon / Supabase / Vercel Postgres)
2. Create a second Vercel project from the same repo
3. **Root Directory:** `backend`
4. Add env vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS` (include your frontend URL)
5. **Install Command:** `npm install && npm run db:generate && npm run db:migrate && npm run db:seed`
6. Deploy

---

## Project status

- [x] Customer storefront (14 pages)
- [x] Admin dashboard (10 sections + Team management)
- [x] Moderator dashboard (Content, Products, Orders — all with audit logging)
- [x] Rider dashboard (Deliveries, Pickups, Earnings, Profile)
- [x] Multi-role auth + RoleGuard route protection
- [x] Full audit log with diff view, revert, CSV export
- [x] Mobile responsive (slide-in drawer, touch-friendly forms)
- [x] Mock data layer (zero external dependencies to demo)
- [x] Backend API with Postgres + Drizzle + JWT + role middleware
- [x] 25-table schema with seed matching the frontend mock data
- [ ] Live payment integrations (Paystack / Flutterwave / Stripe — code scaffolded)
- [ ] Email transactional templates (Resend — code scaffolded)
- [ ] Object storage for product images (S3 / Cloudinary — code scaffolded)
