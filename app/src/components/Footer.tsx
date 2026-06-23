import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { CONFIG } from '@/config';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="w-full px-4 sm:px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="font-sans text-2xl tracking-[0.2em] font-medium">
              HAVANAT
            </Link>
            <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
              Where Style Meets Elegance. Premium affordable luxury for working-class professionals who demand excellence.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href={CONFIG.SOCIAL.INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href={CONFIG.SOCIAL.TWITTER} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href={CONFIG.SOCIAL.FACEBOOK} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs tracking-[0.2em] font-semibold mb-6">SHOP</h4>
            <ul className="space-y-3">
              {['Suits', 'Blazers', 'Trousers', 'Vests', 'Formal Wear', 'Outerwear'].map((item) => (
                <li key={item}>
                  <Link to={`/shop?category=${item}`} className="text-white/50 text-sm hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-[0.2em] font-semibold mb-6">COMPANY</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Membership', href: '/membership' },
                { label: 'Bespoke', href: '/custom-request' },
                { label: 'Careers', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-white/50 text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs tracking-[0.2em] font-semibold mb-6">SUPPORT</h4>
            <ul className="space-y-3">
              {[
                { label: 'Contact Us', href: '/contact' },
                { label: 'Returns & Exchange', href: '/returns' },
                { label: 'Shipping Info', href: '/returns' },
                { label: 'Size Guide', href: '#' },
                { label: 'FAQ', href: '/membership' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-white/50 text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Havanat. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
