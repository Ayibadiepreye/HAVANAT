import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import {
  users,
  emailVerifyTokens,
  twoFactorOtps,
} from '../db/schema.js';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { sendEmail, sendEmailSafe, passwordResetEmail, twoFactorCodeEmail } from '../lib/email.js';
function sendEmailSafe(...args: Parameters<typeof sendEmail>) {
  sendEmail(...args).catch((err: any) => console.warn('[email-failed]', err?.message ?? err));
}

import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';

export const authExtendedRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOtp(): string {
  // Cryptographically strong 6-digit code (000000–999999).
  // crypto.randomInt avoids Math.random predictability.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// ─── Forgot password (step 1): send OTP to user's email ──────────
// OTP replaces the previous long-token-link email. Same table (twoFactorOtps)
// but purpose='forgot_password' so it can't be confused with login OTPs.
authExtendedRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const Schema = z.object({ email: z.string().email().max(200) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email' });

    const email = parsed.data.email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Always respond success (don't leak which emails exist)
    if (!user) return res.json({ ok: true });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    // Invalidate any prior unused forgot_password OTPs for this user
    await db.update(twoFactorOtps)
      .set({ usedAt: new Date() })
      .where(and(
        eq(twoFactorOtps.userId, user.id),
        eq(twoFactorOtps.purpose, 'forgot_password'),
        isNull(twoFactorOtps.usedAt)
      ));
    await db.insert(twoFactorOtps).values({
      userId: user.id,
      codeHash: hashToken(code),
      expiresAt,
      purpose: 'forgot_password',
    });

    sendEmailSafe({
      to: user.email,
      subject: 'Your Havanat password-reset code',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'forgot_password' }],
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Forgot password (step 2): verify OTP, return short-lived reset token
// Frontend keeps this token and uses it on step 3 (set new password).
// The token is a random 32-byte string hashed in DB; lasts 10 min.
const passwordResetSessions = new Map<string, { userId: number; expiresAt: number }>();
authExtendedRouter.post('/forgot-password/verify', async (req, res, next) => {
  try {
    const Schema = z.object({
      email: z.string().email(),
      code: z.string().length(6),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid input' });

    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid code' });

    const [otp] = await db
      .select()
      .from(twoFactorOtps)
      .where(and(
        eq(twoFactorOtps.userId, user.id),
        eq(twoFactorOtps.purpose, 'forgot_password'),
        eq(twoFactorOtps.codeHash, hashToken(parsed.data.code)),
        gt(twoFactorOtps.expiresAt, new Date()),
        isNull(twoFactorOtps.usedAt)
      ))
      .limit(1);
    if (!otp) {
      await db.execute(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (await import('drizzle-orm')).sql`UPDATE two_factor_otps SET attempts = attempts + 1 WHERE user_id = ${user.id} AND purpose = 'forgot_password' AND used_at IS NULL`
      );
      return res.status(401).json({ ok: false, error: 'Invalid or expired code' });
    }
    await db.update(twoFactorOtps).set({ usedAt: new Date() }).where(eq(twoFactorOtps.id, otp.id));

    // Issue a short-lived reset session token (10 min)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    passwordResetSessions.set(sessionToken, { userId: user.id, expiresAt: Date.now() + 10 * 60 * 1000 });
    res.json({ ok: true, resetToken: sessionToken, email: user.email });
  } catch (err) {
    next(err);
  }
});

// ─── Forgot password (step 3): consume reset token, set new password
authExtendedRouter.post('/forgot-password/complete', async (req, res, next) => {
  try {
    const Schema = z.object({
      resetToken: z.string().min(20),
      password: z.string().min(8).max(200),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });

    const session = passwordResetSessions.get(parsed.data.resetToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Reset session expired. Please start over.' });
    if (session.expiresAt < Date.now()) {
      passwordResetSessions.delete(parsed.data.resetToken);
      return res.status(401).json({ ok: false, error: 'Reset session expired. Please start over.' });
    }
    passwordResetSessions.delete(parsed.data.resetToken);

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await db.update(users).set({
      passwordHash,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, session.userId));

    logAction({
      req, user: { id: session.userId, email: '', role: 'customer' },
      action: 'user.password.reset',
      entityType: 'user',
      entityId: String(session.userId),
      entityLabel: `User ${session.userId}`,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});







// ─── Send 2FA OTP to user's email (login flow) ───────────────────
authExtendedRouter.post('/2fa/send', async (req, res, next) => {
  try {
    const Schema = z.object({ email: z.string().email().max(200) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email' });
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'No account with that email' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(twoFactorOtps).values({
      userId: user.id,
      codeHash: hashToken(code),
      expiresAt,
      purpose: 'login',
    });

    sendEmailSafe({
      to: user.email,
      subject: 'Your Havanat verification code',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'two_factor' }],
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Send OTP to verify email after OAuth signup (purpose=oauth_email_verify)
authExtendedRouter.post('/oauth/verify-email/send', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // Invalidate prior unverified OTPs for this purpose
    await db.update(twoFactorOtps)
      .set({ usedAt: new Date() })
      .where(and(
        eq(twoFactorOtps.userId, userId),
        eq(twoFactorOtps.purpose, 'oauth_email_verify'),
        isNull(twoFactorOtps.usedAt)
      ));
    await db.insert(twoFactorOtps).values({
      userId,
      codeHash: hashToken(code),
      expiresAt,
      purpose: 'oauth_email_verify',
    });

    sendEmailSafe({
      to: user.email,
      subject: 'Verify your Havanat email',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'email_verify' }],
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Verify OTP for OAuth email verification ──────────────────────
authExtendedRouter.post('/oauth/verify-email/verify', requireAuth, async (req, res, next) => {
  try {
    const Schema = z.object({ code: z.string().length(6) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Enter the 6-digit code' });

    const userId = Number(req.user!.sub);
    const [otp] = await db
      .select()
      .from(twoFactorOtps)
      .where(and(
        eq(twoFactorOtps.userId, userId),
        eq(twoFactorOtps.purpose, 'oauth_email_verify'),
        eq(twoFactorOtps.codeHash, hashToken(parsed.data.code)),
        gt(twoFactorOtps.expiresAt, new Date()),
        isNull(twoFactorOtps.usedAt)
      ))
      .limit(1);
    if (!otp) return res.status(401).json({ ok: false, error: 'Invalid or expired code' });
    await db.update(twoFactorOtps).set({ usedAt: new Date() }).where(eq(twoFactorOtps.id, otp.id));
    await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, userId));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Send OTP for OAuth user to set their first password ───────────
authExtendedRouter.post('/oauth/set-password/send', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.passwordSetAt) return res.status(400).json({ ok: false, error: 'You already have a password set. Use the change-password flow.' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(twoFactorOtps)
      .set({ usedAt: new Date() })
      .where(and(
        eq(twoFactorOtps.userId, userId),
        eq(twoFactorOtps.purpose, 'set_password'),
        isNull(twoFactorOtps.usedAt)
      ));
    await db.insert(twoFactorOtps).values({
      userId,
      codeHash: hashToken(code),
      expiresAt,
      purpose: 'set_password',
    });
    sendEmailSafe({
      to: user.email,
      subject: 'Confirm your new Havanat password',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'set_password' }],
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Complete set-password for OAuth user (after OTP verified) ─────
authExtendedRouter.post('/oauth/set-password/complete', requireAuth, async (req, res, next) => {
  try {
    const Schema = z.object({
      code: z.string().length(6),
      newPassword: z.string().min(8).max(200),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Code + 8+ char password required' });

    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.passwordSetAt) return res.status(400).json({ ok: false, error: 'You already have a password set. Use the change-password flow.' });

    const [otp] = await db
      .select()
      .from(twoFactorOtps)
      .where(and(
        eq(twoFactorOtps.userId, userId),
        eq(twoFactorOtps.purpose, 'set_password'),
        eq(twoFactorOtps.codeHash, hashToken(parsed.data.code)),
        gt(twoFactorOtps.expiresAt, new Date()),
        isNull(twoFactorOtps.usedAt)
      ))
      .limit(1);
    if (!otp) return res.status(401).json({ ok: false, error: 'Invalid or expired code' });

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db.update(twoFactorOtps).set({ usedAt: new Date() }).where(eq(twoFactorOtps.id, otp.id));
    await db.update(users).set({
      passwordHash,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    logAction({
      req,
      user: req.user!,
      action: 'user.password.set',
      entityType: 'user',
      entityId: String(userId),
      entityLabel: user.email,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


// ─── Verify 2FA OTP and issue JWTs (login flow) ───────────────────
authExtendedRouter.post('/2fa/verify', async (req, res, next) => {
  try {
    const Schema = z.object({
      email: z.string().email(),
      code: z.string().length(6),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid input' });

    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid code' });

    // Find a fresh, unused OTP for login
    const [otp] = await db
      .select()
      .from(twoFactorOtps)
      .where(
        and(
          eq(twoFactorOtps.userId, user.id),
          eq(twoFactorOtps.purpose, 'login'),
          eq(twoFactorOtps.codeHash, hashToken(parsed.data.code)),
          gt(twoFactorOtps.expiresAt, new Date()),
          isNull(twoFactorOtps.usedAt)
        )
      )
      .limit(1);
    if (!otp) {
      // Increment attempts on the most recent active login OTP
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE two_factor_otps SET attempts = attempts + 1 WHERE user_id = ${user.id} AND purpose = 'login' AND used_at IS NULL`);
      return res.status(401).json({ ok: false, error: 'Invalid or expired code' });
    }
    await db.update(twoFactorOtps).set({ usedAt: new Date() }).where(eq(twoFactorOtps.id, otp.id));

    // Issue tokens
    const payload = { sub: String(user.id), email: user.email, role: user.role, tier: user.tier ?? undefined };
    const accessToken = signAccessToken(payload as any);
    const refreshToken = signRefreshToken(payload as any);
    // Refresh token record
    const { refreshTokens } = await import('../db/schema.js');
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        phone: user.phone,
        avatar: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        provider: user.googleId ? 'google' : 'email',
        hasPassword: !!user.passwordSetAt,
        googleId: user.googleId,
      },
      accessToken,
      refreshToken,
      expiresIn: 60 * 60,
    });
  } catch (err) {
    next(err);
  }
});


// ─── Email verification (called after signup if needed) ───────────
authExtendedRouter.post('/verify-email', async (req, res, next) => {
  try {
    const Schema = z.object({ token: z.string().min(20) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid token' });
    const tokenHash = hashToken(parsed.data.token);
    const [stored] = await db
      .select()
      .from(emailVerifyTokens)
      .where(
        and(
          eq(emailVerifyTokens.tokenHash, tokenHash),
          gt(emailVerifyTokens.expiresAt, new Date()),
          isNull(emailVerifyTokens.usedAt)
        )
      )
      .limit(1);
    if (!stored) return res.status(400).json({ ok: false, error: 'Token expired or already used' });
    await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, stored.userId));
    await db.update(emailVerifyTokens).set({ usedAt: new Date() }).where(eq(emailVerifyTokens.id, stored.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authExtendedRouter.post('/verify-email/request', async (req, res, next) => {
  try {
    const Schema = z.object({ email: z.string().email() });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email' });
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user) return res.json({ ok: true });
    const token = crypto.randomBytes(32).toString('hex');
    await db.insert(emailVerifyTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    sendEmailSafe({
      to: user.email,
      subject: 'Verify your Havanat email',
      html: `<p>Welcome to Havanat. Click below to verify your email address:</p><p><a href="${frontendUrl}/verify-email?token=${token}" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;">Verify email</a></p><p>If you didn't sign up, ignore this email.</p>`,
      tags: [{ name: 'type', value: 'email_verify' }],
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


// ─── Change password (logged-in user, with current password) ─────
// For email/password users: provide currentPassword.
// For OAuth users that already have a real password set:
//   provide currentPassword (their last set one) — change flow.
// For OAuth users that haven't set a password yet:
//   use /api/auth/oauth/set-password/send + /complete instead.
// This endpoint refuses to set a FIRST password — that requires OTP
// verification via the set-password flow.
authExtendedRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const Schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(200),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Current + new (8+ chars) password required' });

    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    if (!user.passwordSetAt) {
      return res.status(400).json({
        ok: false,
        error: 'Use the set-password flow (OTP verification required) — see /api/auth/oauth/set-password/send',
        useSetPasswordFlow: true,
      });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ ok: false, error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db.update(users).set({ passwordHash: newHash, passwordSetAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));

    logAction({
      req,
      user: req.user!,
      action: 'user.password.change',
      entityType: 'user',
      entityId: String(userId),
      entityLabel: user.email,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

