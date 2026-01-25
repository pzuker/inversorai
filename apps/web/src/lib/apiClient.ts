const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface MarketDataPoint {
  assetSymbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IngestResult {
  ingestedCount: number;
  persistedCount: number;
}

export async function fetchMarketData(token: string): Promise<MarketDataPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/market-data?symbol=BTC-USD`, {
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
