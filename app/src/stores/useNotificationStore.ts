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

interface Actor { id: string; name: string; role: 'admin' | 'moderator' | 'system' }

interface NotificationState {
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
      markRead: (id, userId) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, readBy: { ...n.readBy, [userId]: true } } : n
          ),
        });
      },
      markAllRead: (userId) => {
        set({
          notifications: get().notifications.map((n) => ({ ...n, readBy: { ...n.readBy, [userId]: true } })),
        });
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