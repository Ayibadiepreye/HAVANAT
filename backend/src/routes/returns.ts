import { Router } from 'express';
import { db } from '../db/client.js';
import { returns, orders, users } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApproveReturnSchema, AssignRiderSchema, CreateReturnSchema, RejectReturnSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';

export const returnsRouter = Router();

returnsRouter.get('/mine', requireAuth, async (req, res) => {
  const rows = await db.select().from(returns).where(eq(returns.userId, Number(req.user!.sub))).orderBy(desc(returns.createdAt));
  res.json({ items: rows });
});

returnsRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const rows = status
    ? await db.select().from(returns).where(eq(returns.status, status as any)).orderBy(desc(returns.createdAt))
    : await db.select().from(returns).orderBy(desc(returns.createdAt));
  res.json({ items: rows });
});

returnsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = CreateReturnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(parsed.data.orderId)));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.userId !== Number(req.user!.sub)) return res.status(403).json({ error: 'Not your order' });
  const returnNumber = `RET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const [created] = await db.insert(returns).values({
    returnNumber, orderId: order.id, userId: order.userId, status: 'pending',
    reason: parsed.data.reason, description: parsed.data.description, images: parsed.data.images,
  }).returning();
  if (!created) return res.status(500).json({ error: 'Failed' });
  res.status(201).json(created);
});

returnsRouter.post('/:id/approve', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = ApproveReturnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [before] = await db.select().from(returns).where(eq(returns.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(returns).set({ status: 'approved', approvedBy: Number(req.user!.sub), updatedAt: new Date() }).where(eq(returns.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'return', entityId: id, entityLabel: `Return: ${before.returnNumber}`, summary: 'Approved return', before, after });
  res.json(after);
});

returnsRouter.post('/:id/reject', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = RejectReturnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [before] = await db.select().from(returns).where(eq(returns.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(returns).set({ status: 'rejected', rejectionReason: parsed.data.reason, updatedAt: new Date() }).where(eq(returns.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'return', entityId: id, entityLabel: `Return: ${before.returnNumber}`, summary: 'Rejected return', before, after });
  res.json(after);
});

returnsRouter.post('/:id/assign-rider', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = AssignRiderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [rider] = await db.select().from(users).where(eq(users.id, Number(parsed.data.riderId)));
  if (!rider || rider.role !== 'rider') return res.status(400).json({ error: 'Invalid rider' });
  const [before] = await db.select().from(returns).where(eq(returns.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(returns).set({ status: 'rider_scheduled', riderId: rider.id, updatedAt: new Date() }).where(eq(returns.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'return', entityId: id, entityLabel: `Return: ${before.returnNumber}`, summary: `Assigned pickup rider: ${rider.name}`, before, after });
  res.json(after);
});

returnsRouter.post('/:id/refund', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body as { amount: number };
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  const [before] = await db.select().from(returns).where(eq(returns.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(returns).set({ status: 'completed', refundAmount: String(amount), refundedAt: new Date(), updatedAt: new Date() }).where(eq(returns.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'return', entityId: id, entityLabel: `Return: ${before.returnNumber}`, summary: `Refunded ${amount}`, before, after });
  res.json(after);
});
