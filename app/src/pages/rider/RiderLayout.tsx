import {
  LayoutDashboard,
  Package,
  RotateCcw,
  DollarSign,
  User as UserIcon,
} from 'lucide-react';
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';

export const RIDER_NAV_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/rider', icon: LayoutDashboard },
  { label: 'Deliveries', href: '/rider/deliveries', icon: Package },
  { label: 'Pickups', href: '/rider/pickups', icon: RotateCcw },
  { label: 'Earnings', href: '/rider/earnings', icon: DollarSign },
  { label: 'Profile', href: '/rider/profile', icon: UserIcon },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);

  if (dashboardUser?.role !== 'rider') {
    return null;
  }

  return (
    <DashboardLayout
      title="HAVANAT"
      subtitle="Rider Panel"
      items={RIDER_NAV_ITEMS}
      backLabel="Back to Site"
      backHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
