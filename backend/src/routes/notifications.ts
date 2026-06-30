import { Router } from 'express';
import { db } from '../db/client.js';
import { notifications, users } from '../db/schema.js';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import { sendEmailSafe } from '../lib/email.js';
import { z } from 'zod';

export const notificationsRouter = Router();

/**
 * POST /api/notifications — Create a broadcast notification (admin/moderator only)
 * Allows admins and moderators to send notifications to users via in-app and/or email.
 */
notificationsRouter.post('/', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const Schema = z.object({
      title: z.string().min(1, 'Title required').max(200, 'Title too long'),
      body: z.string().min(1, 'Body required').max(5000, 'Body too long'),
      category: z.enum(['general', 'order', 'return', 'membership', 'promotion', 'system']).default('general'),
      channels: z.enum(['in_app', 'email', 'both']).default('in_app'),
      scope: z.enum(['all', 'tier', 'user']),
      targetUserId: z.number().optional(),
      targetTier: z.enum(['standard', 'deluxe', 'elite']).optional(),
    });

    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid input', 
        details: parsed.error.flatten() 
      });
    }

    const { title, body, category, channels, scope, targetUserId, targetTier } = parsed.data;

    // Validate scope-specific requirements
    if (scope === 'user' && !targetUserId) {
      return res.status(400).json({ ok: false, error: 'targetUserId required when scope is "user"' });
    }
    if (scope === 'tier' && !targetTier) {
      return res.status(400).json({ ok: false, error: 'targetTier required when scope is "tier"' });
    }

    // Verify target user exists if scope is 'user'
    if (scope === 'user' && targetUserId) {
      const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (!targetUser) {
        return res.status(404).json({ ok: false, error: 'Target user not found' });
      }
    }

    const authorId = Number(req.user!.sub);
    const [author] = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
    if (!author) {
      return res.status(404).json({ ok: false, error: 'Author not found' });
    }

    // Create notification in database
    const [notification] = await db.insert(notifications).values({
      title,
      body,
      category,
      channels,
      scope,
      targetUserId: scope === 'user' ? targetUserId : null,
      targetTier: scope === 'tier' ? targetTier : null,
      authorId,
      authorName: author.name,
      authorRole: req.user!.role as 'admin' | 'moderator' | 'system',
      readBy: {},
    }).returning();

    if (!notification) {
      return res.status(500).json({ ok: false, error: 'Failed to create notification' });
    }

    // Send emails if channel includes email
    if (channels === 'email' || channels === 'both') {
      try {
        let recipientEmails: string[] = [];

        if (scope === 'all') {
          // Get all customer emails
          const customers = await db.select({ email: users.email })
            .from(users)
            .where(eq(users.role, 'customer'));
          recipientEmails = customers.map(c => c.email);

          // ALSO include newsletter subscribers (people who signed up via footer)
          const { newsletterSubscribers } = await import('../db/schema.js');
          const subscribers = await db.select({ email: newsletterSubscribers.email })
            .from(newsletterSubscribers);
          
          // Merge and deduplicate
          const allEmails = new Set([...recipientEmails, ...subscribers.map(s => s.email)]);
          recipientEmails = Array.from(allEmails);

        } else if (scope === 'tier' && targetTier) {
          // Get emails for specific tier
          const tierUsers = await db.select({ email: users.email })
            .from(users)
            .where(and(
              eq(users.role, 'customer'),
              eq(users.tier, targetTier)
            ));
          recipientEmails = tierUsers.map(u => u.email);
        } else if (scope === 'user' && targetUserId) {
          // Get single user email
          const [targetUser] = await db.select({ email: users.email })
            .from(users)
            .where(eq(users.id, targetUserId))
            .limit(1);
          if (targetUser) {
            recipientEmails = [targetUser.email];
          }
        }

        // Send emails in batches (Resend supports batch sending)
        if (recipientEmails.length > 0) {
          // Import the broadcast email template
          const { broadcastEmail } = await import('../lib/email.js');
          
          // For large lists, send in batches of 100
          const batchSize = 100;
          for (let i = 0; i < recipientEmails.length; i += batchSize) {
            const batch = recipientEmails.slice(i, i + batchSize);
            
            // Send to each recipient
            for (const email of batch) {
              await sendEmailSafe({
                to: email,
                subject: title,
                html: broadcastEmail({
                  title,
                  body,
                  senderName: author.name,
                  senderRole: req.user!.role,
                  category,
                }),
                tags: [
                  { name: 'type', value: 'broadcast' },
                  { name: 'category', value: category },
                  { name: 'scope', value: scope },
                ],
              });
            }
          }

          console.info(`[broadcast] Sent ${recipientEmails.length} emails for notification ${notification.id}`);
        }
      } catch (emailErr) {
        console.error('[broadcast] Email sending failed:', emailErr);
        // Don't fail the request if email fails - notification is already created
      }
    }

    // Log audit action
    await logAction({
      req,
      user: req.user!,
      action: 'create',
      entityType: 'notification',
      entityId: String(notification.id),
      entityLabel: `Notification: ${notification.title}`,
      summary: `Broadcast to ${scope}${scope === 'tier' ? ` (${targetTier})` : ''}${scope === 'user' ? ` (user ${targetUserId})` : ''} via ${channels}`,
      before: null,
      after: {
        title: notification.title,
        scope: notification.scope,
        channels: notification.channels,
        category: notification.category,
      },
    });

    res.status(201).json({
      ok: true,
      notification: {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        channels: notification.channels,
        scope: notification.scope,
        targetUserId: notification.targetUserId,
        targetTier: notification.targetTier,
        authorId: notification.authorId,
        authorName: notification.authorName,
        authorRole: notification.authorRole,
        readBy: notification.readBy,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

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
