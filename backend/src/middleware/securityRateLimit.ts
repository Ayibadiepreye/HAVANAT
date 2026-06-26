// ─── Per-user / per-email security rate limiter ───────────────────
//
// Persists failed attempts to the security_lockouts table so the limit
// survives server restarts and works across multiple backend replicas.
//
// Usage from a route:
//   const lockout = await consumeAttempt({
//     userId: req.user?.sub,
//     email: req.body?.email,
//     reason: 'otp_login',
//     maxAttempts: 5,
//     windowMs: 15 * 60 * 1000,  // optional
//     lockoutMs: 60 * 60 * 1000, // optional, default 1 hour
//   });
//   if (lockout.blocked) {
//     return res.status(429).json({
//       ok: false,
//       error: `Too many failed attempts. ${lockout.contactSupport ? 'Please contact support to unlock.' : `Try again in ${formatMinutes(lockout.retryAfterMs)}.`}`,
//       retryAfterMs: lockout.retryAfterMs,
//       contactSupport: lockout.contactSupport,
//       supportEmail: getSupportEmail(),
//     });
//   }
//
// On success, call `recordSuccess(...)` to clear the counter.

import { and, eq, SQL, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { securityLockouts } from '../db/schema.js';

export interface RateLimitOpts {
  userId?: number | null;
  email?: string | null;
  reason: string;
  /** Max failed attempts within the window before lockout. Default 5. */
  maxAttempts?: number;
  /** Sliding window for counting attempts. Default 15 minutes. */
  windowMs?: number;
  /** After lockout: how long until auto-unlock. Default 1 hour. NULL = permanent. */
  lockoutMs?: number | null;
}

export interface RateLimitResult {
  /** True if the request is allowed to proceed. */
  allowed: boolean;
  /** True if blocked (either currently locked, or just hit the limit). */
  blocked: boolean;
  /** Attempts used so far in the current window. */
  attempts: number;
  /** If currently locked, ms until unlock. Null if locked-until is permanent. */
  retryAfterMs: number | null;
  /** True if locked-until is permanent — user must contact support. */
  contactSupport: boolean;
  /** Human-readable support contact email. */
  supportEmail: string;
}

const SUPPORT_EMAIL = process.env.EMAIL_REPLY_TO ?? process.env.SUPPORT_EMAIL ?? 'concierge@havanat.store';

export function getSupportEmail(): string {
  return SUPPORT_EMAIL;
}

/**
 * Get the currently-active lockout row for this user/email/reason.
 * Returns null if no lockout (or lockout has expired).
 */
export async function getActiveLockout(opts: { userId?: number | null; email?: string | null; reason: string }): Promise<{
  attempts: number;
  lockedUntil: Date | null;
  lockedAt: Date | null;
  isActive: boolean;
} | null> {
  const { userId, email, reason } = opts;
  if (!userId && !email) return null;
  // Build the where clause with the right field based on what we have
  const baseConds = [eq(securityLockouts.reason, reason), eq(securityLockouts.isActive, true)] as const;
  const idCond = userId ? eq(securityLockouts.userId, userId) : eq(securityLockouts.email, email!.toLowerCase());
  const rows = await db.select().from(securityLockouts).where(and(...baseConds, idCond))
    .orderBy(desc(securityLockouts.createdAt)).limit(1);
  const row = rows[0];
  if (!row) return null;
  // If lockedUntil is in the past, the lock has expired
  if (row.lockedUntil && row.lockedUntil < new Date()) {
    // Auto-clear the expired lock
    await db.update(securityLockouts).set({ isActive: false, updatedAt: new Date() }).where(eq(securityLockouts.id, row.id));
    return null;
  }
  return {
    attempts: row.attempts,
    lockedUntil: row.lockedUntil,
    lockedAt: row.lockedAt,
    isActive: row.isActive,
  };
}

/**
 * Record a failed attempt. Returns whether the request should be blocked.
 */
export async function recordFailure(opts: RateLimitOpts): Promise<RateLimitResult> {
  const max = opts.maxAttempts ?? 5;
  const lockoutMs = opts.lockoutMs ?? 60 * 60 * 1000; // 1 hour default
  const reason = opts.reason;

  // Check existing lockout first
  const existing = await getActiveLockout(opts);
  if (existing && existing.lockedUntil && existing.lockedUntil > new Date()) {
    return {
      allowed: false,
      blocked: true,
      attempts: existing.attempts,
      retryAfterMs: existing.lockedUntil.getTime() - Date.now(),
      contactSupport: false,
      supportEmail: SUPPORT_EMAIL,
    };
  }
  if (existing && existing.lockedAt && !existing.lockedUntil) {
    // Permanent lock — must contact support
    return {
      allowed: false,
      blocked: true,
      attempts: existing.attempts,
      retryAfterMs: null,
      contactSupport: true,
      supportEmail: SUPPORT_EMAIL,
    };
  }

  // Find or create the active counter row for this user/email/reason
  let row = await findOrCreateCounter(opts);
  const newAttempts = row.attempts + 1;
  const now = new Date();

  // If this attempt hits the limit, impose the lockout
  if (newAttempts >= max) {
    await db.update(securityLockouts).set({
      attempts: newAttempts,
      lockedAt: now,
      lockedUntil: lockoutMs === null ? null : new Date(now.getTime() + lockoutMs),
      updatedAt: now,
    }).where(eq(securityLockouts.id, row.id));

    return {
      allowed: false,
      blocked: true,
      attempts: newAttempts,
      retryAfterMs: lockoutMs,
      contactSupport: lockoutMs === null,
      supportEmail: SUPPORT_EMAIL,
    };
  }

  // Under the limit — increment and allow
  await db.update(securityLockouts).set({
    attempts: newAttempts,
    updatedAt: now,
  }).where(eq(securityLockouts.id, row.id));

  return {
    allowed: true,
    blocked: false,
    attempts: newAttempts,
    retryAfterMs: null,
    contactSupport: false,
    supportEmail: SUPPORT_EMAIL,
  };
}

/**
 * Record a successful action. Clears the failure counter (and any lock).
 */
export async function recordSuccess(opts: { userId?: number | null; email?: string | null; reason: string }): Promise<void> {
  if (!opts.userId && !opts.email) return;
  const baseConds = [eq(securityLockouts.reason, opts.reason), eq(securityLockouts.isActive, true)] as const;
  const idCond = opts.userId ? eq(securityLockouts.userId, opts.userId) : eq(securityLockouts.email, opts.email!.toLowerCase());
  await db.update(securityLockouts).set({
    isActive: false,
    updatedAt: new Date(),
  }).where(and(...baseConds, idCond));
}

/**
 * Manually lift a lockout. Used by admin/support tooling.
 */
export async function liftLockout(opts: { userId?: number | null; email?: string | null; reason?: string }): Promise<void> {
  if (!opts.userId && !opts.email && !opts.reason) return;
  const conds: any[] = [eq(securityLockouts.isActive, true)];
  if (opts.reason) conds.push(eq(securityLockouts.reason, opts.reason));
  if (opts.userId) conds.push(eq(securityLockouts.userId, opts.userId));
  else if (opts.email) conds.push(eq(securityLockouts.email, opts.email.toLowerCase()));
  await db.update(securityLockouts).set({
    isActive: false,
    updatedAt: new Date(),
  }).where(and(...conds));
}

// ─── Internal: find or create the counter row ────────────────────
async function findOrCreateCounter(opts: RateLimitOpts): Promise<{ id: number; attempts: number }> {
  if (!opts.userId && !opts.email) throw new Error('securityRateLimit: must provide userId or email');
  const conds: any[] = [eq(securityLockouts.reason, opts.reason), eq(securityLockouts.isActive, true)];
  if (opts.userId) conds.push(eq(securityLockouts.userId, opts.userId));
  else conds.push(eq(securityLockouts.email, (opts.email as string).toLowerCase()));
  const rows = await db.select().from(securityLockouts).where(and(...conds)).limit(1);
  if (rows[0]) return { id: rows[0].id, attempts: rows[0].attempts };
  // Create new counter
  const insertValues: any = { reason: opts.reason, attempts: 0, isActive: true };
  if (opts.userId) insertValues.userId = opts.userId;
  if (opts.email) insertValues.email = opts.email.toLowerCase();
  const inserted = await db.insert(securityLockouts).values(insertValues).returning();
  return { id: inserted[0].id, attempts: 0 };
}

// ─── Helper: format a 429 response body ───────────────────────────
export function lockoutResponse(result: RateLimitResult, supportUrl?: string) {
  if (result.contactSupport) {
    return {
      ok: false,
      error: `Your account is locked due to too many failed attempts. Please contact support at ${result.supportEmail} to unlock it.`,
      contactSupport: true,
      supportEmail: result.supportEmail,
      supportUrl: supportUrl ?? `mailto:${result.supportEmail}`,
    };
  }
  const minutes = Math.ceil((result.retryAfterMs ?? 0) / 60_000);
  return {
    ok: false,
    error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}. If you keep having issues, contact support at ${result.supportEmail}.`,
    retryAfterMs: result.retryAfterMs,
    retryAfterMinutes: minutes,
    contactSupport: false,
    supportEmail: result.supportEmail,
    supportUrl: `mailto:${result.supportEmail}`,
  };
}
