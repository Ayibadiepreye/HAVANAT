import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDeliveryZoneStore } from '@/stores/useDeliveryZoneStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { Plus, X, Trash2, Mail } from 'lucide-react';
import { useState } from 'react';
import { CONFIG } from '@/config';
import { useAdminUserStore } from '@/stores/useAdminUserStore';
import { EMAIL_TEMPLATES } from '@/data/dashboardMockData';
import type { DeliveryZone, AdminAccount } from '@/types/dashboard';
import RoleBadge from '@/components/admin/RoleBadge';
import { formatDate } from '@/utils/formatters';
export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your site, payment, delivery, and team.</p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none p-0 gap-0">
          {[
            ['site', 'Site Config', 'globe' as const],
            ['payments', 'Payment', 'credit-card' as const],
            ['zones', 'Delivery Zones', 'truck' as const],
            ['emails', 'Email Templates', 'mail' as const],
            ['team', 'Admin Users', 'users' as const],
          ].map(([k, l]) => (
            <TabsTrigger
              key={k}
              value={k as string}
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-black text-gray-500 border-b-2 border-transparent data-[state=active]:border-black rounded-none px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-medium"
            >{l as string}</TabsTrigger>
          ))}
        </TabsList>
        <div className="pt-6">
          <TabsContent value="site" className="m-0"><SiteConfigTab /></TabsContent>
          <TabsContent value="payments" className="m-0"><PaymentTab /></TabsContent>
          <TabsContent value="zones" className="m-0"><DeliveryZonesTab /></TabsContent>
          <TabsContent value="emails" className="m-0"><EmailsTab /></TabsContent>
          <TabsContent value="team" className="m-0"><TeamTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SiteConfigTab() {
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<{
    brandName: string;
    phone: string;
    email: string;
    address: string;
    instagram: string;
    twitter: string;
    facebook: string;
  }>({
    brandName: CONFIG.BRAND_NAME,
    phone: CONFIG.CONTACT.PHONE,
    email: CONFIG.CONTACT.EMAIL,
    address: CONFIG.CONTACT.ADDRESS,
    instagram: CONFIG.SOCIAL.INSTAGRAM,
    twitter: CONFIG.SOCIAL.TWITTER,
    facebook: CONFIG.SOCIAL.FACEBOOK,
  });
  return (
    <div className="bg-white border border-gray-200 p-6 max-w-2xl space-y-4">
      <Field label="Brand Name" value={form.brandName} onChange={(v) => setForm({ ...form, brandName: v })} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Contact Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Contact Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      </div>
      <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
        <Field label="Twitter / X" value={form.twitter} onChange={(v) => setForm({ ...form, twitter: v })} />
        <Field label="Facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} />
      </div>
      <button
        onClick={() => showToast('Settings saved (mock)', 'success')}
        className="bg-black text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900"
      >Save Settings</button>
    </div>
  );
}

