import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { contactMessages, users } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { logAction } from '../audit/logger.js';

export const messagesRouter = Router();

// Admin/moderator: list all customer message threads (built from contact_messages table)
messagesRouter.get('/conversations', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(200);
    const items = rows.map((m) => ({
      id: `msg-${m.id}`,
      customerName: m.name,
      customerEmail: m.email,
      initials: m.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join(''),
      lastMessage: m.body.slice(0, 120),
      timestamp: m.createdAt.toISOString(),
      unread: !m.resolved ? 1 : 0,
      orderRef: undefined,
    }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// Admin/moderator: load a single message thread
messagesRouter.get(
  '/conversations/:id',
  requireAuth,
  requireRole('admin', 'moderator'),
  async (req, res) => {
    try {
      const idStr = req.params.id.replace(/^msg-/, '');
      const id = Number(idStr);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
      const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
      if (!msg) return res.status(404).json({ error: 'Not found' });
      // NOTE: contact_messages table only tracks 'resolved', not a separate 'read' state.
      // Viewing a message doesn't change its state — only marking it resolved does.
      const conversation = {
        id: `msg-${msg.id}`,
        customerName: msg.name,
        customerEmail: msg.email,
        initials: msg.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0]?.toUpperCase() ?? '')
          .join(''),
        lastMessage: msg.body.slice(0, 120),
        timestamp: msg.createdAt.toISOString(),
        unread: 0,
      };
      const messages = [
        {
          id: `msg-${msg.id}-customer`,
          from: 'customer' as const,
          text: msg.body,
          timestamp: msg.createdAt.toISOString(),
        },
      ];
      res.json({ conversation, messages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load conversation' });
    }
  },
);

// Admin/moderator: reply to a customer message (sends email)
messagesRouter.post(
  '/conversations/:id/reply',
  requireAuth,
  requireRole('admin', 'moderator'),
  async (req, res, next) => {
    try {
      const idStr = req.params.id.replace(/^msg-/, '');
      const id = Number(idStr);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
      const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
      if (!msg) return res.status(404).json({ error: 'Not found' });
      const { reply } = req.body as { reply?: string };
      if (!reply || !reply.trim()) return res.status(400).json({ error: 'Reply required' });
      // Log the reply
      await logAction({
        req,
        user: req.user!,
        action: 'message.reply',
        entityType: 'contact_message',
        entityId: id,
        entityLabel: `Reply to ${msg.name}`,
        summary: `Replied to contact message from ${msg.name}`,
        meta: { reply: reply.slice(0, 500) },
      });
      // Send email reply to customer
      try {
        const { sendEmailSafe, contactReplyEmail } = await import('../lib/email.js');
        sendEmailSafe({
          to: msg.email,
          subject: `Re: ${msg.subject}`,
          html: contactReplyEmail({
            customerName: msg.name,
            replyMessage: reply,
            originalMessage: {
              subject: msg.subject,
              body: msg.body,
            },
          }),
          replyTo: req.user!.sub ? undefined : undefined,
          tags: [{ name: 'type', value: 'message_reply' }],
        });
      } catch (emailErr) {
        // Non-fatal — reply still logged
        console.warn('[messages] reply email failed:', emailErr);
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}