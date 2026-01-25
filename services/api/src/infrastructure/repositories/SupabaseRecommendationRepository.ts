import type { SupabaseClient } from '@supabase/supabase-js';
import type { Recommendation, RecommendationAction, RecommendationHorizon, RiskLevel } from '../../domain/entities/index.js';
import type { RecommendationRepositoryPort } from '../../application/ports/index.js';

/*
SQL to create the table (run in Supabase SQL editor if not exists):

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_asset_created
ON recommendations (asset_symbol, created_at DESC);
*/

interface RecommendationRow {
  id: string;
  asset_symbol: string;
  payload: {
    action: RecommendationAction;
    confidenceScore: number;
    horizon: RecommendationHorizon;
    riskLevel: RiskLevel;
  };
  created_at: string;
}

export class SupabaseRecommendationRepository implements RecommendationRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(recommendation: Recommendation): Promise<void> {
    const row = {
      asset_symbol: recommendation.assetSymbol,
      payload: {
        action: recommendation.action,
        confidenceScore: recommendation.confidenceScore,
        horizon: recommendation.horizon,
        riskLevel: recommendation.riskLevel,
      },
      created_at: recommendation.createdAt.toISOString(),
    };

    const { error } = await this.supabase.from('recommendations').insert(row);

    if (error) {
      throw new Error(`Failed to save recommendation: ${error.message}`);
    }
  }

  async findLatestByAsset(symbol: string): Promise<Recommendation | null> {
    const { data, error } = await this.supabase
      .from('recommendations')
      .select('*')
      .eq('asset_symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find recommendation: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const row = data as RecommendationRow;
    return {
      assetSymbol: row.asset_symbol,
      action: row.payload.action,
      confidenceScore: row.payload.confidenceScore,
      horizon: row.payload.horizon,
      riskLevel: row.payload.riskLevel,
      createdAt: new Date(row.created_at),
    };
  }
}