function PaymentTab() {
  const showToast = useUIStore((s) => s.showToast);
  const [gateways, setGateways] = useState({ paystack: true, flutterwave: true, stripe: false });
  return (
    <div className="bg-white border border-gray-200 p-6 max-w-xl space-y-4">
      {([
        { key: 'paystack', name: 'Paystack', desc: 'Nigerian card & bank payments' },
        { key: 'flutterwave', name: 'Flutterwave', desc: 'Pan-African payments' },
        { key: 'stripe', name: 'Stripe', desc: 'International cards' },
      ] as const).map((g) => (
        <div key={g.key} className="flex items-center justify-between border border-gray-200 p-4">
          <div>
            <p className="font-medium text-sm">{g.name}</p>
            <p className="text-xs text-gray-500">{g.desc}</p>
          </div>
          <button
            onClick={() => { setGateways({ ...gateways, [g.key]: !gateways[g.key] }); showToast(`${g.name} ${gateways[g.key] ? 'disabled' : 'enabled'}`, 'success'); }}
            className={`w-12 h-6 rounded-full relative transition-colors ${gateways[g.key] ? 'bg-black' : 'bg-gray-300'}`}
            aria-label={`Toggle ${g.name}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${gateways[g.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeliveryZonesTab() {
  const zones = useDeliveryZoneStore((s) => s.zones);
  const addZone = useDeliveryZoneStore((s) => s.addZone);
  const removeZone = useDeliveryZoneStore((s) => s.removeZone);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showAdd, setShowAdd] = useState(false);

  const columns: Column<DeliveryZone>[] = [
    { key: 'state', label: 'State', render: (z) => z.state },
    { key: 'fee', label: 'Fee', render: (z) => `₦${z.fee.toLocaleString('en-NG')}`, align: 'right' },
    { key: 'eta', label: 'ETA', render: (z) => <span className="text-xs text-gray-600">{z.eta}</span> },
    {
      key: 'actions', label: '', align: 'right', width: '60px',
      render: (z) => (
        <button
          onClick={() => dashboardUser && removeZone(z.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' })}
          className="p-1.5 hover:bg-gray-100 text-red-600"
          aria-label="Delete"
        ><Trash2 className="h-4 w-4" /></button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Zone
        </button>
      </div>
      <AdminTable<DeliveryZone> columns={columns} rows={zones} keyFn={(z) => z.id} emptyMessage="No delivery zones" />

      {showAdd && (
        <AddZoneModal
          onClose={() => setShowAdd(false)}
          onAdd={(z) => {
            if (!dashboardUser) return;
            addZone(z, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`Added ${z.state} zone`, 'success');
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddZoneModal({ onClose, onAdd }: { onClose: () => void; onAdd: (z: Omit<DeliveryZone, 'id'>) => void }) {
  const [state, setState] = useState('');
  const [fee, setFee] = useState(3500);
  const [eta, setEta] = useState('3-5 business days');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">Add Delivery Zone</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="State / Region" value={state} onChange={setState} />
          <Field label="Delivery Fee (₦)" value={String(fee)} onChange={(v) => setFee(Number(v))} />
          <Field label="ETA" value={eta} onChange={setEta} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button onClick={() => onAdd({ state, fee, eta })} disabled={!state} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50">Add Zone</button>
        </div>
      </div>
    </div>
  );
}

function EmailsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {EMAIL_TEMPLATES.map((t) => (
        <div key={t.id} className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4" />
            <h4 className="font-medium text-sm">{t.name}</h4>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium">Subject</p>
          <p className="text-sm mb-3">{t.subject}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium">Preview</p>
          <p className="text-xs text-gray-600 leading-relaxed">{t.preview}</p>
          <button className="mt-4 text-[10px] uppercase tracking-wider underline underline-offset-4 hover:opacity-60">Edit Template</button>
        </div>
      ))}
    </div>
  );
}

function TeamTab() {
  const accounts = useAdminUserStore((s) => s.accounts);
  const removeAccount = useAdminUserStore((s) => s.removeAccount);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);

  const columns: Column<AdminAccount>[] = [    { key: 'name', label: 'Name', render: (a) => a.name },
    { key: 'email', label: 'Email', render: (a) => <span className="text-xs">{a.email}</span> },
    { key: 'role', label: 'Role', render: (a) => <RoleBadge role={a.role} /> },
    { key: 'created', label: 'Created', render: (a) => <span className="text-xs">{formatDate(a.createdAt)}</span> },
    {
      key: 'actions', label: '', align: 'right', width: '60px',
      render: (a) => (
        <button
          onClick={() => {
            if (!dashboardUser || a.id === dashboardUser.id) return;
            removeAccount(a.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`Removed ${a.name}`, 'success');
          }}
          className="p-1.5 hover:bg-gray-100 text-red-600"
          aria-label="Remove"
        ><Trash2 className="h-4 w-4" /></button>
      ),
    },
  ];

  return (
    <AdminTable<AdminAccount> columns={columns} rows={accounts} keyFn={(a) => a.id} emptyMessage="No team members" />
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
    </div>
  );
}
