# Havanat Backend

REST API for the Havanat storefront + admin/moderator/rider dashboards. Node + Express + TypeScript + Postgres (Drizzle ORM) + JWT auth. Deploys as a Vercel serverless function or runs standalone with `tsx`.

---

## Quick start

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL, JWT secrets
npm install
npm run db:generate        # generate Drizzle migrations from src/db/schema.ts
npm run db:migrate         # apply migrations
npm run db:seed            # populate mock data (matches the frontend mockData)
npm run dev                # → http://localhost:4000
```

`GET http://localhost:4000/health` → `{ ok: true, env, time }`

---

## Architecture

```
backend/
├── src/
│   ├── server.ts          # Node entry
│   ├── app.ts             # Express app (also exported as Vercel function)
│   ├── vercel.ts          # Vercel serverless handler
│   ├── config.ts          # env-driven config
│   ├── lib/
│   │   ├── jwt.ts         # access + refresh token sign/verify
│   │   └── validators.ts  # Zod request schemas
│   ├── middleware/
│   │   └── auth.ts        # requireAuth, requireRole
│   ├── audit/
│   │   └── logger.ts      # logAction() — auto-logs every state change
│   ├── db/
│   │   ├── client.ts      # Drizzle + pg Pool
│   │   ├── schema.ts      # all 25 tables
│   │   └── seed.ts        # mock data seeder
│   └── routes/
│       ├── auth.ts        # /api/auth/*
│       ├── products.ts    # /api/products/*
│       ├── orders.ts      # /api/orders/*
│       ├── returns.ts     # /api/returns/*
│       ├── riders.ts      # /api/riders/*
│       ├── audit.ts       # /api/audit/*
│       ├── content.ts     # /api/content/* (CMS)
│       └── staff.ts       # /api/staff/* (admin team mgmt)
├── drizzle/               # generated migrations (after `npm run db:generate`)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Database schema (25 tables)

Defined in `src/db/schema.ts`. Migrations are generated with Drizzle Kit.

### Identity

| Table | Purpose |
|-------|---------|
| `users` | All accounts (customer / admin / moderator / rider) with bcrypt password hash |
| `refresh_tokens` | Hashed refresh tokens with revocation + expiry |

### Catalog

| Table | Purpose |
|-------|---------|
| `categories` | Product categories |
| `products` | Full catalog: images (JSON array), sizes, colors, tags, fit, price, stock |

### Cart & Orders

| Table | Purpose |
|-------|---------|
| `cart_items` | Per-user cart line items |
| `addresses` | Shipping addresses |
| `orders` | Order header with denormalized customer info + tracking events (JSON array) |
| `order_items` | Line items per order |

### Returns

| Table | Purpose |
|-------|---------|
| `returns` | Return requests with status workflow: pending → approved → rider_scheduled → completed (or rejected) |

### Riders & deliveries

| Table | Purpose |
|-------|---------|
| `rider_profiles` | Vehicle, plate, bank, ID verification, rating, status |
| `deliveries` | Per-task records (delivery or pickup) with OTP, proof photo URL, signature URL |
| `payouts` | Rider earnings payouts |

### Memberships

| Table | Purpose |
|-------|---------|
| `memberships` | Tier definitions (Standard, Deluxe, Elite) with price + features |
| `members` | Per-user membership subscriptions with next billing date |

### Content (CMS)

| Table | Purpose |
|-------|---------|
| `homepage` | Hero image, headline, tagline, featured product IDs |
| `lookbook` | Image grid with captions + order |
| `testimonials` | Name, avatar, rating, text, approved |
| `banners` | Promo banners with date range + active flag |
| `branding` | Logo, favicon, brand colors |

### Operations

| Table | Purpose |
|-------|---------|
| `delivery_zones` | Nigerian state-level fee + ETA |
| `payment_gateways` | Paystack / Flutterwave / Stripe toggles + keys |
| `email_templates` | Order confirmation, shipping update, etc. |

### Audit

| Table | Purpose |
|-------|---------|
| `audit_log` | Every state mutation, with before/after JSON, user, role, timestamp, entity type/id/label |

---

## API surface

All routes prefixed with `/api`. All non-public routes require `Authorization: Bearer <token>`.

### Public (no auth)

- `GET  /health`
- `GET  /api/products?category=&fit=&size=&color=&q=&inStock=&sort=&limit=&offset=`
- `GET  /api/products/:slug`
- `GET  /api/orders/:id` — public order tracking (only with valid token)
- `GET  /api/content/homepage`
- `GET  /api/content/lookbook`
- `GET  /api/content/testimonials`
- `GET  /api/content/banners`
- `GET  /api/content/branding`
- `GET  /api/content/delivery-zones`
- `GET  /api/content/memberships`

### Auth (`/api/auth`)

- `POST /register` — `{ name, email, password, phone? }` → `{ user, accessToken, refreshToken }`
- `POST /login` — `{ email, password }` → same
- `POST /refresh` — `{ refreshToken }` → rotated tokens
- `POST /logout` — revokes refresh token
- `GET  /me` — current user

### Products (`/api/products`) — auth required for writes

- `POST   /` — admin / moderator only
- `PATCH  /:id` — admin / moderator only
- `DELETE /:id` — admin / moderator only

### Orders (`/api/orders`)

- `GET  /mine` — customer's own orders
- `GET  /` — admin / moderator only, all orders with filters
- `POST /` — customer only, place new order
- `GET  /:id`
- `PATCH /:id/status` — admin / moderator
- `PATCH /:id/assign-rider` — admin / moderator

### Returns (`/api/returns`)

- `GET  /mine` — customer's own
- `GET  /` — admin / moderator
- `POST /` — customer
- `POST /:id/approve` — admin / moderator
- `POST /:id/reject` — admin / moderator (requires `{ reason }`)
- `POST /:id/assign-rider` — admin / moderator
- `POST /:id/refund` — admin only (requires `{ amount }`)

### Riders (`/api/riders`)

- `GET  /` — admin / moderator
- `POST /` — admin only (creates user + rider profile)
- `PATCH /:id/status` — admin only
- `GET  /me/deliveries` — rider only
- `GET  /me/payouts` — rider only
- `POST /me/payouts` — rider only
- `PATCH /deliveries/:id/status` — rider only (validates OTP for picked_up / delivered; photo + signature required for delivered)

### Audit (`/api/audit`)

- `GET  /?userId=&action=&entityType=&from=&to=&q=&limit=&offset=` — admin / moderator
- `GET  /stats` — top stats (actions today, most active user, most edited entity)
- `GET  /export.csv?from=&to=` — admin only

### Content (`/api/content`)

All write routes require admin or moderator.

- `GET / PUT  /homepage`
- `GET / POST / PATCH / DELETE /lookbook[/:id]`
- `GET / POST / PATCH / DELETE /testimonials[/:id]`
- `GET / POST / PATCH / DELETE /banners[/:id]`
- `GET / PUT  /branding`
- `GET / POST / PATCH / DELETE /delivery-zones[/:id]` — admin only for writes
- `GET / PUT  /memberships/:tier`
- `GET / PATCH /payment-gateways[/:id]` — admin only
- `GET /email-templates` — admin only

### Staff (`/api/staff`) — admin only

- `GET  /` — list all non-customer accounts
- `POST /` — create staff account
- `PATCH /:id/role` — change role
- `DELETE /:id` — remove staff

---

## Authentication

- **Access token** — short-lived JWT (default 1h), sent in `Authorization: Bearer …` header
- **Refresh token** — long-lived JWT (default 30d), stored hashed in `refresh_tokens` table, supports rotation and revocation
- **Passwords** — bcrypt with cost 10
- **Roles** — `customer | admin | moderator | rider`. Customer accounts also have a `tier`: `standard | deluxe | elite`

`requireAuth` middleware decodes the JWT and attaches `req.user`. `requireRole('admin', 'moderator')` enforces role-based access.

---

## Audit log

Every write route that mutates state calls `logAction()` from `src/audit/logger.ts`. The audit log captures:

- `timestamp`
- `userId`, `userName`, `userRole`
- `action` (create | update | delete | revert)
- `entityType` (product, order, return, rider, delivery, membership, homepage, lookbook, testimonial, banner, branding, delivery_zone, settings, staff)
- `entityId`, `entityLabel`
- `summary` (short human description)
- `before`, `after` — full JSON snapshots (nullable for create/delete)

The admin dashboard's `/admin/audit-log` page can:
- Filter by date / user / action / entity
- Search by user name or entity ID
- Side-by-side diff view
- Revert (logs a new `revert` action)
- CSV export

---

## Switching the frontend from mock to live API

In the frontend (`app/src/config/index.ts`):

```typescript
export const CONFIG = {
  USE_MOCK: false,
  API_BASE_URL: 'https://api.havanat.ng/v1',
  CURRENCY: '₦',
};
```

The Zustand stores in `app/src/stores/*` are the integration points. Replace the local-mutation logic in each store action with a `fetch()` call to the matching backend route. The TypeScript types in `app/src/types/dashboard.ts` align with the API response shapes.

---

## Vercel deployment

1. Create a Postgres database. Recommended: [Neon](https://neon.tech) (free tier), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres).
2. Copy `DATABASE_URL` from your provider.
3. Generate JWT secrets: `openssl rand -hex 32` twice, one for each.
4. Push the repo (already on GitHub).
5. In Vercel → New Project → import `Ayibadiepreye/HAVANAT`.
6. Set **Root Directory** to `backend`.
7. **Build Command:** `npm run build` (or skip, Vercel auto-detects).
8. **Output:** leave default (it'll detect `vercel.ts`).
9. Add env vars (see `.env.example`).
10. **Install Command:** `npm install && npm run db:generate && npm run db:migrate && npm run db:seed`
11. Deploy.

The Express app is exported as a Vercel function via `src/vercel.ts`. All `/api/*` routes become serverless functions.

### Custom `vercel.json` (optional)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/index.ts": { "maxDuration": 30 }
  }
}
```

---

## Environment variables

See `.env.example`:

```env
# Core
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://user:pass@host:5432/havanat

# Auth
JWT_ACCESS_SECRET=changeme
JWT_REFRESH_SECRET=changeme
JWT_ACCESS_TTL=1h
JWT_REFRESH_TTL=30d

# CORS
CORS_ORIGINS=http://localhost:3000,https://havanat.ng

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Storage (S3 or Cloudinary) — optional
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE=

# Email
RESEND_API_KEY=
EMAIL_FROM=orders@havanat.ng

# Payments
PAYSTACK_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=
STRIPE_SECRET_KEY=
```

---

## Rate limiting

120 requests / minute per IP by default. Configurable via `RATE_LIMIT_*` env vars. Helmet sets standard security headers. CORS is locked to the allowed origins.

---

## Migrations workflow

```bash
# After editing src/db/schema.ts:
npm run db:generate           # creates a migration in drizzle/
npm run db:migrate            # applies pending migrations

# Inspect the database:
npm run db:studio             # opens Drizzle Studio at https://local.drizzle.studio
```

---

## What's next

- [ ] Wire Paystack webhooks for payment confirmation
- [ ] Send transactional emails via Resend on order events
- [ ] Upload product images via signed S3 URLs (or Cloudinary)
- [ ] Add file-upload endpoint for rider proof-of-delivery (photo + signature)
- [ ] Add an index on `audit_log.timestamp` for fast time-range scans (already in schema)
- [ ] Add cron-driven payout reconciliation
- [ ] Add 2FA for admin accounts
- [ ] Add per-customer wishlist endpoint (currently frontend-only)
