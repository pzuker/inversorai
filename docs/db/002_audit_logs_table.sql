-- Audit Logs: Persistent storage for admin audit events
-- This provides a queryable audit trail for compliance and forensics.
--
-- Apply this migration via Supabase SQL Editor or CLI:
--   supabase db push (if using migrations)
--   or copy-paste into SQL Editor

-- Table to store audit log entries
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'error')),
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  actor_role TEXT,
  target_id TEXT,
  target_email TEXT,
  request_id TEXT,
  client_ip TEXT,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB
);

-- Index for timestamp-based queries (most common for auditing)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs(timestamp DESC);

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

-- Index for filtering by actor (who did what)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON audit_logs(actor_id);

-- Index for filtering by target (what was affected)
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id
  ON audit_logs(target_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp
  ON audit_logs(actor_id, timestamp DESC);

-- Comment on table for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for admin actions (user management, sensitive operations)';
COMMENT ON COLUMN audit_logs.action IS 'Action type: USER_ROLE_CHANGED, PASSWORD_RESET_TRIGGERED, etc.';
COMMENT ON COLUMN audit_logs.result IS 'Outcome: success or error';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context (e.g., old_role, new_role for role changes)';
