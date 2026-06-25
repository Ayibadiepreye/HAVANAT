import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Star, Zap, Shield, Truck, RotateCcw, Award, Sparkles } from 'lucide-react';
import { PRODUCTS, REVIEWS, MEMBERSHIPS } from '@/data/mockData';
import { formatNaira } from '@/config';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { BRAND } from '@/config/brand';

/* ──────────────────── HERO ──────────────────── */
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const img = el.querySelector('.hero-img') as HTMLElement;
      const text = el.querySelector('.hero-text') as HTMLElement;
      if (img) img.style.transform = `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0003})`;
      if (text) text.style.opacity = String(Math.max(0, 1 - scrollY / 500));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={heroRef} className="relative w-full h-screen overflow-hidden bg-black">
      <div className="hero-img absolute inset-0 w-full h-full">
        <img src="/images/hero/fabric-hero.jpg" alt="Premium fabric" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="hero-text relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <img src={BRAND.assets.crest} alt={BRAND.name} className="h-20 sm:h-24 lg:h-28 w-auto opacity-90 mb-4" />
        <h1 className="font-serif text-white text-[12vw] md:text-[10vw] lg:text-[8vw] leading-none tracking-[-0.02em]">
          {BRAND.name}
        </h1>
        <p className="text-white/80 text-xs sm:text-sm tracking-[0.3em] mt-4 sm:mt-6 font-light uppercase">
          {BRAND.tagline}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 sm:mt-14">
          <Link to="/shop" className="px-8 py-3.5 bg-white text-black text-[10px] sm:text-xs tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors">
            SHOP THE COLLECTION
          </Link>
          <Link to="/membership" className="px-8 py-3.5 border border-white/40 text-white text-[10px] sm:text-xs tracking-[0.15em] hover:bg-white/10 transition-colors">
            JOIN THE CLUB
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-pulse-slow">
        <ChevronDown size={24} className="text-white/60" strokeWidth={1} />
      </div>
    </section>
  );
}

