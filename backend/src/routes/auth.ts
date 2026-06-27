import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db, pool } from '../db/client.js';
import { users, refreshTokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { LoginSchema, RegisterSchema } from '../lib/validators.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { sendEmailSafe, welcomeEmail } from '../lib/email.js';
import { logAction } from '../audit/logger.js';

export const authRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

authRouter.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { name, email, password, phone } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    name, email: email.toLowerCase(), passwordHash, passwordSetAt: new Date(), phone, role: 'customer', tier: 'standard',
  }).returning();
  if (!user) return res.status(500).json({ error: 'Failed to create user' });
  const meta = reqMeta(req);
  const tokens = await issueTokens({ sub: String(user.id), email: user.email, role: user.role, tier: user.tier ?? undefined }, meta);
  // Send welcome email
  sendEmailSafe({
    to: user.email,
    subject: 'Welcome to Havanat',
    html: welcomeEmail(user.name),
  });
  return res.status(201).json({ user: toUserResponse(user), ...tokens });
});

authRouter.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const meta = reqMeta(req);
  const tokens = await issueTokens({ sub: String(user.id), email: user.email, role: user.role, tier: user.tier ?? undefined }, meta);
  return res.json({ user: toUserResponse(user), ...tokens });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return res.status(401).json({ error: 'Invalid refresh token' });
  const tokenHash = hashToken(refreshToken);
  const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }
  // Rotate
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id));
  const tokens = await issueTokens(payload);
  return res.json(tokens);
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, tokenHash));
  }
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, Number(req.user!.sub)));
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: toUserResponse(user) });
});

// PATCH /api/auth/me — update the caller's own profile fields.
// Currently supports: name, phone. Email and tier are intentionally
// read-only here (those flows have their own dedicated endpoints).
authRouter.patch('/me', requireAuth, async (req, res) => {
  const id = Number(req.user!.sub);
  const body = (req.body ?? {}) as { name?: string; phone?: string };
  const updates: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  updates.updatedAt = new Date();
  const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  if (!user) return res.status(404).json({ error: 'User not found' });
  await logAction({
    req, user: req.user!,
    action: 'update', entityType: 'user', entityId: String(id),
    entityLabel: `User: ${user.name}`,
    summary: 'Profile updated',
    before: null, after: { name: user.name, phone: user.phone },
  });
  return res.json({ user: toUserResponse(user) });
});

async function issueTokens(payload: { sub: string; email: string; role: string; tier?: string }, meta?: { userAgent?: string; ip?: string }) {
  const accessToken = signAccessToken(payload as Parameters<typeof signAccessToken>[0]);
  const refreshToken = signRefreshToken(payload as Parameters<typeof signRefreshToken>[0]);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId: Number(payload.sub),
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: meta?.userAgent ?? null,
    ip: meta?.ip ?? null,
  });
  return { accessToken, refreshToken, expiresIn: 60 * 60 };
}

// Extract userAgent + ip from Express request for session tracking.
function reqMeta(req: import('express').Request): { userAgent: string; ip: string } {
  const userAgent = (req.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? 'Unknown device';
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? '0.0.0.0';
  return { userAgent, ip: ip.slice(0, 64) };
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
    // 'google' if signed up via OAuth, otherwise 'email'.
    // Frontend uses this to decide whether to show 'Current password' field
    // on the change-password form.
    provider: user.googleId ? 'google' : 'email',
    // True if the user has a usable password (email signup, OR they called
    // /change-password to set one). OAuth-only users have a random hash
    // they can't use, so this starts false and becomes true after they set
    // a real password. Tracked via passwordSetAt column.
    hasPassword: !!user.passwordSetAt,
    googleId: user.googleId,
    // Whether the user has proven they own this email address via the
    // /verify-email OTP flow. Always false for new signups (even via Google)
    // until the user enters the OTP we send. Frontend uses this to show a
    // banner prompting them to verify before using their account.
    emailVerified: user.emailVerified,
  };
}
