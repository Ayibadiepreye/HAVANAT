import { Router } from 'express';
import { db } from '../db/client.js';
import { homepage, lookbook, testimonials, banners, branding, deliveryZones, paymentGateways, emailTemplates, memberships, members } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CreateDeliveryZoneSchema, UpdateHomepageSchema, UpdateMembershipTierSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';

export const contentRouter = Router();

// Homepage
contentRouter.get('/homepage', async (_req, res) => {
  const [row] = await db.select().from(homepage).limit(1);
  res.json(row ?? null);
});
contentRouter.put('/homepage', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const parsed = UpdateHomepageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [existing] = await db.select().from(homepage).limit(1);
  const [after] = existing
    ? await db.update(homepage).set({ ...parsed.data, updatedAt: new Date() }).where(eq(homepage.id, existing.id)).returning()
    : await db.insert(homepage).values(parsed.data).returning();
  await logAction({ req, user: req.user!, action: existing ? 'update' : 'create', entityType: 'homepage', entityId: after!.id, entityLabel: 'Homepage', summary: 'Updated homepage', before: existing ?? null, after });
  res.json(after);
});

// Lookbook
contentRouter.get('/lookbook', async (_req, res) => {
  const rows = await db.select().from(lookbook).orderBy(lookbook.order);
  res.json({ items: rows });
});
contentRouter.post('/lookbook', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const [created] = await db.insert(lookbook).values(req.body).returning();
  await logAction({ req, user: req.user!, action: 'create', entityType: 'lookbook', entityId: created!.id, entityLabel: 'Lookbook image', summary: 'Added lookbook image', after: created });
  res.status(201).json(created);
});
contentRouter.patch('/lookbook/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(lookbook).where(eq(lookbook.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(lookbook).set(req.body).where(eq(lookbook.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'lookbook', entityId: id, entityLabel: 'Lookbook image', summary: 'Updated lookbook image', before, after });
  res.json(after);
});
contentRouter.delete('/lookbook/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(lookbook).where(eq(lookbook.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  await db.delete(lookbook).where(eq(lookbook.id, id));
  await logAction({ req, user: req.user!, action: 'delete', entityType: 'lookbook', entityId: id, entityLabel: 'Lookbook image', summary: 'Deleted lookbook image', before });
  res.json({ ok: true });
});

// Testimonials
contentRouter.get('/testimonials', async (_req, res) => {
  const rows = await db.select().from(testimonials);
  res.json({ items: rows });
});
contentRouter.post('/testimonials', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const [created] = await db.insert(testimonials).values(req.body).returning();
  await logAction({ req, user: req.user!, action: 'create', entityType: 'testimonial', entityId: created!.id, entityLabel: `Testimonial: ${created!.name}`, summary: 'Added testimonial', after: created });
  res.status(201).json(created);
});
contentRouter.patch('/testimonials/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(testimonials).set(req.body).where(eq(testimonials.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${after!.name}`, summary: 'Updated testimonial', before, after });
  res.json(after);
});
contentRouter.delete('/testimonials/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  await db.delete(testimonials).where(eq(testimonials.id, id));
  await logAction({ req, user: req.user!, action: 'delete', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${before.name}`, summary: 'Deleted testimonial', before });
  res.json({ ok: true });
});

// Banners
contentRouter.get('/banners', async (_req, res) => {
  const rows = await db.select().from(banners);
  res.json({ items: rows });
});
contentRouter.post('/banners', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const [created] = await db.insert(banners).values(req.body).returning();
  await logAction({ req, user: req.user!, action: 'create', entityType: 'banner', entityId: created!.id, entityLabel: `Banner: ${created!.title ?? ''}`, summary: 'Added banner', after: created });
  res.status(201).json(created);
});
contentRouter.patch('/banners/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(banners).where(eq(banners.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(banners).set(req.body).where(eq(banners.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'banner', entityId: id, entityLabel: `Banner: ${after!.title ?? ''}`, summary: 'Updated banner', before, after });
  res.json(after);
});
contentRouter.delete('/banners/:id', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(banners).where(eq(banners.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  await db.delete(banners).where(eq(banners.id, id));
  await logAction({ req, user: req.user!, action: 'delete', entityType: 'banner', entityId: id, entityLabel: `Banner`, summary: 'Deleted banner', before });
  res.json({ ok: true });
});

// Branding
contentRouter.get('/branding', async (_req, res) => {
  const [row] = await db.select().from(branding).limit(1);
  res.json(row ?? null);
});
contentRouter.put('/branding', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const [existing] = await db.select().from(branding).limit(1);
  const [after] = existing
    ? await db.update(branding).set({ ...req.body, updatedAt: new Date() }).where(eq(branding.id, existing.id)).returning()
    : await db.insert(branding).values(req.body).returning();
  await logAction({ req, user: req.user!, action: existing ? 'update' : 'create', entityType: 'branding', entityId: after!.id, entityLabel: 'Branding', summary: 'Updated branding', before: existing ?? null, after });
  res.json(after);
});

// Delivery zones
contentRouter.get('/delivery-zones', async (_req, res) => {
  const rows = await db.select().from(deliveryZones);
  res.json({ items: rows });
});
contentRouter.post('/delivery-zones', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = CreateDeliveryZoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const [created] = await db.insert(deliveryZones).values(parsed.data).returning();
  await logAction({ req, user: req.user!, action: 'create', entityType: 'delivery_zone', entityId: created!.id, entityLabel: `Zone: ${created!.state}`, summary: 'Added delivery zone', after: created });
  res.status(201).json(created);
});
contentRouter.patch('/delivery-zones/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(deliveryZones).set(req.body).where(eq(deliveryZones.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'delivery_zone', entityId: id, entityLabel: `Zone: ${after!.state}`, summary: 'Updated zone', before, after });
  res.json(after);
});
contentRouter.delete('/delivery-zones/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  await logAction({ req, user: req.user!, action: 'delete', entityType: 'delivery_zone', entityId: id, entityLabel: `Zone: ${before.state}`, summary: 'Removed zone', before });
  res.json({ ok: true });
});

// Memberships (tiers)
contentRouter.get('/memberships', async (_req, res) => {
  const rows = await db.select().from(memberships);
  res.json({ items: rows });
});
contentRouter.put('/memberships/:tier', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const parsed = UpdateMembershipTierSchema.safeParse({ ...req.body, tier: req.params.tier });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const [before] = await db.select().from(memberships).where(eq(memberships.tier, parsed.data.tier));
  if (!before) return res.status(404).json({ error: 'Tier not found' });
  const [after] = await db.update(memberships).set({
    price: String(parsed.data.price), billingCycles: parsed.data.billingCycles, features: parsed.data.features, updatedAt: new Date(),
  }).where(eq(memberships.tier, parsed.data.tier)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'membership', entityId: parsed.data.tier, entityLabel: `Tier: ${parsed.data.tier}`, summary: 'Updated tier', before, after });
  res.json(after);
});

// Payment gateways
contentRouter.get('/payment-gateways', requireAuth, requireRole('admin'), async (_req, res) => {
  const rows = await db.select().from(paymentGateways);
  res.json({ items: rows });
});
contentRouter.patch('/payment-gateways/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const [before] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  const [after] = await db.update(paymentGateways).set(req.body).where(eq(paymentGateways.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'settings', entityId: id, entityLabel: `Gateway: ${before.name}`, summary: 'Toggled gateway', before, after });
  res.json(after);
});

// Email templates
contentRouter.get('/email-templates', requireAuth, requireRole('admin'), async (_req, res) => {
  const rows = await db.select().from(emailTemplates);
  res.json({ items: rows });
});
