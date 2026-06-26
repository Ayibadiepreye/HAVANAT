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
  const tokens = await issueTokens({ sub: String(user.id), email: user.email, role: user.role, tier: user.tier ?? undefined });
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
  const tokens = await issueTokens({ sub: String(user.id), email: user.email, role: user.role, tier: user.tier ?? undefined });
  return res.json({ user: toUserResponse(user), ...tokens });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return res.status(401).json({ error: 'Invalid refresh token' });
  const tokenHash = hashToken(refreshToken);
  const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }
  // Rotate
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, stored.id));
  const tokens = await issueTokens(payload);
  return res.json(tokens);
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.tokenHash, tokenHash));
  }
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, Number(req.user!.sub)));
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: toUserResponse(user) });
});

async function issueTokens(payload: { sub: string; email: string; role: string; tier?: string }) {
  const accessToken = signAccessToken(payload as Parameters<typeof signAccessToken>[0]);
  const refreshToken = signRefreshToken(payload as Parameters<typeof signRefreshToken>[0]);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId: Number(payload.sub),
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
  return { accessToken, refreshToken, expiresIn: 60 * 60 };
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
  };
}
