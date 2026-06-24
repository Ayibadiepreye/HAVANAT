# Havanat — Production-Readiness Review

> Living document. Updated as the production build progresses.
> Companion to `docs/FRONTEND.md` and `docs/BACKEND.md`.

**Brand:** Havanat (single-word spelling, matches the brand crest)
**Founder:** Rapheal Ebipado Otele
**Established:** 2014
**Tagline:** Where Style Meets Elegance

---

## 1. Brand assets (canonical)

| Asset | File | Use |
|-------|------|-----|
| Favicon | `public/favicon.svg` (224 KB hand-drawn crest) | All `<link rel="icon">`, browser tab |
| Dark-mode logo | `public/brand/logo-dark.png` (white logo on black) | On dark backgrounds — navbar, footer, dashboards |
| Light-mode logo | `public/brand/logo-light.png` (black logo on white) | On light backgrounds — login, About, account |
| Decorative crest | `public/brand/crest-transparent.png` (white line art, transparent BG) | Hero watermark, founder-card, AboutPage decorations |

All four are referenced via `BRAND.assets` in `src/config/brand.ts`. Never hardcode paths.

---

## 2. Founder references — full audit

Anywhere the founder name was previously `Emmanuel Adeyemi`, it has been changed to **Rapheal Ebipado Otele**.

| File | Status |
|------|--------|
| `src/data/founder.ts` | ✅ New canonical source (full bio, milestones, values) |
| `src/pages/AboutPage.tsx` | ✅ Rewritten with founder name + full bio + milestone timeline + crest decoration |
| `src/pages/HomePage.tsx` | ✅ Founder's Note block now shows Rapheal Ebipado Otele |
| `src/components/Footer.tsx` | ✅ Copyright line shows "Founded by Rapheal Ebipado Otele" |
| Mock customer "elite@havanat.com" | ✅ Renamed customer name to "Rapheal Ebipado Otele" in `useAuthStore.MOCK_ACCOUNTS` (since the founder is the Elite demo customer persona — keeps continuity) |

> Note: we use the founder's own name as one of the three demo customer accounts (the Elite tier) because no other persona exists. This is harmless because the auth demo is mock — but document it here for posterity.

---

## 3. Pages — full inventory

### Customer (public)

| Route | Page | Status |
|-------|------|--------|
| `/` | HomePage | ✅ Hero + trust bar + featured + story + categories + membership + community + bespoke CTA + newsletter |
| `/shop` | ShopPage | ✅ Filters + sort + grid |
| `/shop/:slug` | ProductDetailPage | ✅ Gallery + size + add-to-cart |
| `/cart` | CartPage | ✅ Line items + qty + totals |
| `/checkout` | CheckoutPage | ✅ Multi-step |
| `/about` | AboutPage | ✅ Crest hero + story + founder + values + milestones + CTA |
| `/contact` | ContactPage | ✅ Form |
| `/membership` | MembershipPage | ✅ 3 tiers |
| `/custom-request` | CustomSuitPage | ✅ Bespoke form |
| `/login` | LoginPage | ✅ Login + signup tabs + demo accounts |
| `/signup` | SignupPage | ✅ Standalone full signup |
| `/forgot-password` | ForgotPasswordPage | ✅ Email → OTP → reset |
| `/returns` | ReturnsPage | ✅ Customer returns |
| `/faq` | FAQPage | ✅ Accordion + category chips |
| `/shipping` | ShippingPage | ✅ Policy + zones table |
| `/size-guide` | SizeGuidePage | ✅ 3 measurement tables |
| `/privacy` | PrivacyPage | ✅ 8 sections |
| `/terms` | TermsPage | ✅ 10 sections |
| `/accessibility` | AccessibilityPage | ✅ WCAG statement |
| `/track` | TrackPage | ✅ Order tracking input + result |
| `/account` | AccountPage | ✅ Tabbed overview |
| `/profile` | ProfilePage | ✅ Full profile with 5 tabs |
| `/account/orders/:id` | OrderDetailPage | ✅ Full order detail with timeline |
| `/account/addresses` | AddressesPage | ✅ Address CRUD |
| `/wishlist` | WishlistPage | ✅ Standalone wishlist |
| `*` | NotFoundPage | ✅ 404 with crest + featured products |

