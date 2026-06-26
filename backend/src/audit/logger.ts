import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client.js';
import { auditLog } from '../db/schema.js';
import type { JwtPayload } from '../lib/jwt.js';

export type AuditAction = string;
export type EntityType =
  | 'product' | 'order' | 'return' | 'rider' | 'delivery'
  | 'membership' | 'homepage' | 'lookbook' | 'testimonial'
  | 'banner' | 'branding' | 'delivery_zone' | 'settings' | 'staff'
  | 'event_discount' | 'tier_discount' | 'bespoke_request' | 'contact_message'
  | 'address' | 'auth' | 'password_reset' | 'email_verify' | 'payment' | 'user' | 'lockout';

interface LogParams {
  req: Request;
  user: JwtPayload;
  action: AuditAction;
  entityType: EntityType;
  entityId: string | number;
  entityLabel?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Convenience shape — call from route handlers using the user payload from req.user.
 * Use this when you don't have the Express req handy.
 */
export interface LogActionSimple {
  actorId: number;
  actorRole: string;
  action: AuditAction;
  targetType: EntityType;
  targetId: string | number;
  meta?: Record<string, unknown>;
}

export async function logAction(
  params: LogParams | (LogActionSimple & { req?: Request })
): Promise<void> {
  try {
    if ('req' in params && 'user' in params) {
      // Legacy shape (full Request + user payload)
      const { req, user, action, entityType, entityId, entityLabel, summary, before, after } = params;
      await db.insert(auditLog).values({
        userId: Number(user.sub),
        userName: user.email,
        userRole: user.role,
        action,
        entityType: entityType as string,
        entityId: String(entityId),
        entityLabel,
        summary,
        before: (before as any) ?? null,
        after: (after as any) ?? null,
      } as any);
    } else {
      // Simple shape (req.user available)
      const { req, actorId, actorRole, action, targetType, targetId, meta } = params as LogActionSimple & { req: Request };
      const user = (req?.user as JwtPayload | undefined);
      await db.insert(auditLog).values({
        userId: actorId || Number(user?.sub) || 0,
        userName: (user?.email as string | undefined) ?? 'system',
        userRole: actorRole,
        action,
        entityType: targetType as string,
        entityId: String(targetId),
        entityLabel: meta?.name as string | undefined,
        summary: meta?.summary as string || `${actorRole}.${action}`,
        after: meta ? JSON.stringify(meta) : null,
      } as any);
    }
  } catch (err) {
    // Logging must never break the request.
    console.error('audit log failed:', (err as Error).message);
  }
}

export function auditMiddleware() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Hook for future per-request audit enrichment.
    next();
  };
}
