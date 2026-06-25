import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiConfig, apiPost } from '@/lib/api';
import type { User } from '@/types';
import { MOCK_USER } from '@/data/mockData';
import { USE_MOCK } from '@/config';
import type { UserRole, CustomerTier, DashboardUser } from '@/types/dashboard';

interface MockAccount {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tier?: CustomerTier;
  phone?: string;
  avatar?: string;
}

// Mock accounts for the 6 demo personas. Password is "password" for all.
export const MOCK_ACCOUNTS: MockAccount[] = [
  { email: 'standard@havanat.com', password: 'password', name: 'Tunde Bakare', role: 'customer', tier: 'standard', phone: '+234 802 318 0099' },
  { email: 'deluxe@havanat.com', password: 'password', name: 'Folake Adesanya', role: 'customer', tier: 'deluxe', phone: '+234 706 555 8800' },
  { email: 'elite@havanat.com', password: 'password', name: 'Rapheal Ebipado Otele', role: 'customer', tier: 'elite', phone: '+234 803 456 7890' },
  { email: 'admin@havanat.com', password: 'password', name: 'Adaeze Nwosu', role: 'admin', phone: '+234 803 000 0001' },
  { email: 'moderator@havanat.com', password: 'password', name: 'Folake Adetunji', role: 'moderator', phone: '+234 803 000 0002' },
  { email: 'rider@havanat.com', password: 'password', name: 'Tunde Adewale', role: 'rider', phone: '+234 803 111 0001' },
];

interface AuthState {
  user: User | null;
  dashboardUser: DashboardUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<DashboardUser | null>;
  signup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<DashboardUser | null>;
  logout: () => void;
  upgradeTier: (tier: CustomerTier) => void;
  hasRole: (role: UserRole) => boolean;
  hasTier: (tier: CustomerTier) => boolean;
  isAtLeastTier: (tier: CustomerTier) => boolean;
}

function toDashboardUser(acc: MockAccount): DashboardUser {
  return {
    id: `usr_${acc.email.split('@')[0]}`,
    email: acc.email,
    name: acc.name,
    role: acc.role,
    tier: acc.tier,
    phone: acc.phone,
    avatar: MOCK_USER.avatar,
    createdAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      dashboardUser: null,
      isAuthenticated: false,

      login: async (email, password) => {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 600));
          const found = MOCK_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
          if (!found || found.password !== password) {
            return null;
          }
          const dash = toDashboardUser(found);
          const legacyUser: User = {
            id: dash.id,
            name: dash.name,
            email: dash.email,
            membershipTier: dash.tier ?? 'standard',
            phone: dash.phone,
            avatar: dash.avatar,
          };
          set({ user: legacyUser, dashboardUser: dash, isAuthenticated: true });
          return dash;
        }
        return null;
      },

      signup: async (data) => {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 600));
          const dash: DashboardUser = {
            id: 'usr_' + Date.now(),
            email: data.email,
            name: data.name,
            role: 'customer',
            tier: 'standard',
            phone: data.phone,
            createdAt: new Date().toISOString(),
          };
          const legacyUser: User = {
            id: dash.id,
            name: dash.name,
            email: dash.email,
            membershipTier: 'standard',
            phone: data.phone,
          };
          set({ user: legacyUser, dashboardUser: dash, isAuthenticated: true });
          return dash;
        }
        return null;
      },

      logout: () => {
        localStorage.removeItem('havanat-access-token');
        localStorage.removeItem('havanat-refresh-token');
        if (apiConfig.useBackend) {
          apiPost('/api/auth/logout', {}).catch(() => {});
        }
        set({ user: null, dashboardUser: null, isAuthenticated: false });
      },

      upgradeTier: (tier) =>
        set((s) => ({
          user: s.user ? { ...s.user, membershipTier: tier } : null,
          dashboardUser: s.dashboardUser ? { ...s.dashboardUser, tier } : null,
        })),

      hasRole: (role) => get().dashboardUser?.role === role,

      hasTier: (tier) => get().dashboardUser?.tier === tier,

      isAtLeastTier: (tier) => {
        const cur = get().dashboardUser?.tier;
        if (!cur) return false;
        const rank: Record<CustomerTier, number> = { standard: 0, deluxe: 1, elite: 2 };
        return rank[cur] >= rank[tier];
      },
    }),
    { name: 'havanat-auth' }
  )
);
