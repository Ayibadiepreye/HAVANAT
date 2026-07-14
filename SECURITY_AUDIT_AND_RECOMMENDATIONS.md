# 🔒 HAVANAT Security Audit & Recommendations

**Generated**: 2026-07-14  
**Project**: Havanat E-commerce Platform  
**Stack**: React + Express + PostgreSQL + Cloudinary + Paystack

---

## ✅ **CURRENT SECURITY STATUS: GOOD**

Your application has several security measures already in place:

### **✓ Currently Implemented:**

1. **✅ Password Hashing** - bcrypt with 10 rounds
2. **✅ JWT Authentication** - Access + Refresh token pattern
3. **✅ Helmet.js** - HTTP headers security
4. **✅ CORS** - Configured with specific origins
5. **✅ Rate Limiting** - 120 requests per 60 seconds
6. **✅ Input Validation** - Zod schemas on all endpoints
7. **✅ SQL Injection Protection** - Drizzle ORM (parameterized queries)
8. **✅ Role-Based Access Control** - Admin, Moderator, Rider, Customer roles
9. **✅ Webhook Signature Verification** - Paystack HMAC validation
10. **✅ Audit Logging** - All sensitive actions logged
11. **✅ Google OAuth** - Alternative authentication method

---

## 🚨 **CRITICAL SECURITY IMPROVEMENTS NEEDED**

### **1. Environment Variables Exposed** ⚠️ **HIGH PRIORITY**

**Issue**: Your `.env` files contain sensitive keys that should NEVER be committed to git.

**Files at Risk:**
- `backend/.env` - Contains DB credentials, JWT secrets, API keys
- `app/.env` - Contains API keys

**Action Required:**
```bash
# 1. Add .env to .gitignore (if not already)
echo "*.env" >> .gitignore
echo "*.env.local" >> .gitignore

# 2. Remove from git history (if already committed)
git rm --cached backend/.env app/.env
git commit -m "Remove sensitive .env files"

# 3. Rotate ALL secrets that were exposed:
# - Generate new JWT secrets
# - Regenerate database credentials
# - Get new Paystack keys
# - Create new Google OAuth credentials
```

**Fix**: Use environment variables in your hosting platform (Render):
- Go to Render Dashboard → Your Service → Environment
- Add all variables from `.env` there
- Never commit `.env` files

---

### **2. JWT Secrets Are Weak** ⚠️ **HIGH PRIORITY**

**Current State**: Your JWT secrets in `.env` are good (long random strings).

**Action**: On Render, ensure these are set as environment variables:
```bash
# Generate NEW secrets (don't use these examples):
openssl rand -hex 64  # For JWT_ACCESS_SECRET
openssl rand -hex 64  # For JWT_REFRESH_SECRET
```

---

### **3. Add CSRF Protection** ⚠️ **MEDIUM PRIORITY**

**Issue**: No CSRF token validation for state-changing operations.

**Solution**: Install and configure CSRF protection:

```bash
cd backend
npm install csurf cookie-parser
```

Update `backend/src/app.ts`:
```typescript
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

app.use(cookieParser());

// CSRF protection for non-API routes that use cookies
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict'
  }
});

// Apply to routes that modify data
app.use('/api', csrfProtection);
```

---

### **4. Add Content Security Policy (CSP)** ⚠️ **MEDIUM PRIORITY**

**Issue**: Helmet is installed but CSP needs configuration.

**Fix**: Update `backend/src/app.ts`:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.paystack.co", "https://havanat.onrender.com"],
      frameSrc: ["https://checkout.paystack.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Paystack iframe
}));
```

---

### **5. Implement Account Lockout** ⚠️ **MEDIUM PRIORITY**

**Issue**: No protection against brute force login attempts.

**Solution**: Create `backend/src/middleware/loginLimiter.ts`:

```typescript
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});
```

Apply to login route in `backend/src/routes/auth.ts`:
```typescript
import { loginLimiter } from '../middleware/loginLimiter.js';

