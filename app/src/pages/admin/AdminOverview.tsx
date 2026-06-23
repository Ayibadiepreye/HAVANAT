import { useMemo } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { useMembershipStore } from '@/stores/useMembershipStore';
import { useAuditLogStore } from '@/stores/useAuditLogStore';
import StatsCard from '@/components/admin/StatsCard';
import { RECENT_ACTIVITY, SALES_DATA } from '@/data/dashboardMockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, RotateCcw, ShoppingCart, Users, Activity } from 'lucide-react';
import { formatNaira, formatNairaShort, relativeTime } from '@/utils/formatters';

export default function AdminOverview() {
  const orders = useOrderStore((s) => s.orders);
  const returns = useReturnStore((s) => s.returns);
  const members = useMembershipStore((s) => s.members);
  const logs = useAuditLogStore((s) => s.logs);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const pendingReturns = returns.filter((r) => r.status === 'pending' || r.status === 'approved').length;
    return { totalOrders, totalRevenue, activeMembers, pendingReturns };
  }, [orders, returns, members]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">A snapshot of Havanat today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Total Orders" value={stats.totalOrders.toLocaleString('en-NG')} change="+12% vs last month" trend="up" />
        <StatsCard label="Total Revenue" value={formatNairaShort(stats.totalRevenue)} change="+8% vs last month" trend="up" />
        <StatsCard label="Active Members" value={stats.activeMembers.toLocaleString('en-NG')} change="+3 this week" trend="up" />
        <StatsCard label="Pending Returns" value={stats.pendingReturns.toString()} change="Needs review" trend="flat" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-light">Revenue — Last 30 Days</h3>
              <p className="text-xs text-gray-500 mt-1">Daily revenue in Naira</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALES_DATA} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#6b6b6b' }}
                  tickFormatter={(d) => d.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b6b6b' }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: number) => formatNaira(value)}
                  contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', fontSize: '12px' }}
                  labelStyle={{ fontSize: '11px', color: '#6b6b6b' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="font-serif text-xl font-light mb-1">Quick Actions</h3>
          <p className="text-xs text-gray-500 mb-6">Common operations</p>
          <div className="space-y-2">
            <QuickAction icon={<ShoppingCart className="h-4 w-4" />} label="Process pending orders" count={orders.filter((o) => o.status === 'processing').length} />
            <QuickAction icon={<RotateCcw className="h-4 w-4" />} label="Review return requests" count={returns.filter((r) => r.status === 'pending').length} />
            <QuickAction icon={<Users className="h-4 w-4" />} label="Active members" count={members.filter((m) => m.status === 'active').length} />
            <QuickAction icon={<Package className="h-4 w-4" />} label="Audit actions today" count={logs.filter((l) => l.timestamp.slice(0, 10) === '2026-06-23').length} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl font-light">Recent Activity</h3>
            <p className="text-xs text-gray-500 mt-1">Latest actions across the platform</p>
          </div>
          <Activity className="h-4 w-4 text-gray-400" />
        </div>
        <ul className="divide-y divide-gray-100">
          {RECENT_ACTIVITY.map((a) => (
            <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
              <div className="h-1.5 w-1.5 bg-black rounded-full" />
              <span className="flex-1 text-gray-800">{a.message}</span>
              <span className="text-xs text-gray-400">{relativeTime(a.timestamp)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-gray-600">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{count}</span>
    </div>
  );
}
