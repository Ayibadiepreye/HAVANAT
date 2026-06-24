import { useState } from 'react';
import { Ruler, Scissors, User } from 'lucide-react';

type Garment = 'Suits' | 'Shirts' | 'Trousers';

interface SizeRow {
  size: string;
  chest: string;
  waist: string;
  hips: string;
  inseam?: string;
}

const SUITS: SizeRow[] = [
  { size: 'S', chest: '36 – 38', waist: '30 – 32', hips: '36 – 38', inseam: '30 – 32' },
  { size: 'M', chest: '38 – 40', waist: '32 – 34', hips: '38 – 40', inseam: '31 – 33' },
  { size: 'L', chest: '40 – 42', waist: '34 – 36', hips: '40 – 42', inseam: '32 – 34' },
  { size: 'XL', chest: '42 – 44', waist: '36 – 38', hips: '42 – 44', inseam: '33 – 35' },
  { size: 'XXL', chest: '44 – 46', waist: '38 – 40', hips: '44 – 46', inseam: '34 – 36' },
];

const SHIRTS: SizeRow[] = [
  { size: 'S', chest: '36 – 38', waist: '30 – 32', hips: '—', inseam: '—' },
  { size: 'M', chest: '38 – 40', waist: '32 – 34', hips: '—', inseam: '—' },
  { size: 'L', chest: '40 – 42', waist: '34 – 36', hips: '—', inseam: '—' },
  { size: 'XL', chest: '42 – 44', waist: '36 – 38', hips: '—', inseam: '—' },
  { size: 'XXL', chest: '44 – 46', waist: '38 – 40', hips: '—', inseam: '—' },
];

const TROUSERS: SizeRow[] = [
  { size: 'S', chest: '—', waist: '28 – 30', hips: '36 – 38', inseam: '30 – 32' },
  { size: 'M', chest: '—', waist: '30 – 32', hips: '38 – 40', inseam: '31 – 33' },
  { size: 'L', chest: '—', waist: '32 – 34', hips: '40 – 42', inseam: '32 – 34' },
  { size: 'XL', chest: '—', waist: '34 – 36', hips: '42 – 44', inseam: '33 – 35' },
  { size: 'XXL', chest: '—', waist: '36 – 38', hips: '44 – 46', inseam: '34 – 36' },
];

const TABLES: Record<Garment, { rows: SizeRow[]; subtitle: string }> = {
  Suits: {
    rows: SUITS,
    subtitle: 'Two-piece and three-piece suits, blazers, and tuxedos.',
  },
  Shirts: {
    rows: SHIRTS,
    subtitle: 'Business and formal shirts, including fitted and classic cuts.',
  },
  Trousers: {
    rows: TROUSERS,
    subtitle: 'Dress trousers, chinos, and tailored pants.',
  },
};

const STEPS = [
  {
    icon: Ruler,
    title: 'Use a soft tape',
    body:
      'Stand relaxed in light clothing. Wrap a soft measuring tape snugly — not tight — and read the measurement in inches. Avoid metal tape measures.',
  },
  {
    icon: User,
    title: 'Measure over light clothing',
    body:
      'For chest, run the tape under the arms across the fullest part of the chest. For waist, measure around your natural waistline. For hips, around the widest point.',
  },
  {
    icon: Scissors,
    title: 'Compare & order',
    body:
      'Pick the size whose measurements most closely match yours. If you sit between two sizes, we recommend sizing up for a tailored fit or down for a slim cut.',
  },
];

