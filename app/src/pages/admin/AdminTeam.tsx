import { useState } from 'react';
import { useAdminUserStore } from '@/stores/useAdminUserStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import RoleBadge from '@/components/admin/RoleBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, X, Shield, Edit, Trash2, UserCog } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { AdminAccount, UserRole } from '@/types/dashboard';

export default function AdminTeam() {
  const accounts = useAdminUserStore((s) => s.accounts);
  const addAccount = useAdminUserStore((s) => s.addAccount);
  const removeAccount = useAdminUserStore((s) => s.removeAccount);
  const changeRole = useAdminUserStore((s) => s.changeRole);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [removing, setRemoving] = useState<AdminAccount | null>(null);

  const adminCount = accounts.filter((a) => a.role === 'admin').length;
  const modCount = accounts.filter((a) => a.role === 'moderator').length;
  const riderCount = accounts.filter((a) => (a.role as string) === 'rider').length;

  const columns: Column<AdminAccount>[] = [
    { key: 'name', label: 'Name', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'email', label: 'Email', render: (a) => <span className="text-xs">{a.email}</span> },
    {
      key: 'role',
      label: 'Role',
      render: (a) => (
        <div className="flex items-center gap-2">
          <RoleBadge role={a.role} />
          <select
            value={a.role}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (!dashboardUser) return;
              changeRole(a.id, e.target.value as UserRole, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast(`${a.name} → ${e.target.value}`, 'success');
            }}
            className="text-[10px] uppercase tracking-wider border border-gray-200 px-2 py-1 focus:border-black focus:outline-none bg-white"
          >
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="rider">Rider</option>
          </select>
        </div>
      ),
    },
    { key: 'created', label: 'Created', render: (a) => <span className="text-xs">{formatDate(a.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '100px',
      render: (a) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing(a); setShowForm(true); }}
            className="p-1.5 hover:bg-gray-100 transition-colors"
            aria-label="Edit"
          ><Edit className="h-4 w-4" /></button>
          <button
            onClick={() => setRemoving(a)}
            className="p-1.5 hover:bg-gray-100 text-red-600 transition-colors"
            aria-label="Remove"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Team & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage admins, moderators, and riders. Change roles in one click.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 font-semibold"><Shield className="h-3.5 w-3.5" /> Admins</div>
          <p className="font-serif text-3xl mt-2">{adminCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 font-semibold"><Edit className="h-3.5 w-3.5" /> Moderators</div>
          <p className="font-serif text-3xl mt-2">{modCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 font-semibold"><UserCog className="h-3.5 w-3.5" /> Riders</div>
          <p className="font-serif text-3xl mt-2">{riderCount}</p>
        </div>
      </div>

      <AdminTable<AdminAccount>
        columns={columns}
        rows={accounts}
        keyFn={(a) => a.id}
        emptyMessage="No staff accounts"
      />

      {showForm && (
        <StaffFormModal
          account={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(data) => {
            if (!dashboardUser) return;
            if (editing) {
              changeRole(editing.id, data.role, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              addAccount(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast(`${data.name} updated`, 'success');
            } else {
              addAccount(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast(`${data.name} added as ${data.role}`, 'success');
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remove this staff member?"
        description={removing ? `${removing.name} (${removing.role}) will lose access immediately.` : ''}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (!dashboardUser || !removing) return;
          if (removing.id === dashboardUser.id) {
            showToast("You can't remove yourself", 'error');
            return;
          }
          if (removing.role === 'admin' && adminCount <= 1) {
            showToast('At least one admin must remain', 'error');
            return;
          }
          removeAccount(removing.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
          showToast(`${removing.name} removed`, 'success');
        }}
      />
    </div>
  );
}

function StaffFormModal({ account, onClose, onSubmit }: { account: AdminAccount | null; onClose: () => void; onSubmit: (data: Omit<AdminAccount, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({
    name: account?.name ?? '',
    email: account?.email ?? '',
    role: account?.role ?? 'moderator' as AdminAccount['role'],
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">{account ? 'Edit Staff' : 'Add Staff'}</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminAccount['role'] })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
              <option value="admin">Admin — full access + audit log</option>
              <option value="moderator">Moderator — content write, products/orders read-only</option>
              <option value="rider">Rider — deliveries, pickups, earnings</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            New staff use password <code className="bg-gray-100 px-1.5 py-0.5">password</code> to sign in.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.name || !form.email}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >Save</button>
        </div>
      </div>
    </div>
  );
}
