import { useState } from 'react';
import { Check, ChevronDown, Star, Crown, Award } from 'lucide-react';
import { MEMBERSHIPS } from '@/data/mockData';
import { formatNaira } from '@/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

const FAQS = [
  { q: 'Can I change or cancel my membership?', a: 'Yes, you can upgrade, downgrade, or cancel your membership at any time from your account dashboard. Changes take effect at the start of your next billing cycle.' },
  { q: 'How do I access bespoke customization?', a: 'Bespoke customization is exclusively available to Elite members. Once you subscribe to the Elite tier, you can submit custom requests through the Bespoke page or chat with our team.' },
  { q: 'Are membership discounts stackable with sales?', a: 'Membership discounts cannot be combined with promotional sale prices. The greater discount will automatically be applied at checkout.' },
  { q: 'What is included in the quarterly gift box?', a: 'Deluxe and Elite members receive a curated box of premium accessories, garment care products, and exclusive Havanat merchandise every quarter.' },
  { q: 'How does the personal styling service work?', a: 'Elite members can book one-on-one virtual consultations with our professional stylists who will help you build a wardrobe tailored to your lifestyle and preferences.' },
];

export default function MembershipPage() {
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const allFeatures = Array.from(new Set(MEMBERSHIPS.flatMap((m) => m.features)));

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="relative bg-black text-white py-20 lg:py-28 text-center px-4">
        <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Membership Program</p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-6">Elevate Your Experience</h1>
        <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
          Join the Havanat membership club and unlock exclusive benefits, priority services, and bespoke experiences designed for those who demand the extraordinary.
        </p>
      </section>

      {/* Tier Cards */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">
          {MEMBERSHIPS.map((tier, idx) => {
            const Icon = idx === 0 ? Award : idx === 1 ? Star : Crown;
            return (
              <div
                key={tier.tier}
                className={`relative p-8 border ${
                  tier.isPopular ? 'border-black' : 'border-gray-200'
                }`}
              >
                {tier.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-[9px] tracking-[0.15em] font-semibold">
                    MOST POPULAR
                  </span>
                )}
                <div className="mb-6">
                  <Icon size={24} strokeWidth={1.5} className="text-gray-400 mb-4" />
                  <h3 className="font-serif text-2xl mb-1">{tier.tier}</h3>
                  <p className="text-sm text-gray-500">{tier.description}</p>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl font-semibold">
                    {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                  </span>
                  {tier.price > 0 && <span className="text-gray-400 text-sm">/{tier.billing}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check size={16} className="flex-shrink-0 mt-0.5 text-black" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {user?.membershipTier === tier.tier.toLowerCase() ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-100 text-gray-400 text-xs tracking-[0.15em] font-semibold cursor-default"
                  >
                    CURRENT PLAN
                  </button>
                ) : (
                  <button
                    onClick={() => showToast(`${tier.tier} subscription coming soon!`, 'info')}
                    className={`w-full py-3 text-xs tracking-[0.15em] font-semibold transition-colors ${
                      tier.isPopular
                        ? 'bg-black text-white hover:bg-black/80'
                        : 'border border-black text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {tier.price === 0 ? 'GET STARTED' : 'SUBSCRIBE'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-4 pr-6 text-xs tracking-[0.1em] font-semibold">FEATURE</th>
                  {MEMBERSHIPS.map((t) => (
                    <th key={t.tier} className="text-center py-4 px-4 text-xs tracking-[0.1em] font-semibold">
                      {t.tier.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature} className="border-b border-gray-200">
                    <td className="py-4 pr-6">{feature}</td>
                    {MEMBERSHIPS.map((tier) => (
                      <td key={tier.tier} className="text-center py-4 px-4">
                        {tier.features.includes(feature) ? (
                          <Check size={16} className="mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-4 pr-6 font-medium">Monthly Price</td>
                  {MEMBERSHIPS.map((tier) => (
                    <td key={tier.tier} className="text-center py-4 px-4 font-semibold">
                      {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
