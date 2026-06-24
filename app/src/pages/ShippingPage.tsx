import { Link } from 'react-router-dom';
import { Truck, MapPin, Clock, Globe, Package, ShieldCheck, ArrowRight } from 'lucide-react';
import { BRAND } from '@/config/brand';

const ZONES = [
  {
    city: 'Lagos',
    eta: '1 – 2 business days',
    note: 'Same-day dispatch on orders placed before 2 PM WAT.',
  },
  {
    city: 'Abuja',
    eta: '2 – 3 business days',
    note: 'Inter-state courier; no signature required by default.',
  },
  {
    city: 'Other Nigerian States',
    eta: '3 – 5 business days',
    note: 'Including Port Harcourt, Ibadan, Kano, Enugu and Benin City.',
  },
];

const FEES = [
  { method: 'Standard', time: '3 – 5 business days', fee: '₦1,500', note: 'Free on orders over ₦250,000' },
  { method: 'Express', time: '1 – 2 business days (Lagos / Abuja)', fee: '₦3,500', note: 'Available at checkout' },
  { method: 'Same-Day (Lagos only)', time: 'Order by 12 PM WAT', fee: '₦5,500', note: 'Selected postcodes only' },
  { method: 'International', time: '5 – 10 business days', fee: 'Quoted', note: 'Duties paid by recipient' },
];

export default function ShippingPage() {
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Customer Care</p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4">Shipping & Delivery</h1>
        <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
          From our atelier in Lagos to your door — nationwide and beyond, with care.
        </p>
      </section>

      {/* Delivery Zones */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Where We Ship</p>
            <h2 className="font-serif text-3xl sm:text-4xl">Delivery Zones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {ZONES.map((z) => (
              <div key={z.city} className="bg-white border border-gray-200 p-8 hover:border-black transition-colors duration-300">
                <MapPin size={22} strokeWidth={1.5} className="text-gray-600 mb-5" />
                <h3 className="font-serif text-2xl mb-2">{z.city}</h3>
                <p className="text-sm font-medium mb-3">{z.eta}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{z.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Fees Table */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Rates</p>
            <h2 className="font-serif text-3xl sm:text-4xl">Shipping Fees</h2>
            <p className="text-gray-500 text-sm mt-4 max-w-md mx-auto">
              Free standard shipping on orders over ₦250,000 — anywhere in Nigeria.
            </p>
          </div>

          <div className="bg-white border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Method</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Time</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Fee</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {FEES.map((row) => (
                  <tr key={row.method} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 px-6 font-medium">{row.method}</td>
                    <td className="py-4 px-6 text-gray-600">{row.time}</td>
                    <td className="py-4 px-6 font-semibold">{row.fee}</td>
                    <td className="py-4 px-6 text-gray-500 hidden sm:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Prices are inclusive of VAT. Bespoke items may require additional production time before shipping.
          </p>
        </div>
      </section>

      {/* Tracking */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Stay in the Loop</p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-6">Real-Time Order Tracking</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Once your order ships you will receive an SMS and email with a tracking number. Use the
              link in that message — or our dedicated Track Order page — to follow your package at every
              stage, from dispatch to delivery.
            </p>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              <li className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                All shipments are insured up to ₦5,000,000.
              </li>
              <li className="flex items-start gap-3">
                <Package size={16} className="mt-0.5 flex-shrink-0" />
                Discreet packaging — no external branding.
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                Delivery attempts: 2 within 48 hours.
              </li>
            </ul>
            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs tracking-[0.2em] font-medium hover:bg-black/80 transition-colors"
            >
              TRACK YOUR ORDER <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-[#f0f3f5] p-8 sm:p-10">
            <Truck size={32} strokeWidth={1.2} className="mb-6 text-gray-700" />
            <ol className="space-y-5">
              {[
                { t: 'Order Confirmed', d: 'Email + SMS confirmation with order number.' },
                { t: 'Processing', d: 'Your garment is picked, quality-checked, and packed.' },
                { t: 'Dispatched', d: 'Handed to our logistics partner with a tracking number.' },
                { t: 'Out for Delivery', d: 'Rider receives your package and starts the route.' },
                { t: 'Delivered', d: 'Signed for at your door or pickup point.' },
              ].map((step, i) => (
                <li key={step.t} className="flex gap-4">
                  <span className="font-serif text-xl text-gray-400 flex-shrink-0 w-8">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-medium text-sm">{step.t}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* International note */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-4xl mx-auto text-center">
          <Globe size={28} strokeWidth={1.3} className="mx-auto mb-5 text-gray-700" />
          <h2 className="font-serif text-2xl sm:text-3xl mb-4">Shipping Outside Nigeria</h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-6 text-sm">
            We ship to selected international destinations on a quote basis. International orders are
            dispatched via DHL Express and typically arrive within 5–10 business days. Import duties and
            local taxes — where applicable — are the responsibility of the recipient. To request a quote,
            please reach out to our concierge.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] underline underline-offset-4 hover:opacity-60 transition-opacity"
          >
            CONTACT CONCIERGE
          </Link>
        </div>
      </section>

      {/* Help CTA */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 text-center">
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Questions about your shipment? Our concierge team is one message away.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link
            to="/faq"
            className="px-8 py-3 border border-black text-black text-xs tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors"
          >
            VISIT FAQ
          </Link>
          <a
            href={`mailto:${BRAND.contact.email}`}
            className="text-xs tracking-[0.2em] underline underline-offset-4"
          >
            {BRAND.contact.email}
          </a>
        </div>
      </section>
    </main>
  );
}
