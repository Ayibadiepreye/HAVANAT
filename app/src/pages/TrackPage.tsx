import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, CheckCircle2, Truck, MapPin, Phone, ArrowRight, Clock } from 'lucide-react';

type OrderStatus = 'received' | 'processing' | 'in_transit' | 'delivered';

interface TrackingEvent {
  time: string;
  date: string;
  label: string;
  location: string;
  status: 'done' | 'active' | 'pending';
}

interface MockResult {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  rider: { name: string; phone: string; vehicle: string };
  deliveredAt?: string;
  eta?: string;
  destination: string;
  events: TrackingEvent[];
}

const MOCK_DATA: MockResult = {
  orderNumber: 'HVN-2026-0142',
  status: 'in_transit',
  statusLabel: 'Out for Delivery',
  rider: {
    name: 'Tunde Bakare',
    phone: '+234 803 555 0188',
    vehicle: 'Route 4 · Motorcycle · KJA-482-QG',
  },
  eta: 'Today by 5:30 PM WAT',
  destination: '12B Bishop Aboyade Cole, Victoria Island, Lagos',
  events: [
    {
      time: '08:42 AM',
      date: 'Today',
      label: 'Out for Delivery — Rider dispatched',
      location: 'Lagos Sorting Hub, Ikeja',
      status: 'active',
    },
    {
      time: '11:15 PM',
      date: 'Yesterday',
      label: 'Arrived at Lagos Hub',
      location: 'Lagos Sorting Hub, Ikeja',
      status: 'done',
    },
    {
      time: '04:30 PM',
      date: 'Yesterday',
      label: 'Picked up by courier in Abuja',
      location: 'Abuja Distribution Centre',
      status: 'done',
    },
    {
      time: '09:12 AM',
      date: '2 days ago',
      label: 'Order packed and quality-checked',
      location: 'Havanat Atelier, Lagos',
      status: 'done',
    },
  ],
};

export default function TrackPage() {
  const [orderInput, setOrderInput] = useState('');
  const [result, setResult] = useState<MockResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const trimmed = orderInput.trim();
    if (!trimmed) {
      setError('Please enter an order number.');
      return;
    }
    setLoading(true);
    // Simulate an API lookup with a short delay
    window.setTimeout(() => {
      setResult({ ...MOCK_DATA, orderNumber: trimmed });
      setLoading(false);
    }, 700);
  };

  const handleReset = () => {
    setResult(null);
    setOrderInput('');
    setError('');
  };

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
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              placeholder="HVN-2026-0142"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
              aria-label="Order number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-black text-white text-xs tracking-[0.2em] font-medium hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>SEARCHING…</>
            ) : (
              <>
                TRACK ORDER <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-4">
          Try a sample: HVN-2026-0142
        </p>
      </section>

      {/* Result */}
      {result && (
        <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-5xl mx-auto">
            {/* Status header */}
            <div className="bg-black text-white p-8 sm:p-10 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-2">Order Number</p>
                <h2 className="font-serif text-2xl sm:text-3xl mb-3">{result.orderNumber}</h2>
                <div className="flex items-center gap-3">
                  {result.status === 'processing' && <Clock size={16} className="text-white/60" />}
                  {result.status === 'in_transit' && <Truck size={16} className="text-white" />}
                  {result.status === 'received' && <Clock size={16} className="text-white/60" />}
                  {result.status === 'delivered' && <CheckCircle2 size={16} className="text-green-400" />}
                  <span className="text-sm font-medium">{result.statusLabel}</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                {result.eta && (
                  <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">Estimated Arrival</p>
                )}
                {result.deliveredAt && (
                  <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">Delivered</p>
                )}
                <p className="font-serif text-xl">{result.eta ?? result.deliveredAt}</p>
              </div>
            </div>

            {/* Rider / Destination grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Truck size={20} strokeWidth={1.5} className="text-gray-700" />
                  <h3 className="font-serif text-xl">Your Rider</h3>
                </div>
                <p className="text-sm font-medium">{result.rider.name}</p>
                <p className="text-xs text-gray-500 mt-1 mb-5">{result.rider.vehicle}</p>
                <a
                  href={`tel:${result.rider.phone}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[10px] tracking-[0.2em] font-medium hover:bg-black/80 transition-colors"
                >
                  <Phone size={13} />
                  CONTACT RIDER
                </a>
              </div>

              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin size={20} strokeWidth={1.5} className="text-gray-700" />
                  <h3 className="font-serif text-xl">Delivering To</h3>
                </div>
                <p className="text-sm text-gray-700">{result.destination}</p>
                <p className="text-xs text-gray-500 mt-4">
                  You can update delivery instructions from your account dashboard.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 p-6 sm:p-10">
              <div className="flex items-center gap-3 mb-8">
                <Package size={20} strokeWidth={1.5} className="text-gray-700" />
                <h3 className="font-serif text-xl">Tracking Timeline</h3>
              </div>

              <ol className="space-y-6">
                {result.events.map((ev, i) => (
                  <li key={i} className="flex gap-5">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span
                        className={`w-3 h-3 rounded-full border-2 ${
                          ev.status === 'active'
                            ? 'bg-black border-black'
                            : ev.status === 'done'
                            ? 'bg-black border-black'
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      {i < result.events.length - 1 && (
                        <span className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: '32px' }} />
                      )}
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                        <p className="text-sm font-medium">{ev.label}</p>
                        <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
                          {ev.date} · {ev.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ev.location}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 border border-black text-black text-xs tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors"
              >
                TRACK ANOTHER ORDER
              </button>
              <Link
                to="/contact"
                className="text-xs tracking-[0.2em] underline underline-offset-4"
              >
                NEED HELP?
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state helper */}
      {!result && (
        <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <Package size={36} strokeWidth={1.2} className="mx-auto mb-5 text-gray-400" />
            <h2 className="font-serif text-2xl mb-3">Where is my order number?</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
              Your order number was included in the confirmation email and SMS sent when your order
              shipped. It begins with HVN- and looks like{' '}
              <span className="font-mono text-black">HVN-2026-0142</span>.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
