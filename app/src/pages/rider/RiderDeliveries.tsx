import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import StatusBadge from '@/components/admin/StatusBadge';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/formatters';
import type { DeliveryStatus } from '@/types/dashboard';

const TABS: { label: string; status: 'all' | DeliveryStatus }[] = [
  { label: 'All', status: 'all' },
  { label: 'Assigned', status: 'assigned' },
  { label: 'Picked Up', status: 'picked_up' },
  { label: 'In Transit', status: 'in_transit' },
  { label: 'Delivered', status: 'delivered' },
];

export default function RiderDeliveries() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const deliveries = useRiderStore((s) => s.deliveries);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | DeliveryStatus>('all');

  const riderId = dashboardUser?.id === 'usr_rider' ? 'rider_01' : (dashboardUser?.id ?? 'rider_01');
  const myDeliveries = useMemo(
    () => deliveries.filter((d) => d.riderId === riderId),
    [deliveries, riderId]
  );
  const filtered = useMemo(
    () => tab === 'all' ? myDeliveries : myDeliveries.filter((d) => d.status === tab),
    [myDeliveries, tab]
  );
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-light">Deliveries</h2>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} tasks</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setTab(t.status)}
            className={cn(
              'px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors',
              tab === t.status ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
            )}
          >{t.label}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">No tasks in this status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">{d.type === 'pickup' ? 'Pickup' : 'Delivery'} · {formatTime(d.scheduledFor)}</p>
                  <p className="font-serif text-lg mt-1">{d.id}</p>
                </div>
                <StatusBadge status={d.status} type="delivery" />
              </div>
              <div className="space-y-1.5 text-sm">
                <p><strong className="font-medium">Customer:</strong> {d.customerName}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {d.address}, {d.city}, {d.state}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {d.customerPhone}</p>
                <p><strong className="font-medium">Items:</strong> {d.itemSummary} ({d.itemCount})</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.address}, ${d.city}, ${d.state}`)}`, '_blank')}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5" /> Navigate
                </button>
                <button
                  onClick={() => navigate(`/rider/deliveries/${d.id}`)}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-black text-white hover:bg-gray-900 flex items-center gap-2"
                >
                  Open Task <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
