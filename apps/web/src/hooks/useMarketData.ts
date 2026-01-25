'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchMarketData, type MarketDataPoint } from '@/lib/apiClient';

interface UseMarketDataResult {
  data: MarketDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMarketData(symbol: string = 'BTC-USD'): UseMarketDataResult {
  const { session } = useAuth();
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMarketData(session.access_token, symbol);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, symbol]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
