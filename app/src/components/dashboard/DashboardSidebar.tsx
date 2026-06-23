import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
  bottomNote?: { label: string; href: string };
  className?: string;
  // Mobile drawer state
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function DashboardSidebar({
  title, subtitle, items, currentPath, onNavigate,
  bottomNote, className, mobileOpen = false, onCloseMobile,
}: SidebarProps) {
  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [mobileOpen]);

  const handleClick = (e: React.MouseEvent, href: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
    onCloseMobile?.();
  };

  const sidebarContent = (
    <>
      <div className="p-5 lg:p-6 border-b border-gray-800 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-white">{title}</h2>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1 font-medium">{subtitle}</p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-gray-300 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="py-4 lg:py-6 flex-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/admin' && item.href !== '/moderator' && item.href !== '/rider' && currentPath.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={cn(
                'flex items-center gap-3 px-5 lg:px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors',
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-900 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {bottomNote && (
        <div className="p-5 lg:p-6 border-t border-gray-800 flex-shrink-0">
          <a
            href={bottomNote.href}
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate(bottomNote.href);
              }
              onCloseMobile?.();
            }}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white flex items-center gap-2"
          >
            <span>←</span> {bottomNote.label}
          </a>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex w-64 bg-black text-white fixed h-screen flex-col',
        className
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onCloseMobile}
        />
        {/* Drawer */}
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-black text-white flex flex-col shadow-2xl transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
