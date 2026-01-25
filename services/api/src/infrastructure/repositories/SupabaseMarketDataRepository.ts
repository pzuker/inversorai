import type { SupabaseClient } from '@supabase/supabase-js';
import type { MarketDataPoint } from '../../domain/entities/index.js';
import type { MarketDataRepositoryPort } from '../../application/ports/index.js';

interface MarketDataRow {
  asset_symbol: string;
  timestamp: string;
  resolution: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class SupabaseMarketDataRepository implements MarketDataRepositoryPort {
  private readonly resolution = '1d';

  constructor(private readonly supabase: SupabaseClient) {}

  async save(points: MarketDataPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    const rows: MarketDataRow[] = points.map((point) => ({
      asset_symbol: point.assetSymbol,
      timestamp: point.timestamp.toISOString(),
      resolution: this.resolution,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
    }));

    const { error } = await this.supabase
      .from('market_data')
      .upsert(rows, {
        onConflict: 'asset_symbol,timestamp,resolution',
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(`Failed to save market data: ${error.message}`);
    }
  }

  async findBySymbol(assetSymbol: string): Promise<MarketDataPoint[]> {
    const { data, error } = await this.supabase
      .from('market_data')
      .select('*')
      .eq('asset_symbol', assetSymbol)
      .eq('resolution', this.resolution)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to find market data: ${error.message}`);
    }

    return (data ?? []).map((row: MarketDataRow) => ({
      assetSymbol: row.asset_symbol,
      timestamp: new Date(row.timestamp),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
  }
}
