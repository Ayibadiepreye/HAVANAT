import { useState, useMemo } from 'react';
import { useProductStore } from '@/stores/useProductStore';
import { useAdminProductStore } from '@/stores/useProductStoreAdmin';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { formatNaira } from '@/utils/formatters';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ProductFormModal from './ProductFormModal';

type CategoryFilter = 'all' | Product['category'];

export default function AdminProducts() {
  const products = useProductStore((s) => s.products);
  const removeProduct = useAdminProductStore((s) => s.removeProduct);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const PAGE_SIZE = 20;
  const categories: CategoryFilter[] = useMemo(() => {
    const set = new Set<Product['category']>();
    products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)] as CategoryFilter[];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (statusFilter === 'active' && !p.inStock) return false;
      if (statusFilter === 'draft' && p.inStock) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, category, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Product>[] = [
    {
      key: 'image',
      label: 'Image',
      width: '70px',
      render: (p) => <img src={p.images[0]} alt={p.name} className="h-12 w-12 object-cover bg-gray-100" />,
    },
    {
      key: 'name',
      label: 'Name',
      render: (p) => (
        <div>
          <p className="font-medium text-sm">{p.name}</p>
          <p className="text-xs text-gray-500">{p.slug}</p>
        </div>
      ),
    },
    { key: 'sku', label: 'SKU', render: (p) => <span className="text-xs text-gray-500">HVN-{String(p.id).padStart(4, '0')}</span> },
    { key: 'category', label: 'Category', render: (p) => p.category },
    { key: 'price', label: 'Price', render: (p) => formatNaira(p.price), align: 'right' },
    { key: 'sizes', label: 'Sizes', render: (p) => <span className="text-xs text-gray-600">{p.sizes.join(', ')}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge status={p.inStock ? 'active' : 'draft'} type="generic" />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '110px',
      render: (p) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing(p); setShowForm(true); }}
            className="p-1.5 hover:bg-gray-100 transition-colors"
            aria-label="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmRemove(p)}
            className="p-1.5 hover:bg-gray-100 transition-colors text-red-600"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Products</h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} products in catalog</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value as CategoryFilter); setPage(1); }}
          className="text-sm border border-gray-200 px-3 py-2.5 focus:border-black focus:outline-none bg-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'draft'); setPage(1); }}
          className="text-sm border border-gray-200 px-3 py-2.5 focus:border-black focus:outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                selectedIds.forEach((id) => {
                  const p = products.find((x) => String(x.id) === id);
                  if (p && dashboardUser) {
                    removeProduct(p.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
                  }
                });
                showToast(`Removed ${selectedIds.length} products`, 'success');
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-[10px] uppercase tracking-wider hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-white/40 text-[10px] uppercase tracking-wider hover:bg-white hover:text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <AdminTable<Product>
        columns={columns}
        rows={paged}
        keyFn={(p) => String(p.id)}
        selectable
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        emptyMessage="No products match your filters"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 text-xs uppercase tracking-wider ${
                page === i + 1 ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
        title="Delete this product?"
        description={confirmRemove ? `${confirmRemove.name} will be removed from the catalog. This action is logged.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmRemove && dashboardUser) {
            removeProduct(confirmRemove.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast('Product removed', 'success');
          }
        }}
      />

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
