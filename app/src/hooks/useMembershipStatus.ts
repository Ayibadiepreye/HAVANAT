// Membership status hook — single source of truth for the UI.
//
// Reads from GET /api/memberships/me which returns:
//   {
//     tier: 'standard' | 'deluxe' | 'elite',           // current users.tier
//     member: { tier, joinedAt, notes } | null,        // legacy members table
//     membership: {                                       // rich memberships table
//       id, tier, cycle, status,
//       currentPeriodStart, currentPeriodEnd,
//       cancelAtPeriodEnd, scheduledDowngradeTo,
//     } | null,
//     currentPeriodEnd: string | null,
//     cancelAtPeriodEnd: boolean,
//     scheduledDowngradeTo: 'Standard'|'Deluxe'|'Elite'|null,
//   }
//
// Surfaces everything the UI needs as derived values:
//   effectiveTier     — what tier the user ACTUALLY has right now
//                       (respects cancelAtPeriodEnd + scheduledDowngradeTo)
//   daysRemaining     — days until currentPeriodEnd
//   status            — 'active' | 'expiring' | 'grace' | 'ended' | 'none'
//   cancelAtPeriodEnd — true if auto-renew is off
//   scheduledTo       — the tier they will revert to at period end (if any)
//
// Auto-refetches when the component remounts and exposes a manual refresh().

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface MembershipStatusResponse {
  tier: 'standard' | 'deluxe' | 'elite';
  member: { tier: string; joinedAt: string; notes?: string | null } | null;
  membership: {
    id: number;
    tier: 'Standard' | 'Deluxe' | 'Elite';
    cycle: 'monthly' | 'quarterly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    scheduledDowngradeTo: 'Standard' | 'Deluxe' | 'Elite' | null;
  } | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  scheduledDowngradeTo: 'Standard' | 'Deluxe' | 'Elite' | null;
}

export interface DerivedMembershipState {
  raw: MembershipStatusResponse | null;
  loading: boolean;
  error: string | null;
  // What the user has *right now* (current tier, respecting pending changes).
  effectiveTier: 'standard' | 'deluxe' | 'elite';
  // True only if user has a paid subscription (not Standard).
  isPaid: boolean;
  // Days until currentPeriodEnd. 0 if no period or already ended.
  daysRemaining: number;
  // Lifecycle state for the UI banner.
  status: 'none' | 'active' | 'expiring' | 'grace' | 'ended';
  // When their current paid period ends (ISO string), null if Standard.
  currentPeriodEnd: string | null;
  // True if they've cancelled but still have access until period end.
  cancelAtPeriodEnd: boolean;
  // Tier they'll revert to at period end (if scheduled downgrade was set).
  scheduledTo: 'standard' | 'deluxe' | 'elite' | null;
  // Force a refetch from the server (used after Paystack redirect back).
  refresh: () => Promise<void>;
}

const RANK = { standard: 0, deluxe: 1, elite: 2 } as const;

function toLowerTier(t: string | null | undefined): 'standard' | 'deluxe' | 'elite' | null {
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower in RANK) return lower as 'standard' | 'deluxe' | 'elite';
  return null;
}

export function useMembershipStatus(): DerivedMembershipState {
  const [raw, setRaw] = useState<MembershipStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<MembershipStatusResponse>('/api/memberships/me', true);
      setRaw(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load membership');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const derived = useMemo<DerivedMembershipState>(() => {
    const base: DerivedMembershipState = {
      raw,
      loading,
      error,
      effectiveTier: 'standard',
      isPaid: false,
      daysRemaining: 0,
      status: 'none',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      scheduledTo: null,
      refresh,
    };
    if (!raw) return base;

    const userTier = toLowerTier(raw.tier) ?? 'standard';
    const schedTier = toLowerTier(raw.scheduledDowngradeTo);
    const periodEnd = raw.currentPeriodEnd ? new Date(raw.currentPeriodEnd) : null;

    // If a downgrade is scheduled, the user still enjoys the current tier until
    // the period ends — effectiveTier stays the same. scheduledTo tells the UI
    // what the next tier will be.
    base.effectiveTier = userTier;
    base.isPaid = userTier !== 'standard';
    base.cancelAtPeriodEnd = !!raw.cancelAtPeriodEnd;
    base.scheduledTo = schedTier;
    base.currentPeriodEnd = raw.currentPeriodEnd;

    if (!periodEnd || userTier === 'standard') {
      base.daysRemaining = 0;
      base.status = userTier === 'standard' ? 'none' : 'active';
      return base;
    }

    const now = Date.now();
    const msLeft = periodEnd.getTime() - now;
    const days = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    base.daysRemaining = days;
    if (days <= 0) base.status = 'ended';
    else if (days <= 1) base.status = 'grace';
    else if (days <= 5) base.status = 'expiring';
    else base.status = 'active';
    return base;
  }, [raw, loading, error, refresh]);

  return derived;
}

// Helper exported so callers don't have to know the rank table.
export function tierRank(tier: 'standard' | 'deluxe' | 'elite'): number {
  return RANK[tier];
}