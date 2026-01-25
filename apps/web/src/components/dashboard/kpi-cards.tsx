'use client';

import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketDataPoint } from '@/lib/apiClient';

interface KPICardsProps {
  data: MarketDataPoint[];
  loading: boolean;
}

function calculateKPIs(data: MarketDataPoint[]) {
  if (data.length < 2) {
    return null;
  }

  const closes = data.map((d) => d.close);
  const latestClose = closes[closes.length - 1]!;
  const previousClose = closes[closes.length - 2]!;

  // Simple trend based on last few closes
  const recentCloses = closes.slice(-5);
  const avgRecent = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
  const trend = latestClose > avgRecent * 1.02 ? 'BULLISH' : latestClose < avgRecent * 0.98 ? 'BEARISH' : 'NEUTRAL';

  // Price change percentage
  const priceChange = ((latestClose - previousClose) / previousClose) * 100;

  // Signal strength (simplified: based on momentum)
  const signalStrength = Math.min(100, Math.abs(priceChange) * 10);

  // Volatility (standard deviation of returns)
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i]! - closes[i - 1]!) / closes[i - 1]!);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100;

  // Simplified Sharpe (annualized, assuming 365 days, risk-free = 0)
  const sharpe = avgReturn > 0 ? (avgReturn * 365) / (Math.sqrt(variance) * Math.sqrt(365)) : 0;

  return {
    trend,
    priceChange,
    signalStrength: Math.round(signalStrength),
    volatility: volatility.toFixed(2),
    sharpe: sharpe.toFixed(2),
    latestPrice: latestClose,
  };
}

function KPICard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const colorClasses = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[variant]}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export function KPICards({ data, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  const kpis = calculateKPIs(data);

  if (!kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Not enough data to calculate KPIs. Need at least 2 data points.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendIcon = kpis.trend === 'BULLISH' ? TrendingUp : kpis.trend === 'BEARISH' ? TrendingDown : Minus;
  const trendVariant = kpis.trend === 'BULLISH' ? 'success' : kpis.trend === 'BEARISH' ? 'danger' : 'default';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Trend"
        value={kpis.trend}
        icon={trendIcon}
        variant={trendVariant}
      />
      <KPICard
        title="Signal Strength"
        value={`${kpis.signalStrength}/100`}
        icon={Activity}
        variant={kpis.signalStrength > 70 ? 'success' : kpis.signalStrength > 40 ? 'warning' : 'default'}
      />
      <KPICard
        title="Volatility (30d)"
        value={`${kpis.volatility}%`}
        icon={BarChart3}
        variant={parseFloat(kpis.volatility) > 5 ? 'warning' : 'default'}
      />
      <KPICard
        title="Sharpe Ratio"
        value={kpis.sharpe}
        icon={Percent}
        variant={parseFloat(kpis.sharpe) > 1 ? 'success' : parseFloat(kpis.sharpe) < 0 ? 'danger' : 'default'}
      />
    </div>
  );
}
