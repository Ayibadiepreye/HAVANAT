import { Router } from 'express';
import { db } from '../db/client.js';
import { users, riderProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAction } from '../audit/logger.js';
import bcrypt from 'bcryptjs';

export const staffRouter = Router();

staffRouter.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
  const rows = await db.select().from(users);
  res.json({ items: rows.filter((u) => u.role !== 'customer') });
});

staffRouter.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, email, phone, role } = req.body as { name: string; email: string; phone?: string; role: 'admin' | 'moderator' | 'rider' };
  if (!['admin', 'moderator', 'rider'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const passwordHash = await bcrypt.hash('password', 10);
  const [user] = await db.insert(users).values({ name, email: email.toLowerCase(), phone, passwordHash, role }).returning();
  if (!user) return res.status(500).json({ error: 'Failed' });
  if (role === 'rider') {
    await db.insert(riderProfiles).values({ userId: user.id, vehicleType: 'bike', plateNumber: 'PENDING', status: 'pending' });
  }
  await logAction({ req, user: req.user!, action: 'create', entityType: 'staff', entityId: String(user.id), entityLabel: `Staff: ${user.name}`, summary: `Created ${role} account`, after: { name: user.name, role: user.role, email: user.email } });
  res.status(201).json(user);
});

staffRouter.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body as { role: 'admin' | 'moderator' | 'rider' };
  const [before] = await db.select().from(users).where(eq(users.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  if (before.role === 'customer') return res.status(400).json({ error: 'Cannot change customer role here' });
  const [after] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  await logAction({ req, user: req.user!, action: 'update', entityType: 'staff', entityId: String(id), entityLabel: `Staff: ${before.name}`, summary: `Role: ${before.role} → ${role}`, before: { role: before.role }, after: { role } });
  res.json(after);
});

staffRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (id === Number(req.user!.sub)) return res.status(400).json({ error: 'Cannot remove yourself' });
  const [before] = await db.select().from(users).where(eq(users.id, id));
  if (!before) return res.status(404).json({ error: 'Not found' });
  if (before.role === 'admin') {
    const allAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
    if (allAdmins.length <= 1) return res.status(400).json({ error: 'At least one admin must remain' });
  }
  await db.delete(users).where(eq(users.id, id));
  await logAction({ req, user: req.user!, action: 'delete', entityType: 'staff', entityId: String(id), entityLabel: `Staff: ${before.name}`, summary: `Removed ${before.role} account`, before: { name: before.name, role: before.role } });
  res.json({ ok: true });
});
