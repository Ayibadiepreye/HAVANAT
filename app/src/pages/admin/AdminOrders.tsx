import { useState, useMemo } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Search, MapPin, Phone, X, Bike, Mail, Printer, Copy, Download } from 'lucide-react';
import { formatDateTime, formatNaira } from '@/utils/formatters';
import { logAuditAction } from '@/utils/auditLogger';
import type { DashboardOrder, OrderStatus } from '@/types/dashboard';

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportOrdersCsv(orders: DashboardOrder[]): void {
  const headers = ['Order #', 'Customer', 'Email', 'Phone', 'Date', 'Items', 'Subtotal', 'Delivery', 'Total', 'Status', 'City', 'State'];
  const rows = orders.map((o) => [
    o.id,
    o.customerName,
    o.customerEmail,
    o.customerPhone,
    o.date,
    o.items.length,
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.status,
    o.shippingAddress.city,
    o.shippingAddress.state,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `havanat-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const TABS: { label: string; status: OrderStatus | 'all' }[] = [
  { label: 'All', status: 'all' },
  { label: 'Pending Payment', status: 'pending' },
  { label: 'Processing', status: 'processing' },
  { label: 'Shipped', status: 'shipped' },
  { label: 'Delivered', status: 'delivered' },
  { label: 'Cancelled', status: 'cancelled' },
];

export default function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const assignRider = useOrderStore((s) => s.assignRider);
  const riders = useRiderStore((s) => s.riders);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<DashboardOrder | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== 'all' && o.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [orders, activeTab, search]);

  const columns: Column<DashboardOrder>[] = [
    { key: 'id', label: 'Order #', render: (o) => <span className="font-medium">{o.id}</span> },
    { key: 'customer', label: 'Customer', render: (o) => <div><p>{o.customerName}</p><p className="text-xs text-gray-500">{o.customerEmail}</p></div> },
    { key: 'date', label: 'Date', render: (o) => <span className="text-xs text-gray-600">{formatDateTime(o.date)}</span> },
    { key: 'items', label: 'Items', render: (o) => `${o.items.length} item${o.items.length !== 1 ? 's' : ''}` },
    { key: 'total', label: 'Total', render: (o) => formatNaira(o.total), align: 'right' },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} type="order" /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '180px',
      render: (o) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              if (!dashboardUser) return;
              window.print();
              logAuditAction({
                userId: dashboardUser.id, userName: dashboardUser.name, userRole: 'admin',
                action: 'update', entityType: 'order', entityId: o.id, entityLabel: `Order ${o.id}`,
                summary: `Printed invoice for ${o.id}`,
                changes: { before: null, after: { printedAt: new Date().toISOString() } },
              });
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-gray-200 hover:border-black transition-colors"
            aria-label="Print invoice"
            title="Print invoice"
          >
            <Printer className="h-3.5 w-3.5" /> Invoice
          </button>
          <button
            onClick={() => {
              if (!dashboardUser) return;
              const newId = `${o.id}-DUP-${Date.now().toString().slice(-4)}`;
              logAuditAction({
                userId: dashboardUser.id, userName: dashboardUser.name, userRole: 'admin',
                action: 'create', entityType: 'order', entityId: newId, entityLabel: `Order ${newId}`,
                summary: `Duplicated order from ${o.id}`,
                changes: { before: null, after: { sourceOrderId: o.id, newOrderId: newId, total: o.total } },
              });
              showToast(`Duplicated ${o.id} as ${newId}`, 'success');
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-gray-200 hover:border-black transition-colors"
            aria-label="Duplicate order"
            title="Duplicate order"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Orders</h2>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} orders</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
                activeTab === tab.status
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200 hover:border-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative md:max-w-xs md:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order # or name..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
          />
        </div>
        <button
          onClick={() => {
            exportOrdersCsv(filtered);
            if (dashboardUser) {
              logAuditAction({
                userId: dashboardUser.id, userName: dashboardUser.name, userRole: 'admin',
                action: 'update', entityType: 'order', entityId: 'csv-export', entityLabel: 'Orders CSV export',
                summary: `Exported ${filtered.length} orders to CSV`,
                changes: { before: null, after: { count: filtered.length, exportedAt: new Date().toISOString() } },
              });
            }
            showToast(`Exported ${filtered.length} orders`, 'success');
          }}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-white border border-gray-200 hover:border-black transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <AdminTable<DashboardOrder>
        columns={columns}
        rows={filtered}
        keyFn={(o) => o.id}
        onRowClick={setDetails}
        emptyMessage="No orders match your filters"
      />

      {details && (
        <OrderDetailsModal
          order={details}
          riders={riders.filter((r) => r.status === 'active')}
          onClose={() => setDetails(null)}
          onStatusChange={(status, note) => {
            if (!dashboardUser) return;
            updateStatus(details.id, status, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' }, note);
            showToast(`Order ${details.id} marked as ${status}`, 'success');
            setDetails(null);
          }}
          onAssignRider={(riderId, riderName) => {
            if (!dashboardUser) return;
            assignRider(details.id, riderId, riderName, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            updateStatus(details.id, 'shipped', { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' }, `Assigned to ${riderName}`);
            showToast(`Rider ${riderName} assigned`, 'success');
            setDetails(null);
          }}
        />
      )}
    </div>
  );
}

interface DetailsProps {
  order: DashboardOrder;
  riders: { id: string; name: string; vehicleType: string; rating: number }[];
  onClose: () => void;
  onStatusChange: (status: OrderStatus, note?: string) => void;
  onAssignRider: (riderId: string, riderName: string) => void;
}

function OrderDetailsModal({ order, riders, onClose, onStatusChange, onAssignRider }: DetailsProps) {
  const [riderId, setRiderId] = useState(order.riderId ?? '');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Order</p>
            <h3 className="font-serif text-2xl font-light mt-1">{order.id}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <SectionTitle>Customer</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500 text-xs">Name:</span> {order.customerName}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {order.customerEmail}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {order.customerPhone}</p>
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}</p>
            </div>
          </section>

          <section>
            <SectionTitle>Items</SectionTitle>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={`${it.productId}-${it.size}`} className="flex items-center gap-3 p-2 border border-gray-100">
                  <img src={it.image} className="h-12 w-12 object-cover bg-gray-100" alt="" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-gray-500">Size {it.size} · Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm">{formatNaira(it.price * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-6 text-sm">
              <span className="text-gray-500">Subtotal</span><span>{formatNaira(order.subtotal)}</span>
            </div>
            <div className="flex justify-end gap-6 text-sm mt-1">
              <span className="text-gray-500">Delivery</span><span>{formatNaira(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-end gap-6 text-sm mt-2 pt-2 border-t border-gray-200 font-medium">
              <span>Total</span><span>{formatNaira(order.total)}</span>
            </div>
          </section>

          <section>
            <SectionTitle>Tracking Timeline</SectionTitle>
            <ol className="space-y-4">
              {order.trackingHistory.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 bg-black rounded-full" />
                    {i < order.trackingHistory.length - 1 && <div className="flex-1 w-px bg-gray-300 my-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={e.status} type="order" />
                      <span className="text-xs text-gray-500">{formatDateTime(e.timestamp)}</span>
                    </div>
                    {e.note && <p className="text-xs text-gray-600 mt-1">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-gray-50 p-4 space-y-4">
            <SectionTitle>Actions</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Update Status</Label>
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label>Assign Rider</Label>
                <div className="flex gap-2">
                  <select
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
                  >
                    <option value="">Select rider...</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} · {r.vehicleType} · ★{r.rating}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const r = riders.find((x) => x.id === riderId);
                      if (r) onAssignRider(r.id, r.name);
                    }}
                    disabled={!riderId}
                    className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] bg-black text-white disabled:opacity-50 hover:bg-gray-900 transition-colors"
                  >
                    <Bike className="h-3.5 w-3.5 inline mr-1" /> Assign
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => alert('Email update sent (mock)')}
              className="text-[10px] uppercase tracking-[0.2em] underline underline-offset-4 hover:opacity-60"
            >
              Send Update Email
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">{children}</h4>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">{children}</label>
);
