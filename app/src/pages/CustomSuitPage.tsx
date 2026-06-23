import { Link } from 'react-router-dom';
import { Crown, Scissors, MessageCircle, Ruler, Palette } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

const STEPS = [
  { icon: MessageCircle, title: 'Consultation', desc: 'Discuss your vision with our master tailor' },
  { icon: Ruler, title: 'Measurements', desc: 'Precise 30-point body measurement session' },
  { icon: Palette, title: 'Design', desc: 'Select fabric, cut, and personalization options' },
  { icon: Scissors, title: 'Crafting', desc: 'Hand-cut and sewn by our expert artisans' },
];

export default function CustomSuitPage() {
  const user = useAuthStore((s) => s.user);
  const isElite = user?.membershipTier === 'elite';
  const openModal = useUIStore((s) => s.openModal);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="relative bg-black text-white py-20 lg:py-28 text-center px-4">
        <img
          src="/images/hero/fabric-hero.jpg"
          alt="Fabric"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 mb-6">
            <Crown size={14} />
            <span className="text-[10px] tracking-[0.2em]">ELITE EXCLUSIVE</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-6">
            Design Your<br />Signature Piece
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed mb-8">
            Bespoke customization is the pinnacle of the Havanat experience. Work one-on-one with our master tailors to create a garment that is uniquely yours.
          </p>
          {isElite ? (
            <button
              onClick={() => openModal('chat')}
              className="px-8 py-4 bg-white text-black text-xs tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors"
            >
              START YOUR BESPOKE JOURNEY
            </button>
          ) : user ? (
            <div>
              <p className="text-white/60 mb-6">Upgrade to Elite membership to access bespoke services.</p>
              <Link
                to="/membership"
                className="inline-block px-8 py-4 bg-white text-black text-xs tracking-[0.15em] font-semibold"
              >
                VIEW MEMBERSHIPS
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-white/60 mb-6">Sign in and upgrade to Elite to access bespoke services.</p>
              <Link
                to="/login"
                className="inline-block px-8 py-4 bg-white text-black text-xs tracking-[0.15em] font-semibold"
              >
                SIGN IN
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Process */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">The Process</p>
          <h2 className="font-serif text-3xl sm:text-4xl">How Bespoke Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border border-gray-200 flex items-center justify-center">
                <step.icon size={24} strokeWidth={1.5} className="text-gray-600" />
              </div>
              <span className="text-[10px] tracking-[0.15em] text-gray-400">STEP {i + 1}</span>
              <h3 className="font-medium mt-1 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <img
              src="/images/about/founder.jpg"
              alt="Master Tailor"
              className="w-full h-[450px] object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Craftsmanship</p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-6">Precision in Every Stitch</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Each bespoke garment requires over 40 hours of meticulous handwork. Our master tailors bring decades of experience to every piece, ensuring a fit and finish that mass production simply cannot replicate.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              From initial consultation to final fitting, every detail is tailored to your preferences — lapel width, button stance, pocket style, and lining selection.
            </p>
            {isElite && (
              <button
                onClick={() => openModal('chat')}
                className="px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
              >
                REQUEST CONSULTATION
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
