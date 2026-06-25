import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { eventDiscounts, tierDiscounts } from '../db/schema.js';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';

export const discountsRouter = Router();

// ─── Public: active event discount (if any) ──────────────────────
discountsRouter.get('/active', async (_req, res, next) => {
  try {
    const now = new Date();
    const events = await db
      .select()
      .from(eventDiscounts)
      .where(and(eq(eventDiscounts.active, true), lte(eventDiscounts.startsAt, now), gte(eventDiscounts.endsAt, now)))
      .orderBy(desc(eventDiscounts.percent))
      .limit(1);
    res.json({ ok: true, event: events[0] ?? null });
  } catch (err) {
    next(err);
  }
});

// ─── Public: tier discount lookup ─────────────────────────────────
discountsRouter.get('/tiers', async (_req, res, next) => {
  try {
    const rows = await db.select().from(tierDiscounts);
    res.json({ ok: true, tiers: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: list all event discounts (past, current, future) ─────
discountsRouter.get('/admin/events', requireAuth, requireRole('admin', 'moderator'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(eventDiscounts).orderBy(desc(eventDiscounts.startsAt));
    res.json({ ok: true, events: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: create event discount ─────────────────────────────────
const CreateEventSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(''),
  percent: z.number().min(0).max(100),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean().optional().default(true),
});
discountsRouter.post('/admin/events', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const parsed = CreateEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    if (new Date(parsed.data.endsAt) <= new Date(parsed.data.startsAt)) {
      return res.status(400).json({ ok: false, error: 'endsAt must be after startsAt' });
    }
    const [row] = await db
      .insert(eventDiscounts)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        percent: parsed.data.percent.toFixed(2),
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        active: parsed.data.active,
        createdBy: Number(req.user!.sub),
      })
      .returning();
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'discount.event.create',
      targetType: 'event_discount',
      targetId: row.id,
      meta: { name: row.name, percent: row.percent },
    });
    res.status(201).json({ ok: true, event: row });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: update event discount ─────────────────────────────────
discountsRouter.patch('/admin/events/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const parsed = CreateEventSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    const patch: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.description !== undefined) patch.description = parsed.data.description;
    if (parsed.data.percent !== undefined) patch.percent = parsed.data.percent.toFixed(2);
    if (parsed.data.startsAt !== undefined) patch.startsAt = new Date(parsed.data.startsAt);
    if (parsed.data.endsAt !== undefined) patch.endsAt = new Date(parsed.data.endsAt);
    if (parsed.data.active !== undefined) patch.active = parsed.data.active;
    const [row] = await db.update(eventDiscounts).set(patch as any).where(eq(eventDiscounts.id, id)).returning();
    if (!row) return res.status(404).json({ ok: false, error: 'Event discount not found' });
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'discount.event.update',
      targetType: 'event_discount',
      targetId: row.id,
      meta: { fields: Object.keys(patch) },
    });
    res.json({ ok: true, event: row });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: delete event discount ─────────────────────────────────
discountsRouter.delete('/admin/events/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const [deleted] = await db.delete(eventDiscounts).where(eq(eventDiscounts.id, id)).returning();
    if (!deleted) return res.status(404).json({ ok: false, error: 'Event discount not found' });
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'discount.event.delete',
      targetType: 'event_discount',
      targetId: id,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: update tier discount (Deluxe/Elite) ───────────────────
const TierDiscountSchema = z.object({
  tier: z.enum(['Deluxe', 'Elite']),
  percent: z.number().min(0).max(100),
  description: z.string().max(500).optional().default(''),
});
discountsRouter.put('/admin/tiers', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const parsed = TierDiscountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    const [row] = await db
      .insert(tierDiscounts)
      .values({
        tier: parsed.data.tier,
        percent: parsed.data.percent.toFixed(2),
        description: parsed.data.description,
      })
      .onConflictDoUpdate({
        target: tierDiscounts.tier,
        set: {
          percent: parsed.data.percent.toFixed(2),
          description: parsed.data.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'discount.tier.update',
      targetType: 'tier_discount',
      targetId: row.tier,
      meta: { percent: row.percent },
    });
    res.json({ ok: true, tier: row });
  } catch (err) {
    next(err);
  }
});
