import { useMemo } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { useMembershipStore } from '@/stores/useMembershipStore';
import { useAuditLogStore } from '@/stores/useAuditLogStore';
import { useRiderStore } from '@/stores/useRiderStore';
import { useProductStore } from '@/stores/useProductStore';
import StatsCard from '@/components/admin/StatsCard';
import { RECENT_ACTIVITY, SALES_DATA } from '@/data/dashboardMockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Package,
  RotateCcw,
  ShoppingCart,
  Users,
  Activity,
  Bike,
  TrendingUp,
  Mail,
  Shield,
} from 'lucide-react';
import { formatNaira, formatNairaShort, relativeTime } from '@/utils/formatters';

const CATEGORY_COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

const CATEGORY_LABELS: Record<string, string> = {
  suits: 'Suits',
  blazers: 'Blazers',
  trousers: 'Trousers',
  vests: 'Vests',
  outerwear: 'Outerwear',
};

export default function AdminOverview() {
  const orders = useOrderStore((s) => s.orders);
  const returns = useReturnStore((s) => s.returns);
  const members = useMembershipStore((s) => s.members);
  const logs = useAuditLogStore((s) => s.logs);
  const riders = useRiderStore((s) => s.riders);
  const products = useProductStore((s) => s.products);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const pendingReturns = returns.filter((r) => r.status === 'pending' || r.status === 'approved').length;
    const activeRiders = riders.filter((r) => r.status === 'active').length;
    return { totalOrders, totalRevenue, activeMembers, pendingReturns, activeRiders };
  }, [orders, returns, members, riders]);

  // Top products by units sold (mock reduce over all order items)
  const topProducts = useMemo(() => {
    const counts: Record<number, { units: number; revenue: number; name: string; image: string }> = {};
    orders
      .filter((o) => o.status !== 'cancelled')
      .flatMap((o) => o.items)
      .forEach((it) => {
        const id = it.productId;
        if (!counts[id]) {
          counts[id] = { units: 0, revenue: 0, name: it.name, image: it.image };
        }
        counts[id].units += it.quantity;
        counts[id].revenue += it.price * it.quantity;
      });
    return Object.entries(counts)
      .map(([id, v]) => ({ productId: Number(id), ...v }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [orders]);

  // Low stock — first 5 from product catalog with mock badge
  const lowStock = useMemo(() => {
    return products.slice(0, 5).map((p) => ({
      id: String(p.id),
      name: p.name,
      sku: `HVN-${String(p.id).padStart(4, '0')}`,
      stockLeft: 12,
      image: p.images[0],
    }));
  }, [products]);

  // Recent customers — last 5 orders
  const recentCustomers = useMemo(() => {
    return [...orders]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        name: o.customerName,
        email: o.customerEmail,
        total: o.total,
        date: o.date,
      }));
  }, [orders]);

  // Sales by category (doughnut) — count items per category across all orders
  const categoryData = useMemo(() => {
    const productCategoryMap = new Map<number, string>();
    products.forEach((p) => productCategoryMap.set(p.id, p.category));
    const counts: Record<string, number> = {
      suits: 0,
      blazers: 0,
      trousers: 0,
      vests: 0,
      outerwear: 0,
    };
    orders
      .filter((o) => o.status !== 'cancelled')
      .flatMap((o) => o.items)
      .forEach((it) => {
        const cat = productCategoryMap.get(it.productId);
        if (cat && counts[cat] !== undefined) {
          counts[cat] += it.quantity;
        }
      });
    return Object.entries(counts).map(([key, value]) => ({
      name: CATEGORY_LABELS[key] ?? key,
      key,
      value,
    }));
  }, [orders, products]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">A snapshot of Havanat today.</p>
      </div>

      {/* Row 1 — KPIs full width */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <StatsCard label="Total Orders" value={stats.totalOrders.toLocaleString('en-NG')} change="+12% vs last month" trend="up" />
        <StatsCard label="Total Revenue" value={formatNairaShort(stats.totalRevenue)} change="+8% vs last month" trend="up" />
        <StatsCard label="Active Members" value={stats.activeMembers.toLocaleString('en-NG')} change="+3 this week" trend="up" />
        <StatsCard label="Pending Returns" value={stats.pendingReturns.toString()} change="Needs review" trend="flat" />
        <StatsCard label="Active Riders" value={stats.activeRiders.toString()} change="On shift" trend="up" />
      </div>

      {/* Row 2 — Chart left, Quick actions right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-light">Sales by Category</h3>
              <p className="text-xs text-gray-500 mt-1">Units sold across product categories</p>
            </div>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value} units`}
                  contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', fontSize: '12px' }}
                />
                <Legend
                  iconType="square"
                  wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
              </PieChart>
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
            <QuickAction icon={<Bike className="h-4 w-4" />} label="Active riders" count={riders.filter((r) => r.status === 'active').length} />
            <QuickAction icon={<Activity className="h-4 w-4" />} label="Audit actions today" count={logs.length} />
          </div>
        </div>
      </div>

      {/* Row 3 — Recent customers left, Top products right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-light">Recent Customers</h3>
              <p className="text-xs text-gray-500 mt-1">Latest orders from your customers</p>
            </div>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <ul className="divide-y divide-gray-100">
            {recentCustomers.map((c) => (
              <li key={c.id} className="py-3 flex items-center gap-3 text-sm">
                <div className="h-9 w-9 bg-gray-100 flex items-center justify-center text-xs font-medium uppercase">
                  {c.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatNaira(c.total)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{relativeTime(c.date)}</p>
                </div>
              </li>
            ))}
            {recentCustomers.length === 0 && (
              <li className="py-6 text-center text-xs text-gray-500">No recent orders yet</li>
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-light">Top Products</h3>
              <p className="text-xs text-gray-500 mt-1">Best sellers by units sold</p>
            </div>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <ul className="divide-y divide-gray-100">
            {topProducts.map((p, i) => (
              <li key={p.productId} className="py-3 flex items-center gap-3 text-sm">
                <span className="w-5 text-xs text-gray-400 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                <img src={p.image} alt={p.name} className="h-10 w-10 object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.units} units sold</p>
                </div>
                <p className="text-sm font-medium">{formatNaira(p.revenue)}</p>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="py-6 text-center text-xs text-gray-500">No sales recorded yet</li>
            )}
          </ul>
        </div>
      </div>

      {/* Row 4 — Low stock full width */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-light">Low Stock Alert</h3>
            <p className="text-xs text-gray-500 mt-1">Products nearing replenishment</p>
          </div>
          <Shield className="h-4 w-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {lowStock.map((p) => (
            <div key={p.id} className="border border-gray-200 p-3 flex flex-col gap-2">
              <img src={p.image} alt={p.name} className="h-20 w-full object-cover bg-gray-100" />
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{p.sku}</p>
              <span className="self-start inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                {p.stockLeft} left
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl font-light">Revenue — Last 30 Days</h3>
            <p className="text-xs text-gray-500 mt-1">Daily revenue in Naira</p>
          </div>
          <Activity className="h-4 w-4 text-gray-400" />
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl font-light">Recent Activity</h3>
            <p className="text-xs text-gray-500 mt-1">Latest actions across the platform</p>
          </div>
          <Mail className="h-4 w-4 text-gray-400" />
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