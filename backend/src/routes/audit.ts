import { Router } from 'express';
import { db } from '../db/client.js';
import { auditLog } from '../db/schema.js';
import { and, desc, eq, gte, lte, sql, ilike, or } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const auditRouter = Router();

auditRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const { userId, action, entityType, from, to, q, limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filters = [] as any[];
  if (userId) filters.push(eq(auditLog.userId, Number(userId)));
  if (action) filters.push(eq(auditLog.action, action as any));
  if (entityType) filters.push(eq(auditLog.entityType, entityType));
  if (from) filters.push(gte(auditLog.createdAt, new Date(from)));
  if (to) filters.push(lte(auditLog.createdAt, new Date(to)));
  if (q) filters.push(or(ilike(auditLog.userName, `%${q}%`), ilike(auditLog.entityId, `%${q}%`)));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const rows = await db.select().from(auditLog).where(where as any).orderBy(desc(auditLog.createdAt)).limit(Number(limit)).offset(Number(offset));
  res.json({ items: rows });
});

// CSV export
auditRouter.get('/export.csv', requireAuth, requireRole('admin'), async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const filters = [] as any[];
  if (from) filters.push(gte(auditLog.createdAt, new Date(from)));
  if (to) filters.push(lte(auditLog.createdAt, new Date(to)));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const rows = await db.select().from(auditLog).where(where as any).orderBy(desc(auditLog.createdAt));
  const header = 'timestamp,userId,userName,userRole,action,entityType,entityId,summary';
  const csv = [header, ...rows.map((r) => `${r.timestamp.toISOString()},${r.userId},"${r.userName}",${r.userRole},${r.action},${r.entityType},${r.entityId},"${(r.summary ?? '').replace(/"/g, '""')}"`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
  res.send(csv);
});

// Top stats
auditRouter.get('/stats', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const actionsToday = await db.select({ count: sql<number>`count(*)::int` }).from(auditLog).where(gte(auditLog.createdAt, startOfDay));
  const mostActive = await db.execute(sql`
    SELECT "user_id", "user_name", count(*)::int as count
    FROM audit_log
    WHERE created_at >= now() - interval '7 days'
    GROUP BY "user_id", "user_name"
    ORDER BY count DESC
    LIMIT 1
  `);
  const mostEdited = await db.execute(sql`
    SELECT "entity_type", count(*)::int as count
    FROM audit_log
    WHERE created_at >= now() - interval '7 days'
    GROUP BY "entity_type"
    ORDER BY count DESC
    LIMIT 1
  `);
  res.json({
    actionsToday: actionsToday[0]?.count ?? 0,
    mostActiveUser: (mostActive as any).rows?.[0] ?? null,
    mostEditedEntity: (mostEdited as any).rows?.[0] ?? null,
  });
});
