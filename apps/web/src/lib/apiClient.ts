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

export interface PipelineResult {
  assetSymbol: string;
  resolution: string;
  ingestedCount: number;
  indicatorComputed: boolean;
  analysisGenerated: boolean;
  insightGenerated: boolean;
  trend: string;
  recommendationAction: string;
  executedAt: string;
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

export async function runPipeline(token: string, symbol: string = 'BTC-USD'): Promise<PipelineResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/pipeline/run?symbol=${symbol}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to run pipeline: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Admin User Management

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface SetUserRoleResponse {
  success: boolean;
  data: AdminUser;
}

export async function fetchAdminUsers(
  token: string,
  page: number = 1,
  perPage: number = 50
): Promise<AdminUser[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/users?page=${page}&perPage=${perPage}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function setUserRole(
  token: string,
  userId: string,
  role: 'ADMIN' | 'USER'
): Promise<SetUserRoleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/role`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Failed to set role: ${response.status}`) as Error & {
      status: number;
      code?: string;
    };
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

export async function sendPasswordReset(
  token: string,
  userId: string,
  redirectTo?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/password-reset`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ redirectTo }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to send password reset: ${response.status}`);
  }

  return await response.json();
}
