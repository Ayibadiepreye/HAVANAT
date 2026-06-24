import { useState } from 'react';
import { Search, Send, ChevronLeft, Mail } from 'lucide-react';

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  orderRef?: string;
}

interface MessageBubble {
  id: string;
  from: 'customer' | 'admin';
  text: string;
  timestamp: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-01',
    customerName: 'Tunde Bakare',
    customerEmail: 'tunde.bakare@example.com',
    initials: 'TB',
    avatarColor: 'bg-gray-900',
    lastMessage: 'Hi, could I get an update on order HVN-00241?',
    timestamp: '2026-06-23T14:22:00Z',
    unread: 2,
    orderRef: 'HVN-00241',
  },
  {
    id: 'conv-02',
    customerName: 'Folake Adesanya',
    customerEmail: 'folake.a@example.com',
    initials: 'FA',
    avatarColor: 'bg-gray-700',
    lastMessage: 'Thanks! The blazer fits perfectly.',
    timestamp: '2026-06-23T11:05:00Z',
    unread: 0,
    orderRef: 'HVN-00238',
  },
  {
    id: 'conv-03',
    customerName: 'Rapheal Otele',
    customerEmail: 'rapheal.o@example.com',
    initials: 'RO',
    avatarColor: 'bg-gray-600',
    lastMessage: 'I would like to schedule a fitting for next week.',
    timestamp: '2026-06-22T17:40:00Z',
    unread: 1,
  },
  {
    id: 'conv-04',
    customerName: 'Chinwe Eze',
    customerEmail: 'chinwe.eze@example.com',
    initials: 'CE',
    avatarColor: 'bg-gray-500',
    lastMessage: 'Please confirm the delivery address change.',
    timestamp: '2026-06-22T09:12:00Z',
    unread: 0,
    orderRef: 'HVN-00219',
  },
  {
    id: 'conv-05',
    customerName: 'Adaeze Nwosu',
    customerEmail: 'adaeze.n@example.com',
    initials: 'AN',
    avatarColor: 'bg-gray-800',
    lastMessage: 'Can I upgrade my membership to Elite?',
    timestamp: '2026-06-21T16:00:00Z',
    unread: 3,
  },
  {
    id: 'conv-06',
    customerName: 'Yusuf Bello',
    customerEmail: 'yusuf.bello@example.com',
    initials: 'YB',
    avatarColor: 'bg-gray-400',
    lastMessage: 'Thanks for the quick refund processing.',
    timestamp: '2026-06-20T12:35:00Z',
    unread: 0,
    orderRef: 'HVN-00198',
  },
];

function mockThread(convId: string): MessageBubble[] {
  return [
    { id: `${convId}-m1`, from: 'customer', text: 'Hello, I have a question about my recent order.', timestamp: '2026-06-23T10:00:00Z' },
    { id: `${convId}-m2`, from: 'admin', text: 'Hi! Happy to help — could you share your order number?', timestamp: '2026-06-23T10:02:00Z' },
    { id: `${convId}-m3`, from: 'customer', text: 'Sure, it is HVN-00241. Just wanted to confirm the delivery window.', timestamp: '2026-06-23T10:04:00Z' },
    { id: `${convId}-m4`, from: 'admin', text: 'Your order is in transit and expected to arrive within 24-48 hours.', timestamp: '2026-06-23T10:08:00Z' },
  ];
}

function formatPreviewTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date('2026-06-24T12:00:00Z');
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminMessages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  const filtered = MOCK_CONVERSATIONS.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.customerName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
  });

  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Messages</h2>
        <p className="text-sm text-gray-500 mt-1">Conversations with your customers.</p>
      </div>

      <div className="bg-white border border-gray-200 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[560px]">
        {/* Conversation list */}
        <div className="border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filtered.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`h-10 w-10 ${c.avatarColor} text-white flex items-center justify-center text-xs font-medium uppercase flex-shrink-0`}>
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.customerName}</p>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
                          {formatPreviewTime(c.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="ml-auto self-center inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-black text-white text-[10px] font-semibold">
                        {c.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-6 text-center text-xs text-gray-500">No conversations found</li>
            )}
          </ul>
        </div>

        {/* Conversation view */}
        <div className="flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1 hover:bg-gray-100"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className={`h-10 w-10 ${selected.avatarColor} text-white flex items-center justify-center text-xs font-medium uppercase`}>
                  {selected.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{selected.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{selected.customerEmail}</p>
                </div>
                {selected.orderRef && (
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-200 px-2 py-1">
                    {selected.orderRef}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
                {mockThread(selected.id).map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 text-sm ${
                        m.from === 'admin'
                          ? 'bg-black text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 uppercase tracking-wider ${m.from === 'admin' ? 'text-gray-300' : 'text-gray-400'}`}>
                        {formatBubbleTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim()) {
                      setDraft('');
                    }
                  }}
                />
                <button
                  disabled={!draft.trim()}
                  className="bg-black text-white px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Mail className="h-8 w-8 text-gray-300 mb-3" />
              <p className="font-serif text-lg font-light">Select a conversation</p>
              <p className="text-xs text-gray-500 mt-1">Choose from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}