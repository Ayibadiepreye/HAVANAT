// Returns store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReturnRequest, ReturnStatus } from '@/types/dashboard';
import { RETURNS as SEED_RETURNS } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';

interface ReturnState {
  returns: ReturnRequest[];
  approve: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  reject: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }, reason: string) => void;
  assignRider: (id: string, riderId: string, riderName: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  processRefund: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  setStatus: (id: string, status: ReturnStatus, note?: string) => void;
  getById: (id: string) => ReturnRequest | undefined;
}

export const useReturnStore = create<ReturnState>()(
  persist(
    (set, get) => ({
      returns: SEED_RETURNS,
      approve: (id, actor) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status };
        set({ returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: 'Approved return request',
          changes: { before, after: { status: 'approved' } },
        });
      },
      reject: (id, actor, reason) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status, adminNote: ret.adminNote };
        set({
          returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'rejected', adminNote: reason } : r)),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: `Rejected return: ${reason}`,
          changes: { before, after: { status: 'rejected', adminNote: reason } },
        });
      },
      assignRider: (id, riderId, riderName, actor) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { riderId: ret.riderId ?? null, status: ret.status };
        set({
          returns: get().returns.map((r) =>
            r.id === id ? { ...r, riderId, status: 'rider_scheduled' } : r
          ),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'assign', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: `Assigned rider ${riderName} for pickup`,
          changes: { before, after: { riderId, status: 'rider_scheduled' } },
        });
      },
      processRefund: (id, actor) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status };
        set({
          returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'completed', adminNote: 'Refund issued' } : r)),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: 'Processed refund and marked complete',
          changes: { before, after: { status: 'completed' } },
        });
      },
      setStatus: (id, status, note) => {
        set({ returns: get().returns.map((r) => (r.id === id ? { ...r, status, ...(note ? { adminNote: note } : {}) } : r)) });
      },
      getById: (id) => get().returns.find((r) => r.id === id),
    }),
    { name: 'havanat-returns' }
  )
);
