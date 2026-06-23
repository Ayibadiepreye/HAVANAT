import { Router } from 'express';
import { db } from '../db/client.js';
import { users, riderProfiles, deliveries, payouts } from '../db/schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CreateRiderSchema } from '../lib/validators.js';
import { logAction } from '../audit/logger.js';
import bcrypt from 'bcryptjs';

export const ridersRouter = Router();

// Admin: full roster
ridersRouter.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const rows = await db.select({
    user: users, profile: riderProfiles,
  }).from(users).leftJoin(riderProfiles, eq(riderProfiles.userId, users.id)).where(eq(users.role, 'rider'));
  res.json({ items: rows });
});

// Admin: add rider
ridersRouter.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = CreateRiderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { name, email, phone, address, vehicleType, plateNumber, bank } = parsed.data;
  const passwordHash = await bcrypt.hash('password', 10);
  const [rider] = await db.insert(users).values({
    email: email.toLowerCase(), name, phone, passwordHash, role: 'rider',
  }).returning();
  if (!rider) return res.status(500).json({ error: 'Failed' });
  const [profile] = await db.insert(riderProfiles).values({
    userId: rider.id, vehicleType, plateNumber, address, idVerified: false, status: 'pending',
    bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName,
  }).returning();
  await logAction({ req, user: req.user!, action: 'create', entityType: 'rider', entityId: rider.id, entityLabel: `Rider: ${rider.name}`, summary: 'Added rider', after: { ...rider, profile } });
  res.status(201).json({ user: rider, profile });
});

ridersRouter.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: 'active' | 'pending' | 'suspended' };
  const [before] = await db.select().from(riderProfiles).where(eq(riderProfiles.userId, id));
  if (!before) return res.status(404).json({ error: 'Rider not found' });
  const [after] = await db.update(riderProfiles).set({ status }).where(eq(riderProfiles.userId, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'rider', entityId: id, entityLabel: `Rider status`, summary: `Status: ${before.status} → ${status}`, before, after });
  res.json(after);
});

// Rider: own deliveries
ridersRouter.get('/me/deliveries', requireAuth, requireRole('rider'), async (req, res) => {
  const rows = await db.select().from(deliveries).where(eq(deliveries.riderId, Number(req.user!.sub))).orderBy(desc(deliveries.scheduledFor));
  res.json({ items: rows });
});

// Rider: own payouts
ridersRouter.get('/me/payouts', requireAuth, requireRole('rider'), async (req, res) => {
  const rows = await db.select().from(payouts).where(eq(payouts.riderId, Number(req.user!.sub))).orderBy(desc(payouts.requestedAt));
  res.json({ items: rows });
});

ridersRouter.post('/me/payouts', requireAuth, requireRole('rider'), async (req, res) => {
  const [created] = await db.insert(payouts).values({ riderId: Number(req.user!.sub), amount: req.body.amount, status: 'pending' }).returning();
  res.status(201).json(created);
});

// Rider: update delivery status with OTP
ridersRouter.patch('/deliveries/:id/status', requireAuth, requireRole('rider'), async (req, res) => {
  const id = Number(req.params.id);
  const { status, otp, proofPhotoUrl, proofSignatureUrl } = req.body as {
    status: 'picked_up' | 'in_transit' | 'delivered' | 'failed';
    otp?: string; proofPhotoUrl?: string; proofSignatureUrl?: string;
  };
  const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
  if (!delivery) return res.status(404).json({ error: 'Not found' });
  if (delivery.riderId !== Number(req.user!.sub)) return res.status(403).json({ error: 'Not your delivery' });
  if ((status === 'picked_up' || status === 'delivered') && otp && delivery.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  if (status === 'delivered' && (!proofPhotoUrl || !proofSignatureUrl)) {
    return res.status(400).json({ error: 'Photo and signature required' });
  }
  const [after] = await db.update(deliveries).set({
    status,
    completedAt: status === 'delivered' ? new Date() : delivery.completedAt,
    proofPhotoUrl: proofPhotoUrl ?? delivery.proofPhotoUrl,
    proofSignatureUrl: proofSignatureUrl ?? delivery.proofSignatureUrl,
  }).where(eq(deliveries.id, id)).returning();
  res.json(after);
});
