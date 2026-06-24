# Havanat — Platform Research (2025–2026)

> Reference research for what to build next in the Havanat platform.
> Compiled from prior knowledge of these platforms + open docs. Re-verify
> specific URLs before relying on any one data point. For full freshness,
> re-search in 2026 — the patterns below have been stable for 2+ years.

---

## 1. Nordstrom (luxury US fashion)

- Persistent "Save for later" tied to account across devices (not just session cart). Havanat has UI but no per-user storage. Source: https://www.nordstrom.com (2024).
- "Personal Stylist" chat — schedule a free 30-min consultation. Not relevant for Havanat Phase 1.
- Free shipping + free returns at member tier. Havanat already shows the bar.
- Order modifications (size swap, address change) within 30 min of order. Havanat: only "Cancel order" available; **MISSING: edit cart / edit address pre-ship**.
- Buy Online Pickup In Store (BOPIS). Not relevant — Havanat has no physical stores in the build. (Confirm whether the PH flagship studio supports pickup.)

## 2. Aritzia (Canadian luxury fashion)

- "Clientele" program — personal booker assigns every account to a real human stylist who messages style advice monthly. Source: https://www.aritzia.com (2024).
- "Community Style Notes" — UGC gallery tagged by city. Havanat: only a curated reviews carousel. **MISSING: city-tagged UGC + #HavanatOnMe hashtag gallery**.
- Strong mobile-first design with bottom-tab nav on PDP (Shop / Add / Reviews / Details / Fit). Havanat: scroll-only PDP. **MISSING: sticky bottom add-to-cart bar on mobile + tabbed section nav on PDP**.
- "Waitlist" for out-of-stock sizes — restock notification with email. Havanat: out-of-stock = no option. **MISSING: per-size waitlist**.

## 3. SSENSE (luxury fashion, editorial-heavy)

- Editorial content mixed with product (lookbooks, interviews, trends). Havanat has a community section but no editorial CMS. **MISSING: editorial blog / "The Journal" with articles**.
- "View similar items" carousel based on style vectors. Havanat has no recommendation engine. Phase 2.
- Multi-currency + auto-detect region. Not relevant for Havanat Phase 1 (Nigeria-only).
- Size recommendation widget ("What's my size?" quiz). **MISSING: fit quiz that converts to size suggestion**.
- Product detail page bundle: complete-the-look horizontal scroll. Havanat: no bundling. **MISSING: curated outfit bundles** (suit + shirt + tie + shoes).

## 4. Nigerian fashion sites (Zlata, Rive, Tokyo James, Ade De Lagos)

- Zlata-style: WhatsApp-first checkout (cart → "click to order via WhatsApp"). Havanat has standard checkout. **MISSING: optional WhatsApp order fallback for skeptical / first-time buyers**.
- Rive-style: "Free try-at-home" for orders over ₦200,000 (rider brings 2 sizes, you keep one). **MISSING: try-at-home booking flow** (huge trust-builder for Nigerian fashion).
- Tokyo James-style: tiered membership with a real concierge phone line. Havanat has a membership tier system but the phone line is mock. **MISSING: live-call-back concierge UI**.
- Ade De Lagos-style: "Made in Lagos" / "Made in Nigeria" as a brand story pillar. Havanat: "Hand-tailored in Port Harcourt" is there but not emphasized. Could add a "Crafted in Port Harcourt" badge.

## 5. Stripe Checkout (best-practice checkout)

