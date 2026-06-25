// Notifications store + types.
// Channels: in-app (banner / bell icon), email, both.
// Scope: 'user' (single customer) | 'tier' (e.g. all Deluxe members) | 'all' (broadcast).
// Category: general | order | return | membership | promotion | system.

export type NotificationCategory = 'general' | 'order' | 'return' | 'membership' | 'promotion' | 'system';
export type NotificationChannel = 'in_app' | 'email' | 'both';
export type NotificationScope = 'user' | 'tier' | 'all';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  /** When true, the notification appears in the bell + email. */
  channels: NotificationChannel;
  scope: NotificationScope;
  /** User id when scope = 'user'. Tier name when scope = 'tier'. Unused when scope = 'all'. */
  targetUserId?: string;
  targetTier?: 'Standard' | 'Deluxe' | 'Elite';
  /** Author of the broadcast (admin or moderator). */
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'moderator' | 'system';
  createdAt: string;
  /** Per-recipient read flag, keyed by userId. */
  readBy: Record<string, boolean>;
}

export const NOTIFICATION_CATEGORIES: { value: NotificationCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'order', label: 'Orders' },
  { value: 'return', label: 'Returns' },
  { value: 'membership', label: 'Membership' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'system', label: 'System' },
];