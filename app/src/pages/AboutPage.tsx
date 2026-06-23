import { Link } from 'react-router-dom';
import { Award, Users, Globe, TrendingUp } from 'lucide-react';

const VALUES = [
  {
    icon: Award,
    title: 'Uncompromising Quality',
    desc: 'Every garment is crafted from the finest materials sourced from Italy and the UK, ensuring durability and elegance.',
  },
  {
    icon: Users,
    title: 'Made for Professionals',
    desc: 'We understand the Nigerian professional. Our designs are created to command respect in any room, from the boardroom to the banquet.',
  },
  {
    icon: Globe,
    title: 'Global Standards, Local Soul',
    desc: 'While our craftsmanship meets international luxury standards, our designs are inspired by Nigerian excellence and ambition.',
  },
  {
    icon: TrendingUp,
    title: 'Accessible Luxury',
    desc: 'We believe premium tailoring should not be exclusive. Havanat brings elite fashion within reach of working-class professionals.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] bg-black flex items-center justify-center overflow-hidden">
        <img
          src="/images/community/event-1.jpg"
          alt="Havanat"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4">Our Story</p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl mb-4">The Havanat<br />Standard</h1>
          <p className="text-white/50 max-w-lg mx-auto text-sm">
            Redefining corporate fashion for the modern Nigerian professional.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Established 2014</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-8">A Legacy of Precision</h2>
          <div className="space-y-6 text-gray-600 leading-relaxed text-base">
            <p>
              Havanat was born from a simple observation: Nigerian professionals were settling for ill-fitting,
              mass-produced suits that failed to reflect their ambition and success. Our founder, Emmanuel Adeyemi,
              set out to change that.
            </p>
            <p>
              Starting from a small atelier in Lagos, we have grown into Nigeria&apos;s premier destination for
              affordable luxury corporate wear. Our journey has been defined by an unwavering commitment to quality,
              craftsmanship, and the belief that every professional deserves to look extraordinary.
            </p>
            <p>
              Today, Havanat serves thousands of professionals across Nigeria — from CEOs and entrepreneurs to
              young graduates entering the workforce. Each garment tells a story of precision, passion, and pride.
            </p>
          </div>
        </div>
      </section>

      {/* Full-width image break */}
      <section className="w-full h-[40vh] sm:h-[50vh]">
        <img
          src="/images/community/professional-1.jpg"
          alt="Professional in Havanat"
          className="w-full h-full object-cover"
        />
      </section>

      {/* Founder */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <img
              src="/images/about/founder.jpg"
              alt="Emmanuel Adeyemi"
              className="w-full h-[450px] lg:h-[550px] object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">The Founder</p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-6">Emmanuel Adeyemi</h2>
            <blockquote className="font-serif text-xl sm:text-2xl italic leading-relaxed mb-6 text-gray-700">
              &ldquo;I started Havanat because I was tired of seeing brilliant Nigerian professionals in suits that did them a disservice. Your appearance is your first impression — and it should be impeccable.&rdquo;
            </blockquote>
            <p className="text-gray-600 leading-relaxed mb-4">
              With a background in finance and a lifelong passion for fashion, Emmanuel combined his expertise
              to build a brand that understands the needs of the working professional. Under his leadership,
              Havanat has become synonymous with quality and sophistication.
            </p>
            <p className="text-gray-600 leading-relaxed">
              His vision extends beyond clothing — Emmanuel is committed to creating opportunities for
              Nigerian artisans and establishing the country as a hub for luxury fashion manufacturing.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">What We Stand For</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Our Values</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-5 border border-gray-200 flex items-center justify-center">
                <Icon size={22} strokeWidth={1.5} className="text-gray-600" />
              </div>
              <h3 className="font-medium text-lg mb-3">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-black text-white text-center">
        <h2 className="font-serif text-3xl sm:text-4xl mb-4">Join the Movement</h2>
        <p className="text-white/50 max-w-lg mx-auto text-sm mb-8">
          Experience the Havanat difference. Elevate your wardrobe and make your statement.
        </p>
        <Link
          to="/shop"
          className="inline-block px-8 py-3 bg-white text-black text-xs tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors"
        >
          SHOP NOW
        </Link>
      </section>
    </main>
  );
}
