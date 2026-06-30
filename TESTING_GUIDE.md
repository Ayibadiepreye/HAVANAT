# HAVANAT Platform - Final Testing Guide

## Overview
This guide will help you test all implemented features before production deployment.

---

## Database Management Commands

### 1. Seed Full Test Data
```bash
cd backend
npm run db:seed:test
```

**What this does:**
- Creates 12 products (including 1 sneak peek)
- Creates 8 delivery zones
- Creates 3 orders (delivered, shipped, processing)
- Creates 4 product reviews
- Creates 1 return request (approved status)
- Creates 2 bespoke requests (1 in review, 1 new)
- Creates 3 notifications for users
- Creates 6 email templates
- Creates 2 active memberships (Deluxe, Elite)
- Creates 2 audit log entries
- Creates 2 newsletter subscribers
- Creates rider profile
- Creates 3 user addresses

**Preserves:**
- All 6 user accounts (admin, moderator, rider, 3 customers)
- Membership tiers (Standard, Deluxe, Elite)

### 2. Clear All Test Data
```bash
cd backend
npm run db:clear:test
```

**What this does:**
- Removes ALL test data
- Keeps only: users, membership_tiers, user tier assignments
- Ready for fresh re-seeding

---

## Test User Accounts

All accounts use password: `password`

| Email | Role | Tier | Purpose |
|-------|------|------|---------|
| admin@havanat.store | Admin | Standard | Full admin access, can manage team |
| moderator@havanat.store | Moderator | Standard | Product/order management, no team access |
| rider@havanat.store | Rider | Standard | Delivery management |
| standard@havanat.store | Customer | Standard | Basic customer features |
| deluxe@havanat.store | Customer | Deluxe | 15% discount, sneak peeks |
| elite@havanat.store | Customer | Elite | 20% discount, sneak peeks, priority |

---

## Testing Checklist

### 🛒 Stock Management System
- [ ] Add products to cart
- [ ] Try checking out with out-of-stock items (should be removed)
- [ ] Complete an order (stock should decrease)
- [ ] Admin: Bulk update stock via Admin → Products
- [ ] Admin: Check low stock alerts (red "OUT", orange "LOW")
- [ ] Cancel an order (stock should restore)
- [ ] Approve a return (stock should restore)

### 🚚 Delivery Zones Management
- [ ] Admin: Go to Admin → Settings → Delivery Zones
- [ ] Add a new delivery zone (state, fee, ETA)
- [ ] Edit an existing zone (click pencil icon)
- [ ] Delete a zone (click trash icon)
- [ ] Moderator: Verify moderators can also manage zones
- [ ] Customer: Checkout and verify delivery fee matches zone
- [ ] Customer: Cart page shows correct delivery fee

### ✂️ Bespoke Requests System
- [ ] Customer: Go to Custom Suit page → Request consultation
- [ ] Fill out bespoke request form with images
- [ ] Check admin email for notification
- [ ] Admin/Mod: Go to Admin → Bespoke Requests
- [ ] View request details in modal
- [ ] Reply to request (should send email + in-app notification)
- [ ] Check customer notifications for reply
- [ ] Update status (new → in_review → quoted, etc.)

### 👥 Team Management
- [ ] Admin: Go to Admin → Settings → Team tab
- [ ] Click "Add Team Member"
- [ ] Add new staff: name, email, phone, role (admin/moderator/rider)
- [ ] Verify default password shown: "password"
- [ ] Check that user appears in team table
- [ ] Verify moderators CANNOT see Team tab

### 📦 Order Flow
- [ ] Customer: Add products to cart
- [ ] Proceed to checkout
- [ ] Select delivery address (or add new)
- [ ] Verify delivery fee based on zone
- [ ] Complete payment
- [ ] Check order confirmation
- [ ] Admin/Mod: View order in Admin → Orders
- [ ] Admin/Mod: Update order status
- [ ] Rider: View assigned deliveries

### 🔄 Returns System
- [ ] Customer: Go to Account → Orders
- [ ] Find delivered order → Request Return
- [ ] Fill out return reason
- [ ] Admin/Mod: Go to Admin → Returns
- [ ] Approve return request
- [ ] Verify stock restored
- [ ] Verify customer notified

### ⭐ Reviews System
- [ ] Customer: Go to product detail page
- [ ] Scroll to reviews section
- [ ] Write a review (rating + comment)
- [ ] Submit review
- [ ] Verify review appears on product page
- [ ] Check "Verified Purchase" badge if ordered

### 🎫 Membership System
- [ ] Customer: Go to Membership page
- [ ] View tier comparison
- [ ] Upgrade to Deluxe or Elite
- [ ] Check discounts applied in cart
- [ ] Verify sneak peek products visible
- [ ] Admin: View memberships in Admin → Memberships

