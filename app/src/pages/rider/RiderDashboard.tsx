import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import StatsCard from '@/components/admin/StatsCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { MapPin, Power, Clock, ArrowRight, Package, RotateCcw } from 'lucide-react';
import { formatTime, formatNaira } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function RiderDashboard() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  // Subscribe to RAW stable references only
  const riders = useRiderStore((s) => s.riders);
  const deliveries = useRiderStore((s) => s.deliveries);

  const [online, setOnline] = useState(true);

  // Map demo session to the seeded rider
  const riderId = dashboardUser?.id === 'usr_rider' ? 'rider_01' : (dashboardUser?.id ?? 'rider_01');
  const rider = useMemo(() => riders.find((r) => r.id === riderId) ?? riders[0], [riders, riderId]);
  const myDeliveries = useMemo(
    () => deliveries.filter((d) => d.riderId === riderId),
    [deliveries, riderId]
  );
  const today = useMemo(
    () => myDeliveries.filter((d) => d.scheduledFor.startsWith('2026-06-23')),
    [myDeliveries]
  );
  const pending = useMemo(
    () => myDeliveries.filter((d) => d.status === 'assigned' || d.status === 'picked_up').length,
    [myDeliveries]
  );
  const todayEarnings = useMemo(
    () => today.filter((d) => d.status === 'delivered').reduce((sum, d) => sum + d.deliveryFee, 0),
    [today]
  );
  const sortedToday = useMemo(
    () => [...today].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [today]
  );

  if (!rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Welcome back</p>
          <h2 className="font-serif text-3xl font-light mt-1">{rider.name}</h2>
          <p className="text-xs text-gray-500 mt-1">{rider.vehicleType} · {rider.plateNumber} · ★{rider.rating}</p>
        </div>
        <button
          onClick={() => { setOnline(!online); showToast(online ? 'You are now offline' : 'You are now online', 'info'); }}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-medium border transition-colors',
            online ? 'bg-green-50 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'
          )}
        >
          <Power className="h-3.5 w-3.5" />
          {online ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Today's Deliveries" value={String(today.length)} change={`${today.filter((d) => d.status === 'delivered').length} completed`} />
        <StatsCard label="Pending Pickups" value={String(pending)} change="Across today" />
        <StatsCard label="Today's Earnings" value={formatNaira(todayEarnings)} change="From completed runs" />
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-serif text-xl font-light mb-4">Today's Schedule</h3>
        {sortedToday.length === 0 ? (
          <p className="text-sm text-gray-500">No tasks scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {sortedToday.map((d) => (
              <div key={d.id} className="border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'h-10 w-10 flex items-center justify-center flex-shrink-0',
                    d.type === 'pickup' ? 'bg-orange-100' : 'bg-black text-white'
                  )}>
                    {d.type === 'pickup' ? <RotateCcw className="h-4 w-4 text-orange-700" /> : <Package className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.itemSummary}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3" /> {formatTime(d.scheduledFor)} · {d.customerName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {d.address}, {d.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={d.status} type="delivery" />
                  <button
                    onClick={() => navigate(`/rider/deliveries/${d.id}`)}
                    className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 flex items-center gap-1"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
