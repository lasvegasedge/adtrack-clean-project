import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Loader2, Zap, TrendingUp, BarChart3, Radio, Eye, Sparkles } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { BusinessCampaignWithROI } from "@shared/schema";
import { AIBenchmarkTooltip, AIBenchmarkInsight } from "./AIBenchmarkTooltip";

// Interface for the insights data
interface CompetitorInsight {
  metric: string;
  yourValue: number;
  topValue: number;
  averageValue: number;
  percentDifference: number;
  isPositive: boolean;
}

export function CompetitorBenchmarkInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const businessId = user?.businessId;
  const [activeTab, setActiveTab] = useState<string>("roi");
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [visualizationType, setVisualizationType] = useState<"bar" | "line" | "radar">("bar");
  const [activeMetric, setActiveMetric] = useState<'roi' | 'spend' | 'revenue'>('roi');
  
  // AI-powered benchmark insights
  const { data: aiInsights, isLoading: aiInsightsLoading } = useQuery({
    queryKey: ["/api/benchmark-insights", businessId, activeMetric],
    queryFn: async () => {
      const response = await fetch(`/api/benchmark-insights/${businessId}/${activeMetric}`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      return response.json();
    },
    enabled: !!businessId,
  });
  
  // Prepare insights data for tooltips
  const benchmarkInsights = useMemo(() => {
    if (!aiInsights?.insights) {
      return {
        roi: {
          performance: { value: 0, percentDifference: 0, isPositive: false },
          trend: 'stable' as const,
          recommendation: 'Insufficient data to provide insights.',
          confidenceScore: 0.5,
          industryBenchmark: 0
        },
        spend: {
          performance: { value: 0, percentDifference: 0, isPositive: false },
          trend: 'stable' as const,
          recommendation: 'Insufficient data to provide insights.',
          confidenceScore: 0.5,
          industryBenchmark: 0
        },
        revenue: {
          performance: { value: 0, percentDifference: 0, isPositive: false },
          trend: 'stable' as const,
          recommendation: 'Insufficient data to provide insights.',
          confidenceScore: 0.5,
          industryBenchmark: 0
        },
        default: {
          performance: { value: 0, percentDifference: 0, isPositive: false },
          trend: 'stable' as const,
          recommendation: 'Insufficient data to provide insights.',
          confidenceScore: 0.5,
          industryBenchmark: 0
        }
      };
    }
    
    return {
      [activeMetric]: aiInsights.insights,
      roi: aiInsights.insights,
      spend: aiInsights.insights,
      revenue: aiInsights.insights,
      default: aiInsights.insights
    };
  }, [aiInsights, activeMetric]);

  // Fetch business details
  const { data: business } = useQuery({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });

  // Fetch campaigns with ROI for this business
  const { data: campaigns } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
  });

  // Query top performers
  const { data: topPerformers } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: ['/api/top-performers'],
    enabled: !!businessId,
  });

  // Create a mutation for generating insights
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!business || !campaigns || !topPerformers || campaigns.length === 0) {
        throw new Error('Missing required data');
      }

      // Calculate average metrics
      const competitorCampaigns = topPerformers.filter(c => c.businessId !== businessId);
      
      // Calculate ROI metrics
      const yourAvgRoi = campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length;
      const topRoi = competitorCampaigns.length > 0 ? competitorCampaigns[0].roi : 0;
      const avgRoi = competitorCampaigns.reduce((sum, c) => sum + c.roi, 0) / 
                    (competitorCampaigns.length || 1);
      
      // Calculate spend metrics
      const yourAvgSpend = campaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / 
                          campaigns.length;
      const topSpend = competitorCampaigns.length > 0 ? 
                      parseFloat(competitorCampaigns[0].amountSpent.toString()) : 0;
      const avgSpend = competitorCampaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / 
                      (competitorCampaigns.length || 1);
      
      // Calculate earning metrics
      const yourAvgEarned = campaigns.reduce((sum, c) => {
        const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
        return sum + earned;
      }, 0) / campaigns.length;
      
      const topEarned = competitorCampaigns.length > 0 && competitorCampaigns[0].amountEarned ? 
                       parseFloat(competitorCampaigns[0].amountEarned.toString()) : 0;
      
      const avgEarned = competitorCampaigns.reduce((sum, c) => {
        const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
        return sum + earned;
      }, 0) / (competitorCampaigns.length || 1);

      // Generate insights
      const newInsights: CompetitorInsight[] = [
        {
          metric: "ROI",
          yourValue: yourAvgRoi,
          topValue: topRoi,
          averageValue: avgRoi,
          percentDifference: topRoi > 0 ? ((yourAvgRoi - topRoi) / topRoi) * 100 : 0,
          isPositive: yourAvgRoi >= topRoi
        },
        {
          metric: "Ad Spend",
          yourValue: yourAvgSpend,
          topValue: topSpend,
          averageValue: avgSpend,
          percentDifference: yourAvgSpend > 0 ? ((topSpend - yourAvgSpend) / yourAvgSpend) * 100 : 0,
          isPositive: yourAvgSpend <= topSpend
        },
        {
          metric: "Revenue Generated",
          yourValue: yourAvgEarned,
          topValue: topEarned,
          averageValue: avgEarned,
          percentDifference: yourAvgEarned > 0 ? ((topEarned - yourAvgEarned) / yourAvgEarned) * 100 : 0,
          isPositive: yourAvgEarned >= topEarned
        }
      ];

      setInsights(newInsights);
      return newInsights;
    },
    onSuccess: () => {
      toast({
        title: "Benchmark insights generated",
        description: "Your business has been benchmarked against local competitors",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate insights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format chart data
  const getChartData = () => {
    if (insights.length === 0) return [];

    switch (activeTab) {
      case "roi":
        return [
          { name: "Your Business", value: insights[0].yourValue },
          { name: "Top Competitor", value: insights[0].topValue },
          { name: "Area Average", value: insights[0].averageValue }
        ];
      case "spend":
        return [
          { name: "Your Business", value: insights[1].yourValue },
          { name: "Top Competitor", value: insights[1].topValue },
          { name: "Area Average", value: insights[1].averageValue }
        ];
      case "revenue":
        return [
          { name: "Your Business", value: insights[2].yourValue },
          { name: "Top Competitor", value: insights[2].topValue },
          { name: "Area Average", value: insights[2].averageValue }
        ];
      case "all":
        return [
          { 
            name: "Your Business", 
            ROI: insights[0].yourValue,
            Spend: insights[1].yourValue,
            Revenue: insights[2].yourValue
          },
          { 
            name: "Top Competitor", 
            ROI: insights[0].topValue,
            Spend: insights[1].topValue,
            Revenue: insights[2].topValue
          },
          { 
            name: "Area Average", 
            ROI: insights[0].averageValue,
            Spend: insights[1].averageValue,
            Revenue: insights[2].averageValue
          }
        ];
      default:
        return [];
    }
  };

  // Format radar chart data
  const getRadarData = () => {
    if (insights.length === 0) return [];

    return [
      { 
        subject: "ROI", 
        "Your Business": insights[0].yourValue, 
        "Top Competitor": insights[0].topValue, 
        "Area Average": insights[0].averageValue 
      },
      { 
        subject: "Ad Spend", 
        "Your Business": insights[1].yourValue, 
        "Top Competitor": insights[1].topValue, 
        "Area Average": insights[1].averageValue 
      },
      { 
        subject: "Revenue", 
        "Your Business": insights[2].yourValue, 
        "Top Competitor": insights[2].topValue, 
        "Area Average": insights[2].averageValue 
      }
    ];
  };

  // Get recommendations based on insights
  const getRecommendations = () => {
    if (insights.length === 0) return [];

    const recommendations: string[] = [];

    // ROI recommendations
    if (insights[0].percentDifference < -20) {
      recommendations.push("Your ROI is significantly lower than top competitors. Consider reviewing your advertising strategy and focus on higher-converting channels.");
    } else if (insights[0].percentDifference < 0) {
      recommendations.push("Your ROI is slightly below top performers. Look for opportunities to optimize campaigns and reduce underperforming ad spend.");
    } else {
      recommendations.push("Your ROI is competitive. Keep monitoring performance and consider sharing your successful strategies across all campaigns.");
    }

    // Spend recommendations
    const topCompetitorSpendsDifference = insights[1].percentDifference;
    if (topCompetitorSpendsDifference > 50) {
      recommendations.push("Top competitors are spending significantly more on advertising. Consider increasing ad budget or focusing on more efficient channels for better market presence.");
    } else if (topCompetitorSpendsDifference > 20) {
      recommendations.push("Your ad spend is moderately lower than top performers. Evaluate if increasing budget in targeted channels could improve results.");
    } else if (topCompetitorSpendsDifference < -20) {
      recommendations.push("You're spending more than competitors with potentially lower returns. Focus on improving campaign efficiency rather than increasing spend.");
    }

    // Revenue recommendations
    if (insights[2].percentDifference < -30) {
      recommendations.push("Your revenue generation is significantly behind competitors. Consider adopting strategies that focus on higher-value customers or sales conversion optimization.");
    } else if (insights[2].percentDifference < 0) {
      recommendations.push("You have potential to increase revenue based on competitor benchmarks. Analyze which ad methods drive the most revenue for your competitors.");
    }

    return recommendations;
  };

  // Render the chart based on the selected visualization type
  const renderChart = () => {
    const chartData = activeTab === "all" && visualizationType === "radar" ? getRadarData() : getChartData();

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <p className="text-gray-500">No data available for visualization</p>
        </div>
      );
    }

    if (activeTab === "all" && visualizationType === "radar") {
      return (
        <div className="h-[400px] mt-4">
          <ResponsiveContainer width="100%" height={400} minHeight={400}>
            <RadarChart outerRadius={90} data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
              <Radar name="Your Business" dataKey="Your Business" stroke="#1976D2" fill="#1976D2" fillOpacity={0.6} />
              <Radar name="Top Competitor" dataKey="Top Competitor" stroke="#f44336" fill="#f44336" fillOpacity={0.6} />
              <Radar name="Area Average" dataKey="Area Average" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
              <Legend />
              {aiInsightsLoading ? (
                <Tooltip />
              ) : (
                <AIBenchmarkTooltip
                  insights={benchmarkInsights}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (visualizationType === "bar") {
      return (
        <div className="h-[400px] mt-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              {aiInsightsLoading ? (
                <Tooltip 
                  formatter={(value, name) => {
                    if (activeTab === "roi") return [`${formatPercent(value as number)}`, "ROI"];
                    return [`${formatCurrency(value as number)}`, activeTab === "spend" ? "Ad Spend" : "Revenue"];
                  }}
                />
              ) : (
                <AIBenchmarkTooltip
                  insights={benchmarkInsights}
                />
              )}
              <Legend />
              {activeTab === "all" ? (
                <>
                  <Bar dataKey="ROI" fill="#1976D2" name="ROI (%)" />
                  <Bar dataKey="Spend" fill="#f44336" name="Ad Spend ($)" />
                  <Bar dataKey="Revenue" fill="#4caf50" name="Revenue ($)" />
                </>
              ) : (
                <Bar 
                  dataKey="value" 
                  fill={activeTab === "roi" ? "#1976D2" : activeTab === "spend" ? "#f44336" : "#4caf50"} 
                  name={activeTab === "roi" ? "ROI (%)" : activeTab === "spend" ? "Ad Spend ($)" : "Revenue ($)"} 
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Line chart
    return (
      <div className="h-[400px] mt-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            {aiInsightsLoading ? (
              <Tooltip 
                formatter={(value, name) => {
                  if (activeTab === "roi") return [`${formatPercent(value as number)}`, "ROI"];
                  return [`${formatCurrency(value as number)}`, activeTab === "spend" ? "Ad Spend" : "Revenue"];
                }}
              />
            ) : (
              <AIBenchmarkTooltip
                insights={benchmarkInsights}
              />
            )}
            <Legend />
            {activeTab === "all" ? (
              <>
                <Line type="monotone" dataKey="ROI" stroke="#1976D2" name="ROI (%)" />
                <Line type="monotone" dataKey="Spend" stroke="#f44336" name="Ad Spend ($)" />
                <Line type="monotone" dataKey="Revenue" stroke="#4caf50" name="Revenue ($)" />
              </>
            ) : (
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={activeTab === "roi" ? "#1976D2" : activeTab === "spend" ? "#f44336" : "#4caf50"} 
                name={activeTab === "roi" ? "ROI (%)" : activeTab === "spend" ? "Ad Spend ($)" : "Revenue ($)"} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-yellow-500" />
          One-Click Competitor Benchmark Insights
        </CardTitle>
        <CardDescription>
          Quickly analyze how your business compares to competitors in your area
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center p-6 border rounded-lg bg-gray-50">
            <p className="mb-4 text-gray-600">
              Generate instant insights to compare your business performance against local competitors.
            </p>
            <Button
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending || !campaigns?.length}
              className="w-full sm:w-auto"
            >
              {generateInsightsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Generate Benchmark Insights
                </>
              )}
            </Button>
            {!campaigns?.length && (
              <p className="mt-4 text-sm text-amber-600">
                You need at least one campaign to generate benchmark insights.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value);
                  // Sync the metric type with the AI tooltips
                  if (value !== 'all') {
                    setActiveMetric(value as 'roi' | 'spend' | 'revenue');
                  }
                }} 
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="roi">ROI</TabsTrigger>
                  <TabsTrigger value="spend">Ad Spend</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="all">All Metrics</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={visualizationType === "bar" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setVisualizationType("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={visualizationType === "line" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setVisualizationType("line")}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={visualizationType === "radar" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setVisualizationType("radar")}
                  disabled={activeTab !== "all"}
                >
                  <Radio className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Benchmark Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`bg-gray-50 border ${insight.isPositive ? 'border-green-200' : 'border-amber-200'}`}>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500">{insight.metric}</div>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="text-lg font-bold">
                        {insight.metric === "ROI" 
                          ? formatPercent(insight.yourValue) 
                          : formatCurrency(insight.yourValue)
                        }
                      </div>
                      <div className={`text-sm font-medium ${insight.isPositive ? 'text-green-600' : 'text-amber-600'}`}>
                        {insight.percentDifference === 0 ? 'Same as top' : (
                          insight.isPositive 
                            ? `${Math.abs(insight.percentDifference).toFixed(1)}% better` 
                            : `${Math.abs(insight.percentDifference).toFixed(1)}% lower`
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500 flex justify-between">
                      <span>Top: {insight.metric === "ROI" 
                        ? formatPercent(insight.topValue) 
                        : formatCurrency(insight.topValue)
                      }</span>
                      <span>Avg: {insight.metric === "ROI" 
                        ? formatPercent(insight.averageValue) 
                        : formatCurrency(insight.averageValue)
                      }</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Visualization */}
            {renderChart()}

            {/* Recommendations */}
            <Card className="bg-gray-50 border border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  {getRecommendations().map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="text-right">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
              >
                {generateInsightsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Refreshing...
                  </>
                ) : "Refresh Insights"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}