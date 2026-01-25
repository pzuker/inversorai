export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface MarketAnalysis {
  assetSymbol: string;
  asOf: Date;
  resolution: string;
  trend: TrendDirection;
  signalStrength: number;
  kpis: Record<string, number>;
  rationale: string;
}
