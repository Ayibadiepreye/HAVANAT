import { useEffect, useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Shield,
  Bell,
  CreditCard,
  Plus,
  X,
  Trash2,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTotpStore, totpHelpers, totpActions } from '@/stores/useTotpStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { Smartphone } from 'lucide-react';
import { BRAND } from '@/config/brand';
import type { Address } from '@/types';

type TabKey = 'personal' | 'addresses' | 'security' | 'notifications' | 'payments';

const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: 'personal', label: 'Personal Info', icon: UserIcon },
  { key: 'addresses', label: 'Address Book', icon: MapPin },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'payments', label: 'Payment Methods', icon: CreditCard },
];

// ────────────────────────── Storage helpers ──────────────────────────
const PROFILE_KEY = 'havanat-profile-extras';
const ADDRESS_KEY = 'havanat-addresses';
const NOTIF_KEY = 'havanat-notifications';
const PAY_KEY = 'havanat-payment-methods';
const SEC_KEY = 'havanat-security';

interface ProfileExtras {
  dateOfBirth: string;
  gender: string;
  bio: string;
  avatarUrl: string;
}

interface NotificationPrefs {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
  membership: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

interface SavedCard {
  id: string;
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  billingZip: string;
  isDefault: boolean;
}

interface SecurityPrefs {
  twoFactorEnabled: boolean;
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

// ────────────────────────── Formatters ──────────────────────────
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6/.test(digits)) return 'Discover';
  return 'Card';
}

