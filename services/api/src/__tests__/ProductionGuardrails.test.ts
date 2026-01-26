import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FakeMarketDataProvider } from '../infrastructure/providers/index.js';
import { createMarketDataProvider } from '../infrastructure/market-data/createMarketDataProvider.js';

describe('Production Guardrails', () => {
  let originalNodeEnv: string | undefined;
  let originalMarketDataProvider: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env['NODE_ENV'];
    originalMarketDataProvider = process.env['MARKET_DATA_PROVIDER'];
  });

  afterEach(() => {
    // Restore original env vars
    if (originalNodeEnv !== undefined) {
      process.env['NODE_ENV'] = originalNodeEnv;
    } else {
      delete process.env['NODE_ENV'];
    }

    if (originalMarketDataProvider !== undefined) {
      process.env['MARKET_DATA_PROVIDER'] = originalMarketDataProvider;
    } else {
      delete process.env['MARKET_DATA_PROVIDER'];
    }
  });

  describe('FakeMarketDataProvider', () => {
    it('throws when NODE_ENV is production', () => {
      process.env['NODE_ENV'] = 'production';

      expect(() => new FakeMarketDataProvider()).toThrow(
        'FakeMarketDataProvider cannot be used in production'
      );
    });

    it('does not throw when NODE_ENV is development', () => {
      process.env['NODE_ENV'] = 'development';

      expect(() => new FakeMarketDataProvider()).not.toThrow();
    });

    it('does not throw when NODE_ENV is not set', () => {
      delete process.env['NODE_ENV'];

      expect(() => new FakeMarketDataProvider()).not.toThrow();
    });

    it('does not throw when NODE_ENV is test', () => {
      process.env['NODE_ENV'] = 'test';

      expect(() => new FakeMarketDataProvider()).not.toThrow();
    });
  });

  describe('createMarketDataProvider', () => {
    it('throws when NODE_ENV is production and MARKET_DATA_PROVIDER is not REAL', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['MARKET_DATA_PROVIDER'] = 'FAKE';

      expect(() => createMarketDataProvider()).toThrow(
        'Production requires MARKET_DATA_PROVIDER=REAL'
      );
    });

    it('throws when NODE_ENV is production and MARKET_DATA_PROVIDER is not set', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['MARKET_DATA_PROVIDER'];

      expect(() => createMarketDataProvider()).toThrow(
        'Production requires MARKET_DATA_PROVIDER=REAL'
      );
    });

    it('does not throw when NODE_ENV is production and MARKET_DATA_PROVIDER is REAL', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['MARKET_DATA_PROVIDER'] = 'REAL';

      // This will create a YahooFinanceMarketDataProvider, not throw
      expect(() => createMarketDataProvider()).not.toThrow();
    });

    it('allows FAKE provider in development', () => {
      process.env['NODE_ENV'] = 'development';
      process.env['MARKET_DATA_PROVIDER'] = 'FAKE';

      expect(() => createMarketDataProvider()).not.toThrow();
    });

    it('allows FAKE provider when NODE_ENV is not set', () => {
      delete process.env['NODE_ENV'];
      delete process.env['MARKET_DATA_PROVIDER'];

      expect(() => createMarketDataProvider()).not.toThrow();
    });
  });
});
