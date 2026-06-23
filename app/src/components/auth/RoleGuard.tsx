import { useEffect, useMemo, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import type { UserRole } from '@/types/dashboard';

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const toasted = useRef(false);
  const location = useLocation();

  // Stabilize the roles array so the effect below doesn't re-fire every render.
  const rolesKey = roles.join(',');
  const rolesArr = useMemo(() => roles, [rolesKey]);

  const allowed = isAuthenticated && !!dashboardUser && rolesArr.includes(dashboardUser.role);

  useEffect(() => {
    if (isAuthenticated && dashboardUser && !rolesArr.includes(dashboardUser.role) && !toasted.current) {
      toasted.current = true;
      showToast('Access denied. Insufficient permissions.', 'error');
    }
    if (allowed) {
      toasted.current = false;
    }
  }, [isAuthenticated, dashboardUser?.role, allowed, showToast, rolesArr]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!allowed) {
    return <Navigate to="/account" replace />;
  }
  return <>{children}</>;
}
