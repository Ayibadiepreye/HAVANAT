// Active sessions for the customer. Mock: 3 sessions, 1 is current.
// Backend cutover: GET /api/auth/sessions, DELETE /api/auth/sessions/:id, DELETE /api/auth/sessions (all except current).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface SessionState {
  sessions: Session[];
  revoke: (id: string) => void;
  revokeAllOthers: () => void;
}

const DEFAULT_SESSIONS: Session[] = [
  { id: 'sess-1', device: 'iPhone 15 Pro · Safari', location: 'Port Harcourt, Rivers State', ip: '197.210.85.4', lastActive: new Date().toISOString(), current: true },
  { id: 'sess-2', device: 'MacBook Air · Chrome', location: 'Lagos, Lagos', ip: '105.112.45.91', lastActive: '2026-06-23T14:08:00Z', current: false },
  { id: 'sess-3', device: 'iPad Pro · Safari', location: 'Abuja, FCT', ip: '102.89.32.118', lastActive: '2026-06-19T09:22:00Z', current: false },
];

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: DEFAULT_SESSIONS,
      revoke: (id) => set({ sessions: get().sessions.filter((s) => s.id === id || s.current) }),
      revokeAllOthers: () => set({ sessions: get().sessions.filter((s) => s.current) }),
    }),
    { name: 'havanat-sessions' }
  )
);