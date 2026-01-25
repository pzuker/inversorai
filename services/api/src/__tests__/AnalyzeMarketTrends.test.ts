import { describe, it, expect } from 'vitest';
import { AnalyzeMarketTrends } from '../application/use-cases/index.js';
import type { MarketDataPoint, IndicatorSet } from '../domain/entities/index.js';

function createTestPoints(count: number, closePrice: number): MarketDataPoint[] {
  const points: MarketDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      assetSymbol: 'TEST',
      timestamp: new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
      open: closePrice,
      high: closePrice + 5,
      low: closePrice - 5,
      close: closePrice,
      volume: 1000000,
    });
  }
  return points;
}

function createIndicatorSet(overrides: Partial<IndicatorSet> = {}): IndicatorSet {
  return {
    assetSymbol: 'TEST',
    timestamp: new Date('2025-01-30T00:00:00.000Z'),
    resolution: '1d',
    sma20: 100,
    ema20: 100,
    rsi14: 50,
    volatility30d: 0.2,
    sharpe30d: 1.0,
    ...overrides,
  };
}

describe('AnalyzeMarketTrends', () => {
  const useCase = new AnalyzeMarketTrends();

  describe('BULLISH trend', () => {
    it('returns BULLISH when close > sma20 and rsi14 > 60', () => {
      const points = createTestPoints(30, 120);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 70 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('BULLISH');
    });

    it('has high signalStrength when strongly bullish', () => {
      const points = createTestPoints(30, 150);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 80 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('BULLISH');
      expect(result.signalStrength).toBeGreaterThan(60);
    });
  });

  describe('BEARISH trend', () => {
    it('returns BEARISH when close < sma20 and rsi14 < 40', () => {
      const points = createTestPoints(30, 80);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 30 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('BEARISH');
    });

    it('has high signalStrength when strongly bearish', () => {
      const points = createTestPoints(30, 50);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 20 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('BEARISH');
      expect(result.signalStrength).toBeGreaterThan(60);
    });
  });

  describe('NEUTRAL trend', () => {
    it('returns NEUTRAL when close near sma20 and rsi14 near 50', () => {
      const points = createTestPoints(30, 100);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 50 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('NEUTRAL');
    });

    it('returns NEUTRAL when signals are mixed', () => {
      const points = createTestPoints(30, 120);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 35 });

      const result = useCase.execute(points, indicators);

      expect(result.trend).toBe('NEUTRAL');
    });
  });

  describe('signalStrength', () => {
    it('is between 0 and 100', () => {
      const points = createTestPoints(30, 100);
      const indicators = createIndicatorSet();

      const result = useCase.execute(points, indicators);

      expect(result.signalStrength).toBeGreaterThanOrEqual(0);
      expect(result.signalStrength).toBeLessThanOrEqual(100);
    });
  });

  describe('rationale', () => {
    it('is not empty', () => {
      const points = createTestPoints(30, 100);
      const indicators = createIndicatorSet();

      const result = useCase.execute(points, indicators);

      expect(result.rationale).not.toBe('');
      expect(result.rationale.length).toBeGreaterThan(10);
    });

    it('mentions trend direction', () => {
      const points = createTestPoints(30, 120);
      const indicators = createIndicatorSet({ sma20: 100, rsi14: 70 });

      const result = useCase.execute(points, indicators);

      expect(result.rationale.toLowerCase()).toContain('bullish');
    });
  });

  describe('output structure', () => {
    it('includes correct assetSymbol and resolution', () => {
      const points = createTestPoints(30, 100);
      const indicators = createIndicatorSet();

      const result = useCase.execute(points, indicators);

      expect(result.assetSymbol).toBe('TEST');
      expect(result.resolution).toBe('1d');
    });

    it('includes kpis with relevant metrics', () => {
      const points = createTestPoints(30, 100);
      const indicators = createIndicatorSet();

      const result = useCase.execute(points, indicators);

      expect(result.kpis).toHaveProperty('rsi14');
      expect(result.kpis).toHaveProperty('priceVsSma');
    });
  });
});
