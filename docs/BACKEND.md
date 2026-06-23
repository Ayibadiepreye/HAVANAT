# HAVANAT — Backend Documentation

> REST API + admin operations backend for the Havanat luxury Nigerian fashion e-commerce platform. Built to match the frontend's audit log, multi-role auth, order/return/rider/membership/content lifecycle, and team management model.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Monorepo Layout](#monorepo-layout)
4. [Quick Start (Local)](#quick-start-local)
5. [Environment Variables](#environment-variables)
6. [Database Schema (Drizzle)](#database-schema-drizzle)
7. [Auth + JWT](#auth--jwt)
8. [Role-Based Access Control](#role-based-access-control)
9. [Audit Log Middleware](#audit-log-middleware)
10. [API Reference](#api-reference)
    - [Auth](#auth-endpoints)
    - [Users & Customers](#users--customers)
    - [Products](#products)
    - [Orders](#orders)
    - [Returns](#returns)
    - [Riders & Deliveries](#riders--deliveries)
    - [Memberships](#memberships)
    - [Content](#content)
    - [Team (Staff)](#team-staff)
    - [Audit Log](#audit-log)
    - [Delivery Zones](#delivery-zones)
    - [Settings](#settings)
    - [Uploads](#uploads)
    - [Webhooks](#webhooks)
11. [Seed Script](#seed-script)
12. [Testing](#testing)
13. [Security Checklist](#security-checklist)
14. [Deploy to Vercel](#deploy-to-vercel)
15. [Deploy to Railway / Render / Fly.io](#deploy-to-railway--render--flyio)
16. [Background Jobs](#background-jobs)
17. [Observability](#observability)
18. [Cost Estimate](#cost-estimate)

---

## Overview

The Havanat backend is a stateless REST API that:

- Serves the React frontend (`https://havanat.com`)
- Persists all state in **PostgreSQL** (hosted on Neon)
- Generates short-lived **JWT access tokens** + rotating **refresh tokens** stored as httpOnly cookies
- Records every write to an immutable **audit log**
- Dispatches transactional **email** via Resend
- Accepts **image uploads** via Cloudinary signed uploads
- Charges customers via **Paystack** (with Flutterwave + Stripe as fallbacks)
- Sends **SMS** for OTP delivery to riders via Termii

The frontend's `useAuthStore.login(email, password)` hits `POST /api/auth/login`; the frontend's Zustand stores (orders, returns, products, content, etc.) map 1:1 to API resources.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js 20 LTS | Long-term support, native `fetch`, `crypto.subtle` |
| Framework | **Express 5** | Battle-tested, easy middleware model, fits Vercel functions |
| Language | TypeScript 5 | Type safety shared with frontend via `@havanat/shared` |
| ORM | **Drizzle ORM** | First-class TypeScript, edge-friendly, fast migrations |
| Database | **PostgreSQL** on **Neon** | Serverless Postgres, branching, free tier |
| Auth | **jose** (JWT) + bcrypt | Async-friendly, edge-compatible |
| Validation | **Zod** | Same schema on client + server |
| File upload | **Cloudinary** signed uploads | CDN, transforms, generous free tier |
| Email | **Resend** | Modern, React email, free tier |
| SMS / OTP | **Termii** | Nigerian SMS provider |
| Payment | **Paystack** (primary), Flutterwave, Stripe | Paystack is the standard for Nigerian merchants |
| Background jobs | **Inngest** (or BullMQ + Redis) | Serverless-friendly, retries, scheduled |
| Observability | **Sentry** + **Logflare** | Errors + structured logs |
| Rate limiting | `@upstash/ratelimit` (Redis) or `express-rate-limit` (memory) | Protects auth + writes |
| Testing | **Vitest** + **Supertest** | Fast, ESM-native |

---

## Monorepo Layout

```
havanat/                              ← repo root
├── app/                             ← existing React frontend
│   ├── src/...
│   └── package.json
├── api/                             ← THIS backend (new)
│   ├── src/
│   │   ├── server.ts                ← Express app entry
│   │   ├── env.ts                   ← Zod-validated env loader
│   │   ├── db/
│   │   │   ├── client.ts            ← Drizzle client (Neon HTTP)
│   │   │   ├── schema/
│   │   │   │   ├── index.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── returns.ts
│   │   │   │   ├── riders.ts
│   │   │   │   ├── deliveries.ts
│   │   │   │   ├── memberships.ts
│   │   │   │   ├── content.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── team.ts
│   │   │   │   ├── settings.ts
│   │   │   │   └── zones.ts
│   │   │   └── seed.ts              ← seeds mock data matching frontend
│   │   ├── lib/
│   │   │   ├── auth.ts              ← JWT sign/verify, password hash
│   │   │   ├── audit.ts             ← logAudit() helper
│   │   │   ├── permissions.ts       ← role gates
│   │   │   ├── errors.ts            ← AppError class + error middleware
│   │   │   ├── cloudinary.ts        ← signed upload signature
│   │   │   ├── paystack.ts          ← verify transaction
│   │   │   ├── resend.ts            ← send email
│   │   │   └── ratelimit.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      ← parse JWT, attach req.user
│   │   │   ├── authorize.ts         ← role gate
│   │   │   ├── audit.ts             ← auto-log writes
│   │   │   ├── cors.ts
│   │   │   ├── helmet.ts
│   │   │   └── validate.ts          ← Zod validator factory
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── returns.ts
│   │   │   ├── riders.ts
│   │   │   ├── deliveries.ts
│   │   │   ├── memberships.ts
│   │   │   ├── content.ts
│   │   │   ├── team.ts
│   │   │   ├── audit.ts
│   │   │   ├── zones.ts
│   │   │   ├── settings.ts
│   │   │   ├── uploads.ts
│   │   │   └── webhooks.ts
│   │   ├── jobs/
│   │   │   ├── orderStatusSync.ts
│   │   │   ├── payoutWeekly.ts
│   │   │   └── emailDigest.ts
│   │   └── types.ts                 ← shared types
│   ├── drizzle/                     ← generated migrations
│   ├── drizzle.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
├── packages/
│   └── shared/                      ← types & zod schemas shared by FE+BE
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas/             ← zod schemas for Order, Return, etc.
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── FRONTEND.md
│   └── BACKEND.md                   ← THIS file
├── package.json                     ← workspace root
├── pnpm-workspace.yaml
└── README.md
```

The repo uses **pnpm workspaces** (existing `package-lock.json` in `app/` can be replaced when ready).

```yaml
# pnpm-workspace.yaml
packages:
  - 'app'
  - 'api'
  - 'packages/*'
```

---

## Quick Start (Local)

```bash
# 1. Install all workspaces
pnpm install

# 2. Set up the database
cd api
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, etc (see below)

# 3. Run migrations
pnpm db:push          # or `pnpm db:migrate` if using versioned migrations

# 4. Seed mock data (matches frontend's dashboardMockData.ts)
pnpm db:seed

# 5. Start the API
pnpm dev              # → http://localhost:4000
```

The frontend already points at `http://localhost:4000` when `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=http://localhost:4000`.

---

## Environment Variables

`api/.env.example`:

```bash
# ── Core ──
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# ── Database (Neon) ──
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/havanat?sslmode=require

# ── Auth ──
JWT_SECRET=change-me-to-a-64-char-random-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
COOKIE_SECRET=change-me-too

# ── Cloudinary ──
CLOUDINARY_CLOUD_NAME=havanat
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
CLOUDINARY_UPLOAD_PRESET=havanat_signed

# ── Email (Resend) ──
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=orders@havanat.com

# ── SMS (Termii) ──
TERMII_API_KEY=TLxxxxx
TERMII_SENDER=Havanat

# ── Paystack ──
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx

# ── Background jobs (Inngest) ──
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=signkey-xxxxx

# ── Observability ──
SENTRY_DSN=https://xxxxx@sentry.io/123
LOG_LEVEL=info

# ── Rate limiting (Upstash Redis) ──
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## Database Schema (Drizzle)

All tables use UUIDv7 primary keys, `createdAt`/`updatedAt` timestamps, and soft-delete (`deletedAt`) where appropriate. Schemas map 1:1 to frontend types in `src/types/dashboard.ts`.

### `users`

```typescript
// api/src/db/schema/users.ts
import { pgTable, text, timestamp, uuid, varchar, pgEnum, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['customer', 'admin', 'moderator', 'rider']);
export const customerTier = pgEnum('customer_tier', ['standard', 'deluxe', 'elite']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  role: userRole('role').notNull().default('customer'),
  tier: customerTier('tier').default('standard'),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
  roleIdx: index('users_role_idx').on(t.role),
}));
```

### `products`

```typescript
export const productCategory = pgEnum('product_category', ['suits', 'blazers', 'trousers', 'shirts', 'outerwear', 'accessories', 'formal']);
export const productFit = pgEnum('product_fit', ['oversized', 'tailored', 'classic', 'slim']);
export const productStatus = pgEnum('product_status', ['active', 'draft', 'archived']);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  details: text('details'),
  care: text('care'),
  price: integer('price').notNull(),          // in kobo (smallest NGN unit)
  originalPrice: integer('original_price'),
  category: productCategory('category').notNull(),
  fit: productFit('fit').notNull(),
  sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
  colors: jsonb('colors').$type<string[]>().notNull().default([]),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  inStock: boolean('in_stock').notNull().default(true),
  status: productStatus('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  slugIdx: index('products_slug_idx').on(t.slug),
  statusIdx: index('products_status_idx').on(t.status),
}));
```

### `orders`

```typescript
export const orderStatus = pgEnum('order_status', ['pending_payment', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled']);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique(), // e.g. ORD-2026-0001
  customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').references(() => users.id, { onDelete: 'set null' }),
  status: orderStatus('status').notNull().default('pending_payment'),
  items: jsonb('items').$type<Array<{ productId: string; size: string; quantity: number; price: number }>>().notNull(),
  subtotal: integer('subtotal').notNull(),
  shippingFee: integer('shipping_fee').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull(),
  shippingAddress: jsonb('shipping_address').$type<{ street: string; city: string; state: string; country: string; phone: string }>().notNull(),
  paymentRef: varchar('payment_ref', { length: 128 }),
  paymentChannel: varchar('payment_channel', { length: 32 }),
  tracking: jsonb('tracking').$type<Array<{ status: string; timestamp: string; note?: string }>>().notNull().default([]),
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerIdx: index('orders_customer_idx').on(t.customerId),
  statusIdx: index('orders_status_idx').on(t.status),
  riderIdx: index('orders_rider_idx').on(t.riderId),
}));
```

### `returns`

```typescript
export const returnStatus = pgEnum('return_status', ['pending', 'approved', 'rider_scheduled', 'picked_up', 'delivered_to_warehouse', 'completed', 'rejected']);

export const returns = pgTable('returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  returnNumber: varchar('return_number', { length: 32 }).notNull().unique(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').references(() => users.id, { onDelete: 'set null' }),
  status: returnStatus('status').notNull().default('pending'),
  reason: text('reason').notNull(),
  rejectionReason: text('rejection_reason'),
  items: jsonb('items').$type<Array<{ productId: string; size: string; quantity: number }>>().notNull(),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  refundAmount: integer('refund_amount'),
  refundRef: varchar('refund_ref', { length: 128 }),
  pickupAddress: jsonb('pickup_address').$type<{ street: string; city: string; state: string; phone: string }>().notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('returns_order_idx').on(t.orderId),
  statusIdx: index('returns_status_idx').on(t.status),
}));
```

### `riders` + `deliveries` + `rider_payouts`

```typescript
export const riderStatus = pgEnum('rider_status', ['pending', 'active', 'suspended']);
export const vehicleType = pgEnum('vehicle_type', ['bike', 'car', 'van']);
export const deliveryType = pgEnum('delivery_type', ['delivery', 'pickup']);
export const deliveryStatus = pgEnum('delivery_status', ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']);
export const payoutStatus = pgEnum('payout_status', ['pending', 'processing', 'paid', 'failed']);

export const riders = pgTable('riders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  vehicleType: vehicleType('vehicle_type').notNull(),
  plateNumber: varchar('plate_number', { length: 16 }).notNull(),
  bankName: varchar('bank_name', { length: 64 }),
  accountNumber: varchar('account_number', { length: 16 }),
  accountName: varchar('account_name', { length: 128 }),
  idVerified: boolean('id_verified').notNull().default(false),
  status: riderStatus('status').notNull().default('pending'),
  rating: integer('rating').notNull().default(0),
  totalDeliveries: integer('total_deliveries').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  riderId: uuid('rider_id').notNull().references(() => riders.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  returnId: uuid('return_id').references(() => returns.id, { onDelete: 'set null' }),
  type: deliveryType('type').notNull(),
  status: deliveryStatus('status').notNull().default('assigned'),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 64 }).notNull(),
  state: varchar('state', { length: 64 }).notNull(),
  itemSummary: text('item_summary').notNull(),
  itemCount: integer('item_count').notNull().default(1),
  deliveryFee: integer('delivery_fee').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  otp: varchar('otp', { length: 4 }),
  proofPhotoUrl: text('proof_photo_url'),
  proofSignatureUrl: text('proof_signature_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  riderIdx: index('deliveries_rider_idx').on(t.riderId),
  statusIdx: index('deliveries_status_idx').on(t.status),
}));

export const riderPayouts = pgTable('rider_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  riderId: uuid('rider_id').notNull().references(() => riders.id),
  amount: integer('amount').notNull(),
  status: payoutStatus('status').notNull().default('pending'),
  reference: varchar('reference', { length: 128 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### `memberships` + `members` + `subscription_events`

```typescript
export const billingCycle = pgEnum('billing_cycle', ['monthly', 'quarterly', 'yearly']);
export const memberStatus = pgEnum('member_status', ['active', 'paused', 'cancelled', 'past_due']);

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  tier: customerTier('tier').notNull().unique(),
  displayName: varchar('display_name', { length: 64 }).notNull(),
  monthlyPrice: integer('monthly_price').notNull(),
  quarterlyPrice: integer('quarterly_price'),
  yearlyPrice: integer('yearly_price'),
  features: jsonb('features').$type<Array<{ label: string; included: boolean }>>().notNull().default([]),
  discountPercent: integer('discount_percent').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  membershipId: uuid('membership_id').notNull().references(() => memberships.id),
  status: memberStatus('status').notNull().default('active'),
  billingCycle: billingCycle('billing_cycle').notNull().default('monthly'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### `content`

```typescript
export const content = pgTable('content', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Homepage
  heroHeadline: text('hero_headline'),
  heroTagline: text('hero_tagline'),
  heroImageUrl: text('hero_image_url'),
  featuredCollectionIds: jsonb('featured_collection_ids').$type<string[]>().default([]),
  // Lookbook (array of {imageUrl, caption})
  lookbook: jsonb('lookbook').$type<Array<{ id: string; imageUrl: string; caption: string }>>().notNull().default([]),
  // Testimonials
  testimonials: jsonb('testimonials').$type<Array<{ id: string; name: string; rating: number; text: string; avatarUrl?: string }>>().notNull().default([]),
  // Banners
  banners: jsonb('banners').$type<Array<{ id: string; imageUrl: string; title: string; link: string; startDate: string; endDate: string; status: 'active' | 'scheduled' | 'expired' }>>().notNull().default([]),
  // Branding
  brandName: varchar('brand_name', { length: 64 }).notNull().default('HAVANAT'),
  logoLightUrl: text('logo_light_url'),
  logoDarkUrl: text('logo_dark_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: varchar('primary_color', { length: 9 }).default('#000000'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Singleton row
```

### `audit_log` (immutable)

```typescript
export const auditAction = pgEnum('audit_action', ['create', 'update', 'delete', 'revert']);
export const auditEntityType = pgEnum('audit_entity_type', [
  'product', 'order', 'return', 'rider', 'delivery', 'rider_payout',
  'membership', 'member', 'homepage', 'lookbook', 'testimonial',
  'banner', 'branding', 'delivery_zone', 'settings', 'staff', 'auth'
]);

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  actorRole: userRole('actor_role').notNull(),
  action: auditAction('action').notNull(),
  entityType: auditEntityType('entity_type').notNull(),
  entityId: varchar('entity_id', { length: 64 }).notNull(),
  entityLabel: text('entity_label').notNull(),
  summary: text('summary').notNull(),
  changesBefore: jsonb('changes_before'),
  changesAfter: jsonb('changes_after'),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  actorIdx: index('audit_actor_idx').on(t.actorUserId),
  entityIdx: index('audit_entity_idx').on(t.entityType, t.entityId),
  createdIdx: index('audit_created_idx').on(t.createdAt),
}));

// No updatedAt — append-only. Use a database trigger to block UPDATE/DELETE.
```

### `delivery_zones` + `settings` + `email_templates`

```typescript
export const deliveryZones = pgTable('delivery_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: varchar('state', { length: 64 }).notNull().unique(),
  fee: integer('fee').notNull(),        // in kobo
  etaDays: integer('eta_days').notNull().default(3),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 64 }).notNull().unique(),  // order_confirmation, shipping_update, return_approved
  subject: text('subject').notNull(),
  body: text('body').notNull(),                            // React Email JSX string
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Migration

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to dev DB
pnpm db:migrate

# Push schema directly (no migration file — dev only)
pnpm db:push
```

`drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
```

---

## Auth + JWT

`api/src/lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signAccessToken(user: { id: string; role: string; email: string; name: string; tier?: string }) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_TTL || '15m')
    .sign(SECRET);
}

export async function signRefreshToken(userId: string) {
  const jti = randomBytes(16).toString('hex');
  const token = await new SignJWT({ jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setSubject(userId)
    .setExpirationTime(process.env.JWT_REFRESH_TTL || '30d')
    .sign(REFRESH_SECRET);
  // Store jti in DB (refresh_tokens table) for revocation
  return token;
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { id: string; role: string; email: string; name: string; tier?: string };
}
```

### `refresh_tokens` table

```typescript
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  jti: varchar('jti', { length: 64 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### `authenticate` middleware

```typescript
// api/src/middleware/authenticate.ts
import { verifyAccessToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('Missing token', 401);
  try {
    req.user = await verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw new AppError('Invalid token', 401);
  }
}
```

---

## Role-Based Access Control

`api/src/lib/permissions.ts`:

```typescript
export const ROLES = ['customer', 'admin', 'moderator', 'rider'] as const;
export type Role = (typeof ROLES)[number];

const PERMS: Record<Role, Set<string>> = {
  customer: new Set(['orders:read:own', 'returns:write:own', 'cart:*', 'memberships:read']),
  moderator: new Set([
    'content:*', 'products:*', 'orders:read', 'orders:update', 'riders:read',
  ]),
  rider: new Set([
    'deliveries:read:assigned', 'deliveries:update:assigned', 'profile:update:own',
  ]),
  admin: new Set(['*']),
};

export function can(role: Role, action: string) {
  return PERMS[admin].has('*') || PERMS[role].has(action) || PERMS[role].has(action.split(':')[0] + ':*');
}
```

```typescript
// api/src/middleware/authorize.ts
import { can, type Role } from '@/lib/permissions';
import { AppError } from '@/lib/errors';

export const authorize = (action: string) => (req, _res, next) => {
  if (!req.user) throw new AppError('Unauthenticated', 401);
  if (!can(req.user.role as Role, action)) throw new AppError('Forbidden', 403);
  next();
};
```

---

## Audit Log Middleware

Every state-mutating route mounts `audit()` which captures before/after snapshots and writes a row to `audit_log`. The middleware is generic — handlers call it with the entity info.

```typescript
// api/src/middleware/audit.ts
import { db } from '@/db/client';
import { auditLog } from '@/db/schema/audit';

interface AuditOpts {
  entityType: AuditEntityType;
  entityId: (req) => string;
  entityLabel: (req, res) => string;
  action: 'create' | 'update' | 'delete' | 'revert';
  summary: string;
  changesBefore?: any;
  changesAfter?: any;
}

export const audit = (opts: AuditOpts) => (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400) return;
    try {
      await db.insert(auditLog).values({
        actorUserId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: opts.action,
        entityType: opts.entityType,
        entityId: String(opts.entityId(req)),
        entityLabel: opts.entityLabel(req, res),
        summary: opts.summary,
        changesBefore: opts.changesBefore,
        changesAfter: opts.changesAfter,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (err) {
      console.error('audit log failed', err);
    }
  });
  next();
};
```

Usage in a route:

```typescript
router.patch('/:id',
  authenticate,
  authorize('products:update'),
  validate(z.object({ name: z.string().optional(), price: z.number().int().min(0).optional() })),
  async (req, res) => {
    const before = await db.query.products.findFirst({ where: eq(products.id, req.params.id) });
    const after = await db.update(products).set(req.body).where(eq(products.id, req.params.id)).returning();
    res.json(after[0]);
    // Or use the middleware form (see advanced version with res.locals)
  },
  audit({
    entityType: 'product',
    entityId: (req) => req.params.id,
    entityLabel: (req) => `Product: ${req.body.name ?? req.params.id}`,
    action: 'update',
    changesAfter: (req, res) => res.locals.entity,
  })
);
```

For diff/revert, store the `before` snapshot in `res.locals` from the handler and the middleware reads it.

---

## API Reference

Base URL: `https://api.havanat.ng/v1` (production) or `http://localhost:4000/v1` (dev).

All endpoints respond with JSON. Errors follow `{ error: { code, message, details? } }`. Authenticated endpoints require `Authorization: Bearer <jwt>`.

### Auth endpoints

```
POST   /v1/auth/signup              { email, password, name, phone? }  → { user, accessToken, refreshToken }
POST   /v1/auth/login               { email, password }                → { user, accessToken, refreshToken }
POST   /v1/auth/refresh             { refreshToken }                   → { accessToken, refreshToken }
POST   /v1/auth/logout                                                → {} (clears cookies + revokes refresh)
POST   /v1/auth/forgot-password     { email }                          → {} (sends email)
POST   /v1/auth/reset-password      { token, newPassword }             → {}
POST   /v1/auth/verify-email        { token }                          → {}
GET    /v1/auth/me                                                    → { user }
```

### Users & Customers

```
GET    /v1/users/me
PATCH  /v1/users/me                 { name?, phone?, avatarUrl? }
POST   /v1/users/me/addresses
DELETE /v1/users/me/addresses/:id
GET    /v1/users/me/orders
GET    /v1/users/me/orders/:id
GET    /v1/users/me/membership
POST   /v1/users/me/membership/subscribe   { tier, billingCycle }
POST   /v1/users/me/membership/cancel
POST   /v1/users/me/membership/change-tier { tier }
GET    /v1/users/me/wishlist
POST   /v1/users/me/wishlist/:productId
DELETE /v1/users/me/wishlist/:productId
```

### Products

```
GET    /v1/products                  ?q=&category=&fit=&size=&color=&minPrice=&maxPrice=&page=&pageSize=&status=active
GET    /v1/products/:slug
GET    /v1/products/:id              (admin/moderator)
POST   /v1/products                  [admin|moderator]  { ... }  audit: create
PATCH  /v1/products/:id              [admin|moderator]  { ... }  audit: update
DELETE /v1/products/:id              [admin]            audit: delete (soft)
PATCH  /v1/products/:id/status      [admin|moderator]  { inStock, status? } audit: update
POST   /v1/products/bulk-delete      [admin]            { ids: string[] } audit: delete × N
```

### Orders

```
GET    /v1/orders                    [admin]            ?status=&customerId=&riderId=&from=&to=&page=
GET    /v1/orders/:id                [admin] or owner
PATCH  /v1/orders/:id/status         [admin]            { status, note? }  audit: update
POST   /v1/orders/:id/assign-rider   [admin]            { riderId }        audit: update
POST   /v1/orders/:id/send-email     [admin]            { template, vars? }
POST   /v1/orders                    [customer]         { items, address, paymentMethod }  → creates order + Paystack transaction
```

#### Status machine

```
pending_payment ──pay──> processing ──ship──> shipped ──pickup──> in_transit ──deliver──> delivered
                                                    └─────────────────────────────────> cancelled (refund flow)
```

Each transition logs an entry in `orders.tracking` and an audit row.

### Returns

```
GET    /v1/returns                   [admin]            ?status=&page=
GET    /v1/returns/:id
POST   /v1/returns                   [customer]         { orderId, items, reason, images[] }
POST   /v1/returns/:id/approve       [admin]                                audit: update
POST   /v1/returns/:id/reject        [admin]            { reason }         audit: update
POST   /v1/returns/:id/assign-rider  [admin]            { riderId }        audit: update
POST   /v1/returns/:id/refund        [admin]            → triggers Paystack refund   audit: update
POST   /v1/returns/:id/mark-picked-up   [rider]         (via /v1/deliveries/:id)
POST   /v1/returns/:id/mark-delivered   [rider]         (via /v1/deliveries/:id)
```

### Riders & Deliveries

```
GET    /v1/riders                    [admin]            ?status=&page=
GET    /v1/riders/:id                [admin]
POST   /v1/riders                    [admin]            { name, email, phone, vehicle, plate, bank }   audit: create
PATCH  /v1/riders/:id                [admin]                                                   audit: update
POST   /v1/riders/:id/suspend        [admin]                                                   audit: update
POST   /v1/riders/:id/activate       [admin]                                                   audit: update
DELETE /v1/riders/:id                [admin]                                                   audit: delete (soft)

GET    /v1/deliveries                [admin]            ?riderId=&status=&type=&from=&to=
GET    /v1/deliveries/me             [rider]            returns only the calling rider's deliveries
GET    /v1/deliveries/:id
POST   /v1/deliveries/:id/accept     [rider]            audit: update
POST   /v1/deliveries/:id/start      [rider]            (picked up — requires OTP)        audit: update
POST   /v1/deliveries/:id/in-transit [rider]                                                   audit: update
POST   /v1/deliveries/:id/complete   [rider]            { otp, photoUrl, signatureUrl }   audit: update
POST   /v1/deliveries/:id/fail       [rider]            { reason }                        audit: update

GET    /v1/deliveries/:id/earnings                              [rider]   (own only)
GET    /v1/rider-payouts             [rider]            ?status=
POST   /v1/rider-payouts/request     [rider]            audit: create
POST   /v1/rider-payouts/:id/mark-paid [admin]          audit: update
```

### Memberships

```
GET    /v1/memberships                                   (public — returns 3 tiers)
GET    /v1/memberships/:tier                             (public)
PATCH  /v1/memberships/:tier         [admin]            { displayName?, monthlyPrice?, features?, ... }  audit: update
GET    /v1/members                   [admin]            ?tier=&status=&page=
GET    /v1/members/:id               [admin]
POST   /v1/members/:id/cancel        [admin]                                                   audit: update
POST   /v1/members/:id/change-tier   [admin]            { tier, billingCycle }             audit: update
POST   /v1/members/:id/refund        [admin]            { amount, reason }                 audit: update
```

### Content

```
GET    /v1/content                                    (returns singleton)
PATCH  /v1/content/homepage        [admin|moderator]   { heroHeadline?, heroTagline?, heroImageUrl?, featuredCollectionIds? }  audit: update
PATCH  /v1/content/branding        [admin]            { brandName?, logoLightUrl?, logoDarkUrl?, primaryColor? }  audit: update

# Lookbook (array)
POST   /v1/content/lookbook         [admin|moderator]  { imageUrl, caption }  audit: create
PATCH  /v1/content/lookbook/:id     [admin|moderator]  { imageUrl?, caption? } audit: update
DELETE /v1/content/lookbook/:id     [admin|moderator]                                  audit: delete

# Testimonials
POST   /v1/content/testimonials     [admin|moderator]  { name, rating, text, avatarUrl? }  audit: create
PATCH  /v1/content/testimonials/:id [admin|moderator]  audit: update
DELETE /v1/content/testimonials/:id [admin|moderator]  audit: delete

# Banners
POST   /v1/content/banners          [admin|moderator]  { imageUrl, title, link, startDate, endDate }  audit: create
PATCH  /v1/content/banners/:id      [admin|moderator]  audit: update
DELETE /v1/content/banners/:id      [admin|moderator]  audit: delete
```

### Team (Staff)

```
GET    /v1/team                      [admin]            ?role=
POST   /v1/team                      [admin]            { name, email, role, phone? }  audit: create
DELETE /v1/team/:userId              [admin]            audit: delete (guarded: not self, ≥1 admin)
PATCH  /v1/team/:userId/role         [admin]            { role }  audit: update
```

### Audit Log

```
GET    /v1/audit                     [admin]            ?from=&to=&userId=&action=&entityType=&q=&page=&pageSize=
GET    /v1/audit/stats               [admin]            → { todayCount, topUser, topEntity }
GET    /v1/audit/:id                 [admin]
POST   /v1/audit/:id/revert          [admin]            → applies inverse, logs new revert entry
GET    /v1/audit/export.csv          [admin]            → text/csv download
```

### Delivery Zones

```
GET    /v1/delivery-zones
POST   /v1/delivery-zones            [admin]            { state, fee, etaDays }  audit: create
PATCH  /v1/delivery-zones/:id        [admin]            audit: update
DELETE /v1/delivery-zones/:id        [admin]            audit: delete
```

### Settings

```
GET    /v1/settings
GET    /v1/settings/:key
PUT    /v1/settings/:key             [admin]            { value }  audit: update

# Payment gateway toggles
GET    /v1/settings/payment-gateways
PUT    /v1/settings/payment-gateways/paystack     [admin]   { enabled }  audit: update
PUT    /v1/settings/payment-gateways/flutterwave  [admin]   { enabled }  audit: update
PUT    /v1/settings/payment-gateways/stripe       [admin]   { enabled }  audit: update

# Email templates
GET    /v1/email-templates
PUT    /v1/email-templates/:key      [admin]            { subject, body }  audit: update
```

### Uploads

```
POST   /v1/uploads/sign              [admin|moderator]  { folder: 'products' | 'lookbook' | 'banners' | 'testimonials' | 'riders' }
                                                            → { signature, timestamp, apiKey, cloudName, folder, publicId }
# Frontend then POSTs the file directly to https://api.cloudinary.com/v1_1/<cloud>/upload with that signature.
```

### Webhooks

```
POST   /v1/webhooks/paystack         (no auth — verified by signature)  payment events
POST   /v1/webhooks/cloudinary      (no auth)                          for upload notifications (optional)
```

Paystack webhook handler:

```typescript
router.post('/webhooks/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!verifyPaystackSignature(signature, req.rawBody, process.env.PAYSTACK_WEBHOOK_SECRET)) {
    return res.status(400).send('invalid signature');
  }
  const event = req.body;
  switch (event.event) {
    case 'charge.success':     await handleChargeSuccess(event.data); break;
    case 'transfer.success':   await handlePayoutSuccess(event.data); break;
    case 'refund.processed':   await handleRefundProcessed(event.data); break;
  }
  res.sendStatus(200);
});
```

---

## Seed Script

`api/src/db/seed.ts` mirrors the frontend's `dashboardMockData.ts` so the same demo accounts, products, and orders appear when the frontend flips to `USE_MOCK=false`.

```typescript
// pnpm db:seed
import { db } from './client';
import { users, products, orders, returns, riders, deliveries, memberships, members, content, auditLog, refreshTokens, emailTemplates, deliveryZones } from './schema';
import { hashPassword } from '@/lib/auth';
import { MOCK_ACCOUNTS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_RETURNS, MOCK_RIDERS, MOCK_DELIVERIES, MOCK_CONTENT, MOCK_AUDIT, MOCK_SALES, MOCK_PAYOUTS, MOCK_MEMBERS, MOCK_ZONES, MOCK_TEMPLATES } from '@havanat/shared/mocks';

async function main() {
  console.log('clearing existing data...');
  await db.delete(auditLog);
  // (TRUNCATE all other tables in dependency order)

  console.log('inserting users...');
  const hashedUsers = await db.insert(users).values(
    MOCK_ACCOUNTS.map(a => ({ ...a, passwordHash: await hashPassword(a.password) })),
  ).returning();

  console.log('inserting products...');
  await db.insert(products).values(MOCK_PRODUCTS);

  console.log('inserting orders...');
  await db.insert(orders).values(MOCK_ORDERS);

  // ... same for returns, riders, deliveries, memberships, members, content, audit_log, zones, templates

  console.log('✓ seed complete');
}

main().catch(console.error);
```

Run with: `pnpm db:seed`. Re-runnable (TRUNCATEs first).

---

## Testing

`api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});
```

Test categories:
- **Unit**: `auth.test.ts` (hash/verify/JWT), `permissions.test.ts` (RBAC matrix), `paystack.test.ts` (signature verify)
- **Integration**: route tests against a PGlite in-memory DB
- **E2E**: `supertest` POSTs to a running server with seed data

```typescript
// api/test/orders.test.ts
import request from 'supertest';
import { app } from '@/server';
import { getTestToken } from './helpers';

describe('POST /v1/orders', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/v1/orders').send({});
    expect(res.status).toBe(401);
  });
  it('creates an order for the calling customer', async () => {
    const token = await getTestToken('customer');
    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 'p1', size: 'M', quantity: 1 }], address: fakeAddress() });
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^ORD-/);
  });
});
```

---

## Security Checklist

- ✅ Passwords: bcrypt cost 12+ (or argon2id)
- ✅ JWTs: short access TTL (15m), rotating refresh (30d), refresh jti stored in DB for revocation
- ✅ Cookies: `httpOnly`, `secure`, `sameSite=lax`
- ✅ All write endpoints: `authenticate` + `authorize` + `validate` + `audit`
- ✅ All inputs: Zod-validated; reject unknown fields (`z.strict()`)
- ✅ Rate limit: `/v1/auth/*` 5 req/min/IP, `/v1/*` writes 60 req/min/user
- ✅ CORS: allowlist `APP_URL`
- ✅ Helmet: defaults + CSP `default-src 'self'; img-src 'self' https://res.cloudinary.com data:;`
- ✅ SQL: Drizzle parameterised queries only (no string concat)
- ✅ File uploads: signed Cloudinary (no direct upload to backend)
- ✅ Webhooks: signature verification
- ✅ Sensitive data: redact `passwordHash`, `paystack_secret` from logs
- ✅ Error responses: don't leak stack traces in prod
- ✅ Admin actions: append-only audit log; trigger blocks UPDATE/DELETE on `audit_log`
- ✅ DB: row-level permissions via Postgres roles if needed
- ✅ Secrets: Vercel env vars (never in repo)

---

## Deploy to Vercel

The API lives in `api/` and is **Vercel-ready** as a serverless function.

### 1. `vercel.json` at repo root

```json
{
  "version": 2,
  "builds": [
    { "src": "api/src/server.ts", "use": "@vercel/node" },
    { "src": "app/package.json",  "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "routes": [
    { "src": "/v1/(.*)", "dest": "api/src/server.ts" },
    { "src": "/(.*)",   "dest": "app/$1" }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "RESEND_API_KEY": "@resend_api_key",
    "CLOUDINARY_API_SECRET": "@cloudinary_api_secret",
    "PAYSTACK_SECRET_KEY": "@paystack_secret_key"
  }
}
```

### 2. Set up Neon Postgres

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string into `DATABASE_URL` in Vercel env.
3. From your local machine (one time):

```bash
cd api
pnpm db:migrate     # runs drizzle migrations
pnpm db:seed        # seeds mock data
```

For production data, you can either:
- Disable seeding and let the app create records via API
- Or run a one-off `pnpm db:seed:prod` (gated by `NODE_ENV=production`)

### 3. Configure other services

| Service | Sign-up | Vercel env vars |
|---------|---------|----------------|
| **Cloudinary** | [cloudinary.com](https://cloudinary.com) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Resend** | [resend.com](https://resend.com) | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Termii** | [termii.com](https://termii.com) | `TERMII_API_KEY`, `TERMII_SENDER` |
| **Paystack** | [paystack.com](https://paystack.com) | `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` |
| **Inngest** | [inn.gs](https://inn.gs) | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| **Sentry** | [sentry.io](https://sentry.io) | `SENTRY_DSN` |
| **Upstash Redis** | [upstash.com](https://upstash.com) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

### 4. Set up Paystack webhook

In Paystack dashboard → Settings → API & Webhooks:
- Webhook URL: `https://api.havanat.ng/v1/webhooks/paystack`
- Copy the signing secret to `PAYSTACK_WEBHOOK_SECRET`

### 5. Deploy

```bash
# from repo root
vercel --prod
```

That's it. The frontend and API deploy together. Custom domain: Vercel → Domains → add `havanat.ng` (or `havanat.com`).

---

## Deploy to Railway / Render / Fly.io

If you prefer not to use Vercel (e.g. for long-running background workers):

### Railway

1. New project → Deploy from GitHub.
2. Root: `api`
3. Build: `pnpm install && pnpm build`
4. Start: `node dist/server.js`
5. Add Postgres plugin → copy `DATABASE_URL`.
6. Set other env vars.
7. One-time migration: `railway run pnpm db:migrate && railway run pnpm db:seed`

### Render

1. New → Web Service → connect repo, root `api`.
2. Build: `pnpm install && pnpm run build && pnpm run db:migrate`
3. Start: `node dist/server.js`
4. Add Render Postgres → wire `DATABASE_URL`.
5. Set env.

### Fly.io

```bash
fly launch --dockerfile api/Dockerfile
fly postgres create
fly postgres attach <db-name>
fly secrets set JWT_SECRET=... RESEND_API_KEY=...
fly deploy
```

`api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

## Background Jobs

`api/src/jobs/` runs on **Inngest** (serverless, no infra) or **BullMQ + Redis** (if you self-host).

| Job | Schedule | Purpose |
|-----|----------|---------|
| `orderStatusSync` | every 1h | Reconcile `pending_payment` orders with Paystack |
| `payoutWeekly` | Mon 00:00 UTC | Aggregate completed deliveries → rider payouts |
| `emailDigest` | weekly | Send "you might also like" emails to customers |
| `auditCleanup` | monthly | Archive `audit_log` rows > 1 year to cold storage |
| `deliveryReminder` | every 30m | SMS rider if assigned delivery starts in 2h |

Inngest example:

```typescript
// api/src/jobs/orderStatusSync.ts
import { inngest } from '@/lib/inngest';
import { db } from '@/db/client';
import { orders } from '@/db/schema/orders';
import { eq, and, lt } from 'drizzle-orm';
import { verifyTransaction } from '@/lib/paystack';

export const orderStatusSync = inngest.createFunction(
  { id: 'order-status-sync', name: 'Sync pending payments' },
  { cron: '0 * * * *' },
  async ({ step }) => {
    const stale = await db.query.orders.findMany({
      where: and(eq(orders.status, 'pending_payment'), lt(orders.createdAt, subHours(new Date(), 1))),
    });
    for (const order of stale) {
      const result = await step.run(`verify-${order.id}`, () => verifyTransaction(order.paymentRef));
      if (result.status === 'success') {
        await db.update(orders).set({ status: 'processing' }).where(eq(orders.id, order.id));
      }
    }
  }
);
```

Register all jobs in `api/src/server.ts` via `inngest.serve()`.

---

## Observability

### Sentry

```typescript
// api/src/lib/sentry.ts
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});
```

### Structured logs (Pino)

```typescript
// api/src/lib/logger.ts
import pino from 'pino';
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
```

### Health check

```
GET /v1/health    → { ok: true, db: 'up', timestamp: '...' }
```

Mount `Sentry.expressErrorHandler` as the last middleware.

---

## Cost Estimate (Hobby Tier)

| Service | Free tier | Production tier |
|---------|-----------|-----------------|
| Vercel | 100 GB bandwidth/mo, 100 GB-hrs serverless | $20/mo Pro |
| Neon Postgres | 0.5 GB storage, 190 compute-hrs/mo | $19/mo Launch (10 GB) |
| Cloudinary | 25 credits/mo (~25 GB storage + 25 GB bandwidth) | $99/mo Plus |
| Resend | 100 emails/day | $20/mo (50K) |
| Termii | 100 SMS (one-off) | ₦50/unit |
| Paystack | 1.4% + ₦100 per transaction (no monthly fee) | — |
| Inngest | 1K events/mo | $20/mo (50K) |
| Sentry | 5K errors/mo | $26/mo Team |
| Upstash Redis | 10K req/day | $0.20 per 100K req |

**Realistic estimate for a launch with 1K orders/month:** ~$120–$180/mo + Paystack transaction fees (₦145K + 1.4% of revenue).

---

## Open Questions / Future Work

- **Image optimization** — currently all transforms are Cloudinary URL params; could add a CDN-friendly responsive `<img srcset>`
- **Multi-currency** — schema is NGN-only; add `currency` column if expanding
- **Inventory** — currently `inStock` is a flag; upgrade to per-size stock counts when SKU system is added
- **Reviews** — out of scope for v1; the schema has `rating` on `riders` but no product reviews yet
- **Multi-warehouse** — single warehouse in Lagos; add `warehouses` table + per-warehouse stock
- **i18n** — currently English-only; add a `translations` table for FR/IG/YO
- **Admin 2FA** — TOTP via `otplib` for `admin` role

---

## License & Credits

Built for **Havanat** — Where Style Meets Elegance. Nigerian fashion, made global.
