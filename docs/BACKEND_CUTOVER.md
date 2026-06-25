# Havanat — Backend Cutover Plan

When you give the green light, this is the order of operations to take the
mock frontend to live production.

## 0. Prerequisites (you provide)

- Postgres URL (Neon recommended — free tier works)
- Domain + DNS for `havanat.store`
- Paystack OR Flutterwave live API keys (test keys OK for staging)
- Resend API key (for transactional email + broadcasts)
- Termii / Africa's Talking API key (Nigeria SMS, currently not used — only if we add SMS OTP later)
- S3 bucket + CloudFront for image hosting (we currently serve from `/public/images`)

## 1. Database (Neon Postgres)

```bash
cd backend
pnpm install
psql $DATABASE_URL -f migrations/0001_init.sql
psql $DATABASE_URL -f migrations/0002_seed_dev.sql    # only for staging
```

See `backend/src/db/schema.ts` for the Drizzle schema.

## 2. Backend deploy

- Repo: `backend/` is a separate Drizzle + Express service (already scaffolded)
- Hosting: Railway / Fly.io / Render (one of these — pick when ready)
- Env vars: see `backend/.env.example`

## 3. Frontend swap

- Replace localStorage-backed Zustand stores with HTTP fetch wrappers
  (see `docs/NOTIFICATIONS.md` for the pattern)
- Set `VITE_API_URL` to the deployed backend
- Strip the dev-only mock data imports

## 4. Email

- Resend: sender `concierge@havanat.store`, reply-to `concierge@havanat.store`
- Templates (in order of priority):
  1. Order placed + payment confirmed
  2. Delivery OTP (when rider picks up)
  3. Order delivered
  4. Newsletter welcome (footer subscribe)
  5. Generic broadcast (admin/moderator)

## 5. Payment

- Use Paystack `POST /transaction/initialize` for orders
- Webhook: `POST /api/webhooks/paystack` (in `backend/`) handles `charge.success` → mark order `received`

## 6. Image hosting

- Move `app/public/images/products/*.jpg` to S3
- Update `BRAND.assets.*` to point at the CDN URLs
- Add CloudFront in front for caching

## 7. Compliance (already in mock)

- NDPR + NDP Act 2023: Privacy + Terms pages, cookie consent banner
- See `docs/RESEARCH.md` + `docs/PLATFORM_RESEARCH.md` for citations
- DPO contact: `dpo@havanat.store`

## 8. Sequence

1. Provision Neon + run migrations (1 hour)
2. Deploy backend, smoke-test `/api/health` (1 hour)
3. Set `VITE_API_URL` in Vercel, redeploy frontend (30 min)
4. Wire Paystack live keys + webhook (2 hours)
5. Resend domain verification + templates (2 hours)
6. S3 migration + CloudFront (3 hours)
7. End-to-end test: place order → rider picks up → customer receives OTP email → delivery confirmed
8. Soft-launch to internal team
9. Public launch