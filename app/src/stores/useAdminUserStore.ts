// Admin user store - manage all staff (admin / moderator / rider)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminAccount, UserRole } from '@/types/dashboard';
import { ADMIN_ACCOUNTS as SEED_ACCOUNTS } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';

interface AdminUserState {
  accounts: AdminAccount[];
  addAccount: (a: Omit<AdminAccount, 'id' | 'createdAt'>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  removeAccount: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  changeRole: (id: string, newRole: UserRole, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
}

export const useAdminUserStore = create<AdminUserState>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      addAccount: (a, actor) => {
        const id = `usr_${a.role}_${Date.now()}`;
        set({ accounts: [...get().accounts, { ...a, id, createdAt: new Date().toISOString() }] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'settings', entityId: id, entityLabel: `Staff: ${a.name}`,
          summary: `Created ${a.role} account`,
          changes: { before: null, after: { name: a.name, role: a.role, email: a.email } },
        });
      },
      removeAccount: (id, actor) => {
        const a = get().accounts.find((x) => x.id === id);
        if (!a) return;
        set({ accounts: get().accounts.filter((x) => x.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'settings', entityId: id, entityLabel: `Staff: ${a.name}`,
          summary: `Removed ${a.role} account`,
          changes: { before: { name: a.name, role: a.role }, after: null },
        });
      },
      changeRole: (id, newRole, actor) => {
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
      },
    }),
    { name: 'havanat-admin-users' }
  )
);
