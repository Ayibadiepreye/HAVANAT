import { Link } from 'react-router-dom';
import { Eye, Volume2, MousePointer, Type, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { BRAND } from '@/config/brand';

const COMMITMENTS = [
  {
    icon: Eye,
    title: 'Visual Contrast',
    body:
      'Text and interactive elements meet WCAG 2.1 AA contrast ratios (4.5:1 for body text, 3:1 for large text). We do not rely on colour alone to convey meaning.',
  },
  {
    icon: Volume2,
    title: 'Screen Reader Support',
    body:
      'All pages render semantic HTML (headings, landmarks, lists, buttons) and use ARIA labels where appropriate so that NVDA, JAWS, and VoiceOver users can navigate effectively.',
  },
  {
    icon: MousePointer,
    title: 'Keyboard Navigation',
    body:
      'Every interactive element is reachable and operable using only the keyboard. Visible focus rings indicate the current location at all times.',
  },
  {
    icon: Type,
    title: 'Text Sizing',
    body:
      'Layouts remain readable when text is resized up to 200% in the browser. We avoid fixed pixel heights on text containers and use relative units where practical.',
  },
];

const KNOWN_ISSUES = [
  'Some legacy product images are missing descriptive alt text — they will be remediated in the next content audit.',
  'PDF care guides linked from product pages are not yet fully tagged; please contact us for an accessible alternative.',
  'In-app chat widget is keyboard-operable but has not been formally tested with all screen readers.',
];

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Inclusion</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Accessibility Statement</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          {BRAND.name} is committed to ensuring digital accessibility for people of all abilities. We
          continually improve the user experience for everyone and apply the relevant accessibility
          standards.
        </p>
      </section>

      {/* Conformance */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black text-white p-8 sm:p-12 mb-12">
            <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-3">Our Standard</p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-4">
              WCAG 2.1 Level AA Conformance
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA.
              These guidelines explain how to make web content more accessible to people with a wide
              range of disabilities — including visual, auditory, physical, speech, cognitive,
              language, learning, and neurological disabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMMITMENTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="border border-gray-200 p-6 sm:p-8 hover:border-black transition-colors duration-300">
                <Icon size={26} strokeWidth={1.3} className="text-gray-700 mb-4" />
                <h3 className="font-serif text-xl mb-3">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Known issues */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">Transparency</p>
            <h2 className="font-serif text-3xl sm:text-4xl">Known Issues & Ongoing Work</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto mt-4">
              We believe accessibility is a process, not a checkbox. Below is an honest list of issues
              we are actively working to resolve.
            </p>
          </div>

          <div className="bg-white border border-gray-200 divide-y divide-gray-200">
            {KNOWN_ISSUES.map((issue, i) => (
              <div key={i} className="flex gap-4 p-5 sm:p-6">
                <AlertCircle size={20} strokeWidth={1.5} className="flex-shrink-0 mt-0.5 text-amber-700" />
                <p className="text-sm text-gray-700 leading-relaxed">{issue}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 bg-white border border-gray-200 p-5 sm:p-6">
            <CheckCircle2 size={20} strokeWidth={1.5} className="flex-shrink-0 mt-0.5 text-green-700" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Our commitment: every issue above has an owner, a remediation plan, and a target
              completion date. We publish a progress update quarterly.
            </p>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Mail size={28} strokeWidth={1.3} className="mx-auto mb-5 text-gray-700" />
          <h2 className="font-serif text-3xl sm:text-4xl mb-4">Feedback</h2>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto text-sm mb-6">
            If you encounter an accessibility barrier on {BRAND.name} — or have a suggestion for how we
            can improve — please let us know. We take every report seriously and typically respond
            within two business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <a
              href={`mailto:${BRAND.contact.email}`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs tracking-[0.2em] font-medium hover:bg-black/80 transition-colors"
            >
              <Mail size={14} />
              {BRAND.contact.email}
            </a>
            <Link
              to="/contact"
              className="px-8 py-3 border border-black text-black text-xs tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors"
            >
              CONTACT FORM
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-8">
            We aim to respond to accessibility feedback within 2 business days.
          </p>
        </div>
      </section>
    </main>
  );
}
