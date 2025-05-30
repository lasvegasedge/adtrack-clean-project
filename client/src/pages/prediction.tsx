import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { PersonalizedTrendSidebar } from "@/components/predictive/PersonalizedTrendSidebar";
import { SmartBudgetWizard } from "@/components/predictive/SmartBudgetWizard";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  LineChart,
  TrendingUp,
  Zap,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  BarChart2,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function PredictionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch business details
  const { data: business } = useQuery({
    queryKey: [`/api/business/${user?.businessId}`],
    enabled: !!user?.businessId,
  });
  
  // Fetch campaigns with ROI data
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: [`/api/business/${user?.businessId}/campaigns/roi`],
    enabled: !!user?.businessId,
  });

  // Fetch business stats
  const { data: stats } = useQuery({
    queryKey: [`/api/business/${user?.businessId}/stats`],
    enabled: !!user?.businessId,
  });

  // If not authenticated, redirect to login
  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <AppLayout title="Predictions & Planning">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Smart Budget Wizard and Stats */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Current ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageRoi ? formatPercent(stats.averageRoi) : '--%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across all campaigns
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  Ad Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalSpent ? formatCurrency(stats.totalSpent) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total investment in advertising
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalEarned ? formatCurrency(stats.totalEarned) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Generated from campaigns
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Smart Budget Allocation
              </CardTitle>
              <CardDescription>
                Optimize your advertising budget across different channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!campaigns || campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaign data available</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    To use the Budget Allocation Wizard, you need to have campaign data.
                    Add some campaigns to get started.
                  </p>
                  <Button asChild>
                    <a href="/add-campaign">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Your First Campaign
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Our Smart Budget Allocation Wizard analyzes your historical campaign performance 
                    to suggest the optimal distribution of your advertising budget across different channels.</p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-primary" />
                      Benefits of Smart Allocation
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Maximize ROI by allocating more budget to better-performing channels</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Identify underperforming ad methods to reduce waste</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Set and track progress toward ROI targets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Compare manual vs. AI-optimized allocation strategies</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="pt-2">
                    <SmartBudgetWizard />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Seasonal Planning Guide
              </CardTitle>
              <CardDescription>
                Timing recommendations based on seasonal performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-800 mb-1">Best Months</h3>
                    <p className="text-sm text-green-700">
                      October, November, December
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      These months historically show the highest ROI for most businesses
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <h3 className="font-medium text-amber-800 mb-1">Plan Ahead For</h3>
                    <p className="text-sm text-amber-700">
                      January, February, August
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      These months might require more strategic ad placement
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-1">Current Month</h3>
                    <p className="text-sm text-blue-700">
                      April - Strong Opportunity
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      April typically shows 15% higher ROI than average
                    </p>
                  </div>
                </div>
                
                <div className="pt-1">
                  <h3 className="font-medium mb-2">Business-Specific Recommendations</h3>
                  {business?.businessType === "Retail" ? (
                    <div className="space-y-2 text-sm">
                      <p>• Increase social media ad spend during Q4 (Oct-Dec)</p>
                      <p>• Consider boosting local advertising during back-to-school season</p>
                      <p>• Maintain consistent presence in search engine advertising year-round</p>
                    </div>
                  ) : business?.businessType === "Restaurant" ? (
                    <div className="space-y-2 text-sm">
                      <p>• Focus on local advertising with seasonal menu promotions</p>
                      <p>• Increase social media presence during summer months</p>
                      <p>• Consider special campaigns for major holidays and events</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p>• Maintain consistent advertising throughout the year</p>
                      <p>• Increase budget during Q4 for end-of-year promotions</p>
                      <p>• Consider industry-specific seasonal trends for your business</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Trend Prediction Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <PersonalizedTrendSidebar />
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                ROI Projection Tips
              </CardTitle>
              <CardDescription>
                Maximize your advertising returns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Short-term Strategies</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Redirect budget from underperforming to successful campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>A/B test ad copy to improve conversion rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Optimize landing pages for better performance</span>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Long-term Strategies</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Invest in channels with growing ROI trends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Plan campaigns around seasonal performance patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Build a diverse channel mix for stability</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full text-xs" asChild>
                  <a href="/analytics">
                    View Current Analytics
                    <ArrowUpRight className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}