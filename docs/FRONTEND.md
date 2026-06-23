# HAVANAT — Frontend Documentation

> Where Style Meets Elegance. A luxury Nigerian fashion e-commerce frontend (React 19 + TypeScript + Vite + Tailwind + Zustand), complete with **Admin**, **Moderator**, and **Rider** dashboards, plus a full audit log system.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Design System](#design-system)
5. [State Management](#state-management)
6. [Authentication & Multi-Role Auth](#authentication--multi-role-auth)
7. [Routing](#routing)
8. [Customer Site (14 pages)](#customer-site-14-pages)
9. [Admin Dashboard](#admin-dashboard)
10. [Moderator Dashboard](#moderator-dashboard)
11. [Rider Dashboard](#rider-dashboard)
12. [Audit Log System](#audit-log-system)
13. [Mock Data](#mock-data)
14. [Mobile Responsiveness](#mobile-responsiveness)
15. [Mock vs Live API Toggle](#mock-vs-live-api-toggle)
16. [Available Scripts](#available-scripts)
17. [Build & Deploy](#build--deploy)

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 19 |
| Language | TypeScript 5 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS (existing config) |
| UI Components | shadcn/ui (Radix primitives) |
| State | Zustand 5 (with `persist` middleware for localStorage) |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Animations | Framer Motion (where used) |

**Zero new dependencies added** — everything is built on the existing locked stack.

---

## Quick Start

```bash
# From the repo root:
cd app
npm install
npm run dev          # → http://localhost:3000
```

**Demo login:** the login page (`/login`) shows a side panel of 6 demo accounts. Click any one to autofill email + password. Password for all: `password`.

| Role | Email | Lands on |
|------|-------|----------|
| Admin | `admin@havanat.com` | `/admin` |
| Moderator | `moderator@havanat.com` | `/moderator` |
| Rider | `rider@havanat.com` | `/rider` |
| Customer (Standard) | `standard@havanat.com` | `/account` |
| Customer (Deluxe) | `deluxe@havanat.com` | `/account` |
| Customer (Elite) | `elite@havanat.com` | `/account` |

---

## Project Structure

```
app/
├── public/                       # Static assets, product/community/hero images
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, dialog, etc)
│   │   ├── auth/
│   │   │   └── RoleGuard.tsx     # Route-level role enforcement
│   │   ├── admin/                # Admin-only shared components
│   │   │   ├── AdminTable.tsx
│   │   │   ├── RoleBadge.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── dashboard/            # Shared dashboard chrome
│   │   │   ├── DashboardLayout.tsx  # Header + sidebar + drawer
│   │   │   └── DashboardSidebar.tsx # Collapsible sidebar
│   │   ├── shared/               # Cross-dashboard utilities
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── Navbar.tsx            # Public-site top bar (with role indicators)
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── ChatModal.tsx
│   │   ├── ReturnModal.tsx
│   │   └── Toast.tsx
│   ├── pages/
│   │   ├── HomePage.tsx          # 14 customer-facing pages
│   │   ├── ShopPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── MembershipPage.tsx
│   │   ├── CustomSuitPage.tsx
│   │   ├── AccountPage.tsx
│   │   ├── ReturnsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── admin/                # 11 admin pages
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminOverview.tsx
│   │   │   ├── AdminProducts.tsx + ProductFormModal.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   ├── AdminMembers.tsx
│   │   │   ├── AdminReturns.tsx
│   │   │   ├── AdminRiders.tsx
│   │   │   ├── AdminMemberships.tsx
│   │   │   ├── AdminContent.tsx
│   │   │   ├── content-editors/
│   │   │   │   ├── HomepageEditor.tsx
│   │   │   │   ├── LookbookEditor.tsx
│   │   │   │   ├── TestimonialsEditor.tsx
│   │   │   │   ├── BannersEditor.tsx
│   │   │   │   └── BrandingEditor.tsx
│   │   │   ├── AdminAuditLog.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   └── AdminTeam.tsx
│   │   ├── moderator/            # 3 moderator pages
│   │   │   ├── ModeratorLayout.tsx (in admin/AdminLayout.tsx)
│   │   │   ├── ModeratorContent.tsx
│   │   │   ├── ModeratorProducts.tsx
│   │   │   └── ModeratorOrders.tsx
│   │   └── rider/                # 6 rider pages
│   │       ├── RiderLayout.tsx
│   │       ├── RiderDashboard.tsx
│   │       ├── RiderDeliveries.tsx
│   │       ├── RiderDeliveryDetails.tsx
│   │       ├── RiderPickups.tsx
│   │       ├── RiderEarnings.tsx
│   │       └── RiderProfile.tsx
│   ├── stores/                   # Zustand stores (each persists to localStorage)
│   │   ├── useAuthStore.ts       # Multi-role auth (user + dashboardUser)
│   │   ├── useProductStore.ts    # Public catalog
│   │   ├── useProductStoreAdmin.ts # Admin/moderator product CRUD
│   │   ├── useCartStore.ts
│   │   ├── useOrderStore.ts      # Dashboard orders
│   │   ├── useReturnStore.ts
│   │   ├── useRiderStore.ts      # Rider roster + deliveries
│   │   ├── useMembershipStore.ts # Members + tier config
│   │   ├── useContentStore.ts    # Homepage/lookbook/testimonials/banners/branding
│   │   ├── useAuditLogStore.ts
│   │   ├── useAdminUserStore.ts  # Team management
│   │   ├── useDeliveryZoneStore.ts
│   │   └── useUIStore.ts
│   ├── data/
│   │   ├── mockData.ts           # Products, customers, memberships, orders, etc.
│   │   └── dashboardMockData.ts  # 15 orders, 8 returns, 5 riders, 20 deliveries, 25 audit entries, 30 days sales, 10 payouts
│   ├── types/
│   │   ├── index.ts
│   │   └── dashboard.ts          # All dashboard entity types
│   ├── utils/
│   │   ├── auditLogger.ts        # logAuditAction() — called by every write
│   │   ├── formatters.ts         # ₦ currency, dates, phone
│   │   └── permissions.ts        # hasRole / hasTier / ROLE_HOME
│   ├── config/index.ts           # Brand, USE_MOCK, API_BASE_URL
│   ├── hooks/                    # Custom hooks
│   ├── lib/utils.ts              # cn() helper
│   ├── App.tsx                   # All routes
│   ├── main.tsx                  # Entry
│   └── index.css                 # Tailwind base + theme tokens
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## Design System

### Colors (locked)

```css
--color-bg: #ffffff;          /* Pure white background */
--color-text: #0a0a0a;        /* Near-black primary text */
--color-text-muted: #6b6b6b;  /* Gray secondary text */
--color-border: #e5e5e5;      /* Light gray borders */
--color-surface: #fafafa;     /* Off-white surfaces/cards */
--color-accent: #000000;      /* Pure black for accents/buttons */
--color-success: #16a34a;
--color-error: #dc2626;
--color-warning: #f59e0b;
```

**Rule:** Use only these colors. No blues, no purples, no gradients (except subtle black-to-transparent for overlays).

### Typography

- **Serif** (headings): `Playfair Display`, fallback `Cormorant Garamond`
- **Sans** (body): `Inter`, fallback `Manrope`, then system-ui

| Level | Class |
|-------|-------|
| H1 | `font-serif text-5xl md:text-6xl lg:text-7xl font-light tracking-tight` |
| H2 | `font-serif text-3xl md:text-4xl lg:text-5xl font-light` |
| H3 | `font-serif text-2xl md:text-3xl` |
| Body | `font-sans text-base font-normal leading-relaxed` |
| Labels | `font-sans text-xs uppercase tracking-[0.2em] font-medium` |

### Buttons (3 patterns only)

```jsx
// Primary (filled black)
<button className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors duration-300">
  Button Text
</button>

// Secondary (outlined)
<button className="border border-black text-black px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-all duration-300">
  Button Text
</button>

// Ghost
<button className="text-black text-xs uppercase tracking-[0.2em] font-medium underline underline-offset-4 hover:opacity-60 transition-opacity">
  Button Text
</button>
```

### Cards

```jsx
<div className="bg-white border border-gray-200 p-6 hover:border-black transition-colors duration-300">
  {/* content */}
</div>
```

### Form inputs

```jsx
<input className="w-full border-b border-gray-300 bg-transparent px-0 py-3 text-base focus:border-black focus:outline-none transition-colors placeholder:text-gray-400" />
```

### Spacing

- Container: `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`
- Section padding: `py-16 md:py-24 lg:py-32`
- Grid gaps: `gap-6 md:gap-8`
- Card padding: `p-4 sm:p-6`

### Icons

Lucide React only. Sizes: `h-4 w-4` (small), `h-5 w-5` (medium), `h-6 w-6` (large). Thin lines, minimal.

### Animations

- Framer Motion for major transitions
- Hover: subtle scale, opacity shifts — never bouncy
- Duration: `duration-300` for hover, `duration-700` for major

---

## State Management

All state is managed with **Zustand** + `persist` middleware (auto-syncs to `localStorage`).

### Stores

| Store | Purpose | Persisted |
|-------|---------|-----------|
| `useAuthStore` | user + dashboardUser + login/logout | ✅ |
| `useProductStore` | Public product catalog | ✅ |
| `useProductStoreAdmin` | Admin/moderator product CRUD (delegates to product store) | (no persist) |
| `useCartStore` | Cart line items | ✅ |
| `useOrderStore` | Dashboard orders | ✅ |
| `useReturnStore` | Return requests | ✅ |
| `useRiderStore` | Rider roster + deliveries | ✅ |
| `useMembershipStore` | Members + tier definitions | ✅ |
| `useContentStore` | Homepage/lookbook/testimonials/banners/branding | ✅ |
| `useAuditLogStore` | Every state change ever made | ✅ |
| `useAdminUserStore` | Staff roster (admin/moderator/rider accounts) | ✅ |
| `useDeliveryZoneStore` | Nigerian state-level delivery fees + ETAs | ✅ |
| `useUIStore` | Toast queue, mobile menu state | (no persist) |

### Key pattern: stable selectors + useMemo

To avoid `Maximum update depth exceeded` and `getSnapshot should be cached` warnings, **all derived data is wrapped in `useMemo`** and selectors always return raw array/object references (never filtered inline). Example:

```tsx
// ✅ Correct
const deliveries = useRiderStore((s) => s.deliveries);
const myDeliveries = useMemo(() => deliveries.filter(d => d.riderId === id), [deliveries, id]);

// ❌ Wrong — creates new array every render
const myDeliveries = useRiderStore((s) => s.deliveries.filter(d => d.riderId === id));
```

---

## Authentication & Multi-Role Auth

### Roles

| Role | Tier (customer only) | Access |
|------|----------------------|--------|
| `customer` | `standard` | Shop, account, basic perks |
| `customer` | `deluxe` | + discounts, sneak peeks |
| `customer` | `elite` | + custom suits, concierge |
| `admin` | — | Full `/admin/*` + audit log + team management |
| `moderator` | — | `/moderator` content WRITE; products & orders full read-write; all actions audit-logged |
| `rider` | — | `/rider` dashboard; can update only assigned deliveries |

### `useAuthStore` shape

```typescript
interface User {
  id: string;            // e.g. usr_admin
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'moderator' | 'rider';
  tier?: 'standard' | 'deluxe' | 'elite';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;             // legacy customer-shaped
  dashboardUser: User | null;    // role-aware
  isAuthenticated: boolean;
  login: (email, password) => Promise<User | null>;
  signup: (data) => Promise<User | null>;
  logout: () => void;
  upgradeTier: (tier) => void;
  hasRole: (role) => boolean;
  hasTier: (tier) => boolean;
  isAtLeastTier: (tier) => boolean;
}
```

### `RoleGuard` (route protection)

```tsx
<RoleGuard roles={['admin']}>
  <AdminLayout>...</AdminLayout>
</RoleGuard>
```

Behavior:
- Not logged in → redirect to `/login?from=<current-path>`
- Logged in but wrong role → show "Access denied" toast (once per session), redirect to `/account`
- Logged in with correct role → render children

### Top bar role indicators

When logged in, the public `Navbar` shows a small uppercase badge linking to the matching dashboard:
- `ADMIN PANEL` → `/admin`
- `MODERATOR PANEL` → `/moderator`
- `RIDER PANEL` → `/rider`
- Customer menus unchanged

The role badge is hidden when already inside a dashboard (no double chrome).

### Post-logout redirect

All logout buttons (dashboard layout, account page) call `logout()` then `navigate('/', { replace: true })` so the user lands on the homepage, not stuck on a logged-out account page.

---

## Routing

```
/                            HomePage
/shop                        ShopPage (filters by category, fit, size, color)
/product/:slug               ProductDetailPage (gallery, sizes, add-to-cart)
/cart                        CartPage
/checkout                    CheckoutPage
/membership                  MembershipPage (3 tiers)
/custom-request              CustomSuitPage
/about                       AboutPage
/contact                     ContactPage
/login                       LoginPage (login + signup modes + demo accounts)
/returns                     ReturnsPage
/account                     AccountPage (orders, membership, addresses, wishlist, settings)

# Admin
/admin                       AdminOverview
/admin/products              AdminProducts
/admin/orders                AdminOrders
/admin/members               AdminMembers
/admin/returns               AdminReturns
/admin/riders                AdminRiders
/admin/memberships           AdminMemberships
/admin/content               AdminContent (5 sub-tabs)
  /admin/content#homepage
  /admin/content#lookbook
  /admin/content#testimonials
  /admin/content#banners
  /admin/content#branding
/admin/team                  AdminTeam (promote/demote staff)
/admin/audit-log             AdminAuditLog
/admin/settings              AdminSettings (5 sub-tabs)

# Moderator
/moderator                   ModeratorContent (5 sub-tabs, full write)
/moderator/products          ModeratorProducts (full CRUD, audit-logged)
/moderator/orders            ModeratorOrders (full CRUD, audit-logged)

# Rider
/rider                       RiderDashboard (online toggle + schedule)
/rider/deliveries            RiderDeliveries (4 status tabs)
/rider/deliveries/:id        RiderDeliveryDetails (OTP + photo + signature)
/rider/pickups               RiderPickups (return pickups)
/rider/earnings              RiderEarnings (bar chart + payouts)
/rider/profile               RiderProfile (editable form + ID verify)

*                            NotFoundPage
```

---

## Customer Site (14 pages)

The full public catalog + customer flow:

1. **Home** — hero slider, featured collection, lookbook, testimonials, value props
2. **Shop** — filter by category, fit, size, color, price
3. **Product detail** — image gallery, size picker, add to cart, related items
4. **Cart** — line items, quantity, total
5. **Checkout** — shipping address, payment, summary
6. **Membership** — Standard / Deluxe / Elite plan comparison
7. **Custom suit request** — bespoke form
8. **About** — brand story, founder
9. **Contact** — form + contact details
10. **Login / Signup** — social + email + demo accounts
11. **Returns** — initiate return, upload photos
12. **Account** — orders, membership, addresses, wishlist, settings
13. **Not Found** — 404
14. (Plus all dashboard pages documented below)

---

## Admin Dashboard

11 sections accessible from a fixed dark sidebar that becomes a slide-in drawer on mobile.

### 1. Overview (`/admin`)
- 4 KPI cards (orders, revenue, members, pending returns)
- 30-day revenue line chart (Recharts, monochrome)
- Quick actions panel
- Recent activity feed

### 2. Products (`/admin/products`)
- Search (name + slug)
- Category + status filters
- Bulk select + bulk delete
- Pagination (20/page)
- Add/Edit modal with full form (images, name, slug, category, price, sizes, colors, fit, description, details, care, tags, status)
- "Save & Add Another" option
- All actions audit-logged

### 3. Orders (`/admin/orders`)
- 5 status tabs: All, Processing, Shipped, Delivered, Cancelled
- Search (order #, customer name)
- Click row → detail modal
- Detail modal: customer info, items, payment, tracking timeline, status update, **assign rider** (when shipping), "Send Update Email" trigger
- All actions audit-logged

### 4. Members (`/admin/members`)
- Filter by tier + status
- Detail modal: full profile, order history, payment history
- Actions: cancel subscription, change tier, issue refund
- All actions audit-logged

### 5. Returns (`/admin/returns`)
- 5 status tabs: Pending, Approved, Rider Scheduled, Completed, Rejected
- View details, approve, reject (with reason), **assign rider for pickup**, process refund
- All actions audit-logged

### 6. Riders (`/admin/riders`)
- Table: name, phone, vehicle, plate, status, deliveries, rating
- Add rider modal (full form: name, phone, email, address, vehicle, plate, mock ID upload, bank details)
- Suspend / activate / delete
- All actions audit-logged

### 7. Memberships (`/admin/memberships`)
- 3 editable tier cards (Standard, Deluxe, Elite)
- Edit price, billing cycle toggles, feature list (add/remove items)
- "Save Changes" per tier, audit-logged

### 8. Content (`/admin/content`)
- 5 tabs: Homepage, Lookbook, Testimonials, Banners, Branding
- Each sub-editor has its own page: `content-editors/*`
- All writes audit-logged

### 9. Team (`/admin/team`)
- 3 stat cards (admin / moderator / rider counts)
- Table with **per-row role dropdown** — promote/demote between Admin / Moderator / Rider in one click
- Add staff modal
- Remove with guards (can't remove self, must keep ≥1 admin)
- All changes audit-logged

### 10. Audit Log (`/admin/audit-log`)
- Top stats: total actions today, most active user, most edited entity
- Filter bar: date range, user dropdown, action type (Create/Update/Delete/Revert), entity type
- Search by user name or entity ID
- Table: timestamp, user (avatar + name), role badge, action, entity, "View Changes"
- **Diff Modal** — side-by-side before/after JSON
- **Revert button** per entry (re-runs the inverse + logs a new revert action)
- **CSV export** (mock download)
- Pagination (50/page)

### 11. Settings (`/admin/settings`)
- 5 tabs: Site Config, Payment Gateways, Delivery Zones, Email Templates, Admin Users
- All writes audit-logged

---

## Moderator Dashboard

Limited sidebar (3 items). Auto-logs every write to the audit log.

| Sidebar | Access |
|---------|--------|
| **Content** | Full write — homepage, lookbook, testimonials, banners, branding |
| **Products** | Full CRUD — add, edit, delete, change status |
| **Orders** | Full CRUD — update status, assign rider, send email |

All admin actions taken by a moderator account are recorded with the moderator's name and role badge in the audit log so admins can review and revert.

---

## Rider Dashboard

Mobile-friendly dark sidebar (auto-collapses to drawer on phone).

### Dashboard (`/rider`)
- Welcome card with name, vehicle, plate, rating
- **Online / Offline toggle** (big button, status indicator)
- 3 KPI cards: today's deliveries, pending pickups, today's earnings
- Today's schedule list

### Deliveries (`/rider/deliveries`)
- 4 status tabs: Assigned, Picked Up, In Transit, Delivered
- Each card: type, ID, status, customer, address, items
- "Navigate" button → opens Google Maps in new tab
- "Open Task" → details page

### Delivery Details (`/rider/deliveries/:id`)
- Order info + customer + address
- Items list
- **Status update section:**
  - Picked Up → 4-digit OTP input (matches `1234` in mock)
  - In Transit → "Mark In Transit" button
  - Delivered → OTP + photo upload (drag/drop) + signature canvas (mouse/touch)
- Proof of delivery preview
- All status updates audit-logged (rider role)

### Pickups (`/rider/pickups`)
- Return pickups assigned by admin
- Mark picked up, deliver to warehouse, report issue
- Audit-logged

### Earnings (`/rider/earnings`)
- 4 stats: today, this week, this month, total
- Daily earnings bar chart (last 7 days, Recharts)
- Payout history table
- "Request Payout" button

### Profile (`/rider/profile`)
- Personal info (editable)
- Vehicle info (editable)
- Bank details (read-only)
- ID verification badge (Verified / Pending)
- "Upload Documents" button (mock)

---

## Audit Log System

**The single most important system feature.** Every state mutation routes through one function:

```typescript
// src/utils/auditLogger.ts
export const logAuditAction = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const log: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  useAuditLogStore.getState().addLog(log);
};
```

### Logged actions

Every store that performs a write calls `logAuditAction()`:

| Store | Actions |
|-------|---------|
| `useProductStoreAdmin` | create / update / delete / toggleStatus |
| `useOrderStore` | updateStatus, assignRider |
| `useReturnStore` | approve, reject, assignRider, processRefund |
| `useRiderStore` | create, update, suspend, activate, delete, updateDeliveryStatus |
| `useMembershipStore` | saveTier (any tier edit) |
| `useContentStore` | homepage update, lookbook add/edit/remove, testimonial add/edit/delete, banner add/edit/delete, branding update |
| `useDeliveryZoneStore` | add, update, remove |
| `useAdminUserStore` | add, remove, changeRole |

### Log entry shape

```typescript
interface AuditLogEntry {
  id: string;             // log-<ts>-<rand>
  timestamp: string;      // ISO
  userId: string;
  userName: string;
  userRole: 'admin' | 'moderator';
  action: 'create' | 'update' | 'delete' | 'revert';
  entityType: 'product' | 'order' | 'return' | 'rider' | 'delivery'
             | 'membership' | 'homepage' | 'lookbook' | 'testimonial'
             | 'banner' | 'branding' | 'delivery_zone' | 'settings' | 'staff';
  entityId: string;
  entityLabel: string;    // human-readable: "Product: Black Suit"
  summary: string;        // short: "Updated price"
  changes: { before: unknown; after: unknown };
}
```

### Reviewer features

- **Filter** by date / user / action / entity
- **Search** by user name or entity ID
- **Diff view** — side-by-side before/after JSON with color highlighting
- **Revert** — applies the inverse (logs as a new `revert` action)
- **CSV export** — mock download with all matching entries

---

## Mock Data

`src/data/dashboardMockData.ts` ships with:

- 15 orders (3 Processing, 4 Shipped, 6 Delivered, 2 Cancelled)
- 8 returns (2 Pending, 2 Approved, 2 Rider Scheduled, 1 Completed, 1 Rejected)
- 5 riders (with stats: deliveries, rating, earnings)
- 20 deliveries (mixed types + statuses)
- 8 members
- 25 audit entries (covering every entity type)
- 30 days of sales data (line chart)
- 10 payouts
- 8 promo banners
- 6 testimonials
- 12 lookbook images
- Branding config
- 6 admin/moderator/rider accounts
- Nigerian state delivery zones
- 4 email templates

---

## Mobile Responsiveness

All dashboards and the login page are fully responsive. Breakpoints used: `sm: 640px`, `md: 768px`, `lg: 1024px`.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Sidebar | Slide-in drawer with hamburger | Fixed 256px column |
| Header | Compact, truncated title | Full with breadcrumbs |
| Page h2 | `text-2xl` | `text-3xl` |
| Stat cards | `p-4`, value `text-2xl` | `p-6`, value `text-4xl` |
| Tables | `overflow-x-auto` | Same |
| Modals | `p-4` outer, `max-h-[90vh] overflow-y-auto` | `p-8`, full height |
| Login | Single column, demo accounts collapsed into accordion | Two columns (3/5 + 2/5) |

Drawer auto-closes on route change. Backdrop click closes drawer. Body scroll locked while drawer is open. User menu is click-outside dismissable.

---

## Mock vs Live API Toggle

`src/config/index.ts`:

```typescript
export const CONFIG = {
  USE_MOCK: true,
  API_BASE_URL: 'https://api.havanat.ng/v1',
  // ... brand config
};
```

### Switching to live API

1. Set `VITE_USE_MOCK=false` in `.env`
2. Update `API_BASE_URL` in `src/config/index.ts`
3. Replace the bodies of store actions (or wrap them in a new `src/api/` layer) with `fetch()` calls

The data shapes are already typed in `src/types/dashboard.ts`, so a `fetch` wrapper can be dropped in without further refactoring.

---

## Available Scripts

```bash
npm run dev        # Vite dev server on http://localhost:3000
npm run build      # tsc -b && vite build → ./dist
npm run preview    # Serve the production build locally
```

---

## Build & Deploy

### Vercel (recommended)

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → import your repo.
3. **Root Directory:** set to `app` (the Vite app lives in `app/`).
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Install Command:** `npm install`
7. Add env var: `VITE_API_BASE_URL` (when you have a backend).
8. Hit **Deploy**. Auto-deploys on every push to `main`.

### Netlify

```toml
# netlify.toml
[build]
  base    = "app"
  command = "npm run build"
  publish = "dist"
```

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `app/dist`
- Root directory: `app`

### Static hosting (any)

Run `npm run build`, then upload the contents of `app/dist/` to any static host (S3 + CloudFront, GitHub Pages, Firebase Hosting, etc.).

---

## License & Credits

Built for **Havanat** — Where Style Meets Elegance. Nigerian fashion, made global.
