export interface IndicatorSet {
  assetSymbol: string;
  timestamp: Date;
  resolution: string;
  sma20: number | null;
  ema20: number | null;
  rsi14: number | null;
  volatility30d: number | null;
  sharpe30d: number | null;
}
