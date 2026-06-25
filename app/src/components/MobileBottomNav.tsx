// Auto-hiding bottom tab bar for mobile.
// - Shows when scrolling UP or near the top
// - Hides when scrolling DOWN (gets out of the way while reading)
// - Hides when the footer is in view (to avoid double-nav)
// - Always visible on desktop (lg:visible + fixed)
//
// Usage:
//   <MobileBottomNav
//     items={[{ key: 'orders', label: 'Orders', icon: Package, onClick: () => setActiveTab('orders') }]}
//     activeKey="orders"
//   />

import { useEffect, useRef, useState } from 'react';

export interface MobileBottomNavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  onClick: () => void;
  /** Optional href — if provided, renders as a Link */
  to?: string;
  /** Badge count to show on the icon */
  badge?: number;
}

interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  activeKey?: string;
}

export default function MobileBottomNav({ items, activeKey }: MobileBottomNavProps) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;
        const atTop = currentY < 80;

        // Hide when near footer (footer sentinel is at document bottom)
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const atFooter = docHeight - (currentY + winHeight) < 120;

        if (atTop || atFooter) {
          setVisible(true);
        } else if (diff > 6) {
          // Scrolling DOWN
          setVisible(false);
        } else if (diff < -6) {
          // Scrolling UP
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ key, label, icon: Icon, onClick, badge }) => {
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              onClick={onClick}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors ${
                isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {typeof badge === 'number' && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-semibold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[9px] uppercase tracking-[0.08em] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}