import { Router, raw } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { orders, users, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import { initializeTransaction, verifyTransaction, refundTransaction, verifyWebhookSignature, isPaystackConfigured, paystackMode } from '../lib/paystack.js';
import { sendEmailSafe, orderConfirmationEmail } from '../lib/email.js';
export const paymentsRouter = Router();

paymentsRouter.get('/status', (_req, res) => {
  res.json({ ok: true, configured: isPaystackConfigured(), mode: paystackMode() });
});

const InitializeSchema = z.object({ orderId: z.number().int().positive() });
paymentsRouter.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const parsed = InitializeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'orderId required' });
    const [order] = await db.select().from(orders).where(eq(orders.id, parsed.data.orderId)).limit(1);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    if (order.userId !== Number(req.user!.sub)) return res.status(403).json({ ok: false, error: 'Not your order' });
    if (order.paidAt) return res.status(400).json({ ok: false, error: 'Order already paid' });

    if (!isPaystackConfigured()) {
      // Mock mode — just mark order as paid
      await db.update(orders).set({ paymentReference: `mock-${order.id}-${Date.now()}`, paidAt: new Date(), status: 'processing', updatedAt: new Date() }).where(eq(orders.id, order.id));
      await db.insert(notifications).values({
        category: 'order',
        title: `Payment received (mock) — ${order.orderNumber}`,
        body: `Your order has been marked as paid in mock mode.`,
        channels: 'inapp',
        scope: 'user',
        targetUserId: order.userId,
        authorName: 'system',
        authorRole: 'system',
        readBy: {},
      });
      sendEmailSafe({
        to: order.customerEmail,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: orderConfirmationEmail({
          reference: order.orderNumber,
          total: Number(order.total),
          items: (order as any).itemDetails ?? [],
          customerName: order.customerName,
          deliveryAddress: order.shippingAddress,
        }),
      });
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
      return res.json({ ok: true, mode: 'mock', authorizationUrl: `${frontendUrl}/account/orders/${order.id}` });
    }

    const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
    if (!user) return res.status(401).json({ ok: false, error: 'User not found' });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    const result = await initializeTransaction({
      email: user.email,
      amount: Math.round(Number(order.total) * 100),
      reference: order.orderNumber,
      callbackUrl: `${frontendUrl}/account/orders/${order.id}?paid=1`,
      metadata: { orderId: order.id, userId: user.id },
    });

    await db.update(orders).set({ paymentReference: result.reference }).where(eq(orders.id, order.id));

    await logAction({
      req: req as any,
      actorId: order.userId,
      actorRole: 'customer',
      action: 'payment.initialize',
      targetType: 'payment',
      targetId: order.id,
      meta: { reference: result.reference, amount: order.total },
    });

    res.json({ ok: true, mode: 'live', authorizationUrl: result.authorization_url, reference: result.reference });
  } catch (err) {
    next(err);
  }
});

const VerifySchema = z.object({ reference: z.string().min(3) });
paymentsRouter.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const parsed = VerifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'reference required' });
    if (!isPaystackConfigured()) return res.status(400).json({ ok: false, error: 'Paystack not configured' });

    const result = await verifyTransaction(parsed.data.reference);
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, parsed.data.reference)).limit(1);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    if (order.userId !== Number(req.user!.sub)) return res.status(403).json({ ok: false, error: 'Not your order' });

    if (result.status === 'success' && !order.paidAt) {
      await db.update(orders).set({ paidAt: new Date(), status: 'processing', updatedAt: new Date() }).where(eq(orders.id, order.id));
      await db.insert(notifications).values({
        category: 'order',
        title: `Payment received — ${order.orderNumber}`,
        body: `Your payment of ₦${Number(order.total).toLocaleString()} was successful.`,
        channels: 'inapp',
        scope: 'user',
        targetUserId: order.userId,
        authorName: 'system',
        authorRole: 'system',
        readBy: {},
      });
      sendEmailSafe({
        to: order.customerEmail,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: orderConfirmationEmail({
          reference: order.orderNumber,
          total: Number(order.total),
          items: (order as any).itemDetails ?? [],
          customerName: order.customerName,
          deliveryAddress: order.shippingAddress,
        }),
      });
    }
    res.json({ ok: true, status: result.status, amount: result.amount, paidAt: result.paid_at });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = (req as any).body?.toString('utf8') ?? '';
    if (!verifyWebhookSignature(rawBody, sig)) {
      return res.status(401).send('Invalid signature');
    }
    const event = JSON.parse(rawBody);
    if (event.event === 'charge.success' && event.data?.reference) {
      const reference = event.data.reference as string;
      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, reference)).limit(1);
      if (order && !order.paidAt) {
        await db.update(orders).set({ paidAt: new Date(), status: 'processing', updatedAt: new Date() }).where(eq(orders.id, order.id));
        await db.insert(notifications).values({
          category: 'order',
          title: `Payment received — ${order.orderNumber}`,
          body: `Your payment of ₦${Number(order.total).toLocaleString()} was successful.`,
          channels: 'inapp',
          scope: 'user',
          targetUserId: order.userId,
          authorName: 'system',
          authorRole: 'system',
          readBy: {},
        });
        sendEmailSafe({
          to: order.customerEmail,
          subject: `Order confirmed — ${order.orderNumber}`,
          html: orderConfirmationEmail({
            reference: order.orderNumber,
            total: Number(order.total),
            items: [],
            deliveryAddress: order.shippingAddress as any,
          }),
        });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('paystack webhook error:', err);
    res.sendStatus(200);
  }
});

paymentsRouter.post('/refund', requireAuth, async (req, res, next) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin only' });
    const Schema = z.object({ reference: z.string(), amount: z.number().positive().optional() });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid input' });
    if (!isPaystackConfigured()) return res.status(400).json({ ok: false, error: 'Paystack not configured' });
    const result = await refundTransaction(parsed.data.reference, parsed.data.amount ? Math.round(parsed.data.amount * 100) : undefined);
    await logAction({
      req: req as any,
      actorId: Number(req.user!.sub),
      actorRole: 'admin',
      action: 'payment.refund',
      targetType: 'payment',
      targetId: parsed.data.reference,
      meta: { amount: parsed.data.amount },
    });
    res.json({ ok: true, refund: result });
  } catch (err) {
    next(err);
  }
});
