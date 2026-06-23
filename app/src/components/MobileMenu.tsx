import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';

const navLinks = [
  { label: 'SHOP', href: '/shop' },
  { label: 'NEW ARRIVALS', href: '/shop?sort=newest' },
  { label: 'MEMBERSHIP', href: '/membership' },
  { label: 'BESPOKE', href: '/custom-request' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
  { label: 'RETURNS', href: '/returns' },
];

export default function MobileMenu() {
  const isOpen = useUIStore((s) => s.isMobileMenuOpen);
  const close = () => useUIStore.getState().toggleMobileMenu();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <span className="text-white text-xs tracking-[0.2em]">MENU</span>
          <button onClick={close} className="text-white p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={close}
              className={`block px-6 py-4 text-sm tracking-[0.15em] transition-colors ${
                location.pathname === link.href
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-3">
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            onClick={close}
            className="block w-full py-3 bg-white text-black text-center text-xs tracking-[0.15em] font-semibold"
          >
            {isAuthenticated ? 'MY ACCOUNT' : 'SIGN IN'}
          </Link>
        </div>
      </div>
    </div>
  );
}
