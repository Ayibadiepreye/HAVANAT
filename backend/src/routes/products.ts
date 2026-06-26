import { Router } from 'express';
import { db } from '../db/client.js';
import { products } from '../db/schema.js';
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CreateProductSchema, UpdateProductSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';

export const productsRouter = Router();

// Public list with filters
productsRouter.get('/', async (req, res) => {
  const { category, fit, size, color, q, inStock, sort = 'newest', limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filters = [] as any[];
  if (category) filters.push(eq(products.category, category));
  if (fit) filters.push(eq(products.fit, fit));
  if (inStock === 'true') filters.push(eq(products.inStock, true));
  if (q) filters.push(ilike(products.name, `%${q}%`));
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
  res.json(product);
});

productsRouter.get('/id/:id', async (req, res) => {
  const [product] = await db.select().from(products).where(eq(products.id, Number(req.params.id)));
  if (!product) return res.status(404).json({ error: 'Product not found' });
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
