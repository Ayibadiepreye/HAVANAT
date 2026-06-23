import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { ROLE_HOME } from '@/utils/permissions';
import DashboardSidebar from './DashboardSidebar';
import type { SidebarItem } from './DashboardSidebar';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  children: React.ReactNode;
  backLabel?: string;
  backHref?: string;
}

export default function DashboardLayout({ title, subtitle, items, children, backLabel = 'Back to Site', backHref = '/' }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        title={title}
        subtitle={subtitle}
        items={items}
        currentPath={location.pathname}
        onNavigate={(href) => navigate(href)}
        bottomNote={{ label: backLabel, href: backHref }}
      />

      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="font-serif text-2xl font-light">
            {items.find((i) => location.pathname === i.href || (i.href !== '/admin' && i.href !== '/moderator' && i.href !== '/rider' && location.pathname.startsWith(i.href)))?.label ?? subtitle}
          </h1>
          <div className="flex items-center gap-5">
            <button
              aria-label="Notifications"
              className="text-gray-500 hover:text-black transition-colors"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
              >
                <div className="h-8 w-8 bg-black text-white flex items-center justify-center text-xs font-semibold rounded-full">
                  {dashboardUser?.name?.[0] ?? '?'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium leading-tight">{dashboardUser?.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{dashboardUser?.role}</p>
                </div>
                <ChevronDown className="h-3 w-3" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 w-56 z-40"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-medium">{dashboardUser?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dashboardUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate(ROLE_HOME[dashboardUser?.role ?? 'customer']);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-gray-50 transition-colors"
                  >
                    My Panel
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100 text-red-600"
                  >
                    <LogOut className="h-3 w-3" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
