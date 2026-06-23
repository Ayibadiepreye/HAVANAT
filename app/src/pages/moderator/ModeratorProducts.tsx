import { useState, useMemo } from 'react';
import { useProductStore } from '@/stores/useProductStore';
import { useAdminProductStore } from '@/stores/useProductStoreAdmin';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { formatNaira } from '@/utils/formatters';
import ProductFormModal from '@/pages/admin/ProductFormModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { Product } from '@/types';

export default function ModeratorProducts() {
  const products = useProductStore((s) => s.products);
  const { removeProduct, toggleStatus: changeProductStatus } = useAdminProductStore();
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [removing, setRemoving] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | Product['category']>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'draft'>('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !String(p.id).includes(search)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (status !== 'all') {
        const isActive = p.inStock !== false;
        if (status === 'active' && !isActive) return false;
        if (status === 'draft' && isActive) return false;
      }
      return true;
    });
  }, [products, search, category, status]);

  const columns: Column<Product>[] = [
    { key: 'image', label: 'Image', width: '70px', render: (p) => <img src={p.images[0]} alt="" className="h-12 w-12 object-cover bg-gray-100" /> },
    { key: 'name', label: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'category', label: 'Category', render: (p) => <span className="text-xs uppercase tracking-wider">{p.category}</span> },
    { key: 'price', label: 'Price', align: 'right', render: (p) => formatNaira(p.price) },
    {
      key: 'status', label: 'Status', render: (p) => (
        <select
          value={p.inStock === false ? 'draft' : 'active'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (!dashboardUser) return;
            const next = e.target.value as 'active' | 'draft';
            changeProductStatus(p.id, next === 'active', { id: dashboardUser.id, name: dashboardUser.name, role: 'moderator' });
            showToast(`${p.name} → ${next}`, 'success');
          }}
          className="text-[10px] uppercase tracking-wider border border-gray-200 px-2 py-1 focus:border-black focus:outline-none bg-white"
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      )
    },
    {
      key: 'actions', label: '', align: 'right', width: '110px',
      render: (p) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 transition-colors" aria-label="Edit">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => setRemoving(p)} className="p-1.5 hover:bg-gray-100 text-red-600 transition-colors" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-light">Products</h2>
          <p className="text-sm text-gray-500 mt-1">You have full edit & delete access. Every change is audit-logged.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:border-black focus:outline-none"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as 'all' | Product['category'])} className="text-xs px-3 py-2 border border-gray-200 focus:border-black focus:outline-none bg-white">
          <option value="all">All Categories</option>
          <option value="suits">Suits</option>
          <option value="shirts">Shirts</option>
          <option value="trousers">Trousers</option>
          <option value="outerwear">Outerwear</option>
          <option value="accessories">Accessories</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'draft')} className="text-xs px-3 py-2 border border-gray-200 focus:border-black focus:outline-none bg-white">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <AdminTable<Product> columns={columns} rows={filtered} keyFn={(p) => String(p.id)} emptyMessage="No products match" />

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Delete this product?"
        description={removing ? `${removing.name} will be removed from the catalog.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!dashboardUser || !removing) return;
          removeProduct(removing.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'moderator' });
          showToast(`${removing.name} removed`, 'success');
        }}
      />
    </div>
  );
}
