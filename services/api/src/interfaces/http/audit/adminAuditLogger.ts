/**
 * Structured audit logging for admin user-management actions.
 * Follows the same pattern as PIPELINE_AUDIT for consistency.
 *
 * When AUDIT_LOG_PERSIST='true', logs are also persisted to Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAuditLogRepository } from '../../../infrastructure/audit/SupabaseAuditLogRepository.js';

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

// Singleton repository instance (lazy initialized)
let auditRepository: SupabaseAuditLogRepository | null = null;

/**
 * Set the Supabase client for audit log persistence.
 * Call this during app initialization if persistence is enabled.
 */
export function setAuditLogRepository(repo: SupabaseAuditLogRepository | null): void {
  auditRepository = repo;
}

/**
 * Initialize the audit log repository with a Supabase client.
 * Only initializes if AUDIT_LOG_PERSIST='true' and client is provided.
 */
export function initAuditLogPersistence(supabaseClient: SupabaseClient): void {
  if (process.env['AUDIT_LOG_PERSIST'] === 'true') {
    auditRepository = new SupabaseAuditLogRepository(supabaseClient);
  }
}

/**
 * Check if audit log persistence is enabled.
 */
export function isAuditLogPersistenceEnabled(): boolean {
  return process.env['AUDIT_LOG_PERSIST'] === 'true' && auditRepository !== null;
}

/**
 * Log an admin audit event as a single JSON line to stdout.
 * If persistence is enabled, also saves to Supabase (non-blocking).
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

  // Always log to stdout (existing behavior)
  console.log(JSON.stringify(auditLog));

  // If persistence is enabled, also save to database (fire-and-forget)
  if (auditRepository) {
    auditRepository.save(auditLog).catch((err) => {
      console.error('[AuditLog] Persistence error:', err);
    });
  }
}
