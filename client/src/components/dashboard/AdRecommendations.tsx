import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Check, 
  X, 
  Info, 
  Star 
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdRecommendationProps {
  businessId: number;
}

type AdMethodType = {
  id: number;
  name: string;
};

type ScenarioData = {
  conservative: { budget: number; predictedRoi: number };
  moderate: { budget: number; predictedRoi: number };
  aggressive: { budget: number; predictedRoi: number };
};

type RecommendationItem = {
  id: number;
  recommendationId: number;
  adMethodId: number;
  rank: number;
  predictedRoi: number;
  recommendedBudget: string;
  rationale: string;
  confidenceScore: number;
  scenarioData: ScenarioData;
  adMethod?: AdMethodType;
};

type Recommendation = {
  id: number;
  businessId: number;
  generatedAt: string;
  expiresAt: string;
  isViewed: boolean;
  summaryText: string;
  confidenceScore: number;
  adRecommendationItems: RecommendationItem[];
};

const AdRecommendations: React.FC<AdRecommendationProps> = ({ businessId }) => {
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  
  // Fetch recommendation data
  const [showEmptyState, setShowEmptyState] = useState<boolean>(true);
  const { 
    data: recommendation, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['/api/ad-recommendations', businessId],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/ad-recommendations/${businessId}`);
        
        // For 404 responses, show empty state - this is expected when no recommendations exist
        if (res.status === 404) {
          setShowEmptyState(true);
          return null;
        }
        
        // Check content type to handle HTML responses
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON for recommendations");
          setShowEmptyState(true);
          return null;
        }
        
        // For unexpected errors, throw
        if (!res.ok) {
          throw new Error(`Failed to fetch recommendations: ${res.status} ${res.statusText}`);
        }
        
        try {
          const data = await res.json();
          
          // Extra validation to ensure we have a valid recommendation object
          if (!data || !data.recommendation || typeof data.recommendation !== 'object') {
            console.warn("Invalid recommendation data format", data);
            setShowEmptyState(true);
            return null;
          }
          
          // We have recommendations, don't show empty state
          setShowEmptyState(false);
          return data.recommendation;
        } catch (jsonError) {
          console.error("Error parsing recommendations JSON:", jsonError);
          setShowEmptyState(true);
          return null;
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setShowEmptyState(true);
        return null;
      }
    },
    retry: 0,
    retryOnMount: false,
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/ad-recommendations', { businessId });
        
        // Check content type to handle HTML responses
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON when generating recommendations");
          throw new Error('Received unexpected response format. Please try again.');
        }
        
        if (!res.ok) {
          throw new Error(`Failed to generate recommendations: ${res.status} ${res.statusText}`);
        }
        
        try {
          return await res.json();
        } catch (jsonError) {
          console.error("Error parsing generated recommendations JSON:", jsonError);
          throw new Error('Generated recommendations had an invalid format');
        }
      } catch (error) {
        console.error('Error generating recommendations:', error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'New recommendations have been generated',
        variant: 'default',
      });
      // After success, we need to refetch the recommendations
      setTimeout(() => refetch(), 500); // Small delay to ensure server has processed
    },
    onError: (err: Error) => {
      toast({
        title: 'Error Generating Recommendations',
        description: err.message || 'Failed to generate recommendations. Please try again later.',
        variant: 'destructive',
      });
      // Even on error, try to refetch to show any existing recommendations
      setTimeout(() => refetch(), 500);
    },
  });

  // Record user interaction with recommendation
  const interactionMutation = useMutation({
    mutationFn: async ({ 
      recommendationId, 
      interactionType, 
      feedback 
    }: { 
      recommendationId: number; 
      interactionType: string; 
      feedback?: string;
    }) => {
      try {
        const res = await apiRequest(
          'POST', 
          `/api/ad-recommendations/${recommendationId}/interaction`, 
          { interactionType, feedback }
        );
        
        // Check content type to handle HTML responses
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON when recording interaction");
          throw new Error('Received unexpected response format. Please try again.');
        }
        
        if (!res.ok) {
          throw new Error(`Failed to record interaction: ${res.status} ${res.statusText}`);
        }
        
        try {
          return await res.json();
        } catch (jsonError) {
          console.error("Error parsing interaction response JSON:", jsonError);
          // If we can't parse the JSON but got a 200 response, consider it a success
          if (res.ok) {
            return { success: true };
          }
          throw new Error('Failed to process interaction response');
        }
      } catch (error) {
        console.error('Error recording interaction:', error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ad-recommendations', businessId] });
      
      // Show different success messages based on the interaction type
      if (variables.interactionType === 'IMPLEMENT') {
        toast({
          title: '✅ Implementation Recorded',
          description: `Success! The recommendation has been saved to your implementation plan.`,
          variant: 'default',
          duration: 5000, // Show for longer
        });
      } else if (variables.interactionType === 'DISMISS') {
        toast({
          title: 'Recommendation Dismissed',
          description: 'This recommendation has been dismissed from your view.',
          variant: 'default',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Action Failed',
        description: `Couldn't save your decision: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: 'destructive',
      });
    },
  });

  // Handle user implementing a recommendation
  const handleImplement = (item: RecommendationItem) => {
    if (!recommendation) return;
    
    interactionMutation.mutate({
      recommendationId: recommendation.id,
      interactionType: 'IMPLEMENT',
      feedback: `Implementing ${item.adMethod?.name} recommendation with budget ${item.recommendedBudget}`
    });
  };

  // Handle user dismissing a recommendation
  const handleDismiss = (item: RecommendationItem) => {
    if (!recommendation) return;
    
    interactionMutation.mutate({
      recommendationId: recommendation.id,
      interactionType: 'DISMISS',
      feedback: `Dismissed ${item.adMethod?.name} recommendation`
    });
  };

  // Generate a new set of recommendations
  const handleRefresh = () => {
    generateMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ad Recommendations</CardTitle>
          <CardDescription>Analyzing your campaign data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Now we use showEmptyState to determine if we should show the empty state
  if (showEmptyState || !recommendation || !recommendation.adRecommendationItems || recommendation.adRecommendationItems.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ad Recommendations</CardTitle>
          <CardDescription>No recommendations available</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Info className="h-12 w-12 text-primary" />
            <p className="text-muted-foreground">
              We don't have any recommendations for you yet. Generate your first set of AI-powered recommendations!
            </p>
            <Button 
              onClick={handleRefresh} 
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort recommendations by rank (1 is top rank)
  const sortedRecommendations = [...recommendation.adRecommendationItems].sort((a, b) => a.rank - b.rank);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI-Powered Ad Recommendations</CardTitle>
            <CardDescription>
              Personalized insights based on your campaign history and industry data
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overall Summary */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">{recommendation.summaryText}</p>
            </div>
            <div className="w-16 h-16 ml-4 flex-shrink-0">
              <CircularProgressbar
                value={recommendation.confidenceScore * 100}
                text={`${Math.round(recommendation.confidenceScore * 100)}%`}
                styles={buildStyles({
                  textSize: '24px',
                  pathColor: `hsl(var(--primary))`,
                  textColor: 'hsl(var(--primary))',
                  trailColor: 'hsl(var(--muted))',
                })}
              />
            </div>
          </div>
        </div>

        {/* Budget Scenario Selector */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Budget Scenario</h3>
          <Tabs defaultValue="moderate" onValueChange={(v) => setSelectedScenario(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conservative">Conservative</TabsTrigger>
              <TabsTrigger value="moderate">Moderate</TabsTrigger>
              <TabsTrigger value="aggressive">Aggressive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          {sortedRecommendations.map((item) => {
            // Get scenario-specific data
            const scenarioData = item.scenarioData?.[selectedScenario] || {
              budget: parseFloat(item.recommendedBudget),
              predictedRoi: item.predictedRoi
            };
            
            return (
              <div 
                key={item.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-lg">{item.adMethod?.name}</h3>
                      <Badge variant={
                        item.rank === 1 ? "default" : 
                        item.rank === 2 ? "secondary" : 
                        "outline"
                      }>
                        Rank #{item.rank}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence: {Math.round(item.confidenceScore * 100)}%
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={() => handleDismiss(item)}
                      disabled={interactionMutation.isPending}
                    >
                      {interactionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>Dismiss</span>
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex items-center space-x-1"
                      onClick={() => handleImplement(item)}
                      disabled={interactionMutation.isPending}
                    >
                      {interactionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span>Implement</span>
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Recommended Budget</h4>
                    <p className="text-2xl font-bold">${scenarioData.budget.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Predicted ROI</h4>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold mr-2">
                        {scenarioData.predictedRoi.toFixed(1)}%
                      </p>
                      {scenarioData.predictedRoi > 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Rationale</h4>
                  <p className="text-sm text-muted-foreground">{item.rationale}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(recommendation.generatedAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-primary" />
              <span>AI-powered by AdTrack.online</span>
            </div>
            <span className="mx-2">•</span>
            <a 
              href="/implementations" 
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              View My Implementation Plan
            </a>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdRecommendations;