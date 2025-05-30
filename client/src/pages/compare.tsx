import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import CampaignDetailComparison from "@/components/comparison/CampaignDetailComparison";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ShoppingCart, Tag, BarChart2, LockIcon, Crown } from "lucide-react";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

export default function Compare() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const businessId = user?.businessId;
  const [selectedAdMethod, setSelectedAdMethod] = useState<string>("");
  const [searchRadius, setSearchRadius] = useState<string>("3");
  // Track selections by business ID rather than array index
  const [selectedPerformers, setSelectedPerformers] = useState<{[key: number]: boolean}>({});
  // Selected campaigns for side-by-side comparison
  const [comparisonCampaigns, setComparisonCampaigns] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  
  // Check if user is in trial period
  const { data: trialStatus, isLoading: isLoadingTrialStatus } = useQuery({
    queryKey: [`/api/user/${user?.id}/trial-status`],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await fetch(`/api/user/${user.id}/trial-status`);
        if (!res.ok) {
          console.log("Trial status fetch failed:", res.status);
          return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint fails
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching trial status:", error);
        return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint errors
      }
    },
    enabled: !!user?.id,
    retry: false // Don't retry if it fails
  });
  
  // Default to non-trial if not authenticated or error occurred
  const isTrialUser = user ? (trialStatus?.isTrialPeriod || false) : false;
  const remainingDays = trialStatus?.remainingDays || 0;

  const handleCheckboxChange = (index: number, businessId: number) => {
    // When selecting, store by business ID not by index
    setSelectedPerformers(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
    
    // Also log the campaign data to help debug
    const campaign = topPerformers?.[index];
    console.log(`Toggled selection for business ID ${businessId} at index ${index}`, 
      campaign ? { 
        campaignId: campaign.id, 
        businessId: campaign.businessId, 
        name: campaign.name 
      } : "Campaign not found");
  };

  const handlePurchase = () => {
    // Get all business IDs that are selected (true value)
    const selectedIds = Object.entries(selectedPerformers)
      .filter(([_, isSelected]) => isSelected) // Only keep entries where value is true
      .map(([businessId, _]) => businessId) // Get just the business IDs
      .join(',');
    
    console.log("Selected performers:", selectedPerformers);
    console.log("Selected business IDs to send:", selectedIds);
    
    if (selectedIds) {
      navigate(`/pricing-page?ids=${selectedIds}`);
    }
  };

  const getSelectedCount = () => {
    return Object.values(selectedPerformers).filter(Boolean).length;
  };

  // Fetch business details
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });

  // Fetch ad methods
  const { data: adMethods, isLoading: isLoadingAdMethods } = useQuery({
    queryKey: ['/api/ad-methods'],
  });

  // Fetch campaigns for this business
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
  });

  // Find the best performing campaign if no ad method is selected
  const bestCampaign = campaigns && campaigns.length > 0 
    ? campaigns.sort((a, b) => b.roi - a.roi)[0] 
    : null;
  
  // Use best campaign's ad method if none selected, or "all" for all methods
  const effectiveAdMethodId = selectedAdMethod || (bestCampaign?.adMethodId?.toString() || "all");
  
  // Get the name of the selected ad method
  const selectedAdMethodName = effectiveAdMethodId === "all" 
    ? "All Methods"
    : adMethods?.find(method => method.id.toString() === effectiveAdMethodId)?.name || "All Methods";

  // Fetch top performers (using simpler approach to avoid server-side filtering issues)
  const { data: unsortedPerformers, isLoading: isLoadingPerformers } = useQuery({
    queryKey: [`/api/top-performers`],
    enabled: true,
    retry: 3,
    staleTime: 0
  });
  
  // Filter performers by selected ad method, then sort by ROI (highest to lowest)
  const topPerformers = unsortedPerformers 
    ? [...unsortedPerformers]
        // Filter by selected ad method if one is selected
        .filter(performer => {
          // Always include your own business's campaigns
          if (performer.businessId === businessId) return true;
          
          // If "all" is selected or no ad method is selected, show all
          if (!effectiveAdMethodId || effectiveAdMethodId === "all") return true;
          
          // Otherwise, only show performers with the matching ad method
          return performer.adMethodId.toString() === effectiveAdMethodId;
        })
        .sort((a, b) => b.roi - a.roi) 
    : [];
    
  // Ensure we display at least 10 performers when "All Methods" is selected
  // This only applies to the leaderboard display, not to the chart
  const minimumDisplayCount = (!effectiveAdMethodId || effectiveAdMethodId === "all") ? 10 : 5;
  const leaderboardPerformers = [...topPerformers];
  
  // If we don't have enough performers and are in "All Methods" mode, 
  // fetch more from other methods until we reach our minimum
  if (leaderboardPerformers.length < minimumDisplayCount && unsortedPerformers && unsortedPerformers.length > leaderboardPerformers.length) {
    // Add any remaining performers that weren't included in the initial filtering
    const remainingPerformers = unsortedPerformers
      .filter(performer => !leaderboardPerformers.some(p => p.id === performer.id))
      .sort((a, b) => b.roi - a.roi);
      
    // Add performers until we reach our minimum or run out of performers
    let i = 0;
    while (leaderboardPerformers.length < minimumDisplayCount && i < remainingPerformers.length) {
      leaderboardPerformers.push(remainingPerformers[i]);
      i++;
    }
    
    // Re-sort the combined list by ROI
    leaderboardPerformers.sort((a, b) => b.roi - a.roi);
  }
  
  // Log data after it's loaded (separate effect instead of onSuccess)
  useEffect(() => {
    if (topPerformers && topPerformers.length > 0) {
      console.log("Top performers complete data:", topPerformers);
      console.log("Business IDs available:", topPerformers.map(item => item.businessId));
    }
  }, [topPerformers, effectiveAdMethodId]);

  // Format data for the chart - limit to top 10 businesses for better readability
  // if your business is outside the top 10, we'll include it anyway, replacing the 10th item
  let displayCampaigns = [...topPerformers];
  const yourBusinessIndex = displayCampaigns.findIndex(campaign => campaign.businessId === businessId);
  
  // If All Methods is selected, trim to top 10 businesses only
  if (!effectiveAdMethodId || effectiveAdMethodId === "all") {
    // If your business is in the top 10, just take the top 10
    if (yourBusinessIndex < 10) {
      displayCampaigns = displayCampaigns.slice(0, 10);
    } else {
      // If your business is outside top 10, take top 9 + your business
      const top9 = displayCampaigns.slice(0, 9);
      const yourBusiness = displayCampaigns[yourBusinessIndex];
      displayCampaigns = [...top9, yourBusiness];
    }
  }
  
  const chartData = displayCampaigns.map((campaign, index) => {
    return {
      name: campaign.businessId === businessId ? 'Your Business' : `Business #${index + 1}`,
      roi: parseFloat(campaign.roi.toFixed(1)),
      isYourBusiness: campaign.businessId === businessId
    };
  });

  // Calculate average ROI
  const averageRoi = topPerformers?.length 
    ? topPerformers.reduce((sum, campaign) => sum + campaign.roi, 0) / topPerformers.length 
    : 0;

  // Find your business's rank
  const yourBusinessRank = topPerformers?.findIndex(
    campaign => campaign.businessId === businessId
  );

  const isLoading = isLoadingBusiness || isLoadingAdMethods || isLoadingCampaigns || isLoadingPerformers;

  return (
    <AppLayout title="Compare Performance">
      {showComparison && (
        <CampaignDetailComparison 
          campaigns={comparisonCampaigns} 
          onClose={() => setShowComparison(false)}
        />
      )}
      
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Compare With Similar Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            See how your ROI compares to similar businesses in your area using the same advertisement methods.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advertisement Method
              </label>
              <Select 
                value={effectiveAdMethodId} 
                onValueChange={setSelectedAdMethod}
                disabled={isLoadingAdMethods}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {adMethods?.map(method => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius (miles)
              </label>
              <div className="flex">
                <Input 
                  type="number" 
                  value={searchRadius} 
                  onChange={(e) => setSearchRadius(e.target.value)}
                  min="1"
                  max="50"
                  className="rounded-r-none"
                />
                <Button 
                  type="button" 
                  className="rounded-l-none"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !topPerformers?.length ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-500">
                No data available for comparison. Try selecting a different advertisement method or increasing the search radius.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  Comparing ROI for {selectedAdMethodName}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600">Your ROI</p>
                    <p className={`text-lg font-bold ${
                      yourBusinessRank !== undefined && yourBusinessRank >= 0 && topPerformers[yourBusinessRank].roi > 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {yourBusinessRank !== undefined && yourBusinessRank >= 0 
                        ? formatPercent(topPerformers[yourBusinessRank].roi) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600">Area Average</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatPercent(averageRoi)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600">Your Rank</p>
                    <p className="text-lg font-bold text-primary">
                      {yourBusinessRank !== undefined && yourBusinessRank >= 0
                        ? `#${yourBusinessRank + 1} of ${topPerformers.length}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'ROI']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="roi" 
                      name="Return on Investment (%)"
                      fill="#42a5f5"
                      // Use Recharts' cell approach to color bars differently
                    >
                      {
                        chartData?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isYourBusiness ? '#1976D2' : '#42a5f5'} 
                          />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  {yourBusinessRank !== undefined && yourBusinessRank >= 0
                    ? yourBusinessRank === 0
                      ? `Congratulations! Your business has the highest ROI for ${selectedAdMethodName} in your area.`
                      : `You're ${formatPercent(
                          (topPerformers[0].roi - topPerformers[yourBusinessRank].roi) / 
                          topPerformers[yourBusinessRank].roi * 100
                        )} behind the top performer in your area.`
                    : `Your business doesn't have any campaigns using ${selectedAdMethodName}. Add campaigns with this method to see how you compare.`
                  }
                </p>
                
                {/* Recommendation section */}
                {effectiveAdMethodId === "all" && yourBusinessRank !== undefined && yourBusinessRank > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                    <h4 className="font-medium text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recommendation
                    </h4>
                    <p className="text-blue-700 mt-1">
                      Consider trying <strong>{topPerformers[0].adMethod?.name}</strong> which has the highest ROI 
                      of {formatPercent(topPerformers[0].roi)} in your area, compared to your current best 
                      of {formatPercent(topPerformers[yourBusinessRank].roi)} 
                      with {topPerformers[yourBusinessRank].adMethod?.name}.
                    </p>
                  </div>
                )}
                
                {effectiveAdMethodId !== "all" && yourBusinessRank !== undefined && yourBusinessRank > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                    <h4 className="font-medium text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Opportunity
                    </h4>
                    <p className="text-blue-700 mt-1">
                      The top performer with {selectedAdMethodName} is achieving {formatPercent(topPerformers[0].roi)} ROI. 
                      Study their campaign details to identify opportunities for improving your approach.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg">ROI Leaderboard</CardTitle>
              {!effectiveAdMethodId || effectiveAdMethodId === "all" ? (
                <CardDescription>
                  Showing top 10 performers across all advertisement methods
                </CardDescription>
              ) : (
                <CardDescription>
                  Showing top performers for {selectedAdMethodName}
                </CardDescription>
              )}
            </div>
            
            {isTrialUser && (
              <div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  <span>Premium Feature ({remainingDays} days left in trial)</span>
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !topPerformers?.length ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No data available for the leaderboard.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center py-2 font-medium text-gray-600">Select</th>
                    <th className="text-center py-2 font-medium text-gray-600">Rank</th>
                    <th className="text-left py-2 font-medium text-gray-600">Business</th>
                    <th className="text-left py-2 font-medium text-gray-600">Ad Method</th>
                    <th className="text-right py-2 font-medium text-gray-600">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardPerformers.slice(0, 10).map((campaign, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-200 ${campaign.businessId === businessId ? 'bg-gray-50' : ''}`}
                    >
                      <td className="py-3 pl-4 text-center">
                        <div className="flex flex-col gap-2">
                          {campaign.businessId !== businessId ? (
                            <>
                              {/* MODIFIED: Always showing SELECT buttons for demo purposes */}
                              {false && isTrialUser ? (
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger asChild>
                                      <div 
                                        style={{
                                          width: '100%',
                                          maxWidth: '150px',
                                          padding: '6px 12px',
                                          backgroundColor: '#f3f4f6',
                                          color: '#6b7280',
                                          fontWeight: 'bold',
                                          borderRadius: '4px',
                                          display: 'inline-block',
                                          textAlign: 'center',
                                          cursor: 'pointer',
                                          border: '1px solid #e5e7eb'
                                        }}
                                        onClick={() => {
                                          // Store the current business ID to pass to pricing
                                          const businessID = campaign.businessId;
                                          navigate(`/pricing-page?ids=${businessID}`);
                                        }}
                                      >
                                        <LockIcon className="h-3.5 w-3.5 inline-block mr-1" />
                                        <span>PREMIUM</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        Unlock competitor selection and detailed comparison with our premium plan
                                      </p>
                                    </TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              ) : (
                                <div 
                                  style={{
                                    width: '100%',
                                    maxWidth: '150px',
                                    padding: '6px 12px',
                                    backgroundColor: selectedPerformers[campaign.businessId] ? '#10B981' : '#3B82F6', 
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                  onClick={() => handleCheckboxChange(index, campaign.businessId)}
                                >
                                  {selectedPerformers[campaign.businessId] ? (
                                    <span>✓ SELECTED</span>
                                  ) : (
                                    <span>SELECT</span>
                                  )}
                                </div>
                              )}
                              
                              {/* MODIFIED: Compare button works for all users */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs py-1 font-normal"
                                onClick={() => {
                                  const yourCampaign = topPerformers.find(c => c.businessId === businessId);
                                  if (yourCampaign) {
                                    setComparisonCampaigns([yourCampaign, campaign]);
                                    setShowComparison(true);
                                  }
                                }}
                              >
                                <BarChart2 className="h-3 w-3 mr-1" />
                                Compare
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">YOUR BUSINESS</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">{index + 1}</td>
                      <td className="py-3">
                        {campaign.businessId === businessId 
                          ? 'Your Business' 
                          : `Business #${index + 1}`}
                      </td>
                      <td className="py-3">{campaign.adMethod?.name}</td>
                      <td className="py-3 text-right text-green-600 font-medium">
                        {/* MODIFIED: Always showing ROI data for demo purposes */}
                        {campaign.businessId === businessId || true || !isTrialUser
                          ? formatPercent(campaign.roi)
                          : (
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger className="cursor-help">
                                  <div className="flex items-center justify-end text-gray-400">
                                    <LockIcon className="h-3 w-3 mr-1" />
                                    <span>Premium Data</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unlock competitor ROI data with our premium plan</p>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="flex justify-between mt-4 items-center">
                <p className="text-sm text-gray-600">
                  {/* MODIFIED: Always showing selection count for demo purposes */}
                  {getSelectedCount() > 0 
                    ? `${getSelectedCount()} item${getSelectedCount() > 1 ? 's' : ''} selected (${formatCurrency(getSelectedCount() * 19.99)})` 
                    : "Select top performers to purchase their campaign details"
                  }
                </p>
                <Button
                  onClick={() => {
                    if (false && isTrialUser) {
                      // Redirect to pricing page for upgrading
                      window.location.href = '/minisite#pricing';
                    } else if (getSelectedCount() > 0) {
                      // For non-trial users with selections, get the selected IDs
                      const selectedIds = Object.entries(selectedPerformers)
                        .filter(([_, isSelected]) => isSelected)
                        .map(([businessId, _]) => businessId)
                        .join(',');
                      navigate(`/pricing-page?ids=${selectedIds}`);
                    }
                  }}
                  disabled={getSelectedCount() === 0}
                  className="flex items-center space-x-2"
                >
                  {false && isTrialUser ? (
                    <>
                      <Crown className="h-4 w-4" />
                      <span>Upgrade to Premium</span>
                    </>
                  ) : (
                    <>
                      <Tag className="h-4 w-4" />
                      <span>View Pricing Details</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
