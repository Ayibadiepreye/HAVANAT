import { Router } from 'express';
import { db } from '../db/client.js';
import { orders, orderItems, users, products } from '../db/schema.js';
import { desc, eq, sql, inArray } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AssignRiderSchema, UpdateOrderStatusSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';

export const ordersRouter = Router();

// Customer: own orders
ordersRouter.get('/mine', requireAuth, async (req, res) => {
  const rows = await db.select().from(orders).where(eq(orders.userId, Number(req.user!.sub))).orderBy(desc(orders.createdAt));
  res.json({ items: rows });
});

// Admin: all orders
ordersRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const { status, limit = '100', offset = '0' } = req.query as Record<string, string>;
  const filters = [] as any[];
  if (status) filters.push(eq(orders.status, status as any));
  const where = filters.length > 0 ? filters[0] : undefined;
  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(Number(limit)).offset(Number(offset));
  res.json({ items: rows });
});

ordersRouter.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  // Customers can only see their own
  if (req.user!.role === 'customer' && order.userId !== Number(req.user!.sub)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  res.json({ ...order, items });
});

// Customer: place new order
ordersRouter.post('/', requireAuth, async (req, res) => {
  const { items, addressId, paymentMethod, customerName, customerPhone } = req.body as {
    items: Array<{ productId: number; size?: string; color?: string; quantity: number }>;
    addressId: number;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
  };
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
  const productIds = items.map((i) => i.productId);
  const found = await db.select().from(products).where(inArray(products.id, productIds));
  if (found.length !== items.length) return res.status(400).json({ error: 'Invalid product' });
  const productById = new Map(found.map((p) => [p.id, p]));
  let subtotal = 0;
  const orderItemsToInsert = items.map((i) => {
    const p = productById.get(i.productId)!;
    const lineTotal = Number(p.price) * i.quantity;
    subtotal += lineTotal;
    return {
      productId: p.id, productName: p.name, productImage: p.images[0],
      size: i.size, color: i.color, quantity: i.quantity, unitPrice: p.price,
    };
  });
  const shippingFee = '1500';
  const total = String(subtotal + Number(shippingFee));
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const [order] = await db.insert(orders).values({
    orderNumber, userId: Number(req.user!.sub), status: 'pending',
    subtotal: String(subtotal), shippingFee, total,
    paymentMethod, addressId,
    customerName, customerPhone, customerEmail: req.user!.email,
    tracking: [{ status: 'pending', timestamp: new Date().toISOString() }],
  }).returning();
  if (!order) return res.status(500).json({ error: 'Failed to create order' });
  await db.insert(orderItems).values(orderItemsToInsert.map((i) => ({ ...i, orderId: order.id })));
  res.status(201).json(order);
});

// Admin: update status
ordersRouter.patch('/:id/status', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [before] = await db.select().from(orders).where(eq(orders.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const newTracking = [...(before.tracking || []), { status: parsed.data.status, timestamp: new Date().toISOString(), note: parsed.data.note }];
  const [after] = await db.update(orders).set({ status: parsed.data.status, tracking: newTracking, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  await logAction({
    req, user: req.user!, action: 'update', entityType: 'order',
    entityId: id, entityLabel: `Order: ${before.orderNumber}`,
    summary: `Status: ${before.status} → ${parsed.data.status}`, before, after,
  });
  res.json(after);
});

// Admin: assign rider
ordersRouter.patch('/:id/assign-rider', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = AssignRiderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [before] = await db.select().from(orders).where(eq(orders.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [rider] = await db.select().from(users).where(eq(users.id, Number(parsed.data.riderId)));
  if (!rider || rider.role !== 'rider') return res.status(400).json({ error: 'Invalid rider' });
  const newTracking = [...(before.tracking || []), { status: 'rider_assigned', timestamp: new Date().toISOString(), note: `Assigned to ${rider.name}` }];
  const [after] = await db.update(orders).set({ riderId: rider.id, tracking: newTracking, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  await logAction({
    req, user: req.user!, action: 'update', entityType: 'order',
    entityId: id, entityLabel: `Order: ${before.orderNumber}`,
    summary: `Assigned rider: ${rider.name}`, before, after,
  });
  res.json(after);
});
