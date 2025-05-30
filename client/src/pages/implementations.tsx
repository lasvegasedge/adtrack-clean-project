import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ClipboardList,
  Coins,
  CreditCard,
  Lightbulb,
  LineChart,
  Loader2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface AdMethod {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface RecommendationItem {
  id: number;
  recommendationId: number;
  adMethodId: number;
  budget: number;
  expectedRoi: number;
  priority: number;
  rationale: string;
  adMethod: AdMethod;
}

interface Recommendation {
  id: number;
  businessId: number;
  generatedAt: string;
  budgetScenario: string;
  totalBudget: number;
  averageRoi: number;
  adRecommendationItems: RecommendationItem[];
}

interface Implementation {
  id: number;
  timestamp: string;
  feedback: string | null;
  implementationDetails: any;
  recommendation: Recommendation;
}

const ImplementationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<Implementation[]>({
    queryKey: ["/api/user", user?.id, "implementations"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/user/${user?.id}/implementations`);
        if (!res.ok) {
          throw new Error(`Failed to fetch implementations: ${res.status} ${res.statusText}`);
        }
        
        // Check content type to determine how to parse the response
        const contentType = res.headers.get('content-type');
        
        // If content type is HTML (often from error pages), return empty array
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON for implementations");
          return [];
        }
        
        // Otherwise try to parse as JSON
        try {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch (e) {
          console.error("Error parsing implementations JSON:", e);
          // If JSON parsing fails, log the first 100 chars of response for debugging
          const text = await res.text();
          console.error("Response text (first 100 chars):", text.substring(0, 100));
          return [];
        }
      } catch (err) {
        console.error("Implementation fetch error:", err);
        return [];
      }
    },
    enabled: !!user,
    retry: false, // Don't retry on failure since we're handling errors gracefully
  });
  
  const implementations = data;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading your implementation plan...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <p className="text-lg text-red-500 mb-4">Error loading implementations: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  if (!implementations || implementations.length === 0) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold ml-4">My Implementation Plan</h1>
          </div>
          
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2 text-center">No implementations yet</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't saved any ad recommendations to your implementation plan.
                Visit the recommendations page to generate and implement ad strategies.
              </p>
              <Link href="/dashboard">
                <Button>Get Recommendations</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 mr-4">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">My Implementation Plan</h1>
              <p className="text-muted-foreground">
                Track and manage your selected ad recommendations
              </p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1 gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{implementations.length} Implementations</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {implementations.map((implementation) => (
            <Card key={implementation.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>Implementation Plan</span>
                      <Badge variant="secondary" className="ml-2">
                        {implementation.recommendation.budgetScenario}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Created on {format(new Date(implementation.timestamp), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium">
                      Expected ROI
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {implementation.recommendation.averageRoi}%
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Budget Allocation</h3>
                  <div className="text-sm text-muted-foreground">
                    Total: ${typeof implementation.recommendation.totalBudget === 'number' ? 
                      implementation.recommendation.totalBudget.toLocaleString() : '0'}
                  </div>
                </div>

                <ScrollArea className="h-[240px] pr-4">
                  <div className="space-y-4">
                    {implementation.recommendation.adRecommendationItems
                      .sort((a, b) => b.priority - a.priority)
                      .map((item) => (
                        <div key={item.id}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <div className="bg-primary/10 p-2 rounded-md mr-3">
                                <div
                                  className="w-6 h-6 flex items-center justify-center text-primary"
                                  dangerouslySetInnerHTML={{ __html: item.adMethod.icon }}
                                />
                              </div>
                              <div>
                                <div className="font-medium">{item.adMethod.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Expected ROI: {item.expectedRoi}%
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.budget || 0}</div>
                              <div className="text-xs text-muted-foreground">
                                Priority: {getPriorityText(item.priority || 1)}
                              </div>
                            </div>
                          </div>
                          <Progress 
                            value={getBudgetPercentage(item.budget || 0, implementation.recommendation.totalBudget)} 
                            className="h-2 mb-4"
                          />
                          <div className="text-sm mb-4 p-3 bg-muted/50 rounded-md">
                            {item.rationale}
                          </div>
                          <Separator className="mb-4" />
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 flex justify-between bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Implemented on {format(new Date(implementation.timestamp), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 text-primary" />
                  <span>AI-powered by AdTrack.online</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

// Helper functions
function getBudgetPercentage(budget: number, totalBudget?: number): number {
  if (!totalBudget) return 0;
  return (budget / totalBudget) * 100;
}

function getPriorityText(priority: number): string {
  switch (priority) {
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
      return "Low";
    default:
      return "Medium";
  }
}

export default ImplementationsPage;