import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useRiderMe } from '@/hooks/useRiderMe';
import StatusBadge from '@/components/admin/StatusBadge';
import { apiPatch, apiPost } from '@/lib/api';
import { Check, Eye, EyeOff } from 'lucide-react';

export default function RiderProfile() {
  const showToast = useUIStore((s) => s.showToast);
  const me = useRiderMe();
  const rider = me.data;
  const profile = rider?.profile;

  // Fetch fresh data on mount and auto-refresh every 30 seconds
  useEffect(() => {
    void me.refresh();
    const interval = setInterval(() => {
      void me.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [me]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plateNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Re-sync the form whenever fresh profile data arrives.
  useEffect(() => {
    if (rider) {
      setForm({
        name: rider.name,
        email: rider.email,
        phone: rider.phone ?? '',
        address: profile?.address ?? '',
        plateNumber: profile?.plateNumber ?? '',
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
      }, true);
      showToast('Profile updated', 'success');
      await me.refresh();
    } catch (err: any) {
      showToast(err?.message || 'Could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await apiPost('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, true);
      showToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err?.message || 'Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <KycRow label="ID Verified" ok={profile.idVerified} />
            <KycRow label="Vehicle" ok={!!profile.vehicleType} />
            <KycRow label="Address" ok={!!profile.address} />
          </div>
        </div>
      )}

      {/* Password Change Section */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-medium mb-1">Change Password</h3>
        <p className="text-xs text-gray-500 mb-4">Update your account password</p>

        <div className="space-y-4 max-w-md">
          <PasswordField
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(v) => setPasswordForm({ ...passwordForm, currentPassword: v })}
            show={showPasswords.current}
            onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
          />
          <PasswordField
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(v) => setPasswordForm({ ...passwordForm, newPassword: v })}
            show={showPasswords.new}
            onToggle={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
          />
          <PasswordField
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(v) => setPasswordForm({ ...passwordForm, confirmPassword: v })}
            show={showPasswords.confirm}
            onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
          />

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium disabled:opacity-50"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
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

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 focus:border-black focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
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