import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { membershipTiers, memberships, members, users } from '../db/schema.js';
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
      .where(eq(membershipTiers.active, true))
      .orderBy(membershipTiers.sortOrder);
    // Normalize into a single shape that's safe to consume in the frontend.
    // price comes from DB as decimal string; we surface as number for display.
    // features come as ["✓ Free shipping", "· Priority support"]; we keep
    // the leading symbol so the UI can render an icon next to each line.
    const items = rows.map((r) => ({
      id: r.id,
      tier: r.tier,
      displayName: r.displayName,
      description: r.description,
      // Decimal-as-number: backend stores 10000.00, we want 10000 for math.
      price: Number(r.price),
      priceLabel: Number(r.price) === 0 ? 'Free' : `₦${Number(r.price).toLocaleString()}`,
      billingCycles: r.billingCycles,
      // Default label matches the cycle; the seed/admin can override per tier.
      billing: Number(r.price) === 0 ? 'Free Forever' : 'per month',
      features: r.features,
      isPopular: r.tier === 'Deluxe',
      sortOrder: r.sortOrder,
      active: r.active,
    }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tiers' });
  }
});

membershipsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user!.sub);
    const [member] = await db.select().from(members).where(eq(members.userId, userId));
    const [membership] = await db.select().from(memberships).where(eq(memberships.userId, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      tier: user.tier,
      member: member ?? null,
      // Authoritative subscription state from the `memberships` table.
      // The frontend uses these to show 'Scheduled to revert' / 'Cancels on X' banners.
      membership: membership ?? null,
      currentPeriodEnd: membership?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: membership?.cancelAtPeriodEnd ?? false,
      scheduledDowngradeTo: membership?.scheduledDowngradeTo ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load membership' });
  }
});

// Schedule a downgrade for end of current period.
// Body: { to: 'Standard' | 'Deluxe' | 'Elite' }
membershipsRouter.post('/schedule-downgrade', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const { to } = req.body as { to?: string };
    if (!to || !['Standard', 'Deluxe', 'Elite'].includes(to)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.tier === 'standard') {
      return res.status(400).json({ error: 'You are on Standard with nothing to downgrade from.' });
    }
    const [existing] = await db.select().from(memberships).where(eq(memberships.userId, userId));
    if (existing) {
      await db.update(memberships)
        .set({ scheduledDowngradeTo: to as any, updatedAt: new Date() })
        .where(eq(memberships.userId, userId));
    } else {
      // No rich membership row yet — create one with the scheduled downgrade.
      // The actual user.tier stays the same; /api/memberships/tick flips it at period end.
      const now = new Date();
      const periodEnd = new Date(now); periodEnd.setMonth(periodEnd.getMonth() + 1);
      await db.insert(memberships).values({
        userId, tier: user.tier as any, cycle: 'monthly', status: 'active',
        amountPaid: '0',
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false, scheduledDowngradeTo: to as any,
      } as any);
    }
    logAction({
      req, user: req.user as any, action: 'update', entityType: 'membership',
      entityId: user.tier, entityLabel: `${user.tier} -> ${to}`,
      summary: `Scheduled downgrade to ${to} for end of period`,
    }).catch(() => {});
    res.json({ ok: true, scheduledDowngradeTo: to });
  } catch (err) { next(err); }
});

membershipsRouter.post('/schedule-downgrade/cancel', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    await db.update(memberships)
      .set({ scheduledDowngradeTo: null, updatedAt: new Date() })
      .where(eq(memberships.userId, userId));
    logAction({
      req, user: req.user as any, action: 'update', entityType: 'membership',
      entityId: 'self', entityLabel: 'Scheduled downgrade cancelled',
      summary: 'Cancelled scheduled downgrade',
    }).catch(() => {});
    res.json({ ok: true });
  } catch (err) { next(err); }
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
    // Upsert the richer memberships row too — this is what the schedule-downgrade
    // and cancel endpoints read from, and what /api/memberships/tick uses to
    // auto-revert at period end.
    const [memberShipExisting] = await db.select().from(memberships).where(eq(memberships.userId, userId));
    if (memberShipExisting) {
      await db.update(memberships)
        .set({
          tier: tier as any, cycle: meta.billingCycle as any,
          status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false, scheduledDowngradeTo: null, updatedAt: now,
        })
        .where(eq(memberships.userId, userId));
    } else {
      await db.insert(memberships).values({
        userId, tier: tier as any, cycle: meta.billingCycle as any, status: 'active',
        amountPaid: String(verified.amount / 100),
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false, scheduledDowngradeTo: null,
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
    // Also flip memberships.cancelAtPeriodEnd so the cron tick auto-reverts.
    const [membership] = await db.select().from(memberships).where(eq(memberships.userId, userId));
    if (membership) {
      await db.update(memberships)
        .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
        .where(eq(memberships.userId, userId));
    } else {
      await db.insert(memberships).values({
        userId, tier: user.tier as any, cycle: 'monthly', status: 'cancelled',
        amountPaid: '0',
        currentPeriodStart: new Date(), currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true, scheduledDowngradeTo: null,
      } as any);
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
