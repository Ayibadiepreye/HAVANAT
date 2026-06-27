import { useState, useEffect, useMemo } from 'react';
import { Search, Send, Mail } from 'lucide-react';
import { apiConfig, apiGet } from '@/lib/api';

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  initials: string;
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

interface ThreadResponse {
  conversation: Conversation;
  messages: MessageBubble[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

function formatPreviewTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function formatBubbleTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessageBubble[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiConfig.useBackend) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await apiGet<{ items: Conversation[] }>('/api/messages/conversations');
        setConversations(res.items ?? []);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId || !apiConfig.useBackend) return;
    (async () => {
      try {
        const res = await apiGet<ThreadResponse>(`/api/messages/conversations/${selectedId}`);
        setThread(res.messages ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load messages');
      }
    })();
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Messages</h2>
        <p className="text-sm text-gray-500 mt-1">Conversations with your customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[600px]">
        {/* Conversation list */}
        <div className="lg:col-span-1 border border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '560px' }}>
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading conversations…</div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Customer messages will appear here.
                </p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedId === c.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {initials(c.customerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.customerName}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatPreviewTime(c.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                      {c.orderRef && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">{c.orderRef}</p>
                      )}
                    </div>
                    {c.unread > 0 && (
                      <span className="bg-black text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread panel */}
        <div className="lg:col-span-2 border border-gray-200 bg-white flex flex-col">
          {selected ? (
            <>
              <div className="p-5 border-b border-gray-200">
                <p className="font-serif text-lg">{selected.customerName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selected.customerEmail}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '500px' }}>
                {thread.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 text-sm ${
                          m.from === 'admin'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            m.from === 'admin' ? 'text-white/60' : 'text-gray-400'
                          }`}
                        >
                          {formatBubbleTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply…"
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim()) {
                      // Local-only optimistic append; real backend POST not yet implemented
                      setThread((prev) => [
                        ...prev,
                        {
                          id: `local-${Date.now()}`,
                          from: 'admin',
                          text: draft.trim(),
                          timestamp: new Date().toISOString(),
                        },
                      ]);
                      setDraft('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (!draft.trim()) return;
                    setThread((prev) => [
                      ...prev,
                      {
                        id: `local-${Date.now()}`,
                        from: 'admin',
                        text: draft.trim(),
                        timestamp: new Date().toISOString(),
                      },
                    ]);
                    setDraft('');
                  }}
                  disabled={!draft.trim()}
                  className="px-5 py-2.5 bg-black text-white text-xs tracking-[0.15em] font-semibold uppercase hover:bg-black/80 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-12">
              <div>
                <Mail size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-serif text-lg mb-1">No conversation selected</p>
                <p className="text-sm text-gray-500">
                  Select a conversation from the list to view messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}