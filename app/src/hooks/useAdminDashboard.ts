// Admin dashboard data hooks — all live from backend.
//
// useAdminOverview  - top-line numbers (revenue, order count, active members,
//                     riders, low stock, etc.) from GET /api/admin/overview
// useAdminSales     - last N days of revenue + order count for the line chart
//                     from GET /api/admin/sales?days=N
// useAdminTopProducts - best sellers from GET /api/admin/top-products
// useAdminRecentActivity - the audit log from GET /api/audit
//
// Each hook exposes { data, loading, error, refresh } and is safe to call from
// any admin page — internal cache is per-hook, no global store needed.

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface AdminOverview {
  revenueAllTime: number;
  revenueToday: number;
  orderCount: number;
  pendingOrders: number;
  inTransit: number;
  activeMembers: number;
  customerCount: number;
  riderCount: number;
  activeRiders: number;
  lowStock: number;
}

export function useAdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<AdminOverview>('/api/admin/overview', true);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export function useAdminSales(days = 14) {
  const [data, setData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ data: SalesPoint[] }>(`/api/admin/sales?days=${days}`, true);
      setData(res.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export interface TopProduct {
  productId: number;
  name: string;
  image: string;
  units: number;
  revenue: number;
}

export function useAdminTopProducts(limit = 5) {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: TopProduct[] }>(`/api/admin/top-products?limit=${limit}`, true);
      setData(res.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load top products');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export interface AuditEntry {
  id: number;
  userId: number;
  userName: string;
  userRole: 'admin' | 'moderator' | 'customer' | 'rider' | 'system';
  action: 'create' | 'update' | 'delete' | 'init' | 'verify' | 'login' | 'logout';
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  before?: any;
  after?: any;
  createdAt: string;
}

export function useAdminRecentActivity(limit = 10) {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: AuditEntry[] }>(`/api/audit?limit=${limit}`, true);
      setData(res.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}