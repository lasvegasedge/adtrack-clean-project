import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ReactMarkdown from 'react-markdown';

interface MarketingInsightsResponse {
  success: boolean;
  story: string;
  bulletPoints?: string[];
  recommendations?: string[];
  error?: string;
}

export default function MarketingInsightsSummary() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get the marketing insights summary
  const insightsMutation = useMutation<MarketingInsightsResponse, Error>({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST", 
        "/api/marketing-insights", 
        { insightType: "summary" }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to generate marketing insights");
      }
      
      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate marketing insights",
        variant: "destructive",
      });
    },
  });

  interface Business {
    id: number;
    userId: number;
    name: string;
    type: string;
    location: string;
    radius: number;
    createdAt: string;
  }

  // Get business data directly from the authenticated user
  // Using the known business ID to ensure proper data fetching
  const { data: business } = useQuery<Business>({
    queryKey: ["/api/business/2"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) {
        console.error("Failed to fetch business data:", await response.text());
        return null;
      }
      return response.json();
    },
  });

  // Handler for generating insights
  const generateInsights = async () => {
    insightsMutation.mutate();
  };

  // Get first two bullet points if available
  const getPreviewBulletPoints = () => {
    if (!insightsMutation.data?.bulletPoints || insightsMutation.data.bulletPoints.length === 0) return [];
    return insightsMutation.data.bulletPoints.slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Marketing Insights</CardTitle>
            <CardDescription>
              AI-generated analysis of your marketing performance
            </CardDescription>
          </div>
          {!insightsMutation.isPending && !insightsMutation.data && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Generate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-1">
        {insightsMutation.isPending && (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              Generating insights for {business?.name || "your business"}...
            </p>
          </div>
        )}

        {insightsMutation.isError && (
          <div className="p-4 rounded-md bg-destructive/10">
            <p className="text-sm text-destructive">
              {insightsMutation.error.message || "Unable to generate insights. Please try again."}
            </p>
          </div>
        )}

        {insightsMutation.isSuccess && insightsMutation.data && (
          <div>
            {getPreviewBulletPoints().length > 0 ? (
              <div>
                <h4 className="font-medium mb-2">Key Takeaways:</h4>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  {getPreviewBulletPoints().map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm prose-sm prose-gray max-w-none">
                <ReactMarkdown>
                  {insightsMutation.data.story.split('\n').slice(0, 6).join('\n')}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="link" 
          className="ml-auto"
          onClick={() => setLocation("/marketing-insights")}
        >
          View full report <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}