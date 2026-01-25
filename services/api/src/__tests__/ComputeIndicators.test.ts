import { describe, it, expect } from 'vitest';
import { ComputeIndicators } from '../application/use-cases/index.js';
import type { MarketDataPoint } from '../domain/entities/index.js';

function createTestPoints(count: number, basePrice = 100, priceIncrement = 0): MarketDataPoint[] {
  const points: MarketDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const price = basePrice + i * priceIncrement;
    points.push({
      assetSymbol: 'TEST',
      timestamp: new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
      open: price,
      high: price + 5,
      low: price - 5,
      close: price,
      volume: 1000000,
    });
  }
  return points;
}

describe('ComputeIndicators', () => {
  const useCase = new ComputeIndicators();

  describe('SMA(20)', () => {
    it('calculates SMA(20) correctly with exactly 20 points', () => {
      const points = createTestPoints(20, 100, 1);
      const result = useCase.execute(points, '1d');

      // SMA of 100,101,102...119 = (100+119)*20/2 / 20 = 109.5
      expect(result.sma20).toBeCloseTo(109.5, 2);
    });

    it('returns null for SMA(20) with less than 20 points', () => {
      const points = createTestPoints(19);
      const result = useCase.execute(points, '1d');

      expect(result.sma20).toBeNull();
    });
  });

  describe('EMA(20)', () => {
    it('calculates EMA(20) with seed as initial SMA', () => {
      const points = createTestPoints(25, 100, 1);
      const result = useCase.execute(points, '1d');

      expect(result.ema20).not.toBeNull();
      expect(result.ema20).toBeGreaterThan(100);
    });

    it('returns null for EMA(20) with less than 20 points', () => {
      const points = createTestPoints(19);
      const result = useCase.execute(points, '1d');

      expect(result.ema20).toBeNull();
    });
  });

  describe('RSI(14)', () => {
    it('calculates high RSI for consistently rising prices', () => {
      const points = createTestPoints(30, 100, 2);
      const result = useCase.execute(points, '1d');

      expect(result.rsi14).not.toBeNull();
      expect(result.rsi14!).toBeGreaterThan(70);
    });

    it('calculates low RSI for consistently falling prices', () => {
      const points = createTestPoints(30, 200, -2);
      const result = useCase.execute(points, '1d');

      expect(result.rsi14).not.toBeNull();
      expect(result.rsi14!).toBeLessThan(30);
    });

    it('returns null for RSI(14) with less than 15 points', () => {
      const points = createTestPoints(14);
      const result = useCase.execute(points, '1d');

      expect(result.rsi14).toBeNull();
    });
  });

  describe('Volatility and Sharpe', () => {
    it('calculates volatility deterministically', () => {
      const points = createTestPoints(35, 100, 1);
      const result1 = useCase.execute(points, '1d');
      const result2 = useCase.execute(points, '1d');

      expect(result1.volatility30d).not.toBeNull();
      expect(result1.volatility30d).toBe(result2.volatility30d);
    });

    it('calculates sharpe deterministically', () => {
      const points = createTestPoints(35, 100, 1);
      const result1 = useCase.execute(points, '1d');
      const result2 = useCase.execute(points, '1d');

      expect(result1.sharpe30d).not.toBeNull();
      expect(result1.sharpe30d).toBe(result2.sharpe30d);
    });

    it('returns null for volatility/sharpe with less than 30 points', () => {
      const points = createTestPoints(29);
      const result = useCase.execute(points, '1d');

      expect(result.volatility30d).toBeNull();
      expect(result.sharpe30d).toBeNull();
    });
  });

  describe('Output structure', () => {
    it('returns correct assetSymbol and resolution', () => {
      const points = createTestPoints(30);
      const result = useCase.execute(points, '1d');

      expect(result.assetSymbol).toBe('TEST');
      expect(result.resolution).toBe('1d');
    });

    it('uses latest timestamp from data', () => {
      const points = createTestPoints(30);
      const result = useCase.execute(points, '1d');

      expect(result.timestamp.toISOString()).toBe('2025-01-30T00:00:00.000Z');
    });
  });
});
