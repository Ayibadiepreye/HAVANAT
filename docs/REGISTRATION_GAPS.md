# Havanat — Registration & Compliance Gaps (Pre-Launch Checklist)

> **Purpose:** list every formal/legal field that the Havanat platform needs populated
> with real, registered business data before public launch. None of these can be
> fabricated or placeholdered without violating Nigerian law or platform policies.

**Status legend:**
- ⛔ **Blocking** — cannot ship without this
- ⚠️ **Strongly recommended** — needed for payment processors / AdSense / bank
- 🟡 **Nice to have** — improves trust / discoverability

---

## 🔴 Tier 1 — Blocking (must have before launch)

### 1. Business registration with CAC
- ⛔ **Legal entity name** (e.g. "Havanat Limited" or "Havanat Nigeria Ltd")
  - Used in: Footer, Privacy Policy, Terms, Returns Policy, every invoice
- ⛔ **CAC Registration Number (RC)**
  - Apply via https://pre.cac.gov.ng/  (same-day for Ltd company with TIN)
  - Used in: Footer ("RC XXXXXX"), every contract, every legal notice
- ⛔ **Registered office address** (street + city + state)
  - Used in: Footer, every contract, every government correspondence
- ⛔ **Date of incorporation**

### 2. Tax registration (FIRS + State)
- ⛔ **Tax Identification Number (TIN)** via FIRS / JointTaxBoard
  - Used in: every invoice, every customs declaration, every bank transfer
- ⛔ **VAT registration** (required if turnover > ₦25m / quarter)
  - Used in: every invoice
- ⚠️ **State tax / levies** for Rivers State (where the company is registered)

### 3. Bank account
- ⛔ **Corporate bank account** (current account in legal entity name)
  - Required for: receiving customer payments, paying suppliers, paying staff
  - Recommended banks: GTBank, Zenith, Access, UBA (all support business APIs)

### 4. NDPR / NDP Act compliance officer
- ⛔ **Data Protection Officer (DPO)** — name + email + phone
  - Used in: Privacy Policy, contact page
  - Can be the founder for small businesses initially
- ⛔ **Registration with Nigeria Data Protection Commission (NDPC)**
  - Apply via https://ndpc.gov.ng/
  - Filing fee applies

### 5. Payment processor accounts
- ⛔ **Paystack business account** (https://paystack.com)
  - Requires: CAC certificate, TIN, bank account, director BVN, director ID
- ⛔ **Flutterwave business account** (https://flutterwave.com)
  - Same docs as Paystack
  - Optional but recommended for redundancy

---

## 🟡 Tier 2 — Strongly recommended (first 30 days post-launch)

### 6. Customer-facing trust signals
- ⚠️ **Refund Policy page content** — confirm the 14-day window, who pays return shipping, exchange rules
- ⚠️ **Customer support email** (separate from generic concierge — e.g. support@havanat.ng)
- ⚠️ **Abuse / DMCA email** (copyright complaints)
- ⚠️ **DPO email** (privacy inquiries — separate from support)

### 7. Domain + email
- ⚠️ **havanat.ng** domain registered via NIRA (https://nira.org.ng)
  - Recommended registrars: WhoGoHost, DomainKing, Smartweb
- ⚠️ **Email on domain** via Zoho Mail (free for ≤5 users) or Google Workspace
  - Required for: invoices, official statements, DMARC compliance

### 8. Insurance
- 🟡 **Public liability insurance**
- 🟡 **Product liability insurance** (covers defective goods)
- 🟡 **Cyber liability insurance** (covers data breach costs — required if handling lots of PII)

### 9. SMS / OTP provider
- ⚠️ **Termii account** (https://termii.com) — for SMS OTP delivery
  - Requires: business name, contact, sample use case
- ⚠️ OR **Africa's Talking account** (https://africastalking.com)
  - Same docs; sometimes cheaper at scale

### 10. Transactional email
- ⚠️ **Resend** (https://resend.com) OR SendGrid OR Mailgun
  - Requires: verified domain, DMARC/SPF/DKIM setup
  - Used for: order confirmations, shipping updates, password resets, invoices

### 11. Image hosting
- ⚠️ **Cloudinary** OR AWS S3 + CloudFront
  - For product photography, lookbook, community images
  - Currently using `/public/` images — fine for dev, not scalable

---

## 🟢 Tier 3 — Nice to have (first 90 days)

### 12. Logistics partners
- 🟡 **GIG Logistics account** for nationwide delivery backup
- 🟡 **Max.ng or Kwik** for PH/Abuja same-day
- 🟡 (Current build uses in-house riders; OK for Port Harcourt only)

### 13. SMS marketing
- 🟡 **Bulk SMS provider** (Termii / Africa's Talking again, different endpoint)
- 🟡 **WhatsApp Business API** (via Twilio or Meta directly)

### 14. Accounting + invoicing
- 🟡 **FIRS-compliant invoicing software** (e.g. Akaunting, Wave, or Sage)
- 🟡 **Payroll** if there are staff on payroll (Pension, PAYE)

### 15. Analytics + marketing
- 🟡 **Google Analytics 4** (gated behind cookie consent)
- 🟡 **Meta Pixel** (gated behind cookie consent)
- 🟡 **Google Search Console + Bing Webmaster**

### 16. Legal review
- 🟡 **Lawyer review** of Privacy Policy + Terms + Returns Policy
- 🟡 **Trademark filing** for the "Havanat" name + crest with the Trademarks Registry
  - Cost: ~₦60,000 (2025)
  - Takes 8-12 months

---

## 📝 What I CAN generate without registration data

These I have already drafted or will draft next:

- [x] Privacy Policy (generic, not company-specific)
- [x] Terms of Service (generic)
- [x] Returns Policy
- [x] Cookie Consent banner (no company details needed)
- [x] Accessibility Statement
- [x] Shipping Policy

These will get a `${BRAND.company.legalName}` placeholder that auto-fills when you give me the legal name.

---

## 📤 What to send me when ready

Send me any of these in any combination and I'll wire them through the platform:

1. **Legal entity name** (e.g. "Havanat Limited")
2. **CAC RC number** (e.g. "RC 1234567")
3. **Registered office address** (street + city + state)
4. **TIN**
5. **DPO name + email + phone**
6. **Bank name + account number (or sort code for display)**
7. **Customer support email + phone**
8. **Insurance policy number(s)** (display on Returns page footer if you want)
9. **Trademark registration number** (once granted)

I'll wire them into Footer, Privacy, Terms, invoices, and contact pages automatically.