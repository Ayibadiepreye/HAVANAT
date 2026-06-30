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
  images: z.array(z.string()).optional().default([]),
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
        images: parsed.data.images || [],
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

// ─── Admin: reply to customer ─────────────────────────────────────
const ReplySchema = z.object({
  message: z.string().min(1).max(5000),
});
bespokeRouter.post('/:id/reply', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    
    const parsed = ReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    }
    
    // Get bespoke request
    const [request] = await db.select().from(bespokeRequests).where(eq(bespokeRequests.id, id)).limit(1);
    if (!request) return res.status(404).json({ ok: false, error: 'Request not found' });
    
    const adminName = req.user!.email;
    const message = parsed.data.message;
    
    // Send in-app notification to customer (if they have an account)
    if (request.userId) {
      await db.insert(notifications).values({
        title: `Reply to your bespoke request — ${request.reference}`,
        body: message.slice(0, 200) + (message.length > 200 ? '...' : ''),
        category: 'bespoke',
        channels: 'inapp',
        scope: 'user',
        targetUserId: request.userId,
        authorId: Number(req.user!.sub),
        authorName: adminName,
        authorRole: req.user!.role,
        readBy: {},
      });
    }
    
    // Send email to customer
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    const trackingLink = request.userId 
      ? `${frontendUrl}/account?tab=bespoke` 
      : `${frontendUrl}/custom-request?ref=${request.reference}`;
    
    sendEmailSafe({
      to: request.customerEmail,
      subject: `[Havanat] Update on your bespoke request — ${request.reference}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #000; color: #fff; padding: 30px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-family: Georgia, serif; font-weight: 300; font-size: 28px; letter-spacing: 2px;">HAVANAT</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 300;">Update on Your Bespoke Request</h2>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Reference: <strong>${request.reference}</strong></p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Occasion: <strong>${request.occasion}</strong></p>
          </div>
          
          <div style="background: #fff; border-left: 4px solid #000; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Message from HAVANAT:</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingLink}" style="display: inline-block; background: #000; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">View Request</a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; text-align: center;">
            <p>HAVANAT - Bespoke Tailoring</p>
            <p>Lagos, Nigeria</p>
          </div>
        </div>
      `,
      tags: [{ name: 'type', value: 'bespoke_reply' }],
    });
    
    // Log action
    await logAction({
      actorId: Number(req.user!.sub),
      actorRole: req.user!.role,
      action: 'bespoke.reply',
      targetType: 'bespoke_request',
      targetId: request.id,
      meta: { reference: request.reference, messageSent: true },
    });
    
    res.json({ ok: true, message: 'Reply sent successfully' });
  } catch (err) {
    next(err);
  }
});
