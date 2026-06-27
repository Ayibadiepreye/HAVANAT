import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import { users, refreshTokens, twoFactorOtps } from '../db/schema.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { sendEmailSafe, welcomeEmail, twoFactorCodeEmail } from '../lib/email.js';

export const googleAuthRouter = Router();

/**
 * Resolve which frontend URL to redirect the user back to.
 * Priority:
 *   1) Origin header (when /url is called by the browser via fetch)
 *   2) Referer header (extract origin)
 *   3) FRONTEND_URL env, unless it's havanat.store (prod) AND the request
 *      looks local (Origin/Referer mention localhost/127.0.0.1) — in which
 *      case fall back to http://localhost:3002
 *   4) http://localhost:3002 (default)
 */
export function resolveFrontendUrl(req: import('express').Request): string {
  const envFrontend = process.env.FRONTEND_URL ?? 'http://localhost:3002';
  let frontendUrl = envFrontend;
  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;
  if (origin && /^https?:\/\//.test(origin)) {
    frontendUrl = origin;
  } else if (referer) {
    try {
      const refUrl = new URL(referer);
      frontendUrl = `${refUrl.protocol}//${refUrl.host}`;
    } catch {}
  }
  // If the resolved URL still points at production (havanat.store) but the
  // user appears to be on localhost, fall back to localhost so local dev
  // doesn't bounce to prod (FRONTEND_URL is often set to prod in .env).
  if (frontendUrl.includes('havanat.store') && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
    const isLocalReq = (referer && /localhost|127\.0\.0\.1/.test(referer))
      || (origin && /localhost|127\.0\.0\.1/.test(origin));
    if (isLocalReq) {
      frontendUrl = 'http://localhost:3002';
    }
  }
  return frontendUrl;
}

/**
 * Build the post-OAuth redirect target URL based on request headers + env.
 * Exported for testing and so the debug path uses the exact same logic.
 */
export function buildFrontendRedirect(req: import('express').Request, redirectTo: string, overrideFrontendUrl?: string): string {
  const frontendUrl = overrideFrontendUrl ?? resolveFrontendUrl(req);
  return `${frontendUrl}/auth/google/callback?redirect=${encodeURIComponent(redirectTo)}`;
}

// Catch-all for the bare path /api/auth/google (no sub-route).
// Returns a 404 with a hint, since we don't want to leak OAuth config here.
googleAuthRouter.get('/', (_req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Use /api/auth/google/url to start Google sign-in, or /api/auth/google/callback for the OAuth redirect.',
    routes: ['/url', '/callback', '/verify', '/status'],
  });
});

// In-memory state store (use Redis in production). Each entry: { state: { redirectTo, createdAt } }
const stateStore = new Map<string, { redirectTo: string; createdAt: number; redirectUri?: string; frontendUrl?: string }>();
// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of stateStore.entries()) {
    if (now - v.createdAt > 10 * 60 * 1000) stateStore.delete(k);
  }
}, 10 * 60 * 1000).unref?.();

/**
 * Resolve the redirect URI for a given request.
 * Priority:
 *   1. `X-Google-Redirect-Uri` request header (manual override — useful for local testing
 *      where you may want to swap http://localhost:4000/... for a tunnel URL or different port
 *      without restarting the server or editing .env)
 *   2. `?redirect_uri=...` query param (same purpose, GET-param form)
 *   3. `GOOGLE_OAUTH_REDIRECT_URI` from .env (default)
 */
function resolveRedirectUri(req: import('express').Request): string {
  const fromHeader = req.header('x-google-redirect-uri');
  if (fromHeader && /^https?:\/\//.test(fromHeader)) return fromHeader;
  const fromQuery = (req.query.redirect_uri as string | undefined);
  if (fromQuery && /^https?:\/\//.test(fromQuery)) return fromQuery;
  return config.googleRedirectUri;
}

function getClient(redirectUri?: string): OAuth2Client | null {
  if (!config.googleClientId || !config.googleClientSecret) return null;
  return new OAuth2Client({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: redirectUri ?? config.googleRedirectUri,
  });
}

async function issueTokensForUser(user: typeof users.$inferSelect, req?: import('express').Request) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    tier: user.tier ?? undefined,
  };
  const accessToken = signAccessToken(payload as Parameters<typeof signAccessToken>[0]);
  const refreshToken = signRefreshToken(payload as Parameters<typeof signRefreshToken>[0]);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const meta = req ? {
    userAgent: (req.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? null,
    ip: ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? null)?.slice(0, 64) ?? null,
  } : { userAgent: null, ip: null };
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: 60 * 60,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      phone: user.phone,
      avatar: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

function toUserResponse(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    phone: user.phone,
    avatar: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/auth/google/url — returns the Google OAuth consent URL
googleAuthRouter.get('/url', (req, res) => {
  const redirectUri = resolveRedirectUri(req);
  const client = getClient(redirectUri);
  if (!client) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env',
    });
  }
  const state = crypto.randomBytes(24).toString('hex');
  const redirectTo = (req.query.redirect as string) || '/account';
  // Capture the frontend URL AT /url CALL TIME (when we have the Origin/Referer
  // headers from the browser). Store with the state so /callback can use the
  // exact same frontend even though Google's redirect strips those headers.
  const frontendUrl = resolveFrontendUrl(req);
  stateStore.set(state, { redirectTo, createdAt: Date.now(), redirectUri, frontendUrl });

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    state,
    prompt: 'consent',
  });
  res.json({ url, state, redirectUri, frontendUrl });
});

