import { Router } from 'express';
import { db } from '../db/client.js';
import { products } from '../db/schema.js';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CreateProductSchema, UpdateProductSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';
import { users, notifications } from '../db/schema.js';
import { inArray } from 'drizzle-orm';
import { sendEmailSafe, sneakPeekEmail } from '../lib/email.js';
import { config } from '../config.js';
import { verifyAccessToken } from '../lib/jwt.js';

export const productsRouter = Router();

// Public list with filters
// Helper: extract caller's tier from JWT (if any). Sneak peeks are visible
// only to deluxe and elite customers; everyone else gets the catalog without
// the sneak peeks hidden from the list and individual fetches returning 403.
function callerTier(req: any): 'standard' | 'deluxe' | 'elite' | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = verifyAccessToken(auth.slice(7)) as { tier?: string };
    if (payload && (payload.tier === 'deluxe' || payload.tier === 'elite')) return payload.tier;
    return 'standard';
  } catch {
    return null;
  }
}

productsRouter.get('/', async (req, res) => {
  const { category, fit, size, color, q, inStock, sort = 'newest', limit = '50', offset = '0', sneakPeek } = req.query as Record<string, string>;
  const tier = callerTier(req);
  const filters = [] as any[];
  if (category) filters.push(eq(products.category, category));
  if (fit) filters.push(eq(products.fit, fit));
  if (inStock === 'true') filters.push(eq(products.inStock, true));
  if (q) filters.push(ilike(products.name, `%${q}%`));
  // Sneak peek visibility:
  //   - ?sneakPeek=true  -> only return sneak peeks (deluxe/elite only)
  //   - default          -> hide sneak peeks from non-eligible callers
  const isDeluxeOrElite = tier === 'deluxe' || tier === 'elite';
  if (sneakPeek === 'true') {
    if (!isDeluxeOrElite) return res.status(403).json({ error: 'Sneak peek is exclusive to Deluxe and Elite members' });
    filters.push(eq(products.isSneakPeek, true));
  } else {
    if (!isDeluxeOrElite) filters.push(eq(products.isSneakPeek, false));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortFn = sort === 'price_asc' ? asc(products.price) : sort === 'price_desc' ? desc(products.price) : desc(products.createdAt);
  const rows = await db.select().from(products).where(where as any).orderBy(sortFn).limit(Number(limit)).offset(Number(offset));
  // size/color filtering is post-query because they're JSON arrays
  const filtered = rows.filter((p) => {
    if (size && !p.sizes.includes(size)) return false;
    if (color && !p.colors.includes(color)) return false;
    return true;
  });
  res.json({ items: filtered, total: filtered.length });
});

productsRouter.get('/:slug', async (req, res) => {
  const [product] = await db.select().from(products).where(eq(products.slug, req.params.slug!));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.isSneakPeek) {
    const tier = callerTier(req);
    if (tier !== 'deluxe' && tier !== 'elite') {
      return res.status(403).json({ error: 'This is a Sneak Peek — exclusive to Deluxe and Elite members.' });
    }
  }
  res.json(product);
});

productsRouter.get('/id/:id', async (req, res) => {
  const [product] = await db.select().from(products).where(eq(products.id, Number(req.params.id)));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.isSneakPeek) {
    const tier = callerTier(req);
    if (tier !== 'deluxe' && tier !== 'elite') {
      return res.status(403).json({ error: 'This is a Sneak Peek — exclusive to Deluxe and Elite members.' });
    }
  }
  res.json(product);
});

// Admin / Moderator: create, update, delete
productsRouter.post('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const parsed = CreateProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const [created] = await db.insert(products).values(parsed.data as any).returning();
  if (!created) return res.status(500).json({ error: 'Failed to create' });
  await logAction({
    req, user: req.user!, action: 'create', entityType: 'product',
    entityId: created.id, entityLabel: `Product: ${created.name}`,
    summary: 'Created product', after: created,
  });
  res.status(201).json(created);
});

productsRouter.patch('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
  const parsed = UpdateProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const [before] = await db.select().from(products).where(eq(products.id, id));
  if (!before) return res.status(404).json({ error: 'Product not found' });
  const [after] = await db.update(products).set({ ...(parsed.data as any), updatedAt: new Date() }).where(eq(products.id, id)).returning();
  if (!after) return res.status(500).json({ error: 'Failed to update' });
  await logAction({
    req, user: req.user!, action: 'update', entityType: 'product',
    entityId: id, entityLabel: `Product: ${after.name}`,
    summary: 'Updated product', before, after,
  });
  res.json(after);
});

productsRouter.delete('/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
  const [before] = await db.select().from(products).where(eq(products.id, id));
  if (!before) return res.status(404).json({ error: 'Product not found' });
  await db.delete(products).where(eq(products.id, id));
  await logAction({
    req, user: req.user!, action: 'delete', entityType: 'product',
    entityId: id, entityLabel: `Product: ${before.name}`,
    summary: 'Deleted product', before,
  });
  res.json({ ok: true });
});

// Admin/Moderator: mark a product as a Sneak Peek. This is a public-flag
// switch — the product stays in /api/products but is filtered out for
// non-deluxe/non-elite callers, and individual fetches return 403.
productsRouter.post('/:id/sneak-peek', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
  const { enabled, releaseNote } = (req.body ?? {}) as { enabled?: boolean; releaseNote?: string };
  const [before] = await db.select().from(products).where(eq(products.id, id));
  if (!before) return res.status(404).json({ error: 'Product not found' });
  const willRelease = enabled === true && !before.isSneakPeek;
  const [after] = await db.update(products)
    .set({
      isSneakPeek: !!enabled,
      sneakPeekReleasedAt: willRelease ? new Date() : before.sneakPeekReleasedAt,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  if (!after) return res.status(500).json({ error: 'Failed to update' });
  await logAction({
    req, user: req.user!,
    action: enabled ? 'create' : 'delete',
    entityType: 'product',
    entityId: String(id),
    entityLabel: `Product: ${after.name}`,
    summary: enabled
      ? `Released as Sneak Peek${releaseNote ? `: ${releaseNote}` : ''}`
      : 'Removed from Sneak Peek',
    before: { isSneakPeek: before.isSneakPeek },
    after: { isSneakPeek: after.isSneakPeek },
  });

  // If we just released (transitioned from false -> true), fan out to all
  // deluxe + elite customers: in-app notification + email.
  if (willRelease) {
    const elite = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.tier as any, ['deluxe', 'elite']));
    const note = releaseNote || `${after.name} just dropped as a Sneak Peek — yours before everyone else.`;
    for (const u of elite) {
      await db.insert(notifications).values({
        title: `Sneak Peek: ${after.name}`,
        body: note,
        category: 'membership',
        channels: 'inapp',
        scope: 'user',
        targetUserId: u.id,
        authorId: Number(req.user!.sub),
        authorName: req.user!.email,
        authorRole: req.user!.role,
        readBy: {},
      }).onConflictDoNothing();
      // Email
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';
      await sendEmailSafe({
        to: u.email,
        subject: `Sneak Peek: ${after.name} is live`,
        html: sneakPeekEmail({
          customerName: u.name,
          productName: after.name,
          productImage: after.images?.[0] ?? null,
          productSlug: after.slug,
          releaseNote: note,
          shopUrl: `${frontendUrl}/sneak-peeks`,
        }),
        tags: [{ name: 'type', value: 'sneak_peek_release' }],
      });
    }
  }
  res.json(after);
});

