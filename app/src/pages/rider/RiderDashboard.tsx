import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderStore } from '@/stores/useRiderStore';
import { useUIStore } from '@/stores/useUIStore';
import { useRiderMe, useRiderDeliveries } from '@/hooks/useRiderMe';
import StatsCard from '@/components/admin/StatsCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { Power, Clock, ArrowRight, Package } from 'lucide-react';
import { formatTime, formatNaira } from '@/utils/formatters';
import { cn } from '@/lib/utils';

function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function RiderDashboard() {
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const setStatus = useRiderStore((s) => s.setStatus);

  // Live DB data — backend is the source of truth.
  const me = useRiderMe();
  const deliveriesState = useRiderDeliveries();
  const deliveries = (deliveriesState.data?.items ?? []) as any[];

  // Mirror deliveries into the store so legacy code (RiderDeliveries etc.) still works.
  useEffect(() => {
    if (deliveriesState.data) {
      useRiderStore.setState({
        deliveries: deliveries.map((d: any) => ({
          id: String(d.id),
          orderId: String(d.orderId),
          riderId: String(d.riderId),
          customerName: '',
          customerPhone: '',
          address: '',
          city: '',
          state: '',
          type: 'delivery' as const,
          status: d.status,
          eta: d.eta ?? undefined,
          assignedAt: d.assignedAt,
          pickedUpAt: d.pickedUpAt ?? undefined,
          deliveredAt: d.deliveredAt ?? undefined,
          deliveryFee: Number(d.deliveryFee) || 0,
          itemSummary: '',
          itemCount: 0,
          scheduledFor: d.assignedAt,
        })),
      });
    }
  }, [deliveriesState.data]);

  const rider = me.data;
  const profile = rider?.profile;

  const [online, setOnline] = useState(true);

  const myDeliveries = useMemo(
    () => deliveries.filter((d: any) => profile && String(d.riderId) === String(rider?.id)),
    [deliveries, profile, rider?.id]
  );
  const todayKey = todayISO();
  const today = useMemo(
    () => myDeliveries.filter((d: any) => d.assignedAt?.slice(0, 10) === todayKey),
    [myDeliveries, todayKey]
  );
  const pending = useMemo(
    () => myDeliveries.filter((d: any) => d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit').length,
    [myDeliveries]
  );
  const todayEarnings = useMemo(
    () => today.filter((d: any) => d.status === 'delivered').reduce((sum: number, d: any) => sum + (Number(d.deliveryFee) || 0), 0),
    [today]
  );
  const sortedToday = useMemo(
    () => [...today].sort((a: any, b: any) => a.assignedAt.localeCompare(b.assignedAt)),
    [today]
  );

  const isLoading = me.loading || deliveriesState.loading;

  if (isLoading && !rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Loading your dashboard…</p>
      </div>
    );
  }
  if (me.error && !rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-red-600">Failed to load dashboard: {me.error}</p>
        <button
          onClick={() => { void me.refresh(); void deliveriesState.refresh(); }}
          className="mt-3 text-xs uppercase tracking-[0.15em] underline"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!rider || !profile) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No rider profile found. Contact admin to set up your account.</p>
      </div>
    );
  }

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    try {
      await setStatus(rider.id, next ? 'active' : 'suspended', {
        id: rider.id, name: rider.name, role: 'admin' as const,
      });
      showToast(next ? 'You are now online' : 'You are now offline', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Could not update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Welcome back</p>
          <h2 className="font-serif text-3xl font-light mt-1">{rider.name}</h2>
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {profile.vehicleType} · {profile.plateNumber} · {profile.address || 'No address on file'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={profile.status} type="generic" />
          <button
            onClick={toggleOnline}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] font-medium border',
              online ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
            )}
          >
            <Power size={14} />
            {online ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Today's Deliveries" value={String(today.length)} sublabel={`${pending} pending`} />
        <StatsCard label="Today's Earnings" value={formatNaira(todayEarnings)} sublabel={profile.status === 'active' ? 'Active' : profile.status} />
        <StatsCard label="Lifetime Earnings" value={formatNaira(0)} sublabel="From payouts" />
      </div>

      <div className="bg-white border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="font-medium text-lg">Today's Schedule</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your assigned deliveries for {todayKey}</p>
          </div>
          <button
            onClick={() => navigate('/rider/deliveries')}
            className="text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-black flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {sortedToday.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No deliveries scheduled today.</p>
            <p className="text-xs text-gray-400 mt-1">Once an admin assigns a delivery to you, it'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedToday.map((d: any) => (
              <button
                key={d.id}
                onClick={() => navigate(`/rider/deliveries/${d.id}`)}
                className="w-full text-left p-4 hover:bg-gray-50 flex items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">Order #{d.orderId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <Clock size={11} className="inline mr-1" />
                    {formatTime(d.assignedAt)}
                  </p>
                </div>
                <StatusBadge status={d.status} type="delivery" />
                <ArrowRight size={14} className="text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}