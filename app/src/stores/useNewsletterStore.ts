// Newsletter subscriber list. Mock equivalent of an email-list table on the backend.
// Backend cutover: backend/schema/subscribers.sql with columns id, email, created_at, ip, source='footer'.
// Then a cron job fan-outs any 'general' broadcast with channels='email' to all subscribers.
// Admin/moderator broadcasts with scope='all' will trigger Resend.send to this list automatically.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NewsletterState {
  subscribers: string[];
  subscribe: (email: string) => void;
  unsubscribe: (email: string) => void;
  isSubscribed: (email: string) => boolean;
}

export const useNewsletterStore = create<NewsletterState>()(
  persist(
    (set, get) => ({
      subscribers: [],
      subscribe: (email) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || get().subscribers.includes(normalized)) return;
        set({ subscribers: [...get().subscribers, normalized] });
      },
      unsubscribe: (email) => {
        const normalized = email.trim().toLowerCase();
        set({ subscribers: get().subscribers.filter((e) => e !== normalized) });
      },
      isSubscribed: (email) => get().subscribers.includes(email.trim().toLowerCase()),
    }),
    { name: 'havanat-newsletter' }
  )
);