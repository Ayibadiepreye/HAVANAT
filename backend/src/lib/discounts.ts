// Discount helpers — used by order creation, checkout, admin UI.

import { db } from '../db/client.js';
import { eventDiscounts, tierDiscounts } from '../db/schema.js';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

export interface ResolvedDiscount {
  // The largest applicable discount
  percent: number;
  // Which type: 'tier' (Deluxe/Elite auto) | 'event' (admin global)
  type: 'tier' | 'event';
  // Human-readable label for the UI
  label: string;
}

/**
 * Resolve the best discount for a customer at checkout time.
 * Returns null if no discount applies.
 *
 * Order of precedence: event discount wins if active and > tier discount.
 * (You can change this by checking `Math.max`.)
 */
export async function resolveDiscountForCustomer(tier: string | null | undefined): Promise<ResolvedDiscount | null> {
  const now = new Date();

  // 1. Tier discount
  let tierDisc: { percent: string; description: string } | undefined;
  if (tier && (tier === 'Deluxe' || tier === 'Elite')) {
    const [row] = await db.select().from(tierDiscounts).where(eq(tierDiscounts.tier, tier)).limit(1);
    if (row) tierDisc = { percent: row.percent, description: row.description };
  }

  // 2. Active event discount
  const [eventRow] = await db
    .select()
    .from(eventDiscounts)
    .where(and(eq(eventDiscounts.active, true), lte(eventDiscounts.startsAt, now), gte(eventDiscounts.endsAt, now)))
    .orderBy(desc(eventDiscounts.percent))
    .limit(1);

  const tierPct = tierDisc ? Number(tierDisc.percent) : 0;
  const eventPct = eventRow ? Number(eventRow.percent) : 0;

  if (eventPct > tierPct) {
    return { percent: eventPct, type: 'event', label: eventRow!.name };
  }
  if (tierPct > 0 && tierDisc) {
    return { percent: tierPct, type: 'tier', label: tier === 'Elite' ? 'Elite member discount' : 'Deluxe member discount' };
  }
  return null;
}

/**
 * Apply a discount percentage to a subtotal.
 * Returns the discount amount in NGN (not kobo).
 */
export function applyDiscount(subtotalNgn: number, percent: number): number {
  return Math.round(subtotalNgn * (percent / 100) * 100) / 100;
}
