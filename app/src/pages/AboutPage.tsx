import { Link } from 'react-router-dom';
import { FOUNDER, VALUES, MILESTONES } from '@/data/founder';
import { BRAND } from '@/config/brand';
import { Award, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="relative h-[55vh] sm:h-[65vh] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src="/images/community/event-1.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src={BRAND.assets.crest} alt="" className="h-2/3 w-auto opacity-30" />
        </div>
        <div className="relative z-10 text-center px-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4">Our Story</p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl mb-4">
            The {BRAND.name} <br className="hidden sm:block" />Standard
          </h1>
          <p className="text-white/60 max-w-lg mx-auto text-sm leading-relaxed">
            Redefining luxury fashion for the modern Nigerian professional — since {BRAND.established}.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Established {BRAND.established}</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-8">A Legacy of Precision</h2>
          <div className="space-y-6 text-gray-600 leading-relaxed text-base">
            <p>
              {BRAND.name} was born from a single observation: Nigerian professionals were settling for ill-fitting,
              mass-produced suits that failed to reflect their ambition and success. Our founder
              {' '}<strong>{BRAND.founder.name}</strong>{' '}
              set out to change that — and built {BRAND.name} to give working professionals the same calibre of tailoring
              the global elite take for granted.
            </p>
            <p>
              Starting from a single atelier in Port Harcourt, we have grown into Nigeria&apos;s premier destination for
              affordable luxury corporate wear. Our journey is defined by an unwavering commitment to quality,
              craftsmanship, and the belief that every professional deserves to look extraordinary.
            </p>
            <p>
              Today, {BRAND.name} serves thousands of professionals across Nigeria — from CEOs and entrepreneurs to
              young graduates entering the workforce. Each garment tells a story of precision, passion, and pride.
            </p>
          </div>
        </div>
      </section>

      {/* Full-width image break */}
      <section className="w-full h-[40vh] sm:h-[50vh] relative overflow-hidden">
        <img src="/images/community/professional-1.jpg" alt="Professional in Havanat" className="w-full h-full object-cover" />
      </section>

      {/* Founder */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="relative">
            <img src={FOUNDER.image} alt={FOUNDER.name} className="w-full h-[450px] lg:h-[600px] object-cover" />
            <div className="absolute -bottom-6 -right-6 bg-white p-4 hidden lg:block max-w-[200px] shadow-lg">
              <img src={BRAND.assets.crest} alt="" className="h-16 w-auto opacity-90 mx-auto" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-2 text-center">Founded by</p>
              <p className="text-sm font-medium text-center">{FOUNDER.name}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">{FOUNDER.role}</p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-6">{FOUNDER.name}</h2>
            <blockquote className="font-serif text-xl sm:text-2xl italic leading-relaxed mb-6 text-gray-700 border-l-2 border-black pl-4">
              &ldquo;{FOUNDER.quote}&rdquo;
            </blockquote>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              {FOUNDER.fullBio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">What We Stand For</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Our Values</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

      {/* Milestones */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-4">Our Journey</p>
            <h2 className="font-serif text-3xl sm:text-4xl">A Decade of {BRAND.name}</h2>
          </div>
          <div className="space-y-6">
            {MILESTONES.map((m) => (
              <div key={m.year} className="flex gap-6 items-start">
                <span className="font-serif text-2xl sm:text-3xl text-white/40 flex-shrink-0 w-20">{m.year}</span>
                <span className="text-sm sm:text-base text-white/80 leading-relaxed pt-1.5">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-white text-center">
        <Award className="h-8 w-8 mx-auto mb-6 text-gray-400" />
        <h2 className="font-serif text-3xl sm:text-4xl mb-4">Experience the {BRAND.name} Difference</h2>
        <p className="text-gray-500 max-w-lg mx-auto text-sm mb-8">
          Elevate your wardrobe. Make your statement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/90 transition-colors">
            SHOP NOW <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link to="/custom-request" className="inline-flex items-center gap-2 px-8 py-3 border border-black text-black text-xs tracking-[0.15em] font-semibold hover:bg-black hover:text-white transition-colors">
            BOOK A BESPOKE FITTING
          </Link>
        </div>
      </section>
    </main>
  );
}