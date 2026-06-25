import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {Bell, Mail, Filter, Check, X} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from '@/types/notifications';

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const notifications = useNotificationStore((s) => s.notifications);

  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');

  const userId = user?.id ?? 'guest';
  const userTier = user?.membershipTier;
  const visible = useMemo(() => {
    const base = notifications.filter((n) => {
      if (n.scope === 'all') return true;
      if (n.scope === 'user') return n.targetUserId === userId;
      if (n.scope === 'tier') return n.targetTier === userTier;
      return false;
    });
    if (filter === 'all') return base;
    return base.filter((n) => n.category === filter);
  }, [notifications, filter, userId, userTier]);

  const unread = visible.filter((n) => !n.readBy[userId]).length;

  if (!user) {
    return (
      <main className="min-h-screen pt-20 lg:pt-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Bell className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <h1 className="font-serif text-2xl mb-2">Sign in to see your notifications</h1>
          <p className="text-sm text-gray-500 mb-6">Order updates, returns, and broadcast messages will appear here once you're signed in.</p>
          <Link to="/login" className="inline-block px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium">Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-gray-500 hover:text-black mb-6"
          aria-label="Close and go back"
        >
          <X size={14} strokeWidth={1.5} /> Back
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-2">Inbox</p>
            <h1 className="font-serif text-2xl sm:text-3xl">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">{unread} unread of {visible.length}</p>
          </div>
          <button
            onClick={() => markAllRead(userId)}
            disabled={unread === 0}
            className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Mark all read
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1 flex-shrink-0 mr-1">
            <Filter size={11} /> Filter
          </span>
          {(['all', ...NOTIFICATION_CATEGORIES.map((c) => c.value)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c as NotificationCategory | 'all')}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium flex-shrink-0 transition-colors ${
                filter === c ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <Bell className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No notifications in this view.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((n) => {
              const isUnread = !n.readBy[userId];
              return (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id, userId)}
                  className={`bg-white border p-4 cursor-pointer transition-colors ${
                    isUnread ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-black' : 'bg-gray-200'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium ${isUnread ? 'text-black' : 'text-gray-700'}`}>{n.title}</p>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 flex-shrink-0">{n.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{n.body}</p>
                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-400">
                        <span>{new Date(n.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {n.channels !== 'in_app' && (
                          <span className="inline-flex items-center gap-1"><Mail size={10} /> Email sent</span>
                        )}
                        <span>From {n.authorName}</span>
                      </div>
                    </div>
                    {isUnread && (
                      <Check
                        size={14}
                        className="text-gray-400 hover:text-black flex-shrink-0 mt-1"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id, userId); }}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}