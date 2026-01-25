import type { MarketDataPoint, IndicatorSet } from '../../domain/entities/index.js';

export class ComputeIndicators {
  execute(points: MarketDataPoint[], resolution: string): IndicatorSet {
    const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sorted.length === 0) {
      throw new Error('Cannot compute indicators with empty data');
    }

    const closes = sorted.map((p) => p.close);
    const latest = sorted[sorted.length - 1]!;

    return {
      assetSymbol: latest.assetSymbol,
      timestamp: latest.timestamp,
      resolution,
      sma20: this.calculateSMA(closes, 20),
      ema20: this.calculateEMA(closes, 20),
      rsi14: this.calculateRSI(closes, 14),
      volatility30d: this.calculateVolatility(closes, 30),
      sharpe30d: this.calculateSharpe(closes, 30),
    };
  }

  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period)!;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i]! - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateRSI(prices: number[], period: number): number | null {
    if (prices.length < period + 1) return null;

    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i]! - prices[i - 1]!);
    }

    const gains: number[] = [];
    const losses: number[] = [];

    for (const change of changes) {
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]!) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;
    }

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateVolatility(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const returns: number[] = [];
    const slice = prices.slice(-period);

    for (let i = 1; i < slice.length; i++) {
      returns.push(Math.log(slice[i]! / slice[i - 1]!));
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private calculateSharpe(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const returns: number[] = [];
    const slice = prices.slice(-period);

    for (let i = 1; i < slice.length; i++) {
      returns.push(Math.log(slice[i]! / slice[i - 1]!));
    }

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const annualizedReturn = meanReturn * 252;
    const annualizedStdDev = stdDev * Math.sqrt(252);
    const riskFreeRate = 0.02;

    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
  }
}
