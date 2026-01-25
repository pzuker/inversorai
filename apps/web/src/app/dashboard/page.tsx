'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KPICards,
  RecommendationCard,
  InsightCard,
  PriceChart,
} from '@/components/dashboard';
import { useMarketData, useLatestRecommendation, useLatestInsight } from '@/hooks';
import { triggerIngest } from '@/lib/apiClient';

const ADMIN_EMAIL = 'admin@inversorai.com';
const CURRENT_ASSET = 'BTC-USD';

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const {
    data: marketData,
    loading: marketLoading,
    error: marketError,
    refetch: refetchMarket,
  } = useMarketData(CURRENT_ASSET);

  const {
    data: recommendation,
    loading: recommendationLoading,
    error: recommendationError,
    refetch: refetchRecommendation,
  } = useLatestRecommendation(CURRENT_ASSET);

  const {
    data: insight,
    loading: insightLoading,
    error: insightError,
    refetch: refetchInsight,
  } = useLatestInsight(CURRENT_ASSET);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState<{ ingestedCount: number; persistedCount: number } | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  const handleRefreshAll = async () => {
    await Promise.all([refetchMarket(), refetchRecommendation(), refetchInsight()]);
  };

  const handleIngest = async () => {
    if (!session?.access_token) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);

    try {
      const result = await triggerIngest(session.access_token);
      setIngestResult(result);
      await handleRefreshAll();
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : 'Failed to ingest');
    } finally {
      setIngestLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isLoading = marketLoading || recommendationLoading || insightLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header currentAsset={CURRENT_ASSET} />

      <main className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Market analysis and AI insights for {CURRENT_ASSET}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Admin Actions</CardTitle>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleIngest}
                  disabled={ingestLoading}
                  size="sm"
                >
                  {ingestLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Market Data'
                  )}
                </Button>
                {ingestResult && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Ingested: {ingestResult.ingestedCount}, Persisted: {ingestResult.persistedCount}
                  </span>
                )}
                {ingestError && (
                  <span className="text-sm text-destructive">{ingestError}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Key Indicators</h2>
          <KPICards data={marketData} loading={marketLoading} />
        </section>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recommendation */}
          <section>
            <RecommendationCard
              data={recommendation}
              loading={recommendationLoading}
              error={recommendationError}
            />
          </section>

          {/* AI Insight */}
          <section>
            <InsightCard
              data={insight}
              loading={insightLoading}
              error={insightError}
            />
          </section>
        </div>

        {/* Price Chart - full width */}
        <section>
          <PriceChart
            data={marketData}
            loading={marketLoading}
            error={marketError}
          />
        </section>
      </main>
    </div>
  );
}