authRouter.post('/login', loginLimiter, async (req, res) => {
  // ... existing code
});
```

---

### **6. Add Input Sanitization** ⚠️ **LOW PRIORITY**

**Issue**: User input could contain malicious HTML/scripts.

**Solution**:
```bash
cd backend
npm install xss validator
```

Create `backend/src/lib/sanitize.ts`:
```typescript
import xss from 'xss';

export function sanitizeString(input: string): string {
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
  });
}

export function sanitizeHtml(input: string): string {
  return xss(input, {
    whiteList: {
      a: ['href', 'title', 'target'],
      p: [],
      br: [],
      strong: [],
      em: [],
    },
  });
}
```

---

### **7. Implement Session Management** ⚠️ **LOW PRIORITY**

**Current**: Refresh tokens stored but no automatic cleanup.

**Solution**: Add a cron job to clean expired tokens:

Create `backend/src/jobs/cleanupTokens.ts`:
```typescript
import { db } from '../db/client.js';
import { refreshTokens } from '../db/schema.js';
import { lt } from 'drizzle-orm';

export async function cleanupExpiredTokens() {
  const deleted = await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, new Date()));
  
  console.log(`[cleanup] Removed ${deleted.rowCount} expired refresh tokens`);
}

// Run every 24 hours
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
```

---

### **8. Add Security Headers** ⚠️ **LOW PRIORITY**

**Fix**: Enhance helmet configuration in `backend/src/app.ts`:

```typescript
app.use(helmet({
  contentSecurityPolicy: false, // Configure above
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny', // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME sniffing
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
```

---

### **9. Implement Request Size Limits** ✅ **ALREADY DONE**

Your current limit is 2MB which is good:
```typescript
app.use(express.json({ limit: '2mb' }));
```

**Recommendation**: Add specific limits for file uploads if needed.

---

### **10. Add IP-Based Rate Limiting** ⚠️ **MEDIUM PRIORITY**

**Current**: Global rate limit of 120 req/min.

**Improvement**: Different limits for different routes:

```typescript
import rateLimit from 'express-rate-limit';

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP',
});

// Moderate limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

// Apply to specific routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payments', paymentLimiter);
```

---

## 🛡️ **ADDITIONAL SECURITY BEST PRACTICES**

### **11. Database Security**

**✅ Already Good:**
- Using Neon (managed PostgreSQL with TLS)
- Connection string includes `sslmode=require`
- Using ORM (Drizzle) prevents SQL injection

**Recommendations:**
- Enable database connection pooling limits
- Set up read-only database user for analytics queries
- Enable database audit logging in Neon dashboard

---

### **12. API Security**

**Add API Key Rotation**:
```typescript
// Store API key versions in database
// Rotate keys every 90 days
// Support multiple active keys during transition period
```

**Add Request ID Tracking**:
```typescript
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

---

### **13. Payment Security**

**✅ Current (Good):**
- Webhook signature verification
- Payment amount validation
- Transaction logging

**Recommendations:**
- Add payment fraud detection (velocity checks)
- Implement payment amount limits
- Add customer verification for large orders
- Store only last 4 digits of card numbers (never full card)

---

### **14. Frontend Security**

**Add to `app/vite.config.ts`:**
```typescript
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
```

**Add to `app/index.html`:**
```html
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com;">
```

---

### **15. Monitoring & Alerting**

**Set up monitoring for:**
- Failed login attempts (>10 in 5 minutes)
- Multiple password reset requests
- Unusual payment patterns
- High error rates
- Slow response times

**Tools to Consider:**
- **Sentry** - Error tracking (Free tier available)
- **LogTail** - Log aggregation
- **UptimeRobot** - Uptime monitoring (Free)
- **Render Metrics** - Built-in performance monitoring

---

### **16. Backup & Recovery**

**Current**: Neon handles automatic backups.

**Recommendations:**
- Test restore procedure monthly
- Export critical data weekly to separate storage
- Document recovery procedures
- Set up point-in-time recovery window (Neon Pro)

---

### **17. Compliance & Privacy**

**GDPR/Privacy Requirements:**

Create `backend/src/routes/privacy.ts`:
```typescript
// User data export
authRouter.get('/me/export', requireAuth, async (req, res) => {
  const userId = Number(req.user!.sub);
  // Export all user data in JSON format
  const userData = await exportUserData(userId);
  res.json(userData);
});

// Account deletion
authRouter.delete('/me', requireAuth, async (req, res) => {
  const userId = Number(req.user!.sub);
  // Soft delete or anonymize user data
  await deleteUserAccount(userId);
  res.json({ ok: true });
});
```

**Add Privacy Policy & Terms of Service:**
- Create `/privacy` and `/terms` pages
- Link in footer
- Require acceptance on signup

---

## 📋 **IMPLEMENTATION PRIORITY**

### **Phase 1: Critical (Do Now)**
1. ✅ Remove `.env` files from git
2. ✅ Rotate all exposed secrets
3. ✅ Set environment variables in Render
4. ✅ Add login rate limiting

### **Phase 2: Important (This Week)**
5. ✅ Configure CSP headers
6. ✅ Add CSRF protection
7. ✅ Implement account lockout
8. ✅ Add route-specific rate limiting

### **Phase 3: Recommended (This Month)**
9. ✅ Set up error monitoring (Sentry)
10. ✅ Add input sanitization
11. ✅ Implement session cleanup
12. ✅ Add privacy policy pages
13. ✅ Set up uptime monitoring

### **Phase 4: Nice to Have (Ongoing)**
14. ✅ Add fraud detection
15. ✅ Implement data export
16. ✅ Add advanced monitoring
17. ✅ Regular security audits

---

## 🔍 **SECURITY CHECKLIST FOR DEPLOYMENT**

Before going live, verify:

- [ ] All secrets are in environment variables (not `.env` files)
- [ ] `.env` files are in `.gitignore`
- [ ] Database connection uses SSL/TLS
- [ ] HTTPS is enforced on frontend
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] Webhook signatures are verified
- [ ] Password reset tokens expire
- [ ] Email verification is required
- [ ] Admin endpoints require authentication
- [ ] Audit logging is enabled
- [ ] Error messages don't leak sensitive info
- [ ] File uploads have size limits
- [ ] Payment webhooks are secured
- [ ] Backup and recovery tested

