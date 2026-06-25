import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { BRAND } from '@/config/brand';

interface Section { id: string; title: string; content: React.ReactNode }

const SECTIONS: Section[] = [
  {
    id: 'intro',
    title: '1. Who we are',
    content: (
      <>
        <p>
          {BRAND.name} is a Nigerian luxury fashion house. We design and make tailored suits, blazers,
          trousers, vests, outerwear, and bespoke pieces for working professionals, with our studio
          in {BRAND.contact.address}.
        </p>
        <p>
          This Privacy Policy explains what personal data we collect when you use {BRAND.name}&apos;s
          website, place an order, create an account, subscribe to our newsletter, or contact our
          concierge team.
        </p>
        <p>
          Our contact for privacy matters is our Data Protection Officer (DPO) at{' '}
          <a href="mailto:dpo@havanat.store" className="underline">dpo@havanat.store</a>.
        </p>
      </>
    ),
  },
  {
    id: 'collect',
    title: '2. What we collect',
    content: (
      <>
        <p>When you use our services, we collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account data</strong> — name, email, phone, password (hashed).</li>
          <li><strong>Order data</strong> — items purchased, delivery address, delivery state, payment reference (we never see your card number — that is handled by Paystack).</li>
          <li><strong>Usage data</strong> — pages visited, device type, browser, IP address, approximate city. This is collected only if you accept analytics cookies.</li>
          <li><strong>Communications</strong> — emails, WhatsApp messages, and customer-service chats you have with us.</li>
          <li><strong>Newsletter data</strong> — the email address you submit through the footer signup form.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    title: '3. What we use it for',
    content: (
      <ul className="list-disc pl-6 space-y-1">
        <li>To process and deliver your orders.</li>
        <li>To send order-related emails (confirmation, dispatch, delivery OTP, delivery confirmation).</li>
        <li>To handle returns, refunds, and customer support.</li>
        <li>To send you newsletters and broadcasts you have opted into. You can unsubscribe at any time.</li>
        <li>To prevent fraud and keep our platform secure.</li>
        <li>To improve our products and website (anonymised analytics only — never sold to third parties).</li>
      </ul>
    ),
  },
  {
    id: 'rights',
    title: '4. Your rights under the Nigeria Data Protection Act 2023',
    content: (
      <>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Right of access</strong> — request a copy of all personal data we hold on you.</li>
          <li><strong>Right to rectify</strong> — correct any inaccurate or incomplete data.</li>
          <li><strong>Right to erase</strong> — ask us to delete your data, subject to legal retention requirements.</li>
          <li><strong>Right to restrict processing</strong> — ask us to pause certain processing while we investigate a complaint.</li>
          <li><strong>Right to data portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li><strong>Right to object</strong> — object to processing for direct marketing, profiling, or legitimate-interest claims.</li>
          <li><strong>Right to withdraw consent</strong> — withdraw your consent at any time, without affecting prior processing.</li>
          <li><strong>Right to lodge a complaint</strong> — with the Nigeria Data Protection Commission (NDPC) at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="underline">ndpc.gov.ng</a>.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, email <a href="mailto:dpo@havanat.store" className="underline">dpo@havanat.store</a>.
          We respond within 30 days as required by the NDP Act 2023.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '5. How long we keep your data',
    content: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-2 font-medium">Data type</th><th className="text-left p-2 font-medium">Retention period</th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-200"><td className="p-2">Account data</td><td className="p-2">5 years after account closure</td></tr>
            <tr className="border-t border-gray-200"><td className="p-2">Order data</td><td className="p-2">7 years (per Nigerian tax law)</td></tr>
            <tr className="border-t border-gray-200"><td className="p-2">Marketing &amp; newsletter data</td><td className="p-2">Until you unsubscribe or withdraw consent</td></tr>
            <tr className="border-t border-gray-200"><td className="p-2">Analytics data</td><td className="p-2">14 months</td></tr>
            <tr className="border-t border-gray-200"><td className="p-2">Support chat transcripts</td><td className="p-2">2 years after last contact</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '6. Cookies and consent',
    content: (
      <>
        <p>We use cookies in three categories. You can change your preferences at any time via the cookie banner.</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li><strong>Essential</strong> — required for the site to function (cart, login). Always on.</li>
          <li><strong>Analytics</strong> — anonymised usage stats. Opt-in.</li>
          <li><strong>Marketing</strong> — only if we ever run third-party ad campaigns. Currently not in use. Opt-in.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'breach',
    title: '7. Data breach notification',
    content: (
      <p>
        In the event of a data breach that poses a risk to your rights and freedoms, we will notify
        the Nigeria Data Protection Commission (NDPC) within 72 hours and affected users without undue
        delay, in line with the NDP Act 2023.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: '8. Who we share data with',
    content: (
      <>
        <p>We never sell your data. We only share what is strictly necessary to deliver our service:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Paystack</strong> — for card payment processing.</li>
          <li><strong>Resend</strong> — for transactional and broadcast email.</li>
          <li><strong>Cloud hosting (S3 / Vercel / Railway)</strong> — for product images and order data.</li>
          <li><strong>Riders</strong> — your name, phone, and delivery address, shared only after dispatch.</li>
        </ul>
        <p className="mt-2">All processors are bound by data-processing agreements consistent with the NDP Act 2023.</p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: '9. International data transfers',
    content: (
      <p>
        Some of our processors (Resend, Vercel, Railway) are based outside Nigeria. Where we transfer
        personal data internationally, we rely on adequacy decisions, standard contractual clauses,
        or the processor&apos;s binding corporate rules — and only transfer the minimum data necessary.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to this policy',
    content: (
      <p>
        We may update this policy from time to time. Material changes will be announced by email
        and via a banner on the site. The &ldquo;last updated&rdquo; date at the bottom of this page reflects the
        most recent revision.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '11. Contact us',
    content: (
      <>
        <p>For any privacy question, contact our Data Protection Officer:</p>
        <ul className="list-none space-y-1 mt-2">
          <li><strong>Email:</strong> <a href="mailto:dpo@havanat.store" className="underline">dpo@havanat.store</a></li>
          <li><strong>Phone:</strong> {BRAND.contact.phone}</li>
          <li><strong>Address:</strong> {BRAND.contact.address}</li>
        </ul>
        <p className="mt-3">
          You may also lodge a complaint with the NDPC at{' '}
          <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="underline">ndpc.gov.ng</a>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  const [open, setOpen] = useState<string | null>('intro');
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl mx-auto">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Legal</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: June 2026 &middot; Effective immediately</p>

        <div className="space-y-2">
          {SECTIONS.map((s) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} className="border border-gray-200">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-sm">{s.title}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-gray-600 space-y-2 leading-relaxed">
                    {s.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-3 text-sm">
          <Link to="/terms" className="text-gray-500 hover:text-black underline">Terms of Service</Link>
          <span className="text-gray-300">·</span>
          <Link to="/contact" className="text-gray-500 hover:text-black underline">Contact us</Link>
        </div>
      </div>
    </main>
  );
}