### 🔔 Notifications
- [ ] Complete various actions (order, return, etc.)
- [ ] Check notification bell icon
- [ ] Click notification to view details
- [ ] Mark as read
- [ ] Admin: Send broadcast notification

### 📊 Admin Dashboard
- [ ] Admin: View overview stats
- [ ] Check sales chart (14-day default)
- [ ] View recent orders
- [ ] Check low stock alerts
- [ ] View audit log

### 🔐 Permissions Testing
- [ ] Verify admin can access all pages
- [ ] Verify moderator can access: Products, Orders, Returns, Bespoke, Settings (except Team)
- [ ] Verify moderator CANNOT access: Team, Memberships, Audit Log
- [ ] Verify rider can only access: Pickups, Profile
- [ ] Verify customers cannot access admin routes

### 🌐 Frontend Features
- [ ] Homepage loads correctly
- [ ] Shop page filters work (category, occasion, price)
- [ ] Product detail shows correct info
- [ ] Cart persists across sessions
- [ ] Wishlist works
- [ ] Search functionality
- [ ] Mobile responsive design
- [ ] Footer links work
- [ ] About page timeline shows 2026

---

## Known Issues & Limitations

### ✅ Fixed Issues
- 429 rate limit errors (infinite loop in useRiderMe)
- Timeline references (now correctly shows 2026)
- Hardcoded shipping fees (now zone-based)
- Delivery zone edit functionality (added)

### ⚠️ Current Limitations
- Email sending requires valid Resend API key
- Payment integration is mock (no real Paystack)
- Google OAuth requires proper credentials
- SMS OTP is logged to console (no real SMS provider)

---

## Environment Variables Check

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RESEND_API_KEY=... (required for emails)
GOOGLE_CLIENT_ID=... (optional for OAuth)
GOOGLE_CLIENT_SECRET=... (optional for OAuth)
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=... (optional for OAuth)
```

---

## Build Verification

### Backend Build
```bash
cd backend
npm run build
```
**Expected:** TypeScript compilation successful, 0 errors

### Frontend Build
```bash
cd app
npm run build
```
**Expected:** Vite build successful, 2707 modules transformed

---

## Performance Testing

### Load Testing Scenarios
1. **Concurrent Orders**: Multiple users checking out simultaneously
2. **Stock Updates**: Verify atomic operations prevent overselling
3. **Cart Validation**: Out-of-stock items removed correctly
4. **Zone-based Delivery**: Fees calculated correctly for each state

### Expected Behavior
- Stock decrements atomically (no race conditions)
- Delivery fees match selected zone
- Out-of-stock products blocked at checkout
- Returns restore stock correctly

---

## Production Readiness Checklist

### Security
- [ ] All passwords hashed with bcrypt (cost 10+)
- [ ] JWT tokens properly signed
- [ ] Refresh tokens stored in DB
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Helmet security headers enabled
- [ ] SQL injection prevention (parameterized queries)

### Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Transaction support for critical operations
- [ ] Stock operations atomic
- [ ] Audit logging for admin actions

### User Experience
- [ ] No hardcoded shipping fees visible
- [ ] Timeline references accurate (2026)
- [ ] Delivery zones editable
- [ ] Bespoke requests working end-to-end
- [ ] Team management functional
- [ ] Mobile responsive

### Email & Notifications
- [ ] Resend API key configured
- [ ] Order confirmation emails
- [ ] Shipping update emails
- [ ] Bespoke request emails
- [ ] Return approval emails
- [ ] In-app notifications

---

## Testing Workflow

### Step 1: Clean Start
```bash
cd backend
npm run db:clear:test
npm run db:seed:test
```

### Step 2: Test Each Feature
Follow the testing checklist above, marking each item as you verify it works.

### Step 3: Test User Journeys
1. **New Customer Journey**
   - Sign up → Browse → Add to cart → Checkout → Track order
   
2. **Member Upgrade Journey**
   - Login → View membership → Upgrade → See discounts → Access sneak peeks
   
3. **Bespoke Request Journey**
   - Request consultation → Admin reviews → Admin replies → Customer receives notification
   
4. **Return Journey**
   - Request return → Admin approves → Stock restored → Refund processed

### Step 4: Clean Up
```bash
cd backend
npm run db:clear:test
```

### Step 5: Report Issues
Document any bugs, performance issues, or unexpected behavior.

---

## Success Criteria

✅ **All features functional**
✅ **No critical bugs**
✅ **Builds succeed with 0 errors**
✅ **Stock management accurate**
✅ **Delivery zones working**
✅ **Bespoke system end-to-end**
✅ **Team management operational**
✅ **Permissions enforced correctly**
✅ **Mobile responsive**
✅ **Timeline accurate (2026)**

---

## Contact & Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check backend logs for server errors
3. Verify environment variables
4. Check database connection
5. Review audit logs for admin actions

---

**Ready for Production Testing!** 🚀

Run `npm run db:seed:test` when you're ready to begin.
