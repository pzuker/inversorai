/**
 * Structured audit logging for admin user-management actions.
 * Follows the same pattern as PIPELINE_AUDIT for consistency.
 */

export type AdminAuditAction = 'USER_ROLE_CHANGED' | 'PASSWORD_RESET_TRIGGERED';

export interface AdminAuditActor {
  id: string;
  email?: string;
  role?: string;
}

export interface AdminAuditTarget {
  id: string;
  email?: string;
}

export interface AdminAuditEvent {
  type: 'ADMIN_AUDIT';
  requestId: string;
  timestamp: string;
  action: AdminAuditAction;
  result: 'success' | 'error';
  actor: AdminAuditActor;
  target: AdminAuditTarget;
  clientIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Log an admin audit event as a single JSON line to stdout.
 * This provides a structured audit trail for forensic analysis.
 */
export function logAdminAudit(event: AdminAuditEvent): void {
  // Ensure we only log the fields we explicitly define
  const auditLog: AdminAuditEvent = {
    type: event.type,
    requestId: event.requestId,
    timestamp: event.timestamp,
    action: event.action,
    result: event.result,
    actor: {
      id: event.actor.id,
      ...(event.actor.email && { email: event.actor.email }),
      ...(event.actor.role && { role: event.actor.role }),
    },
    target: {
      id: event.target.id,
      ...(event.target.email && { email: event.target.email }),
    },
    ...(event.clientIp && { clientIp: event.clientIp }),
    ...(event.userAgent && { userAgent: event.userAgent }),
    ...(event.metadata && { metadata: event.metadata }),
    ...(event.error && { error: event.error }),
  };

  console.log(JSON.stringify(auditLog));
}
