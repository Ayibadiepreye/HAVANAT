import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, MessageCircle } from 'lucide-react';
import { BRAND } from '@/config/brand';

type Category = 'Orders' | 'Shipping' | 'Returns' | 'Membership' | 'Bespoke' | 'Account';

interface FAQ {
  question: string;
  answer: string;
  category: Category;
}

const FAQS: FAQ[] = [
  // Orders
  {
    category: 'Orders',
    question: 'How do I place an order on Havanat?',
    answer:
      'Browse our collection at /shop, choose your size and preferred colour, then click "Add to Cart". When you are ready, open the cart drawer or visit /cart, review your items, and proceed to checkout. You can pay by card, bank transfer, or pay-on-delivery within Lagos.',
  },
  {
    category: 'Orders',
    question: 'Can I change or cancel my order after placing it?',
    answer:
      'Yes — but only while the order is still in the "Processing" stage. Open your account dashboard, locate the order, and use the "Cancel" action. Once the order has been dispatched, please use our returns process instead.',
  },
  {
    category: 'Orders',
    question: 'Will I receive an order confirmation?',
    answer:
      'Yes. An email confirmation is sent to the address you provided at checkout, followed by an SMS with your tracking number once the order ships. If you do not see either within 30 minutes, check your spam folder or contact our concierge.',
  },

  // Shipping
  {
    category: 'Shipping',
    question: 'How long does delivery take?',
    answer:
      'Lagos orders typically arrive in 1–2 business days, Abuja in 2–3, and other Nigerian states in 3–5. Express shipping is available at checkout for next-day delivery to Lagos and Abuja.',
  },
  {
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer:
      'Yes — we ship to select destinations in West Africa and the UK on a quote basis. Please contact our concierge before placing an international order so we can confirm availability and provide a shipping quote.',
  },

  // Returns
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer:
      'Unworn items in original condition with all tags attached may be returned within 30 days of delivery for a full refund or exchange. Bespoke and final-sale items are non-returnable unless defective. See our Returns page for full details.',
  },
  {
    category: 'Returns',
    question: 'Who pays for return shipping?',
    answer:
      'Return shipping is free for items that arrive damaged, defective, or incorrect. For change-of-mind returns, a flat ₦1,500 return-shipping fee is deducted from your refund.',
  },

  // Membership
  {
    category: 'Membership',
    question: 'How does the Havanat membership work?',
    answer:
      'Membership is offered in three tiers — Standard, Deluxe, and Elite — each billed monthly. Members unlock tier-specific benefits including discounts, priority shipping, and access to exclusive collections. See the Membership page for full details.',
  },
  {
    category: 'Membership',
    question: 'Can I cancel my membership at any time?',
    answer:
      'Yes. You can downgrade or cancel your membership from your account dashboard at any time. Changes take effect at the end of your current billing cycle — you will continue to enjoy your benefits until then.',
  },

  // Bespoke
  {
    category: 'Bespoke',
    question: 'What is the bespoke process?',
    answer:
      'Submit a request via our Bespoke page, share your measurements (or book an in-store fitting in Lagos or Abuja), and our master tailors will craft your garment over 4–6 weeks. Each piece is finished by hand and inspected twice before delivery.',
  },
  {
    category: 'Bespoke',
    question: 'Can I make changes after I have placed my bespoke order?',
    answer:
      'Minor adjustments can be made up to 48 hours after submission. Once production has started, only fabric additions are possible. Final fittings take place in-store before delivery to ensure a perfect finish.',
  },

  // Account
  {
    category: 'Account',
    question: 'I forgot my password — how do I reset it?',
    answer:
      'On the login page, click "Forgot password" and enter the email associated with your account. You will receive a secure reset link valid for one hour. If you do not see the email, contact our concierge for assistance.',
  },
];

const CATEGORIES: ('All' | Category)[] = ['All', 'Orders', 'Shipping', 'Returns', 'Membership', 'Bespoke', 'Account'];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<'All' | Category>('All');
  const [query, setQuery] = useState('');

  const filtered = FAQS.filter((f) => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Help Centre</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Quick answers about orders, shipping, returns, membership, bespoke, and your account.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto mt-10 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </section>

      {/* Category chips */}
      <section className="px-4 sm:px-6 lg:px-12 pt-12 lg:pt-16">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-colors ${
                activeCategory === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Accordion */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-gray-200">
              <p className="text-gray-500 text-sm">No questions match your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq) => {
                const idx = FAQS.indexOf(faq);
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="border border-gray-200 hover:border-black transition-colors">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex-1 pr-4">
                        <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mr-3">
                          {faq.category}
                        </span>
                        <span className="text-sm font-medium">{faq.question}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Still need help? */}
      <section className="px-4 sm:px-6 lg:px-12 pb-16 lg:pb-24">
        <div className="max-w-3xl mx-auto bg-black text-white p-8 sm:p-12 text-center">
          <MessageCircle className="h-8 w-8 mx-auto mb-4 text-white/60" />
          <h2 className="font-serif text-2xl sm:text-3xl mb-3">Still have questions?</h2>
          <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
            Our concierge team is available Monday – Friday, 9 AM – 6 PM WAT. We typically reply within
            2 hours.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-xs tracking-[0.2em] font-medium hover:bg-white/90 transition-colors"
          >
            CONTACT {BRAND.name.toUpperCase()}
          </Link>
        </div>
      </section>
    </main>
  );
}
