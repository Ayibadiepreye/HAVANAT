import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { apiPost } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function ModeratorProfile() {
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

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

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Please log in to view your profile</p>
      </div>
    );
  }

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
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* Account Information */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-medium mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-1.5">
              Full Name
            </label>
            <input
              value={user.name}
              readOnly
              className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-1.5">
              Email
            </label>
            <input
              value={user.email}
              readOnly
              className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-1.5">
              Role
            </label>
            <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-700 text-xs uppercase tracking-wider font-semibold">
              {user.role}
            </span>
          </div>
        </div>
      </div>

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
