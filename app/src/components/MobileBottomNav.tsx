// Stationary bottom tab bar for mobile (lg:hidden).
// - Always visible, no scroll-hide
// - Mobile only — desktop uses the top Navbar
// - Safe-area-inset-bottom for iPhone home indicator
// - Active tab gets a top accent + bolder weight
// - Optional badge count per item
//
// Usage:
//   <MobileBottomNav
//     items={[{ key: 'orders', label: 'Orders', icon: Package, onClick: () => setActiveTab('orders') }]}
//     activeKey="orders"
//   />

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

/**
 * Stationary bottom tab bar — mobile only (lg:hidden), always visible.
 * No scroll-hide. Sits at the bottom of the viewport at all times.
 */
export default function MobileBottomNav({ items, activeKey }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200"
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