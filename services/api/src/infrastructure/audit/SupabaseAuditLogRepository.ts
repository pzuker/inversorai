import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminAuditEvent } from '../../interfaces/http/audit/adminAuditLogger.js';

export interface AuditLogRecord {
  timestamp: string;
  action: string;
  result: 'success' | 'error';
  actor_id: string;
  actor_email?: string;
  actor_role?: string;
  target_id?: string;
  target_email?: string;
  request_id?: string;
  client_ip?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export class SupabaseAuditLogRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(event: AdminAuditEvent): Promise<void> {
    const record: AuditLogRecord = {
      timestamp: event.timestamp,
      action: event.action,
      result: event.result,
      actor_id: event.actor.id,
      actor_email: event.actor.email,
      actor_role: event.actor.role,
      target_id: event.target.id,
      target_email: event.target.email,
      request_id: event.requestId,
      client_ip: event.clientIp,
      user_agent: event.userAgent,
      error_message: event.error,
      metadata: event.metadata,
    };

    const { error } = await this.supabase.from('audit_logs').insert(record);

    if (error) {
      // Log error but don't throw - audit persistence failure shouldn't break the request
      console.error('[AuditLog] Failed to persist audit log:', error.message);
    }
  }
}
