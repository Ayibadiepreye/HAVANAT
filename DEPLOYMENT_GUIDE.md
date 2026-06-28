# 🚀 HAVANAT Deployment Guide

## Overview
- **Frontend**: Deploy to Vercel (React + Vite)
- **Backend**: Deploy to Render (Node.js + Express + PostgreSQL)
- **Database**: Neon PostgreSQL (Serverless)

---

## 📦 Prerequisites

### 1. Services You Need Accounts For:
- ✅ **Vercel** - https://vercel.com (Frontend hosting)
- ✅ **Render** - https://render.com (Backend hosting)
- ✅ **Neon** - https://neon.tech (PostgreSQL database)
- ✅ **Cloudinary** - https://cloudinary.com (Image hosting)
- ✅ **Paystack** - https://paystack.com (Payment processing)
- ✅ **Resend** - https://resend.com (Transactional emails)

### 2. Domain Setup (Optional):
- Custom domain for frontend: `www.havanat.store`
- Custom domain for backend: `api.havanat.store`

---

## 🗄️ STEP 1: Database Setup (Neon PostgreSQL)

### 1.1 Create Neon Project
1. Go to https://console.neon.tech
2. Click **New Project**
3. Name: `havanat-production`
4. Region: Choose closest to your users (e.g., US East, EU West)
5. Click **Create Project**

### 1.2 Get Database Connection String
1. In Neon dashboard → **Connection Details**
2. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```
3. **Save this** - you'll need it for Render

### 1.3 Initialize Database Schema
You'll run migrations after deploying the backend (see Step 3.6)

---

## 🎨 STEP 2: Frontend Deployment (Vercel)

### 2.1 Push Code to GitHub
```bash
cd c:\Users\bonni\Downloads\HAVANAT
git init
git add .
git commit -m "Initial commit - HAVANAT platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/havanat.git
git push -u origin main
```

### 2.2 Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repo: `YOUR_USERNAME/havanat`
4. **Framework Preset**: Vite
5. **Root Directory**: `app`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Click **Deploy**

#### Option B: Vercel CLI
```bash
cd app
npm install -g vercel
vercel
```

### 2.3 Configure Frontend Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_USE_BACKEND` | `true` | Use real backend (not localStorage) |
| `VITE_API_URL` | `https://api.havanat.store` | Your Render backend URL (see Step 3) |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxx` | From Paystack dashboard |
| `VITE_CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | From Cloudinary dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `havanat-unsigned` | Create in Cloudinary (unsigned) |

**Where to get these values:**

#### Cloudinary Setup:
1. Go to https://cloudinary.com/console
2. **Cloud Name**: Found on dashboard (e.g., `dxxxxx`)
3. **Upload Preset**:
   - Go to **Settings** → **Upload** → **Upload Presets**
   - Click **Add upload preset**
   - Signing Mode: **Unsigned**
   - Preset name: `havanat-unsigned`
   - Folder: `havanat`
   - Click **Save**

#### Paystack Setup:
1. Go to https://dashboard.paystack.com/#/settings/developers
2. Use **Test Keys** for testing, **Live Keys** for production
3. Copy **Public Key** (starts with `pk_test_` or `pk_live_`)

### 2.4 Redeploy
After adding environment variables:
1. Go to **Deployments** tab
2. Click **•••** on latest deployment → **Redeploy**

### 2.5 Custom Domain (Optional)
1. In Vercel → **Settings** → **Domains**
2. Add: `www.havanat.store` and `havanat.store`
3. Follow DNS instructions from your domain registrar

---

## ⚙️ STEP 3: Backend Deployment (Render)

### 3.1 Deploy to Render

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `YOUR_USERNAME/havanat`
4. Configure:
   - **Name**: `havanat-backend`
   - **Region**: Same as your Neon database region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Starter` ($7/month) or `Free` (for testing)

### 3.2 Configure Backend Environment Variables

In Render Dashboard → Your Service → **Environment** → **Environment Variables**, add:

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | `production` | - |
| `PORT` | `4000` | Render will override with $PORT automatically |
| `DATABASE_URL` | `postgresql://...` | From Neon (Step 1.2) |
| `JWT_ACCESS_SECRET` | Generate random | See below for generation |
| `JWT_REFRESH_SECRET` | Generate random | Different from access secret |
| `JWT_ACCESS_TTL` | `1h` | Token expires in 1 hour |
| `JWT_REFRESH_TTL` | `30d` | Refresh token expires in 30 days |
| `CORS_ORIGINS` | `https://www.havanat.store,https://havanat.store` | Your Vercel domain |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 1 minute |
| `RATE_LIMIT_MAX` | `120` | 120 requests per minute |
| `RESEND_API_KEY` | `re_xxxxx` | From Resend dashboard |
| `EMAIL_FROM` | `Havanat <concierge@havanat.store>` | Verified sender |
| `EMAIL_REPLY_TO` | `concierge@havanat.store` | Reply address |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxxx` | From Paystack (keep secret!) |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxx` | From Paystack |
| `FRONTEND_URL` | `https://www.havanat.store` | Your Vercel domain |
| `API_URL` | `https://havanat-backend.onrender.com` | Your Render URL |
| `GOOGLE_CLIENT_ID` | (optional) | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | (optional) | For Google OAuth |
| `GOOGLE_REDIRECT_URI` | `https://api.havanat.store/api/auth/google/callback` | OAuth callback |