### Admin

| Route | Page | Status |
|-------|------|--------|
| `/admin` | AdminOverview | ✅ 5 KPI cards + chart + sales-by-category + top products + recent customers + low stock |
| `/admin/products` | AdminProducts | ✅ Full CRUD + bulk select + CSV export |
| `/admin/orders` | AdminOrders | ✅ Full CRUD + status update + rider assignment + print invoice + duplicate + CSV export |
| `/admin/members` | AdminMembers | ✅ Filter + tier actions + send message |
| `/admin/returns` | AdminReturns | ✅ Approve/reject/assign/refund |
| `/admin/riders` | AdminRiders | ✅ CRUD + suspend/activate |
| `/admin/memberships` | AdminMemberships | ✅ 3 tier editors |
| `/admin/content` | AdminContent | ✅ 5 sub-editors |
| `/admin/team` | AdminTeam | ✅ Promote/demote/add/remove |
| `/admin/audit-log` | AdminAuditLog | ✅ Filters + diff + revert + CSV |
| `/admin/messages` | AdminMessages | ✅ Conversation list + bubbles |
| `/admin/notifications` | AdminNotifications | ✅ Notification center |
| `/admin/settings` | AdminSettings | ✅ 5 sub-tabs + editable email templates |

### Moderator

| Route | Page | Status |
|-------|------|--------|
| `/moderator` | ModeratorContent | ✅ 5 sub-editors |
| `/moderator/products` | ModeratorProducts | ✅ Full CRUD + status change |
| `/moderator/orders` | ModeratorOrders | ✅ Full CRUD + status + rider assignment |

### Rider

| Route | Page | Status |
|-------|------|--------|
| `/rider` | RiderDashboard | ✅ Stats + online toggle + schedule |
| `/rider/deliveries` | RiderDeliveries | ✅ Tabs + map links |
| `/rider/deliveries/:id` | RiderDeliveryDetails | ✅ OTP + photo + signature |
| `/rider/pickups` | RiderPickups | ✅ Mark picked up / delivered to warehouse |
| `/rider/earnings` | RiderEarnings | ✅ Bar chart + payouts |
| `/rider/profile` | RiderProfile | ✅ Personal + vehicle + bank + ID |

---

## 4. Design system — gaps filled

| Item | Status |
|------|--------|
| Color tokens locked (white/black/gray + status colors) | ✅ |
| Typography scale (Playfair Display + Inter) | ✅ |
| 3 button patterns (primary/secondary/ghost) | ✅ |
| Card style (white bg, gray border, hover black) | ✅ |
| Table style (uppercase tracking-widest headers, hover gray-50) | ✅ |
| Form inputs (bottom-border OR boxed, focus black) | ✅ |
| Icons (Lucide only, h-4/h-5/h-6) | ✅ |
| Animations (300ms hover, 700ms fade-in) | ✅ |
| Mobile breakpoints (sm 640 / md 768 / lg 1024) | ✅ |
| Dashboard sidebar = slide-in drawer on mobile | ✅ |
| Login form stacks on mobile | ✅ |
| StatsCard scales from text-2xl (mobile) → text-4xl (desktop) | ✅ |
| Footer with company links + newsletter + social + legal | ✅ |
| Brand crest displayed on About + Home hero + watermark | ✅ |
| Brand spelling "Havanat" everywhere | ✅ |

---

## 5. E-commerce features — production checklist

A standard luxury e-commerce site needs:

### Account & Auth

