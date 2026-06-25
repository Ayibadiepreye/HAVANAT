import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { NOTIFICATION_CATEGORIES, type NotificationCategory, type NotificationChannel, type NotificationScope } from '@/types/notifications';
import { Send, Mail, MessageSquare } from 'lucide-react';

export default function AdminBroadcastPage() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const broadcast = useNotificationStore((s) => s.broadcast);
  const notifications = useNotificationStore((s) => s.notifications);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('general');
  const [channels, setChannels] = useState<NotificationChannel>('both');
  const [scope, setScope] = useState<NotificationScope>('all');
  const [targetTier, setTargetTier] = useState<'Standard' | 'Deluxe' | 'Elite'>('Standard');
  const [targetEmail, setTargetEmail] = useState('');

  const canSend = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (scope === 'tier' && !targetTier) return false;
    if (scope === 'user' && !targetEmail.trim()) return false;
    return true;
  }, [title, body, scope, targetTier, targetEmail]);

  function send() {
    if (!dashboardUser) return;
    if (!canSend) return;
    broadcast(
      {
        title,
        body,
        category,
        channels,
        scope,
        targetTier: scope === 'tier' ? targetTier : undefined,
        targetUserId: scope === 'user' ? targetEmail : undefined,
      },
      { id: dashboardUser.id, name: dashboardUser.name, role: dashboardUser.role as 'admin' | 'moderator' }
    );
    showToast(
      scope === 'all' ? 'Broadcast sent to all subscribers' : scope === 'tier' ? `Sent to ${targetTier} members` : `Sent to ${targetEmail}`,
      'success'
    );
    setTitle('');
    setBody('');
  }

  const recentBroadcasts = notifications.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Broadcast</h2>
        <p className="text-sm text-gray-500 mt-1">Send a notification to customers via in-app bell + email.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Summer collection is live"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Browse the new arrivals — hand-tailored in our studio, shipped nationwide within 5 business days."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">{body.length}/500</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Audience</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as NotificationScope)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
                <option value="all">Everyone (broadcast)</option>
                <option value="tier">Specific tier</option>
                <option value="user">Specific customer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as NotificationCategory)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
                {NOTIFICATION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {scope === 'tier' && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Tier</label>
              <select value={targetTier} onChange={(e) => setTargetTier(e.target.value as 'Standard' | 'Deluxe' | 'Elite')} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Elite">Elite</option>
              </select>
            </div>
          )}
          {scope === 'user' && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-1.5 font-medium">Customer email</label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-700 mb-2 font-medium">Channels</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'in_app' as const, label: 'In-app only', icon: MessageSquare },
                { value: 'email' as const, label: 'Email only', icon: Mail },
                { value: 'both' as const, label: 'In-app + Email', icon: Send },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannels(value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium border transition-colors ${
                    channels === value ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'
                  }`}
                ><Icon size={12} /> {label}</button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={send}
              disabled={!canSend}
              className="w-full bg-black text-white py-3.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-3.5 w-3.5" /> Send broadcast
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Recent broadcasts</p>
          {recentBroadcasts.length === 0 ? (
            <p className="text-sm text-gray-500">No broadcasts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentBroadcasts.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="font-medium truncate">{n.title}</p>
                  <p className="text-xs text-gray-500">
                    {n.scope === 'all' ? 'Everyone' : n.scope === 'tier' ? `${n.targetTier} tier` : `User ${n.targetUserId}`}
                    {' · '}
                    {n.channels === 'in_app' ? 'In-app' : n.channels === 'email' ? 'Email' : 'In-app + Email'}
                    {' · '}
                    {new Date(n.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}