import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, X, ShieldCheck, FileText, Bike, Bell } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { ROLE_HOME } from '@/utils/permissions';
import { BRAND } from '@/config/brand';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  // Notification bell unread count — only relevant for customer accounts
  const userId = dashboardUser?.id ?? '';
  const userTier = (dashboardUser?.tier ? (dashboardUser.tier.charAt(0).toUpperCase() + dashboardUser.tier.slice(1)) : undefined) as 'Standard' | 'Deluxe' | 'Elite' | undefined;
  const unread = useNotificationStore((s) => (userId ? s.unreadCount(userId, userTier) : 0));
  const isCustomer = isAuthenticated && dashboardUser?.role === 'customer';

  const isHome = location.pathname === '/';
  const onDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/moderator') || location.pathname.startsWith('/rider');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBg = scrolled || !isHome ? 'bg-black/95 backdrop-blur-md' : 'bg-transparent';

  if (onDashboard) return null;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left: Menu (mobile) + Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={toggleMobileMenu} className="lg:hidden p-2 text-white hover:opacity-70 transition-opacity" aria-label="Toggle menu">
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src={BRAND.assets.dark}
                  alt={BRAND.name}
                  className="h-7 sm:h-8 lg:h-9 w-auto"
                />
              </Link>
            </div>

            {/* Center: Desktop Nav */}
            <div className="hidden lg:flex items-center gap-10">
              {[
                { label: 'SHOP', href: '/shop' },
                { label: 'MEMBERSHIP', href: '/membership' },
                { label: 'BESPOKE', href: '/custom-request' },
                { label: 'ABOUT', href: '/about' },
                { label: 'CONTACT', href: '/contact' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-white text-[11px] tracking-[0.15em] font-medium hover:opacity-60 transition-opacity relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 sm:gap-5">
              {isAuthenticated && dashboardUser && (dashboardUser.role === 'admin' || dashboardUser.role === 'moderator' || dashboardUser.role === 'rider') && (
                <Link
                  to={ROLE_HOME[dashboardUser.role]}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/30 text-white text-[10px] tracking-[0.15em] hover:bg-white hover:text-black transition-colors"
                >
                  {dashboardUser.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                  {dashboardUser.role === 'moderator' && <FileText className="h-3 w-3" />}
                  {dashboardUser.role === 'rider' && <Bike className="h-3 w-3" />}
                  {dashboardUser.role.toUpperCase()} PANEL
                </Link>
              )}
              <Link
                to="/custom-request"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-white text-black text-[10px] tracking-[0.15em] font-semibold hover:bg-white/90 transition-colors"
              >
                BESPOKE
              </Link>
              <button
                onClick={() => navigate(isAuthenticated ? '/account' : '/login')}
                className="hidden lg:block text-white text-[11px] tracking-[0.1em] hover:opacity-60 transition-opacity"
              >
                {isAuthenticated ? 'ACCOUNT' : 'SIGN IN'}
              </button>
              {isCustomer && (
                <Link to="/notifications" className="relative p-2 text-white hover:opacity-70 transition-opacity" aria-label="Notifications">
                  <Bell size={18} strokeWidth={1.5} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={toggleCart} className="relative p-2 text-white hover:opacity-70 transition-opacity" aria-label="Cart">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <MobileMenu />
    </>
  );
}