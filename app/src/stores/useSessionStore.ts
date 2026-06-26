// Active sessions: backed by GET /api/auth/sessions (DB: refresh_tokens table).
// Each non-revoked, non-expired refresh token is an active session.
// "current" is the most-recently-created session for that user.

import { create } from 'zustand';
import { apiGet, apiDelete } from '../lib/api';

export interface Session {
  id: string;
  device: string;
  ip: string;
  createdAt: string;
  current: boolean;
}

interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  revoke: (id: string) => Promise<void>;
  revokeAllOthers: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiGet<{ sessions: Session[] }>('/api/auth/sessions', true);
      set({ sessions: data.sessions ?? [], loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load sessions', loading: false });
    }
  },

  revoke: async (id: string) => {
    // Optimistic update
    set({ sessions: get().sessions.filter((s) => s.id !== id) });
    try {
      await apiDelete(`/api/auth/sessions/${encodeURIComponent(id)}`, true);
    } catch (err: any) {
      // Revert by refetching
      await get().fetch();
      throw err;
    }
  },

  revokeAllOthers: async () => {
    // Optimistic update: keep only current
    const current = get().sessions.find((s) => s.current);
    set({ sessions: current ? [current] : [] });
    try {
      await apiDelete('/api/auth/sessions', true);
    } catch (err: any) {
      await get().fetch();
      throw err;
    }
  },
}));
