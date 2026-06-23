// Audit logger - records every state-mutating action to the audit log

import { useAuditLogStore } from '@/stores/useAuditLogStore';
import type { AuditAction, AuditEntityType, UserRole } from '@/types/dashboard';

export interface LogAuditInput {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  summary: string;
  changes: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  };
}

export function logAuditAction(input: LogAuditInput): void {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...input,
  };
  useAuditLogStore.getState().addLog(entry);
}
