import { useState } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { X, Search } from 'lucide-react';
import { formatDateTime, formatNaira } from '@/utils/formatters';
import type { DashboardOrder } from '@/types/dashboard';

export default function ModeratorOrders() {
  const orders = useOrderStore((s) => s.orders);
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<DashboardOrder | null>(null);

  const filtered = orders.filter((o) => !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<DashboardOrder>[] = [
    { key: 'id', label: 'Order #', render: (o) => <span className="font-medium">{o.id}</span> },
    { key: 'customer', label: 'Customer', render: (o) => o.customerName },
    { key: 'date', label: 'Date', render: (o) => <span className="text-xs">{formatDateTime(o.date)}</span> },
    { key: 'items', label: 'Items', render: (o) => `${o.items.length}` },
    { key: 'total', label: 'Total', render: (o) => formatNaira(o.total), align: 'right' },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} type="order" /> },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-light">Orders</h2>
        <p className="text-sm text-gray-500 mt-1">Read-only view · {orders.length} orders</p>
      </div>

      <div className="bg-white border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
        </div>
      </div>

      <AdminTable<DashboardOrder> columns={columns} rows={filtered} keyFn={(o) => o.id} onRowClick={setDetails} emptyMessage="No orders" />

      {details && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDetails(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-serif text-2xl font-light">{details.id}</h3>
              <button onClick={() => setDetails(null)} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p><span className="text-gray-500">Customer</span> · {details.customerName}</p>
              <p><span className="text-gray-500">Address</span> · {details.shippingAddress.street}, {details.shippingAddress.city}</p>
              <p><span className="text-gray-500">Status</span> · <StatusBadge status={details.status} type="order" /></p>
              <div className="border-t border-gray-200 pt-3">
                {details.items.map((it) => (
                  <div key={`${it.productId}-${it.size}`} className="flex justify-between py-1.5">
                    <span>{it.name} × {it.quantity}</span>
                    <span>{formatNaira(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <p className="font-medium pt-2 border-t border-gray-200 flex justify-between"><span>Total</span><span>{formatNaira(details.total)}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
