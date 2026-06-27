import {
  useAdminOverview,
  useAdminSales,
  useAdminTopProducts,
  useAdminRecentActivity,
  type AuditEntry,
} from '@/hooks/useAdminDashboard';
import { useOrderStore } from '@/stores/useOrderStore';
import { useProductStore } from '@/stores/useProductStore';
import { useEffect, useMemo } from 'react';
import StatsCard from '@/components/admin/StatsCard';
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
} from 'recharts';
import {
  Package,
  Activity,
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
  // ── Live backend data ─────────────────────────────────────────────────────
  // Each hook fetches the live endpoint and exposes { data, loading, error }.
  // The component falls back to 0 / empty arrays while loading so the page
  // still renders without flash-of-empty.
  const overview = useAdminOverview();
  const sales = useAdminSales(14);
  const topProductsApi = useAdminTopProducts(5);
  const recent = useAdminRecentActivity(10);

  // Local stores for category data + low-stock — these come from product/order
  // stores which already fetch from backend (/api/products, /api/orders/mine
  // and /api/orders for admins). These are NOT mocks.
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const orders = useOrderStore((s) => s.orders);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);

  useEffect(() => { if (products.length === 0) void fetchProducts(); }, [products.length, fetchProducts]);
  useEffect(() => { if (orders.length === 0) void fetchOrders(); }, [orders.length, fetchOrders]);

  // Sales-by-category from real order_items + product categories (no mock).
  const categoryData = useMemo(() => {
    const productCategoryMap = new Map<number, string>();
    products.forEach((p) => productCategoryMap.set(p.id, p.category));
    const counts: Record<string, number> = {
      suits: 0, blazers: 0, trousers: 0, vests: 0, outerwear: 0,
    };
    orders
      .filter((o) => o.status !== 'cancelled')
      .flatMap((o) => o.items)
      .forEach((it) => {
        const cat = productCategoryMap.get(it.productId);
        if (cat && counts[cat] !== undefined) counts[cat] += it.quantity;
      });
    return Object.entries(counts).map(([key, value]) => ({
      name: CATEGORY_LABELS[key] ?? key,
      key,
      value,
    }));
  }, [orders, products]);

  // Low stock — top 5 products sorted by lowest stock (was hardcoded "12").
  const lowStock = useMemo(() => {
    return [...products]
      .filter((p) => p.stock <= 20)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map((p) => ({
        id: String(p.id),
        name: p.name,
        sku: `HVN-${String(p.id).padStart(4, '0')}`,
        stockLeft: p.stock,
        image: p.images[0],
      }));
  }, [products]);

  const o = overview.data;
  const stats = {
    totalRevenue: o?.revenueAllTime ?? 0,
    todayRevenue: o?.revenueToday ?? 0,
    totalOrders: o?.orderCount ?? 0,
    pendingOrders: o?.pendingOrders ?? 0,
    inTransit: o?.inTransit ?? 0,
    activeMembers: o?.activeMembers ?? 0,
    customerCount: o?.customerCount ?? 0,
    activeRiders: o?.activeRiders ?? 0,
    lowStock: o?.lowStock ?? 0,
  };

  // Recent activity -> audit log entries from /api/audit.
  const recentActivity = useMemo(
    () => recent.data.slice(0, 5).map((a: AuditEntry) => ({
      id: String(a.id),
      message: a.summary,
      timestamp: a.createdAt,
      actor: a.userName,
    })),
    [recent.data]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">A live snapshot of Havanat.</p>
      </div>
      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <StatsCard label="Total Orders" value={stats.totalOrders.toLocaleString('en-NG')} change={`${stats.pendingOrders} pending`} trend="flat" />
        <StatsCard label="Total Revenue" value={formatNairaShort(stats.totalRevenue)} change={`${formatNairaShort(stats.todayRevenue)} today`} trend="up" />
        <StatsCard label="Active Members" value={stats.activeMembers.toLocaleString('en-NG')} change={`${stats.customerCount} total customers`} trend="up" />
        <StatsCard label="Active Riders" value={stats.activeRiders.toString()} change="On shift" trend="up" />
        <StatsCard label="Low Stock" value={stats.lowStock.toString()} change={`${stats.inTransit} in transit`} trend="flat" />
      </div>

      {/* Row 2 — Sales chart left, Quick actions right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-light">Revenue — Last 14 Days</h3>
              <p className="text-xs text-gray-500 mt-1">Daily revenue in Naira (live from orders)</p>
            </div>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="h-64">
            {sales.loading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">Loading sales…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales.data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6b6b' }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b6b6b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatNaira(value)} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', fontSize: '12px' }} labelStyle={{ fontSize: '11px', color: '#6b6b6b' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="font-serif text-xl font-light mb-1">Sales by Category</h3>
          <p className="text-xs text-gray-500 mb-6">Units sold across product categories</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} units`} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-1 text-xs">
            {categoryData.map((c, i) => (
              <li key={c.key} className="flex items-center gap-2">
                <span className="h-2 w-2 inline-block" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                <span className="flex-1">{c.name}</span>
                <span className="text-gray-500">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row 3 — Top products + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-light">Top Products</h3>
              <p className="text-xs text-gray-500 mt-1">Best sellers by units sold (live)</p>
            </div>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <ul className="divide-y divide-gray-100">
            {topProductsApi.data.map((p, i) => (
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
            {topProductsApi.data.length === 0 && (
              <li className="py-6 text-center text-xs text-gray-500">No sales recorded yet</li>
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-light">Recent Activity</h3>
              <p className="text-xs text-gray-500 mt-1">Live audit log from {recent.data.length} entries</p>
            </div>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <ul className="divide-y divide-gray-100">
            {recentActivity.map((a) => (
              <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 bg-black rounded-full" />
                <span className="flex-1 text-gray-800 truncate">{a.message}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{a.actor} · {relativeTime(a.timestamp)}</span>
              </li>
            ))}
            {recentActivity.length === 0 && (
              <li className="py-6 text-center text-xs text-gray-500">No activity yet</li>
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
          {lowStock.length === 0 && (
            <div className="col-span-full text-center py-6 text-xs text-gray-500">All products well-stocked</div>
          )}
        </div>
      </div>
    </div>
  );
}
