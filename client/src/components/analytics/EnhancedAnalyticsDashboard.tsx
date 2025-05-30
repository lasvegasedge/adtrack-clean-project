import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { BusinessCampaignWithROI, AdMethod } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { RoiByAdMethodChart } from "./RoiByAdMethodChart";
import { MonthlyPerformanceTrendChart } from "./MonthlyPerformanceTrendChart";
import { CampaignComparisonChart } from "./CampaignComparisonChart";
import { GeographicPerformanceCard } from "./GeographicPerformanceCard";

type TimeframeOption = "7d" | "30d" | "90d" | "all";

interface DashboardFilters {
  timeframe: TimeframeOption;
  adMethodId?: number;
}

export function EnhancedAnalyticsDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [filters, setFilters] = useState<DashboardFilters>({
    timeframe: "30d",
    adMethodId: undefined,
  });

  // Get the user's business ID
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["/api/business", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/user/${user?.id}/business`);
      if (!res.ok) throw new Error("Failed to load business data");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Get the business campaigns with ROI
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["/api/business/campaigns/roi", business?.id, filters],
    queryFn: async () => {
      const res = await fetch(`/api/business/${business?.id}/campaigns/roi`);
      if (!res.ok) throw new Error("Failed to load campaign data");
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Get the business overall stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/business/stats", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${business?.id}/stats`);
      if (!res.ok) throw new Error("Failed to load business stats");
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Get the top performers
  const { data: topPerformers, isLoading: isLoadingTopPerformers } = useQuery({
    queryKey: ["/api/top-performers", business?.businessType, business?.latitude, business?.longitude],
    queryFn: async () => {
      const res = await fetch(`/api/top-performers?businessType=${business?.businessType}&latitude=${business?.latitude}&longitude=${business?.longitude}&radiusMiles=3`);
      if (!res.ok) throw new Error("Failed to load top performers");
      return res.json();
    },
    enabled: !!business?.id && !!business?.businessType && !!business?.latitude && !!business?.longitude,
  });

  // Get all ad methods
  const { data: adMethods, isLoading: isLoadingAdMethods } = useQuery({
    queryKey: ["/api/ad-methods"],
    queryFn: async () => {
      const res = await fetch("/api/ad-methods");
      if (!res.ok) throw new Error("Failed to load ad methods");
      return res.json();
    },
  });

  // Filter campaigns based on selected timeframe and ad method
  const filteredCampaigns = () => {
    if (!campaigns) return [];
    
    let filtered = [...campaigns];
    
    // Filter by timeframe
    if (filters.timeframe !== "all") {
      const now = new Date();
      let daysAgo;
      
      switch (filters.timeframe) {
        case "7d":
          daysAgo = 7;
          break;
        case "30d":
          daysAgo = 30;
          break;
        case "90d":
          daysAgo = 90;
          break;
        default:
          daysAgo = 0;
      }
      
      if (daysAgo > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - daysAgo);
        
        filtered = filtered.filter(campaign => {
          const startDate = new Date(campaign.startDate);
          return startDate >= cutoffDate;
        });
      }
    }
    
    // Filter by ad method
    if (filters.adMethodId) {
      filtered = filtered.filter(campaign => campaign.adMethodId === filters.adMethodId);
    }
    
    return filtered;
  };

  // Calculate overall ROI for the filtered campaigns
  const calculateOverallROI = (campaignList: BusinessCampaignWithROI[]) => {
    if (!campaignList || campaignList.length === 0) return 0;
    
    const totalSpent = campaignList.reduce((total, campaign) => 
      total + parseFloat(campaign.amountSpent), 0);
      
    const totalEarned = campaignList.reduce((total, campaign) => 
      total + (campaign.amountEarned ? parseFloat(campaign.amountEarned) : 0), 0);
    
    if (totalSpent === 0) return 0;
    return ((totalEarned - totalSpent) / totalSpent) * 100;
  };

  // Find the best and worst performing ad methods
  const findBestAndWorstAdMethods = () => {
    if (!campaigns || campaigns.length === 0 || !adMethods) return { best: null, worst: null };
    
    // Group campaigns by ad method
    const adMethodPerformance: Record<number, { totalSpent: number; totalEarned: number; roi: number }> = {};
    
    campaigns.forEach(campaign => {
      if (!adMethodPerformance[campaign.adMethodId]) {
        adMethodPerformance[campaign.adMethodId] = {
          totalSpent: 0,
          totalEarned: 0,
          roi: 0
        };
      }
      
      adMethodPerformance[campaign.adMethodId].totalSpent += parseFloat(campaign.amountSpent);
      adMethodPerformance[campaign.adMethodId].totalEarned += campaign.amountEarned 
        ? parseFloat(campaign.amountEarned) 
        : 0;
    });
    
    // Calculate ROI for each ad method
    Object.keys(adMethodPerformance).forEach(methodId => {
      const method = adMethodPerformance[Number(methodId)];
      if (method.totalSpent > 0) {
        method.roi = ((method.totalEarned - method.totalSpent) / method.totalSpent) * 100;
      }
    });
    
    // Find best and worst performers
    let bestMethodId: number | null = null;
    let worstMethodId: number | null = null;
    let highestROI = -Infinity;
    let lowestROI = Infinity;
    
    Object.entries(adMethodPerformance).forEach(([methodId, performance]) => {
      // Only consider methods with some spending
      if (performance.totalSpent > 0) {
        if (performance.roi > highestROI) {
          highestROI = performance.roi;
          bestMethodId = Number(methodId);
        }
        
        if (performance.roi < lowestROI) {
          lowestROI = performance.roi;
          worstMethodId = Number(methodId);
        }
      }
    });
    
    return {
      best: bestMethodId !== null 
        ? { 
            adMethod: adMethods.find(m => m.id === bestMethodId),
            roi: highestROI,
            spent: adMethodPerformance[bestMethodId].totalSpent,
            earned: adMethodPerformance[bestMethodId].totalEarned
          } 
        : null,
      worst: worstMethodId !== null 
        ? { 
            adMethod: adMethods.find(m => m.id === worstMethodId),
            roi: lowestROI,
            spent: adMethodPerformance[worstMethodId].totalSpent,
            earned: adMethodPerformance[worstMethodId].totalEarned
          } 
        : null
    };
  };

  const { best, worst } = findBestAndWorstAdMethods();
  const filtered = filteredCampaigns();
  const overallROI = calculateOverallROI(filtered);

  if (isLoadingBusiness || isLoadingCampaigns || isLoadingStats || isLoadingAdMethods) {
    return <AnalyticsDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium mb-1">Timeframe</p>
          <Tabs
            value={filters.timeframe}
            onValueChange={(value: TimeframeOption) => setFilters({...filters, timeframe: value})}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-xs">
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Ad Method</p>
          <Tabs
            value={filters.adMethodId?.toString() || "all"}
            onValueChange={(value) => setFilters({
              ...filters, 
              adMethodId: value === "all" ? undefined : Number(value)
            })}
            className="w-full"
          >
            <TabsList className="flex flex-wrap gap-1 w-full max-w-md">
              <TabsTrigger value="all">All Methods</TabsTrigger>
              {adMethods?.map(method => (
                <TabsTrigger key={method.id} value={method.id.toString()}>
                  {method.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Overall ROI
              </CardTitle>
              <CardDescription>
                Based on {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className={`rounded-full p-2 ${overallROI >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {overallROI >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(overallROI)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallROI >= 0 ? 'Return on investment' : 'Loss on investment'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Best Performing Method
              </CardTitle>
              <CardDescription>
                Highest return on investment
              </CardDescription>
            </div>
            <div className="rounded-full p-2 bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {best ? (
              <>
                <div className="text-2xl font-bold">
                  {best.adMethod?.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(best.roi)} ROI on {formatCurrency(best.spent)} spent
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Comparison with Area
              </CardTitle>
              <CardDescription>
                Your performance vs. local competitors
              </CardDescription>
            </div>
            <div className="rounded-full p-2 bg-blue-100">
              <InfoIcon className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {topPerformers && topPerformers.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {topPerformers[0]?.business?.name === business?.name 
                    ? "Top performer!" 
                    : `${formatPercent(stats?.averageRoi ?? 0)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {topPerformers[0]?.business?.name === business?.name 
                    ? "Your business leads in your area" 
                    : `Area average is ${formatPercent(
                        topPerformers.reduce((sum, c) => sum + c.roi, 0) / topPerformers.length
                      )}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No comparison data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {filtered.length === 0 && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There are no campaigns matching your current filter criteria. Try changing your filters or add new campaigns.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Detailed Analytics */}
      {filtered.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>ROI by Ad Method</CardTitle>
              <CardDescription>
                Compare performance across different advertising channels
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] min-h-[300px] min-w-[100px]">
              {adMethods && campaigns && campaigns.length > 0 && (
                <RoiByAdMethodChart campaigns={campaigns} adMethods={adMethods} />
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Monthly Performance Trend</CardTitle>
              <CardDescription>
                Track your advertising performance over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] min-h-[300px] min-w-[100px]">
              {campaigns && campaigns.length > 0 && (
                <MonthlyPerformanceTrendChart campaigns={campaigns} />
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Campaign Comparison</CardTitle>
              <CardDescription>
                Side-by-side analysis of campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] min-h-[400px] min-w-[100px]">
              {adMethods && campaigns && campaigns.length > 0 && (
                <CampaignComparisonChart campaigns={campaigns} adMethods={adMethods} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Geographic Performance */}
      {topPerformers && topPerformers.length > 0 && (
        <div className="mt-6">
          <GeographicPerformanceCard
            campaigns={campaigns}
            topPerformers={topPerformers}
            userLocation={business?.location ? {
              city: business.location.city,
              region: business.location.state
            } : undefined}
          />
        </div>
      )}
    </div>
  );
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="mt-4 md:mt-0">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-[400px]" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}