- [x] Sign up (separate page) with password strength meter
- [x] Login (with social buttons + demo accounts panel)
- [x] Forgot password flow (email → OTP → reset)
- [x] Email verification prompt (UI; backend wiring TBD)
- [x] Profile page with personal info / address / security / notifications / payments tabs
- [x] Change password
- [x] 2FA toggle (UI; backend wiring TBD)
- [x] Notification preferences (order updates / promotions / newsletter / SMS)
- [x] Payment methods CRUD (saved cards)

### Catalog & Browse

- [x] Shop with filters (category, fit, size, color, price range)
- [x] Sort (newest / price asc / price desc)
- [x] Pagination
- [x] Search (header)
- [x] Recently viewed
- [x] Product recommendations
- [x] Out-of-stock badge
- [x] Sale badge + original price strikethrough

### Product Detail

- [x] Image gallery (multiple images, thumbnails)
- [x] Size picker
- [x] Color picker
- [x] Quantity selector
- [x] Add to cart with size validation
- [x] Wishlist toggle
- [x] Share buttons
- [x] Shipping estimator (estimated delivery date)
- [x] Care instructions
- [x] Details tab
- [x] Reviews preview
- [ ] Q&A section (UI scaffolded, no real data)
- [ ] Complete-the-look (future)

### Cart

- [x] Line items with image / name / size / qty / price / remove
- [x] Quantity update
- [x] Subtotal + shipping + total
- [x] Apply coupon code (UI; backend TBD)
- [x] Saved-for-later (UI; backend TBD)
- [x] Free-shipping threshold indicator

### Checkout

- [x] Multi-step (address → delivery → payment → review)
- [x] Saved address selection
- [x] New address form
- [x] Delivery method picker (standard / express)
- [x] Payment method picker (Paystack / Flutterwave / Stripe UI)
- [x] Order summary
- [x] Order confirmation page

### Post-purchase

- [x] Order tracking page (`/track`)
- [x] Order detail page (`/account/orders/:id`)
- [x] Tracking timeline (visual + text)
- [x] Cancel order (if processing)
- [x] Request return
- [x] Download invoice (mock)
- [x] Contact rider / support

### Returns & Support

- [x] Returns page (initiate return with reason + photos)
- [x] Return status tracking
- [x] FAQ with category filters
- [x] Shipping & delivery policy
- [x] Size guide with measurement tables
- [x] Contact form
- [x] Live chat (mock UI)

### Trust & Policy

- [x] Privacy policy
- [x] Terms of service
- [x] Accessibility statement
- [x] Cookies consent (banner TBD)
- [x] About page with founder + values + milestones

### SEO & Discoverability

- [x] Page titles
- [x] Meta description
- [x] OG tags
- [x] Semantic HTML (`<main>`, `<section>`, `<nav>`, `<footer>`)
- [x] Skip-to-content link (TBD)
- [ ] Sitemap.xml (TBD)
- [ ] robots.txt (TBD)
- [ ] Structured data (Product schema, Organization schema)

### Performance

- [x] Vite code-splitting (routes via React Router)
- [x] Tailwind purge
- [ ] Image optimization (`<picture>` srcset, lazy loading for below-fold images)
- [ ] Bundle splitting (Recharts already lazy-friendly; consider route-level lazy)
- [ ] Service worker for offline catalog (future)

### Accessibility

- [x] Color contrast (black on white, gray-500 on white where readability allows)
- [x] Focus rings on buttons + inputs
- [x] Alt text on all product + community images
- [x] ARIA labels on icon-only buttons
- [x] Keyboard navigation (Tab / Shift+Tab works)
- [x] Form labels
- [ ] Screen reader live regions for toast notifications
- [ ] Skip-to-content link

---

## 6. Admin/Moderator/Rider — what's needed

### Admin (gap-fill beyond Kimi's spec)

- [x] Notification center (admin-only feed of platform events)
- [x] Message center (inbox of customer conversations)
- [x] Sales-by-category doughnut chart
- [x] Top products widget (best sellers by units + revenue)
- [x] Low-stock alerts widget
- [x] Recent customers widget
- [x] Active riders KPI (5th card)
- [x] CSV export on orders + products tables
- [x] Print invoice per order
- [x] Duplicate order action
- [x] Email template editor (inline subject + body, audit-logged)
- [x] Send-message-to-member modal
- [x] Team management (promote/demote/add/remove staff)

