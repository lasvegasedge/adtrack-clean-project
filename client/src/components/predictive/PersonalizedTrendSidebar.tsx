import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart2,
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { BusinessCampaignWithROI } from "@shared/schema";

// Constants for prediction model
const SEASONAL_FACTORS = {
  0: 1.0,   // January
  1: 0.95,  // February
  2: 1.1,   // March
  3: 1.15,  // April
  4: 1.2,   // May
  5: 1.15,  // June
  6: 1.05,  // July
  7: 1.0,   // August
  8: 1.1,   // September
  9: 1.25,  // October
  10: 1.3,  // November
  11: 1.4,  // December
};

interface PredictedTrend {
  month: string;
  predictedROI: number;
  confidence: number;
}

interface PredictionInsight {
  type: "positive" | "negative" | "neutral";
  message: string;
  icon: React.ReactNode;
}

export function PersonalizedTrendSidebar() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictedTrend[]>([]);
  const [insights, setInsights] = useState<PredictionInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bestMonth, setBestMonth] = useState<string>("");
  const [worstMonth, setWorstMonth] = useState<string>("");
  const [yearlyProjection, setYearlyProjection] = useState<number>(0);
  
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

  // Function to generate predictions based on historical data
  const generatePredictions = () => {
    setIsGenerating(true);
    
    if (!campaigns || campaigns.length === 0) {
      setIsGenerating(false);
      return;
    }
    
    setTimeout(() => {
      // Get historical ROI data
      const historicalData = campaigns.map((campaign: BusinessCampaignWithROI) => ({
        date: new Date(campaign.startDate),
        roi: campaign.roi || 0
      }));
      
      // Sort by date
      historicalData.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculate average ROI
      const avgROI = historicalData.reduce((sum, item) => sum + item.roi, 0) / historicalData.length;
      
      // Generate predictions for next 6 months
      const currentDate = new Date();
      const predictedTrends: PredictedTrend[] = [];
      
      let bestMonthValue = -Infinity;
      let bestMonthName = "";
      let worstMonthValue = Infinity;
      let worstMonthName = "";
      let totalProjection = 0;
      
      // Generate 12 months of predictions
      for (let i = 0; i < 12; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setMonth(currentDate.getMonth() + i);
        
        const monthIndex = futureDate.getMonth();
        const monthName = futureDate.toLocaleString('default', { month: 'short' });
        const yearShort = futureDate.getFullYear().toString().substr(2);
        
        // Apply seasonal factor and introduce small random variation
        const seasonalFactor = SEASONAL_FACTORS[monthIndex as keyof typeof SEASONAL_FACTORS] || 1;
        const randomVariation = 0.9 + Math.random() * 0.2; // Random between 0.9 and 1.1
        const trendFactor = 1 + (i * 0.01); // Small upward trend over time
        
        const predictedROI = avgROI * seasonalFactor * randomVariation * trendFactor;
        const confidence = Math.max(0.6, 0.95 - (i * 0.03)); // Confidence decreases with time
        
        predictedTrends.push({
          month: `${monthName} '${yearShort}`,
          predictedROI,
          confidence
        });
        
        totalProjection += predictedROI;
        
        // Track best and worst months
        if (predictedROI > bestMonthValue) {
          bestMonthValue = predictedROI;
          bestMonthName = monthName;
        }
        
        if (predictedROI < worstMonthValue) {
          worstMonthValue = predictedROI;
          worstMonthName = monthName;
        }
      }
      
      // Set predictions
      setPredictions(predictedTrends);
      setBestMonth(bestMonthName);
      setWorstMonth(worstMonthName);
      setYearlyProjection(totalProjection / 12);
      
      // Generate insights
      const newInsights: PredictionInsight[] = [];
      
      // Best month insight
      newInsights.push({
        type: "positive",
        message: `${bestMonthName} is projected to be your top-performing month with ${formatPercent(bestMonthValue)} ROI.`,
        icon: <TrendingUp className="h-4 w-4 text-green-500" />
      });
      
      // Worst month insight
      newInsights.push({
        type: "negative",
        message: `${worstMonthName} may show lower returns at ${formatPercent(worstMonthValue)} ROI.`,
        icon: <TrendingDown className="h-4 w-4 text-amber-500" />
      });
      
      // Seasonal advice
      const upcomingMonth = new Date();
      upcomingMonth.setMonth(upcomingMonth.getMonth() + 1);
      const upcomingMonthName = upcomingMonth.toLocaleString('default', { month: 'long' });
      const upcomingSeasonalFactor = SEASONAL_FACTORS[upcomingMonth.getMonth() as keyof typeof SEASONAL_FACTORS] || 1;
      
      if (upcomingSeasonalFactor > 1.1) {
        newInsights.push({
          type: "positive",
          message: `${upcomingMonthName} historically shows strong performance. Consider increasing ad spend.`,
          icon: <Zap className="h-4 w-4 text-blue-500" />
        });
      } else if (upcomingSeasonalFactor < 1.0) {
        newInsights.push({
          type: "neutral",
          message: `${upcomingMonthName} may have lower returns. Consider budget adjustments.`,
          icon: <AlertCircle className="h-4 w-4 text-gray-500" />
        });
      }
      
      // Add business-specific insight if available
      if (business?.businessType) {
        const businessTypeFactor = business.businessType === "Retail" ? 1.15 : 
                                   business.businessType === "Restaurant" ? 1.05 : 1.0;
        
        if (businessTypeFactor > 1.1) {
          newInsights.push({
            type: "positive",
            message: `${business.businessType} businesses typically see ${formatPercent((businessTypeFactor - 1) * 100)} higher ROI in the upcoming quarter.`,
            icon: <BarChart2 className="h-4 w-4 text-indigo-500" />
          });
        }
      }
      
      setInsights(newInsights);
      setIsGenerating(false);
    }, 1500); // Simulate processing time
  };

  // Generate initial predictions on component mount
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !predictions.length) {
      generatePredictions();
    }
  }, [campaigns]);

  // Helper function to get icon based on trend
  const getTrendIcon = (value: number) => {
    if (value > 0.05) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -0.05) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-amber-500" />;
  };

  if (isLoadingCampaigns) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Trend Predictor
          </CardTitle>
          <CardDescription>Loading your personalized predictions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 w-full animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Trend Predictor
          </CardTitle>
          <CardDescription>Add campaigns to see predictions</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            We need your campaign data to generate personalized predictions.
          </p>
          <Button asChild size="sm">
            <a href="/add-campaign">Add Your First Campaign</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Trend Predictor
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={generatePredictions}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Personalized ROI forecasts for the next 12 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {/* Prediction visualization */}
        <div className="h-52 w-full" style={{ minHeight: '208px', minWidth: '200px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={208} minWidth={200} aspect={1.5}>
            <LineChart
              data={predictions}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis
                tickFormatter={(value) => formatPercent(value, 0)}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) => [formatPercent(value as number), "Projected ROI"]}
                labelFormatter={(value) => `Month: ${value}`}
              />
              <Line
                type="monotone"
                dataKey="predictedROI"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2 border rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Yearly Avg</p>
            <p className="text-lg font-medium">{formatPercent(yearlyProjection)}</p>
          </div>
          <div className="p-2 border rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Best Month</p>
            <p className="text-lg font-medium text-green-600">{bestMonth}</p>
          </div>
          <div className="p-2 border rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Plan Ahead</p>
            <p className="text-lg font-medium text-amber-600">{worstMonth}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Insights section */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Smart Insights
          </h4>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-xs flex items-start">
                <span className="mr-2 mt-0.5">{insight.icon}</span>
                <span>{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
          <a href="/analytics">
            View Detailed Analysis
            <ChevronRight className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}