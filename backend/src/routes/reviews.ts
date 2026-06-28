import { Router } from 'express';
import { db } from '../db/client.js';
import { reviews, orders, orderItems, users } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';

export const reviewsRouter = Router();

// ─────────────────────────── Customer Endpoints ───────────────────────────

// GET /api/products/:productId/reviews — Public: get all approved reviews for a product
reviewsRouter.get('/products/:productId/reviews', async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: 'Invalid product ID' });

  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt));

  res.json({ reviews: rows });
});

// POST /api/products/:productId/reviews — Customer: submit a review (requires purchase)
reviewsRouter.post('/products/:productId/reviews', requireAuth, async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: 'Invalid product ID' });

  const { rating, reviewText, photos = [] } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
  if (!reviewText?.trim()) return res.status(400).json({ error: 'Review text is required' });

  const userId = (req as any).user.id;

  // 1. Check if user already reviewed this product
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)));

  if (existing) return res.status(400).json({ error: 'You have already reviewed this product' });

  // 2. Verify user purchased this product
  const purchased = await db
    .select({ orderId: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(orderItems.productId, productId)))
    .limit(1);

  if (purchased.length === 0) {
    return res.status(403).json({ error: 'You can only review products you have purchased' });
  }

  // 3. Get user details
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 4. Create review
  const [review] = await db
    .insert(reviews)
    .values({
      productId,
      userId,
      orderId: purchased[0].orderId,
      rating,
      reviewText: reviewText.trim(),
      userTier: user.tier,
      userName: user.name,
      userAvatar: user.avatarUrl,
      photos: photos || [],
      approved: false, // Requires admin approval
    })
    .returning();

  await logAction({
    userId,
    userName: user.name,
    userRole: user.role,
    action: 'create',
    entityType: 'review',
    entityId: String(review.id),
    entityLabel: `Review for product ${productId}`,
    summary: `Submitted review with ${rating} stars`,
    changes: { after: review },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({ review });
});

// ─────────────────────────── Admin/Moderator Endpoints ───────────────────────────

// GET /api/reviews — Admin/Mod: get all reviews with filters
reviewsRouter.get('/', requireRole(['admin', 'moderator']), async (req, res) => {
  const { approved, productId } = req.query as Record<string, string>;

  const filters: any[] = [];
  if (approved === 'true') filters.push(eq(reviews.approved, true));
  if (approved === 'false') filters.push(eq(reviews.approved, false));
  if (productId) filters.push(eq(reviews.productId, Number(productId)));

  const where = filters.length > 0 ? and(...filters) : undefined;
  const rows = await db.select().from(reviews).where(where as any).orderBy(desc(reviews.createdAt));

  res.json({ reviews: rows });
});

// PATCH /api/reviews/:id/approve — Admin/Mod: approve or reject a review
reviewsRouter.patch('/:id/approve', requireRole(['admin', 'moderator']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid review ID' });

  const { approved } = req.body;
  if (typeof approved !== 'boolean') return res.status(400).json({ error: 'approved must be boolean' });

  const [before] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!before) return res.status(404).json({ error: 'Review not found' });

  const userId = (req as any).user.id;
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  const [after] = await db
    .update(reviews)
    .set({
      approved,
      approvedBy: userId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id))
    .returning();

  await logAction({
    userId,
    userName: user?.name,
    userRole: user?.role,
    action: 'update',
    entityType: 'review',
    entityId: String(id),
    entityLabel: `Review ${id}`,
    summary: approved ? 'Approved review' : 'Rejected review',
    changes: { before, after },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ review: after });
});

// PATCH /api/reviews/:id/reply — Admin/Mod: add a reply to a review
reviewsRouter.patch('/:id/reply', requireRole(['admin', 'moderator']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid review ID' });

  const { replyText } = req.body;
  if (!replyText?.trim()) return res.status(400).json({ error: 'Reply text is required' });

  const [before] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!before) return res.status(404).json({ error: 'Review not found' });

  const userId = (req as any).user.id;
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  const [after] = await db
    .update(reviews)
    .set({
      replyText: replyText.trim(),
      replyBy: userId,
      replyByName: user?.name,
      replyByRole: user?.role,
      replyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id))
    .returning();

  await logAction({
    userId,
    userName: user?.name,
    userRole: user?.role,
    action: 'update',
    entityType: 'review',
    entityId: String(id),
    entityLabel: `Review ${id}`,
    summary: 'Added reply to review',
    changes: { before, after },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ review: after });
});

// DELETE /api/reviews/:id — Admin only: delete a review
reviewsRouter.delete('/:id', requireRole(['admin']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid review ID' });

  const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!review) return res.status(404).json({ error: 'Review not found' });

  await db.delete(reviews).where(eq(reviews.id, id));

  const userId = (req as any).user.id;
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  await logAction({
    userId,
    userName: user?.name,
    userRole: user?.role,
    action: 'delete',
    entityType: 'review',
    entityId: String(id),
    entityLabel: `Review ${id}`,
    summary: `Deleted review for product ${review.productId}`,
    changes: { before: review },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ ok: true });
});

// GET /api/reviews/stats/:productId — Public: get review stats for a product
reviewsRouter.get('/stats/:productId', async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: 'Invalid product ID' });

  const stats = await db
    .select({
      totalReviews: sql<number>`count(*)::int`,
      averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
      rating5: sql<number>`count(*) filter (where ${reviews.rating} = 5)::int`,
      rating4: sql<number>`count(*) filter (where ${reviews.rating} = 4)::int`,
      rating3: sql<number>`count(*) filter (where ${reviews.rating} = 3)::int`,
      rating2: sql<number>`count(*) filter (where ${reviews.rating} = 2)::int`,
      rating1: sql<number>`count(*) filter (where ${reviews.rating} = 1)::int`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)));

  res.json(stats[0] || { totalReviews: 0, averageRating: 0, rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0 });
});
