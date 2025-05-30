import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Crown, LockIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Business, BusinessCampaignWithROI } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TopPerformers() {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const [, setLocation] = useLocation();

  // Check if user is in trial period
  const { data: trialStatus, isLoading: isLoadingTrialStatus } = useQuery({
    queryKey: [`/api/user/${user?.id}/trial-status`],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await fetch(`/api/user/${user.id}/trial-status`);
        if (!res.ok) {
          console.log("TopPerformers: Trial status fetch failed:", res.status);
          return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint fails
        }
        return res.json();
      } catch (error) {
        console.error("TopPerformers: Error fetching trial status:", error);
        return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint errors
      }
    },
    enabled: !!user?.id,
    retry: false // Don't retry if it fails
  });
  
  // Default to non-trial if not authenticated or error occurred
  const isTrialUser = user ? (trialStatus?.isTrialPeriod || false) : false;
  const remainingDays = trialStatus?.remainingDays || 0;

  const { data: business } = useQuery<Business>({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });

  const { data: campaigns } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
  });

  // Find the best campaign for this business
  const bestCampaign = campaigns?.sort((a: BusinessCampaignWithROI, b: BusinessCampaignWithROI) => b.roi - a.roi)[0];

  // Query top performers based on this business's best campaign
  const { data: unsortedTopPerformers, isLoading } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: [`/api/top-performers`],
    queryFn: async () => {
      if (!business?.businessType || !bestCampaign?.adMethodId || !business?.latitude || !business?.longitude) {
        return [];
      }
      
      const params = new URLSearchParams({
        businessType: business.businessType,
        adMethodId: bestCampaign.adMethodId.toString(),
        latitude: business.latitude.toString(),
        longitude: business.longitude.toString(),
        radius: '3', // 3 mile radius
        limit: isTrialUser ? '25' : '5' // Show top 25 for trial users, 5 for paid users
      });
      
      const res = await fetch(`/api/top-performers?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch top performers');
      }
      return res.json();
    },
    enabled: !!business && !!bestCampaign && !!business.latitude && !!business.longitude,
  });
  
  // Sort top performers by ROI (highest to lowest)
  // For demo account (user ID 2), filter out 'Your Business' from the list
  const isDemo = user?.id === 2;
  let sortedPerformers = unsortedTopPerformers ? [...unsortedTopPerformers].sort((a, b) => b.roi - a.roi) : [];
  
  // For demo account, remove your own business from the dashboard view
  const topPerformers = isDemo 
    ? sortedPerformers.filter(campaign => campaign.businessId !== businessId)
    : sortedPerformers;

  if (isLoading || isLoadingTrialStatus) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Top Performers Near You</CardTitle>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 mb-4" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (!topPerformers || topPerformers.length === 0) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Top Performers Near You</CardTitle>
            <Button 
              variant="link" 
              className="text-primary text-sm"
              onClick={() => setLocation('/compare')}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-gray-500">
              Not enough data to show top performers in your area. Add more campaigns or wait for other businesses to add theirs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the index of the current business in the top performers
  const yourBusinessIndex = topPerformers.findIndex(
    (campaign: BusinessCampaignWithROI) => campaign.businessId === businessId
  );

  return (
    <Card className="bg-white mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Top Performers Near You</CardTitle>
            {isTrialUser && (
              <CardDescription className="text-sm">
                Trial mode: {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
              </CardDescription>
            )}
          </div>
          <Button 
            variant="link" 
            className="text-primary text-sm"
            onClick={() => setLocation('/compare')}
          >
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-center py-2 font-medium text-gray-600">Rank</th>
                <th className="text-left py-2 font-medium text-gray-600">Business</th>
                <th className="text-left py-2 font-medium text-gray-600">Ad Method</th>
                <th className="text-right py-2 font-medium text-gray-600">ROI</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((campaign: BusinessCampaignWithROI, index: number) => {
                // For trial users, show the top 25 but ghost out top 10 (except their own business)
                const isTop10 = index < 10;
                const isGhosted = isTrialUser && isTop10 && campaign.businessId !== businessId;
                
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-200 ${campaign.businessId === businessId ? 'bg-gray-50' : ''}`}
                  >
                    <td className="py-3 text-center relative">
                      {index + 1}
                      {isTop10 && (
                        <span className="ml-1 inline-block">
                          <Crown className="h-3 w-3 text-amber-500" />
                        </span>
                      )}
                      {isGhosted && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="absolute right-1 top-3">
                                <LockIcon className="h-3 w-3 text-gray-400" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upgrade to view Top 10 performers</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                    <td className="py-3">
                      {campaign.businessId === businessId 
                        ? 'Your Business' 
                        : `Business #${index + 1}`}
                      {isTop10 && (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                          TOP 10
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      {isGhosted ? (
                        <div className="flex items-center">
                          <div className="w-20 h-4 bg-gray-200 rounded-sm"></div>
                          <LockIcon className="h-3 w-3 ml-2 text-gray-400" />
                        </div>
                      ) : (
                        campaign.adMethod?.name
                      )}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {isGhosted ? (
                        <div className="flex items-center justify-end">
                          <div className="w-12 h-4 bg-gray-200 rounded-sm"></div>
                          <LockIcon className="h-3 w-3 ml-2 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-green-600">{campaign.roi.toFixed(1)}%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {isTrialUser && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-indigo-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-indigo-700 flex items-center">
                <LockIcon className="h-4 w-4 mr-2" />
                <span>
                  <strong>Upgrade now</strong> to unlock Top 10 performer details and gain valuable competitor insights!
                </span>
              </p>
              <Button 
                size="sm" 
                variant="default" 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => window.location.href = '/minisite#pricing'}
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
