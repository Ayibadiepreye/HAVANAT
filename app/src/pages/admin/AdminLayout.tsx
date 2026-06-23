import { useAuthStore } from '@/stores/useAuthStore';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar';
import { LayoutDashboard, Package, ShoppingCart, Users, RotateCcw, Bike, Crown, FileText, ShieldCheck, Settings, Eye, Users as UsersIcon } from 'lucide-react';

export const ADMIN_NAV_ITEMS: SidebarItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
  { label: 'Riders', href: '/admin/riders', icon: Bike },
  { label: 'Memberships', href: '/admin/memberships', icon: Crown },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Team', href: '/admin/team', icon: UsersIcon },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ShieldCheck },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);

  if (dashboardUser?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout
      title="HAVANAT"
      subtitle="Admin Panel"
      items={ADMIN_NAV_ITEMS}
      backLabel="Back to Site"
      backHref="/"
    >
      {children}
    </DashboardLayout>
  );
}

export function ModeratorLayout({ children }: { children: React.ReactNode }) {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);

  const items: SidebarItem[] = [
    { label: 'Content', href: '/moderator', icon: FileText },
    { label: 'Products', href: '/moderator/products', icon: Eye },
    { label: 'Orders', href: '/moderator/orders', icon: Eye },
  ];

  if (dashboardUser?.role !== 'moderator') return null;
  return (
    <DashboardLayout
      title="HAVANAT"
      subtitle="Moderator Panel"
      items={items}
      backLabel="Back to Site"
      backHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
