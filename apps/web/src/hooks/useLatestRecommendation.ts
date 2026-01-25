'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchLatestRecommendation, type Recommendation } from '@/lib/apiClient';

interface UseLatestRecommendationResult {
  data: Recommendation | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLatestRecommendation(symbol: string = 'BTC-USD'): UseLatestRecommendationResult {
  const { session } = useAuth();
  const [data, setData] = useState<Recommendation | null>(null);
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
      const result = await fetchLatestRecommendation(session.access_token, symbol);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendation');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, symbol]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
