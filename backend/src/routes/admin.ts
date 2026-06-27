// Admin dashboard endpoints — all real DB aggregations, zero mock data.
//   GET /api/admin/sales         - last N days of revenue + order count
//   GET /api/admin/overview      - top-line numbers for the dashboard cards
//   GET /api/admin/top-products  - best sellers from real order_items

import { Router } from 'express';
import { db } from '../db/client.js';
import { orders, orderItems, riderProfiles, products, users, members, returns, memberships, addresses } from '../db/schema.js';
import { sql, eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// GET /api/admin/sales?days=14
adminRouter.get('/sales', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days ?? 14), 1), 90);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await db.execute<{ day: string; revenue: string; orders: string }>(sql`
    SELECT
      to_char(date_trunc('day', "created_at") AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COALESCE(SUM(total), 0)::text AS revenue,
      COUNT(*)::text AS orders
    FROM orders
    WHERE "created_at" >= ${since.toISOString()}::timestamptz
      AND status <> 'cancelled'
    GROUP BY 1
    ORDER BY 1
  `);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const r of rows.rows as any[]) {
    byDay.set(r.day, { revenue: Number(r.revenue) || 0, orders: Number(r.orders) || 0 });
  }
  const data: Array<{ date: string; revenue: number; orders: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = byDay.get(key);
    data.push({
      date: key,
      revenue: found?.revenue ?? 0,
      orders: found?.orders ?? 0,
    });
  }
  res.json({ data });
});

// GET /api/admin/overview
adminRouter.get('/overview', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const revenueAll = await db.execute<{ total: string }>(sql`
      SELECT COALESCE(SUM(total), 0)::text AS total FROM orders WHERE status <> 'cancelled'
    `);
    const startOfToday = new Date(); startOfToday.setUTCHours(0, 0, 0, 0);
    const revenueToday = await db.execute<{ total: string }>(sql`
      SELECT COALESCE(SUM(total), 0)::text AS total FROM orders
      WHERE status <> 'cancelled' AND "created_at" >= ${startOfToday.toISOString()}::timestamptz
    `);
    const orderCount = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM orders
    `);
    // Members: users with tier in (deluxe, elite)
    const memberCount = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM users WHERE tier IN ('deluxe', 'elite')
    `);
    const customerCount = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM users WHERE role = 'customer'
    `);
    // Riders live in riderProfiles table (one row per rider user)
    const riderCount = await db.execute<{ count: string; active: string }>(sql`
      SELECT
        COUNT(*)::text AS count,
        COUNT(*) FILTER (WHERE status = 'active')::text AS active
      FROM rider_profiles
    `);
    const pendingOrders = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM orders WHERE status IN ('received', 'processing')
    `);
    const inTransit = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM orders WHERE status = 'in_transit'
    `);
    const lowStock = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM products WHERE stock <= 5 AND in_stock = true
    `);

    res.json({
      revenueAllTime: Number((revenueAll.rows as any[])[0]?.total ?? 0),
      revenueToday: Number((revenueToday.rows as any[])[0]?.total ?? 0),
      orderCount: Number((orderCount.rows as any[])[0]?.count ?? 0),
      pendingOrders: Number((pendingOrders.rows as any[])[0]?.count ?? 0),
      inTransit: Number((inTransit.rows as any[])[0]?.count ?? 0),
      activeMembers: Number((memberCount.rows as any[])[0]?.count ?? 0),
      customerCount: Number((customerCount.rows as any[])[0]?.count ?? 0),
      riderCount: Number((riderCount.rows as any[])[0]?.count ?? 0),
      activeRiders: Number((riderCount.rows as any[])[0]?.active ?? 0),
      lowStock: Number((lowStock.rows as any[])[0]?.count ?? 0),
    });
  } catch (err: any) {
    console.error('[admin/overview]', err);
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

// GET /api/admin/top-products
adminRouter.get('/top-products', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 5), 20);
  const rows = await db.execute<{ product_id: string; units: string; revenue: string; name: string; image: string }>(sql`
    SELECT
      oi.product_id,
      SUM(oi.quantity)::text AS units,
      SUM(oi.total_price)::text AS revenue,
      oi.product_name AS name,
      MAX(oi.product_image) AS image
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY SUM(oi.quantity) DESC
    LIMIT ${limit}
  `);
  const items = (rows.rows as any[]).map((r) => ({
    productId: Number(r.product_id),
    name: r.name,
    image: r.image,
    units: Number(r.units) || 0,
    revenue: Number(r.revenue) || 0,
  }));
  res.json({ items });
});

