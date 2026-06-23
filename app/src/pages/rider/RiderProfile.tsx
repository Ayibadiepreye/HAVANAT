import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRiderStore } from '@/stores/useRiderStore';
import { useUIStore } from '@/stores/useUIStore';
import { Star, Check, Upload } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';

export default function RiderProfile() {
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const riders = useRiderStore((s) => s.riders);

  const riderId = dashboardUser?.id === 'usr_rider' ? 'rider_01' : (dashboardUser?.id ?? 'rider_01');
  const rider = useMemo(() => riders.find((r) => r.id === riderId) ?? riders[0], [riders, riderId]);

  const [form, setForm] = useState({
    name: rider?.name ?? '',
    email: rider?.email ?? '',
    phone: rider?.phone ?? '',
    address: rider?.address ?? '',
    plateNumber: rider?.plateNumber ?? '',
  });

  // Re-sync the form when the rider loads (e.g. on first render after persist rehydration).
  useEffect(() => {
    if (rider) {
      setForm({
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        address: rider.address,
        plateNumber: rider.plateNumber,
      });
    }
  }, [rider?.id]);

  if (!rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Your personal and vehicle information.</p>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="h-16 w-16 bg-black text-white flex items-center justify-center text-2xl font-semibold rounded-full">
            {rider.name[0]}
          </div>
          <div>
            <p className="font-serif text-xl">{rider.name}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> {rider.rating} · {rider.totalDeliveries} deliveries
            </p>
          </div>
        </div>

        <h3 className="font-serif text-lg font-light mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" value={form.email} type="email" onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </div>

        <h3 className="font-serif text-lg font-light mb-4 mt-8">Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Vehicle Type</label>
            <input value={rider.vehicleType} disabled className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50" />
          </div>
          <Field label="Plate Number" value={form.plateNumber} onChange={(v) => setForm({ ...form, plateNumber: v })} />
        </div>

        <h3 className="font-serif text-lg font-light mb-4 mt-8">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Bank Name" value={rider.bank.bankName} onChange={() => {}} disabled />
          <Field label="Account Number" value={rider.bank.accountNumber} onChange={() => {}} disabled />
          <Field label="Account Name" value={rider.bank.accountName} onChange={() => {}} disabled />
        </div>

        <h3 className="font-serif text-lg font-light mb-4 mt-8">ID Verification</h3>
        <div className="flex items-center gap-3 border border-gray-200 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium">{rider.idVerified ? 'Verified' : 'Pending Verification'}</p>
            <p className="text-xs text-gray-500">Driver's license, NIN, vehicle registration</p>
          </div>
          {rider.idVerified ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-wider bg-green-100 text-green-800">
              <Check className="h-3 w-3" /> Verified
            </span>
          ) : (
            <StatusBadge status="pending" type="rider" />
          )}
          <button className="px-4 py-2 text-[10px] uppercase tracking-wider border border-gray-300 hover:border-black flex items-center gap-1">
            <Upload className="h-3 w-3" /> Upload Documents
          </button>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => showToast('Profile updated', 'success')}
            className="px-6 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900"
          >Update Info</button>
          <button
            onClick={() => showToast('Vehicle info updated', 'success')}
            className="px-6 py-3 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black"
          >Update Vehicle</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none disabled:bg-gray-50"
      />
    </div>
  );
}
