import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, ArrowLeft, BarChart2 } from "lucide-react";
import { formatPercent, formatCurrency, formatDate } from "@/lib/utils";
import { BusinessCampaignWithROI } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CampaignDetailComparisonProps {
  campaigns: BusinessCampaignWithROI[];
  onClose: () => void;
}

export default function CampaignDetailComparison({ campaigns, onClose }: CampaignDetailComparisonProps) {
  const [activeTab, setActiveTab] = useState("metrics");

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Campaign Comparison</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No campaigns selected for comparison.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to calculate percentage difference
  const calculateDifference = (value1: number, value2: number): number => {
    if (value2 === 0) return 0;
    return ((value1 - value2) / value2) * 100;
  };

  const exportComparisonData = () => {
    // In a real implementation, this would generate a PDF/CSV
    alert("Export functionality would generate a detailed report of this comparison.");
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <CardTitle className="text-lg">Campaign Comparison</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={exportComparisonData}>
            <Download className="h-4 w-4 mr-1" />
            <span>Export Report</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          {/* Key Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {campaigns.map((campaign, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <h3 className="font-bold text-lg mb-4 text-center">
                    {campaign.businessId === campaigns[0].businessId 
                      ? 'Your Campaign' 
                      : `Business #${index + 1}`}
                  </h3>
                  <div className="flex justify-center mb-6">
                    <div style={{ width: '180px', height: '180px' }}>
                      <CircularProgressbar
                        value={campaign.roi}
                        text={`${campaign.roi.toFixed(1)}%`}
                        styles={buildStyles({
                          rotation: 0,
                          strokeLinecap: 'round',
                          textSize: '16px',
                          pathTransitionDuration: 0.5,
                          pathColor: `rgba(62, 152, 199, ${campaign.roi / 200})`,
                          textColor: '#3e98c7',
                          trailColor: '#d6d6d6',
                          backgroundColor: '#3e98c7',
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Amount Spent</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(campaign.amountSpent))}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Amount Earned</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(Number(campaign.amountEarned))}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Ad Method</p>
                      <p className="text-md font-medium">
                        {campaign.adMethod?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Campaign Status</p>
                      <p className={`text-md font-medium ${campaign.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {campaign.isActive ? 'Active' : 'Completed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ROI Comparison Section */}
            {campaigns.length >= 2 && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-bold text-lg mb-4">Performance Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">ROI Difference</p>
                    <p className={`text-xl font-bold ${
                      campaigns[0].roi >= campaigns[1].roi ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {campaigns[0].roi >= campaigns[1].roi 
                        ? `+${formatPercent(campaigns[0].roi - campaigns[1].roi)}` 
                        : `-${formatPercent(campaigns[1].roi - campaigns[0].roi)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaigns[0].roi >= campaigns[1].roi 
                        ? 'Your campaign is outperforming the comparison' 
                        : 'The comparison is outperforming your campaign'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Spending Difference</p>
                    <p className="text-xl font-bold">
                      {formatPercent(calculateDifference(
                        Number(campaigns[0].amountSpent), 
                        Number(campaigns[1].amountSpent)
                      ))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Number(campaigns[0].amountSpent) > Number(campaigns[1].amountSpent)
                        ? 'Your spending is higher than the comparison'
                        : 'Your spending is lower than the comparison'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Earning Difference</p>
                    <p className={`text-xl font-bold ${
                      Number(campaigns[0].amountEarned) >= Number(campaigns[1].amountEarned) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatPercent(calculateDifference(
                        Number(campaigns[0].amountEarned), 
                        Number(campaigns[1].amountEarned)
                      ))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Number(campaigns[0].amountEarned) > Number(campaigns[1].amountEarned)
                        ? 'Your earnings are higher than the comparison'
                        : 'Your earnings are lower than the comparison'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Campaign Details Tab */}
          <TabsContent value="details">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Campaign Attribute</th>
                    {campaigns.map((campaign, index) => (
                      <th key={index} className="text-left py-2 font-medium text-gray-600">
                        {campaign.businessId === campaigns[0].businessId 
                          ? 'Your Campaign' 
                          : `Business #${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium">Campaign Name</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">{campaign.name}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 font-medium">Ad Method</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">{campaign.adMethod?.name || 'Unknown'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium">Description</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">{campaign.description || 'No description'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 font-medium">Start Date</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">{formatDate(new Date(campaign.startDate))}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium">End Date</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">
                        {campaign.endDate ? formatDate(new Date(campaign.endDate)) : 'Ongoing'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 font-medium">Duration</td>
                    {campaigns.map((campaign, index) => {
                      const start = new Date(campaign.startDate);
                      const end = campaign.endDate ? new Date(campaign.endDate) : new Date();
                      const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <td key={index} className="py-3">{durationDays} days</td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium">Amount Spent</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">{formatCurrency(Number(campaign.amountSpent))}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 font-medium">Amount Earned</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3 text-green-600">{formatCurrency(Number(campaign.amountEarned))}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-medium">ROI</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3 font-bold text-blue-600">{formatPercent(campaign.roi)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 font-medium">Status</td>
                    {campaigns.map((campaign, index) => (
                      <td key={index} className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.isActive ? 'Active' : 'Completed'}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-blue-500" />
                  Key Differentiators
                </h3>
                {campaigns.length >= 2 ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">ROI Performance</h4>
                      <p className="text-gray-600">
                        {campaigns[0].roi > campaigns[1].roi 
                          ? `Your campaign has a ${formatPercent(campaigns[0].roi - campaigns[1].roi)} higher ROI than the comparison.` 
                          : campaigns[0].roi < campaigns[1].roi
                            ? `Your campaign has a ${formatPercent(campaigns[1].roi - campaigns[0].roi)} lower ROI than the comparison.`
                            : `Both campaigns have the same ROI of ${formatPercent(campaigns[0].roi)}.`
                        }
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800">Spending Efficiency</h4>
                      <p className="text-gray-600">
                        {Number(campaigns[0].amountSpent) < Number(campaigns[1].amountSpent) && campaigns[0].roi >= campaigns[1].roi
                          ? `Your campaign achieved similar or better results while spending ${formatPercent(
                              (Number(campaigns[1].amountSpent) - Number(campaigns[0].amountSpent)) / Number(campaigns[1].amountSpent) * 100
                            )} less.`
                          : Number(campaigns[0].amountSpent) > Number(campaigns[1].amountSpent) && campaigns[0].roi <= campaigns[1].roi
                            ? `The comparison campaign achieved similar or better results while spending ${formatPercent(
                                (Number(campaigns[0].amountSpent) - Number(campaigns[1].amountSpent)) / Number(campaigns[0].amountSpent) * 100
                              )} less.`
                            : `Both campaigns have different spending patterns that warrant further analysis.`
                        }
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800">Campaign Duration</h4>
                      {(() => {
                        const start1 = new Date(campaigns[0].startDate);
                        const end1 = campaigns[0].endDate ? new Date(campaigns[0].endDate) : new Date();
                        const duration1 = Math.ceil((end1.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const start2 = new Date(campaigns[1].startDate);
                        const end2 = campaigns[1].endDate ? new Date(campaigns[1].endDate) : new Date();
                        const duration2 = Math.ceil((end2.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <p className="text-gray-600">
                            {duration1 !== duration2 
                              ? `Your campaign ran for ${duration1} days compared to ${duration2} days for the comparison. ${
                                  duration1 < duration2 && campaigns[0].roi >= campaigns[1].roi
                                    ? 'Your campaign achieved results more quickly.'
                                    : duration1 > duration2 && campaigns[0].roi >= campaigns[1].roi
                                      ? 'Your campaign took longer but achieved better results.'
                                      : 'The relationship between duration and performance is mixed.'
                                }`
                              : `Both campaigns ran for the same duration of ${duration1} days.`
                            }
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select multiple campaigns to see differentiators.</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Recommendations</h3>
                {campaigns.length >= 2 ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                      <h4 className="font-medium text-gray-800">Budget Allocation</h4>
                      <p className="text-gray-600">
                        {campaigns[0].roi > campaigns[1].roi
                          ? `Your campaign is performing well. Consider increasing budget allocation to maximize returns.`
                          : `The comparison campaign is showing better ROI. Analyze what makes it more effective and adjust your strategy.`
                        }
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border-l-4 border-green-500">
                      <h4 className="font-medium text-gray-800">Campaign Timing</h4>
                      <p className="text-gray-600">
                        {(() => {
                          const start1 = new Date(campaigns[0].startDate);
                          const start2 = new Date(campaigns[1].startDate);
                          const monthDiff = start2.getMonth() - start1.getMonth() + 
                                          (12 * (start2.getFullYear() - start1.getFullYear()));
                          
                          return monthDiff !== 0
                            ? `The campaigns started ${Math.abs(monthDiff)} month${Math.abs(monthDiff) > 1 ? 's' : ''} apart. Consider seasonal factors that might be affecting performance.`
                            : `Both campaigns started in the same month. Timing is likely not a significant factor in performance differences.`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border-l-4 border-yellow-500">
                      <h4 className="font-medium text-gray-800">Next Steps</h4>
                      <p className="text-gray-600">
                        {campaigns[0].roi >= campaigns[1].roi
                          ? `Your campaign is performing well. Consider extending its duration or applying similar strategies to other campaigns.`
                          : `Analyze the specific elements that make the comparison campaign more effective and implement those insights in your future campaigns.`
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select multiple campaigns to see recommendations.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}