### Moderator (gap-fill)

- [x] Orders CRUD (status update, rider assignment, send email)
- [x] Product CRUD (add/edit/delete + status toggle)
- [x] Content (5 sub-editors) — full write
- [ ] Moderation queue for testimonials (pending vs approved)
- [ ] Bulk actions (approve/reject 10 testimonials at once)

### Rider (gap-fill)

- [x] Online/offline toggle with persisted status
- [x] Today's schedule
- [x] 4 status tabs on deliveries
- [x] Delivery detail with OTP + photo + signature
- [x] Pickup management (return pickups)
- [x] Earnings bar chart
- [x] Payout history + request payout
- [x] Profile editor + ID verification status
- [x] Phone numbers are clickable (tel: links)
- [x] Map links (Google Maps in new tab)
- [ ] In-app map placeholder (no real maps API key)
- [ ] Earnings goal tracker (set a monthly target)
- [ ] Performance metrics (acceptance rate, on-time %, customer rating)
- [ ] Calendar view for upcoming deliveries

---

## 7. Production-readiness gaps (still open)

These require the backend to be live:

| Gap | Reason | When to fix |
|-----|--------|-------------|
| Real payment gateway | Mock UI only | After Paystack/Flutterwave keys are added |
| Real email sending | Mock toasts | After Resend API key |
| Real image upload | Mock URLs | After S3/Cloudinary keys |
| Real SMS notifications | Mock | After Termii API key |
| Real 2FA | UI toggle only | After TOTP library + backend |
| Real search | Frontend filter | After Postgres full-text search |
| Real inventory sync | Frontend mock stock | After backend stock endpoint |
| Live audit log persistence | Currently localStorage only | After backend writes audit_log table |
| Coupon code redemption | UI button | After backend coupon endpoint |
| Saved-for-later | UI only | After backend endpoint |

---

## 8. Where to start the backend cutover

Once the backend at `backend/` is deployed:

1. Set `VITE_API_BASE_URL` and `VITE_USE_MOCK=false` in `app/.env`
2. In each store, replace local-mutation with `fetch()` to the matching route
3. Update `useAuthStore.login/signup/logout` to call `/api/auth/*` and store the access token in localStorage (key: `havanat-access-token`)
4. Add an axios/fetch wrapper with automatic token injection + 401 → refresh → retry
5. Wire the audit log: instead of writing to `useAuditLogStore`, the backend already logs every change. Replace the `logAction` import on the frontend with the read-only `useAuditLogStore` (read from `/api/audit`)

---

## 9. Demo credentials

| Role | Email | Password | What you'll see |
|------|-------|----------|-----------------|
| Admin | `admin@havanat.com` | `password` | Full admin dashboard |
| Moderator | `moderator@havanat.com` | `password` | Content + product + order write |
| Rider | `rider@havanat.com` | `password` | Rider dashboard with assigned deliveries |
| Customer (Standard) | `standard@havanat.com` | `password` | Account with Standard membership perks |
| Customer (Deluxe) | `deluxe@havanat.com` | `password` | Account with Deluxe membership perks |
| Customer (Elite) | `elite@havanat.com` | `password` | Account with Elite perks + custom suits |

---

## 10. Deploy checklist

- [x] Vercel project created at root (`Ayibadiepreye/HAVANAT`)
- [x] Frontend auto-deploys from `app/` directory on push to `main`
- [ ] Backend deploy (separate Vercel project, root `backend/`)
- [ ] Postgres provisioned (Neon recommended)
- [ ] JWT secrets generated
- [ ] CORS origins set to include frontend URL
- [ ] Domain pointed at Vercel (havanat.ng)
- [ ] Stripe/Paystack live keys in env
- [ ] Resend email domain verified
- [ ] S3 bucket + CloudFront distribution set up