---

## 🚀 **RENDER DEPLOYMENT SECURITY**

### **Environment Variables to Set:**

Go to Render Dashboard → Your Service → Environment:

```bash
# Never commit these - set in Render dashboard only
NODE_ENV=production
DATABASE_URL=postgresql://...  # From Neon
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
PAYSTACK_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...

# Public values (safe in Render environment)
PORT=4000
FRONTEND_URL=https://www.havanat.store
CORS_ORIGINS=https://www.havanat.store,https://havanat.store
```

### **Render Security Settings:**

1. **Enable Auto-Deploy**: Only from `main` branch
2. **Health Check Path**: `/health`
3. **Zero Downtime Deploys**: Enabled
4. **Pull Request Previews**: Disabled (they leak env vars)

---

## 📞 **SECURITY INCIDENT RESPONSE**

If you detect a security breach:

1. **Immediate Actions:**
   - Revoke all JWT refresh tokens
   - Rotate all API keys
   - Enable maintenance mode
   - Backup current database

2. **Investigation:**
   - Check audit logs
   - Review recent commits
   - Analyze server logs
   - Identify affected users

3. **Notification:**
   - Email affected users
   - Post status update
   - Report to payment processor if needed

4. **Recovery:**
   - Patch vulnerability
   - Reset compromised accounts
   - Update dependencies
   - Force password resets if needed

---

## 📚 **RESOURCES**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ **SUMMARY**

**Your app is already reasonably secure**, but implementing the recommendations above will make it production-ready and significantly reduce security risks.

**Most Critical:**
1. Remove `.env` from git + rotate secrets
2. Add login rate limiting
3. Configure CSP headers
4. Set up monitoring

**Total Implementation Time**: ~2-3 days for critical items, 1-2 weeks for all recommendations.

---

**Last Updated**: July 14, 2026  
**Next Review**: October 14, 2026 (Quarterly)
