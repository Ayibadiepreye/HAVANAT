import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { contactMessages, notifications, users } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import { sendEmail, sendEmailSafe, contactFormEmailToAdmin } from '../lib/email.js';
function sendEmailSafe(...args: Parameters<typeof sendEmail>) {
  sendEmail(...args).catch((err: any) => console.warn('[email-failed]', err?.message ?? err));
}


export const contactRouter = Router();

// ─── Public: submit a contact form message ────────────────────────
const ContactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  subject: z.string().min(2).max(300),
  body: z.string().min(5).max(5000),
});

contactRouter.post('/', async (req, res, next) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    }
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
      .insert(contactMessages)
      .values({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        subject: parsed.data.subject,
        body: parsed.data.body,
      })
      .returning();

    // Notify all admins in-app
    const admins = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'admin'));
    for (const admin of admins) {
      await db.insert(notifications).values({
        title: `Contact: ${parsed.data.subject}`,
        body: `${parsed.data.name} sent a message via the contact form.`,
        category: 'system',
        channels: 'inapp',
        scope: 'user',
        targetUserId: admin.id,
        authorId: userId ?? null,
        authorName: parsed.data.name,
        authorRole: 'customer',
        readBy: {},
      }).onConflictDoNothing();
    }

    // Email admins
    sendEmailSafe({
      to: admins.map((a) => `${a.name} <concierge@havanat.store>`),
      subject: `[Contact] ${parsed.data.subject} — from ${parsed.data.name}`,
      html: contactFormEmailToAdmin({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        body: parsed.data.body,
      }),
      replyTo: parsed.data.email,
      tags: [{ name: 'type', value: 'contact_admin' }],
    });

    await logAction({
      req: req as any,
      actorId: 0,
      actorRole: 'system',
      action: 'contact.create',
      targetType: 'contact_message',
      targetId: row.id,
      meta: { subject: parsed.data.subject, from: parsed.data.email },
    });

    res.status(201).json({ ok: true, message: 'Thank you. We will get back to you shortly.' });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: list messages ─────────────────────────────────────────
contactRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    res.json({ ok: true, items: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: mark resolved ─────────────────────────────────────────
contactRouter.post('/:id/resolve', requireAuth, requireRole('admin', 'moderator'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
    const [row] = await db
      .update(contactMessages)
      .set({ resolved: true, resolvedBy: Number(req.user!.sub), resolvedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});
