import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircularProgressbar,
  CircularProgressbarWithChildren,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { SearchIcon, Loader2, BarChart, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, FileBarChart, FileCheck, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart as RechartsBarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

// Type for campaign data
interface Campaign {
  id: number;
  businessId: number;
  businessName: string;
  name: string;
  adMethodId: number;
  adMethodName: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string | null;
  status: string;
  revenue: number;
  roi: number;
}

interface BusinessType {
  id: number;
  name: string;
}

interface AdMethod {
  id: number;
  name: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  averageROI: number;
  totalSpent: number;
  totalRevenue: number;
  campaignsByMethod: { name: string; value: number }[];
  campaignsByStatus: { name: string; value: number }[];
  roiByMethod: { name: string; value: number }[];
  monthlySpend: { date: string; spend: number }[];
}

export default function CampaignManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [adMethodFilter, setAdMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all campaigns
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
  });

  // Fetch business types
  const { data: businessTypes } = useQuery<BusinessType[]>({
    queryKey: ['/api/business-types'],
    queryFn: async () => {
      const res = await fetch('/api/business-types');
      if (!res.ok) throw new Error('Failed to fetch business types');
      return res.json();
    },
  });

  // Fetch ad methods
  const { data: adMethods } = useQuery<AdMethod[]>({
    queryKey: ['/api/ad-methods'],
    queryFn: async () => {
      const res = await fetch('/api/ad-methods');
      if (!res.ok) throw new Error('Failed to fetch ad methods');
      return res.json();
    },
  });

  // Calculate campaign statistics
  const campaignStats: CampaignStats | null = campaigns ? {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status.toLowerCase() === 'active').length,
    averageROI: campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length || 0,
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
    campaignsByMethod: adMethods?.map(method => ({
      name: method.name,
      value: campaigns.filter(c => c.adMethodId === method.id).length
    })) || [],
    campaignsByStatus: [
      { name: 'Active', value: campaigns.filter(c => c.status.toLowerCase() === 'active').length },
      { name: 'Completed', value: campaigns.filter(c => c.status.toLowerCase() === 'completed').length },
      { name: 'Paused', value: campaigns.filter(c => c.status.toLowerCase() === 'paused').length }
    ],
    roiByMethod: adMethods?.map(method => {
      const methodCampaigns = campaigns.filter(c => c.adMethodId === method.id);
      const avgRoi = methodCampaigns.length > 0
        ? methodCampaigns.reduce((sum, c) => sum + c.roi, 0) / methodCampaigns.length
        : 0;
      return { name: method.name, value: avgRoi };
    }) || [],
    monthlySpend: calculateMonthlySpend(campaigns)
  } : null;

  // Function to calculate monthly spend from campaigns
  function calculateMonthlySpend(campaigns: Campaign[]): { date: string; spend: number }[] {
    const months: Record<string, number> = {};
    
    campaigns.forEach(campaign => {
      const startDate = new Date(campaign.startDate);
      const endDate = campaign.endDate ? new Date(campaign.endDate) : new Date();
      
      let currentDate = new Date(startDate);
      currentDate.setDate(1); // Start from the 1st of the month
      
      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!months[monthKey]) {
          months[monthKey] = 0;
        }
        
        // Distribute the spent amount proportionally across months
        const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const daysToCount = Math.min(
          daysInMonth,
          Math.round((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        const proportion = daysToCount / totalDays;
        months[monthKey] += campaign.spent * proportion;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(months)
      .map(([date, spend]) => ({ date, spend }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Filter campaigns based on search term and filters
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBusiness = businessFilter === "all" || campaign.businessName === businessFilter;
    const matchesAdMethod = adMethodFilter === "all" || campaign.adMethodId === Number(adMethodFilter);
    const matchesStatus = statusFilter === "all" || campaign.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && campaign.status.toLowerCase() === "active") ||
                      (activeTab === "completed" && campaign.status.toLowerCase() === "completed") ||
                      (activeTab === "paused" && campaign.status.toLowerCase() === "paused");
    
    return matchesSearch && matchesBusiness && matchesAdMethod && matchesStatus && matchesTab;
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Campaigns Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <CircularProgressbar
                  value={campaignStats?.activeCampaigns || 0}
                  maxValue={campaignStats?.totalCampaigns || 1}
                  text={`${campaignStats?.activeCampaigns || 0}`}
                  styles={buildStyles({
                    textSize: '2rem',
                    pathColor: '#4f46e5',
                    textColor: '#4f46e5',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Active Campaigns</h3>
                <p className="text-sm text-gray-500">
                  {campaignStats?.activeCampaigns || 0} of {campaignStats?.totalCampaigns || 0} campaigns
                </p>
                <div className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>
                    {campaignStats ? Math.round((campaignStats.activeCampaigns / Math.max(1, campaignStats.totalCampaigns)) * 100) : 0}% active rate
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average ROI Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <CircularProgressbar
                  value={campaignStats?.averageROI || 0}
                  maxValue={100}
                  text={`${Math.round(campaignStats?.averageROI || 0)}%`}
                  styles={buildStyles({
                    textSize: '1.5rem',
                    pathColor: campaignStats?.averageROI && campaignStats.averageROI > 0 ? '#22c55e' : '#ef4444',
                    textColor: campaignStats?.averageROI && campaignStats.averageROI > 0 ? '#22c55e' : '#ef4444',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Average ROI</h3>
                <p className="text-sm text-gray-500">
                  Across all campaigns
                </p>
                <div className={`text-sm flex items-center mt-1 ${campaignStats?.averageROI && campaignStats.averageROI > 20 ? 'text-green-600' : 'text-amber-500'}`}>
                  {campaignStats?.averageROI && campaignStats.averageROI > 20 ? (
                    <><ArrowUpRight className="h-3 w-3 mr-1" /><span>Above target</span></>
                  ) : (
                    <><ArrowDownRight className="h-3 w-3 mr-1" /><span>Below target</span></>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Success Rate Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                {campaignStats && (
                  <CircularProgressbar
                    value={campaigns?.filter(c => c.roi > 0).length || 0}
                    maxValue={Math.max(1, campaigns?.length || 1)}
                    text={`${campaigns ? Math.round((campaigns.filter(c => c.roi > 0).length / Math.max(1, campaigns.length)) * 100) : 0}%`}
                    styles={buildStyles({
                      textSize: '1.5rem',
                      pathColor: '#8b5cf6',
                      textColor: '#8b5cf6',
                      trailColor: '#e5e7eb',
                    })}
                  />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Success Rate</h3>
                <p className="text-sm text-gray-500">
                  Campaigns with positive ROI
                </p>
                <div className="text-sm text-purple-600 flex items-center mt-1">
                  <FileCheck className="h-3 w-3 mr-1" />
                  <span>
                    {campaigns?.filter(c => c.roi > 0).length || 0} successful campaigns
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Analysis Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Distribution</CardTitle>
            <CardDescription>Breakdown by advertisement method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {campaignStats?.campaignsByMethod.length ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <PieChart>
                    <Tooltip formatter={(value: number) => [`${value} campaigns`, '']} />
                    <Legend />
                    <Pie
                      data={campaignStats.campaignsByMethod}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }: { name: string, percent: number }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {campaignStats.campaignsByMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Spending</CardTitle>
            <CardDescription>Campaign spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {campaignStats?.monthlySpend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={campaignStats.monthlySpend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spend']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#8884d8" 
                      name="Monthly Spend"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>
            View and manage all marketing campaigns across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search campaigns or businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={adMethodFilter} onValueChange={setAdMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ad Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ad Methods</SelectItem>
                  {adMethods?.map(method => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Ad Method</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map(campaign => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.businessName}</TableCell>
                        <TableCell>{campaign.adMethodName}</TableCell>
                        <TableCell>{formatCurrency(campaign.spent)}</TableCell>
                        <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                        <TableCell>
                          <span className={campaign.roi >= 0 ? "text-green-600" : "text-red-600"}>
                            {campaign.roi.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              campaign.status === 'active' ? "bg-green-100 text-green-800" :
                              campaign.status === 'completed' ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>Start: {formatDate(campaign.startDate)}</div>
                            {campaign.endDate && <div>End: {formatDate(campaign.endDate)}</div>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No campaigns found matching your filters
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}