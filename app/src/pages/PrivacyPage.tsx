import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { BRAND } from '@/config/brand';

interface Section {
  id: string;
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'information',
    title: '1. Information We Collect',
    body: [
      'We collect information you provide when creating an account, placing an order, or contacting our concierge — including your name, email, phone number, delivery address, and payment details.',
      'We also collect usage data automatically when you visit havanat.store: pages viewed, products browsed, referral source, device type, and approximate location (derived from IP address).',
    ],
  },
  {
    id: 'use',
    title: '2. How We Use Your Information',
    body: [
      'Your information is used to process orders, deliver products, prevent fraud, personalise your shopping experience, and (with your consent) send you marketing communications about new collections and offers.',
      'We never sell your personal data to third parties. Aggregated, de-identified analytics may be shared with brand partners — but this data cannot be traced back to you as an individual.',
    ],
  },
  {
    id: 'cookies',
    title: '3. Cookies & Similar Technologies',
    body: [
      'We use first-party cookies to keep you signed in, remember your cart, and remember your size preferences. We also use a small number of trusted third-party analytics services.',
      'You can disable cookies in your browser at any time; doing so may affect certain features such as the cart and checkout. See our Cookie Notice for a full list of cookies in use.',
    ],
  },
  {
    id: 'sharing',
    title: '4. Sharing of Information',
    body: [
      'We share your information only with the parties necessary to fulfil your order: payment processors, courier and logistics partners, and (for international shipments) customs authorities.',
      'All third parties are bound by data-processing agreements consistent with the Nigeria Data Protection Regulation (NDPR) and applicable international standards.',
    ],
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    body: [
      'We retain order records for a minimum of seven years to comply with Nigerian tax and accounting law. Account profile data is retained for as long as your account is active.',
      'If you wish to delete your account, you may do so from your account dashboard or by emailing our concierge. We will erase personal data within 30 days, subject to legal retention obligations.',
    ],
  },
  {
    id: 'rights',
    title: '6. Your Rights',
    body: [
      'You have the right to access, correct, port, and delete the personal data we hold about you. You may also object to or restrict certain processing activities.',
      'To exercise any of these rights, contact us at the address below. We will respond within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Nigeria Data Protection Commission.',
    ],
  },
  {
    id: 'security',
    title: '7. Security',
    body: [
      'All payment transactions are encrypted using TLS 1.3. Sensitive data at rest is encrypted using AES-256. Access to personal data is restricted on a need-to-know basis and logged.',
      'No system is perfectly secure, but we continuously invest in safeguards, monitoring, and staff training to protect your information to the highest practical standard.',
    ],
  },
  {
    id: 'contact',
    title: '8. Contact',
    body: [
      'For privacy-related questions, please contact our Data Protection Officer:',
      `${BRAND.contact.email} · ${BRAND.contact.phone}`,
      `Postal: ${BRAND.contact.address}`,
    ],
  },
];

export default function PrivacyPage() {
  const [openId, setOpenId] = useState<string | null>('information');

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Legal</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Privacy Policy</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Your privacy matters. This policy explains what we collect, how we use it, and the rights you
          have over your data.
        </p>
        <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-6">
          Last updated: January 2026
        </p>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          {/* Table of contents (desktop) */}
          <aside className="hidden lg:block">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Contents</p>
            <ul className="space-y-2 text-sm sticky top-28">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-gray-500 hover:text-black transition-colors block py-1"
                  >
                    {s.title.replace(/^\d+\.\s*/, '')}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Sections */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 p-6 sm:p-8 mb-8">
              <h2 className="font-serif text-2xl mb-3">Our Commitment</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                At {BRAND.name}, we are committed to protecting your personal information and respecting
                your right to privacy. This Privacy Policy is written in plain language and outlines our
                practices in line with the Nigeria Data Protection Regulation (NDPR) and other
                applicable laws.
              </p>
            </div>

            {SECTIONS.map((s) => {
              const isOpen = openId === s.id;
              return (
                <div key={s.id} id={s.id} className="border border-gray-200 scroll-mt-28">
                  <button
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-[#f0f3f5]/40 transition-colors"
                  >
                    <h3 className="font-serif text-lg sm:text-xl pr-4">{s.title}</h3>
                    <ChevronDown
                      size={18}
                      className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-6 space-y-3">
                      {s.body.map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-black text-white p-6 sm:p-8 mt-10 text-center">
              <p className="text-sm text-white/70 mb-4">Questions about this policy?</p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-xs tracking-[0.2em] font-medium hover:bg-white/90 transition-colors"
              >
                CONTACT US
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
