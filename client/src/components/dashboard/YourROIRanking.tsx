import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Loader2, 
  AlertCircle,
  Info,
  Trophy,
  ChevronsUp,
  CircleDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { getQueryFn } from '@/lib/queryClient';
import { BusinessCampaignWithROI, Campaign } from '@shared/schema';

interface RankingFilters {
  businessType: string;
  adMethodId: number | null;
  radius: number;
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'all';
  normalizeByTime: boolean;
}

interface YourROIRankingProps {
  businessId: number;
  businessType: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF',
  '#FFD700', '#32CD32', '#FF69B4', '#1E90FF'
];

const calculateDurationDays = (campaign: Campaign): number => {
  if (!campaign.startDate || !campaign.endDate) return 30; // Default to 30 days if not specified
  
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateROI = (revenue: number, cost: number): number => {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
};

const calculateROAS = (revenue: number, cost: number): number => {
  if (cost === 0) return 0;
  return revenue / cost;
};

const YourROIRanking: React.FC<YourROIRankingProps> = ({ businessId, businessType }) => {
  const { user } = useAuth();
  
  // State for filters
  const [filters, setFilters] = useState<RankingFilters>({
    businessType: businessType,
    adMethodId: null,
    radius: 3, // Default 3 miles
    timeFrame: 'monthly',
    normalizeByTime: true
  });
  
  // Fetch ad methods
  const { data: adMethods, isLoading: loadingAdMethods } = useQuery<any[]>({
    queryKey: ['/api/ad-methods'],
    refetchOnWindowFocus: false
  });
  
  // Fetch top performers
  const { data: topPerformers, isLoading: loadingTopPerformers } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: ['/api/top-performers'],
    refetchOnWindowFocus: false
  });
  
  // Fetch your business data
  const { data: yourBusiness, isLoading: loadingYourBusiness } = useQuery<any>({
    queryKey: ['/api/business', businessId],
    refetchOnWindowFocus: false
  });
  
  // State for normalized performance data
  const [normalizedBusinesses, setNormalizedBusinesses] = useState<any[]>([]);
  const [yourRanking, setYourRanking] = useState<number | null>(null);
  const [topRankedBusiness, setTopRankedBusiness] = useState<any | null>(null);
  
  // Process and normalize the data
  useEffect(() => {
    if (!topPerformers || !yourBusiness || !adMethods) return;
    
    console.log("Your ROI Ranking - Top performers data:", topPerformers);
    console.log("Your business data:", yourBusiness);
    
    // Group campaigns by business
    const campaignsByBusiness = topPerformers.reduce((acc, campaign) => {
      const businessId = campaign.businessId;
      if (!acc[businessId]) {
        acc[businessId] = {
          id: businessId,
          business: campaign.business,
          campaigns: []
        };
      }
      acc[businessId].campaigns.push(campaign);
      return acc;
    }, {});
    
    const businesses = Object.values(campaignsByBusiness);
    
    // Filter businesses by type
    let filteredBusinesses = businesses.filter(business => 
      business.business?.name === filters.businessType || filters.businessType === ""
    );
    
    // Apply radius filter - for demo we're just keeping all businesses
    // In a real implementation, we would use distance calculation based on coordinates
    
    // Apply ad method filter if selected
    if (filters.adMethodId !== null) {
      filteredBusinesses = filteredBusinesses.map(business => ({
        ...business,
        campaigns: business.campaigns.filter(campaign => 
          campaign.adMethodId === filters.adMethodId
        )
      })).filter(business => business.campaigns.length > 0);
    }
    
    // Calculate normalized metrics for each business
    const normalized = filteredBusinesses.map((business: any) => {
      // Calculate total revenue and cost across all campaigns
      const totalRevenue = business.campaigns.reduce((sum: number, campaign: any) => 
        sum + (Number(campaign.amountEarned) || 0), 0);
      const totalCost = business.campaigns.reduce((sum: number, campaign: any) => 
        sum + (Number(campaign.amountSpent) || 0), 0);
      
      // Calculate ROI and ROAS
      const roi = calculateROI(totalRevenue, totalCost);
      const roas = calculateROAS(totalRevenue, totalCost);
      
      // Calculate total duration of all campaigns
      const totalDays = business.campaigns.reduce((sum: number, campaign: any) => 
        sum + calculateDurationDays(campaign), 0);
      
      // Calculate daily metrics
      const dailyROI = totalDays > 0 ? roi / totalDays : 0;
      const dailyROAS = totalDays > 0 ? roas / totalDays : 0;
      
      // Normalize based on selected time frame
      let normalizedROI = roi;
      let normalizedROAS = roas;
      
      if (filters.normalizeByTime) {
        switch (filters.timeFrame) {
          case 'daily':
            normalizedROI = dailyROI;
            normalizedROAS = dailyROAS;
            break;
          case 'weekly':
            normalizedROI = dailyROI * 7;
            normalizedROAS = dailyROAS * 7;
            break;
          case 'monthly':
            normalizedROI = dailyROI * 30;
            normalizedROAS = dailyROAS * 30;
            break;
          // For 'all', use the raw values
        }
      }
      
      return {
        ...business,
        totalRevenue,
        totalCost,
        roi,
        roas,
        normalizedROI,
        normalizedROAS,
        totalDays
      };
    });
    
    // Sort by normalized ROI (highest to lowest)
    const sortedBusinesses = [...normalized].sort((a, b) => 
      b.normalizedROI - a.normalizedROI
    );
    
    // Find your business's ranking
    const yourBusinessIndex = sortedBusinesses.findIndex(business => 
      business.id === businessId
    );
    
    setNormalizedBusinesses(sortedBusinesses);
    setYourRanking(yourBusinessIndex !== -1 ? yourBusinessIndex + 1 : null);
    setTopRankedBusiness(sortedBusinesses.length > 0 ? sortedBusinesses[0] : null);
    
  }, [topPerformers, yourBusiness, adMethods, filters, businessId]);
  
  // Loading state
  if (loadingAdMethods || loadingTopPerformers || loadingYourBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your ROI Ranking</CardTitle>
          <CardDescription>Loading ranking data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!topPerformers?.length || !yourBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your ROI Ranking</CardTitle>
          <CardDescription>Compare your ROI with similar businesses in your area</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No ranking data available</p>
          <p className="text-muted-foreground">
            Add some campaigns with cost and revenue data to see how you rank.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Your ROI Ranking</CardTitle>
            <CardDescription>
              Compare your ROI with similar businesses in your area
            </CardDescription>
          </div>
          
          {/* Your Ranking Badge */}
          {yourRanking !== null && (
            <div className="flex items-center gap-2">
              <Badge variant={yourRanking === 1 ? "destructive" : "outline"} className="text-base py-1.5 px-3">
                <Trophy className="h-4 w-4 mr-1" />
                Rank #{yourRanking} of {normalizedBusinesses.length}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-md border">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Ad Method</Label>
            <Select 
              value={filters.adMethodId !== null ? String(filters.adMethodId) : "all"}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                adMethodId: value === "all" ? null : Number(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Ad Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ad Methods</SelectItem>
                {adMethods?.map(method => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Radius</Label>
            <Select 
              value={String(filters.radius)}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                radius: Number(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="3 miles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mile</SelectItem>
                <SelectItem value="3">3 miles</SelectItem>
                <SelectItem value="5">5 miles</SelectItem>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Time Frame</Label>
            <div className="flex gap-4">
              <Select 
                value={filters.timeFrame}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'all') => 
                  setFilters(prev => ({...prev, timeFrame: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all">Actual Period</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="normalize"
                  checked={filters.normalizeByTime}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({...prev, normalizeByTime: !!checked}))}
                />
                <div className="flex items-center">
                  <Label htmlFor="normalize" className="text-sm cursor-pointer">Normalize</Label>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Normalizing adjusts ROI values to account for different campaign durations, allowing fair comparison between campaigns of different lengths</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Performer Summary */}
        {topRankedBusiness && (
          <div className="mb-6">
            <Tabs defaultValue="roi">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roi">ROI Comparison</TabsTrigger>
                <TabsTrigger value="details">Detailed Rankings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="roi" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performer Card */}
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-green-800">
                        Top Performer
                      </h3>
                    </div>
                    <p className="text-sm text-green-700 font-medium mb-3">
                      Business Type: {topRankedBusiness.businessType}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-1"><span className="font-medium">ROI:</span> {formatPercentage(topRankedBusiness.normalizedROI)}</p>
                        <p className="text-sm mb-1"><span className="font-medium">Revenue:</span> {formatCurrency(topRankedBusiness.totalRevenue)}</p>
                        <p className="text-sm"><span className="font-medium">Methods:</span> {topRankedBusiness.campaigns.length} campaigns</p>
                      </div>
                      <div>
                        <p className="text-sm mb-1"><span className="font-medium">ROAS:</span> {topRankedBusiness.normalizedROAS.toFixed(2)}x</p>
                        <p className="text-sm mb-1"><span className="font-medium">Cost:</span> {formatCurrency(topRankedBusiness.totalCost)}</p>
                        <p className="text-sm"><span className="font-medium">Period:</span> {topRankedBusiness.totalDays} days</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        Top Ad Methods: {" "}
                        {topRankedBusiness.campaigns
                          .slice(0, 2)
                          .map(campaign => {
                            const method = adMethods?.find(m => m.id === campaign.adMethodId);
                            return method?.name || 'Unknown';
                          })
                          .filter((v, i, a) => a.indexOf(v) === i) // Unique values
                          .join(', ')}
                        {topRankedBusiness.campaigns.length > 2 ? ' and more' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Your Performance vs Top */}
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-800">
                        Your Performance
                      </h3>
                    </div>
                    <p className="text-sm text-blue-700 font-medium mb-3">
                      {yourBusiness.name}
                    </p>
                    
                    {/* Your stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Your ROI:</span> {" "}
                          {formatPercentage(normalizedBusinesses.find(b => b.id === businessId)?.normalizedROI || 0)}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Your Revenue:</span> {" "}
                          {formatCurrency(normalizedBusinesses.find(b => b.id === businessId)?.totalRevenue || 0)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Your Campaigns:</span> {" "}
                          {normalizedBusinesses.find(b => b.id === businessId)?.campaigns.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Difference:</span> {" "}
                          <span className={
                            normalizedBusinesses.find(b => b.id === businessId)?.normalizedROI >= topRankedBusiness.normalizedROI
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }>
                            {formatPercentage(
                              (normalizedBusinesses.find(b => b.id === businessId)?.normalizedROI || 0) - 
                              topRankedBusiness.normalizedROI
                            )}
                          </span>
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Ranking:</span> {" "}
                          {yourRanking} of {normalizedBusinesses.length}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Area:</span> {" "}
                          {filters.radius} mile radius
                        </p>
                      </div>
                    </div>
                    
                    {/* Performance tip */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      {yourRanking !== 1 ? (
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Tip:</span> {" "}
                          Consider trying {topRankedBusiness.campaigns
                            .map(campaign => {
                              const method = adMethods?.find(m => m.id === campaign.adMethodId);
                              return method?.name;
                            })
                            .filter(Boolean)
                            .filter((v, i, a) => a.indexOf(v) === i)[0]} for better ROI
                        </p>
                      ) : (
                        <p className="text-sm text-blue-800 font-medium">
                          <span className="font-medium">Great job!</span> {" "}
                          You're the top performer in your area
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* ROI Comparison Chart */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold mb-4">ROI Comparison {filters.adMethodId !== null && `for ${adMethods?.find(m => m.id === filters.adMethodId)?.name}`}</h3>
                  
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={normalizedBusinesses.slice(0, 5).map(business => ({
                          ...business,
                          name: business.id === businessId ? 'Your Business' : `Business ${business.id}`,
                          isYou: business.id === businessId
                        }))}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip 
                          formatter={(value: number, name, entry) => {
                            if (name === 'normalizedROI') return [`${value.toFixed(2)}%`, 'ROI'];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar 
                          dataKey="normalizedROI" 
                          name="ROI" 
                          fill="#0088FE"
                        >
                          {normalizedBusinesses.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.id === businessId ? '#FF8042' : COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Ad Methods</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedBusinesses.map((business, index) => (
                        <TableRow 
                          key={business.id}
                          className={business.id === businessId ? "bg-blue-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {index === 0 ? (
                              <span className="flex items-center">
                                <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                                {index + 1}
                              </span>
                            ) : (
                              index + 1
                            )}
                          </TableCell>
                          <TableCell>
                            {business.id === businessId ? (
                              <span className="font-medium">Your Business</span>
                            ) : (
                              `Business ${business.id}`
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPercentage(business.normalizedROI)}
                          </TableCell>
                          <TableCell className="text-right">
                            {business.normalizedROAS.toFixed(2)}x
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(business.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(business.totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {business.campaigns.length}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {normalizedBusinesses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No businesses match the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Formula Explanation */}
                <div className="mt-6 p-4 bg-slate-50 rounded-md border">
                  <h4 className="font-medium mb-2">How Rankings Are Calculated</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    For fair comparison, we normalize ROI across different campaign durations:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <h5 className="text-sm font-medium mb-1">ROI Formula</h5>
                      <p className="text-sm">
                        ((Revenue - Cost) / Cost) × 100
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">ROAS Formula</h5>
                      <p className="text-sm">
                        Revenue / Cost
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Note: Time normalization adjusts these metrics to account for different campaign durations, allowing fair comparison between short and long campaigns.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YourROIRanking;