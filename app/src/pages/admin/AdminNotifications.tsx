import { useMemo, useState } from 'react';
import { CheckCheck, ShoppingCart, RotateCcw, UserPlus, Settings as SettingsIcon, Bell } from 'lucide-react';
import { relativeTime } from '@/utils/formatters';

type NotificationCategory = 'order' | 'return' | 'member' | 'system';

interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const CATEGORY_META: Record<NotificationCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  order: { label: 'Orders', icon: ShoppingCart },
  return: { label: 'Returns', icon: RotateCcw },
  member: { label: 'Members', icon: UserPlus },
  system: { label: 'System', icon: SettingsIcon },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n01', category: 'order', title: 'New order placed', body: 'Tunde Bakare placed order HVN-00255 for ₦485,000.', timestamp: '2026-06-24T11:42:00Z', read: false },
  { id: 'n02', category: 'order', title: 'Order shipped', body: 'HVN-00241 has been dispatched via Tunde Adewale.', timestamp: '2026-06-24T10:18:00Z', read: false },
  { id: 'n03', category: 'return', title: 'Return requested', body: 'Folake Adesanya requested a return on HVN-00238.', timestamp: '2026-06-24T09:55:00Z', read: false },
  { id: 'n04', category: 'member', title: 'New Elite signup', body: 'Rapheal Otele upgraded to the Elite membership tier.', timestamp: '2026-06-24T08:30:00Z', read: true },
  { id: 'n05', category: 'system', title: 'Daily backup complete', body: 'Automated backup of orders, products, and members finished.', timestamp: '2026-06-24T03:00:00Z', read: true },
  { id: 'n06', category: 'order', title: 'Payment confirmed', body: 'Paystack confirmed payment of ₦312,500 for HVN-00253.', timestamp: '2026-06-23T20:12:00Z', read: true },
  { id: 'n07', category: 'return', title: 'Refund processed', body: 'Refund of ₦150,000 issued to Yusuf Bello.', timestamp: '2026-06-23T17:25:00Z', read: true },
  { id: 'n08', category: 'order', title: 'Order cancelled', body: 'Chinwe Eze cancelled order HVN-00219.', timestamp: '2026-06-23T15:02:00Z', read: false },
  { id: 'n09', category: 'member', title: 'Membership paused', body: 'Adaeze Nwosu paused their Deluxe subscription.', timestamp: '2026-06-23T13:48:00Z', read: true },
  { id: 'n10', category: 'system', title: 'Inventory updated', body: '12 products were restocked by the warehouse.', timestamp: '2026-06-23T11:00:00Z', read: true },
  { id: 'n11', category: 'order', title: 'New order placed', body: 'Adaeze Nwosu placed order HVN-00251 for ₦725,000.', timestamp: '2026-06-22T19:33:00Z', read: true },
  { id: 'n12', category: 'return', title: 'Return approved', body: 'Return on HVN-00212 was approved; rider assigned.', timestamp: '2026-06-22T16:20:00Z', read: true },
  { id: 'n13', category: 'member', title: 'New Standard signup', body: 'Aisha Bello signed up for the Standard membership tier.', timestamp: '2026-06-22T14:05:00Z', read: false },
  { id: 'n14', category: 'system', title: 'Email digest sent', body: 'Weekly summary emails were dispatched to 248 members.', timestamp: '2026-06-22T09:00:00Z', read: true },
  { id: 'n15', category: 'order', title: 'Delivery delayed', body: 'Rider reported heavy traffic on HVN-00241 route.', timestamp: '2026-06-21T18:42:00Z', read: true },
  { id: 'n16', category: 'return', title: 'New return requested', body: 'Tunde Bakare requested a return on HVN-00203.', timestamp: '2026-06-21T15:15:00Z', read: false },
  { id: 'n17', category: 'member', title: 'Membership resumed', body: 'Folake Adesanya resumed their Deluxe subscription.', timestamp: '2026-06-21T10:30:00Z', read: true },
  { id: 'n18', category: 'system', title: 'Failed login attempt', body: 'Three failed admin login attempts from 102.89.32.11.', timestamp: '2026-06-20T22:10:00Z', read: true },
  { id: 'n19', category: 'order', title: 'Order delivered', body: 'HVN-00198 successfully delivered to Yusuf Bello.', timestamp: '2026-06-20T16:00:00Z', read: true },
  { id: 'n20', category: 'member', title: 'Tier upgraded', body: 'Chinedu Okafor upgraded from Standard to Deluxe.', timestamp: '2026-06-20T12:00:00Z', read: true },
];

const FILTERS: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'order', label: 'Orders' },
  { value: 'return', label: 'Returns' },
  { value: 'member', label: 'Members' },
  { value: 'system', label: 'System' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread of ${notifications.length}` : 'All caught up'}
          </p>
        </div>
        <button
          onClick={markAllAsRead}
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
              onClick={() => markAsRead(n.id)}
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
                  {!n.read && <span className="h-1.5 w-1.5 bg-black rounded-full" />}
                </div>
                <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{relativeTime(n.timestamp)}</p>
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