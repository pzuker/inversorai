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

  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const closes = chartData.map((d) => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const padding = (max - min) * 0.1;
    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding),
    };
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
  const priceChange = ((latestPrice - firstPrice) / firstPrice) * 100;
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
              ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
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
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                className="text-muted-foreground"
                width={80}
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
                  return [
                    `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'Close',
                  ];
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
