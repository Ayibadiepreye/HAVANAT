import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, CheckCircle2, Truck, Phone, Clock } from 'lucide-react';
import { apiGet } from '@/lib/api';

type OrderStatus = 'received' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

interface TrackingEvent {
  status: string;
  timestamp: string;
  note?: string;
}

interface TrackingDestination {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
}

interface TrackingResponse {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  destination: TrackingDestination;
  tracking: TrackingEvent[];
  rider: { name: string; phone: string } | null;
}

interface DisplayEvent {
  time: string;
  date: string;
  label: string;
  location: string;
  status: 'done' | 'active' | 'pending';
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'Order Received',
  processing: 'Processing',
  in_transit: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function mapTrackingEvents(tracking: TrackingEvent[]): DisplayEvent[] {
  if (!tracking || tracking.length === 0) return [];
  return tracking.map((t, idx) => ({
    time: formatTime(t.timestamp),
    date: formatDate(t.timestamp),
    label: t.note || t.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    location: 'Havanat Atelier',
    status: idx === tracking.length - 1 ? 'active' : 'done',
  }));
}

export default function TrackPage() {
  const [orderInput, setOrderInput] = useState('');
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const trimmed = orderInput.trim();
    if (!trimmed) {
      setError('Please enter an order number.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet<TrackingResponse>(`/api/orders/track/${encodeURIComponent(trimmed)}`);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Order not found. Please check your order number and try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrderInput('');
    setError('');
  };

  const displayEvents = result ? mapTrackingEvents(result.tracking) : [];
  const statusLabel = result ? (STATUS_LABEL[result.status] || result.status) : '';

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Order Tracking</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Track Your Order</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Enter your Havanat order number to see the current status, the rider on its way, and a full
          tracking timeline.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto mt-10 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="e.g. ORD-2026-930156"
            className="flex-1 px-5 py-3.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-black transition-colors text-center sm:text-left"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-black text-white text-[10px] tracking-[0.25em] font-semibold hover:bg-black/80 transition-colors uppercase disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track order'}
          </button>
        </form>
        {error && <p className="text-red-600 text-xs mt-4">{error}</p>}
      </section>

      {/* Result */}
      {result && (
        <section className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Status banner */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8 mb-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-2">Order Number</p>
                  <p className="font-serif text-2xl">{result.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  {result.status === 'delivered' ? (
                    <CheckCircle2 className="text-black" size={28} />
                  ) : result.status === 'in_transit' ? (
                    <Truck className="text-black" size={28} />
                  ) : (
                    <Package className="text-black" size={28} />
                  )}
                  <span className="font-serif text-xl">{statusLabel}</span>
                </div>
              </div>
            </div>

            {/* Rider + destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {result.rider && (
                <div className="bg-white border border-gray-200 p-6">
                  <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Your Rider</p>
                  <p className="font-serif text-lg mb-2">{result.rider.name}</p>
                  <a
                    href={`tel:${result.rider.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    <Phone size={14} />
                    {result.rider.phone}
                  </a>
                </div>
              )}
              {result.destination && (
                <div className="bg-white border border-gray-200 p-6">
                  <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Delivering To</p>
                  <p className="text-sm leading-relaxed">
                    {result.destination.fullName}<br />
                    {result.destination.street}<br />
                    {result.destination.city}, {result.destination.state}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            {displayEvents.length > 0 && (
              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-6">Tracking Timeline</p>
                <div className="space-y-6">
                  {displayEvents.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            event.status === 'active' ? 'bg-black' : 'bg-gray-300'
                          }`}
                        />
                        {idx < displayEvents.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-2" style={{ minHeight: '40px' }} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                          <p className="font-medium text-sm">{event.label}</p>
                          <p className="text-xs text-gray-500">
                            <Clock size={11} className="inline mr-1" />
                            {event.date} · {event.time}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-xs tracking-[0.25em] uppercase underline text-gray-500 hover:text-black transition-colors"
              >
                Track another order
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty state help */}
      {!result && !loading && !error && (
        <section className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Search className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-sm text-gray-500 leading-relaxed">
              Your order number can be found in your order confirmation email. It begins with{' '}
              <span className="font-mono text-black">ORD-</span>.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Need help?{' '}
              <Link to="/contact" className="text-black underline">
                Contact our concierge
              </Link>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}