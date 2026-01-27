-- InversorAI Core Schema
-- Core application tables required for the MVP.
--
-- Apply this migration via Supabase SQL Editor:
--   1. Open Supabase Dashboard > SQL Editor
--   2. Copy-paste this entire file
--   3. Execute
--   4. Verify tables exist in Database > Tables
--
-- Tables created:
--   - market_data: OHLCV price data from Yahoo Finance
--   - investment_insights: AI-generated analysis with traceability
--   - recommendations: BUY/HOLD/SELL recommendations
--
-- Code references:
--   - services/api/src/infrastructure/repositories/SupabaseMarketDataRepository.ts
--   - services/api/src/infrastructure/repositories/SupabaseInvestmentInsightRepository.ts
--   - services/api/src/infrastructure/repositories/SupabaseRecommendationRepository.ts

-- ============================================================================
-- 1. market_data - OHLCV price data
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_symbol, timestamp)
);

-- Index for queries by asset and date range
CREATE INDEX IF NOT EXISTS idx_market_data_asset_timestamp
  ON market_data(asset_symbol, timestamp DESC);

-- RLS: Users can read, only service_role can write
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read market data"
  ON market_data FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE market_data IS 'OHLCV price data ingested from Yahoo Finance';

-- ============================================================================
-- 2. investment_insights - AI-generated analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS investment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  summary TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  assumptions JSONB NOT NULL DEFAULT '[]',
  caveats JSONB NOT NULL DEFAULT '[]',
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  output_schema_version TEXT NOT NULL,
  input_snapshot_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries by asset
CREATE INDEX IF NOT EXISTS idx_investment_insights_asset_created
  ON investment_insights(asset_symbol, created_at DESC);

-- RLS: Users can read, only service_role can write
ALTER TABLE investment_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read insights"
  ON investment_insights FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE investment_insights IS 'AI-generated investment analysis with full traceability (model, prompt version, input hash)';

-- ============================================================================
-- 3. recommendations - BUY/HOLD/SELL recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'HOLD', 'SELL')),
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  horizon TEXT NOT NULL CHECK (horizon IN ('SHORT', 'MID', 'LONG')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries by asset
CREATE INDEX IF NOT EXISTS idx_recommendations_asset_created
  ON recommendations(asset_symbol, created_at DESC);

-- RLS: Users can read, only service_role can write
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE recommendations IS 'Investment recommendations (BUY/HOLD/SELL) with confidence and risk level';

-- ============================================================================
-- Verification query (run after applying)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('market_data', 'investment_insights', 'recommendations');
