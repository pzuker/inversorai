export type AssetType = 'CRYPTO' | 'STOCK' | 'FX';

export interface Asset {
  symbol: string;
  displayName: string;
  type: AssetType;
  currency: string;
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'BTC-USD', displayName: 'Bitcoin', type: 'CRYPTO', currency: 'USD' },
  { symbol: 'AAPL', displayName: 'Apple Inc.', type: 'STOCK', currency: 'USD' },
  { symbol: 'EURUSD=X', displayName: 'EUR/USD', type: 'FX', currency: 'USD' },
];

export function isValidSymbol(symbol: string): boolean {
  return SUPPORTED_ASSETS.some((a) => a.symbol === symbol);
}

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
}
