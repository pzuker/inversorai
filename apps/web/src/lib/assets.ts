export type AssetType = 'CRYPTO' | 'STOCK' | 'FX';

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK' },
  { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'FX' },
];

export const DEFAULT_ASSET = SUPPORTED_ASSETS[0]!;

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
}

export function getAssetTypeLabel(type: AssetType): string {
  switch (type) {
    case 'CRYPTO':
      return 'Cryptocurrency';
    case 'STOCK':
      return 'Stock';
    case 'FX':
      return 'Forex';
  }
}
