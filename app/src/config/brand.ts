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
    address: 'Port Harcourt, Rivers State, Nigeria',
  },
  // company.* fields are intentionally left blank — these require registered business details
  // the user has not yet provided. See docs/REGISTRATION_GAPS.md for the full list, prioritized.
  company: {
    legalName: '',      // TODO: registered legal name (e.g. "Havanat Limited")
    rcNumber: '',        // TODO: CAC RC number (e.g. "RC 1234567")
    tin: '',             // TODO: FIRS Tax Identification Number
    address: '',         // TODO: registered office street address
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