**Generate JWT Secrets:**
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run twice to get two different secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**Resend Setup:**
1. Go to https://resend.com/api-keys
2. Create new API key
3. **Domain Verification**:
   - Go to https://resend.com/domains
   - Add your domain: `havanat.store`
   - Add DNS records provided by Resend to your domain registrar
   - Wait for verification (can take up to 48 hours)
4. Use verified domain in `EMAIL_FROM` (e.g., `concierge@havanat.store`)

**Paystack Live Keys:**
1. Go to https://dashboard.paystack.com/#/settings/developers
2. Switch to **Live** mode (requires business verification)
3. Copy **Secret Key** and **Public Key**
4. **⚠️ Never commit secret key to git**

### 3.3 Deploy
Click **Create Web Service** - Render will build and deploy automatically.

### 3.4 Custom Domain for Backend (Optional)
1. In Render → **Settings** → **Custom Domain**
2. Add: `api.havanat.store`
3. Add CNAME record in your DNS:
   ```
   CNAME api.havanat.store → havanat-backend.onrender.com
   ```

### 3.5 Get Backend URL
After deployment completes:
- Your backend URL: `https://havanat-backend.onrender.com`
- Or custom domain: `https://api.havanat.store`

### 3.6 Run Database Migrations

#### Option A: Using Render Shell
1. In Render dashboard → your service → **Shell** tab
2. Run:
   ```bash
   npm run db:migrate
   ```

#### Option B: Locally (requires DATABASE_URL from Neon)
```bash
cd backend
# Create .env with production DATABASE_URL
npm run db:migrate
```

### 3.7 Seed Initial Data (Optional)
If you have seed data:
```bash
npm run db:seed
```

---

## 🔗 STEP 4: Connect Frontend to Backend

### 4.1 Update Frontend Environment Variables
Go back to Vercel → Your Project → **Settings** → **Environment Variables**

Update `VITE_API_URL`:
```
VITE_API_URL=https://havanat-backend.onrender.com
```
Or if using custom domain:
```
VITE_API_URL=https://api.havanat.store
```

### 4.2 Update Backend CORS
In Render → Backend Service → **Environment Variables**

Update `CORS_ORIGINS` to include your Vercel domain:
```
CORS_ORIGINS=https://www.havanat.store,https://havanat.store
```

### 4.3 Redeploy Both Services
- **Vercel**: Go to Deployments → Redeploy
- **Render**: Will auto-deploy on environment variable changes

---

## ✅ STEP 5: Verification & Testing

### 5.1 Health Checks
1. **Backend Health**: Visit `https://api.havanat.store/health`
   - Should return: `{"status":"ok"}`

2. **Frontend**: Visit `https://www.havanat.store`
   - Should load homepage

### 5.2 Test Critical Flows
1. **Registration**: Create new account → verify email
2. **Login**: Login with new account
3. **Product Browse**: View products in shop
4. **Add to Cart**: Add item to cart
5. **Checkout**: Complete test purchase (use Paystack test cards)
6. **Admin Login**: Login with admin account
7. **Order Management**: View/update orders in admin dashboard
8. **Image Upload**: Upload product image (tests Cloudinary)

### 5.3 Monitor Logs
- **Render Logs**: Dashboard → Logs tab
- **Vercel Logs**: Dashboard → Deployments → View Function Logs

---

## 🔒 Security Checklist

- [ ] JWT secrets are randomly generated (48+ bytes)
- [ ] Paystack **Secret Key** is never exposed in frontend
- [ ] Database URL is not committed to git
- [ ] CORS is restricted to your domains only
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced (automatic on Vercel/Render)
- [ ] Email domain is verified in Resend
- [ ] Environment variables are set in platform dashboards (not in code)

---

## 💰 Cost Estimate

| Service | Tier | Cost/Month |
|---------|------|------------|
| Vercel | Hobby | Free (or $20 Pro) |
| Render | Starter | $7 (or Free with limitations) |
| Neon | Free | $0 (up to 10GB, then $19) |
| Cloudinary | Free | $0 (up to 25GB, 25k transformations) |
| Resend | Free | $0 (up to 3k emails/month, then $20) |
| Paystack | Transaction fees | 1.5% + ₦100 per transaction |
| **Total** | | **~$7-27/month** + transaction fees |

---

## 🚨 Troubleshooting

### Frontend shows "Network Error"
- Check `VITE_API_URL` matches your Render URL
- Verify backend is running (visit `/health` endpoint)
- Check CORS settings in backend

### Backend crashes on startup
- Check DATABASE_URL is correct
- Verify all required environment variables are set
- Check Render logs for error messages

### Images not uploading
- Verify Cloudinary credentials
- Check upload preset is **unsigned**
- Ensure CORS is configured in Cloudinary settings

### Emails not sending
- Verify Resend API key is valid
- Check domain is verified in Resend
- Ensure `EMAIL_FROM` uses verified domain

### Paystack payments failing
- Use test keys for testing, live keys for production
- Verify public key matches secret key environment
- Check Paystack dashboard for error messages

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://docs.render.com
- **Neon Docs**: https://neon.tech/docs
- **Paystack Docs**: https://paystack.com/docs
- **Resend Docs**: https://resend.com/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

## 🔄 Future Updates

### To Deploy Updates:
1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
2. Vercel and Render will auto-deploy from `main` branch

### To Rollback:
- **Vercel**: Deployments → Previous deployment → Promote to Production
- **Render**: Manual Deploys → Redeploy previous commit

---

**✨ Your HAVANAT platform is now live and ready for business!**
