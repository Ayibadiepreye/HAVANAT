import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client.js';
import { auditLog } from '../db/schema.js';
import type { JwtPayload } from '../lib/jwt.js';

type AuditAction = 'create' | 'update' | 'delete' | 'revert';
type EntityType =
  | 'product' | 'order' | 'return' | 'rider' | 'delivery'
  | 'membership' | 'homepage' | 'lookbook' | 'testimonial'
  | 'banner' | 'branding' | 'delivery_zone' | 'settings' | 'staff';

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

export async function logAction({
  req, user, action, entityType, entityId, entityLabel, summary, before, after,
}: LogParams): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: Number(user.sub),
      userName: user.email,
      userRole: user.role,
      action,
      entityType,
      entityId: String(entityId),
      entityLabel,
      summary,
      before: before ?? null,
      after: after ?? null,
    });
  } catch (err) {
    // Logging must never break the request.
    req.log?.error({ err }, 'audit log failed');
  }
}
