// Toggle USE_MOCK = false in .env (VITE_USE_MOCK=false) to switch to live API calls
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const CONFIG = {
  BRAND_NAME: 'HAVANAT',
  BRAND_TAGLINE: 'Where Style Meets Elegance',
  CURRENCY: '₦',
  DEFAULT_DELIVERY_FEE: 3500,
  FREE_DELIVERY_THRESHOLD: 150000,
  CONTACT: {
    PHONE: '+234 803 000 0000',
    EMAIL: 'concierge@havanat.ng',
    ADDRESS: 'Port Harcourt, Rivers State, Nigeria',
  },
  SOCIAL: {
    INSTAGRAM: 'https://instagram.com/havanat',
    TWITTER: 'https://twitter.com/havanat',
    FACEBOOK: 'https://facebook.com/havanat',
    WHATSAPP: 'https://wa.me/2348030000000',
  },
} as const;

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
