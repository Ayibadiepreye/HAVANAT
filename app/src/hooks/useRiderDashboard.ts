// Rider dashboard hooks — all live from backend.
//
// useRiderStats    - earnings summary + delivery counts from GET /api/riders/me/stats
// useRiderPayouts  - payout history from GET /api/riders/me/payouts
// useRiderDeliveries - assigned deliveries from GET /api/riders/me/deliveries

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface RiderStats {
  lifetimeEarnings: number;
  earningsToday: number;
  earningsByStatus: { pending: number; approved: number; paid: number };
  deliveryCounts: {
    pending: number;
    picked_up: number;
    in_transit: number;
    delivered: number;
    failed: number;
  };
  totalDeliveries: number;
}

export function useRiderStats() {
  const [data, setData] = useState<RiderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<RiderStats>('/api/riders/me/stats', true);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export interface RiderPayout {
  id: number;
  riderId: number;
  amount: string;       // decimal-as-string from DB
  status: 'pending' | 'approved' | 'paid';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export function useRiderPayouts() {
  const [data, setData] = useState<RiderPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: RiderPayout[] }>('/api/riders/me/payouts', true);
      setData(res.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export interface RiderDelivery {
  id: number;
  orderId: number;
  riderId: number | null;
  type: 'delivery' | 'return';
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  deliveryOtp: string | null;
  assignedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
}

export function useRiderDeliveries() {
  const [data, setData] = useState<RiderDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: RiderDelivery[] }>('/api/riders/me/deliveries', true);
      setData(res.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}