import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { addresses } from '../db/schema.js';
import { and, desc, eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';

export const addressesRouter = Router();

// All addresses routes require a logged-in customer
addressesRouter.use(requireAuth);

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const CreateAddressSchema = z.object({
  label: z.enum(['Home', 'Office', 'Other']).default('Home'),
  fullName: z.string().min(2).max(200),
  phone: z.string().min(7).max(30),
  street: z.string().min(2).max(500),
  city: z.string().min(2).max(120),
  state: z.string().refine((s) => NIGERIAN_STATES.includes(s), { message: 'Invalid Nigerian state' }),
  isDefault: z.boolean().optional().default(false),
});

const UpdateAddressSchema = CreateAddressSchema.partial();

// GET /api/addresses - list all for the current user
addressesRouter.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
    res.json({ ok: true, items: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/addresses - create
addressesRouter.post('/', async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const parsed = CreateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    }
    const input = parsed.data;

    // If this is the user's first address, or isDefault=true, demote all others
    if (input.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    } else {
      // Auto-set default if no addresses exist yet
      const existing = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
      if (existing.length === 0) input.isDefault = true;
    }

    const [row] = await db
      .insert(addresses)
      .values({ ...input, userId })
      .returning();

    await logAction({
      actorId: userId,
      actorRole: 'customer',
      action: 'address.create',
      targetType: 'address',
      targetId: row.id,
      meta: { label: row.label, state: row.state },
    });

    res.status(201).json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/addresses/:id - update
addressesRouter.patch('/:id', async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid address id' });
    }
    const parsed = UpdateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Validation failed', issues: parsed.error.flatten() });
    }
    const input = parsed.data;

    // Ensure ownership
    const [existing] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Address not found' });
    }

    // If becoming default, demote others first
    if (input.isDefault === true) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }

    const [row] = await db
      .update(addresses)
      .set({ ...input, updatedAt: new Date() } as any)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    await logAction({
      actorId: userId,
      actorRole: 'customer',
      action: 'address.update',
      targetType: 'address',
      targetId: row.id,
      meta: { fields: Object.keys(input) },
    });

    res.json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/addresses/:id
addressesRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid address id' });
    }
    const [existing] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Address not found' });
    }
    await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    await logAction({
      actorId: userId,
      actorRole: 'customer',
      action: 'address.delete',
      targetType: 'address',
      targetId: id,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/addresses/:id/default - set as default
addressesRouter.post('/:id/default', async (req, res, next) => {
  try {
    const userId = Number(req.user!.sub);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid address id' });
    }
    const [existing] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Address not found' });
    }
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    const [row] = await db
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    await logAction({
      actorId: userId,
      actorRole: 'customer',
      action: 'address.set_default',
      targetType: 'address',
      targetId: row.id,
    });

    res.json({ ok: true, item: row });
  } catch (err) {
    next(err);
  }
});
