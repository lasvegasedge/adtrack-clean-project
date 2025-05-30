import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, Info, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MockPaymentForm from "@/components/payment/MockPaymentForm";

export default function PurchaseTopPerformers() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Parse the URL to get the selected items by ID
  const params = new URLSearchParams(window.location.search);
  const selectedIdsString = params.get('ids');
  
  // Make sure to properly parse the IDs and filter out any non-numeric values
  const selectedItemIds = selectedIdsString 
    ? selectedIdsString.split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
    : [];
    
  console.log("Selected IDs on purchase page:", selectedItemIds);
  
  const businessId = user?.businessId;
  
  // Fetch business details for the current user
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });
  
  // Fetch top performers from the API
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(true);
  
  // Fetch top performers using the API
  const { data: adMethods } = useQuery({
    queryKey: ['/api/ad-methods'],
  });
  
  // Fetch top performers the SAME way as the compare page does
  const { data: apiTopPerformers = [] as any[], isLoading: apiLoadingTopPerformers } = useQuery({
    queryKey: ['/api/top-performers'],
    // Using GET request directly without parameters - API will provide demo data
    enabled: true,
    // Add specific retry and staleTime settings to ensure data is fetched
    retry: 3,
    staleTime: 0,
  });
  
  // Process data once it's loaded
  useEffect(() => {
    if (!apiTopPerformers || apiTopPerformers.length === 0) {
      return;
    }
    
    console.log("Purchase page got top performers:", apiTopPerformers.length, 
      apiTopPerformers && apiTopPerformers.length > 0 
        ? `First item: ${apiTopPerformers[0].id}/${apiTopPerformers[0].businessId}` 
        : "No data");
    
    try {
      // Enhance the performers with additional mock details
      const enhancedPerformers = apiTopPerformers.map((performer: any, i: number) => ({
        ...performer,
        cost: 19.99,
        details: {
          targetAudience: ["Millennials", "Seniors", "Gen Z", "Professionals", "Students", "Local community", "Families"][i % 7],
          budget: parseFloat(performer.amountSpent),
          duration: performer.endDate ? Math.round((new Date(performer.endDate).getTime() - new Date(performer.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 30,
          conversionRate: parseFloat((performer.roi / 20).toFixed(1)),
          engagement: ["High", "Medium", "Very High", "Low", "Medium", "Low", "Medium"][i % 7]
        }
      }));
      
      setTopPerformers(enhancedPerformers);
    } catch (error) {
      console.error("Error processing top performers:", error);
      
      // If we can't process the API data, provide sample data instead
      const samplePerformers = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        businessId: i === 2 ? businessId : 1000 + i,
        name: i === 2 ? "Your Business" : `Business #${i + 1}`,
        adMethod: { name: adMethods?.[i % (adMethods?.length || 1)]?.name || "Unknown" },
        roi: [95.4, 88.7, 82.1, 76.5, 71.2, 68.3, 63.8][i],
        cost: 19.99,
        details: {
          targetAudience: ["Millennials", "Seniors", "Gen Z", "Professionals", "Students", "Local community", "Families"][i],
          budget: [5000, 3500, 4200, 2800, 3000, 6000, 2500][i],
          duration: [30, 45, 60, 15, 90, 30, 45][i],
          conversionRate: [4.2, 3.8, 3.5, 2.9, 3.1, 2.7, 2.5][i],
          engagement: ["High", "Medium", "Very High", "Low", "Medium", "Low", "Medium"][i]
        }
      }));
      
      setTopPerformers(samplePerformers);
    } finally {
      setLoadingTopPerformers(false);
    }
  }, [apiTopPerformers, businessId, adMethods]);
  
  // We need to find performers AFTER they've been loaded, so we'll use an effect
  const [selectedPerformers, setSelectedPerformers] = useState<any[]>([]);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);
  
  // Find selected performers once topPerformers is loaded - with protection against infinite loops
  useEffect(() => {
    console.log("Top performers loaded:", topPerformers.length, "Searching for IDs:", selectedItemIds);
    
    // Only run this once when data loads to prevent infinite loop
    if (topPerformers.length > 0 && selectedItemIds.length > 0 && !alreadyProcessed) {
      // Find the performers in the loaded data
      const found = selectedItemIds
        .map(id => {
          // Try to find the performer by businessId first (new approach)
          let performer = topPerformers.find(p => p.businessId === id);
          if (!performer) {
            // Fallback to looking by campaign id (old approach)
            performer = topPerformers.find(p => p.id === id);
          }
          console.log(`Looking for performer with ID ${id}:`, performer);
          return performer;
        })
        .filter(p => p && p.businessId !== businessId); // Filter out the user's business
      
      console.log("Found selected performers on purchase page:", found);
      setSelectedPerformers(found);
      
      // Mark as processed so we don't trigger again
      setAlreadyProcessed(true);
    }
  }, [topPerformers, selectedItemIds, businessId, alreadyProcessed]);
  
  const totalCost = selectedPerformers.reduce((sum, item) => sum + (item?.cost || 0), 0);
  
  const handleGoBack = () => {
    navigate("/pricing-page");
  };
  
  // State to manage checkout visibility
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  
  const handleCheckout = () => {
    setShowStripeCheckout(true);
  };
  
  const handlePaymentSuccess = () => {
    toast({
      title: "Purchase Successful!",
      description: "You now have access to the selected competitor data.",
    });
    // Redirect to dashboard or show success screen
    navigate("/dashboard");
  };
  
  const handlePaymentCancel = () => {
    // Hide the checkout component
    setShowStripeCheckout(false);
  };
  
  const isPageLoading = isLoadingBusiness || loadingTopPerformers;
  
  return (
    <AppLayout title="Purchase Top Performer Data">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={handleGoBack} 
          className="flex items-center gap-2"
          disabled={showStripeCheckout}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Compare
        </Button>
      </div>
      
      {showStripeCheckout ? (
        <MockPaymentForm 
          amount={totalCost}
          itemIds={selectedItemIds}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      ) : (
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Purchase Competitor Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : selectedPerformers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No items selected for purchase. Go back to select top performers.</p>
                <Button 
                  variant="default" 
                  onClick={handleGoBack} 
                  className="mt-4"
                >
                  Select Performers
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  You're about to purchase detailed information about the following top-performing campaigns:
                </p>
                
                <div className="border rounded-md divide-y">
                  {selectedPerformers.map((performer, index) => (
                    <div key={index} className="p-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">{performer.name}</h3>
                        <span className="text-primary font-medium">{formatCurrency(performer.cost)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Ad Method:</span> {performer.adMethod.name}
                        </div>
                        <div>
                          <span className="font-medium">ROI:</span> {formatPercent(performer.roi)}
                        </div>
                        <div className="col-span-2 mt-2">
                          <h4 className="font-medium mb-1 text-gray-700">Premium metrics included in purchase:</h4>
                          <div className="grid grid-cols-2 gap-x-4 ml-2">
                            <div className="text-gray-500">• Target Audience <span className="text-xs text-gray-400">(e.g., Millennials, Professionals)</span></div>
                            <div className="text-gray-500">• Budget <span className="text-xs text-gray-400">(detailed spend)</span></div>
                            <div className="text-gray-500">• Duration <span className="text-xs text-gray-400">(campaign length in days)</span></div>
                            <div className="text-gray-500">• Conversion Rate <span className="text-xs text-gray-400">(actual percentages)</span></div>
                            <div className="text-gray-500">• Engagement <span className="text-xs text-gray-400">(Low/Medium/High metrics)</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 bg-gray-50 p-4 rounded-md flex items-start gap-3">
                  <Info className="text-blue-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="mb-2">
                      <strong>What you'll receive after purchase:</strong> Detailed competitor campaign metrics 
                      including specific target audience segments, exact campaign duration, precise budget allocation,
                      actual conversion rates, and engagement level metrics.
                    </p>
                    <p>
                      You can use these insights to benchmark your campaigns against top performers in your area,
                      identify opportunities to optimize your marketing strategy, and significantly improve your ROI.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {selectedPerformers.length > 0 && (
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="font-medium">
                Total: <span className="text-primary">{formatCurrency(totalCost)}</span>
              </div>
              <Button 
                onClick={handleCheckout} 
                disabled={isLoading || showStripeCheckout}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </AppLayout>
  );
}