import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { membershipTiers, members, users } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { initializeTransaction, verifyTransaction, isPaystackConfigured } from '../lib/paystack.js';
import { sendEmailSafe, subscriptionWelcomeEmail, subscriptionCancelledEmail, subscriptionExpiredEmail } from '../lib/email.js';
import { logAction } from '../audit/logger.js';

export const membershipsRouter = Router();

const lowercaseTier = z.string().transform((v) => {
  const lower = v.toLowerCase();
  if (lower === 'deluxe') return 'Deluxe';
  if (lower === 'elite') return 'Elite';
  if (lower === 'standard') return 'Standard';
  throw new Error('Invalid tier');
});

const SubscribeSchema = z.object({
  tier: lowercaseTier,
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
});

const ConfirmSchema = z.object({
  reference: z.string().min(6),
  tier: lowercaseTier,
});

membershipsRouter.get('/tiers', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(membershipTiers)
      .where(and(eq(membershipTiers.active, true)))
      .orderBy(membershipTiers.sortOrder);
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tiers' });
  }
});

membershipsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user!.sub);
    const [member] = await db.select().from(members).where(eq(members.userId, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ tier: user.tier, member: member ?? null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load membership' });
  }
});

membershipsRouter.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    if (!isPaystackConfigured()) {
      return res.status(503).json({ error: 'Paystack not configured' });
    }
    const parsed = SubscribeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { tier, billingCycle } = parsed.data;
    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.tier === tier.toLowerCase()) {
      return res.status(400).json({ error: 'You are already on this tier' });
    }
    const [tierRow] = await db.select().from(membershipTiers)
      .where(and(eq(membershipTiers.tier, tier), eq(membershipTiers.active, true)));
    if (!tierRow) return res.status(404).json({ error: 'Tier not available' });
    const monthlyNgn = Number(tierRow.price);
    const amountNgn = billingCycle === 'yearly' ? monthlyNgn * 12
      : billingCycle === 'quarterly' ? monthlyNgn * 3
      : monthlyNgn;
    const amountKobo = Math.round(amountNgn * 100);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    const reference = `sub_${userId}_${tier}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const result = await initializeTransaction({
      email: user.email,
      amount: amountKobo,
      reference,
      callbackUrl: `${frontendUrl}/account?tab=membership&paystack=verify`,
      metadata: { userId: String(userId), tier, billingCycle, type: 'membership_subscription' },
    });
    logAction({
      req, user: req.user as any, action: 'init', entityType: 'membership',
      entityId: tier, entityLabel: `${tier} subscription`,
      summary: `Initialized ${tier} subscription (${billingCycle}, ${amountNgn} NGN)`,
    }).catch(() => {});
    res.json({
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
      amount: amountNgn,
      tier,
      billingCycle,
    });
  } catch (err) {
    next(err);
  }
});

membershipsRouter.post('/confirm', requireAuth, async (req, res, next) => {
  try {
    const parsed = ConfirmSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { reference, tier } = parsed.data;
    const userId = Number(req.user!.sub);
    const verified = await verifyTransaction(reference);
    if (verified.status !== 'success') {
      return res.status(402).json({ error: 'Payment not successful', status: verified.status });
    }
    const meta = (verified.metadata ?? {}) as { userId?: string; tier?: string; billingCycle?: string };
    if (meta.userId !== String(userId) || meta.tier !== tier) {
      return res.status(400).json({ error: 'Reference mismatch' });
    }
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const now = new Date();
    const periodEnd = new Date(now);
    if (meta.billingCycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else if (meta.billingCycle === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    const existing = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(members)
        .set({ tier: tier as any, joinedAt: now, notes: `Renewed via Paystack ${reference}` })
        .where(eq(members.userId, userId));
    } else {
      await db.insert(members).values({
        userId, tier: tier as any, joinedAt: now,
        notes: `Subscribed via Paystack ${reference}`,
      } as any);
    }
    await db.update(users)
      .set({ tier: tier.toLowerCase() as 'standard' | 'deluxe' | 'elite', updatedAt: now })
      .where(eq(users.id, userId));
    const [tierRow] = await db.select().from(membershipTiers).where(eq(membershipTiers.tier, tier as any));
    const tierLabel = tierRow?.displayName ?? tier;
    const amountNgn = verified.amount / 100;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    await sendEmailSafe({
      to: user.email,
      subject: `Welcome to ${tierLabel}`,
      html: subscriptionWelcomeEmail({
        customerName: user.name,
        tier: tier as 'deluxe' | 'elite',
        tierLabel, amount: amountNgn,
        periodEnd: periodEnd.toISOString(),
        manageUrl: `${frontendUrl}/account?tab=membership`,
      }),
      tags: [{ name: 'type', value: 'subscription_welcome' }],
    });
    logAction({
      req, user: req.user as any, action: 'create', entityType: 'membership',
      entityId: tier, entityLabel: `${tier} subscription`,
      summary: `Activated ${tier} subscription for user ${userId}`,
    }).catch(() => {});
    res.json({ ok: true, tier, tierLabel, amount: amountNgn, periodEnd: periodEnd.toISOString(), subscriptionId: reference });
  } catch (err) {
    next(err);
  }
});

membershipsRouter.post('/cancel', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.tier === 'standard') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }
    const [member] = await db.select().from(members).where(eq(members.userId, userId));
    const periodEnd = member
      ? new Date(member.joinedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (member) {
      await db.update(members)
        .set({ notes: `Cancelled ${new Date().toISOString()} - reverts to standard on ${periodEnd.toISOString()}` })
        .where(eq(members.userId, userId));
    }
    const tierNameCapitalized = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
    const [tierRow] = await db.select().from(membershipTiers).where(eq(membershipTiers.tier, tierNameCapitalized as any));
    const tierLabel = tierRow?.displayName ?? user.tier;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    await sendEmailSafe({
      to: user.email,
      subject: `${tierLabel} subscription cancelled`,
      html: subscriptionCancelledEmail({
        customerName: user.name, tierLabel,
        periodEnd: periodEnd.toISOString(),
        resubscribeUrl: `${frontendUrl}/account?tab=membership`,
      }),
      tags: [{ name: 'type', value: 'subscription_cancelled' }],
    });
    logAction({
      req, user: req.user as any, action: 'cancel', entityType: 'membership',
      entityId: user.tier, entityLabel: `${user.tier} subscription`,
      summary: `Cancelled ${user.tier} subscription`,
    }).catch(() => {});
    res.json({ ok: true, periodEnd: periodEnd.toISOString() });
  } catch (err) {
    next(err);
  }
});
