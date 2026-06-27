// Reusable order details + edit modal.
//
// Used by:
//   - AdminOrders     (admin)
//   - ModeratorOrders (moderator)
//
// Both have the same privileges on /api/orders (the backend allows both roles),
// so they share this modal. The actor parameter for the change handlers is the
// dashboardUser; the parent wires up the role field from its own context.

import { useState } from 'react';
import { X, MapPin, Phone, Mail, Bike } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDateTime, formatNaira } from '@/utils/formatters';
import type { DashboardOrder, OrderStatus, Rider } from '@/types/dashboard';

export interface OrderDetailsModalProps {
  order: DashboardOrder;
  riders: Rider[];
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onAssignRider: (riderId: string, riderName: string) => void;
}

export default function OrderDetailsModal({
  order, riders, onClose, onStatusChange, onAssignRider,
}: OrderDetailsModalProps) {
  const [riderId, setRiderId] = useState(order.riderId ?? '');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Order</p>
            <h3 className="font-serif text-2xl font-light mt-1">{order.id}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-70">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <SectionTitle>Customer</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500 text-xs">Name:</span> {order.customerName}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {order.customerEmail}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {order.customerPhone}</p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
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
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="in_transit">In Transit</option>
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
                    className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] bg-black text-white disabled:opacity-50 hover:bg-gray-900"
                  >
                    <Bike className="h-3.5 w-3.5 inline mr-1" /> Assign
                  </button>
                </div>
              </div>
            </div>
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