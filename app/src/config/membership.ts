// Membership tier brand config — display-only pricing/features for the marketing
// Membership page. The actual discount percentages (Deluxe 15%, Elite 25%) are
// stored in the backend `tier_discounts` table and fetched via useMembershipStore.
// This is brand content, not mock data — like BRAND_NAME / BRAND_TAGLINE.

export interface MembershipTier {
  tier: 'Standard' | 'Deluxe' | 'Elite';
  price: number;
  billing: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    tier: 'Standard',
    price: 0,
    billing: 'Free Forever',
    description: 'Access to our full collection with standard pricing and benefits.',
    features: [
      'Full collection access',
      'Standard delivery (3-5 days)',
      'Email customer support',
      '30-day return policy',
      'Birthday discount (10%)',
      'Early access to sales',
    ],
  },
  {
    tier: 'Deluxe',
    price: 15000,
    billing: 'per month',
    description: 'Enhanced experience with priority services and exclusive offers.',
    isPopular: true,
    features: [
      'Everything in Standard',
      '15% off all purchases',
      'Free express delivery',
      'Priority customer support',
      'Exclusive member collections',
      'Free alterations',
      'Quarterly gift box',
      'Extended 60-day returns',
    ],
  },
  {
    tier: 'Elite',
    price: 50000,
    billing: 'per month',
    description: 'The ultimate Havanat experience with bespoke services and personal styling.',
    features: [
      'Everything in Deluxe',
      '25% off all purchases',
      'Bespoke customization access',
      'Personal stylist consultations',
      'VIP event invitations',
      'First access to new drops',
      'Complimentary garment care',
      'Dedicated support line',
      'Annual tailored gift',
      'Exclusive Elite-only pieces',
    ],
  },
];