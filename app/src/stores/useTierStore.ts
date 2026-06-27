// Single source of truth for membership tier pricing + features.
//
// Fetches from GET /api/memberships/tiers (public, no auth required).
// All UI surfaces (HomePage, MembershipPage, MembershipPanel, AdminMemberships)
// should consume this hook so the admin-set price appears consistently
// everywhere without per-page hardcoding.
//
// The backend returns tier data from `membership_tiers` table. Prices
// are stored as decimal strings in DB; we surface them as number here.

import { create } from 'zustand';
import { apiGet } from '@/lib/api';

export interface MembershipTierPublic {
  id: number;
  tier: 'Standard' | 'Deluxe' | 'Elite';
  displayName: string;
  description: string;
  price: number;            // NGN, 0 for Standard
  priceLabel: string;       // "₦10,000" or "Free"
  billingCycles: Array<'monthly' | 'quarterly' | 'yearly'>;
  billing: string;          // "per month" or "Free Forever"
  features: string[];       // ["✓ Free shipping", "· Priority support"]
  isPopular: boolean;
  sortOrder: number;
  active: boolean;
}

interface TierState {
  tiers: MembershipTierPublic[];
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  fetch: (force?: boolean) => Promise<void>;
  byTier: (tier: 'Standard' | 'Deluxe' | 'Elite') => MembershipTierPublic | undefined;
}

const CACHE_MS = 30_000; // 30s in-memory cache

export const useTierStore = create<TierState>((set, get) => ({
  tiers: [],
  loading: false,
  error: null,
  fetchedAt: null,

  fetch: async (force = false) => {
    const now = Date.now();
    if (!force && get().fetchedAt && now - get().fetchedAt! < CACHE_MS && get().tiers.length > 0) {
      return;
    }
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await apiGet<{ items: MembershipTierPublic[] }>('/api/memberships/tiers', false);
      set({ tiers: res.items ?? [], loading: false, fetchedAt: now });
    } catch (err: any) {
      // Don't blow up the whole page on a network hiccup — UI keeps showing
      // whatever it already had (or the static fallback in config/membership).
      set({ loading: false, error: err?.message ?? 'Failed to load tiers' });
    }
  },

  byTier: (tier) => get().tiers.find((t) => t.tier === tier),
}));

// Convenience hook for components that just want the array.
export function useTiers() {
  const tiers = useTierStore((s) => s.tiers);
  const loading = useTierStore((s) => s.loading);
  const fetchTiers = useTierStore((s) => s.fetch);
  if (tiers.length === 0 && !loading) {
    // Fire-and-forget on first access.
    void fetchTiers();
  }
  return tiers;
}