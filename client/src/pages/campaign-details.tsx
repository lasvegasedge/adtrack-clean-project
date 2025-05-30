import React from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import CampaignDetailHeader from '@/components/campaigns/CampaignDetailHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getQueryFn } from '@/lib/queryClient';
import { Campaign } from '@shared/schema';
import { Loader2 } from 'lucide-react';

// Custom types for the campaign details with additional information
interface CampaignDetail extends Campaign {
  adMethodName?: string;
  businessName?: string;
}

// Sample performance data (should be fetched from API in a real application)
const performanceData = [
  { name: 'Week 1', impressions: 3400, clicks: 240, conversions: 12 },
  { name: 'Week 2', impressions: 4200, clicks: 320, conversions: 18 },
  { name: 'Week 3', impressions: 5100, clicks: 380, conversions: 24 },
  { name: 'Week 4', impressions: 4800, clicks: 360, conversions: 22 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CampaignDetails() {
  // Get the campaign ID from the URL
  const [_, params] = useRoute<{ id: string }>('/campaigns/:id');
  const campaignId = params?.id ? parseInt(params.id, 10) : 0;

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useQuery<CampaignDetail>({
    queryKey: [`/api/campaigns/${campaignId}`],
    queryFn: getQueryFn(),
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !campaign) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-gray-700">Failed to load campaign details</h2>
          <p className="text-gray-500">{error?.message || 'Campaign not found'}</p>
        </div>
      </AppLayout>
    );
  }

  // Calculate metrics from the campaign data
  const ctr = performanceData.reduce((sum, week) => sum + week.clicks, 0) / 
              performanceData.reduce((sum, week) => sum + week.impressions, 0) * 100;
  
  const conversionRate = performanceData.reduce((sum, week) => sum + week.conversions, 0) / 
                        performanceData.reduce((sum, week) => sum + week.clicks, 0) * 100;
  
  const costPerClick = campaign.budget / performanceData.reduce((sum, week) => sum + week.clicks, 0);
  
  const costPerConversion = campaign.budget / performanceData.reduce((sum, week) => sum + week.conversions, 0);

  // Data for the pie chart
  const distributionData = [
    { name: 'Ad Spend', value: campaign.budget },
    { name: 'Revenue', value: campaign.revenue },
    { name: 'Profit', value: campaign.revenue - campaign.budget },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <CampaignDetailHeader campaign={campaign} />
        
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                      <Bar dataKey="conversions" fill="#ffc658" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Click-Through Rate (CTR)</dt>
                      <dd className="text-sm font-semibold">{ctr.toFixed(2)}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Conversion Rate</dt>
                      <dd className="text-sm font-semibold">{conversionRate.toFixed(2)}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Cost Per Click</dt>
                      <dd className="text-sm font-semibold">${costPerClick.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Cost Per Conversion</dt>
                      <dd className="text-sm font-semibold">${costPerConversion.toFixed(2)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-1">Improve CTR</h4>
                    <p className="text-sm text-blue-600">Consider A/B testing different ad creatives to improve click-through rates.</p>
                  </div>
                  
                  {campaign.roi < 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-700 mb-1">Negative ROI Alert</h4>
                      <p className="text-sm text-red-600">Your campaign is currently losing money. Consider adjusting your targeting or reducing ad spend.</p>
                    </div>
                  )}
                  
                  {campaign.roi > 0 && campaign.roi < 50 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-700 mb-1">Moderate ROI</h4>
                      <p className="text-sm text-yellow-600">Your ROI is positive but could be improved. Focus on optimizing conversion rates.</p>
                    </div>
                  )}
                  
                  {campaign.roi >= 50 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-700 mb-1">Strong Performance</h4>
                      <p className="text-sm text-green-600">Your campaign is performing well. Consider scaling up your budget to maximize returns.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Total Ad Spend</dt>
                      <dd className="text-sm font-semibold">${campaign.budget.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Total Revenue</dt>
                      <dd className="text-sm font-semibold">${campaign.revenue.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Net Profit</dt>
                      <dd className={`text-sm font-semibold ${(campaign.revenue - campaign.budget) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(campaign.revenue - campaign.budget).toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ROI</dt>
                      <dd className={`text-sm font-semibold ${campaign.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {campaign.roi}%
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Profit Margin</dt>
                      <dd className="text-sm font-semibold">
                        {campaign.revenue > 0 ? ((campaign.revenue - campaign.budget) / campaign.revenue * 100).toFixed(2) : '0.00'}%
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}