export default function SizeGuidePage() {
  const [active, setActive] = useState<Garment>('Suits');
  const table = TABLES[active];

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Fit Guide</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Size Guide</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          The right fit starts with the right measurement. Use the tables below to find your perfect
          Havanat size — or book a complimentary in-store fitting in Lagos or Abuja.
        </p>
      </section>

      {/* Tabs */}
      <section className="px-4 sm:px-6 lg:px-12 pt-12 lg:pt-16">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2">
          {(Object.keys(TABLES) as Garment[]).map((g) => (
            <button
              key={g}
              onClick={() => setActive(g)}
              className={`px-6 py-2.5 text-[10px] tracking-[0.2em] uppercase border transition-colors ${
                active === g
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              }`}
            >
              Men&apos;s {g}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl mb-2">Men&apos;s {active}</h2>
            <p className="text-sm text-gray-500">{table.subtitle}</p>
            <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-3">
              All measurements in inches
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Size</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Chest</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Waist</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Hips</th>
                  <th className="text-left py-4 px-6 text-[10px] tracking-[0.2em] font-semibold uppercase">Inseam</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr
                    key={row.size}
                    className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-[#f0f3f5]/40' : ''}`}
                  >
                    <td className="py-4 px-6 font-medium">{row.size}</td>
                    <td className="py-4 px-6 text-gray-700">{row.chest}</td>
                    <td className="py-4 px-6 text-gray-700">{row.waist}</td>
                    <td className="py-4 px-6 text-gray-700">{row.hips}</td>
                    <td className="py-4 px-6 text-gray-700">{row.inseam ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            Need a size outside this range? Our bespoke service offers made-to-measure tailoring from
            scratch — see our <a href="/custom-request" className="underline">Bespoke page</a> for
            details.
          </p>
        </div>
      </section>

      {/* How to measure */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Step by Step</p>
            <h2 className="font-serif text-3xl sm:text-4xl">How to Measure</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6 bg-white border border-gray-200 flex items-center justify-center">
                    <Icon size={40} strokeWidth={1.2} className="text-gray-700" />
                    <span className="absolute -top-3 -left-3 w-10 h-10 bg-black text-white flex items-center justify-center font-serif text-lg">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>

          {/* Diagram */}
          <div className="mt-16 bg-white border border-gray-200 p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Quick Reference</p>
                <h3 className="font-serif text-2xl mb-4">Where to Measure</h3>
                <dl className="space-y-4 text-sm">
                  <div className="flex gap-4">
                    <dt className="font-medium w-20 flex-shrink-0">Chest</dt>
                    <dd className="text-gray-600">Under the arms, around the fullest part of the chest.</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="font-medium w-20 flex-shrink-0">Waist</dt>
                    <dd className="text-gray-600">Around your natural waistline, just above the navel.</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="font-medium w-20 flex-shrink-0">Hips</dt>
                    <dd className="text-gray-600">Around the widest part of the hips, ~20 cm below the waist.</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="font-medium w-20 flex-shrink-0">Inseam</dt>
                    <dd className="text-gray-600">From crotch to ankle along the inside of the leg.</dd>
                  </div>
                </dl>
              </div>
              <div className="relative h-[260px] bg-[#f0f3f5] flex items-center justify-center">
                {/* Simple SVG silhouette */}
                <svg viewBox="0 0 200 280" className="h-full" fill="none" stroke="#000" strokeWidth="1.2">
                  {/* Head */}
                  <circle cx="100" cy="28" r="14" />
                  {/* Body */}
                  <path d="M70 50 L70 180 L130 180 L130 50 Z" />
                  {/* Arms */}
                  <path d="M70 60 L50 140" />
                  <path d="M130 60 L150 140" />
                  {/* Legs */}
                  <path d="M85 180 L80 270" />
                  <path d="M115 180 L120 270" />
                  {/* Measurement lines */}
                  <line x1="60" y1="80" x2="140" y2="80" strokeDasharray="3 3" />
                  <line x1="60" y1="130" x2="140" y2="130" strokeDasharray="3 3" />
                  <line x1="60" y1="170" x2="140" y2="170" strokeDasharray="3 3" />
                  <line x1="78" y1="180" x2="82" y2="265" strokeDasharray="3 3" />
                  <text x="144" y="84" fontSize="9" fill="#000">CHEST</text>
                  <text x="144" y="134" fontSize="9" fill="#000">WAIST</text>
                  <text x="144" y="174" fontSize="9" fill="#000">HIPS</text>
                  <text x="46" y="225" fontSize="9" fill="#000" textAnchor="end">INSEAM</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