/* ──────────────────── TRUST BAR ──────────────────── */
function TrustBar() {
  const items = [
    { icon: Truck, label: 'Standard delivery ₦2,500 · Express ₦5,000' },
    { icon: RotateCcw, label: '14-day returns' },
    { icon: Award, label: 'Hand-tailored' },
    { icon: Sparkles, label: 'Membership perks' },
  ];
  return (
    <section className="bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 lg:gap-3 text-[11px] sm:text-xs tracking-[0.1em] text-gray-700 uppercase">
              <Icon size={16} strokeWidth={1.5} className="text-gray-500 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── FEATURED COLLECTION ──────────────────── */
function FeaturedSection() {
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUIStore((s) => s.showToast);
  const featured = PRODUCTS.slice(0, 4);

  return (
    <section className="w-full py-20 lg:py-28 bg-white">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="flex items-end justify-between mb-12 lg:mb-16">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Curated Selection</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">Featured Collection</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-2 text-xs tracking-[0.15em] hover:opacity-60 transition-opacity">
            VIEW ALL <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/shop/${product.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 img-zoom">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  {product.isNew && (
                    <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] tracking-[0.15em]">NEW</span>
                  )}
                  {product.originalPrice && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-white text-black text-[9px] tracking-[0.15em]">SALE</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addItem(product, product.sizes[1] || product.sizes[0]);
                        showToast(`${product.name} added to cart`, 'success');
                      }}
                      className="w-full py-2.5 bg-black text-white text-[10px] tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
                    >
                      QUICK ADD
                    </button>
                  </div>
                </div>
              </Link>
              <div className="mt-4">
                <h3 className="text-sm font-medium truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold">{formatNaira(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">{formatNaira(product.originalPrice)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs tracking-[0.15em]">
            VIEW ALL <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── BRAND STORY ──────────────────── */
function BrandStorySection() {
  return (
    <section className="w-full py-20 lg:py-28 bg-[#f0f3f5]">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">The {BRAND.name} Standard</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6">
              Tailored for the<br />Modern Elite
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Born from a passion for precision and an unwavering commitment to quality, {BRAND.name} redefines
              luxury fashion for the Nigerian professional. We believe that exceptional tailoring should not
              be a luxury reserved for the few — it is a standard that every working professional deserves.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Each garment is meticulously crafted using premium fabrics sourced from the finest mills in
              Italy and the United Kingdom. Our master tailors combine decades of expertise with modern
              techniques to create pieces that command respect in every room.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Star, label: 'Premium Fabrics' },
                { icon: Zap, label: 'Expert Craftsmanship' },
                { icon: Shield, label: 'Quality Guarantee' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon size={20} strokeWidth={1.5} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-[10px] tracking-[0.1em] text-gray-500 uppercase">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src="/images/community/professional-1.jpg" alt="Professional wearing Havanat" className="w-full h-[500px] lg:h-[600px] object-cover" />
            <div className="absolute -bottom-6 -left-6 bg-black text-white p-6 hidden lg:block">
              <p className="font-serif text-3xl">12+</p>
              <p className="text-[10px] tracking-[0.15em] mt-1 uppercase">Years of Excellence</p>
            </div>
            {/* Crest watermark */}
            <img src={BRAND.assets.crest} alt="" className="absolute top-6 right-6 h-16 w-auto opacity-40 mix-blend-difference hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── CATEGORIES STRIP ──────────────────── */
function CategoriesSection() {
  const categories = [
    { name: 'Suits', img: '/images/products/suit-double-breasted.jpg', href: '/shop?category=suits' },
    { name: 'Blazers', img: '/images/products/blazer-cropped.jpg', href: '/shop?category=blazers' },
    { name: 'Trousers', img: '/images/products/trousers-pleated.jpg', href: '/shop?category=trousers' },
    { name: 'Outerwear', img: '/images/products/overcoat-wool.jpg', href: '/shop?category=outerwear' },
  ];
  return (
    <section className="w-full py-16 lg:py-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Shop by Category</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Every Piece, Tailored</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {categories.map((c) => (
            <Link key={c.name} to={c.href} className="group relative block aspect-[3/4] overflow-hidden bg-gray-100">
              <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="font-serif text-white text-xl sm:text-2xl">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── MEMBERSHIP TEASER ──────────────────── */
function MembershipTeaser() {
  return (
    <section className="w-full py-20 lg:py-28 bg-black text-white">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-4">Exclusive Access</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">Membership Tiers</h2>
          <p className="text-white/50 mt-4 max-w-lg mx-auto text-sm">
            Elevate your experience with exclusive benefits, priority services, and bespoke customization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {MEMBERSHIPS.map((tier) => (
            <div key={tier.tier} className={`relative p-8 border ${tier.isPopular ? 'border-white' : 'border-white/10'}`}>
              {tier.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[9px] tracking-[0.15em] font-semibold">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-serif text-2xl mb-2">{tier.tier}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-semibold">
                  {tier.price === 0 ? 'Free' : `₦${tier.price.toLocaleString()}`}
                </span>
                {tier.price > 0 && <span className="text-white/40 text-xs">/{tier.billing}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-white mt-0.5">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/membership"
                className={`block w-full py-3 text-center text-xs tracking-[0.15em] font-semibold transition-colors ${
                  tier.isPopular ? 'bg-white text-black hover:bg-white/90' : 'border border-white/30 text-white hover:bg-white/10'
                }`}
              >
                {tier.price === 0 ? 'GET STARTED' : 'SUBSCRIBE'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── LOOKBOOK / COMMUNITY ──────────────────── */
function LookbookSection() {
  return (
    <section className="w-full py-20 lg:py-28 bg-white">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="flex items-end justify-between mb-12 lg:mb-16">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">The {BRAND.name} Community</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">How It&apos;s Going</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {REVIEWS.map((review) => (
            <div key={review.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 img-zoom">
                <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white">
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-white text-white" />
                      ))}
                    </div>
                    <p className="text-sm italic leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                    <p className="text-xs mt-3 tracking-wide text-white/70">— {review.name}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Founder's note */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <img src="/images/about/founder.jpg" alt={`${BRAND.founder.name}, Founder`} className="w-full h-[400px] lg:h-[500px] object-cover" />
            <img src={BRAND.assets.crest} alt="" className="absolute -bottom-4 -right-4 h-20 w-auto opacity-90 mix-blend-difference hidden lg:block" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Founder&apos;s Note</p>
            <blockquote className="font-serif text-2xl sm:text-3xl leading-relaxed mb-6">
              &ldquo;We started {BRAND.name} with a simple belief: every professional deserves to look and feel
              extraordinary. Not someday — today.&rdquo;
            </blockquote>
            <p className="text-gray-600 leading-relaxed mb-2">— {BRAND.founder.name}, Founder & CEO</p>
            <Link to="/about" className="inline-flex items-center gap-2 text-xs tracking-[0.15em] mt-6 hover:opacity-60 transition-opacity">
              READ OUR STORY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── BESPOKE CTA ──────────────────── */
function BespokeCTA() {
  return (
    <section className="w-full py-20 lg:py-28 bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="relative flex items-center justify-center">
          <img src={BRAND.assets.crest} alt="" className="h-64 lg:h-80 w-auto opacity-30" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-3">Bespoke Service</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Made For You, By Us</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Book a one-on-one fitting with our master tailors. Choose your fabric, your fit, your monogram — we&apos;ll
            hand-craft a garment that&apos;s unmistakably yours.
          </p>
          <Link to="/custom-request" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-xs tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors">
            BOOK A BESPOKE FITTING <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── NEWSLETTER ──────────────────── */
function NewsletterSection() {
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    if (email) {
      showToast('Thank you for subscribing!', 'success');
      form.reset();
    }
  };

  return (
    <section className="w-full py-20 lg:py-28 bg-[#f0f3f5]">
      <div className="px-4 sm:px-6 lg:px-12 text-center max-w-2xl mx-auto">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Stay Connected</p>
        <h2 className="font-serif text-3xl sm:text-4xl mb-4">Join the Inner Circle</h2>
        <p className="text-gray-500 text-sm mb-8">
          Be the first to know about new collections, exclusive offers, and member-only events.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="flex-1 px-5 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white"
          />
          <button type="submit" className="px-8 py-3.5 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors">
            SUBSCRIBE
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-4 tracking-wide">
          By subscribing, you agree to receive marketing emails from {BRAND.name}.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────── HOME PAGE ──────────────────── */
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <FeaturedSection />
      <BrandStorySection />
      <CategoriesSection />
      <MembershipTeaser />
      <LookbookSection />
      <BespokeCTA />
      <NewsletterSection />
    </main>
  );
}