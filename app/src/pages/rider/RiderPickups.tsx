import { useMemo } from 'react';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/admin/StatusBadge';
import { MapPin, Phone, AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

export default function RiderPickups() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const deliveries = useRiderStore((s) => s.deliveries);
  const updateStatus = useRiderStore((s) => s.updateDeliveryStatus);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  const riderId = dashboardUser?.id === 'usr_rider' ? 'rider_01' : (dashboardUser?.id ?? 'rider_01');
  const myPickups = useMemo(
    () => deliveries.filter((d) => d.riderId === riderId && d.type === 'pickup'),
    [deliveries, riderId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-light">Return Pickups</h2>
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
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Pickup · {formatTime(d.scheduledFor)}</p>
                  <p className="font-serif text-lg mt-1">{d.id}</p>
                </div>
                <StatusBadge status={d.status} type="delivery" />
              </div>
              <div className="space-y-1.5 text-sm">
                <p><strong className="font-medium">Customer:</strong> {d.customerName}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {d.address}, {d.city}, {d.state}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {d.customerPhone}</p>
                <p><strong className="font-medium">Items to collect:</strong> {d.itemSummary} ({d.itemCount})</p>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {d.status === 'assigned' && (
                  <button
                    onClick={() => { updateStatus(d.id, 'picked_up'); showToast('Item collected', 'success'); }}
                    className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-black text-white hover:bg-gray-900"
                  >Mark Picked Up</button>
                )}
                {d.status === 'picked_up' && (
                  <button
                    onClick={() => { updateStatus(d.id, 'delivered'); showToast('Delivered to warehouse', 'success'); }}
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
