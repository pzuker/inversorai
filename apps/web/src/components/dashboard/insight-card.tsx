'use client';

import { Bot, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { InvestmentInsight } from '@/lib/apiClient';

interface InsightCardProps {
  data: InvestmentInsight | null;
  loading: boolean;
  error: string | null;
}

export function InsightCard({ data, loading, error }: InsightCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Insight
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Insight
          </CardTitle>
          <CardDescription>AI-generated investment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No AI insight available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Insight
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {data.modelName}
          </Badge>
        </div>
        <CardDescription>
          Generated {new Date(data.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="space-y-2">
          <p className="text-lg font-medium leading-relaxed">{data.summary}</p>
        </div>

        {/* Reasoning */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Reasoning</h4>
          <p className="text-sm leading-relaxed">{data.reasoning}</p>
        </div>

        {/* Assumptions */}
        {data.assumptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Assumptions
            </h4>
            <ul className="space-y-1 text-sm">
              {data.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Caveats */}
        {data.caveats.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Caveats
            </h4>
            <ul className="space-y-1 text-sm">
              {data.caveats.map((caveat, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{caveat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            Prompt v{data.promptVersion}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Schema v{data.outputSchemaVersion}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
