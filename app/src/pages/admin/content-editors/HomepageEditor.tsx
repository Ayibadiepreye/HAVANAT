import { useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Upload, Save } from 'lucide-react';

export default function HomepageEditor() {
  const homepage = useContentStore((s) => s.homepage);
  const saveHomepage = useContentStore((s) => s.saveHomepage);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState(homepage);

  return (
    <div className="bg-white border border-gray-200 p-6 max-w-3xl space-y-5">
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">Hero Image</label>
        <div className="relative">
          <img src={form.heroImage} className="h-48 w-full object-cover bg-gray-100" alt="" />
          <button className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
            <Upload className="h-4 w-4" /> Replace
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Headline</label>
        <input
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none font-serif text-lg"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Tagline</label>
        <input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Featured Collection (comma-separated product IDs)</label>
        <input
          value={form.featuredCollectionIds.join(', ')}
          onChange={(e) => setForm({ ...form, featuredCollectionIds: e.target.value.split(',').map((s) => Number(s.trim())).filter(Boolean) })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1.5">Last updated: {new Date(homepage.updatedAt).toLocaleString('en-NG')}</p>
      </div>

      <button
        onClick={() => {
          if (!dashboardUser) return;
          saveHomepage(form, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
          showToast('Homepage content saved', 'success');
        }}
        className="bg-black text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 flex items-center gap-2"
      >
        <Save className="h-3.5 w-3.5" /> Save Changes
      </button>
    </div>
  );
}
