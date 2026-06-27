// User-facing notifications API.
// Backend creates notifications via other endpoints (orders, payments, bespoke, contact).
// This route lets users LIST theirs, mark one read, mark all read.

import { Router } from 'express';
import { db } from '../db/client.js';
import { notifications } from '../db/schema.js';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter = Router();

/**
 * GET /api/notifications — list notifications for the current user.
 * Includes notifications targeted at:
 *  - this user directly (target_user_id = me)
 *  - this user's tier (target_tier = my tier)
 *  - everyone (scope = 'all')
 * Sorted newest first. Capped at 200.
 */
notificationsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const userTier = req.user!.tier ?? null;

    // Build scope-based filter
    const scoped = or(
      eq(notifications.targetUserId, userId),
      userTier ? eq(notifications.targetUserId, null) : sql`FALSE`, // we'll filter tier below
      eq(notifications.scope, 'all'),
      userTier ? eq(notifications.targetTier, userTier) : sql`FALSE`,
    );

    const rows = await db
      .select()
      .from(notifications)
      .where(scoped)
      .orderBy(desc(notifications.createdAt))
      .limit(200);

    res.json({ ok: true, items: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/:id/read — mark one notification read for the current user.
 */
notificationsRouter.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user!.sub);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'invalid id' });

    // Update the read_by jsonb: append this user id
    await db.execute(sql`
      UPDATE notifications
      SET read_by = COALESCE(read_by, '{}'::jsonb) || ${JSON.stringify({ [userId]: new Date().toISOString() })}::jsonb
      WHERE id = ${id}
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/read-all — mark every notification read for this user.
 */
notificationsRouter.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const userTier = req.user!.tier ?? null;
    const now = new Date().toISOString();
    await db.execute(sql`
      UPDATE notifications
      SET read_by = COALESCE(read_by, '{}'::jsonb) || ${JSON.stringify({ [userId]: now })}::jsonb
      WHERE (target_user_id = ${userId}
             OR scope = 'all'
             OR target_tier = ${userTier ?? ''})
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count — count of unread notifications for this user.
 */
notificationsRouter.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const userTier = req.user!.tier ?? null;

    const rows = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE (target_user_id = ${userId}
             OR scope = 'all'
             OR target_tier = ${userTier ?? ''})
        AND (read_by IS NULL OR NOT (read_by ? ${String(userId)}))
    `);
    const count = (rows.rows?.[0] as any)?.count ?? 0;
    res.json({ ok: true, count });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/stats — per-user notification summary.
 * Returns the user's visible notifications and which ones are about to
 * expire (>36h old). Public, but requireAuth because we surface user-
 * specific counts.
 */
import { sql as _sql } from 'drizzle-orm';
notificationsRouter.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const userTier = req.user!.tier ?? null;
    const stats = await db.execute(_sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE read_by ? ${String(userId)})::int AS read,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '36 hours')::int AS expiring_soon,
        MAX(created_at) AS most_recent
      FROM notifications
      WHERE (target_user_id = ${userId}
             OR scope = 'all'
             OR target_tier = ${userTier ?? ''})
    `);
    const s: any = stats.rows?.[0] ?? { total: 0, read: 0, expiring_soon: 0, most_recent: null };
    res.json({
      ok: true,
      total: Number(s.total ?? 0),
      read: Number(s.read ?? 0),
      unread: Number(s.total ?? 0) - Number(s.read ?? 0),
      expiringSoon: Number(s.expiring_soon ?? 0),
      mostRecent: s.most_recent ?? null,
      retentionHours: 48,
    });
  } catch (err) {
    next(err);
  }
});
