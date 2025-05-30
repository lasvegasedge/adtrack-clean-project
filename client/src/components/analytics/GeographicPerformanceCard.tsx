import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessCampaignWithROI } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, calculateROI } from '@/lib/utils';
import { MapPin, TrendingUp, Layers, Building } from 'lucide-react';

interface GeographicPerformanceCardProps {
  campaigns: BusinessCampaignWithROI[];
  topPerformers: BusinessCampaignWithROI[];
  userLocation?: {
    city?: string;
    region?: string;
  };
}

// Helper to calculate the average of a numeric array
const average = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export function GeographicPerformanceCard({ 
  campaigns, 
  topPerformers,
  userLocation
}: GeographicPerformanceCardProps) {
  
  // Calculate your performance metrics
  const yourPerformance = useMemo(() => {
    const totalSpent = campaigns.reduce((sum, c) => sum + c.amountSpent, 0);
    const totalEarned = campaigns.reduce((sum, c) => sum + c.amountEarned, 0);
    const overallRoi = calculateROI(totalSpent, totalEarned);
    const averageRoi = average(campaigns.map(c => c.roi));
    
    return {
      totalSpent,
      totalEarned,
      profit: totalEarned - totalSpent,
      overallRoi,
      averageRoi,
      campaignCount: campaigns.length
    };
  }, [campaigns]);
  
  // Calculate local area metrics (excluding your own campaigns)
  const areaPerformance = useMemo(() => {
    // Filter out your own campaigns
    const otherBusinessCampaigns = topPerformers.filter(
      c => !campaigns.some(yourCampaign => yourCampaign.id === c.id)
    );
    
    const totalSpent = otherBusinessCampaigns.reduce((sum, c) => sum + c.amountSpent, 0);
    const totalEarned = otherBusinessCampaigns.reduce((sum, c) => sum + c.amountEarned, 0);
    const overallRoi = calculateROI(totalSpent, totalEarned);
    const averageRoi = average(otherBusinessCampaigns.map(c => c.roi));
    
    return {
      totalSpent,
      totalEarned,
      profit: totalEarned - totalSpent,
      overallRoi,
      averageRoi,
      campaignCount: otherBusinessCampaigns.length,
      businessCount: new Set(otherBusinessCampaigns.map(c => c.businessId)).size
    };
  }, [topPerformers, campaigns]);
  
  // Calculate how you're doing compared to area average
  const comparison = useMemo(() => {
    return {
      roiDifference: yourPerformance.averageRoi - areaPerformance.averageRoi,
      isAboveAverage: yourPerformance.averageRoi > areaPerformance.averageRoi
    };
  }, [yourPerformance, areaPerformance]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Performance Analysis
        </CardTitle>
        <CardDescription>
          Compare your performance with similar businesses in your area
          {userLocation?.city && userLocation?.region && (
            <span> ({userLocation.city}, {userLocation.region})</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
            <TabsTrigger value="ranking">Area Ranking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium flex items-center gap-2 mb-3">
                  <Building className="h-4 w-4" />
                  Your Performance
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Average ROI</div>
                    <div className={`text-2xl font-semibold ${
                      yourPerformance.averageRoi >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercent(yourPerformance.averageRoi)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Total Investment</div>
                    <div className="text-xl font-medium">
                      {formatCurrency(yourPerformance.totalSpent)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Total Returns</div>
                    <div className="text-xl font-medium">
                      {formatCurrency(yourPerformance.totalEarned)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                    <div className={`text-xl font-medium ${
                      yourPerformance.profit >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(yourPerformance.profit)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-base font-medium flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  Area Average
                  <span className="text-xs text-muted-foreground font-normal">
                    ({areaPerformance.businessCount} businesses)
                  </span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Average ROI</div>
                    <div className={`text-2xl font-semibold ${
                      areaPerformance.averageRoi >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercent(areaPerformance.averageRoi)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Average Investment</div>
                    <div className="text-xl font-medium">
                      {formatCurrency(areaPerformance.totalSpent / Math.max(1, areaPerformance.businessCount))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Average Returns</div>
                    <div className="text-xl font-medium">
                      {formatCurrency(areaPerformance.totalEarned / Math.max(1, areaPerformance.businessCount))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Average Net Profit</div>
                    <div className={`text-xl font-medium ${
                      areaPerformance.profit >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(areaPerformance.profit / Math.max(1, areaPerformance.businessCount))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 mt-4 rounded-lg border border-border bg-accent/50">
              <h3 className="text-base font-medium flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Performance Summary
              </h3>
              <p>
                {comparison.isAboveAverage ? (
                  <span>
                    Your campaigns are performing <strong className="text-green-500">above average</strong> compared 
                    to similar businesses in your area. Your average ROI 
                    is <span className="font-medium text-green-500">
                      {formatPercent(Math.abs(comparison.roiDifference))}
                    </span> higher than the local average.
                  </span>
                ) : (
                  <span>
                    Your campaigns are performing <strong className="text-amber-500">below average</strong> compared 
                    to similar businesses in your area. Your average ROI 
                    is <span className="font-medium text-amber-500">
                      {formatPercent(Math.abs(comparison.roiDifference))}
                    </span> lower than the local average.
                  </span>
                )}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="ranking" className="space-y-4 pt-4">
            <h3 className="text-base font-medium flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4" />
              Top Performing Campaigns in Your Area
            </h3>
            
            <div className="space-y-2">
              {topPerformers
                .sort((a, b) => b.roi - a.roi)
                .slice(0, 5)
                .map((campaign, index) => {
                  const isYourCampaign = campaigns.some(c => c.id === campaign.id);
                  return (
                    <div 
                      key={campaign.id}
                      className={`p-3 rounded-md border border-border flex items-center justify-between ${
                        isYourCampaign ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {campaign.name}
                            {isYourCampaign && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                Your Campaign
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isYourCampaign ? 'Your Business' : `Business #${index + 1}`} • {campaign.adMethod}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${
                        campaign.roi >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatPercent(campaign.roi)}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {topPerformers.length === 0 && (
              <div className="p-4 rounded-lg border border-border bg-accent/50 text-center">
                No campaigns available in your area yet
              </div>
            )}
            
            <div className="p-4 mt-2 rounded-lg border border-border bg-accent/50">
              <p className="text-sm text-muted-foreground">
                This ranking shows the top 5 performing campaigns in your local area, 
                based on ROI. Compare your strategies with the top performers to improve 
                your advertising effectiveness.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}