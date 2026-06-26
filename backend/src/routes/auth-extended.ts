import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import {
  users,
  emailVerifyTokens,
  twoFactorOtps,
  refreshTokens,
} from '../db/schema.js';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { sendEmailSafe, passwordResetEmail, twoFactorCodeEmail } from '../lib/email.js';

import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import { recordFailure, recordSuccess, lockoutResponse } from '../middleware/securityRateLimit.js';

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
    // Rate-limit by email (per forgot-password-send purpose)
    const fpLock = await recordFailure({
      email, reason: 'forgot_password_send', maxAttempts: 5, lockoutMs: 60 * 60 * 1000,
    });
    if (fpLock.blocked) {
      return res.status(429).json(lockoutResponse(fpLock));
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Always respond success (don't leak which emails exist)
    if (!user) {
      // Still record success to reset the counter (don't punish unknown emails)
      await recordSuccess({ email, reason: 'forgot_password_send' });
      return res.json({ ok: true });
    }

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

    const fpResult = await sendEmailSafe({
      to: user.email,
      subject: 'Your Havanat password-reset code',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'forgot_password' }],
    });
    if (!fpResult.ok) console.warn('[forgot-password] email failed:', fpResult.error);

    // Reset the counter — this request succeeded
    await recordSuccess({ email, reason: 'forgot_password_send' });

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

    const email = parsed.data.email.toLowerCase();
    // Rate-limit by email — failed verification attempts
    const vLock = await recordFailure({
      email, reason: 'otp_forgot_password', maxAttempts: 5, lockoutMs: 15 * 60 * 1000,
    });
    if (vLock.blocked) {
      return res.status(429).json(lockoutResponse(vLock));
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
    // Reset rate-limit counter — verify succeeded
    await recordSuccess({ email, reason: 'otp_forgot_password' });

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
      req, user: { id: session.userId, sub: String(session.userId), email: '', role: 'customer' },
      action: 'user.password.reset',
      entityType: 'user',
      entityId: String(session.userId),
      entityLabel: `User ${session.userId}`,
      summary: 'Password reset completed',
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

    const tfaResult = await sendEmailSafe({
      to: user.email,
      subject: 'Your Havanat verification code',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'two_factor' }],
    });
    if (!tfaResult.ok) console.warn('[2fa] email failed:', tfaResult.error);

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

    // AWAIT sendEmailSafe so the response only returns after Resend has
    // accepted the email. Logs the result for debugging.
    const result = await sendEmailSafe({
      to: user.email,
      subject: 'Verify your Havanat email',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'email_verify' }],
    });
    if (!result.ok) {
      console.warn('[oauth/verify-email/send] OTP email failed:', result.error);
    } else {
      console.info('[oauth/verify-email/send] OTP sent to', user.email);
    }
    res.json({ ok: true, emailSent: result.ok });
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
    // Rate-limit by userId — failed OAuth email-verify OTP
    const vevLock = await recordFailure({
      userId, reason: 'otp_oauth_email_verify', maxAttempts: 5, lockoutMs: 15 * 60 * 1000,
    });
    if (vevLock.blocked) {
      return res.status(429).json(lockoutResponse(vevLock));
    }
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
    // Reset rate-limit counter — verify succeeded
    await recordSuccess({ userId, reason: 'otp_oauth_email_verify' });
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
    const spResult = await sendEmailSafe({
      to: user.email,
      subject: 'Confirm your new Havanat password',
      html: twoFactorCodeEmail(code),
      tags: [{ name: 'type', value: 'set_password' }],
    });
    if (!spResult.ok) console.warn('[set-password] email failed:', spResult.error);
    res.json({ ok: true, emailSent: spResult.ok });
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

    // Rate-limit by userId — failed set-password OTP
    const spLock = await recordFailure({
      userId, reason: 'otp_set_password', maxAttempts: 5, lockoutMs: 15 * 60 * 1000,
    });
    if (spLock.blocked) {
      return res.status(429).json(lockoutResponse(spLock));
    }
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
    // Reset rate-limit counter — set-password completed
    await recordSuccess({ userId, reason: 'otp_set_password' });

    logAction({
      req,
      user: req.user!,
      action: 'user.password.set',
      entityType: 'user',
      entityId: String(userId),
      entityLabel: user.email,
      summary: 'Password set via OAuth flow',
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

    const email = parsed.data.email.toLowerCase();
    // Rate-limit by email — failed verification attempts
    const vLock = await recordFailure({
      email, reason: 'otp_forgot_password', maxAttempts: 5, lockoutMs: 15 * 60 * 1000,
    });
    if (vLock.blocked) {
      return res.status(429).json(lockoutResponse(vLock));
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
    // Reset rate-limit counter — 2FA verify succeeded
    await recordSuccess({ userId: user.id, reason: 'otp_login' });

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
    const veResult = await sendEmailSafe({
      to: user.email,
      subject: 'Verify your Havanat email',
      html: `<p>Welcome to Havanat. Click below to verify your email address:</p><p><a href="${frontendUrl}/verify-email?token=${token}" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;">Verify email</a></p><p>If you didn't sign up, ignore this email.</p>`,
      tags: [{ name: 'type', value: 'email_verify' }],
    });
    if (!veResult.ok) console.warn('[verify-email-link] email failed:', veResult.error);
    res.json({ ok: true, emailSent: veResult.ok });
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

    // Rate-limit by userId — failed change-password attempts
    const cpLock = await recordFailure({
      userId, reason: 'change_password', maxAttempts: 5, lockoutMs: 60 * 60 * 1000,
    });
    if (cpLock.blocked) {
      return res.status(429).json(lockoutResponse(cpLock));
    }

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
    // Reset rate-limit counter — change-password succeeded
    await recordSuccess({ userId, reason: 'change_password' });

    logAction({
      req,
      user: req.user!,
      action: 'user.password.change',
      entityType: 'user',
      entityId: String(userId),
      entityLabel: user.email,
      summary: 'Password changed',
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


// ─── Active sessions: list, revoke one, revoke all others ─────────
//
// Reads from refresh_tokens table. We treat each non-revoked,
// non-expired refresh token as an active session. The "current" session
// is the one whose token hash matches the refresh token in the current
// request (or whose access token was used to authenticate this request).
//
// GET /api/auth/sessions — list active sessions for the current user
authExtendedRouter.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const rows = await db
      .select({
        id: refreshTokens.id,
        userAgent: refreshTokens.userAgent,
        ip: refreshTokens.ip,
        createdAt: refreshTokens.createdAt,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
    // Filter to non-revoked, non-expired
    const now = new Date();
    const meta = {
      userAgent: (req.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? '',
      ip: ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? '').slice(0, 64),
    };
    const sessions = rows
      .filter((r) => !r.revokedAt && r.expiresAt > now)
      .map((r) => ({
        id: String(r.id),
        device: r.userAgent || 'Unknown device',
        ip: r.ip || '—',
        createdAt: r.createdAt.toISOString(),
        // Current = the session matching this request's user-agent + ip
        // (best-effort — only one session per browser+IP can match)
        current: r.userAgent === meta.userAgent && r.ip === meta.ip,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/sessions/:id — revoke a single session
authExtendedRouter.delete('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const [updated] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.id, id), eq(refreshTokens.userId, userId)))
      .returning({ id: refreshTokens.id });
    if (!updated) return res.status(404).json({ ok: false, error: 'Session not found' });
    logAction({
      req,
      user: { sub: String(userId), email: '', role: 'customer' },
      entityType: 'user',
      entityId: userId,
      entityLabel: String(userId),
      action: 'session_revoked',
      summary: `Revoked session #${id}`,
    }).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/sessions — revoke all sessions except the current one
authExtendedRouter.delete('/sessions', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    // The "current" session is the one matching this request's user-agent + ip.
    const meta = {
      userAgent: (req.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? '',
      ip: ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? '').slice(0, 64),
    };
    const rows = await db
      .select({
        id: refreshTokens.id,
        userAgent: refreshTokens.userAgent,
        ip: refreshTokens.ip,
      })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    const others = rows.filter((r) => !(r.userAgent === meta.userAgent && r.ip === meta.ip));
    if (others.length === 0) return res.json({ ok: true, revokedCount: 0 });
    // Revoke just the others, not the current one
    let revokedCount = 0;
    for (const r of others) {
      const [updated] = await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, r.id))
        .returning({ id: refreshTokens.id });
      if (updated) revokedCount++;
    }
    logAction({
      req,
      user: { sub: String(userId), email: '', role: 'customer' },
      entityType: 'user',
      entityId: userId,
      entityLabel: String(userId),
      action: 'sessions_revoked_all',
      summary: `Revoked ${revokedCount} other sessions`,
    }).catch(() => {});
    res.json({ ok: true, revokedCount });
  } catch (err) {
    next(err);
  }
});