// GET /api/auth/google/callback — Google redirects here with ?code=&state=
googleAuthRouter.get('/callback', async (req, res, next) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    if (!code) return res.status(400).send('Missing authorization code');
    if (!state || !stateStore.has(state)) {
      return res.status(400).send('Invalid or expired state. Please retry from the login page.');
    }
    // Use the redirectUri + frontendUrl that were stored with this state when
    // /url was called, so it matches what was sent to Google (even if env changed
    // mid-flow). Crucially, we capture the frontend URL at /url time when the
    // browser's Origin/Referer headers are present, since Google strips those
    // headers when it does the final callback redirect.
    const stored = stateStore.get(state)!;
    const { redirectTo, redirectUri, frontendUrl: storedFrontendUrl } = stored;
    stateStore.delete(state);

    // DEBUG MODE: ?debug=1 in callback URL skips Google token exchange,
    // uses a fake verified user so we can test the redirect-target logic
    // without going through the real Google OAuth. Set DEBUG_GOOGLE=1 env
    // to enable this — never enable in production.
    const debugMode = process.env.DEBUG_GOOGLE === '1' && req.query.debug === '1';
    if (debugMode) {
      const debugRedirect = buildFrontendRedirect(req, redirectTo, storedFrontendUrl);
      return res.json({
        debug: true,
        wouldRedirectTo: debugRedirect,
        state,
        redirectTo,
        storedFrontendUrl,
        resolvedFrontendUrl: storedFrontendUrl ?? resolveFrontendUrl(req),
      });
    }

    const client = getClient(redirectUri);
    if (!client) {
      return res.status(503).send('Google OAuth not configured');
    }

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.status(400).send('No id_token returned by Google');
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).send('Invalid Google profile');
    }
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name ?? email.split('@')[0]!;
    const avatarUrl = payload.picture ?? null;
    const emailVerified = !!payload.email_verified;

    // Upsert user: by googleId first, then by email
    let [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    if (!user) {
      // Check email match
      [user] = await db.select().from(users).where(eq(users.email, email));
      if (user) {
        // Link google account to existing email-based user
        await db.update(users)
          .set({ googleId, avatarUrl: avatarUrl ?? user.avatarUrl, emailVerified: user.emailVerified || emailVerified })
          .where(eq(users.id, user.id));
        user = { ...user, googleId, avatarUrl: avatarUrl ?? user.avatarUrl };
      } else {
        // Create new customer account
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        [user] = await db.insert(users).values({
          name,
          email,
          passwordHash,
          googleId,
          avatarUrl,
          role: 'customer',
          tier: 'standard',
          // Always require verification for NEW signups, even via Google.
          // Google's `email_verified: true` only means Google itself trusts
          // the email — it doesn't prove the user actually controls this
          // Havanat account. We send our own verification OTP so the user
          // proves they own this email address on OUR platform.
          emailVerified: false,
        }).returning();
        if (!user) return res.status(500).send('Failed to create user');
        // Welcome email (non-blocking)
        sendEmailSafe({
          to: user.email,
          subject: 'Welcome to Havanat',
          html: welcomeEmail(user.name),
        });
      }
    } else if (avatarUrl && user.avatarUrl !== avatarUrl) {
      await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
      user = { ...user, avatarUrl };
    }

    // For OAuth users whose email is not yet verified, automatically send
    // a 6-digit OTP right after Google returns. Frontend prompts for the
    // code on /auth/google/callback when verifyEmail=1 is in the URL.
    // We AWAIT sendEmailSafe (not fire-and-forget) so the redirect only
    // happens after the email is confirmed sent by Resend. The frontend
    // will show the OTP input, and if the user clicks 'Resend code' they
    // will get a NEW code (because we wait for this one to be sent).
    if (!user.emailVerified) {
      try {
        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
        // Invalidate any prior unverified OTPs for this user + purpose
        await db.update(twoFactorOtps)
          .set({ usedAt: new Date() })
          .where(and(
            eq(twoFactorOtps.userId, user.id),
            eq(twoFactorOtps.purpose, 'oauth_email_verify'),
            isNull(twoFactorOtps.usedAt)
          ));
        await db.insert(twoFactorOtps).values({
          userId: user.id,
          codeHash: tokenHash,
          expiresAt,
          purpose: 'oauth_email_verify',
        });
        // AWAIT (not fire-and-forget) so the redirect waits for the email
        // to be accepted by Resend. sendEmailSafe now returns {ok, error}.
        const result = await sendEmailSafe({
          to: user.email,
          subject: 'Verify your Havanat email',
          html: twoFactorCodeEmail(code),
          tags: [{ name: 'type', value: 'email_verify' }],
        });
        if (!result.ok) {
          console.warn('[oauth] verify-email OTP email failed:', result.error);
        } else {
          console.info('[oauth] verify-email OTP sent to', user.email, 'for user', user.id);
        }
      } catch (e) {
        console.warn('[oauth] failed to send verify-email OTP:', e);
      }
    }

    const issued = await issueTokensForUser(user, req);
    const frontendCallback = buildFrontendRedirect(req, redirectTo, storedFrontendUrl);
    const url = new URL(frontendCallback);
    url.searchParams.set('access_token', issued.accessToken);
    url.searchParams.set('refresh_token', issued.refreshToken);
    if (!user.emailVerified) {
      url.searchParams.set('verifyEmail', '1');
    }
    res.redirect(url.toString());
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/google/verify — verify Google id_token from frontend (popup/One Tap)
googleAuthRouter.post('/verify', async (req, res, next) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).json({
        error: 'Google OAuth not configured',
        hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env',
      });
    }
    const { credential, redirectTo } = req.body as { credential?: string; redirectTo?: string };
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: 'Invalid Google profile' });
    }
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name ?? email.split('@')[0]!;
    const avatarUrl = payload.picture ?? null;
    const emailVerified = !!payload.email_verified;

    let [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    if (!user) {
      [user] = await db.select().from(users).where(eq(users.email, email));
      if (user) {
        await db.update(users)
          .set({ googleId, avatarUrl: avatarUrl ?? user.avatarUrl, emailVerified: user.emailVerified || emailVerified })
          .where(eq(users.id, user.id));
        user = { ...user, googleId, avatarUrl: avatarUrl ?? user.avatarUrl };
      } else {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        [user] = await db.insert(users).values({
          name, email, passwordHash, googleId, avatarUrl,
          role: 'customer', tier: 'standard',
          // Same as /callback — never auto-verify new signups.
          emailVerified: false,
        }).returning();
        if (!user) return res.status(500).json({ error: 'Failed to create user' });
        sendEmailSafe({
          to: user.email,
          subject: 'Welcome to Havanat',
          html: welcomeEmail(user.name),
        });
      }
    } else if (avatarUrl && user.avatarUrl !== avatarUrl) {
      await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
      user = { ...user, avatarUrl };
    }

    // Same auto-OTP logic as /callback: send a 6-digit code if email unverified.
    if (!user.emailVerified) {
      try {
        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
        await db.update(twoFactorOtps)
          .set({ usedAt: new Date() })
          .where(and(
            eq(twoFactorOtps.userId, user.id),
            eq(twoFactorOtps.purpose, 'oauth_email_verify'),
            isNull(twoFactorOtps.usedAt)
          ));
        await db.insert(twoFactorOtps).values({
          userId: user.id,
          codeHash: tokenHash,
          expiresAt,
          purpose: 'oauth_email_verify',
        });
        const result = await sendEmailSafe({
          to: user.email,
          subject: 'Verify your Havanat email',
          html: twoFactorCodeEmail(code),
          tags: [{ name: 'type', value: 'email_verify' }],
        });
        if (!result.ok) console.warn('[oauth/verify] OTP email failed:', result.error);
        else console.info('[oauth/verify] OTP sent to', user.email);
      } catch (e) {
        console.warn('[oauth/verify] failed to send verify-email OTP:', e);
      }
    }

    const issued = await issueTokensForUser(user, req);
    res.json({
      ...issued,
      redirect: redirectTo ?? '/account',
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/google/status — check if Google OAuth is configured (for frontend)
googleAuthRouter.get('/status', (req, res) => {
  const enabled = !!(config.googleClientId && config.googleClientSecret);
  res.json({ enabled, configured: enabled });
});