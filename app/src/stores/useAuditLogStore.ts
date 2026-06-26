// Audit log store
import { create } from 'zustand';
import { apiConfig, apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { persist } from 'zustand/middleware';
import type { AuditLogEntry } from '@/types/dashboard';

interface AuditLogState {
  fetchAuditLogs: () => Promise<void>;
  logs: AuditLogEntry[];
  addLog: (entry: AuditLogEntry) => void;
  revertLog: (logId: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  clear: () => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      fetchAuditLogs: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/audit', true);
          set({ logs: res.items.map((l) => ({
            id: String(l.id),
            userId: String(l.userId ?? ''),
            userName: l.userName ?? 'system',
            userRole: l.userRole ?? 'system',
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            entityLabel: l.entityLabel ?? l.summary ?? '',
            summary: l.summary ?? '',
            changes: l.changes ?? {},
            meta: l.meta,
            timestamp: l.createdAt ?? l.timestamp,
          })) });
        } catch (err) {
          console.error('fetchAuditLogs failed', err);
        }
      },
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
