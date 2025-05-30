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
  Info
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
import { AdMethod, BusinessCampaignWithROI, Campaign } from '@shared/schema';

// Type definitions
interface PerformanceFilters {
  businessTypes: string[];
  adMethods: number[];
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'all';
  minROI: number | null;
  location: {
    city?: string;
    state?: string;
    radius?: number;
  };
  normalizeByTime: boolean;
}

interface NormalizedCampaign extends Campaign {
  normalizedROI: number;
  normalizedROAS: number;
  durationDays: number;
  roi: number;
  roas: number;
  adMethodName?: string;
}

interface AdMethodPerformance {
  adMethodId: number;
  adMethodName: string;
  averageROI: number;
  averageROAS: number;
  totalRevenue: number;
  totalCost: number;
  campaignCount: number;
  // For time-normalized metrics
  dailyROI: number;
  dailyROAS: number;
  weeklyROI: number;
  weeklyROAS: number;
  monthlyROI: number;
  monthlyROAS: number;
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

const AdPerformanceComparison: React.FC = () => {
  // State for filters
  const [filters, setFilters] = useState<PerformanceFilters>({
    businessTypes: [],
    adMethods: [],
    timeFrame: 'monthly',
    minROI: null,
    location: {},
    normalizeByTime: true
  });
  
  const [activeTab, setActiveTab] = useState<string>('comparison');
  
  // Fetch ad methods
  const { data: adMethods, isLoading: loadingAdMethods } = useQuery<AdMethod[]>({
    queryKey: ['/api/ad-methods'],
    refetchOnWindowFocus: false
  });
  
  // Fetch business types
  const { data: businessTypes, isLoading: loadingBusinessTypes } = useQuery<{ id: number, name: string }[]>({
    queryKey: ['/api/business-types'],
    refetchOnWindowFocus: false
  });
  
  // Fetch top performers to analyze campaigns
  const { data: topPerformers, isLoading: loadingTopPerformers } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: ['/api/top-performers'],
    refetchOnWindowFocus: false
  });
  
  // Normalized campaign data
  const [normalizedCampaigns, setNormalizedCampaigns] = useState<NormalizedCampaign[]>([]);
  
  // Ad method performance metrics
  const [adMethodPerformance, setAdMethodPerformance] = useState<AdMethodPerformance[]>([]);
  
  // Process campaign data when available
  useEffect(() => {
    if (!topPerformers || !adMethods) return;
    
    console.log("Top performers data:", topPerformers);
    
    // Based on the console logs, the topPerformers are already campaign objects with business and adMethod embedded
    const allCampaigns = topPerformers.map(campaign => {
      // Get the business and adMethod info from the embedded objects
      const business = campaign.business || {};
      const adMethod = campaign.adMethod || {};
      
      return {
        ...campaign,
        businessType: business.name || '',
        businessCity: '',  // These might not be available in the current API response
        businessState: '',
        adMethodName: adMethod.name || 'Unknown',
        durationDays: calculateDurationDays(campaign),
        roi: campaign.roi || calculateROI(Number(campaign.amountEarned) || 0, Number(campaign.amountSpent) || 0),
        roas: calculateROAS(Number(campaign.amountEarned) || 0, Number(campaign.amountSpent) || 0),
        normalizedROI: 0, // Will be calculated below
        normalizedROAS: 0 // Will be calculated below
      };
    });
    
    // Calculate normalized ROI and ROAS based on time period
    const normalized = allCampaigns.map(campaign => {
      const dailyROI = campaign.roi / campaign.durationDays;
      const dailyROAS = campaign.roas / campaign.durationDays;
      
      let normalizedROI = campaign.roi;
      let normalizedROAS = campaign.roas;
      
      // Normalize based on selected time frame
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
        ...campaign,
        normalizedROI,
        normalizedROAS
      };
    });
    
    setNormalizedCampaigns(normalized);
    
    // Calculate performance metrics by ad method
    const adMethodStats = adMethods.map(method => {
      const methodCampaigns = normalized.filter(c => c.adMethodId === method.id);
      const campaignCount = methodCampaigns.length;
      
      if (campaignCount === 0) {
        return {
          adMethodId: method.id,
          adMethodName: method.name,
          averageROI: 0,
          averageROAS: 0,
          totalRevenue: 0,
          totalCost: 0,
          campaignCount: 0,
          dailyROI: 0,
          dailyROAS: 0,
          weeklyROI: 0,
          weeklyROAS: 0,
          monthlyROI: 0,
          monthlyROAS: 0,
        };
      }
      
      const totalROI = methodCampaigns.reduce((sum, c) => sum + c.roi, 0);
      const totalROAS = methodCampaigns.reduce((sum, c) => sum + c.roas, 0);
      const totalRevenue = methodCampaigns.reduce((sum, c) => sum + (Number(c.amountEarned) || 0), 0);
      const totalCost = methodCampaigns.reduce((sum, c) => sum + (Number(c.amountSpent) || 0), 0);
      
      // Calculate daily averages
      const totalDays = methodCampaigns.reduce((sum, c) => sum + c.durationDays, 0);
      const avgDailyROI = totalDays > 0 ? totalROI / totalDays : 0;
      const avgDailyROAS = totalDays > 0 ? totalROAS / totalDays : 0;
      
      return {
        adMethodId: method.id,
        adMethodName: method.name,
        averageROI: campaignCount > 0 ? totalROI / campaignCount : 0,
        averageROAS: campaignCount > 0 ? totalROAS / campaignCount : 0,
        totalRevenue,
        totalCost,
        campaignCount,
        dailyROI: avgDailyROI,
        dailyROAS: avgDailyROAS,
        weeklyROI: avgDailyROI * 7,
        weeklyROAS: avgDailyROAS * 7,
        monthlyROI: avgDailyROI * 30,
        monthlyROAS: avgDailyROAS * 30,
      };
    });
    
    setAdMethodPerformance(adMethodStats);
  }, [topPerformers, adMethods, filters.timeFrame, filters.normalizeByTime]);
  
  // Filter campaigns based on selected criteria
  const filteredCampaigns = normalizedCampaigns.filter(campaign => {
    // Filter by business type
    if (filters.businessTypes.length > 0 && !filters.businessTypes.includes(campaign.businessType || '')) {
      return false;
    }
    
    // Filter by ad method
    if (filters.adMethods.length > 0 && !filters.adMethods.includes(campaign.adMethodId)) {
      return false;
    }
    
    // Filter by minimum ROI
    if (filters.minROI !== null && campaign.normalizedROI < filters.minROI) {
      return false;
    }
    
    // Filter by location
    if (filters.location.city && campaign.businessCity !== filters.location.city) {
      return false;
    }
    
    if (filters.location.state && campaign.businessState !== filters.location.state) {
      return false;
    }
    
    return true;
  });
  
  // Calculate performance metrics for filtered campaigns
  const filteredAdMethodPerformance = adMethodPerformance.map(method => {
    const methodCampaigns = filteredCampaigns.filter(c => c.adMethodId === method.adMethodId);
    const campaignCount = methodCampaigns.length;
    
    if (campaignCount === 0) {
      return {
        ...method,
        averageROI: 0,
        averageROAS: 0,
        totalRevenue: 0,
        totalCost: 0,
        campaignCount: 0,
      };
    }
    
    const totalROI = methodCampaigns.reduce((sum, c) => sum + c.normalizedROI, 0);
    const totalROAS = methodCampaigns.reduce((sum, c) => sum + c.normalizedROAS, 0);
    const totalRevenue = methodCampaigns.reduce((sum, c) => sum + (Number(c.amountEarned) || 0), 0);
    const totalCost = methodCampaigns.reduce((sum, c) => sum + (Number(c.amountSpent) || 0), 0);
    
    return {
      ...method,
      averageROI: campaignCount > 0 ? totalROI / campaignCount : 0,
      averageROAS: campaignCount > 0 ? totalROAS / campaignCount : 0,
      totalRevenue,
      totalCost,
      campaignCount,
    };
  }).filter(method => method.campaignCount > 0); // Only show methods with campaigns
  
  // Get the best performing ad method based on average ROI
  const bestPerformingMethod = [...filteredAdMethodPerformance]
    .sort((a, b) => {
      if (activeTab === 'roi') {
        return b.averageROI - a.averageROI;
      }
      return b.averageROAS - a.averageROAS;
    })[0];
  
  // Loading state
  if (loadingAdMethods || loadingBusinessTypes || loadingTopPerformers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Comparison</CardTitle>
          <CardDescription>Loading campaign data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!adMethods?.length || !topPerformers?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Comparison</CardTitle>
          <CardDescription>Compare the performance of different advertising methods</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No campaign data available</p>
          <p className="text-muted-foreground">
            Add some campaigns with cost and revenue data to see performance comparisons.
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ad Performance Comparison</CardTitle>
        <CardDescription>
          Compare the performance of different advertising methods based on Return on Investment (ROI) and Return on Ad Spend (ROAS)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-md border">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Business Type</Label>
            <Select 
              value={filters.businessTypes.length ? filters.businessTypes[0] : "all"}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                businessTypes: value === "all" ? [] : [value]
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Business Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Types</SelectItem>
                {businessTypes?.map(type => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
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
                        <p>Normalizing adjusts ROI and ROAS values to account for different campaign durations, allowing fair comparison</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Minimum ROI</Label>
            <Select 
              value={filters.minROI?.toString() || "none"}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                minROI: value === "none" ? null : Number(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No Minimum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Minimum</SelectItem>
                <SelectItem value="0">0% or higher</SelectItem>
                <SelectItem value="50">50% or higher</SelectItem>
                <SelectItem value="100">100% or higher</SelectItem>
                <SelectItem value="200">200% or higher</SelectItem>
                <SelectItem value="500">500% or higher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Metrics */}
        <Tabs defaultValue="comparison" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            <TabsTrigger value="roas">ROAS Analysis</TabsTrigger>
          </TabsList>
          
          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-4">
            <div className="space-y-6">
              {/* Best Method Summary */}
              {bestPerformingMethod && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h3 className="text-lg font-semibold mb-2 text-green-800">
                    Best Performing Advertising Method
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        {bestPerformingMethod.adMethodName}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Average ROI:</span>{' '}
                          {bestPerformingMethod.averageROI.toFixed(2)}%
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Average ROAS:</span>{' '}
                          {bestPerformingMethod.averageROAS.toFixed(2)}x
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Total Revenue:</span>{' '}
                          {formatCurrency(bestPerformingMethod.totalRevenue)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Total Cost:</span>{' '}
                          {formatCurrency(bestPerformingMethod.totalCost)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Campaigns:</span>{' '}
                          {bestPerformingMethod.campaignCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      {filters.normalizeByTime && (
                        <div className="w-full max-w-md">
                          <p className="text-sm font-medium mb-2 text-center text-green-700">
                            Performance by Time Period
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white p-2 rounded border">
                              <p className="text-xs font-medium">Daily</p>
                              <p className="text-lg font-bold">{bestPerformingMethod.dailyROI.toFixed(1)}%</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <p className="text-xs font-medium">Weekly</p>
                              <p className="text-lg font-bold">{bestPerformingMethod.weeklyROI.toFixed(1)}%</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <p className="text-xs font-medium">Monthly</p>
                              <p className="text-lg font-bold">{bestPerformingMethod.monthlyROI.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Method Comparison */}
              <div>
                <h3 className="text-md font-semibold mb-3">Method Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ROI Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredAdMethodPerformance.sort((a, b) => b.averageROI - a.averageROI)}
                        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="adMethodName" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60}
                          interval={0}
                        />
                        <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                          labelFormatter={(label) => `Ad Method: ${label}`}
                        />
                        <Bar 
                          dataKey="averageROI" 
                          name="Average ROI" 
                          fill="#0088FE"
                        >
                          {filteredAdMethodPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* ROAS Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredAdMethodPerformance.sort((a, b) => b.averageROAS - a.averageROAS)}
                        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="adMethodName" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60}
                          interval={0}
                        />
                        <YAxis label={{ value: 'ROAS', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROAS']}
                          labelFormatter={(label) => `Ad Method: ${label}`}
                        />
                        <Bar 
                          dataKey="averageROAS" 
                          name="Average ROAS" 
                          fill="#00C49F"
                        >
                          {filteredAdMethodPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Data Table */}
              <div>
                <h3 className="text-md font-semibold mb-3">Detailed Method Comparison</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad Method</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Campaigns</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdMethodPerformance
                        .sort((a, b) => b.averageROI - a.averageROI)
                        .map((method) => (
                          <TableRow key={method.adMethodId}>
                            <TableCell className="font-medium">{method.adMethodName}</TableCell>
                            <TableCell className="text-right">{method.averageROI.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{method.averageROAS.toFixed(2)}x</TableCell>
                            <TableCell className="text-right">{formatCurrency(method.totalRevenue)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(method.totalCost)}</TableCell>
                            <TableCell className="text-right">{method.campaignCount}</TableCell>
                          </TableRow>
                        ))}
                      {filteredAdMethodPerformance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No data available for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* ROI Analysis Tab */}
          <TabsContent value="roi" className="mt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ROI Comparison Chart */}
                <div className="h-96">
                  <h3 className="text-md font-semibold mb-3">ROI by Ad Method</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={filteredAdMethodPerformance.sort((a, b) => b.averageROI - a.averageROI)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: 'ROI (%)', position: 'bottom' }} />
                      <YAxis 
                        dataKey="adMethodName" 
                        type="category" 
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                        labelFormatter={(label) => `Ad Method: ${label}`}
                      />
                      <Bar 
                        dataKey="averageROI" 
                        name="Average ROI" 
                        fill="#0088FE"
                      >
                        {filteredAdMethodPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Time Period Analysis */}
                {filters.normalizeByTime && (
                  <div className="h-96">
                    <h3 className="text-md font-semibold mb-3">ROI by Time Period</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={filteredAdMethodPerformance
                          .sort((a, b) => {
                            if (filters.timeFrame === 'daily') return b.dailyROI - a.dailyROI;
                            if (filters.timeFrame === 'weekly') return b.weeklyROI - a.weeklyROI;
                            return b.monthlyROI - a.monthlyROI;
                          })
                          .slice(0, 5)} // Top 5 for readability
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="adMethodName" />
                        <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']} />
                        <Legend />
                        <Bar 
                          dataKey="dailyROI" 
                          name="Daily ROI" 
                          fill="#8884d8"
                        />
                        <Bar 
                          dataKey="weeklyROI" 
                          name="Weekly ROI" 
                          fill="#82ca9d"
                        />
                        <Bar 
                          dataKey="monthlyROI" 
                          name="Monthly ROI" 
                          fill="#ffc658"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              
              {/* Individual Campaigns */}
              <div>
                <h3 className="text-md font-semibold mb-3">Top ROI Campaigns</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Ad Method</TableHead>
                        <TableHead className="text-right">Duration (days)</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            Normalized ROI
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>ROI normalized to the selected time period ({filters.timeFrame})</p>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns
                        .sort((a, b) => {
                          if (filters.normalizeByTime) {
                            return b.normalizedROI - a.normalizedROI;
                          }
                          return b.roi - a.roi;
                        })
                        .slice(0, 5) // Show top 5 campaigns
                        .map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.adMethodName}</TableCell>
                            <TableCell className="text-right">{campaign.durationDays}</TableCell>
                            <TableCell className="text-right">{campaign.roi.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{campaign.normalizedROI.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.revenue || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.cost || 0)}</TableCell>
                          </TableRow>
                        ))}
                      {filteredCampaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No campaigns available for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* ROAS Analysis Tab */}
          <TabsContent value="roas" className="mt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ROAS Comparison Chart */}
                <div className="h-96">
                  <h3 className="text-md font-semibold mb-3">ROAS by Ad Method</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={filteredAdMethodPerformance.sort((a, b) => b.averageROAS - a.averageROAS)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: 'ROAS', position: 'bottom' }} />
                      <YAxis 
                        dataKey="adMethodName" 
                        type="category" 
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROAS']}
                        labelFormatter={(label) => `Ad Method: ${label}`}
                      />
                      <Bar 
                        dataKey="averageROAS" 
                        name="Average ROAS" 
                        fill="#00C49F"
                      >
                        {filteredAdMethodPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Revenue vs Cost */}
                <div className="h-96">
                  <h3 className="text-md font-semibold mb-3">Revenue vs Cost by Ad Method</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={filteredAdMethodPerformance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="adMethodName" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                      <Bar dataKey="totalCost" name="Cost" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Individual Campaigns */}
              <div>
                <h3 className="text-md font-semibold mb-3">Top ROAS Campaigns</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Ad Method</TableHead>
                        <TableHead className="text-right">Duration (days)</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            Normalized ROAS
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>ROAS normalized to the selected time period ({filters.timeFrame})</p>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns
                        .sort((a, b) => {
                          if (filters.normalizeByTime) {
                            return b.normalizedROAS - a.normalizedROAS;
                          }
                          return b.roas - a.roas;
                        })
                        .slice(0, 5) // Show top 5 campaigns
                        .map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.adMethodName}</TableCell>
                            <TableCell className="text-right">{campaign.durationDays}</TableCell>
                            <TableCell className="text-right">{campaign.roas.toFixed(2)}x</TableCell>
                            <TableCell className="text-right">{campaign.normalizedROAS.toFixed(2)}x</TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.revenue || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.cost || 0)}</TableCell>
                          </TableRow>
                        ))}
                      {filteredCampaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No campaigns available for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Formula Reference */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-md font-semibold mb-2">Formulas Used</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Return on Investment (ROI)</h4>
              <p className="text-sm">
                ROI = ((Revenue - Cost) / Cost) × 100
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Measures the percentage return relative to the investment cost
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Return on Ad Spend (ROAS)</h4>
              <p className="text-sm">
                ROAS = Revenue / Cost
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Measures the revenue generated for each dollar spent on advertising
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdPerformanceComparison;