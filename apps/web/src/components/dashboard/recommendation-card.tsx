'use client';

import { ArrowUpCircle, MinusCircle, ArrowDownCircle, Clock, Shield, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Recommendation } from '@/lib/apiClient';

interface RecommendationCardProps {
  data: Recommendation | null;
  loading: boolean;
  error: string | null;
}

function getActionConfig(action: Recommendation['action']) {
  switch (action) {
    case 'BUY':
      return {
        icon: ArrowUpCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        label: 'BUY',
      };
    case 'SELL':
      return {
        icon: ArrowDownCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        label: 'SELL',
      };
    case 'HOLD':
    default:
      return {
        icon: MinusCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        label: 'HOLD',
      };
  }
}

function getRiskColor(risk: Recommendation['riskLevel']) {
  switch (risk) {
    case 'LOW':
      return 'success';
    case 'HIGH':
      return 'destructive';
    default:
      return 'warning';
  }
}

export function RecommendationCard({ data, loading, error }: RecommendationCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendation</CardTitle>
          <CardDescription>AI-powered investment recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No recommendation available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const actionConfig = getActionConfig(data.action);
  const ActionIcon = actionConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendation</CardTitle>
        <CardDescription>
          Updated {new Date(data.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main action display */}
        <div
          className={`flex items-center justify-center gap-4 p-6 rounded-lg border ${actionConfig.bgColor} ${actionConfig.borderColor}`}
        >
          <ActionIcon className={`h-12 w-12 ${actionConfig.color}`} />
          <span className={`text-4xl font-bold ${actionConfig.color}`}>
            {actionConfig.label}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs">Confidence</span>
            </div>
            <p className="text-2xl font-semibold">
              {Math.round(data.confidenceScore * 100)}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Horizon</span>
            </div>
            <p className="text-2xl font-semibold">{data.horizon}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Risk</span>
            </div>
            <Badge variant={getRiskColor(data.riskLevel)} className="text-sm">
              {data.riskLevel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
