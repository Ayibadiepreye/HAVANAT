import { useMemo, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useRiderDeliveries } from '@/hooks/useRiderMe';
import { apiPatch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/admin/StatusBadge';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

export default function RiderPickups() {
  const deliveriesState = useRiderDeliveries();
  const deliveries = (deliveriesState.data?.items ?? []) as any[];
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  // Pickups are deliveries whose status is `pending` (not yet picked up).
  // Backend /api/riders/me/deliveries returns the rider's full queue; we filter
  // for the items still waiting for collection.
  const myPickups = useMemo(
    () => deliveries.filter((d) => d.status === 'pending' || d.status === 'picked_up'),
    [deliveries]
  );
  useEffect(() => { void deliveriesState.refresh(); }, []);

  // Mark picked up / delivered — PATCH the actual delivery row, then refetch.
  async function markStatus(deliveryId: number, status: 'picked_up' | 'delivered') {
    try {
      await apiPatch(`/api/riders/me/deliveries/${deliveryId}/status`, { status }, true);
      await deliveriesState.refresh();
      showToast(status === 'picked_up' ? 'Item collected' : 'Delivered to warehouse', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not update status', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Return Pickups</h2>
        <p className="text-sm text-gray-500 mt-1">{myPickups.length} scheduled pickups</p>
      </div>

      {myPickups.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <Package className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No return pickups assigned.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myPickups.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Pickup · {formatTime(d.assignedAt)}</p>
                  <p className="font-serif text-lg mt-1">Order #{d.orderId}</p>
                </div>
                <StatusBadge status={d.status} type="delivery" />
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-1.5 text-gray-500 text-xs">Delivery #{d.id} · assigned {formatTime(d.assignedAt)}</p>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {d.status === 'assigned' && (
                  <button
                    onClick={() => { markStatus(Number(d.id), 'picked_up'); showToast('Item collected', 'success'); }}
                    className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-black text-white hover:bg-gray-900"
                  >Mark Picked Up</button>
                )}
                {d.status === 'picked_up' && (
                  <button
                    onClick={() => { markStatus(Number(d.id), 'delivered'); showToast('Delivered to warehouse', 'success'); }}
                    className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-black text-white hover:bg-gray-900"
                  >Delivered to Warehouse</button>
                )}
                <button
                  onClick={() => showToast('Issue reported to admin', 'info')}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] border border-yellow-400 text-yellow-800 hover:bg-yellow-50 flex items-center gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
                </button>
                <button
                  onClick={() => navigate(`/rider/deliveries/${d.id}`)}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black flex items-center gap-1"
                >
                  View <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
