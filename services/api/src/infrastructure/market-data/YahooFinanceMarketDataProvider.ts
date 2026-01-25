import type { MarketDataPoint } from '../../domain/entities/index.js';
import type { MarketDataProviderPort } from '../../application/ports/index.js';

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error: {
      code: string;
      description: string;
    } | null;
  };
}

export class YahooFinanceMarketDataProvider implements MarketDataProviderPort {
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private readonly range: string;
  private readonly interval: string;

  constructor(range: string = '30d', interval: string = '1d') {
    this.range = range;
    this.interval = interval;
  }

  async fetchMarketData(assetSymbol: string): Promise<MarketDataPoint[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(assetSymbol)}?interval=${this.interval}&range=${this.range}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: HTTP ${response.status} for symbol ${assetSymbol}`);
    }

    const data = (await response.json()) as YahooChartResult;

    if (data.chart.error) {
      throw new Error(`Yahoo Finance API error: ${data.chart.error.description}`);
    }

    const result = data.chart.result?.[0];
    if (!result) {
      throw new Error(`No data returned from Yahoo Finance for symbol ${assetSymbol}`);
    }

    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];

    if (!timestamp || !quote) {
      throw new Error(`Invalid data structure from Yahoo Finance for symbol ${assetSymbol}`);
    }

    const points: MarketDataPoint[] = [];

    for (let i = 0; i < timestamp.length; i++) {
      const ts = timestamp[i];
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      const volume = quote.volume[i];

      if (
        ts === undefined ||
        open === undefined ||
        open === null ||
        high === undefined ||
        high === null ||
        low === undefined ||
        low === null ||
        close === undefined ||
        close === null ||
        volume === undefined ||
        volume === null
      ) {
        continue;
      }

      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
        continue;
      }

      // Validate OHLC coherence (required by database constraint)
      if (high < low || high < open || high < close || low > open || low > close) {
        continue;
      }

      points.push({
        assetSymbol,
        timestamp: new Date(ts * 1000),
        open,
        high,
        low,
        close,
        volume,
      });
    }

    if (points.length === 0) {
      throw new Error(`No valid market data points for symbol ${assetSymbol}`);
    }

    return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
