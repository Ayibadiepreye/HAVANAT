import { Router } from 'express';
import { db } from '../db/client.js';
import { orders, orderItems, users, products, deliveries, notifications } from '../db/schema.js';
import { desc, eq, sql, inArray } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AssignRiderSchema, UpdateOrderStatusSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';
import { sendEmailSafe, orderConfirmationEmail, orderStatusEmail, orderShippedEmail } from '../lib/email.js';

export const ordersRouter = Router();

// Customer: own orders
ordersRouter.get('/mine', requireAuth, async (req, res) => {
  const rows = await db.select().from(orders).where(eq(orders.userId, Number(req.user!.sub))).orderBy(desc(orders.createdAt));
  
  // Fetch order items for each order
  const ordersWithItems = await Promise.all(
    rows.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  res.json({ items: ordersWithItems });
});

// Admin: all orders
ordersRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const { status, limit = '100', offset = '0' } = req.query as Record<string, string>;
  const filters = [] as any[];
  if (status) filters.push(eq(orders.status, status as any));
  const where = filters.length > 0 ? filters[0] : undefined;
  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(Number(limit)).offset(Number(offset));
  
  // Fetch order items for each order
  const ordersWithItems = await Promise.all(
    rows.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  res.json({ items: ordersWithItems });
});

// Public: track order by order number (no auth needed — tracking ID is the secret)
ordersRouter.get('/track/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Return limited public-safe fields (no customer email/phone in response)
    const [riderRow] = order.riderId
      ? await db.select().from(users).where(eq(users.id, order.riderId)).limit(1)
      : [];
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      destination: order.shippingAddress,
      tracking: order.tracking || [],
      rider: riderRow ? { name: riderRow.name, phone: riderRow.phone } : null,
    });
  } catch (err) {
    next(err);
  }
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
    const unitPrice = Number(p.price);
    const lineTotal = unitPrice * i.quantity;
    subtotal += lineTotal;
    return {
      productId: p.id,
      productName: p.name,
      productImage: p.images?.[0] ?? null,
      size: i.size ?? null,
      color: i.color ?? null,
      quantity: i.quantity,
      unitPrice: String(unitPrice),
      totalPrice: String(lineTotal),
    };
  });
  const shippingFee = '1500';
  const total = String(subtotal + Number(shippingFee));
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const [order] = await db.insert(orders).values({
    orderNumber, userId: Number(req.user!.sub), status: 'received',
    subtotal: String(subtotal), shippingFee, total,
    paymentMethod, addressId: addressId ?? null,
    customerName, customerPhone, customerEmail: req.user!.email,
    shippingAddress: ((req.body as any)?.shippingAddress ?? { fullName: customerName, phone: customerPhone, street: 'TBD', city: 'TBD', state: 'TBD' }) as any,
    tracking: [{ status: 'received', timestamp: new Date().toISOString() }],
  } as any).returning();
  if (!order) return res.status(500).json({ error: 'Failed to create order' });
  await db.insert(orderItems).values(orderItemsToInsert.map((i) => ({ ...i, orderId: order.id })));
  // Send order confirmation email
  sendEmailSafe({
    to: order.customerEmail,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: orderConfirmationEmail({
      reference: order.orderNumber,
      total: Number(order.total),
      items: orderItemsToInsert.map((i) => ({ name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) })),
      customerName: order.customerName,
      deliveryAddress: order.shippingAddress as any,
    }),
  });
  res.status(201).json(order);
});

// Admin: update status
ordersRouter.patch('/:id/status', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [before] = await db.select().from(orders).where(eq(orders.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  
  // Generate OTP if moving to processing and no OTP exists
  let otp = null;
  if (parsed.data.status === 'processing') {
    const existingOtp = Array.isArray(before.tracking) ? before.tracking.find((t: any) => t.otp) : null;
    if (!existingOtp?.otp) {
      otp = String(Math.floor(1000 + Math.random() * 9000));
    }
  }
  
  const newTracking = [...(before.tracking || []), { 
    status: parsed.data.status, 
    timestamp: new Date().toISOString(), 
    note: parsed.data.note,
    ...(otp ? { otp } : {})
  }];
  const [after] = await db.update(orders).set({ status: parsed.data.status, tracking: newTracking, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  
  // Send status update email to the customer
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
  const otpFromTracking = Array.isArray(after.tracking) ? after.tracking.find((t: any) => t.otp)?.otp : null;
  
  await sendEmailSafe({
    to: after.customerEmail,
    subject: `Order ${after.orderNumber} — ${parsed.data.status}`,
    html: orderStatusEmail({
      reference: after.orderNumber,
      status: parsed.data.status,
      trackingUrl: `${frontendUrl}/account/orders/${after.id}`,
      otp: otpFromTracking,
    }),
  });
  
  // Create in-app notification
  await db.insert(notifications).values({
    category: 'order',
    title: `Order ${parsed.data.status}`,
    body: otpFromTracking 
      ? `Your order ${after.orderNumber} is now ${parsed.data.status}. Your delivery code is ${otpFromTracking}`
      : `Your order ${after.orderNumber} is now ${parsed.data.status}`,
    targetUserId: after.userId,
    scope: 'user',
  });
  
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
  
  // Generate 4-digit OTP for delivery verification
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  
  const newTracking = [...(before.tracking || []), { status: 'in_transit', timestamp: new Date().toISOString(), note: `Assigned to ${rider.name}`, otp }];
  const [after] = await db.update(orders).set({ riderId: rider.id, status: 'in_transit', tracking: newTracking, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  
  // Create delivery record for rider dashboard
  await db.insert(deliveries).values({
    orderId: id,
    riderId: rider.id,
    type: 'delivery',
    status: 'assigned',
    deliveryOtp: otp,
  });
  
  // Send email to customer with delivery OTP
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
  await sendEmailSafe({
    to: before.customerEmail,
    subject: `Rider assigned for Order ${before.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .otp-box { background: #000; color: #fff; padding: 30px; text-align: center; margin: 30px 0; }
          .otp { font-size: 48px; font-weight: bold; letter-spacing: 0.3em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; margin: 0;">Rider On The Way</h1>
          </div>
          
          <p>Hello ${before.customerName},</p>
          
          <p>Great news! Your order <strong>${before.orderNumber}</strong> is now being delivered by ${rider.name}.</p>
          
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Delivery Verification Code</p>
            <div class="otp">${otp}</div>
          </div>
          
          <p><strong>Important:</strong> When the rider arrives, they will ask for this 4-digit code to confirm delivery. Please have it ready.</p>
          
          <p>You can track your order here:<br>
          <a href="${frontendUrl}/account/orders/${id}" style="color: #000; text-decoration: underline;">${frontendUrl}/account/orders/${id}</a></p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999;">
            <p>HAVANAT - Bespoke Tailoring</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
  
  // Create in-app notification with OTP
  await db.insert(notifications).values({
    category: 'order',
    title: `Rider Assigned - Delivery Code: ${otp}`,
    body: `${rider.name} is delivering your order ${before.orderNumber}. Your verification code is ${otp}`,
    targetUserId: before.userId,
    scope: 'user',
  });
  
  await logAction({
    req, user: req.user!, action: 'update', entityType: 'order',
    entityId: id, entityLabel: `Order: ${before.orderNumber}`,
    summary: `Assigned rider: ${rider.name}`, before, after,
  });
  res.json(after);
});
