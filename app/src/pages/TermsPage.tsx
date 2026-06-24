import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';

interface Section {
  id: string;
  title: string;
  paragraphs: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing or using the Havanat website, mobile experience, or any associated service (collectively, the "Service"), you agree to be bound by these Terms of Service.',
      'If you do not agree with any part of these terms, you must discontinue use of the Service. We reserve the right to update these terms at any time; material changes will be communicated via email or on-site notice.',
    ],
  },
  {
    id: 'account',
    title: '2. Your Account',
    paragraphs: [
      'To place an order or access membership features, you must create an account. You agree to provide accurate, current, and complete information and to keep it updated.',
      'You are responsible for safeguarding your password and for all activity that occurs under your account. Notify us immediately at concierge@havanat.ng if you suspect any unauthorised access.',
    ],
  },
  {
    id: 'orders',
    title: '3. Orders & Payment',
    paragraphs: [
      'All orders are subject to acceptance and product availability. We reserve the right to cancel any order, including for suspected fraud, pricing errors, or stock limitations, with a full refund issued.',
      'Payment may be made by card, bank transfer, or pay-on-delivery (Lagos only). Pay-on-delivery orders may require a small confirmation deposit.',
    ],
  },
  {
    id: 'pricing',
    title: '4. Pricing & Currency',
    paragraphs: [
      'All prices are listed in Nigerian Naira (₦) and are inclusive of VAT unless otherwise stated. Delivery fees are calculated at checkout based on your delivery address and chosen shipping method.',
      'Despite our best efforts, occasional pricing errors may occur. We reserve the right to correct such errors and to cancel any order placed at an incorrect price, with a full refund.',
    ],
  },
  {
    id: 'shipping',
    title: '5. Shipping & Delivery',
    paragraphs: [
      'We ship nationwide in Nigeria and to selected international destinations. Delivery timeframes are estimates and commence from the date of dispatch, not the date of order.',
      'Risk of loss and title for items pass to you upon delivery to the carrier. For full details, please review our Shipping & Delivery policy.',
    ],
  },
  {
    id: 'returns',
    title: '6. Returns & Refunds',
    paragraphs: [
      'Unworn items in original condition may be returned within 30 days of delivery for a refund or exchange. Bespoke, customised, and final-sale items are non-returnable unless defective.',
      'Refunds are processed to the original payment method within 5–7 business days of receiving the returned item. See our Returns & Exchange page for full details.',
    ],
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    paragraphs: [
      'All content on this site — including text, graphics, logos, images, product designs, and software — is the property of Havanat or its licensors and is protected by Nigerian and international copyright law.',
      'You may view and download a single copy of site materials for personal, non-commercial use only. Any other reproduction, modification, or distribution requires our prior written consent.',
    ],
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by law, Havanat shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service or any product purchased.',
      'Our total liability for any claim relating to a product shall not exceed the purchase price of that product. Nothing in these terms excludes liability that cannot be excluded under Nigerian law.',
    ],
  },
  {
    id: 'law',
    title: '9. Governing Law',
    paragraphs: [
      'These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.',
      'Any dispute arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.',
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    paragraphs: [
      'For questions about these terms, please contact our concierge team:',
      `${BRAND.contact.email} · ${BRAND.contact.phone}`,
      `Postal: ${BRAND.contact.address}`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Legal</p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4">Terms of Service</h1>
        <p className="text-white/50 max-w-xl mx-auto text-sm">
          The agreement between you and {BRAND.name} for the use of our website and services.
        </p>
        <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase mt-6">
          Last updated: January 2026
        </p>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          {/* TOC */}
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

          <div>
            <div className="bg-white border border-gray-200 p-6 sm:p-8 mb-10">
              <h2 className="font-serif text-2xl mb-3">Welcome to {BRAND.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                These terms exist to keep our community safe and to make sure expectations are clear on
                both sides. Please take a moment to read them. They cover account use, orders, payment,
                shipping, returns, intellectual property, liability, governing law, and how to reach us.
              </p>
            </div>

            <div className="space-y-10">
              {SECTIONS.map((s) => (
                <article key={s.id} id={s.id} className="scroll-mt-28">
                  <h3 className="font-serif text-xl sm:text-2xl mb-4">{s.title}</h3>
                  <div className="space-y-3">
                    {s.paragraphs.map((p, i) => (
                      <p key={i} className="text-sm text-gray-600 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="bg-black text-white p-6 sm:p-8 mt-12 text-center">
              <p className="text-sm text-white/70 mb-4">Have a question about these terms?</p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-xs tracking-[0.2em] font-medium hover:bg-white/90 transition-colors"
              >
                GET IN TOUCH
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
