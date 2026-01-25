'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchLatestInsight, type InvestmentInsight } from '@/lib/apiClient';

interface UseLatestInsightResult {
  data: InvestmentInsight | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLatestInsight(symbol: string = 'BTC-USD'): UseLatestInsightResult {
  const { session } = useAuth();
  const [data, setData] = useState<InvestmentInsight | null>(null);
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
      const result = await fetchLatestInsight(session.access_token, symbol);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insight');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, symbol]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
