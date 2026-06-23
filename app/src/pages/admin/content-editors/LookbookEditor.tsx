import { useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';

export default function LookbookEditor() {
  const lookbook = useContentStore((s) => s.lookbook);
  const addLookbookImage = useContentStore((s) => s.addLookbookImage);
  const removeLookbookImage = useContentStore((s) => s.removeLookbookImage);
  const saveLookbook = useContentStore((s) => s.saveLookbook);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{lookbook.length} lookbook images</p>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Image
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {lookbook.map((img, i) => (
          <div key={img.id} className="bg-white border border-gray-200 group">
            <div className="aspect-[3/4] bg-gray-100 relative">
              <img src={img.url} alt={img.caption} className="absolute inset-0 w-full h-full object-cover" />
              <button
                onClick={() => {
                  if (!dashboardUser) return;
                  removeLookbookImage(img.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
                  showToast('Image removed', 'success');
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-600 hover:text-white transition-colors"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[10px] uppercase tracking-wider">#{i + 1}</div>
            </div>
            <div className="p-3">
              <input
                value={img.caption}
                onChange={(e) => {
                  const next = lookbook.map((x) => (x.id === img.id ? { ...x, caption: e.target.value } : x));
                  if (dashboardUser) saveLookbook(next, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
                }}
                className="w-full text-sm bg-transparent border-b border-transparent focus:border-black focus:outline-none"
              />
            </div>
            <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500">
              <GripVertical className="h-3 w-3" /> Order: {img.order}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddLookbookModal
          onClose={() => setShowAdd(false)}
          onAdd={(data) => {
            if (!dashboardUser) return;
            addLookbookImage(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast('Lookbook image added', 'success');
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddLookbookModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: { url: string; caption: string }) => void }) {
  const [url, setUrl] = useState('/images/community/professional-1.jpg');
  const [caption, setCaption] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">Add Lookbook Image</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Image URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            <img src={url} alt="" className="mt-2 h-32 w-full object-cover bg-gray-100" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Caption</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button
            onClick={() => onAdd({ url, caption })}
            disabled={!caption}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >Add</button>
        </div>
      </div>
    </div>
  );
}
