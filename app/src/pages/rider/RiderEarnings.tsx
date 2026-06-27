import { useMemo } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import StatsCard from '@/components/admin/StatsCard';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira, formatDate } from '@/utils/formatters';
import { useRiderStats, useRiderPayouts } from '@/hooks/useRiderDashboard';
import type { Payout } from '@/types/dashboard';

export default function RiderEarnings() {
  const showToast = useUIStore((s) => s.showToast);

  // Live stats from /api/riders/me/stats — replaces all the hardcoded 2026-06-23
  // date math that was silently filtering to mock data.
  const stats = useRiderStats();
  const payoutsApi = useRiderPayouts();

  const todayTotal = stats.data?.earningsToday ?? 0;
  const weekTotal = (stats.data?.earningsByStatus.paid ?? 0)
    + (stats.data?.earningsByStatus.approved ?? 0)
    + (stats.data?.earningsByStatus.pending ?? 0);  // includes in-flight
  const monthTotal = stats.data?.earningsByStatus.paid ?? 0;
  const lifetimeTotal = stats.data?.lifetimeEarnings ?? 0;

  // Bar chart: 7-day breakdown of paid payouts (simple, no date math).
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; earnings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = payoutsApi.data
        .filter((p) => p.status === 'paid' && p.createdAt.startsWith(key))
        .reduce((s, x) => s + Number(x.amount), 0);
      days.push({ date: key, earnings: total });
    }
    return days;
  }, [payoutsApi.data]);

  const columns: Column<Payout>[] = [
    { key: 'id', label: 'Reference', render: (p: any) => <span className="font-medium text-xs">PO-{String(p.id).padStart(6, '0')}</span> },
    { key: 'date', label: 'Date', render: (p: any) => formatDate(p.createdAt) },
    { key: 'amount', label: 'Amount', render: (p: any) => formatNaira(Number(p.amount)), align: 'right' },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status} type="generic" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Earnings</h2>
        <p className="text-sm text-gray-500 mt-1">Your completed deliveries and payouts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard label="Today" value={formatNaira(todayTotal)} change={`${stats.data?.deliveryCounts.delivered ?? 0} delivered`} />
        <StatsCard label="This Week" value={formatNaira(weekTotal)} change={`${stats.data?.totalDeliveries ?? 0} total runs`} />
        <StatsCard label="Paid Out" value={formatNaira(monthTotal)} change="Settled earnings" />
        <StatsCard label="Lifetime" value={formatNaira(lifetimeTotal)} change="Career total" trend="up" />
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-serif text-xl font-light mb-4">Daily Earnings — Last 7 Days</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6b6b' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#6b6b6b' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ fontSize: '12px', border: '1px solid #e5e5e5' }} />
              <Bar dataKey="earnings" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-xl font-light">Payout History</h3>
          <button
            onClick={() => showToast('Payout request submitted', 'success')}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-black text-white hover:bg-gray-900"
          >Request Payout</button>
        </div>
        <AdminTable<Payout> columns={columns} rows={payoutsApi.data as unknown as Payout[]} keyFn={(p) => p.id} emptyMessage="No payouts yet" />
      </div>
    </div>
  );
}
