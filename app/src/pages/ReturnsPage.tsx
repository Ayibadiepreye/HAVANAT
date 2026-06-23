import { useState } from 'react';
import { ChevronDown, RefreshCw, Truck, Shield, Clock } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

const FAQS = [
  { q: 'What is your return policy?', a: 'We offer a 30-day return policy for all unworn items in original condition with tags attached. Items must be returned in their original packaging. Bespoke and customized items are non-returnable unless defective.' },
  { q: 'How do I initiate a return?', a: 'You can initiate a return by clicking the "Initiate a Return" button on this page or from your order history in your account. You will need your order number and the email used for purchase.' },
  { q: 'When will I receive my refund?', a: 'Refunds are processed within 5-7 business days after we receive your returned item. The refund will be credited to your original payment method. Bank transfers may take an additional 3-5 business days to reflect.' },
  { q: 'Can I exchange an item?', a: 'Yes, exchanges are available for different sizes of the same item. If the desired size is unavailable, we will issue a store credit or refund. Exchange shipping is free for defective or incorrectly shipped items.' },
  { q: 'What if my item arrives damaged?', a: 'If your item arrives damaged or defective, please contact us within 48 hours of delivery with photos of the damage. We will arrange a free replacement or full refund at no cost to you.' },
];

export default function ReturnsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Customer Care</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Returns & Exchange</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Hassle-free returns within 30 days. Your satisfaction is our priority.
        </p>
      </section>

      {/* Policy Highlights */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Clock, title: '30-Day Returns', desc: 'Return any unworn item within 30 days of delivery for a full refund or exchange.' },
            { icon: Truck, title: 'Free Return Shipping', desc: 'We cover return shipping costs for all defective or incorrect items.' },
            { icon: Shield, title: 'Quality Guarantee', desc: 'Every garment is inspected before shipping. If it fails our standards, we make it right.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 border border-gray-200 flex items-center justify-center">
                <Icon size={22} strokeWidth={1.5} className="text-gray-600" />
              </div>
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Content */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl mb-8">Return Policy Details</h2>
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-medium text-black mb-2">Eligibility</h3>
              <p>Items must be unworn, unwashed, and in original condition with all tags attached. Items must be returned in original packaging. Final sale items and bespoke/customized pieces are non-returnable unless defective.</p>
            </div>
            <div>
              <h3 className="font-medium text-black mb-2">Process</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Initiate your return through your account or using the button below.</li>
                <li>Package the item securely in its original packaging.</li>
                <li>Attach the provided return label (for eligible returns).</li>
                <li>Drop off at any of our partner logistics locations.</li>
                <li>Receive confirmation and refund within 5-7 business days.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-black mb-2">Refunds</h3>
              <p>Refunds will be issued to the original payment method. For bank transfers, please allow 3-5 additional business days. Store credits are available immediately upon return processing.</p>
            </div>
            <div>
              <h3 className="font-medium text-black mb-2">Exclusions</h3>
              <p>Bespoke and customized garments, gift cards, and items marked as &ldquo;Final Sale&rdquo; are not eligible for return unless defective. Undergarments and accessories cannot be returned for hygiene reasons.</p>
            </div>
          </div>

          <button
            onClick={() => openModal('return')}
            className="mt-10 px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={14} />
            INITIATE A RETURN
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center">Frequently Asked Questions</h2>
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
