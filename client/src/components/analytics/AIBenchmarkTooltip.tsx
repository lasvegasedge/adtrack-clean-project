import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, LineChart, AlertCircle, Check } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

export interface AIBenchmarkInsight {
  performance: {
    value: number;
    percentDifference: number;
    isPositive: boolean;
  };
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  confidenceScore: number;
  industryBenchmark: number;
}

interface AITooltipContentProps {
  title: string;
  metric: string;
  value: number;
  insight: AIBenchmarkInsight;
  isPremiumFeature?: boolean;
  isChartTooltip?: boolean;
}

export const AITooltipContent: React.FC<AITooltipContentProps> = ({
  title,
  metric,
  value,
  insight,
  isPremiumFeature = true,
  isChartTooltip = false
}) => {
  // Format value based on metric type
  const formattedValue = metric.toLowerCase().includes('roi') 
    ? formatPercent(value) 
    : formatCurrency(value);
  
  // Calculate color based on trend
  const trendColor = insight.trend === 'up' 
    ? 'text-green-500' 
    : insight.trend === 'down' 
      ? 'text-red-500' 
      : 'text-amber-500';
  
  // Trend icon
  const TrendIcon = insight.trend === 'up' 
    ? TrendingUp 
    : insight.trend === 'down' 
      ? TrendingDown 
      : LineChart;
  
  return (
    <Card className={`p-0 shadow-lg border-primary/10 ${isChartTooltip ? 'min-w-[300px] max-w-[350px]' : 'w-full'}`}>
      <CardContent className="p-3">
        {isPremiumFeature && (
          <div className="flex items-center justify-between mb-2">
            <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" /> Premium Insight
            </Badge>
            <div className="text-xs text-muted-foreground">
              {Math.round(insight.confidenceScore * 100)}% confidence
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            <div className="flex items-center mt-1">
              <span className="text-lg font-bold mr-2">{formattedValue}</span>
              <div className={`flex items-center ${insight.performance.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-xs font-medium">
                  {insight.performance.percentDifference > 0 ? '+' : ''}
                  {formatPercent(insight.performance.percentDifference / 100)}
                </span>
                {insight.performance.isPositive ? (
                  <TrendingUp className="h-3 w-3 ml-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 ml-1" />
                )}
              </div>
            </div>
          </div>
          
          <div className="text-xs border-t pt-2">
            <div className="flex items-start mb-1.5">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-primary" />
              <span className="text-muted-foreground">
                {metric.toLowerCase().includes('roi') ? 'Industry avg ROI' : 'Industry benchmark'}:&nbsp;
                <span className="font-medium">
                  {metric.toLowerCase().includes('roi') 
                    ? formatPercent(insight.industryBenchmark) 
                    : formatCurrency(insight.industryBenchmark)}
                </span>
              </span>
            </div>
            
            <div className="flex items-start mb-1.5">
              <TrendIcon className={`h-3.5 w-3.5 mr-1.5 mt-0.5 ${trendColor}`} />
              <span className="text-muted-foreground">
                Trend: <span className={`font-medium ${trendColor}`}>
                  {insight.trend === 'up' ? 'Improving' : insight.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </span>
            </div>
            
            <div className="flex items-start">
              <Check className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-green-500" />
              <span className="text-muted-foreground">{insight.recommendation}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Custom tooltip component to use with recharts
export const AIBenchmarkTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  insights: Record<string, AIBenchmarkInsight>;
}> = ({ active, payload, label, insights }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0];
  const metricName = data.name || '';
  const value = data.value || 0;
  const insight = insights[metricName] || insights['default'];
  
  if (!insight) return null;
  
  return (
    <AITooltipContent
      title={label || ''}
      metric={metricName}
      value={value}
      insight={insight}
      isChartTooltip={true}
    />
  );
};