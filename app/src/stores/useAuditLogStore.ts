// Audit log store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditLogEntry } from '@/types/dashboard';
import { AUDIT_LOG as SEED_LOG } from '@/data/dashboardMockData';

interface AuditLogState {
  logs: AuditLogEntry[];
  addLog: (entry: AuditLogEntry) => void;
  revertLog: (logId: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  clear: () => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: SEED_LOG,
      addLog: (entry) => set({ logs: [entry, ...get().logs] }),
      revertLog: (logId, actor) => {
        const target = get().logs.find((l) => l.id === logId);
        if (!target) return;
        const revertEntry: AuditLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role,
          action: 'revert',
          entityType: target.entityType,
          entityId: target.entityId,
          entityLabel: target.entityLabel,
          summary: `Reverted: ${target.summary}`,
          changes: { before: target.changes.after, after: target.changes.before },
        };
        set({ logs: [revertEntry, ...get().logs] });
      },
      clear: () => set({ logs: [] }),
    }),
    { name: 'havanat-audit-log' }
  )
);
