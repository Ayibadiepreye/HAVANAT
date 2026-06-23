# HAVANAT

Where Style Meets Elegance. A luxury Nigerian fashion e-commerce frontend (React 19 + TypeScript + Vite + Tailwind + Zustand), complete with **Admin**, **Moderator**, and **Rider** dashboards, plus a full audit log system.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in with one of the demo accounts (panel is shown on the login page).

## Demo credentials

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@havanat.com` | `password` | `/admin` |
| Moderator | `moderator@havanat.com` | `password` | `/moderator` |
| Rider | `rider@havanat.com` | `password` | `/rider` |
| Customer (Standard) | `standard@havanat.com` | `password` | `/account` |
| Customer (Deluxe) | `deluxe@havanat.com` | `password` | `/account` |
| Customer (Elite) | `elite@havanat.com` | `password` | `/account` |

## Dashboards

### Admin (`/admin`)
Ten sections accessible from a fixed dark sidebar:
- **Overview** — 4 KPI cards, 30-day revenue chart, quick actions, recent activity feed
- **Products** — search, category & status filters, pagination, bulk select & delete, full add/edit form modal
- **Orders** — status tabs, search, full detail modal with tracking timeline, status updates, rider assignment
- **Members** — search & filters, full detail with subscription actions (cancel / change tier / refund)
- **Returns** — status tabs, view / approve / reject (with reason) / assign rider / process refund
- **Riders** — roster table, full add-rider form (mock ID upload), suspend / activate
- **Memberships** — 3 editable tier cards (price, billing cycle, feature list)
- **Content** — tabs for Homepage, Lookbook, Testimonials, Banners, Branding (every change auto-logs)
- **Audit Log** — top stats, filters (date / user / action / entity), search, side-by-side diff modal, **Revert** action, **CSV export**, pagination
- **Settings** — tabs for Site Config, Payment Gateways, Delivery Zones, Email Templates, Admin Users

### Moderator (`/moderator`)
Limited sidebar. All write actions auto-log to the audit log; admin can review and revert in `/admin/audit-log`.
- **Content** — full write access to homepage, lookbook, testimonials, banners, branding
- **Products** — read-only table
- **Orders** — read-only table

### Rider (`/rider`)
Mobile-friendly dark sidebar.
- **Dashboard** — online/offline toggle, today's stats, schedule list
- **Deliveries** — tabs by status, navigate-to-maps, full detail with OTP + photo + signature
- **Pickups** — return pickups with mark-picked-up / delivered-to-warehouse / report-issue
- **Earnings** — daily bar chart (last 7 days), payout history, request payout
- **Profile** — personal info, vehicle info, bank details, ID verification badge

## Design system (locked)

- **Colors** — pure white BG, near-black text, light gray borders, off-white surfaces, black accents. No blues/purples/gradients.
- **Type** — Playfair Display (serif) headings, Inter (sans) body, uppercase tracking-widest labels.
- **Buttons** — three patterns only: primary (filled black), secondary (outlined), ghost (underlined).
- **Inputs** — bottom-border style, focus = black border.
- **Icons** — Lucide React exclusively, sizes `h-4` / `h-5` / `h-6`.

## Architecture

- **State** — Zustand stores per domain (`useOrderStore`, `useReturnStore`, `useRiderStore`, `useContentStore`, `useMembershipStore`, `useAuditLogStore`, `useAdminUserStore`, `useDeliveryZoneStore`, `useProductStoreAdmin`). All persist to `localStorage`.
- **Audit** — every write action routes through `logAuditAction()` (`src/utils/auditLogger.ts`). Reverts create a new audit entry.
- **Auth** — `useAuthStore` keeps `user` (legacy) + `dashboardUser` (role-aware). `RoleGuard` (`src/components/auth/RoleGuard.tsx`) protects `/admin/*`, `/moderator/*`, `/rider/*`. The login page shows a side panel of demo accounts for one-click sign-in.
- **Mock data** — 15 orders, 8 returns, 5 riders, 20 deliveries, 8 members, 25 audit entries, 30 days of sales, lookbook/testimonials/banners/branding/admin users/zones.

## Switching to live API

Set `VITE_USE_MOCK=false` in `.env` and update `API_BASE_URL` in `src/config/index.ts`. The mock layer will continue to operate; swap in real `fetch()` calls in the store actions (or a new `src/api/` layer) to go live.

## Scripts

```bash
npm run dev      # start dev server on :3000
npm run build    # tsc -b && vite build
npm run preview  # preview the production build
```
