import { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import { Search, Printer, Copy, Download } from 'lucide-react';
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
  { label: 'Received', status: 'received' },
  { label: 'Processing', status: 'processing' },
  { label: 'In Transit', status: 'in_transit' },
  { label: 'Delivered', status: 'delivered' },
  { label: 'Cancelled', status: 'cancelled' },
];

export default function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  useEffect(() => { void fetchOrders(); }, [fetchOrders]);
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
          onStatusChange={(status) => {
            if (!dashboardUser) return;
            updateStatus(details.id, status, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`Order ${details.id} marked as ${status}`, 'success');
            setDetails(null);
          }}
          onAssignRider={(riderId, riderName) => {
            if (!dashboardUser) return;
            assignRider(details.id, riderId, riderName, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            updateStatus(details.id, 'in_transit', { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' }, `Assigned to ${riderName}`);
            showToast(`Rider ${riderName} assigned`, 'success');
            setDetails(null);
          }}
        />
      )}
    </div>
  );
}

