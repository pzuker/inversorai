import type { MarketDataPoint, IndicatorSet, MarketAnalysis, TrendDirection } from '../../domain/entities/index.js';

export class AnalyzeMarketTrends {
  execute(points: MarketDataPoint[], indicators: IndicatorSet): MarketAnalysis {
    const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sorted.length === 0) {
      throw new Error('Cannot analyze empty data');
    }

    const latest = sorted[sorted.length - 1]!;
    const currentPrice = latest.close;

    const { trend, signalStrength, signals } = this.determineTrend(currentPrice, indicators);
    const rationale = this.buildRationale(trend, signals, currentPrice, indicators);
    const kpis = this.buildKpis(currentPrice, indicators);

    return {
      assetSymbol: indicators.assetSymbol,
      asOf: latest.timestamp,
      resolution: indicators.resolution,
      trend,
      signalStrength,
      kpis,
      rationale,
    };
  }

  private determineTrend(
    currentPrice: number,
    indicators: IndicatorSet
  ): { trend: TrendDirection; signalStrength: number; signals: string[] } {
    const signals: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;

    const sma20 = indicators.sma20;
    const rsi14 = indicators.rsi14;

    if (sma20 !== null) {
      const priceVsSma = ((currentPrice - sma20) / sma20) * 100;

      if (priceVsSma > 5) {
        bullishScore += 30;
        signals.push('price significantly above SMA20');
      } else if (priceVsSma > 0) {
        bullishScore += 15;
        signals.push('price above SMA20');
      } else if (priceVsSma < -5) {
        bearishScore += 30;
        signals.push('price significantly below SMA20');
      } else if (priceVsSma < 0) {
        bearishScore += 15;
        signals.push('price below SMA20');
      }
    }

    if (rsi14 !== null) {
      if (rsi14 > 70) {
        bullishScore += 35;
        signals.push('RSI indicates overbought (strong momentum)');
      } else if (rsi14 > 60) {
        bullishScore += 25;
        signals.push('RSI indicates bullish momentum');
      } else if (rsi14 < 30) {
        bearishScore += 35;
        signals.push('RSI indicates oversold (strong downward momentum)');
      } else if (rsi14 < 40) {
        bearishScore += 25;
        signals.push('RSI indicates bearish momentum');
      }
    }

    let trend: TrendDirection;
    let signalStrength: number;

    if (bullishScore >= 40 && bullishScore > bearishScore + 10) {
      trend = 'BULLISH';
      signalStrength = Math.min(100, bullishScore + 20);
    } else if (bearishScore >= 40 && bearishScore > bullishScore + 10) {
      trend = 'BEARISH';
      signalStrength = Math.min(100, bearishScore + 20);
    } else {
      trend = 'NEUTRAL';
      signalStrength = Math.max(0, 50 - Math.abs(bullishScore - bearishScore));
    }

    return { trend, signalStrength, signals };
  }

  private buildRationale(
    trend: TrendDirection,
    signals: string[],
    currentPrice: number,
    indicators: IndicatorSet
  ): string {
    const parts: string[] = [];

    parts.push(`Market analysis indicates a ${trend.toLowerCase()} trend.`);

    if (signals.length > 0) {
      parts.push(`Key signals: ${signals.join('; ')}.`);
    }

    if (indicators.sma20 !== null) {
      const diff = ((currentPrice - indicators.sma20) / indicators.sma20 * 100).toFixed(1);
      parts.push(`Price is ${diff}% relative to SMA20.`);
    }

    if (indicators.rsi14 !== null) {
      parts.push(`RSI(14) at ${indicators.rsi14.toFixed(1)}.`);
    }

    return parts.join(' ');
  }

  private buildKpis(currentPrice: number, indicators: IndicatorSet): Record<string, number> {
    const kpis: Record<string, number> = {};

    if (indicators.rsi14 !== null) {
      kpis['rsi14'] = indicators.rsi14;
    }

    if (indicators.sma20 !== null) {
      kpis['priceVsSma'] = ((currentPrice - indicators.sma20) / indicators.sma20) * 100;
    }

    if (indicators.volatility30d !== null) {
      kpis['volatility30d'] = indicators.volatility30d;
    }

    if (indicators.sharpe30d !== null) {
      kpis['sharpe30d'] = indicators.sharpe30d;
    }

    return kpis;
  }
}
