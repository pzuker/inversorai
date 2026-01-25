import type { SupabaseClient } from '@supabase/supabase-js';
import type { InvestmentInsight } from '../../domain/entities/index.js';
import type { InvestmentInsightRepositoryPort } from '../../application/ports/index.js';

/*
SQL to create the table (run in Supabase SQL editor if not exists):

CREATE TABLE IF NOT EXISTS investment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_insights_asset_created
ON investment_insights (asset_symbol, created_at DESC);
*/

interface InvestmentInsightRow {
  id: string;
  asset_symbol: string;
  payload: {
    summary: string;
    reasoning: string;
    assumptions: string[];
    caveats: string[];
    modelName: string;
    modelVersion: string;
    promptVersion: string;
    outputSchemaVersion: string;
    inputSnapshotHash: string;
  };
  created_at: string;
}

export class SupabaseInvestmentInsightRepository implements InvestmentInsightRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(insight: InvestmentInsight): Promise<void> {
    const row = {
      asset_symbol: insight.assetSymbol,
      payload: {
        summary: insight.summary,
        reasoning: insight.reasoning,
        assumptions: insight.assumptions,
        caveats: insight.caveats,
        modelName: insight.modelName,
        modelVersion: insight.modelVersion,
        promptVersion: insight.promptVersion,
        outputSchemaVersion: insight.outputSchemaVersion,
        inputSnapshotHash: insight.inputSnapshotHash,
      },
      created_at: insight.createdAt.toISOString(),
    };

    const { error } = await this.supabase.from('investment_insights').insert(row);

    if (error) {
      throw new Error(`Failed to save investment insight: ${error.message}`);
    }
  }

  async findLatestByAsset(symbol: string): Promise<InvestmentInsight | null> {
    const { data, error } = await this.supabase
      .from('investment_insights')
      .select('*')
      .eq('asset_symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find investment insight: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const row = data as InvestmentInsightRow;
    return {
      assetSymbol: row.asset_symbol,
      summary: row.payload.summary,
      reasoning: row.payload.reasoning,
      assumptions: row.payload.assumptions,
      caveats: row.payload.caveats,
      modelName: row.payload.modelName,
      modelVersion: row.payload.modelVersion,
      promptVersion: row.payload.promptVersion,
      outputSchemaVersion: row.payload.outputSchemaVersion,
      inputSnapshotHash: row.payload.inputSnapshotHash,
      createdAt: new Date(row.created_at),
    };
  }
}
