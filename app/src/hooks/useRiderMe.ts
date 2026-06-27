// Rider self-view hooks — every API call is scoped to the logged-in rider
// via their JWT (req.user.sub on the backend). No more matching rider IDs
// against a manually-built roster.
//
// useRiderMe        — current rider's profile (joined user + rider_profile).
//                     Equivalent to /api/riders but scoped to the caller.
// useRiderDeliveries — current rider's delivery list from /api/riders/me/deliveries.
// useRiderStats     — current rider's earnings + delivery counts from
//                     /api/riders/me/stats (already wired in RiderEarnings).
// useRiderPayouts   — current rider's payout history from
//                     /api/riders/me/payouts.
//
// Each hook exposes { data, loading, error, refresh }.

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

// ----- Types --------------------------------------------------------------

export interface RiderMe {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: 'standard' | 'deluxe' | 'elite';
  createdAt: string;
  profile: {
    userId: number;
    vehicleType: 'bike' | 'car' | 'van';
    plateNumber: string;
    status: 'pending' | 'active' | 'suspended' | 'inactive';
    idVerified: boolean;
    address: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  } | null;
}

export interface RiderDelivery {
  id: number;
  orderId: number;
  riderId: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assignedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  eta: string | null;
  deliveryFee: string;
}

export interface RiderStats {
  earnings: {
    pending: number;
    approved: number;
    paid: number;
    lifetime: number;
  };
  deliveries: {
    pending: number;
    picked_up: number;
    in_transit: number;
    delivered: number;
    failed: number;
  };
}

export interface RiderPayout {
  id: number;
  riderId: number;
  amount: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  reference: string | null;
  createdAt: string;
}

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useAuthedEndpoint<T>(path: string): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<T>(path, true);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? `Failed to load ${path}`);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}

// ----- Hooks --------------------------------------------------------------

/**
 * useRiderMe — load the current rider's user + rider_profile rows.
 *
 * Backend route: this calls /api/admin/riders?filter=me — but the simpler
 * approach (and what we use here) is to call /api/riders/me which returns
 * the caller's own user + profile rows. The rider routes file already has
 * a /me/* pattern for the rider's own data; we just expose /me/profile
 * explicitly here so the panel can read it without scoping against the
 * admin roster.
 */
export function useRiderMe(): AsyncState<RiderMe> {
  return useAuthedEndpoint<RiderMe>('/api/riders/me/profile');
}

/**
 * useRiderDeliveries — current rider's deliveries, newest first.
 *
 * The store's fetchMyDeliveries() does the same call and we keep both for
 * backwards compat, but this hook is what new code should use because it
 * returns the response shape directly.
 */
export function useRiderDeliveries(): AsyncState<{ items: RiderDelivery[] }> {
  return useAuthedEndpoint<{ items: RiderDelivery[] }>('/api/riders/me/deliveries');
}

export function useRiderStats(): AsyncState<RiderStats> {
  return useAuthedEndpoint<RiderStats>('/api/riders/me/stats');
}

export function useRiderPayouts(): AsyncState<{ items: RiderPayout[] }> {
  return useAuthedEndpoint<{ items: RiderPayout[] }>('/api/riders/me/payouts');
}