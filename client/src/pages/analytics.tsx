import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { EnhancedAnalyticsDashboard } from "@/components/analytics/EnhancedAnalyticsDashboard";
import { RoiByAdMethodChart } from "@/components/analytics/RoiByAdMethodChart";
import { MonthlyPerformanceTrendChart } from "@/components/analytics/MonthlyPerformanceTrendChart";
import { CampaignComparisonChart } from "@/components/analytics/CampaignComparisonChart";
import { CompetitorBenchmarkInsights } from "@/components/analytics/CompetitorBenchmarkInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { BarChart3, LineChart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isBoostActivated, setIsBoostActivated] = useState(false);
  const { toast } = useToast();

  const handleActivateAIBoost = () => {
    setIsBoostActivated(true);
    
    toast({
      title: "AI Boost Activated",
      description: "Our AI is analyzing your data to provide enhanced recommendations.",
      duration: 3000,
    });
    
    // Simulate AI activation for 2 seconds
    setTimeout(() => {
      setIsBoostActivated(false);
      
      toast({
        title: "AI Recommendations Updated",
        description: "Check your analytics for enhanced AI insights.",
        duration: 5000,
      });
    }, 2000);
  };
  
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
    queryKey: ["/api/business/campaigns/roi", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${business?.id}/campaigns/roi`);
      if (!res.ok) throw new Error("Failed to load campaign data");
      return res.json();
    },
    enabled: !!business?.id,
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

  const isLoading = isLoadingBusiness || isLoadingCampaigns || isLoadingAdMethods;
  
  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : campaigns && campaigns.length > 0 && adMethods ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Analytics Overview</h2>
              <Button 
                onClick={handleActivateAIBoost} 
                disabled={isBoostActivated}
                className={`flex items-center gap-2 ${
                  isBoostActivated 
                    ? "bg-blue-700 animate-pulse" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>{isBoostActivated ? "AI Processing..." : "AI Boost Analytics"}</span>
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Performance Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="competitor" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Competitor Benchmarks</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <EnhancedAnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="competitor">
                <CompetitorBenchmarkInsights />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">No Campaign Data Available</h2>
            <p className="text-muted-foreground mb-6">
              You need to add some campaigns to see analytics. 
              Track your advertising efforts to get insights about performance.
            </p>
            <a 
              href="/add-campaign" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Add Your First Campaign
            </a>
          </div>
        )}
      </div>
    </AppLayout>
  );
}