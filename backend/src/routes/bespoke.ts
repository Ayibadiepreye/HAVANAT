import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { bespokeRequests, notifications, users } from '../db/schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import { sendEmailSafe, bespokeRequestEmailToAdmin, bespokeRequestConfirmationToCustomer } from '../lib/email.js';
export const bespokeRouter = Router();

function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BS-${stamp}-${rand}`;
}

// ─── Public + customer: create a bespoke request ──────────────────
const CreateBespokeSchema = z.object({
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().max(30).optional().default(''),
  occasion: z.string().min(2).max(200),
  budget: z.number().min(0).optional(),
  timeline: z.string().max(200).optional().default(''),
  description: z.string().min(10).max(5000),
  measurements: z.record(z.string()).optional().default({}),
});

bespokeRouter.post('/', async (req, res, next) => {
  try {
    const parsed = CreateBespokeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    }
    const reference = makeReference();

    // Link to user if logged in
    const auth = req.headers.authorization;
    let userId: number | null = null;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../lib/jwt.js');
        const payload = verifyAccessToken(auth.slice(7));
        if (payload) userId = Number(payload.sub);
      } catch {
        /* anonymous */
      }
    }

    const [row] = await db
      .insert(bespokeRequests)
      .values({
        reference,
        userId,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        occasion: parsed.data.occasion,
        budget: parsed.data.budget !== undefined ? parsed.data.budget.toFixed(2) : null,
        timeline: parsed.data.timeline,
        description: parsed.data.description,
        measurements: parsed.data.measurements,
        status: 'new',
      })
      .returning();

    // Notify all admins in-app
    const admins = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'admin'));
    for (const admin of admins) {
      await db.insert(notifications).values({
        title: `New bespoke request — ${parsed.data.occasion}`,
        body: `${parsed.data.customerName} submitted a bespoke request (${reference}).`,
        category: 'bespoke',
        channels: 'inapp',
        scope: 'user',
        targetUserId: admin.id,
        authorId: userId ?? null,
        authorName: parsed.data.customerName,
        authorRole: 'customer',
        readBy: {},
      }).onConflictDoNothing();
    }

    // Email admins
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    const adminLink = `${frontendUrl}/admin/bespoke/${row.id}`;
    sendEmailSafe({
      to: admins.map((a) => `${a.name} <concierge@havanat.store>`),
      subject: `[Bespoke] New request — ${parsed.data.occasion} from ${parsed.data.customerName}`,
      html: bespokeRequestEmailToAdmin({
        id: row.id.toString(),
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        occasion: parsed.data.occasion,
        budget: parsed.data.budget,
        timeline: parsed.data.timeline,
        description: parsed.data.description,
        adminLink,
      }),
      replyTo: parsed.data.customerEmail,
      tags: [{ name: 'type', value: 'bespoke_admin' }],
    });

    // Confirmation to customer with link back
    const customerLink = `${frontendUrl}/custom-request?ref=${reference}`;
    sendEmailSafe({
      to: parsed.data.customerEmail,
      subject: `[Havanat] We received your bespoke request — ${reference}`,
      html: bespokeRequestConfirmationToCustomer({
        reference,
        customerName: parsed.data.customerName,
        occasion: parsed.data.occasion,
        trackingLink: customerLink,
      }),
      tags: [{ name: 'type', value: 'bespoke_customer' }],
    });

    await logAction({
      actorId: userId ?? 0,
      actorRole: 'customer',
      action: 'bespoke.create',
      targetType: 'bespoke_request',
      targetId: row.id,
      meta: { reference, occasion: parsed.data.occasion },
    });

    res.status(201).json({ ok: true, reference, item: row });
  } catch (err) {
    next(err);
  }
});

// ─── Customer: list their own requests ────────────────────────────
bespokeRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(bespokeRequests)
      .where(eq(bespokeRequests.userId, Number(req.user!.sub)))
      .orderBy(desc(bespokeRequests.createdAt));
    res.json({ ok: true, items: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: list all ──────────────────────────────────────────────
bespokeRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(bespokeRequests).orderBy(desc(bespokeRequests.createdAt));
    res.json({ ok: true, items: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: get one ───────────────────────────────────────────────
bespokeRouter.get('/:id', requireAuth, requireRole('admin', 'moderator', 'customer'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const [row] = await db.select().from(bespokeRequests).where(eq(bespokeRequests.id, id)).limit(1);
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    // Customers can only see their own
    if (req.user!.role === 'customer' && row.userId !== Number(req.user!.sub)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    res.json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: update status / notes ─────────────────────────────────
const UpdateSchema = z.object({
  status: z.enum(['new', 'in_review', 'quoted', 'accepted', 'declined', 'complete']).optional(),
  adminNotes: z.string().max(5000).optional(),
  assignedTo: z.number().int().optional(),
});
bespokeRouter.patch('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    if (parsed.data.adminNotes !== undefined) patch.adminNotes = parsed.data.adminNotes;
    if (parsed.data.assignedTo !== undefined) patch.assignedTo = parsed.data.assignedTo;
    const [row] = await db.update(bespokeRequests).set(patch as any).where(eq(bespokeRequests.id, id)).returning();
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'bespoke.update',
      targetType: 'bespoke_request',
      targetId: row.id,
      meta: { status: row.status },
    });
    res.json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});
