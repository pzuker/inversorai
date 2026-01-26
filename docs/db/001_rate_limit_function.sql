-- Rate Limiting: Distributed counter using Postgres
-- This provides atomic rate limiting that works across multiple API instances.
--
-- Apply this migration via Supabase SQL Editor or CLI:
--   supabase db push (if using migrations)
--   or copy-paste into SQL Editor
--
-- Usage from application:
--   SELECT * FROM rate_limit_check_and_increment('pipeline:user123:BTC-USD', 60, 5);

-- Table to store rate limit buckets
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window_start
  ON rate_limit_buckets(window_start);

-- Atomic rate limit check and increment function
-- Returns: allowed (boolean), remaining (int), reset_at (timestamptz)
CREATE OR REPLACE FUNCTION rate_limit_check_and_increment(
  p_key TEXT,
  p_window_seconds INT,
  p_max INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INT,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now;
  v_reset_at TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
  v_count INT := 1;
  v_existing_window_start TIMESTAMPTZ;
  v_existing_count INT;
BEGIN
  -- Try to get existing entry
  SELECT rb.window_start, rb.count
  INTO v_existing_window_start, v_existing_count
  FROM rate_limit_buckets rb
  WHERE rb.key = p_key
  FOR UPDATE;

  IF FOUND THEN
    -- Check if window has expired
    IF v_now >= v_existing_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
      -- Window expired, reset
      UPDATE rate_limit_buckets
      SET window_start = v_now, count = 1
      WHERE key = p_key;

      v_window_start := v_now;
      v_count := 1;
    ELSE
      -- Window still active
      v_window_start := v_existing_window_start;
      v_count := v_existing_count + 1;

      UPDATE rate_limit_buckets
      SET count = v_count
      WHERE key = p_key;
    END IF;
  ELSE
    -- No existing entry, create new one
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (p_key, v_now, 1);

    v_window_start := v_now;
    v_count := 1;
  END IF;

  -- Calculate reset time
  v_reset_at := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;

  -- Return result
  RETURN QUERY SELECT
    v_count <= p_max AS allowed,
    GREATEST(0, p_max - v_count) AS remaining,
    v_reset_at AS reset_at;
END;
$$;

-- Optional: Cleanup function for expired entries (run periodically via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION rate_limit_cleanup(p_older_than_seconds INT DEFAULT 3600)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rate_limit_buckets
  WHERE window_start < NOW() - (p_older_than_seconds || ' seconds')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute permission to authenticated users (adjust as needed for your RLS setup)
-- GRANT EXECUTE ON FUNCTION rate_limit_check_and_increment TO authenticated;
-- GRANT EXECUTE ON FUNCTION rate_limit_cleanup TO service_role;
