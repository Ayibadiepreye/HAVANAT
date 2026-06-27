import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { User as UserIcon, Shield, Eye, EyeOff, Package, Crown, MapPin, Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTwoFactorStore, twoFactorActions } from '@/stores/useTwoFactorStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { Smartphone } from 'lucide-react';
import MobileBottomNav, { type MobileBottomNavItem } from '@/components/MobileBottomNav';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { BRAND } from '@/config/brand';

type TabKey = 'personal' | 'security';

const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: 'personal', label: 'Personal Info', icon: UserIcon },
  { key: 'security', label: 'Security', icon: Shield },
];

// ────────────────────────── Storage helpers ──────────────────────────
const PROFILE_KEY = 'havanat-profile-extras';

interface ProfileExtras {
  dateOfBirth: string;
  gender: string;
  bio: string;
  avatarUrl: string;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ────────────────────────── Component ──────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  // Use the same nav as AccountPage so users can navigate to the
  // account tabs from here. 'Profile' goes to /profile (this page),
  // the rest navigate to /account?tab=...
  const navItems: MobileBottomNavItem[] = [
    { key: 'profile', label: 'Profile', icon: UserIcon, onClick: () => navigate('/profile') },
    { key: 'orders', label: 'Orders', icon: Package, onClick: () => navigate('/account?tab=orders') },
    { key: 'membership', label: 'Membership', icon: Crown, onClick: () => navigate('/account?tab=membership') },
    { key: 'addresses', label: 'Addresses', icon: MapPin, onClick: () => navigate('/account?tab=addresses') },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, onClick: () => navigate('/account?tab=wishlist') },
  ];

  // Personal
  const [personalForm, setPersonalForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [extras, setExtras] = useState<ProfileExtras>(() =>
    readJSON<ProfileExtras>(PROFILE_KEY, { dateOfBirth: '', gender: '', bio: '', avatarUrl: '' })
  );

  useEffect(() => {
    if (user) {
      setPersonalForm({ name: user.name, phone: user.phone ?? '' });
    }
  }, [user]);

  // Security
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  // ───── Personal save ─────
  const handlePersonalSave = () => {
    if (!user) return;
    const nextUser = { ...user, name: personalForm.name.trim(), phone: personalForm.phone.trim() };
    // The legacy user object is hydrated by useAuthStore.persist, but it's also a public field
    useAuthStore.setState({ user: nextUser });
    writeJSON(PROFILE_KEY, extras);
    showToast('Profile updated', 'success');
  };


  // ───── Security ─────
  // Decides which password UI to show:
  //   hasPassword === true   → show ONLY "Change Password" form
  //                             (user has a usable password, needs to confirm current)
  //   hasPassword === false  → show ONLY "Set a Password" form
  //                             (OAuth user, or user never set one — OTP verified)
  // This is the SINGLE source of truth. OAuth users who have completed the
  // set-password flow get hasPassword=true and see the same form as anyone else.
  // We treat undefined as false (safer default — don't expose a flow the
  // user can't actually complete).
  const hasPassword = !!(user && (user as any).hasPassword === true);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwStage, setPwStage] = useState<'idle' | 'awaitingCode'>('idle');
  const [pwCode, setPwCode] = useState('');
  const [pwCodeErr, setPwCodeErr] = useState<string | null>(null);
  const [pwResendIn, setPwResendIn] = useState(0);

  useEffect(() => {
    if (pwResendIn <= 0) return;
    const id = setTimeout(() => setPwResendIn((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [pwResendIn]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.next || !pwForm.confirm) {
      showToast('Please fill in the new password fields', 'error');
      return;
    }
    if (pwForm.next.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (hasPassword && !pwForm.current) {
      showToast('Please enter your current password', 'error');
      return;
    }
    setPwBusy(true);
    try {
      if (!hasPassword) {
        // User has no usable password yet — verify OTP to set one
        await api('/api/auth/oauth/set-password/send', { method: 'POST', auth: true });
        setPwStage('awaitingCode');
        setPwResendIn(30);
        showToast('Check your email for a 6-digit code', 'success');
      } else {
        // User already has a password — verify current + set new
        await api('/api/auth/change-password', {
          method: 'POST',
          body: { currentPassword: pwForm.current, newPassword: pwForm.next },
          auth: true,
        });
        showToast('Password updated successfully', 'success');
        setPwForm({ current: '', next: '', confirm: '' });
      }
    } catch (err: any) {
      // err.details may include supportEmail, retryAfterMs, contactSupport
      const d = err?.details ?? {};
      if (err?.status === 429) {
        const min = d.retryAfterMinutes ?? Math.ceil((d.retryAfterMs ?? 0) / 60000);
        const email = d.supportEmail ?? 'concierge@havanat.store';
        showToast(
          d.contactSupport
            ? `Your account is locked. Please contact ${email} to unlock it.`
            : `Too many failed attempts. Try again in ${min} minute${min === 1 ? '': 's'}. If you keep having issues, contact ${email}.`,
          'error'
        );
      } else {
        showToast(err?.message ?? 'Could not update password', 'error');
      }
    } finally {
      setPwBusy(false);
    }
  };

  async function handleSubmitOtp(e: React.FormEvent) {
    e.preventDefault();
    setPwCodeErr(null);
    if (pwCode.length !== 6) {
      setPwCodeErr('Enter the 6-digit code.');
      return;
    }
    setPwBusy(true);
    try {
      await api('/api/auth/oauth/set-password/complete', {
        method: 'POST',
        body: { code: pwCode, newPassword: pwForm.next },
        auth: true,
      });
      showToast('Password set — you can now sign in with email + password', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
      setPwCode('');
      setPwStage('idle');
    } catch (err: any) {
      // err.details may include supportEmail, retryAfterMs, contactSupport
      const d = err?.details ?? {};
      if (err?.status === 429) {
        const min = d.retryAfterMinutes ?? Math.ceil((d.retryAfterMs ?? 0) / 60000);
        const email = d.supportEmail ?? 'concierge@havanat.store';
        setPwCodeErr(
          d.contactSupport
            ? `Your account is locked. Please contact ${email} to unlock it.`
            : `Too many failed attempts. Try again in ${min} minute${min === 1 ? '' : 's'}. If you keep having issues, contact ${email}.`
        );
      } else {
        setPwCodeErr(err?.message ?? 'Invalid or expired code.');
      }
    } finally {
      setPwBusy(false);
    }
  }

  async function handlePwResend() {
    if (pwResendIn > 0) return;
    try {
      await api('/api/auth/oauth/set-password/send', { method: 'POST', auth: true });
      showToast('A new code was sent', 'success');
      setPwResendIn(30);
    } catch {}
  }




  // ───── Render ─────
  return (
    <>
    <EmailVerificationBanner />
    <main className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8 lg:mb-12">
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-serif text-xl flex-shrink-0">
            {extras.avatarUrl ? (
              <img src={extras.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name.charAt(0).toUpperCase() ?? 'H'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">
              {BRAND.name} Profile
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              {user?.name ?? 'My Profile'}
            </h1>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8 -mx-4 sm:mx-0">
          <div className="flex overflow-x-auto px-4 sm:px-0 scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs uppercase tracking-[0.2em] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'personal' && (
          <PersonalTab
            name={personalForm.name}
            phone={personalForm.phone}
            email={user?.email ?? ''}
            extras={extras}
            onNameChange={(v) => setPersonalForm({ ...personalForm, name: v })}
            onPhoneChange={(v) => setPersonalForm({ ...personalForm, phone: v })}
            onExtrasChange={setExtras}
            onSave={handlePersonalSave}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            pwForm={pwForm}
            showPw={showPw}
            onPwChange={setPwForm}
            onToggleShow={(k) => setShowPw({ ...showPw, [k]: !showPw[k] })}
            onSubmit={handleChangePassword}
            hasPassword={hasPassword}
            pwBusy={pwBusy}
            pwStage={pwStage}
            pwCode={pwCode}
            setPwCode={setPwCode}
            pwCodeErr={pwCodeErr}
            handleSubmitOtp={handleSubmitOtp}
            handlePwResend={handlePwResend}
            pwResendIn={pwResendIn}
            setPwStage={setPwStage}
            setPwForm={setPwForm}
          />
        )}
      </div>

    </main>
    <MobileBottomNav activeKey="profile" items={navItems} />
    </>
  );
}

// ──────────────────────── Personal Tab ────────────────────────
interface PersonalTabProps {
  name: string;
  phone: string;
  email: string;
  extras: ProfileExtras;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onExtrasChange: (e: ProfileExtras) => void;
  onSave: () => void;
}

function PersonalTab({
  name,
  phone,
  email,
  extras,
  onNameChange,
  onPhoneChange,
  onExtrasChange,
  onSave,
}: PersonalTabProps) {
  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">Identity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Email <span className="text-gray-300 normal-case">(read-only)</span>
            </label>
            <input type="email" value={email} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className={inputClass}
              placeholder="+234 800 000 0000"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={extras.dateOfBirth}
              onChange={(e) => onExtrasChange({ ...extras, dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Gender
            </label>
            <select
              value={extras.gender}
              onChange={(e) => onExtrasChange({ ...extras, gender: e.target.value })}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Profile Photo URL
            </label>
            <input
              type="url"
              value={extras.avatarUrl}
              onChange={(e) => onExtrasChange({ ...extras, avatarUrl: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Bio
            </label>
            <textarea
              value={extras.bio}
              onChange={(e) => onExtrasChange({ ...extras, bio: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="A short note about your style..."
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onSave}
        className="px-8 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
      >
        Save changes
      </button>
    </div>
  );
}

// ──────────────────────── Address Book Tab ────────────────────────
// ──────────────────────── Security Tab ────────────────────────
interface SecurityTabProps {
  pwForm: { current: string; next: string; confirm: string };
  showPw: { current: boolean; next: boolean; confirm: boolean };
  onPwChange: (next: { current: string; next: string; confirm: string }) => void;
  onToggleShow: (k: 'current' | 'next' | 'confirm') => void;
  onSubmit: (e: React.FormEvent) => void;
  hasPassword: boolean;
  pwBusy: boolean;
  pwStage: 'idle' | 'awaitingCode';
  pwCode: string;
  setPwCode: (v: string) => void;
  pwCodeErr: string | null;
  handleSubmitOtp: (e: React.FormEvent) => void;
  handlePwResend: () => void;
  pwResendIn: number;
  setPwStage: (s: 'idle' | 'awaitingCode') => void;
  setPwForm: (v: { current: string; next: string; confirm: string }) => void;
}

function SecurityTab({
  pwForm,
  showPw,
  onPwChange,
  onToggleShow,
  onSubmit,
  hasPassword,
  pwBusy,
  pwStage,
  pwCode,
  setPwCode,
  pwCodeErr,
  handleSubmitOtp,
  handlePwResend,
  pwResendIn,
  setPwStage,
  setPwForm,
}: SecurityTabProps) {
  const user = useAuthStore((s) => s.user);

  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  // Two-factor (email OTP)
  const twoFactor = useTwoFactorStore();
  const twoFactorEnabled = twoFactor.enabled;
  const [enrolling, setEnrolling] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [showCodes, setShowCodes] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  // Sessions
  const sessions = useSessionStore((s) => s.sessions);
  const revokeSession = useSessionStore((s) => s.revoke);
  const revokeAllOthers = useSessionStore((s) => s.revokeAllOthers);
  const fetchSessions = useSessionStore((s) => s.fetch);
  const showToast = useUIStore((s) => s.showToast);

  // Fetch real active sessions from backend (DB: refresh_tokens) on mount
  useEffect(() => {
    fetchSessions().catch(() => {});
  }, [fetchSessions]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function startEnroll() {
    setErr(null);
    setCode('');
    setEnrolling(true);
    setResendIn(30);
    if (user?.email) {
      twoFactorActions.sendCode(user.email);
      showToast('Verification code sent to your email', 'success');
    }
  }

  function resendCode() {
    if (resendIn > 0) return;
    setErr(null);
    setCode('');
    setResendIn(30);
    if (user?.email) {
      twoFactorActions.sendCode(user.email);
      showToast('A new code was sent to your email', 'success');
    }
  }

  function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const ok = twoFactorActions.verify(code);
    if (!ok) {
      setErr('That code didn’t match. Try again or resend.');
      setBusy(false);
      return;
    }
    twoFactorActions.enable();
    showToast('Two-factor authentication enabled', 'success');
    setEnrolling(false);
    setCode('');
    setJustEnabled(true);
    setShowCodes(true);
    setBusy(false);
  }

  function disable2FA() {
    if (!window.confirm('Disable two-factor authentication? You will only need your password to sign in.')) return;
    twoFactorActions.disable();
    setJustEnabled(false);
    setShowCodes(false);
    showToast('Two-factor authentication disabled', 'info');
  }

  function regenerateCodes() {
    twoFactorActions.regenerateRecoveryCodes();
    showToast('Recovery codes regenerated', 'success');
  }

  return (
    <div className="space-y-10">
      {/* Change password */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
          {hasPassword ? 'Change Password' : 'Set a Password'}
        </h2>
        {!hasPassword && (
          <p className="text-xs text-gray-500 mb-4 max-w-md">
            Set a password below so you can also sign in with your email and password.
            We&apos;ll send a 6-digit code to your email to confirm it&apos;s really you.
          </p>
        )}
        {pwStage === 'awaitingCode' ? (
          <form onSubmit={handleSubmitOtp} className="max-w-md space-y-4 border border-black p-5 bg-gray-50">
            <p className="text-sm font-medium">Enter the verification code</p>
            <p className="text-xs text-gray-600">Check your email (and spam folder) for the 6-digit code.</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={pwCode}
              onChange={(e) => setPwCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-3 py-3 text-base border border-gray-200 focus:border-black focus:outline-none bg-white tracking-[0.4em] text-center font-serif text-2xl"
              required
            />
            {pwCodeErr && <p className="text-sm text-red-600">{pwCodeErr}</p>}
            <div className="flex gap-2 items-center">
              <button
                type="submit"
                disabled={pwBusy || pwCode.length !== 6}
                className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-30"
              >
                {pwBusy ? 'Setting…' : 'Confirm & set password'}
              </button>
              <button
                type="button"
                onClick={handlePwResend}
                disabled={pwResendIn > 0}
                className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-30"
              >
                {pwResendIn > 0 ? `Resend in ${pwResendIn}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => { setPwStage('idle'); setPwCode(''); setPwForm({ current: '', next: '', confirm: '' }); }}
                className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          {(hasPassword ? (['current', 'next', 'confirm'] as const) : (['next', 'confirm'] as const)).map((k) => (
            <div key={k}>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                {k === 'current' ? 'Current Password' : k === 'next' ? 'New Password' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPw[k] ? 'text' : 'password'}
                  value={pwForm[k]}
                  onChange={(e) => onPwChange({ ...pwForm, [k]: e.target.value })}
                  className={`${inputClass} pr-12`}
                  autoComplete={k === 'current' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => onToggleShow(k)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1"
                  aria-label={showPw[k] ? 'Hide password' : 'Show password'}
                >
                  {showPw[k] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={pwBusy} className="px-8 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">
            {pwBusy ? (hasPassword ? 'Updating...' : 'Sending code...') : (hasPassword ? 'Update password' : 'Send verification code')}
          </button>
        </form>
        )}
      </section>

      {/* Two-factor (email OTP) */}
      <section className="border-t border-gray-200 pt-8">
        <div className="flex items-start justify-between gap-4 max-w-2xl mb-5">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">Two-Factor Authentication</h2>
            <p className="text-sm font-medium">Email verification code</p>
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll send a 6-digit code to <strong className="text-black">{user?.email ?? 'your email'}</strong> when you sign in. Code expires in 10 minutes.
            </p>
          </div>
          {twoFactorEnabled && !enrolling ? (
            <button onClick={disable2FA} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline flex-shrink-0">
              Disable
            </button>
          ) : !twoFactorEnabled && !enrolling ? (
            <button onClick={startEnroll} className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium flex-shrink-0">
              Enable 2FA
            </button>
          ) : null}
        </div>

        {enrolling && (
          <div className="max-w-2xl border border-black p-5 bg-gray-50">
            <p className="text-sm font-medium mb-1">Enter the verification code</p>
            <p className="text-xs text-gray-600 mb-4">
              We sent a 6-digit code to <strong>{user?.email}</strong>. Check your inbox (and spam folder).
            </p>
            <form onSubmit={confirmEnroll} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-3 py-3 text-base border border-gray-200 focus:border-black focus:outline-none bg-white tracking-[0.4em] text-center font-serif text-2xl"
                required
              />
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex gap-2 items-center">
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-30"
                >
                  {busy ? 'Verifying…' : 'Confirm & enable'}
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resendIn > 0}
                  className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-30"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEnrolling(false); setCode(''); }}
                  className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {twoFactorEnabled && !enrolling && (
          <div className="max-w-2xl space-y-3">
            <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2">
              <Shield size={14} /> Two-factor authentication is active.
              {justEnabled && ' Codes printed below — save them now.'}
            </div>
            <button
              onClick={() => setShowCodes((v) => !v)}
              className="text-[10px] uppercase tracking-[0.15em] underline text-gray-600 hover:text-black"
            >
              {showCodes ? 'Hide recovery codes' : `View recovery codes (${twoFactor.recoveryCodes.length - twoFactor.usedRecoveryCodes.length} of ${twoFactor.recoveryCodes.length} left)`}
            </button>
            {showCodes && (
              <div className="space-y-3 border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs text-gray-600">
                  Use a recovery code if you ever lose access to your email. Each code works once.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-sm">
                  {twoFactor.recoveryCodes.map((c) => (
                    <div
                      key={c}
                      className={`px-3 py-2 text-center border ${twoFactor.usedRecoveryCodes.includes(c) ? 'opacity-30 line-through' : 'bg-white'}`}
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <button
                  onClick={regenerateCodes}
                  className="text-[10px] uppercase tracking-[0.15em] underline text-red-600 hover:text-red-700"
                >
                  Regenerate codes (revokes all current)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Active sessions */}
      <section className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">Active Sessions</h2>
            <p className="text-xs text-gray-500">Devices currently signed in to your Havanat account.</p>
          </div>
          {sessions.some((s) => !s.current) && (
            <button onClick={async () => { try { await revokeAllOthers(); showToast('All other sessions signed out', 'success'); } catch { showToast('Failed to revoke sessions', 'error'); } }} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline">
              Sign out all other sessions
            </button>
          )}
        </div>
        <ul className="space-y-2 max-w-2xl">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 border border-gray-200 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={14} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.device || 'Unknown device'}</p>
                  <p className="text-xs text-gray-500 truncate">IP {s.ip}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.current ? 'This device' : `Signed in ${new Date(s.createdAt).toLocaleString()}`}
                  </p>
                </div>
              </div>
              {s.current ? (
                <span className="text-[10px] uppercase tracking-[0.15em] bg-black text-white px-2 py-0.5">Current</span>
              ) : (
                <button onClick={async () => { try { await revokeSession(s.id); showToast('Session revoked', 'success'); } catch { showToast('Failed to revoke session', 'error'); } }} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline">
                  Sign out
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
