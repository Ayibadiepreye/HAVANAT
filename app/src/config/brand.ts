// Brand identity for Havanat — sourced from the official crest.
// "Havanat" is the canonical spelling used on the brand crest (image (1).png).
// The crest variants live under /public/brand/.

export const BRAND = {
  name: 'Havanat',
  tagline: 'Where Style Meets Elegance',
  shortPitch: 'Premium affordable luxury for the modern Nigerian professional.',
  established: 2014,
  founder: {
    name: 'Rapheal Ebipado Otele',
    shortBio:
      'Founded Havanat to solve a single problem: brilliant Nigerian professionals in suits that did them a disservice.',
  },
  contact: {
    email: 'concierge@havanat.ng',
    phone: '+234 803 000 0000',
    address: '24 Adetokunbo Ademola, Victoria Island, Lagos, Nigeria',
  },
  social: {
    instagram: 'https://instagram.com/havanat',
    twitter: 'https://twitter.com/havanat',
    facebook: 'https://facebook.com/havanat',
    tiktok: 'https://tiktok.com/@havanat',
  },
  assets: {
    favicon: '/favicon.svg',
    dark: '/brand/logo-dark.png',     // white logo on black — for dark backgrounds
    light: '/brand/logo-light.png',   // black logo on white — for light backgrounds
    crest: '/brand/crest-transparent.png', // white line art, transparent — for decorative use
  },
};

export default BRAND;