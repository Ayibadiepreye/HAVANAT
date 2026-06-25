# Google OAuth Setup — Havanat

Use these exact values when configuring your Google Cloud Console project.

## 1. Go to https://console.cloud.google.com/apis/credentials

## 2. Create a project (or pick an existing one)

## 3. Configure the OAuth consent screen

- **User type:** External
- **App name:** Havanat
- **User support email:** concierge@havanat.store
- **App logo:** use `app/public/brand/logo-light.png` (the silver-orb one) — upload to the console
- **App domain:**
  - Homepage: `https://www.havanat.store`
  - Privacy policy: `https://www.havanat.store/privacy`
  - Terms of service: `https://www.havanat.store/terms`
- **Developer contact:** concierge@havanat.store
- **Scopes:** `email`, `profile`, `openid`

## 4. Create OAuth client ID

- **Application type:** Web application
- **Name:** Havanat Web

## 5. Authorized JavaScript origins (add all 5)

```
http://localhost:3000
http://localhost:3002
https://www.havanat.store
https://havanat.store
```

## 6. Authorized redirect URIs (add all 3)

```
http://localhost:4000/api/auth/google/callback
https://api.havanat.store/api/auth/google/callback
http://127.0.0.1:4000/api/auth/google/callback
```

## 7. Copy the credentials

After creating, copy:
- **Client ID** (looks like `123456789-abc...xyz.apps.googleusercontent.com`)
- **Client Secret** (looks like `GOCSPX-abc...xyz`)

Paste them into Render's environment variables for the backend:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI=https://api.havanat.store/api/auth/google/callback`

## 8. Publish the app

The OAuth consent screen starts in "Testing" mode. For production, click
**Publish App** in the OAuth consent screen. Google will ask for verification
(if you use sensitive scopes — `email` and `profile` are NOT sensitive so
this usually auto-approves within 24-48h).

## 9. Done

The "Continue with Google" button on `/login` and `/signup` will now work
end-to-end. New Google signups auto-create a customer account with a
random strong password (so they can also sign in with email later — they
can set their own password in `/profile` Security tab).

## Verification URIs to whitelist in Google Console

| URI | Purpose |
|-----|---------|
| `http://localhost:3000` | Local dev frontend |
| `http://localhost:3002` | Local preview server |
| `http://localhost:4000/api/auth/google/callback` | Local backend OAuth callback |
| `https://www.havanat.store` | Production frontend |
| `https://havanat.store` | Production frontend (apex) |
| `https://api.havanat.store/api/auth/google/callback` | Production backend OAuth callback |
| `http://127.0.0.1:4000/api/auth/google/callback` | Localhost IP variant |

---

**Last updated:** June 2026