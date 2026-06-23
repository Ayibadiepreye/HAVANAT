import { useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Upload, Save } from 'lucide-react';

export default function BrandingEditor() {
  const branding = useContentStore((s) => s.branding);
  const saveBranding = useContentStore((s) => s.saveBranding);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState(branding);

  return (
    <div className="bg-white border border-gray-200 p-6 max-w-3xl space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AssetField label="Logo (Light)" url={form.logoLight} onChange={(v) => setForm({ ...form, logoLight: v })} />
        <AssetField label="Logo (Dark)" url={form.logoDark} onChange={(v) => setForm({ ...form, logoDark: v })} />
        <AssetField label="Favicon" url={form.favicon} onChange={(v) => setForm({ ...form, favicon: v })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Primary Gray</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.primaryGray} onChange={(e) => setForm({ ...form, primaryGray: e.target.value })} className="h-10 w-12 border border-gray-200 cursor-pointer" />
            <input value={form.primaryGray} onChange={(e) => setForm({ ...form, primaryGray: e.target.value })} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Accent Gray</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.accentGray} onChange={(e) => setForm({ ...form, accentGray: e.target.value })} className="h-10 w-12 border border-gray-200 cursor-pointer" />
            <input value={form.accentGray} onChange={(e) => setForm({ ...form, accentGray: e.target.value })} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">Last updated: {new Date(branding.updatedAt).toLocaleString('en-NG')}</p>

      <button
        onClick={() => {
          if (!dashboardUser) return;
          saveBranding(form, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
          showToast('Brand assets saved', 'success');
        }}
        className="bg-black text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 flex items-center gap-2"
      >
        <Save className="h-3.5 w-3.5" /> Save Changes
      </button>
    </div>
  );
}

function AssetField({ label, url, onChange }: { label: string; url: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">{label}</label>
      <div className="relative">
        <img src={url} alt="" className="h-24 w-full object-cover bg-gray-100" />
        <button className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
          <Upload className="h-4 w-4" /> Replace
        </button>
      </div>
      <input value={url} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full px-3 py-2 text-xs border border-gray-200 focus:border-black focus:outline-none" />
    </div>
  );
}
