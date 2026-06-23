import { useMemo } from 'react';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import StatsCard from '@/components/admin/StatsCard';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira, formatDate } from '@/utils/formatters';
import { PAYOUTS } from '@/data/dashboardMockData';
import type { Payout } from '@/types/dashboard';

export default function RiderEarnings() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const deliveries = useRiderStore((s) => s.deliveries);
  const showToast = useUIStore((s) => s.showToast);

  const riderId = dashboardUser?.id === 'usr_rider' ? 'rider_01' : (dashboardUser?.id ?? 'rider_01');
  const myDeliveries = useMemo(
    () => deliveries.filter((d) => d.riderId === riderId && d.status === 'delivered'),
    [deliveries, riderId]
  );
  const myPayouts = useMemo(() => PAYOUTS.filter((p) => p.riderId === riderId), [riderId]);

  const today = useMemo(
    () => myDeliveries.filter((d) => d.completedAt?.startsWith('2026-06-23')),
    [myDeliveries]
  );
  const todayTotal = useMemo(() => today.reduce((s, d) => s + d.deliveryFee, 0), [today]);
  const weekTotal = useMemo(
    () => myDeliveries.filter((d) => d.completedAt && d.completedAt >= '2026-06-17').reduce((s, d) => s + d.deliveryFee, 0),
    [myDeliveries]
  );
  const monthTotal = useMemo(() => myDeliveries.reduce((s, d) => s + d.deliveryFee, 0), [myDeliveries]);

  const chartData = useMemo(() => {
    const days: { date: string; earnings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-06-23');
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = myDeliveries.filter((dl) => dl.completedAt?.startsWith(key)).reduce((s, x) => s + x.deliveryFee, 0);
      days.push({ date: key, earnings: total });
    }
    return days;
  }, [myDeliveries]);

  const columns: Column<Payout>[] = [
    { key: 'id', label: 'Reference', render: (p) => <span className="font-medium text-xs">{p.id}</span> },
    { key: 'date', label: 'Date', render: (p) => formatDate(p.date) },
    { key: 'amount', label: 'Amount', render: (p) => formatNaira(p.amount), align: 'right' },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} type="generic" /> },
    { key: 'ref', label: 'Reference #', render: (p) => <span className="text-xs text-gray-500">{p.reference ?? '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Earnings</h2>
        <p className="text-sm text-gray-500 mt-1">Your completed deliveries and payouts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard label="Today" value={formatNaira(todayTotal)} change={`${today.length} completed`} />
        <StatsCard label="This Week" value={formatNaira(weekTotal)} change="Last 7 days" />
        <StatsCard label="This Month" value={formatNaira(monthTotal)} change="All completed" />
        <StatsCard label="Total" value={formatNaira(monthTotal + 200000)} change="Career total" trend="up" />
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
        <AdminTable<Payout> columns={columns} rows={myPayouts} keyFn={(p) => p.id} emptyMessage="No payouts yet" />
      </div>
    </div>
  );
}
