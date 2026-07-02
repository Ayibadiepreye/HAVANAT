import { useEffect, useState } from 'react';
import { MessageCircle, Send, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useUIStore } from '@/stores/useUIStore';
import { formatNaira } from '@/config';

interface BespokeMessage {
  from: 'admin' | 'customer';
  message: string;
  timestamp: string;
  senderName: string;
  imageUrl?: string;
}

interface BespokeRequest {
  id: number;
  reference: string;
  occasion: string;
  budget: string | null;
  timeline: string;
  description: string;
  images: string[];
  status: string;
  conversation: BespokeMessage[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  new: { label: 'New', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In Review', icon: Package, color: 'bg-purple-100 text-purple-700' },
  quoted: { label: 'Quoted', icon: MessageCircle, color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', icon: XCircle, color: 'bg-red-100 text-red-700' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'bg-gray-100 text-gray-700' },
};

export default function BespokePanel() {
  const [requests, setRequests] = useState<BespokeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BespokeRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ items: BespokeRequest[] }>('/api/bespoke/mine', true);
      setRequests(res.items);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load bespoke requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const handleSendReply = async () => {
    if (!selectedRequest || !replyText.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    try {
      setSending(true);
      
      let imageUrl: string | undefined = undefined;
      
      // Upload image to Cloudinary if provided
      if (replyImage) {
        try {
          imageUrl = await uploadToCloudinary(replyImage, 'bespoke');
        } catch (uploadErr: any) {
          showToast('Failed to upload image. Continuing without image.', 'info');
        }
      }
      
      await apiPost(
        `/api/bespoke/${selectedRequest.id}/customer-reply`,
        { message: replyText, imageUrl },
        true
      );
      showToast('Reply sent successfully', 'success');
      setReplyText('');
      setReplyImage(null);
      await fetchRequests();
      // Update selected request
      const updated = await apiGet<{ item: BespokeRequest }>(`/api/bespoke/${selectedRequest.id}`, true);
      setSelectedRequest(updated.item);
    } catch (err: any) {
      showToast(err?.message || 'Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const canReply = (request: BespokeRequest): boolean => {
    if (!request.conversation || request.conversation.length === 0) return false;
    const lastMessage = request.conversation[request.conversation.length - 1];
    return lastMessage.from === 'admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400">Loading your bespoke requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-24">
        <MessageCircle size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
        <h3 className="font-serif text-2xl mb-3">No Bespoke Requests Yet</h3>
        <p className="text-gray-500 mb-6">Start your bespoke journey by submitting a custom request.</p>
        <button
          onClick={() => useUIStore.getState().openModal('chat')}
          className="px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80"
        >
          CREATE REQUEST
        </button>
      </div>
    );
  }

  if (selectedRequest) {
    const StatusIcon = STATUS_CONFIG[selectedRequest.status]?.icon || Clock;
    const statusColor = STATUS_CONFIG[selectedRequest.status]?.color || 'bg-gray-100 text-gray-700';
    const statusLabel = STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <button
            onClick={() => setSelectedRequest(null)}
            className="text-xs tracking-[0.1em] text-gray-500 hover:text-black"
          >
            ← BACK TO ALL REQUESTS
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${statusColor}`}>
            <StatusIcon size={14} />
            {statusLabel.toUpperCase()}
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Reference</p>
              <p className="font-mono text-sm">{selectedRequest.reference}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Occasion</p>
              <p className="text-sm">{selectedRequest.occasion}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Budget</p>
              <p className="text-sm">{selectedRequest.budget ? formatNaira(Number(selectedRequest.budget)) : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Timeline</p>
              <p className="text-sm">{selectedRequest.timeline || 'Not specified'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-2">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
          </div>
          {selectedRequest.images.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-2">Reference Images</p>
              <div className="flex gap-2 flex-wrap">
                {selectedRequest.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-24 h-24 object-cover border" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div>
          <h3 className="text-xs tracking-[0.15em] font-semibold uppercase mb-4">Conversation</h3>
          {selectedRequest.conversation.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Waiting for admin to review your request. You'll be notified when they reply.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedRequest.conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 border ${
                    msg.from === 'admin' ? 'bg-gray-50 border-l-4 border-l-black' : 'bg-white border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-500">
                      {msg.from === 'admin' ? 'HAVANAT TEAM' : 'YOU'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img src={msg.imageUrl} alt="Attached" className="max-w-xs max-h-48 object-contain border" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Box */}
        {canReply(selectedRequest) ? (
          <div className="border p-4 bg-white">
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2 font-semibold">
              Your Reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-24 p-3 border text-sm resize-none focus:outline-none focus:border-black mb-3"
              disabled={sending}
            />
            <div className="mb-3">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed cursor-pointer hover:border-black transition-colors text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReplyImage(e.target.files?.[0] || null)}
                  disabled={sending}
                />
                <span className="text-gray-500">
                  {replyImage ? `📎 ${replyImage.name}` : '📎 Attach image (optional)'}
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {sending ? 'SENDING...' : 'SEND REPLY'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              You can reply once after each admin message. Wait for their response before sending another.
            </p>
          </div>
        ) : (
          <div className="border border-dashed p-6 text-center text-sm text-gray-500">
            {selectedRequest.conversation.length === 0
              ? "Waiting for admin to reply. You'll be able to respond once they do."
              : "Waiting for admin to reply before you can send another message."}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Your Bespoke Requests</h2>
        <button
          onClick={() => useUIStore.getState().openModal('chat')}
          className="px-6 py-2.5 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80"
        >
          NEW REQUEST
        </button>
      </div>

      <div className="space-y-3">
        {requests.map((req) => {
          const StatusIcon = STATUS_CONFIG[req.status]?.icon || Clock;
          const statusColor = STATUS_CONFIG[req.status]?.color || 'bg-gray-100 text-gray-700';
          const statusLabel = STATUS_CONFIG[req.status]?.label || req.status;
          const hasUnreadReply = req.conversation.length > 0 && req.conversation[req.conversation.length - 1].from === 'admin';

          return (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="w-full text-left p-5 border hover:border-black transition-colors relative"
            >
              {hasUnreadReply && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 rounded-full" />
              )}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-500 mb-1">{req.reference}</p>
                  <h3 className="font-medium">{req.occasion}</h3>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium ${statusColor}`}>
                  <StatusIcon size={12} />
                  {statusLabel.toUpperCase()}
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{req.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>
                  {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {req.conversation.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    {req.conversation.length} {req.conversation.length === 1 ? 'message' : 'messages'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
