import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import { users, refreshTokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { sendEmailSafe, welcomeEmail } from '../lib/email.js';

export const googleAuthRouter = Router();

// In-memory state store (use Redis in production). Each entry: { state: { redirectTo, createdAt } }
const stateStore = new Map<string, { redirectTo: string; createdAt: number }>();
// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of stateStore.entries()) {
    if (now - v.createdAt > 10 * 60 * 1000) stateStore.delete(k);
  }
}, 10 * 60 * 1000).unref?.();

function getClient(): OAuth2Client | null {
  if (!config.googleClientId || !config.googleClientSecret) return null;
  return new OAuth2Client({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
  });
}

async function issueTokensForUser(user: typeof users.$inferSelect) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    tier: user.tier ?? undefined,
  };
  const accessToken = signAccessToken(payload as Parameters<typeof signAccessToken>[0]);
  const refreshToken = signRefreshToken(payload as Parameters<typeof signRefreshToken>[0]);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
  const client = getClient();
  if (!client) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env',
    });
  }
  const state = crypto.randomBytes(24).toString('hex');
  const redirectTo = (req.query.redirect as string) || '/account';
  stateStore.set(state, { redirectTo, createdAt: Date.now() });

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    state,
    prompt: 'consent',
  });
  res.json({ url, state });
});

// GET /api/auth/google/callback — Google redirects here with ?code=&state=
googleAuthRouter.get('/callback', async (req, res, next) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).send('Google OAuth not configured');
    }
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    if (!code) return res.status(400).send('Missing authorization code');
    if (!state || !stateStore.has(state)) {
      return res.status(400).send('Invalid or expired state. Please retry from the login page.');
    }
    const { redirectTo } = stateStore.get(state)!;
    stateStore.delete(state);

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
          emailVerified: emailVerified,
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

    // NEW: for OAuth users without verified email, automatically send an
    // OTP to their email right after Google returns. Frontend prompts
    // for the code on /auth/google/callback when verifyEmail=1 is set.
    if (!user.emailVerified) {
      try {
        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
        await db.execute(
          (await import('drizzle-orm')).sql`UPDATE two_factor_otps SET used_at = NOW() WHERE user_id = ${user.id} AND purpose = 'oauth_email_verify' AND used_at IS NULL`
        );
        await db.insert(twoFactorOtps).values({
          userId: user.id,
          codeHash: tokenHash,
          expiresAt,
          purpose: 'oauth_email_verify',
        });
        sendEmailSafe({
          to: user.email,
          subject: 'Verify your Havanat email',
          html: twoFactorCodeEmail(code),
          tags: [{ name: 'type', value: 'email_verify' }],
        });
      } catch (e) {
        console.warn('[oauth] failed to send verify-email OTP:', e);
      }
    }

    const issued = await issueTokensForUser(user);
    // Redirect to the frontend the user actually came from.
    // Priority: 1) Origin header, 2) Referer header (extract origin), 3) state redirectTo (if same-origin), 4) FRONTEND_URL env, 5) localhost default.
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
    const params = new URLSearchParams({
      access_token: issued.accessToken,
      refresh_token: issued.refreshToken,
      redirect: redirectTo,
    });
    // If email isn't verified, prompt the frontend to show the OTP input
    if (!user.emailVerified) {
      params.set('verifyEmail', '1');
    }
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
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
          emailVerified,
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

    const issued = await issueTokensForUser(user);
    res.json({ ...issued, redirect: redirectTo ?? '/account' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/google/status — check if Google OAuth is configured (for frontend)
googleAuthRouter.get('/status', (req, res) => {
  const enabled = !!(config.googleClientId && config.googleClientSecret);
  res.json({ enabled, configured: enabled });
});