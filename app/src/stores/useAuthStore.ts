import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiConfig, apiPost, getAccessToken } from '@/lib/api';
import type { User } from '@/types';
import type { UserRole, CustomerTier, DashboardUser } from '@/types/dashboard';

interface AuthState {
  user: User | null;
  dashboardUser: DashboardUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<DashboardUser | null>;
  signup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<DashboardUser | null>;
  logout: () => void;
  upgradeTier: (tier: CustomerTier) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  fetchUserData: () => Promise<void>;
  startTokenRefresh: () => void;
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
    provider?: 'google' | 'email';
    hasPassword?: boolean;
    googleId?: string | null;
    emailVerified?: boolean;
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
    provider: u.provider,
    hasPassword: u.hasPassword,
    googleId: u.googleId ?? null,
    emailVerified: u.emailVerified ?? false,
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
          
          // Start automatic token refresh
          get().startTokenRefresh();
          
          return dash;
        } catch (err: any) {
          // Import error message utility
          const { getUserFriendlyError } = await import('@/utils/errorMessages');
          throw new Error(getUserFriendlyError(err));
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
          
          // Start automatic token refresh
          get().startTokenRefresh();
          
          return dash;
        } catch (err: any) {
          // Import error message utility
          const { getUserFriendlyError } = await import('@/utils/errorMessages');
          throw new Error(getUserFriendlyError(err));
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('havanat-access-token');
          localStorage.removeItem('havanat-refresh-token');
          
          // Clear token refresh interval
          const interval = (window as any).__havanatTokenRefreshInterval;
          if (interval) {
            clearInterval(interval);
            delete (window as any).__havanatTokenRefreshInterval;
          }
        }
        if (apiConfig.useBackend) {
          apiPost('/api/auth/logout', {}).catch(() => {});
        }
        set({ user: null, dashboardUser: null, isAuthenticated: false });
      },

      startTokenRefresh: () => {
        if (typeof window === 'undefined') return;
        
        // Clear any existing interval
        const existingInterval = (window as any).__havanatTokenRefreshInterval;
        if (existingInterval) clearInterval(existingInterval);
        
        // Refresh token every 30 minutes (tokens expire after 4 hours)
        // This ensures the token is always fresh and 401 errors are minimized
        const interval = setInterval(() => {
          const currentState = useAuthStore.getState();
          if (currentState.isAuthenticated) {
            void currentState.refreshToken();
          } else {
            clearInterval(interval);
            delete (window as any).__havanatTokenRefreshInterval;
          }
        }, 30 * 60 * 1000); // 30 minutes
        
        (window as any).__havanatTokenRefreshInterval = interval;
      },

      upgradeTier: async (tier) => {
        set((s) => ({
          user: s.user ? { ...s.user, membershipTier: tier } : null,
          dashboardUser: s.dashboardUser ? { ...s.dashboardUser, tier } : null,
        }));
        // Rotate the JWT so the new tier claim propagates to API calls.
        await get().refreshToken();
      },

      // Exchange the current refresh token for fresh access + refresh tokens.
      // Used after any operation that changes the user's tier (e.g. Paystack
      // membership upgrade) so the JWT claim reflects the new tier. Without
      // this, the user keeps a stale access token until the refresh window
      // expires or they sign out and back in.
      refreshToken: async (): Promise<boolean> => {
        try {
          const refreshToken = localStorage.getItem('havanat-refresh-token');
          if (!refreshToken) {
            console.warn('[auth] No refresh token found');
            return false;
          }
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
          });
          if (!res.ok) {
            // Token expired or invalid - log user out
            if (res.status === 401 || res.status === 403) {
              console.warn('[auth] Refresh token expired or invalid, logging out');
              get().logout();
            }
            return false;
          }
          const data = await res.json();
          // Update tokens in localStorage
          localStorage.setItem('havanat-access-token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('havanat-refresh-token', data.refreshToken);
          }
          
          // Fetch fresh user data to update the store
          try {
            const userRes = await fetch(`${apiUrl}/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${data.accessToken}` },
              credentials: 'include',
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              const dash = toDashboardUser(userData.user);
              const legacy = toLegacyUser(userData.user, data.accessToken);
              set({ user: legacy, dashboardUser: dash, isAuthenticated: true });
            }
          } catch (err) {
            console.warn('[auth] Failed to fetch user data after refresh:', err);
          }
          
          return true;
        } catch (err) {
          // Silent: the next API call will simply use the old token. If the
          // user really needs a fresh tier claim, they can sign out/in.
          console.warn('[auth] refreshToken failed', err);
          return false;
        }
      },

      // Fetch latest user data from backend and update store
      fetchUserData: async () => {
        try {
          const token = getAccessToken();
          if (!token) return;
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            const dash = toDashboardUser(userData.user);
            const legacy = toLegacyUser(userData.user, token);
            set({ user: legacy, dashboardUser: dash, isAuthenticated: true });
          } else if (res.status === 401) {
            // Try refreshing token
            await get().refreshToken();
          }
        } catch (err) {
          console.warn('[auth] fetchUserData failed', err);
        }
      },

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
      // On hydration, immediately rotate the token so any tier upgrade
      // done in a previous session is reflected in the current session.
      // Also set up automatic token refresh.
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          // Fire-and-forget; the next API call will use the fresh token
          // once it lands in localStorage.
          void state.refreshToken();
          
          // Start automatic token refresh
          state.startTokenRefresh();
        }
      },
    }
  )
);
