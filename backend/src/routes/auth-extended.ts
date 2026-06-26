import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import {
  users,
  emailVerifyTokens,
  passwordResetTokens,
  twoFactorOtps,
} from '../db/schema.js';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { sendEmail, sendEmailSafe, passwordResetEmail, twoFactorCodeEmail } from '../lib/email.js';
function sendEmailSafe(...args: Parameters<typeof sendEmail>) {
  sendEmail(...args).catch((err: any) => console.warn('[email-failed]', err?.message ?? err));
}

import { signAccessToken, signRefreshToken } from '../lib/jwt.js';

export const authExtendedRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── Forgot password: send reset link ─────────────────────────────
authExtendedRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const Schema = z.object({ email: z.string().email().max(200) });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email' });

    const email = parsed.data.email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Always respond success (don't leak which emails exist)
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    sendEmailSafe({
      to: user.email,
      subject: 'Reset your Havanat password',
      html: passwordResetEmail(resetLink),
      tags: [{ name: 'type', value: 'password_reset' }],
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Reset password: confirm new password with token ──────────────
authExtendedRouter.post('/reset-password', async (req, res, next) => {
  try {
    const Schema = z.object({
      token: z.string().min(20),
      password: z.string().min(8).max(200),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid input' });

    const tokenHash = hashToken(parsed.data.token);
    const [stored] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);
    if (!stored) return res.status(400).json({ ok: false, error: 'Token expired or already used' });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, stored.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, stored.id));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Send 2FA OTP to user's email ─────────────────────────────────
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

// ─── Verify 2FA OTP and issue JWTs ────────────────────────────────
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

    // Find a fresh, unused OTP
    const [otp] = await db
      .select()
      .from(twoFactorOtps)
      .where(
        and(
          eq(twoFactorOtps.userId, user.id),
          eq(twoFactorOtps.codeHash, hashToken(parsed.data.code)),
          gt(twoFactorOtps.expiresAt, new Date()),
          isNull(twoFactorOtps.usedAt)
        )
      )
      .limit(1);
    if (!otp) {
      // Increment attempts on the most recent active OTP
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE two_factor_otps SET attempts = attempts + 1 WHERE user_id = ${user.id} AND used_at IS NULL`);
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