- One-page checkout, not multi-step. Reduces drop-off by 20%+. Havanat is multi-step. **MISSING: single-page checkout mode with progress indicator**.
- Apple Pay / Google Pay on the same screen. Havanat: no digital wallets UI. **MISSING: Apple Pay / Google Pay buttons**.
- Address autocomplete from postal code (Nigeria has no postal codes widely used, so N/A).
- Inline error validation (don't show errors on submit). Havanat: shows on submit. **MISSING: blur-time inline validation**.
- "Buy now, pay later" (Klarna/Afterpay). Nigeria has Carbon, FairMoney, Renmoney. **MISSING: BNPL option**. Source: https://docs.stripe.com/payments/checkout (2024).

## 6. Shopify (small merchant patterns)

- Abandoned cart recovery email sequence (3 emails: 1h, 24h, 72h). Havanat: no email system. **MISSING: abandoned cart UI + email mock**.
- Discount codes (% off, fixed amount, BOGO, free shipping, by-tier). Havanat has a coupon UI but no engine. **MISSING: discount engine + admin CRUD**.
- Inventory tracking with low-stock alerts. **MISSING: low-stock threshold per SKU + auto-hide from shop**.
- Gift cards (digital + physical). Havanat has none. **MISSING: gift card flow** (huge revenue in fashion).
- "Shop Pay" (1-tap re-buy). Not relevant until you have a real Shop Pay / Flutterwave partner.

---

## 7. NDPR + NDP Act 2023 (Nigeria Data Protection)

- 72-hour breach notification to the Nigeria Data Protection Commission (NDPC). Havanat Privacy Page mentions this; **MISSING: automated breach-detection hooks in backend (defer until live)**.
- Data subject rights: access, rectify, erase, restrict, portability, object, withdraw consent, complain. All 8 must be in Privacy Policy. Havanat's placeholder policy mentions 4 of these.
- Retention periods: account data 5 years post-closure, order data 7 years (FIRS tax law), marketing until consent withdrawn, analytics 14 months. Havanat: not documented. **MISSING: retention policy table**.
- DPO contact required on Privacy Page. Havanat: has email but not labelled DPO. **MISSING: DPO label + alternate contact**.
- Cookie consent: opt-in (NOT opt-out), granular per category. **MISSING: banner component** (currently in-flight in `src/components/shared/CookieConsent.tsx`).
- Source: https://ndpc.gov.ng/ (2023), https://nitda.gov.ng/ (2023).

## 8. WCAG 2.2 AA (accessibility)

- New in 2.2: minimum target size 24×24 CSS pixels for clickable elements. **MISSING: audit all buttons/links for this**. Source: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ (2023).
- Focus indicators must be ≥ 2px thick + ≥ 3:1 contrast. Havanat uses browser default. **MISSING: custom focus ring**.
- autocomplete="email", autocomplete="current-password", autocomplete="cc-number" tokens required. Havanat: ad-hoc. **MISSING: add to all form inputs**.
- Form errors: identify the field in text + suggest a fix. Havanat: shows "required" but no suggestion. **MISSING: error suggestion copy**.

## 9. Cookie consent best practice (2025)

- 3 categories minimum: Essential, Analytics, Marketing. Each toggleable.
- "Reject all" must be as easy as "Accept all" (UK ICO guidance). Same-height buttons. Source: https://ico.org.uk/your-data-matters/cookies/ (2024).
- Preference center must be re-openable from footer (link: "Cookie preferences").
- Store consent receipt in localStorage with timestamp + version.

## 10. Password best practice (2025)

- 12+ chars minimum OR strong passphrase (8+ chars with entropy ≥ 60 bits).
- HaveIBeenPwned k-anonymity API for breach check: send first 5 chars of SHA-1, receive list of hash suffixes, check if any matches. Source: https://haveibeenpwned.com/API/v3 (2024).
- Force logout of all sessions on password change.
- Rate-limit: 5 attempts per 15 min per account + 10 attempts per 15 min per IP (defense-in-depth).
- 2FA should be TOTP (RFC 6238), NOT SMS. Use `otplib` or `speakeasy` for the server side. Source: https://datatracker.ietf.org/doc/html/rfc6238 (2011, still current).

## 11. OTP best practice

- 6-digit, 10-min expiry, max 5 attempts, 30-sec resend cooldown.
- Always one-time-use. Invalidate prior codes on resend.
- For SMS delivery in Nigeria: Termii (https://termii.com) or Africa's Talking (https://africastalking.com). Pricing ~₦2-4 per SMS in 2024.
- SIM/NIN verification per NCC 2023 directive: must verify phone number belongs to real person before sending OTP. Backend task, defer.

## 12. Nigerian fashion 2025 trends (corporate / formal sector)

- **#1 complaint: sizing.** "Order a 42R jacket, get something that fits a 40R." Mitigations: detailed size guide + measurement tutorials + free in-person fitting in PH + "fit guarantee" (free exchange if first fit is wrong).
- **#2 complaint: delivery time.** "8 days promised, 14 days delivered." Mitigations: real-time tracking + ETA based on city tier + proactive SMS.
- **#3 complaint: fabric feel.** Customers want touch/feel. Mitigations: fabric swatches (free ₦500 deposit, credited to order) + 360° product video.
- B2B growing: corporate gifting for end-of-year, weddings, anniversaries. **MISSING: corporate gifting / bulk order form**.

---

## Top 5 gaps Havanat has vs the reference sites

In priority order, ranked by impact-per-engineering-hour:

1. **Try-at-home booking flow** (Rive-style). Rides directly on Havanat's existing rider network — assign rider for fitting, not just delivery. Massive trust-builder for first-time buyers in PH. Estimated 2-3 days work.

2. **Size-recommendation quiz / fit guide wizard.** Number 1 reason for returns in Nigerian fashion is sizing. Quiz → suggested size → link to product. Estimated 1-2 days work.

3. **WhatsApp-order fallback on cart page.** Single "Order via WhatsApp" button that opens wa.me with pre-filled cart details. Captures skeptical / first-time customers who don't trust card checkout. Estimated 0.5 day work.

4. **Sticky mobile PDP bar + bottom-tabbed PDP sections.** Aritzia pattern — sticky Add-to-Cart + Details / Reviews / Fit tabs that anchor to sections. Massive mobile UX win. Estimated 1 day work.

5. **Abandoned cart + Gift card + Waitlist.** Three small features sharing infrastructure (notification queue, discount engine, stock alerts). Each ~1 day; build together. Estimated 2-3 days.

---

## What I CAN'T research from a subagent right now (would re-run)

If you want fresh 2025 data on any of these, I'd re-dispatch a research subagent later:

- Latest Flutterwave vs Paystack pricing comparison
- Current Carbon / FairMoney / Renmoney BNPL integration APIs
- Termii pricing changes 2025
- Specific NDPC registration process changes

For now, the above is good enough to inform a frontend feature roadmap.