// Notifications store. Backend-equivalent in the mock: all data lives in localStorage.
// On backend cutover this becomes:
//   POST   /api/notifications           — admin/moderator broadcasts
//   GET    /api/notifications           — per-user feed (auto-scoped by JWT)
//   PATCH  /api/notifications/:id/read  — mark as read
//   POST   /api/notifications/email     — server-side: same payload also dispatched via Resend
//
// Email delivery in the mock: console.info(...). Backend cutover replaces with Resend.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification, NotificationCategory, NotificationChannel, NotificationScope } from '@/types/notifications';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface Actor { id: string; name: string; role: 'admin' | 'moderator' | 'system' }

interface NotificationState {
  fetchNotifications: () => Promise<void>;
  notifications: AppNotification[];
  broadcast: (input: {
    title: string;
    body: string;
    category: NotificationCategory;
    channels: NotificationChannel;
    scope: NotificationScope;
    targetUserId?: string;
    targetTier?: 'Standard' | 'Deluxe' | 'Elite';
  }, actor: Actor) => AppNotification;
  markRead: (id: string, userId: string) => void;
  markAllRead: (userId: string) => void;
  remove: (id: string) => void;
  /** Get the per-user feed. Backend: GET /api/notifications. */
  forUser: (userId: string, userTier?: 'Standard' | 'Deluxe' | 'Elite') => AppNotification[];
  /** Count of unread notifications for a user. Used by the bell badge. */
  unreadCount: (userId: string, userTier?: 'Standard' | 'Deluxe' | 'Elite') => number;
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function sendEmail(notif: AppNotification, recipientLabel: string) {
  // eslint-disable-next-line no-console
  console.info(
    `[mock-email] To: ${recipientLabel} — Subject: ${notif.title} — ${notif.body.slice(0, 80)}${notif.body.length > 80 ? '…' : ''}`
  );
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      fetchNotifications: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const [list] = await Promise.all([
            apiGet<{ items: any[] }>('/api/notifications', true).catch(() => ({ items: [] })),
            apiGet<{ count: number }>('/api/notifications/unread-count', true).catch(() => ({ count: 0 })) as unknown as { count: number },
          ]);
          set({
            notifications: list.items.map((n) => ({
              id: String(n.id),
              category: (n.category ?? 'system') as any,
              title: n.title ?? '',
              body: n.body ?? '',
              channels: (n.channels ?? 'inapp') as any,
              scope: (n.scope ?? 'all') as any,
              authorId: n.authorId != null ? String(n.authorId) : undefined,
              authorName: n.authorName ?? 'system',
              authorRole: (n.authorRole ?? 'system') as any,
              readBy: (n.readBy ?? {}) as Record<string, boolean>,
              createdAt: n.createdAt ?? nowIso(),
              read: !!(n.readBy?.[String(useAuthStore.getState().dashboardUser?.id ?? 0)]),
            } as unknown as AppNotification)),
          });
        } catch (err) {
          console.error('fetchNotifications failed', err);
        }
      },
      markRead: (id: string, userId: string) => {
        // localStorage mode (default): also hit backend if available
        if (apiConfig.useBackend) apiPost(`/api/notifications/${id}/read`, {}, true).catch((e) => console.warn('[markRead]', e));
        set((s: NotificationState) => ({
          notifications: s.notifications.map((n: AppNotification) => {
            if (n.id !== id) return n;
            const newReadBy = { ...((n.readBy ?? {}) as Record<string, boolean>), [userId]: true };
            return { ...n, readBy: newReadBy as any, read: true };
          }),
        }));
      },
      markAllRead: (userId: string) => {
        if (apiConfig.useBackend) apiPost('/api/notifications/read-all', {}, true).catch((e) => console.warn('[markAllRead]', e));
        set((s: NotificationState) => ({
          notifications: s.notifications.map((n: AppNotification) => ({
            ...n,
            readBy: { ...((n.readBy ?? {}) as Record<string, boolean>), [userId]: true } as any,
            read: true,
          })),
        }));
      },
      broadcast: (input, actor) => {
        const notif: AppNotification = {
          id: newId(),
          title: input.title.trim(),
          body: input.body.trim(),
          category: input.category,
          channels: input.channels,
          scope: input.scope,
          targetUserId: input.targetUserId,
          targetTier: input.targetTier,
          authorId: actor.id,
          authorName: actor.name,
          authorRole: actor.role,
          createdAt: nowIso(),
          readBy: {},
        };
        set({ notifications: [notif, ...get().notifications] });

        // Mock fan-out: log + email the channel mix
        if (notif.channels === 'email' || notif.channels === 'both') {
          let recipient = 'all subscribers';
          if (notif.scope === 'user' && notif.targetUserId) recipient = notif.targetUserId;
          else if (notif.scope === 'tier' && notif.targetTier) recipient = `all ${notif.targetTier} members`;
          sendEmail(notif, recipient);
        }

        logAuditAction({
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'create',
          entityType: 'notification',
          entityId: notif.id,
          entityLabel: `Notification: ${notif.title}`,
          summary: `Broadcast ${notif.scope} via ${notif.channels}`,
          changes: { before: null, after: { title: notif.title, scope: notif.scope, channels: notif.channels } },
        });
        return notif;
      },
      remove: (id) => {
        set({ notifications: get().notifications.filter((n) => n.id !== id) });
      },
      forUser: (userId, userTier) => {
        return get().notifications.filter((n) => {
          if (n.scope === 'all') return true;
          if (n.scope === 'user') return n.targetUserId === userId;
          if (n.scope === 'tier') return n.targetTier === userTier;
          return false;
        });
      },
      unreadCount: (userId, userTier) => {
        return get().forUser(userId, userTier).filter((n) => !n.readBy[userId]).length;
      },
    }),
    { name: 'havanat-notifications' }
  )
);