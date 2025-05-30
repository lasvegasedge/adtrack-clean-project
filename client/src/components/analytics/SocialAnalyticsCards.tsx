import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, LineChart } from 'lucide-react';
import { formatCurrency, formatPercent } from "@/lib/utils";
import SocialMediaShare from '../share/SocialMediaShare';

interface AnalyticsCardProps {
  title: string;
  description?: string;
  value: string | number;
  icon?: React.ReactNode;
  helpText?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendText?: string;
  shareData: {
    campaignName?: string;
    roi?: number;
    adSpend?: number;
    revenue?: number;
    businessName?: string;
  };
}

export function SocialAnalyticsCard({
  title,
  description,
  value,
  icon,
  helpText,
  trend = 'neutral',
  trendValue,
  trendText,
  shareData
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColorClass = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-100';
      case 'down':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          {description && (
            <CardDescription>
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trend !== 'neutral' && (
            <div className={`rounded-full p-2 ${getTrendColorClass()}`}>
              {getTrendIcon()}
            </div>
          )}
          {icon}
          
          {/* Add share button */}
          <SocialMediaShare 
            data={shareData}
            variant="icon"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
        </div>
        {helpText && (
          <p className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
        {trendValue !== undefined && trendText && (
          <div className="flex items-center mt-2 text-xs">
            {getTrendIcon()}
            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
              {trendValue > 0 ? '+' : ''}{trendValue}% {trendText}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ROIAnalyticsCard({
  roi,
  campaigns = 0,
  businessName
}: {
  roi: number;
  campaigns?: number;
  businessName?: string;
}) {
  return (
    <SocialAnalyticsCard
      title="Overall ROI"
      description={`Based on ${campaigns} campaign${campaigns !== 1 ? 's' : ''}`}
      value={formatPercent(roi)}
      trend={roi >= 0 ? 'up' : 'down'}
      helpText={roi >= 0 ? 'Return on investment' : 'Loss on investment'}
      shareData={{
        campaignName: "Overall Performance",
        roi: roi,
        businessName: businessName
      }}
    />
  );
}

export function BestMethodAnalyticsCard({
  methodName,
  roi,
  spent,
  businessName
}: {
  methodName: string;
  roi: number;
  spent: number;
  businessName?: string;
}) {
  return (
    <SocialAnalyticsCard
      title="Best Performing Method"
      description="Highest return on investment"
      value={methodName}
      trend="up"
      helpText={`${formatPercent(roi)} ROI on ${formatCurrency(spent)} spent`}
      shareData={{
        campaignName: `Best Method: ${methodName}`,
        roi: roi,
        adSpend: spent,
        businessName: businessName
      }}
    />
  );
}

export function ComparisonAnalyticsCard({
  value,
  helpText,
  roi,
  businessName
}: {
  value: string;
  helpText: string;
  roi: number;
  businessName?: string;
}) {
  return (
    <SocialAnalyticsCard
      title="Comparison with Area"
      description="Your performance vs. local competitors"
      value={value}
      icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
      helpText={helpText}
      shareData={{
        campaignName: "Area Comparison",
        roi: roi,
        businessName: businessName
      }}
    />
  );
}

export function FinancialAnalyticsCard({
  title,
  description,
  value,
  helpText,
  adSpend,
  revenue,
  roi,
  businessName
}: {
  title: string;
  description?: string;
  value: string | number;
  helpText?: string;
  adSpend: number;
  revenue: number;
  roi: number;
  businessName?: string;
}) {
  return (
    <SocialAnalyticsCard
      title={title}
      description={description}
      value={value}
      helpText={helpText}
      icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
      shareData={{
        campaignName: title,
        roi: roi,
        adSpend: adSpend,
        revenue: revenue,
        businessName: businessName
      }}
    />
  );
}

export function PerformanceAnalyticsCard({
  title,
  description,
  value,
  helpText,
  trend,
  trendValue,
  trendText,
  roi,
  businessName
}: {
  title: string;
  description?: string;
  value: string | number;
  helpText?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendText?: string;
  roi: number;
  businessName?: string;
}) {
  return (
    <SocialAnalyticsCard
      title={title}
      description={description}
      value={value}
      helpText={helpText}
      trend={trend}
      trendValue={trendValue}
      trendText={trendText}
      icon={<LineChart className="h-4 w-4 text-purple-600" />}
      shareData={{
        campaignName: title,
        roi: roi,
        businessName: businessName
      }}
    />
  );
}