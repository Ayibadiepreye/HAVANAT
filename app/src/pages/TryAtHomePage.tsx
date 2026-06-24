import { useState } from 'react';
import { Check, MapPin } from 'lucide-react';

const TIME_SLOTS = [
  '09:00 – 11:00',
  '11:00 – 13:00',
  '13:00 – 15:00',
  '15:00 – 17:00',
  '17:00 – 19:00',
];

// Available days: next 14 days, excluding Sundays (Havanat studio is closed)
const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  if (d.getDay() === 0) return null; // skip Sunday
  return d.toISOString().slice(0, 10);
}).filter(Boolean) as string[];

interface BookingData {
  name: string;
  email: string;
  phone: string;
  occasion: string;
  products: string[];
  preferredDate: string;
  preferredSlot: string;
  address: string;
  notes: string;
}

export default function TryAtHomePage() {
  const [step, setStep] = useState<'intro' | 'form' | 'confirmed'>('intro');
  const [form, setForm] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    occasion: 'corporate',
    products: [],
    preferredDate: DAYS[0] ?? '',
    preferredSlot: TIME_SLOTS[0],
    address: '',
    notes: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStep('confirmed');
  }

  if (step === 'confirmed') {
    return (
      <main className="min-h-screen pt-20 lg:pt-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
          <div className="w-14 h-14 mx-auto mb-6 bg-black text-white flex items-center justify-center">
            <Check className="h-7 w-7" />
          </div>
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Booking Confirmed</p>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Your fitting is scheduled</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            We&apos;ll send a reminder to <strong>{form.email}</strong> the day before. Our fitter will call{' '}
            <strong>{form.phone}</strong> when they&apos;re 30 minutes away.
          </p>
          <div className="bg-white border border-gray-200 p-6 text-left space-y-2 text-sm mb-8">
            <p><strong>Date:</strong> {new Date(form.preferredDate).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p><strong>Time:</strong> {form.preferredSlot}</p>
            <p><strong>Address:</strong> {form.address}</p>
            <p><strong>Occasion:</strong> {form.occasion}</p>
            <p><strong>Pieces to bring:</strong> {form.products.length || 'No specific items — open to suggestions'}</p>
          </div>
          <a href="/shop" className="inline-flex items-center px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900">
            Continue Browsing
          </a>
        </div>
      </main>
    );
  }

  if (step === 'intro') {
    return (
      <main className="min-h-screen pt-20 lg:pt-24 bg-white">
        <section className="bg-black text-white py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-4">Havanat Service</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light mb-6">Try at Home</h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
              Book a private fitting. Our fitter brings up to 6 pieces to your home or office, you keep what fits and love.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <PillarStep number="01" title="Choose your day" desc="Pick a 2-hour window in the next 14 days. Sundays excluded." />
            <PillarStep number="02" title="Tell us what you need" desc="Pick the occasion and which pieces you'd like to try (optional)." />
            <PillarStep number="03" title="We come to you" desc="A fitter brings up to 6 pieces. You keep what fits — only pay for what you keep." />
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl mb-2">Service Area</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Try-at-home is currently available in <strong>Port Harcourt</strong>, <strong>Abuja</strong>, and <strong>Lagos</strong>.
                  Service outside these cities is coming — leave us a note below if you&apos;d like to be notified when we reach your area.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f3f5] p-6 sm:p-8 mb-12">
            <h3 className="font-serif text-xl mb-4">What the appointment includes</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Up to 6 pieces brought to your door — suits, blazers, trousers, outerwear</li>
              <li>• 90 minutes with a master fitter — measurements, alterations discussed on the spot</li>
              <li>• Honest style advice tailored to the occasion you&apos;re dressing for</li>
              <li>• Pay only for what you keep. No appointment fee.</li>
              <li>• ₦5,000 minimum spend waived for first-time customers</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('form')}
              className="inline-flex items-center px-10 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gray-900"
            >
              Book Your Fitting
            </button>
            <p className="text-xs text-gray-500 mt-4">No payment required to book. We'll confirm by phone within 2 hours.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <button onClick={() => setStep('intro')} className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black mb-4">
          ← Back
        </button>
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-2">Book Your Fitting</p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-2">Try at Home</h1>
        <p className="text-sm text-gray-500 mb-8">Tell us a little about what you&apos;re looking for.</p>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 ..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              />
            </Field>
          </div>

          <Field label="Email" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
            />
          </Field>

          <Field label="Occasion" required>
            <select
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
            >
              <option value="corporate">Corporate / Work</option>
              <option value="formal-event">Formal Event (Wedding / Gala)</option>
              <option value="social">Social (Party / Dinner)</option>
              <option value="everyday">Everyday / Smart Casual</option>
            </select>
          </Field>

          <Field label="Delivery Address" required hint="Where should we come?">
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, city, state"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Preferred Date" required>
              <select
                value={form.preferredDate}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Time Slot" required>
              <select
                value={form.preferredSlot}
                onChange={(e) => setForm({ ...form, preferredSlot: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes (optional)" hint="Style preferences, fit concerns, accessibility needs, etc.">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white resize-none"
            />
          </Field>

          <button
            type="submit"
            className="w-full bg-black text-white py-3.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 mt-4"
          >
            Confirm Booking
          </button>
          <p className="text-xs text-gray-500 text-center">
            By booking, you agree to our <a href="/terms" className="underline">Terms</a> and acknowledge our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">
        {label}{required && ' *'}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function PillarStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-2">Step {number}</p>
      <h3 className="font-serif text-xl mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}