// ────────────────────────── Component ──────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<TabKey>('personal');

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

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>(() =>
    readJSON<Address[]>(ADDRESS_KEY, [])
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Security
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [security, setSecurity] = useState<SecurityPrefs>(() =>
    readJSON<SecurityPrefs>(SEC_KEY, { twoFactorEnabled: false })
  );

  // Notifications
  const [notif, setNotif] = useState<NotificationPrefs>(() =>
    readJSON<NotificationPrefs>(NOTIF_KEY, {
      orderUpdates: true,
      promotions: false,
      newsletter: false,
      membership: true,
      smsNotifications: true,
      emailNotifications: true,
    })
  );

  // Payment
  const [cards, setCards] = useState<SavedCard[]>(() => readJSON<SavedCard[]>(PAY_KEY, []));
  const [cardModalOpen, setCardModalOpen] = useState(false);

  // ───── Personal save ─────
  const handlePersonalSave = () => {
    if (!user) return;
    const nextUser = { ...user, name: personalForm.name.trim(), phone: personalForm.phone.trim() };
    // The legacy user object is hydrated by useAuthStore.persist, but it's also a public field
    useAuthStore.setState({ user: nextUser });
    writeJSON(PROFILE_KEY, extras);
    showToast('Profile updated', 'success');
  };

  // ───── Address CRUD ─────
  const openNewAddress = () => {
    setEditingAddress(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressModalOpen(true);
  };

  const saveAddress = (addr: Address) => {
    let next: Address[];
    if (editingAddress) {
      next = addresses.map((a) => (a.id === addr.id ? addr : a));
    } else {
      next = [...addresses, addr];
    }
    if (addr.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === addr.id }));
    setAddresses(next);
    writeJSON(ADDRESS_KEY, next);
    setAddressModalOpen(false);
    setEditingAddress(null);
    showToast(editingAddress ? 'Address updated' : 'Address added', 'success');
  };

  const deleteAddress = (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    writeJSON(ADDRESS_KEY, next);
    showToast('Address removed', 'info');
  };

  const setDefaultAddress = (id: string) => {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(next);
    writeJSON(ADDRESS_KEY, next);
    showToast('Default address updated', 'success');
  };

  // ───── Security ─────
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      showToast('Please fill in all password fields', 'error');
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
    setPwForm({ current: '', next: '', confirm: '' });
    showToast('Password updated successfully', 'success');
  };

  const toggle2FA = () => {
    const next = !security.twoFactorEnabled;
    setSecurity({ twoFactorEnabled: next });
    writeJSON(SEC_KEY, { twoFactorEnabled: next });
    showToast(next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled', 'info');
  };

  // ───── Notifications ─────
  const updateNotif = (patch: Partial<NotificationPrefs>) => {
    const next = { ...notif, ...patch };
    setNotif(next);
    writeJSON(NOTIF_KEY, next);
  };

  // ───── Payment methods ─────
  const openNewCard = () => setCardModalOpen(true);
  const saveCard = (card: SavedCard) => {
    let next: SavedCard[];
    if (card.isDefault) {
      next = [...cards.map((c) => ({ ...c, isDefault: false })), card];
    } else {
      next = cards.length === 0 ? [{ ...card, isDefault: true }] : [...cards, card];
    }
    setCards(next);
    writeJSON(PAY_KEY, next);
    setCardModalOpen(false);
    showToast('Card saved', 'success');
  };
  const deleteCard = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    writeJSON(PAY_KEY, next);
    showToast('Card removed', 'info');
  };
  const setDefaultCard = (id: string) => {
    const next = cards.map((c) => ({ ...c, isDefault: c.id === id }));
    setCards(next);
    writeJSON(PAY_KEY, next);
    showToast('Default card updated', 'success');
  };

  // ───── Render ─────
  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
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

        {activeTab === 'addresses' && (
          <AddressBookTab
            addresses={addresses}
            onAdd={openNewAddress}
            onEdit={openEditAddress}
            onDelete={deleteAddress}
            onSetDefault={setDefaultAddress}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            pwForm={pwForm}
            showPw={showPw}
            twoFactor={security.twoFactorEnabled}
            onPwChange={setPwForm}
            onToggleShow={(k) => setShowPw({ ...showPw, [k]: !showPw[k] })}
            onSubmit={handlePasswordChange}
            onToggle2FA={toggle2FA}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab prefs={notif} onChange={updateNotif} />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            cards={cards}
            onAdd={openNewCard}
            onDelete={deleteCard}
            onSetDefault={setDefaultCard}
          />
        )}
      </div>

      {addressModalOpen && (
        <AddressModal
          initial={editingAddress}
          hasAddresses={addresses.length > 0}
          onClose={() => {
            setAddressModalOpen(false);
            setEditingAddress(null);
          }}
          onSave={saveAddress}
        />
      )}

      {cardModalOpen && (
        <CardModal
          hasCards={cards.length > 0}
          onClose={() => setCardModalOpen(false)}
          onSave={saveCard}
        />
      )}
    </main>
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
interface AddressBookTabProps {
  addresses: Address[];
  onAdd: () => void;
  onEdit: (a: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function AddressBookTab({ addresses, onAdd, onEdit, onDelete, onSetDefault }: AddressBookTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Saved Addresses</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 border border-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
        >
          <Plus size={14} /> Add new
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200">
          <MapPin size={40} strokeWidth={1} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-4">No addresses saved yet.</p>
          <button
            type="button"
            onClick={onAdd}
            className="px-6 py-2 bg-black text-white text-xs uppercase tracking-[0.2em]"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`bg-white border p-5 hover:border-black transition-colors duration-300 ${
                a.isDefault ? 'border-black' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.email}
                  </p>
                </div>
                {a.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] uppercase tracking-[0.2em]">
                    <Star size={10} /> Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{a.street}</p>
              <p className="text-sm text-gray-500">
                {a.city}, {a.state}
              </p>
              <p className="text-sm text-gray-500 mt-1">{a.phone}</p>
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-black"
                >
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(a.id)}
                    className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-black"
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Security Tab ────────────────────────
interface SecurityTabProps {
  pwForm: { current: string; next: string; confirm: string };
  showPw: { current: boolean; next: boolean; confirm: boolean };
  twoFactor: boolean;
  onPwChange: (next: { current: string; next: string; confirm: string }) => void;
  onToggleShow: (k: 'current' | 'next' | 'confirm') => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggle2FA: () => void;
}

function SecurityTab({
  pwForm,
  showPw,
  onPwChange,
  onToggleShow,
  onSubmit,
}: SecurityTabProps) {
  const user = useAuthStore((s) => s.user);

  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  // TOTP
  const totp = useTotpStore();
  const totpEnabled = totp.enabledAt !== null;
  const [totpEnroll, setTotpEnroll] = useState<{ secret: string; recoveryCodes: string[] } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpErr, setTotpErr] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [liveOtp, setLiveOtp] = useState('');

  // Sessions
  const sessions = useSessionStore((s) => s.sessions);
  const revokeSession = useSessionStore((s) => s.revoke);
  const revokeAllOthers = useSessionStore((s) => s.revokeAllOthers);
  const showToast = useUIStore((s) => s.showToast);

  // Tick live OTP preview every second when enroll is open
  useEffect(() => {
    if (!totpEnroll || !totp.secret) return;
    const tick = () => {
      totpHelpers.generateCode(totp.secret!).then(setLiveOtp).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [totpEnroll, totp.secret]);

  function startEnroll() {
    setTotpErr(null);
    const result = totpActions.enable();
    setTotpEnroll(result);
    setShowCodes(true);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setTotpBusy(true);
    setTotpErr(null);
    const ok = await totpActions.verify(totpCode);
    if (!ok) {
      setTotpErr('Code didn’t match. Try again.');
      setTotpBusy(false);
      return;
    }
    showToast('Two-factor authentication enabled', 'success');
    setTotpEnroll(null);
    setTotpCode('');
    setTotpBusy(false);
  }

  function disableTotp() {
    totpActions.disable();
    showToast('Two-factor authentication disabled', 'info');
  }

  function regenerateCodes() {
    totpActions.regenerateRecoveryCodes();
    showToast('Recovery codes regenerated', 'success');
  }

  return (
    <div className="space-y-10">
      {/* Change password */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">Change Password</h2>
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          {(['current', 'next', 'confirm'] as const).map((k) => (
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
          <button type="submit" className="px-8 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors">
            Update password
          </button>
        </form>
      </section>

      {/* Two-factor */}
      <section className="border-t border-gray-200 pt-8">
        <div className="flex items-start justify-between gap-4 max-w-2xl mb-5">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">Two-Factor Authentication</h2>
            <p className="text-sm font-medium">Authenticator app (TOTP)</p>
            <p className="text-xs text-gray-500 mt-1">Use Google Authenticator, Authy, 1Password, or any other TOTP app. We use TOTP instead of SMS because SMS is the most common phishing vector in 2025.</p>
          </div>
          {totpEnabled && !totpEnroll ? (
            <button onClick={disableTotp} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline flex-shrink-0">
              Disable
            </button>
          ) : !totpEnabled && !totpEnroll ? (
            <button onClick={startEnroll} className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium flex-shrink-0">
              Enable 2FA
            </button>
          ) : null}
        </div>

        {totpEnroll && (
          <div className="max-w-2xl border border-black p-5 bg-gray-50">
            <p className="text-sm font-medium mb-3">Scan this with your authenticator app</p>
            <p className="text-xs text-gray-600 mb-4">If you can&apos;t scan, enter the secret below manually.</p>
            <div className="bg-white border p-4 mb-4 font-mono text-sm break-all">
              {totpEnroll.secret}
            </div>
            <p className="text-xs text-gray-500 mb-4">Account: {user?.email || 'you@havanat.store'} · Issuer: Havanat</p>
            <form onSubmit={confirmEnroll} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1 font-semibold">Enter the 6-digit code from your app</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white tracking-[0.4em] text-center font-serif text-xl"
                  required
                />
                {liveOtp && (
                  <p className="text-[10px] text-gray-400 mt-1.5">Live OTP from secret (for demo): <span className="font-mono">{liveOtp}</span></p>
                )}
              </div>
              {totpErr && <p className="text-sm text-red-600">{totpErr}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={totpBusy || totpCode.length !== 6} className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-30">
                  {totpBusy ? 'Verifying…' : 'Confirm & enable'}
                </button>
                <button type="button" onClick={() => { setTotpEnroll(null); setTotpCode(''); totpActions.disable(); }} className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium">
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-200">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-2">Recovery codes</p>
              <p className="text-xs text-gray-600 mb-3">Save these somewhere safe. Each one can be used once if you lose your authenticator app.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-sm">
                {totpEnroll.recoveryCodes.map((c) => (
                  <div key={c} className="bg-white border px-3 py-2 text-center">{c}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {totpEnabled && !totpEnroll && (
          <div className="max-w-2xl space-y-3">
            <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2">
              <Shield size={14} /> Two-factor authentication is active. Enabled {new Date(totp.enabledAt!).toLocaleDateString()}.
            </div>
            <button onClick={() => setShowCodes((v) => !v)} className="text-[10px] uppercase tracking-[0.15em] underline text-gray-600 hover:text-black">
              {showCodes ? 'Hide recovery codes' : `View recovery codes (${totp.recoveryCodes.length - totp.usedRecoveryCodes.length} of ${totp.recoveryCodes.length} left)`}
            </button>
            {showCodes && (
              <div className="space-y-3 border border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-sm">
                  {totp.recoveryCodes.map((c) => (
                    <div key={c} className={`px-3 py-2 text-center border ${totp.usedRecoveryCodes.includes(c) ? 'opacity-30 line-through' : 'bg-white'}`}>{c}</div>
                  ))}
                </div>
                <button onClick={regenerateCodes} className="text-[10px] uppercase tracking-[0.15em] underline text-red-600 hover:text-red-700">
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
            <button onClick={() => { revokeAllOthers(); showToast('All other sessions signed out', 'success'); }} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline">
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
                  <p className="text-sm font-medium truncate">{s.device}</p>
                  <p className="text-xs text-gray-500 truncate">{s.location} · {s.ip}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.current ? 'This device' : `Last active ${new Date(s.lastActive).toLocaleString()}`}
                  </p>
                </div>
              </div>
              {s.current ? (
                <span className="text-[10px] uppercase tracking-[0.15em] bg-black text-white px-2 py-0.5">Current</span>
              ) : (
                <button onClick={() => { revokeSession(s.id); showToast('Session revoked', 'success'); }} className="text-[10px] uppercase tracking-[0.15em] text-red-600 hover:underline">
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

// ──────────────────────── Notifications Tab ────────────────────────
interface NotificationsTabProps {
  prefs: NotificationPrefs;
  onChange: (patch: Partial<NotificationPrefs>) => void;
}

function NotificationsTab({ prefs, onChange }: NotificationsTabProps) {
  const rows: Array<{ key: keyof NotificationPrefs; label: string; description: string }> = [
    {
      key: 'orderUpdates',
      label: 'Order Updates',
      description: 'Shipment progress, delivery confirmations and status changes.',
    },
    {
      key: 'promotions',
      label: 'Promotions',
      description: 'Sales, limited drops and special offers from ' + BRAND.name + '.',
    },
    {
      key: 'newsletter',
      label: 'Newsletter',
      description: 'Style stories, lookbooks and curated reading.',
    },
    {
      key: 'membership',
      label: 'Membership',
      description: 'Tier perks, billing and renewal reminders.',
    },
    {
      key: 'smsNotifications',
      label: 'SMS Notifications',
      description: 'Critical updates via text message.',
    },
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'All marketing and transactional emails.',
    },
  ];

  return (
    <div className="space-y-1 divide-y divide-gray-200 border border-gray-200">
      {rows.map(({ key, label, description }) => (
        <div key={key} className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ [key]: !prefs[key] })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              prefs[key] ? 'bg-black' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={prefs[key]}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                prefs[key] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────── Payments Tab ────────────────────────
interface PaymentsTabProps {
  cards: SavedCard[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function PaymentsTab({ cards, onAdd, onDelete, onSetDefault }: PaymentsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Saved Cards</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 border border-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
        >
          <Plus size={14} /> Add new
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200">
          <CreditCard size={40} strokeWidth={1} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-4">No saved cards yet.</p>
          <button
            type="button"
            onClick={onAdd}
            className="px-6 py-2 bg-black text-white text-xs uppercase tracking-[0.2em]"
          >
            Add a card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`bg-white border p-5 hover:border-black transition-colors duration-300 ${
                c.isDefault ? 'border-black' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{c.brand} •••• {c.last4}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.cardholderName}</p>
                  <p className="text-xs text-gray-500">Expires {c.expiry}</p>
                </div>
                {c.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] uppercase tracking-[0.2em]">
                    <Star size={10} /> Default
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                {!c.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(c.id)}
                    className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-black"
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Address Modal ────────────────────────
interface AddressModalProps {
  initial: Address | null;
  hasAddresses: boolean;
  onClose: () => void;
  onSave: (a: Address) => void;
}

function AddressModal({ initial, hasAddresses, onClose, onSave }: AddressModalProps) {
  const [form, setForm] = useState<Address>(
    initial ?? {
      id: 'addr_' + Date.now().toString(36),
      name: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      isDefault: !hasAddresses,
    }
  );
  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  return (
    <ModalShell onClose={onClose} title={initial ? 'Edit address' : 'Add address'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Label
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Home, Office"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Phone
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="+234 800 000 0000"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="optional"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Street
            </label>
            <input
              required
              type="text"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className={inputClass}
              placeholder="House number, street"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              City
            </label>
            <input
              required
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass}
              placeholder="e.g. Victoria Island"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              State
            </label>
            <select
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={inputClass}
            >
              <option value="">Select State</option>
              {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Delta', 'Kaduna', 'Ogun', 'Edo', 'Anambra'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={!!form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="w-4 h-4 accent-black"
          />
          <span className="text-xs text-gray-500">Set as default address</span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
          >
            {initial ? 'Save changes' : 'Add address'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ──────────────────────── Card Modal ────────────────────────
interface CardModalProps {
  hasCards: boolean;
  onClose: () => void;
  onSave: (c: SavedCard) => void;
}

function CardModal({ hasCards, onClose, onSave }: CardModalProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [zip, setZip] = useState('');
  const [isDefault, setIsDefault] = useState(!hasCards);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = number.replace(/\D/g, '');
    if (digits.length < 13) {
      setError('Card number looks incomplete.');
      return;
    }
    if (cvv.length < 3) {
      setError('Enter the CVV on the back of your card.');
      return;
    }
    const last4 = digits.slice(-4);
    onSave({
      id: 'card_' + Date.now().toString(36),
      cardholderName: name.trim(),
      last4,
      brand: detectCardBrand(digits),
      expiry,
      billingZip: zip,
      isDefault,
    });
  };

  return (
    <ModalShell onClose={onClose} title="Add new card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
            Cardholder Name
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Name on card"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
            Card Number
          </label>
          <input
            required
            type="text"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            className={`${inputClass} font-mono tracking-wider`}
            placeholder="0000 0000 0000 0000"
            maxLength={23}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Expiry
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className={`${inputClass} font-mono`}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              CVV
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`${inputClass} font-mono`}
              placeholder="000"
              maxLength={4}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Billing Zip
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className={inputClass}
              placeholder="100001"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 accent-black"
          />
          <span className="text-xs text-gray-500">Set as default payment method</span>
        </label>

        {error && (
          <p className="text-xs text-error-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
          >
            Save card
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ──────────────────────── Modal Shell ────────────────────────
interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-serif text-xl font-light">{title}</h2>
          <button onClick={onClose} className="p-1 hover:opacity-60 transition-opacity">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}