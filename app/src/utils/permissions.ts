// Role-based permission helpers for dashboards

import type { UserRole, CustomerTier } from '@/types/dashboard';

export type Action =
  | 'view_admin'
  | 'view_moderator'
  | 'view_rider'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_members'
  | 'manage_returns'
  | 'manage_riders'
  | 'manage_memberships'
  | 'manage_content'
  | 'view_audit_log'
  | 'manage_settings'
  | 'view_only_products'
  | 'view_only_orders'
  | 'edit_content'
  | 'process_delivery';

const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  customer: [],
  admin: [
    'view_admin', 'manage_products', 'manage_orders', 'manage_members',
    'manage_returns', 'manage_riders', 'manage_memberships', 'manage_content',
    'view_audit_log', 'manage_settings',
  ],
  moderator: [
    'view_moderator', 'edit_content', 'view_only_products', 'view_only_orders',
  ],
  rider: ['view_rider', 'process_delivery'],
};

export function hasPermission(role: UserRole | undefined, action: Action): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function canAccessAdmin(role: UserRole | undefined): boolean {
  return hasPermission(role, 'view_admin');
}

export function canAccessModerator(role: UserRole | undefined): boolean {
  return hasPermission(role, 'view_moderator');
}

export function canAccessRider(role: UserRole | undefined): boolean {
  return hasPermission(role, 'view_rider');
}

const TIER_RANK: Record<CustomerTier, number> = { standard: 0, deluxe: 1, elite: 2 };

export function isAtLeastTier(userTier: CustomerTier | undefined, required: CustomerTier): boolean {
  if (!userTier) return false;
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  admin: 'Admin',
  moderator: 'Moderator',
  rider: 'Rider',
};

export const ROLE_HOME: Record<UserRole, string> = {
  customer: '/account',
  admin: '/admin',
  moderator: '/moderator',
  rider: '/rider',
};
