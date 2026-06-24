import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { BRAND } from '@/config/brand';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="w-full px-4 sm:px-6 lg:px-12 py-16 lg:py-20">
        {/* Brand crest + tagline */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-white/10">
          <div className="flex items-center gap-4">
            <img src={BRAND.assets.dark} alt={BRAND.name} className="h-10 w-auto" />
            <div>
              <p className="text-white/70 text-sm max-w-md">{BRAND.shortPitch}</p>
            </div>
          </div>
          {/* Newsletter */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('email') as HTMLInputElement);
              if (input?.value) {
                alert(`Thanks! We'll send new collection alerts to ${input.value}.`);
                input.value = '';
              }
            }}
            className="flex w-full lg:w-auto items-center gap-2 max-w-md"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="Your email — join the list"
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/15 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors"
            />
            <button type="submit" className="px-5 py-2.5 bg-white text-black text-[10px] tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors">
              SUBSCRIBE
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mt-12">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs tracking-[0.2em] font-semibold mb-6">CONTACT</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li className="flex items-start gap-2"><MapPin size={14} className="mt-1 flex-shrink-0" />{BRAND.contact.address}</li>
              <li className="flex items-center gap-2"><Phone size={14} /><a href={`tel:${BRAND.contact.phone}`} className="hover:text-white">{BRAND.contact.phone}</a></li>
              <li className="flex items-center gap-2"><Mail size={14} /><a href={`mailto:${BRAND.contact.email}`} className="hover:text-white">{BRAND.contact.email}</a></li>
            </ul>
            <div className="flex items-center gap-3 mt-6">
              <a href={BRAND.social.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-colors"><Instagram size={15} strokeWidth={1.5} /></a>
              <a href={BRAND.social.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-colors"><Twitter size={15} strokeWidth={1.5} /></a>
              <a href={BRAND.social.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-colors"><Facebook size={15} strokeWidth={1.5} /></a>
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] font-semibold mb-6">SHOP</p>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                ['Suits', '/shop?category=suits'],
                ['Blazers', '/shop?category=blazers'],
                ['Trousers', '/shop?category=trousers'],
                ['Vests', '/shop?category=vests'],
                ['Outerwear', '/shop?category=outerwear'],
                ['Bespoke', '/custom-request'],
              ].map(([label, href]) => (
                <li key={label}><Link to={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] font-semibold mb-6">COMPANY</p>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                ['About', '/about'],
                ['Membership', '/membership'],
                ['Bespoke', '/custom-request'],
                ['Contact', '/contact'],
                ['Careers', '/contact'],
                ['Press', '/contact'],
              ].map(([label, href]) => (
                <li key={label}><Link to={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] font-semibold mb-6">SUPPORT</p>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                ['FAQ', '/faq'],
                ['Shipping & Delivery', '/shipping'],
                ['Returns & Exchange', '/returns'],
                ['Size Guide', '/size-guide'],
                ['Track Order', '/track'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={label}><Link to={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] font-semibold mb-6">LEGAL</p>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
                ['Cookies', '/privacy#cookies'],
                ['Accessibility', '/accessibility'],
              ].map(([label, href]) => (
                <li key={label}><Link to={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved. Founded by {BRAND.founder.name}.
          </p>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <span>Port Harcourt</span>
            <span>•</span>
            <span>Abuja</span>
            <span>•</span>
            <span>Lagos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}