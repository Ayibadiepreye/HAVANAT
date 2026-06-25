import { useState, useEffect } from 'react';
import { useAdminProductStore } from '@/stores/useProductStoreAdmin';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Product } from '@/types';
import { X, Upload, Loader2, ImageIcon } from 'lucide-react';
import { uploadToCloudinary, cloudinaryConfig } from '@/lib/cloudinary';

const CATEGORIES = ['Suits', 'Blazers', 'Trousers', 'Vests', 'Formal', 'Outerwear'] as const;
const FITS = ['Oversized', 'Tailored', 'Classic', 'Slim'] as const;
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductFormModal({ product, onClose }: Props) {
  const addProduct = useAdminProductStore((s) => s.addProduct);
  const updateProduct = useAdminProductStore((s) => s.updateProduct);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f, 'havanat/products')));
      setForm((f) => ({ ...f, images: [...(f.images ?? []), ...uploaded] }));
      showToast(`Uploaded ${uploaded.length} image${uploaded.length === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Upload failed: ${(err as Error).message}`, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const [form, setForm] = useState<Partial<Product>>(() =>
    product
      ? { ...product }
      : {
          id: Date.now(),
          name: '',
          slug: '',
          price: 0,
          images: ['/images/products/suit-oversized-blazer.jpg'],
          category: 'Suits',
          fit: 'Tailored',
          sizes: ['S', 'M', 'L'],
          colors: ['Black'],
          description: '',
          inStock: true,
          stock: 10,
          lowStockThreshold: 5,
          deliveryFee: 2500,
          deluxeDiscount: 0.05,
          eliteDiscount: 0.10,
          occasion: ['corporate'],
          details: { material: '', care: '', shipping: '', sizeGuide: '' },
        }
  );

  useEffect(() => {
    const name = form.name ?? '';
    if (!form.slug && name) {
      setForm((f) => ({ ...f, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
    }
  }, [form.name, form.slug]);

  const save = (andAddAnother = false) => {
    if (!dashboardUser) return;
    if (!form.name || !form.price) {
      showToast('Name and price are required', 'error');
      return;
    }
    const name = form.name;
    const p: Product = {
      id: form.id as number,
      name,
      slug: form.slug as string,
      price: Number(form.price ?? 0),
      stock: Number(form.stock ?? 0),
      lowStockThreshold: Number(form.lowStockThreshold ?? 5),
      deliveryFee: Number(form.deliveryFee ?? 2500),
      deluxeDiscount: Number(form.deluxeDiscount ?? 0.05),
      eliteDiscount: Number(form.eliteDiscount ?? 0.10),
      occasion: form.occasion ?? ['corporate'],
      originalPrice: form.originalPrice,
      images: form.images as string[],
      category: form.category as Product['category'],
      fit: form.fit as Product['fit'],
      sizes: form.sizes as string[],
      colors: form.colors as string[],
      description: form.description as string,
      inStock: form.inStock ?? true,
      isNew: form.isNew,
      isBestseller: form.isBestseller,
      details: form.details,
    };
    if (product) {
      updateProduct(p, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
      showToast('Product updated', 'success');
    } else {
      addProduct(p, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
      showToast('Product added', 'success');
    }
    if (andAddAnother) {
      setForm({
        ...form, id: Date.now(), name: '', slug: '', price: 0, description: '',
      });
    } else {
      onClose();
    }
  };

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes?.includes(s) ? f.sizes.filter((x) => x !== s) : [...(f.sizes ?? []), s],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="font-serif text-2xl font-light">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <Label>Product Images</Label>
            {!cloudinaryConfig.configured && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800 mb-2">
                Cloudinary not configured. Set <code className="bg-yellow-100 px-1">VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
                <code className="bg-yellow-100 px-1">VITE_CLOUDINARY_UPLOAD_PRESET</code> in <code>app/.env</code> to enable uploads.
              </div>
            )}
            <div className="flex flex-wrap gap-3 mb-3">
              {(form.images ?? []).map((url, idx) => (
                <div key={idx} className="relative group w-24 h-24 border bg-gray-50">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, images: (form.images ?? []).filter((_, i) => i !== idx) })}
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] uppercase tracking-wider text-center py-0.5">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
            <label
              className={`border-2 border-dashed border-gray-200 p-6 text-center block cursor-pointer hover:border-black transition-colors ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading || !cloudinaryConfig.configured}
                onChange={handleUpload}
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB · stored on Cloudinary</p>
                </>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>Slug</Label>
              <input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Fit</Label>
              <select value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value as Product['fit'] })} className={inputCls}>
                {FITS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label>Price (₦)</Label>
              <input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <Label>Stock (units)</Label>
              <input type="number" min={0} value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: Math.max(0, Number(e.target.value)) })} className={inputCls} />
            </div>
            <div>
              <Label>Low-stock alert below</Label>
              <input type="number" min={0} value={form.lowStockThreshold ?? 5} onChange={(e) => setForm({ ...form, lowStockThreshold: Math.max(0, Number(e.target.value)) })} className={inputCls} />
            </div>
            <div>
              <Label>Per-unit delivery fee (₦)</Label>
              <input type="number" min={0} value={form.deliveryFee ?? 2500} onChange={(e) => setForm({ ...form, deliveryFee: Math.max(0, Number(e.target.value)) })} className={inputCls} />
            </div>
            <div>
              <Label>Stock status</Label>
              <select value={form.inStock ? '1' : '0'} onChange={(e) => setForm({ ...form, inStock: e.target.value === '1' })} className={inputCls}>
                <option value="1">Published</option>
                <option value="0">Draft</option>
              </select>
            </div>
            <div>
              <Label>Deluxe discount (0-1)</Label>
              <input type="number" min={0} max={1} step={0.01} value={form.deluxeDiscount ?? 0.05} onChange={(e) => setForm({ ...form, deluxeDiscount: Math.max(0, Math.min(1, Number(e.target.value))) })} className={inputCls} />
            </div>
            <div>
              <Label>Elite discount (0-1)</Label>
              <input type="number" min={0} max={1} step={0.01} value={form.eliteDiscount ?? 0.10} onChange={(e) => setForm({ ...form, eliteDiscount: Math.max(0, Math.min(1, Number(e.target.value))) })} className={inputCls} />
            </div>
          </div>

          <div>
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider border transition-colors ${
                    form.sizes?.includes(s) ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <Label>Details (Material)</Label>
            <input value={form.details?.material ?? ''} onChange={(e) => setForm({ ...form, details: { ...form.details, material: e.target.value } as Product['details'] })} className={inputCls} />
          </div>
          <div>
            <Label>Care Instructions</Label>
            <textarea value={form.details?.care ?? ''} onChange={(e) => setForm({ ...form, details: { ...form.details, care: e.target.value } as Product['details'] })} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black transition-colors">Cancel</button>
          {!product && (
            <button onClick={() => save(true)} className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black transition-colors">Save & Add Another</button>
          )}
          <button onClick={() => save(false)} className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-black text-white hover:bg-gray-900 transition-colors">Save Product</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none transition-colors bg-white';

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">{children}</label>
);