// GET /api/admin/members
// Returns every user with tier info + joined subscription row from the
// memberships table. Joins users -> memberships (one-to-one) so the admin
// sees the live subscription state (cycle, status, period end, etc.).
adminRouter.get('/members', requireAuth, requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    // Get every customer user with their tier.
    const customerRows = await db.execute<{
      id: number; name: string; email: string; phone: string | null;
      tier: 'standard' | 'deluxe' | 'elite';
      created_at: string;
    }>(sql`
      SELECT id, name, email, phone, tier, created_at
      FROM users
      WHERE role = 'customer'
      ORDER BY created_at DESC
    `);
    const membershipRows = await db.select().from(memberships);
    const membershipByUser = new Map<number, typeof membershipRows[number]>();
    for (const m of membershipRows) membershipByUser.set(m.userId, m);
    // Compute total spent per customer from paid orders.
    const spentRows = await db.execute<{ user_id: number; total: string }>(sql`
      SELECT user_id, COALESCE(SUM(total), 0)::text AS total
      FROM orders WHERE status <> 'cancelled' GROUP BY user_id
    `);
    const spentByUser = new Map<number, number>();
    for (const r of spentRows.rows as any[]) spentByUser.set(Number(r.user_id), Number(r.total) || 0);
    const items = (customerRows.rows as any[]).map((u) => {
      const sub = membershipByUser.get(Number(u.id));
      const totalSpent = spentByUser.get(Number(u.id)) ?? 0;
      return {
        id: String(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone ?? '',
        tier: u.tier,
        status: sub ? (sub.status === 'cancelled' ? 'cancelled' : 'active') : 'active',
        billingCycle: sub?.cycle ?? null,
        nextBillingDate: sub?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
        scheduledDowngradeTo: sub?.scheduledDowngradeTo ?? null,
        totalSpent,
        joinedAt: u.created_at,
      };
    });
    res.json({ items });
  } catch (err: any) {
    console.error('[admin/members]', err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// GET /api/admin/customers — same as members but explicitly customer-role users.
adminRouter.get('/customers', requireAuth, requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const rows = await db.execute<{
      id: number; name: string; email: string; phone: string | null;
      tier: 'standard' | 'deluxe' | 'elite';
      email_verified: boolean;
      created_at: string;
    }>(sql`
      SELECT id, name, email, phone, tier, email_verified, created_at
      FROM users WHERE role = 'customer' ORDER BY created_at DESC
    `);
    const spentRows = await db.execute<{ user_id: number; total: string; count: string }>(sql`
      SELECT user_id,
             COALESCE(SUM(total), 0)::text AS total,
             COUNT(*)::text AS count
      FROM orders WHERE status <> 'cancelled' GROUP BY user_id
    `);
    const statsByUser = new Map<number, { total: number; orders: number }>();
    for (const r of spentRows.rows as any[]) {
      statsByUser.set(Number(r.user_id), { total: Number(r.total) || 0, orders: Number(r.count) || 0 });
    }
    const items = (rows.rows as any[]).map((u) => {
      const s = statsByUser.get(Number(u.id)) ?? { total: 0, orders: 0 };
      return {
        id: String(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone ?? '',
        tier: u.tier,
        emailVerified: u.email_verified,
        totalSpent: s.total,
        orderCount: s.orders,
        joinedAt: u.created_at,
      };
    });
    res.json({ items });
  } catch (err: any) {
    console.error('[admin/customers]', err);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// GET /api/admin/riders — every rider user joined with their rider profile.
adminRouter.get('/riders', requireAuth, requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const rows = await db.execute<{
      id: number; name: string; email: string; phone: string | null;
      vehicle_type: string; plate_number: string; status: 'pending' | 'active' | 'suspended' | 'inactive';
      id_verified: boolean; address: string | null;
      bank_name: string | null; account_number: string | null; account_name: string | null;
      created_at: string;
    }>(sql`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             rp.vehicle_type, rp.plate_number, rp.status, rp.id_verified, rp.address,
             rp.bank_name, rp.account_number, rp.account_name
      FROM users u
      LEFT JOIN rider_profiles rp ON rp.user_id = u.id
      WHERE u.role = 'rider'
      ORDER BY u.created_at DESC
    `);
    const items = (rows.rows as any[]).map((r) => ({
      id: String(r.id),
      name: r.name,
      email: r.email,
      phone: r.phone ?? '',
      vehicleType: r.vehicle_type ?? 'bike',
      plateNumber: r.plate_number ?? '',
      status: r.status ?? 'pending',
      idVerified: !!r.id_verified,
      address: r.address ?? '',
      bankName: r.bank_name ?? '',
      accountNumber: r.account_number ?? '',
      accountName: r.account_name ?? '',
      joinedAt: r.created_at,
    }));
    res.json({ items });
  } catch (err: any) {
    console.error('[admin/riders]', err);
    res.status(500).json({ error: 'Failed to load riders' });
  }
});

// GET /api/admin/returns — every return request with order + customer info.
adminRouter.get('/returns', requireAuth, requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const rows = await db.execute<{
      id: number; return_number: string; order_id: number; user_id: number;
      reason: string; status: string; amount: string; created_at: string;
      order_number: string; customer_name: string; customer_email: string; total: string;
    }>(sql`
      SELECT r.id, r.return_number, r.order_id, r.user_id, r.reason, r.status::text, r.refund_amount::text, r.created_at,
             o.order_number, o.customer_name, o.customer_email, o.total::text
      FROM returns r
      JOIN orders o ON o.id = r.order_id
      ORDER BY r.created_at DESC
    `);
    const items = (rows.rows as any[]).map((r) => ({
      id: String(r.id),
      returnNumber: r.return_number,
      orderId: String(r.order_id),
      orderNumber: r.order_number,
      userId: String(r.user_id),
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      reason: r.reason,
      status: r.status,
      refundAmount: Number(r.refund_amount) || 0,
      orderTotal: Number(r.total) || 0,
      createdAt: r.created_at,
    }));
    res.json({ items });
  } catch (err: any) {
    console.error('[admin/returns]', err);
    res.status(500).json({ error: 'Failed to load returns' });
  }
});

// GET /api/admin/orders — every order, admin view. Mirrors /api/orders GET but
// lives under /api/admin/* for symmetry with the rest of the admin endpoints
// and to make the admin-only role check explicit.
adminRouter.get('/orders', requireAuth, requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const rows = await db.execute<{
      id: number; order_number: string; user_id: number; status: string;
      subtotal: string; shipping_fee: string; total: string;
      customer_name: string; customer_email: string; customer_phone: string | null;
      shipping_address: any;
      payment_method: string; payment_reference: string | null;
      rider_id: number | null; created_at: string; updated_at: string;
    }>(sql`
      SELECT id, order_number, user_id, status::text, subtotal::text, shipping_fee::text, total::text,
             customer_name, customer_email, customer_phone, shipping_address,
             payment_method, payment_reference, rider_id, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 200
    `);
    const items = (rows.rows as any[]).map((o) => ({
      id: String(o.id),
      orderNumber: o.order_number,
      userId: String(o.user_id),
      status: o.status,
      subtotal: Number(o.subtotal) || 0,
      shippingFee: Number(o.shipping_fee) || 0,
      total: Number(o.total) || 0,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone ?? '',
      shippingAddress: o.shipping_address,
      paymentMethod: o.payment_method,
      paymentReference: o.payment_reference,
      riderId: o.rider_id != null ? String(o.rider_id) : null,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));
    res.json({ items });
  } catch (err: any) {
    console.error('[admin/orders]', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});
