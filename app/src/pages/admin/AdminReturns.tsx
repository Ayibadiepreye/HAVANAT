import { useEffect, useState, useMemo } from 'react';
import { useReturnStore } from '@/stores/useReturnStore';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { X, Check, XCircle, Bike, Eye, DollarSign } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import type { ReturnRequest, ReturnStatus } from '@/types/dashboard';

const TABS: { label: string; status: ReturnStatus | 'all' }[] = [
  { label: 'All', status: 'all' },
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Rider Assigned', status: 'rider_scheduled' },
  { label: 'Completed', status: 'completed' },
  { label: 'Rejected', status: 'rejected' },
];

export default function AdminReturns() {
  const returns = useReturnStore((s) => s.returns);
  const approve = useReturnStore((s) => s.approve);
  const reject = useReturnStore((s) => s.reject);
  const assignRider = useReturnStore((s) => s.assignRider);
  const fetchReturns = useReturnStore((s) => s.fetchReturns);
  useEffect(() => { void fetchReturns(); }, [fetchReturns]);
  const processRefund = useReturnStore((s) => s.processRefund);
  const riders = useRiderStore((s) => s.riders);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState<ReturnStatus | 'all'>('all');
  const [details, setDetails] = useState<ReturnRequest | null>(null);
  const [rejecting, setRejecting] = useState<ReturnRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [assignReturn, setAssignReturn] = useState<ReturnRequest | null>(null);
  const [riderId, setRiderId] = useState('');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return returns;
    return returns.filter((r) => r.status === activeTab);
  }, [returns, activeTab]);

  const columns: Column<ReturnRequest>[] = [
    { key: 'id', label: 'Return ID', render: (r) => <span className="font-medium">{r.id}</span> },
    { key: 'order', label: 'Order #', render: (r) => r.orderId },
    { key: 'customer', label: 'Customer', render: (r) => <div><p className="text-sm">{r.customerName}</p><p className="text-xs text-gray-500">{r.customerPhone}</p></div> },
    { key: 'items', label: 'Items', render: (r) => `${r.items.length}` },
    { key: 'reason', label: 'Reason', render: (r) => <span className="text-xs">{r.reason}</span> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-xs text-gray-600">{formatDateTime(r.date)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} type="return" /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '180px',
      render: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDetails(r)} className="p-1.5 hover:bg-gray-100 transition-colors" aria-label="View"><Eye className="h-4 w-4" /></button>
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => dashboardUser && approve(r.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' })}
                className="p-1.5 hover:bg-green-50 text-green-700 transition-colors" aria-label="Approve"><Check className="h-4 w-4" /></button>
              <button onClick={() => setRejecting(r)} className="p-1.5 hover:bg-red-50 text-red-600 transition-colors" aria-label="Reject"><XCircle className="h-4 w-4" /></button>
            </>
          )}
          {(r.status === 'approved' || r.status === 'pending') && (
            <button onClick={() => { setAssignReturn(r); setRiderId(''); }} className="p-1.5 hover:bg-blue-50 text-blue-700 transition-colors" aria-label="Assign Rider"><Bike className="h-4 w-4" /></button>
          )}
          {r.status === 'rider_scheduled' && (
            <button
              onClick={() => dashboardUser && processRefund(r.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' })}
              className="p-1.5 hover:bg-green-50 text-green-700 transition-colors" aria-label="Refund"><DollarSign className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Returns</h2>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} return requests</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
              activeTab === tab.status ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminTable<ReturnRequest>
        columns={columns}
        rows={filtered}
        keyFn={(r) => r.id}
        emptyMessage="No returns in this status"
      />

      {details && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDetails(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-serif text-2xl font-light">{details.id}</h3>
              <button onClick={() => setDetails(null)} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500 text-xs uppercase tracking-wider">Order</span> · {details.orderId}</p>
                <p><span className="text-gray-500 text-xs uppercase tracking-wider">Customer</span> · {details.customerName}</p>
                <p><span className="text-gray-500 text-xs uppercase tracking-wider">Reason</span> · {details.reason}</p>
                <p className="text-gray-700 leading-relaxed pt-2">{details.description}</p>
              </div>
              {details.adminNote && <div className="bg-gray-50 p-3 text-sm"><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Admin Note</p>{details.adminNote}</div>}
              <div className="grid grid-cols-2 gap-3">
                {details.items.map((it) => (
                  <div key={it.productId} className="flex gap-3 border border-gray-200 p-3">
                    <img src={it.image} alt="" className="h-16 w-16 object-cover bg-gray-100" />
                    <div>
                      <p className="text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-gray-500">Size {it.size} · Qty {it.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-light mb-1">Reject return</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason (sent to customer).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none mb-4"
              placeholder="e.g. Outside return window..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
              <button
                onClick={() => {
                  if (!dashboardUser || !rejecting) return;
                  reject(rejecting.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' }, rejectReason || 'No reason provided');
                  showToast('Return rejected', 'success');
                  setRejecting(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-red-600 text-white hover:bg-red-700"
              >Reject</button>
            </div>
          </div>
        </div>
      )}

      {assignReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAssignReturn(null)}>
          <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-light mb-1">Assign Rider</h3>
            <p className="text-sm text-gray-500 mb-4">Select an active rider for this pickup.</p>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white mb-4"
            >
              <option value="">Select rider...</option>
              {riders.filter((r) => r.status === 'active').map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.vehicleType} · ★{r.rating}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignReturn(null)} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
              <button
                onClick={() => {
                  if (!dashboardUser || !assignReturn) return;
                  const r = riders.find((x) => x.id === riderId);
                  if (!r) return;
                  assignRider(assignReturn.id, r.id, r.name, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
                  showToast(`Rider ${r.name} assigned`, 'success');
                  setAssignReturn(null);
                }}
                disabled={!riderId}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50"
              >Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
