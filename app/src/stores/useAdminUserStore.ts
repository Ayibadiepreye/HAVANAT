// Admin user store - manage all staff (admin / moderator / rider)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminAccount, UserRole } from '@/types/dashboard';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminUserState {
  accounts: AdminAccount[];
  fetchUsers: () => Promise<void>;
  addAccount: (a: Omit<AdminAccount, 'id' | 'createdAt'>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  removeAccount: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  changeRole: (id: string, newRole: UserRole, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
}

export const useAdminUserStore = create<AdminUserState>()(
  persist(
    (set, get) => ({
      accounts: [],
      fetchUsers: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/staff', true);
          set({ accounts: res.items.map((u) => ({
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
            tier: u.tier,
            phone: u.phone,
            avatar: u.avatar,
            createdAt: u.createdAt,
          })) });
        } catch (err) {
          console.error('fetchUsers failed', err);
        }
      },
      addAccount: async (a, actor) => {
        const tempId = `usr_${a.role}_${Date.now()}`;
        const newAccount = { ...a, id: tempId, createdAt: new Date().toISOString() };
        set({ accounts: [...get().accounts, newAccount] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'settings', entityId: tempId, entityLabel: `Staff: ${a.name}`,
          summary: `Created ${a.role} account`,
          changes: { before: null, after: { name: a.name, role: a.role, email: a.email } },
        });
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            const created = await apiPost<{ id: number }>('/api/staff', { name: a.name, email: a.email, role: a.role }, true);
            set({ accounts: get().accounts.map((acc) => (acc.id === tempId ? { ...acc, id: String(created.id) } : acc)) });
            await get().fetchUsers();
          } catch (err) {
            console.error('addAccount failed:', err);
            set({ accounts: get().accounts.filter((acc) => acc.id !== tempId) });
            throw err;
          }
        }
      },
      removeAccount: async (id, actor) => {
        const a = get().accounts.find((x) => x.id === id);
        if (!a) return;
        const before = get().accounts;
        set({ accounts: get().accounts.filter((x) => x.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'settings', entityId: id, entityLabel: `Staff: ${a.name}`,
          summary: `Removed ${a.role} account`,
          changes: { before: { name: a.name, role: a.role }, after: null },
        });
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            await apiDelete(`/api/staff/${id}`, true);
            await get().fetchUsers();
          } catch (err) {
            console.error('removeAccount failed:', err);
            set({ accounts: before });
            throw err;
          }
        }
      },
      changeRole: async (id, newRole, actor) => {
        const a = get().accounts.find((x) => x.id === id);
        if (!a) return;
        if (a.role === newRole) return;
        const before = { role: a.role };
        set({ accounts: get().accounts.map((x) => (x.id === id ? { ...x, role: newRole as AdminAccount['role'] } : x)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'settings', entityId: id, entityLabel: `Staff: ${a.name}`,
          summary: `Changed role from ${a.role} to ${newRole}`,
          changes: { before, after: { role: newRole } },
        });
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            await apiPatch(`/api/staff/${id}/role`, { role: newRole }, true);
            await get().fetchUsers();
          } catch (err) {
            console.error('changeRole failed:', err);
            set({ accounts: get().accounts.map((x) => (x.id === id ? { ...x, role: before.role } : x)) });
            throw err;
          }
        }
      },
    }),
    { name: 'havanat-admin-users' }
  )
);
