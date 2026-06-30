import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Eye, MessageSquare } from 'lucide-react';
import { formatDate, formatNaira } from '@/utils/formatters';

interface BespokeRequest {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  occasion: string;
  budget: string | null;
  timeline: string;
  description: string;
  measurements: Record<string, string>;
  images: string[];
  status: 'new' | 'in_review' | 'quoted' | 'accepted' | 'declined' | 'complete';
  assignedTo: number | null;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBespoke() {
  const [requests, setRequests] = useState<BespokeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BespokeRequest | null>(null);
  const showToast = useUIStore((s) => s.showToast);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ items: BespokeRequest[] }>('/api/bespoke', true);
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

  const columns: Column<BespokeRequest>[] = [
    { key: 'reference', label: 'Reference', render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    {
      key: 'customer',
      label: 'Customer',
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.customerName}</p>
          <p className="text-xs text-gray-500">{r.customerEmail}</p>
        </div>
      ),
    },
    { key: 'occasion', label: 'Occasion', render: (r) => <span className="text-sm">{r.occasion}</span> },
    {
      key: 'budget',
      label: 'Budget',
      render: (r) => <span className="text-sm">{r.budget ? formatNaira(Number(r.budget)) : '—'}</span>,
      align: 'right',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} type="generic" />,
    },
    { key: 'created', label: 'Created', render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '100px',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedRequest(r)}
          className="p-1.5 hover:bg-gray-100 transition-colors"
          aria-label="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading bespoke requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Bespoke Requests</h2>
        <p className="text-sm text-gray-500 mt-1">{requests.length} total requests</p>
      </div>

      <AdminTable<BespokeRequest>
        columns={columns}
        rows={requests}
        keyFn={(r) => String(r.id)}
        emptyMessage="No bespoke requests yet"
      />

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            void fetchRequests();
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

function RequestDetailModal({
  request,
  onClose,
  onUpdate,
}: {
  request: BespokeRequest;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const [status, setStatus] = useState(request.status);
  const [adminNotes, setAdminNotes] = useState(request.adminNotes);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleUpdateStatus = async () => {
    try {
      await apiPatch(`/api/bespoke/${request.id}`, { status, adminNotes }, true);
      showToast('Request updated successfully', 'success');
      onUpdate();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update request', 'error');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    try {
      setSending(true);
      await apiPost(`/api/bespoke/${request.id}/reply`, { message: replyMessage }, true);
      showToast('Reply sent successfully', 'success');
      setReplyMessage('');
      onUpdate();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl font-light">Bespoke Request</h3>
              <p className="text-sm text-gray-500 mt-1">Reference: {request.reference}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-black">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Customer Name</label>
              <p className="text-sm">{request.customerName}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Email</label>
              <p className="text-sm">{request.customerEmail}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Phone</label>
              <p className="text-sm">{request.customerPhone || '—'}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Created</label>
              <p className="text-sm">{formatDate(request.createdAt)}</p>
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Occasion</label>
              <p className="text-sm">{request.occasion}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Budget</label>
              <p className="text-sm">{request.budget ? formatNaira(Number(request.budget)) : 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">Timeline</label>
              <p className="text-sm">{request.timeline || 'Not specified'}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">Description</label>
            <div className="bg-gray-50 border border-gray-200 p-4 text-sm whitespace-pre-wrap">{request.description}</div>
          </div>

          {/* Measurements */}
          {Object.keys(request.measurements).length > 0 && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">Measurements</label>
              <div className="bg-gray-50 border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(request.measurements).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">{key}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {request.images.length > 0 && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">
                Reference Images ({request.images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {request.images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-32 object-cover border border-gray-200 hover:opacity-75 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status & Admin Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
              >
                <option value="new">New</option>
                <option value="in_review">In Review</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div className="md:col-span-1" />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Admin Notes (Internal)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none"
              placeholder="Internal notes (not visible to customer)..."
            />
          </div>

          <button
            type="button"
            onClick={handleUpdateStatus}
            className="bg-black text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900"
          >
            Update Request
          </button>

          {/* Reply Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" />
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Send Reply to Customer</label>
            </div>
            <p className="text-xs text-gray-500 mb-3">This message will be sent via email and in-app notification</p>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none"
              placeholder="Type your reply to the customer..."
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={handleSendReply}
                disabled={sending || !replyMessage.trim()}
                className="bg-black text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
