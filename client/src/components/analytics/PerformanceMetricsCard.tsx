import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessCampaignWithROI } from '@shared/schema';
import { formatCurrency, formatPercent, calculateROI } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  DollarSign,
  CircleDollarSign,
  BarChart4,
  TrendingUp
} from 'lucide-react';

interface PerformanceMetricsCardProps {
  campaigns: BusinessCampaignWithROI[];
  previousPeriodCampaigns?: BusinessCampaignWithROI[];
}

export function PerformanceMetricsCard({ 
  campaigns, 
  previousPeriodCampaigns 
}: PerformanceMetricsCardProps) {
  
  const metrics = useMemo(() => {
    // Current period metrics
    const totalSpent = campaigns.reduce((sum, c) => sum + c.amountSpent, 0);
    const totalEarned = campaigns.reduce((sum, c) => sum + c.amountEarned, 0);
    const profit = totalEarned - totalSpent;
    const roi = calculateROI(totalSpent, totalEarned);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    
    // Most profitable campaign
    let mostProfitableCampaign = campaigns[0];
    let highestProfit = -Infinity;
    
    campaigns.forEach(campaign => {
      const campaignProfit = campaign.amountEarned - campaign.amountSpent;
      if (campaignProfit > highestProfit) {
        highestProfit = campaignProfit;
        mostProfitableCampaign = campaign;
      }
    });
    
    // Highest ROI campaign
    let highestRoiCampaign = campaigns[0];
    let highestRoi = -Infinity;
    
    campaigns.forEach(campaign => {
      if (campaign.roi > highestRoi) {
        highestRoi = campaign.roi;
        highestRoiCampaign = campaign;
      }
    });
    
    // Previous period metrics for comparison
    let prevTotalSpent = 0;
    let prevTotalEarned = 0;
    let prevRoi = 0;
    
    if (previousPeriodCampaigns && previousPeriodCampaigns.length > 0) {
      prevTotalSpent = previousPeriodCampaigns.reduce((sum, c) => sum + c.amountSpent, 0);
      prevTotalEarned = previousPeriodCampaigns.reduce((sum, c) => sum + c.amountEarned, 0);
      prevRoi = calculateROI(prevTotalSpent, prevTotalEarned);
    }
    
    // Calculate changes
    const spendingChange = prevTotalSpent !== 0 
      ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 
      : 0;
    
    const earningsChange = prevTotalEarned !== 0 
      ? ((totalEarned - prevTotalEarned) / prevTotalEarned) * 100 
      : 0;
    
    const roiChange = prevRoi !== 0 
      ? roi - prevRoi
      : 0;
    
    return {
      totalSpent,
      totalEarned,
      profit,
      roi,
      activeCampaigns,
      mostProfitableCampaign,
      highestRoiCampaign,
      spendingChange,
      earningsChange,
      roiChange,
      hasPreviousPeriod: previousPeriodCampaigns && previousPeriodCampaigns.length > 0
    };
  }, [campaigns, previousPeriodCampaigns]);
  
  // Helper function to render change indicators
  const renderChangeIndicator = (value: number, reverse = false) => {
    if (value === 0) return null;
    
    // For some metrics like spending, a decrease might be good (reverse = true)
    const isPositive = reverse ? value < 0 : value > 0;
    
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? (
          <ArrowUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 mr-1" />
        )}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart4 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Key performance indicators and campaign metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ROI */}
          <div className="space-y-1">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Overall ROI</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-semibold ${
                metrics.roi >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatPercent(metrics.roi)}
              </span>
              {metrics.hasPreviousPeriod && renderChangeIndicator(metrics.roiChange)}
            </div>
          </div>
          
          {/* Total Spent */}
          <div className="space-y-1">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Spent</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatCurrency(metrics.totalSpent)}
              </span>
              {metrics.hasPreviousPeriod && renderChangeIndicator(metrics.spendingChange, true)}
            </div>
          </div>
          
          {/* Total Earned */}
          <div className="space-y-1">
            <div className="flex items-center">
              <CircleDollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Earned</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatCurrency(metrics.totalEarned)}
              </span>
              {metrics.hasPreviousPeriod && renderChangeIndicator(metrics.earningsChange)}
            </div>
          </div>
          
          {/* Net Profit */}
          <div className="space-y-1">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Net Profit</span>
            </div>
            <div className="flex items-baseline">
              <span className={`text-2xl font-semibold ${
                metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatCurrency(metrics.profit)}
              </span>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Top Performers</h3>
          
          {campaigns.length > 0 ? (
            <>
              {/* Most Profitable Campaign */}
              <div className="p-3 rounded-md border border-border bg-accent/30">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">Most Profitable Campaign</h4>
                  <div className="text-green-500 font-semibold">
                    {formatCurrency(metrics.mostProfitableCampaign.amountEarned - metrics.mostProfitableCampaign.amountSpent)}
                  </div>
                </div>
                <p className="text-sm">{metrics.mostProfitableCampaign.name}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.mostProfitableCampaign.adMethod} • Spent: {formatCurrency(metrics.mostProfitableCampaign.amountSpent)}
                </div>
              </div>
              
              {/* Highest ROI Campaign */}
              <div className="p-3 rounded-md border border-border bg-accent/30">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">Highest ROI Campaign</h4>
                  <div className={`font-semibold ${
                    metrics.highestRoiCampaign.roi >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercent(metrics.highestRoiCampaign.roi)}
                  </div>
                </div>
                <p className="text-sm">{metrics.highestRoiCampaign.name}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.highestRoiCampaign.adMethod} • Return: {formatCurrency(metrics.highestRoiCampaign.amountEarned)}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-lg border border-border bg-accent/50 text-center">
              No campaign data available yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}