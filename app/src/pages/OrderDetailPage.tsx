import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  XCircle,
  Download,
  LifeBuoy,
  RotateCcw,
  CheckCircle2,
  Clock,
  PackageCheck,
} from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatNaira } from '@/config';
import { BRAND } from '@/config/brand';
import type { OrderStatus } from '@/types/dashboard';

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Received',
  processing: 'Processing',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-gray-100 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Timeline visual order. Items appear stacked top-to-bottom.
const TIMELINE: Array<{ key: OrderStatus; label: string; icon: typeof Clock }> = [
  { key: 'received', label: 'Order received', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'in_transit', label: 'In transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

function isCancelled(status: OrderStatus) {
  return status === 'cancelled';
}

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const order = useOrderStore((s) => s.getById(id));

  if (!order) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <Package size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
          <h1 className="font-serif text-2xl sm:text-3xl mb-3">Order not found</h1>
          <p className="text-sm text-gray-500 mb-6">
            We couldn't find an order with ID <code className="bg-gray-100 px-1.5">{id}</code>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account"
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
            >
              Back to orders
            </Link>
            <Link
              to="/shop"
              className="px-6 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleCancel = () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    // Mock — flip status locally. Real cancel would call the store.
    useOrderStore.setState((state) => ({
      orders: state.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'cancelled',
              trackingHistory: [
                ...o.trackingHistory,
                { status: 'cancelled', timestamp: new Date().toISOString(), note: 'Cancelled by customer' },
              ],
            }
          : o
      ),
    }));
    showToast('Order cancelled', 'info');
  };

  const handleDownloadInvoice = () => {
    showToast('Preparing your invoice…', 'info');
    // Generate a tiny text invoice and trigger a download — keeps the UI honest about "mock".
    const lines = [
      `${BRAND.name.toUpperCase()}`,
      `${BRAND.tagline}`,
      '',
      `INVOICE`,
      `Order: ${order.id}`,
      `Date: ${new Date(order.date).toLocaleString('en-NG')}`,
      `Customer: ${order.customerName}`,
      `Email: ${order.customerEmail}`,
      `Phone: ${order.customerPhone}`,
      '',
      'ITEMS',
      ...order.items.map(
        (it) => `- ${it.name} (size ${it.size}, x${it.quantity}) — ${formatNaira(it.price * it.quantity)}`
      ),
      '',
      `Subtotal: ${formatNaira(order.subtotal)}`,
      `Delivery: ${formatNaira(order.deliveryFee)}`,
      `Total:    ${formatNaira(order.total)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Where in the timeline is this order?
  const currentIdx = isCancelled(order.status)
    ? -1
    : TIMELINE.findIndex((t) => t.key === order.status);
  const cancelled = isCancelled(order.status);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors mb-6"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">Order</p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              {order.id}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Placed on{' '}
              {new Date(order.date).toLocaleDateString('en-NG', {
                dateStyle: 'long',
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium ${STATUS_COLORS[order.status]}`}
          >
            {cancelled && <XCircle size={12} />}
            {!cancelled && <CheckCircle2 size={12} />}
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-10">
            {/* Items */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">
                Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
              <div className="border border-gray-200 divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="p-4 sm:p-5 flex gap-4">
                    <Link
                      to={`/shop/${item.productId}`}
                      className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        to={`/shop/${item.productId}`}
                        className="text-sm font-medium truncate hover:underline underline-offset-4"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold mt-auto pt-2">
                        {formatNaira(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tracking timeline */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">
                Tracking
              </h2>
              <div className="border border-gray-200 p-5 sm:p-6">
                {cancelled ? (
                  <div className="flex items-center gap-3 text-red-600">
                    <XCircle size={20} />
                    <div>
                      <p className="text-sm font-medium">This order was cancelled</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        No further tracking updates will be available.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ol className="relative space-y-6">
                    {TIMELINE.map((step, idx) => {
                      const reached = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const event = order.trackingHistory.find((e) => e.status === step.key);
                      const Icon = step.icon;
                      return (
                        <li key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-9 h-9 flex items-center justify-center border-2 transition-colors ${
                                reached
                                  ? 'bg-black border-black text-white'
                                  : 'border-gray-200 text-gray-300 bg-white'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            {idx < TIMELINE.length - 1 && (
                              <div
                                className={`w-0.5 flex-1 mt-1 ${
                                  idx < currentIdx ? 'bg-black' : 'bg-gray-200'
                                }`}
                                style={{ minHeight: '1.5rem' }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <p
                              className={`text-sm font-medium ${
                                reached ? 'text-black' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {event && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(event.timestamp).toLocaleString('en-NG', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            )}
                            {event?.note && (
                              <p className="text-xs text-gray-500 mt-1">{event.note}</p>
                            )}
                            {isCurrent && !event && (
                              <p className="text-xs text-gray-400 mt-0.5">In progress</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>

            {/* Customer-facing delivery OTP */}
            {order.status === 'processing' && order.deliveryOtp && (
              <section className="bg-white border border-black p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-1">Delivery code</p>
                <p className="text-sm text-gray-700 mb-3">
                  Show this 4-digit code to the rider when they arrive. It is also in your order email.
                </p>
                <p className="font-serif text-4xl font-light tracking-[0.4em] text-center">{order.deliveryOtp}</p>
              </section>
            )}
            {order.status === 'in_transit' && (
              <section className="bg-white border border-black p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-1">Rider is on the way</p>
                <p className="text-sm text-gray-700 mb-4">
                  When your rider arrives, they&apos;ll enter the 4-digit code from your order email to confirm delivery. You don&apos;t need to do anything.
                </p>
                {order.deliveryOtp && (
                  <p className="text-xs text-gray-500">Your code (for reference): <span className="font-mono font-medium">{order.deliveryOtp}</span></p>
                )}
              </section>
            )}

            {/* Actions */}
            <section className="flex flex-wrap gap-3">
              {order.status === 'processing' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-5 py-3 border border-red-500 text-red-500 text-xs uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-colors"
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              )}
              {(order.status === 'delivered' || order.status === 'in_transit') && (
                <Link
                  to="/returns"
                  className="inline-flex items-center gap-2 px-5 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={14} /> Request Return
                </Link>
              )}
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
              >
                <LifeBuoy size={14} /> Contact Support
              </Link>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-2 px-5 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
              >
                <Download size={14} /> Download Invoice
              </button>
            </section>
          </div>

          {/* Side column */}
          <aside className="space-y-6">
            {/* Shipping */}
            <section className="border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-gray-400" />
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
                  Shipping Address
                </h3>
              </div>
              <p className="text-sm font-medium">{order.customerName}</p>
              <p className="text-sm text-gray-500 mt-1">{order.shippingAddress.street}</p>
              <p className="text-sm text-gray-500">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-sm text-gray-400 mt-2">{order.customerPhone}</p>
              <p className="text-sm text-gray-400">{order.customerEmail}</p>
            </section>

            {/* Billing summary */}
            <section className="border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-gray-400" />
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
                  Billing Summary
                </h3>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd>{formatNaira(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd>{formatNaira(order.deliveryFee)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-base">
                  <dt>Total</dt>
                  <dd>{formatNaira(order.total)}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}