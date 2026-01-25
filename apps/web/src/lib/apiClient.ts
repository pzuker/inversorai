const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export interface MarketDataPoint {
  assetSymbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IngestResult {
  ingestedCount: number;
  persistedCount: number;
}

export interface Recommendation {
  assetSymbol: string;
  action: 'BUY' | 'HOLD' | 'SELL';
  confidenceScore: number;
  horizon: 'SHORT' | 'MID' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface InvestmentInsight {
  assetSymbol: string;
  summary: string;
  reasoning: string;
  assumptions: string[];
  caveats: string[];
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  outputSchemaVersion: string;
  inputSnapshotHash: string;
  createdAt: string;
}

export async function fetchMarketData(token: string, symbol: string = 'BTC-USD'): Promise<MarketDataPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/market-data?symbol=${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-user-role': 'USER',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function fetchLatestRecommendation(token: string, symbol: string = 'BTC-USD'): Promise<Recommendation | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/recommendations/latest?symbol=${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-user-role': 'USER',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendation: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function fetchLatestInsight(token: string, symbol: string = 'BTC-USD'): Promise<InvestmentInsight | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/insights/latest?symbol=${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-user-role': 'USER',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch insight: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function triggerIngest(token: string): Promise<IngestResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/market/ingest-and-persist`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-user-role': 'ADMIN',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger ingest: ${response.status}`);
  }

  return response.json();
}
