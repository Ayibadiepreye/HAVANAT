import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ShoppingCart, RotateCcw, UserPlus, Settings as SettingsIcon, Bell } from 'lucide-react';
import { relativeTime, formatDateTime } from '@/utils/formatters';
import { useAuditLogStore } from '@/stores/useAuditLogStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AuditLogEntry } from '@/types/dashboard';
import type { NotificationCategory } from '@/types/notifications';

type AdminCategory = 'order' | 'return' | 'member' | 'system' | 'audit';

const CATEGORY_META: Record<AdminCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  order: { label: 'Orders', icon: ShoppingCart },
  return: { label: 'Returns', icon: RotateCcw },
  member: { label: 'Members', icon: UserPlus },
  system: { label: 'System', icon: SettingsIcon },
  audit: { label: 'Audit', icon: Bell },
};

const FILTERS: { value: AdminCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'order', label: 'Orders' },
  { value: 'return', label: 'Returns' },
  { value: 'member', label: 'Members' },
  { value: 'system', label: 'System' },
  { value: 'audit', label: 'Audit' },
];

// Map an audit log entity type to one of the visible admin categories.
function categoryForAudit(entityType: string): AdminCategory {
  if (entityType === 'order' || entityType === 'payment') return 'order';
  if (entityType === 'return' || entityType === 'refund') return 'return';
  if (entityType === 'membership' || entityType === 'member' || entityType === 'user') return 'member';
  return 'system';
}

function mapNotificationCategory(c?: string | null): AdminCategory {
  if (c === 'order' || c === 'payment') return 'order';
  if (c === 'return') return 'return';
  if (c === 'membership') return 'member';
  return 'system';
}

interface AdminNotification {
  id: string;
  category: AdminCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  source: 'audit' | 'notification';
}

export default function AdminNotifications() {
  const auditLogs = useAuditLogStore((s) => s.logs);
  const fetchAuditLogs = useAuditLogStore((s) => s.fetchAuditLogs);
  const notifications = useNotificationStore((s) => s.notifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const userId = dashboardUser?.id ?? 'admin';

  const [filter, setFilter] = useState<AdminCategory | 'all'>('all');

  useEffect(() => {
    void fetchAuditLogs();
    void fetchNotifications();
  }, [fetchAuditLogs, fetchNotifications]);

  // Merge both sources into a single timeline.
  const items = useMemo<AdminNotification[]>(() => {
    const fromAudit: AdminNotification[] = (auditLogs ?? []).map((l: AuditLogEntry) => ({
      id: `audit-${l.id}`,
      category: categoryForAudit(l.entityType),
      title: l.entityLabel ?? l.entityType,
      body: l.summary ?? '',
      timestamp: l.createdAt ?? new Date().toISOString(),
      read: true, // audit entries are admin-only, no per-user read state
      source: 'audit' as const,
    }));
    const fromNotif: AdminNotification[] = (notifications ?? []).map((n: any) => ({
      id: `notif-${n.id}`,
      category: mapNotificationCategory(n.category),
      title: n.title ?? 'Notification',
      body: n.body ?? '',
      timestamp: n.createdAt ?? new Date().toISOString(),
      read: !!n.read,
      source: 'notification' as const,
    }));
    return [...fromNotif, ...fromAudit].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditLogs, notifications]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'audit') return items.filter((n) => n.source === 'audit');
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAsRead = (n: AdminNotification) => {
    if (n.source === 'notification') {
      // Extract numeric id from 'notif-<id>'.
      const idStr = n.id.replace(/^notif-/, '');
      const numId = Number(idStr);
      if (Number.isInteger(numId) && numId > 0) {
        void markRead(String(numId), userId);
      }
    }
  };

  const handleMarkAllRead = () => {
    void markAllRead(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread of ${items.length}` : `${items.length} entries`}
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium px-4 py-2.5 border border-gray-300 hover:border-black disabled:opacity-40 disabled:hover:border-gray-300 transition-colors"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
                isActive ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 divide-y divide-gray-100">
        {filtered.map((n) => {
          const meta = CATEGORY_META[n.category];
          const Icon = meta.icon;
          return (
            <button
              key={n.id}
              onClick={() => handleMarkAsRead(n)}
              className={`w-full text-left p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                !n.read ? 'bg-gray-50/50' : ''
              }`}
            >
              <div
                className={`h-9 w-9 flex items-center justify-center flex-shrink-0 border ${
                  !n.read ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm ${!n.read ? 'font-medium' : 'font-normal text-gray-800'}`}>{n.title}</p>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">{meta.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-300">·</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">{n.source}</span>
                  {!n.read && <span className="h-1.5 w-1.5 bg-black rounded-full" />}
                </div>
                <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{formatDateTime(n.timestamp)}</p>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <Bell className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No notifications in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}