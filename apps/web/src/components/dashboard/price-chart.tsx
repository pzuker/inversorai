'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import type { MarketDataPoint } from '@/lib/apiClient';

interface PriceChartProps {
  data: MarketDataPoint[];
  loading: boolean;
  error: string | null;
}

interface ChartDataPoint {
  date: string;
  close: number;
  fullDate: string;
}

interface ScaleInfo {
  minPrice: number;
  maxPrice: number;
  isLowVolatility: boolean;
  volatilityPercent: number;
}

const LOW_VOLATILITY_THRESHOLD = 0.001; // 0.1%
const MIN_PADDING_EPSILON = 0.0001; // Minimum padding to avoid zero range

function calculateScale(closes: number[]): ScaleInfo {
  if (closes.length === 0) {
    return { minPrice: 0, maxPrice: 100, isLowVolatility: false, volatilityPercent: 0 };
  }

  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const range = maxClose - minClose;

  // Calculate volatility as percentage of minClose
  const volatilityPercent = minClose > 0 ? range / minClose : 0;
  const isLowVolatility = volatilityPercent < LOW_VOLATILITY_THRESHOLD;

  // Calculate padding: 10% of range, with minimum epsilon
  const padding = Math.max(range * 0.1, minClose * MIN_PADDING_EPSILON, MIN_PADDING_EPSILON);

  return {
    minPrice: minClose - padding,
    maxPrice: maxClose + padding,
    isLowVolatility,
    volatilityPercent: volatilityPercent * 100,
  };
}

function formatPrice(value: number): string {
  // Determine decimal places based on value magnitude
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else if (value >= 1) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    // For values < 1 (like some FX pairs), show more decimals
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  }
}

export function PriceChart({ data, loading, error }: PriceChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((point) => {
      const date = new Date(point.timestamp);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toLocaleDateString(),
        close: point.close,
      };
    });
  }, [data]);

  const scaleInfo = useMemo<ScaleInfo>(() => {
    const closes = chartData.map((d) => d.close);
    return calculateScale(closes);
  }, [chartData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Historical closing prices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No price data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestPrice = chartData[chartData.length - 1]?.close ?? 0;
  const firstPrice = chartData[0]?.close ?? 0;
  const priceChange = firstPrice > 0 ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>
              {chartData.length} days of historical data
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatPrice(latestPrice)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scaleInfo.isLowVolatility && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Low volatility period — price variation {"<"} 0.1% ({scaleInfo.volatilityPercent.toFixed(3)}%)
            </span>
          </div>
        )}
        <div className={`h-[300px] w-full ${scaleInfo.isLowVolatility ? 'opacity-75' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[scaleInfo.minPrice, scaleInfo.maxPrice]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatPrice}
                className="text-muted-foreground"
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => {
                  const num = value as number;
                  return [formatPrice(num), 'Close'];
                }}
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return (payload[0].payload as ChartDataPoint).fullDate;
                  }
                  return '';
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
