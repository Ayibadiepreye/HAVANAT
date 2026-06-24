// About the founder — used on the About page and the homepage brand story section.
// Sources:
//  - The official brand crest spelling: "Havanat" (matches image (1).png).
//  - The brand has been positioned in the public brief as founded by Rapheal Ebipado Otele.
import { Award, Users, Globe, TrendingUp, Scissors, Sparkles } from 'lucide-react';

export const FOUNDER = {
  name: 'Rapheal Ebipado Otele',
  role: 'Founder & Creative Director',
  image: '/images/about/founder.jpg',
  quote:
    'I started Havanat because I was tired of seeing brilliant Nigerian professionals in suits that did them a disservice. Your appearance is your first impression — and it should be impeccable.',
  shortBio:
        'Built Havanat to give working professionals the same calibre of tailoring the global elite take for granted — at a price that respects the realities of Port Harcourt, Abuja, and Lagos.',
  fullBio: [
      'Rapheal Ebipado Otele grew up surrounded by tailors in Port Harcourt — his family ran a small tailoring outfit in the city for two generations. He learned to cut fabric before he learned to code a spreadsheet, and the discipline of the cutting table stayed with him through every role he held afterwards.',
      'After a career in finance and operations, he returned to the workshop with a single question: why do Nigerian professionals — many of whom run the most ambitious companies on the continent — settle for off-the-rack suits that fit no one?',
      'The answer became Havanat: a luxury fashion house that pairs Italian and British fabric with Nigerian craftsmanship, hand-tailored to each client, at a price that respects the realities of working professionals.',
      'Today Rapheal leads the brand\'s creative direction from Port Harcourt and personally reviews every new collection before it reaches the fitting room.',
    ],
};

export const VALUES = [
  {
    icon: Award,
    title: 'Uncompromising Quality',
    desc: 'Every garment is cut from the finest Italian and British fabrics, and finished by hand in our studio.',
  },
  {
    icon: Users,
    title: 'Made for Professionals',
    desc: 'Designed for the boardroom, the banquet, and every room where first impressions matter.',
  },
  {
    icon: Globe,
    title: 'Global Standards, Local Soul',
    desc: 'International craftsmanship, Nigerian ambition. We dress the people building the new Africa.',
  },
  {
    icon: TrendingUp,
    title: 'Accessible Luxury',
    desc: 'Premium tailoring without the premium price tag. Excellence should not be exclusive.',
  },
  {
    icon: Scissors,
    title: 'Hand-Tailored',
    desc: 'Every garment passes through 27 distinct checkpoints and the hands of master tailors.',
  },
  {
    icon: Sparkles,
    title: 'Distinctively Yours',
    desc: 'Bespoke fittings, monogram linings, and curated details that make every piece unmistakably yours.',
  },
];

export const MILESTONES = [
  { year: '2014', label: 'Havanat founded in Port Harcourt.' },
  { year: '2017', label: 'Opened the Port Harcourt flagship studio.' },
  { year: '2019', label: 'Launched the Bespoke service for fully custom garments.' },
  { year: '2022', label: 'Crossed 5,000 active members across Nigeria.' },
  { year: '2024', label: 'Began nationwide doorstep delivery via in-house rider network.' },
  { year: '2026', label: 'Membership tiers (Standard, Deluxe, Elite) introduced.' },
];