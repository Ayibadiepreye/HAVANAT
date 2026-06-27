// Admin dashboard endpoints — all real DB aggregations, zero mock data.
//   GET /api/admin/sales         - last N days of revenue + order count
//   GET /api/admin/overview      - top-line numbers for the dashboard cards
//   GET /api/admin/top-products  - best sellers from real order_items

import { Router } from 'express';
import { db } from '../db/client.js';
import { orders, orderItems, riderProfiles, products } from '../db/schema.js';
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