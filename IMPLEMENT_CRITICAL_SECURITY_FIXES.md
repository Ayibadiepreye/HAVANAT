# 🚨 Critical Security Fixes - Implementation Guide

**Priority: IMMEDIATE**  
**Time Required: 30-60 minutes**

---

## Step 1: Protect Your Secrets (DO THIS FIRST!)

### A. Check if .env is in git history

```bash
cd c:\Users\bonni\Downloads\HAVANAT

# Check if .env files are tracked
git ls-files | findstr ".env"

# If they show up, you need to remove them!
```

### B. Remove .env from git (if found)

```bash
# Stop tracking the files
git rm --cached backend/.env
git rm --cached app/.env

# Commit the removal
git commit -m "Remove sensitive .env files from git"

# Push immediately
git push origin main
```

### C. Ensure .gitignore is correct

Check that `.gitignore` contains:
```
# Environment variables
.env
.env.local
.env.production
.env.development
*.env
```

---

## Step 2: Set Environment Variables in Render

### Go to Render Dashboard:

**URL**: https://dashboard.render.com/

### For Backend Service:

1. Click on your backend service
2. Go to **Environment** tab
3. Add these variables (copy from your local `backend/.env`):

```bash
# Copy these from your local backend/.env file:
NODE_ENV=production
PORT=4000
DATABASE_URL=your_neon_database_url
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_TTL=4h
JWT_REFRESH_TTL=30d
CORS_ORIGINS=https://www.havanat.store,https://havanat.store
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Havanat <concierge@havanat.store>
EMAIL_REPLY_TO=concierge@havanat.store
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://havanat.onrender.com/api/auth/google/callback
FRONTEND_URL=https://www.havanat.store
API_URL=https://havanat.onrender.com
```

4. Click **Save Changes**
5. Service will auto-redeploy

⚠️ **IMPORTANT**: After this is done, you can DELETE the `backend/.env` file locally (keep `.env.example` for reference).

---

## Step 3: Add Login Rate Limiting (Prevent Brute Force)

### Create the rate limiter middleware:

**File**: `backend/src/middleware/loginLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created from this IP. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Update auth routes:

**File**: `backend/src/routes/auth.ts`

Add at the top:
```typescript
import { loginLimiter, registerLimiter } from '../middleware/loginLimiter.js';
```

Update the routes:
```typescript
// Change this line:
authRouter.post('/login', async (req, res) => {
// To this:
authRouter.post('/login', loginLimiter, async (req, res) => {

// Change this line:
authRouter.post('/register', async (req, res) => {
// To this:
authRouter.post('/register', registerLimiter, async (req, res) => {
```

### Test and deploy:

```bash
cd backend
npm run build
git add .
git commit -m "Add login rate limiting for security"
git push origin main
```

---

## Step 4: Enhanced Security Headers

### Update helmet configuration:

**File**: `backend/src/app.ts`

Replace:
```typescript
app.use(helmet());
```

With:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "https://api.paystack.co", 
        "https://havanat.onrender.com",
        "https://www.havanat.store"
      ],
      frameSrc: ["https://checkout.paystack.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Paystack
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Deploy:

```bash
npm run build
git add .
git commit -m "Enhance security headers with CSP"
git push origin main
```

---

## Step 5: Add Token Cleanup Job

### Create cleanup job:

**File**: `backend/src/jobs/cleanupTokens.ts`

```typescript
import { db } from '../db/client.js';
import { refreshTokens } from '../db/schema.js';
import { lt, or, isNotNull } from 'drizzle-orm';

export async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    const result = await db
      .delete(refreshTokens)
      .where(
        or(
          lt(refreshTokens.expiresAt, now),
          isNotNull(refreshTokens.revokedAt)
        )
      );
    
    console.log(`[cleanup] Removed ${result.rowCount || 0} expired/revoked refresh tokens`);
  } catch (err) {
    console.error('[cleanup] Failed to clean tokens:', err);
  }
}

// Run immediately on startup
cleanupExpiredTokens();

// Then run every 6 hours
setInterval(cleanupExpiredTokens, 6 * 60 * 60 * 1000);
```

### Import in server.ts:

**File**: `backend/src/server.ts`

Add at the top:
```typescript
import './jobs/cleanupTokens.js';
```

### Deploy:

```bash
npm run build
git add .
git commit -m "Add automatic token cleanup job"
git push origin main
```

---

## Step 6: Verify Security Settings

### Test your security setup:

1. **Test Rate Limiting:**
   ```bash
   # Try logging in 6 times with wrong password
   # 6th attempt should be blocked
   ```

2. **Test Headers:**
   ```bash
   curl -I https://havanat.onrender.com/health
   # Should see X-Frame-Options, X-Content-Type-Options, etc.
   ```

3. **Test CORS:**
   ```bash
   # Only your domains should be allowed
   curl -H "Origin: https://evil.com" https://havanat.onrender.com/api/products
   # Should be blocked
   ```

---

## Step 7: Set Up Security Monitoring (Optional but Recommended)

### Sign up for Sentry (Free):

1. Go to: https://sentry.io/signup/
2. Create a project for "Express"
3. Get your DSN

### Install Sentry:

```bash
cd backend
npm install @sentry/node
```

### Add to server.ts:

```typescript
import * as Sentry from '@sentry/node';

// Add after imports
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: config.nodeEnv,
  tracesSampleRate: 0.1, // 10% of requests
});

// Add before routes
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Add after routes (before error handler)
app.use(Sentry.Handlers.errorHandler());
```

### Add to Render environment:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## ✅ Security Implementation Complete!

### What You've Accomplished:

✅ **Secrets protected** - No longer in git  
✅ **Brute force protection** - Login rate limiting  
✅ **Enhanced headers** - CSP, HSTS, etc.  
✅ **Token cleanup** - Automatic cleanup of expired tokens  
✅ **Monitoring** - Error tracking with Sentry (optional)

### Next Steps:

1. Monitor your logs for suspicious activity
2. Test all features to ensure nothing broke
3. Review the full security audit document
4. Schedule monthly security reviews

---

## 🆘 Troubleshooting

### If site breaks after deployment:

1. Check Render logs for errors
2. Verify all environment variables are set
3. Check CORS origins match your domains
4. Test API endpoints directly

### If rate limiting is too strict:

Adjust limits in `loginLimiter.ts`:
```typescript
max: 10, // Increase from 5 to 10
windowMs: 10 * 60 * 1000, // Reduce from 15 to 10 minutes
```

### Need help?

- Check Render logs: Dashboard → Your Service → Logs
- Test endpoints: Use Postman or curl
- Review audit logs in your database

---

**🎉 Your site is now significantly more secure!**
