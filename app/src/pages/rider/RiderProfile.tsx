import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useRiderMe } from '@/hooks/useRiderMe';
import StatusBadge from '@/components/admin/StatusBadge';
import { apiPatch } from '@/lib/api';
import { Check } from 'lucide-react';

export default function RiderProfile() {
  const showToast = useUIStore((s) => s.showToast);
  const me = useRiderMe();
  const rider = me.data;
  const profile = rider?.profile;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plateNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [saving, setSaving] = useState(false);

  // Re-sync the form whenever fresh profile data arrives.
  useEffect(() => {
    if (rider) {
      setForm({
        name: rider.name,
        email: rider.email,
        phone: rider.phone ?? '',
        address: profile?.address ?? '',
        plateNumber: profile?.plateNumber ?? '',
        bankName: profile?.bankName ?? '',
        accountNumber: profile?.accountNumber ?? '',
        accountName: profile?.accountName ?? '',
      });
    }
  }, [rider?.id, profile?.userId]);

  if (me.loading && !rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Loading your profile…</p>
      </div>
    );
  }
  if (me.error && !rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-red-600">Failed to load profile: {me.error}</p>
        <button onClick={() => void me.refresh()} className="mt-3 text-xs uppercase tracking-[0.15em] underline">
          Retry
        </button>
      </div>
    );
  }
  if (!rider) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No rider profile found.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update the user-level fields (name/phone) via /api/auth/me.
      await apiPatch('/api/auth/me', {
        name: form.name,
        phone: form.phone,
      }, true);
      // Update the rider_profile fields via the rider route.
      await apiPatch(`/api/riders/${rider.id}/profile`, {
        address: form.address,
        plateNumber: form.plateNumber,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      }, true);
      showToast('Profile updated', 'success');
      await me.refresh();
    } catch (err: any) {
      showToast(err?.message || 'Could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Your personal and vehicle information.</p>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="h-16 w-16 bg-black text-white flex items-center justify-center text-2xl font-semibold rounded-full">
            {rider.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{rider.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{rider.email}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">
              Joined {new Date(rider.createdAt).toLocaleDateString()}
            </p>
          </div>
          {profile && <StatusBadge status={profile.status} type="generic" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" value={form.email} readOnly />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Vehicle Plate" value={form.plateNumber} onChange={(v) => setForm({ ...form, plateNumber: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} fullWidth />
          <Field label="Bank Name" value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} />
          <Field label="Account Number" value={form.accountNumber} onChange={(v) => setForm({ ...form, accountNumber: v })} />
          <Field label="Account Name" value={form.accountName} onChange={(v) => setForm({ ...form, accountName: v })} fullWidth />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium disabled:opacity-50"
          >
            <Check size={14} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {profile && (
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="font-medium mb-3">KYC Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <KycRow label="ID Verified" ok={profile.idVerified} />
            <KycRow label="Vehicle" ok={!!profile.vehicleType} />
            <KycRow label="Address" ok={!!profile.address} />
            <KycRow label="Bank Details" ok={!!profile.accountNumber} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, readOnly, fullWidth }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none readOnly:bg-gray-50 readOnly:text-gray-500"
      />
    </div>
  );
}

function KycRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-600' : 'bg-gray-300'}`} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}