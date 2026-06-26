import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiConfig, apiPost } from '@/lib/api';
import type { User } from '@/types';
import type { UserRole, CustomerTier, DashboardUser } from '@/types/dashboard';

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

interface BackendLoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    tier?: CustomerTier;
    phone?: string;
    avatarUrl?: string | null;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface BackendRegisterResponse extends BackendLoginResponse {}

function toDashboardUser(u: BackendLoginResponse['user']): DashboardUser {
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role,
    tier: u.tier,
    phone: u.phone,
    avatar: u.avatarUrl ?? undefined,
    createdAt: u.createdAt,
  };
}

function toLegacyUser(u: BackendLoginResponse['user'], accessToken: string): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    membershipTier: u.tier ?? 'standard',
    phone: u.phone,
    avatar: u.avatarUrl ?? undefined,
    accessToken,
  } as User;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      dashboardUser: null,
      isAuthenticated: false,

      login: async (email, password) => {
        if (!apiConfig.useBackend) {
          throw new Error('Backend not configured. Set VITE_USE_BACKEND=true in .env');
        }
        try {
          const res = await apiPost<BackendLoginResponse>('/api/auth/login', { email, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('havanat-access-token', res.accessToken);
            localStorage.setItem('havanat-refresh-token', res.refreshToken);
          }
          const dash = toDashboardUser(res.user);
          const legacy = toLegacyUser(res.user, res.accessToken);
          set({ user: legacy, dashboardUser: dash, isAuthenticated: true });
          return dash;
        } catch (err: any) {
          throw new Error(err?.message || 'Login failed');
        }
      },

      signup: async (data) => {
        if (!apiConfig.useBackend) {
          throw new Error('Backend not configured. Set VITE_USE_BACKEND=true in .env');
        }
        try {
          const res = await apiPost<BackendRegisterResponse>('/api/auth/register', data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('havanat-access-token', res.accessToken);
            localStorage.setItem('havanat-refresh-token', res.refreshToken);
          }
          const dash = toDashboardUser(res.user);
          const legacy = toLegacyUser(res.user, res.accessToken);
          set({ user: legacy, dashboardUser: dash, isAuthenticated: true });
          return dash;
        } catch (err: any) {
          throw new Error(err?.message || 'Signup failed');
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('havanat-access-token');
          localStorage.removeItem('havanat-refresh-token');
        }
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
    {
      name: 'havanat-auth',
      partialize: (state) => ({ dashboardUser: state.dashboardUser, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
