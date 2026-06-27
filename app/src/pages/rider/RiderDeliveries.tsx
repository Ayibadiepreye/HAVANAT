import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderDeliveries } from '@/hooks/useRiderMe';
import StatusBadge from '@/components/admin/StatusBadge';
import { ArrowRight } from 'lucide-react';
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
  const deliveriesState = useRiderDeliveries();
  const deliveries = (deliveriesState.data?.items ?? []) as any[];
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | DeliveryStatus>('all');

  // No more hardcoded rider_01 — backend scopes /api/riders/me/deliveries to the JWT.
  const myDeliveries = useMemo(
    () => [...deliveries].sort((a: any, b: any) => (a.assignedAt ?? '').localeCompare(b.assignedAt ?? '')),
    [deliveries]
  );
  // Re-fetch on mount (the hook already does this, but be explicit for clarity).
  useEffect(() => { void deliveriesState.refresh(); }, []);
  const filtered = useMemo(
    () => tab === 'all' ? myDeliveries : myDeliveries.filter((d) => d.status === tab),
    [myDeliveries, tab]
  );
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.assignedAt ?? '').localeCompare(b.assignedAt ?? '')),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Deliveries</h2>
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
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">{d.status === 'pending' ? 'Pickup' : 'Delivery'} · {formatTime(d.assignedAt)}</p>
                  <p className="font-serif text-lg mt-1">Order #{d.orderId}</p>
                </div>
                <StatusBadge status={d.status} type="delivery" />
              </div>
              <div className="space-y-1.5 text-sm">
                <p><strong className="font-medium">Order #:</strong> {d.orderId}</p>
                <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                  Delivery #{d.id} · assigned {formatTime(d.assignedAt)}
                </p>
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
