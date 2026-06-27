// Notification auto-prune.
//
// Notifications are designed to be ephemeral. We prune anything older than
// the configured retention window (default 48 hours) so the table doesn't
// grow unbounded and reads stay fast.
//
// Two entry points:
//   1. startAutoPrune() — called on server boot. Schedules pruneOldNotifications()
//      on an interval (default every 6h) AND runs it once at startup so a fresh
//      server doesn't ship stale data to clients.
//   2. pruneOldNotifications() — exposed via the admin endpoint so the team
//      can manually trigger and inspect counts.
//
// The query uses the `notifications_created_at_idx` index (created in the
// initial schema migration) for an index range scan.

import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { notifications } from '../db/schema.js';
import { lt } from 'drizzle-orm';

export const DEFAULT_RETENTION_HOURS = 48;
export const DEFAULT_PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface PruneResult {
  deleted: number;
  retentionHours: number;
  cutoffIso: string;
  beforeCount: number;
  afterCount: number;
  durationMs: number;
}

export async function pruneOldNotifications(
  retentionHours: number = DEFAULT_RETENTION_HOURS
): Promise<PruneResult> {
  const start = Date.now();
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
  const beforeCount = await countNotifications();
  // Drizzle ORM doesn't have a great upsert/deleteBy builder for jsonb
  // features, so we use a parameterized SQL delete.
  const result = await db.execute(sql`
    DELETE FROM notifications
    WHERE created_at < ${cutoff.toISOString()}::timestamptz
  `);
  const deleted = Number((result as any)?.rowCount ?? (result as any)?.count ?? 0);
  const afterCount = await countNotifications();
  return {
    deleted,
    retentionHours,
    cutoffIso: cutoff.toISOString(),
    beforeCount,
    afterCount,
    durationMs: Date.now() - start,
  };
}

export async function countNotifications(): Promise<number> {
  const rows = await db.execute(sql`SELECT COUNT(*)::int AS count FROM notifications`);
  return Number((rows.rows?.[0] as any)?.count ?? 0);
}

/** Returns the age (ms) of the oldest notification, or null if the table is empty. */
export async function oldestNotificationAge(): Promise<{ id: number; createdAt: string; ageHours: number } | null> {
  const rows = await db.execute(sql`
    SELECT id, created_at, EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS age_hours
    FROM notifications
    ORDER BY created_at ASC
    LIMIT 1
  `);
  const r = (rows.rows?.[0] as any);
  if (!r) return null;
  return {
    id: Number(r.id),
    createdAt: String(r.created_at),
    ageHours: Number(r.age_hours ?? 0),
  };
}

let pruneInterval: NodeJS.Timeout | null = null;

/** Boot-time setup. Idempotent — calling twice is a no-op. */
export function startAutoPrune(opts?: { retentionHours?: number; intervalMs?: number }): void {
  if (pruneInterval) return;
  const retentionHours = opts?.retentionHours ?? DEFAULT_RETENTION_HOURS;
  const intervalMs = opts?.intervalMs ?? DEFAULT_PRUNE_INTERVAL_MS;
  // Run once at startup so a fresh deploy doesn't leak stale rows.
  pruneOldNotifications(retentionHours)
    .then((r) => console.log(`[prune] startup: deleted ${r.deleted} notifications older than ${r.retentionHours}h (now ${r.afterCount} rows)`))
    .catch((err) => console.error('[prune] startup failed', err));
  pruneInterval = setInterval(() => {
    pruneOldNotifications(retentionHours)
      .then((r) => {
        if (r.deleted > 0) {
          console.log(`[prune] interval: deleted ${r.deleted} notifications (now ${r.afterCount} rows)`);
        }
      })
      .catch((err) => console.error('[prune] interval failed', err));
  }, intervalMs);
  // Don't keep the process alive solely for this timer.
  if (typeof pruneInterval.unref === 'function') pruneInterval.unref();
}

export function stopAutoPrune(): void {
  if (pruneInterval) {
    clearInterval(pruneInterval);
    pruneInterval = null;
  }
}