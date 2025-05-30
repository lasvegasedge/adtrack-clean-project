import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Parse the URL to get the selected items by ID
  const params = new URLSearchParams(window.location.search);
  const selectedIdsString = params.get('ids'); // Using 'ids' parameter now
  
  // Make sure to properly parse the IDs and filter out any non-numeric values
  const selectedItemIds = selectedIdsString 
    ? selectedIdsString.split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
    : [];
  
  const businessId = user?.businessId;
  
  // DEBUG - Log what we're getting in the URL
  console.log("Selected IDs from URL:", selectedIdsString);
  console.log("Parsed selected IDs:", selectedItemIds);
  
  // Fetch business details for the current user
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });
  
  // Fetch top performers from the API
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(true);
  
  // Fetch top performers the SAME way as the compare page does
  const { data: apiTopPerformers = [], isLoading: apiLoadingTopPerformers } = useQuery({
    queryKey: ['/api/top-performers'],
    // Using GET request directly without parameters - API will provide demo data
    enabled: true,
    // Add specific retry and staleTime settings to ensure data is fetched
    retry: 3,
    staleTime: 0
  });
  
  // Process API data once it loads
  useEffect(() => {
    if (!apiTopPerformers || apiTopPerformers.length === 0) {
      return;
    }
    
    console.log("Pricing page got top performers:", apiTopPerformers.length, 
      apiTopPerformers && apiTopPerformers.length > 0 
        ? `First item: ${apiTopPerformers[0].id}/${apiTopPerformers[0].businessId}` 
        : "No data");
    
    setTopPerformers(apiTopPerformers || []);
    setLoadingTopPerformers(false);
  }, [apiTopPerformers]);
  
  // We need to find performers AFTER they've been loaded, so we'll use an effect
  const [selectedPerformers, setSelectedPerformers] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
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
      
      console.log("Found selected performers:", found);
      setSelectedPerformers(found);
      
      // Track the position in original array for indexing
      const positions = found.map(performer => 
        topPerformers.findIndex(p => p.businessId === performer.businessId)
      );
      
      setSelectedPositions(positions);
      console.log("Selected positions in array:", positions);
      
      // Mark as processed so we don't trigger again
      setAlreadyProcessed(true);
    }
  }, [topPerformers, selectedItemIds, businessId, alreadyProcessed]);
  
  const totalCost = selectedPerformers.length * 19.99;
  
  const handleGoBack = () => {
    navigate("/compare");
  };
  
  const handleProceedToCheckout = () => {
    // Pass IDs to the purchase page
    navigate(`/purchase-top-performers?ids=${selectedItemIds.join(',')}`);
  };
  
  const handleRemoveItem = (id: number) => {
    // Filter out the ID that was removed
    const newSelectedIds = selectedItemIds.filter(itemId => itemId !== id);
    
    // Debug logs to help troubleshoot
    console.log(`Removing ID ${id} from selection`, {
      original: selectedItemIds,
      afterRemoval: newSelectedIds
    });
    
    // Navigate based on the remaining items
    if (newSelectedIds.length > 0) {
      // Force a full page refresh to ensure URL parameters get processed correctly
      window.location.href = `/pricing-page?ids=${newSelectedIds.join(',')}`;
    } else {
      navigate("/compare");
    }
  };
  
  const isPageLoading = isLoadingBusiness || loadingTopPerformers;
  
  return (
    <AppLayout title="Pricing Details">
      <div className="mb-4">
        <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Compare
        </Button>
      </div>
      
      <Card className="bg-white mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Pricing Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isPageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : selectedPerformers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No items selected. Go back to select top performers.</p>
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
                You've selected the following competitor campaign details to purchase:
              </p>
              
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPerformers.map((performer, i) => {
                      // Find the index position of this performer in the original array
                      const position = selectedPositions[i];
                      const rank = position >= 0 ? position + 1 : i + 1;
                      
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {`Business #${rank}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {performer.adMethod?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatPercent(performer.roi)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(19.99)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(performer.businessId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between text-sm font-medium">
                  <span>Subtotal ({selectedPerformers.length} item{selectedPerformers.length !== 1 ? 's' : ''})</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="border-t my-3 border-gray-200"></div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalCost)}</span>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-md text-sm text-blue-700">
                <p>
                  Purchasing competitor campaign details will give you valuable insights into:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Target audience demographics</li>
                  <li>Budget allocation</li>
                  <li>Campaign duration and scheduling</li>
                  <li>Conversion rates and strategies</li>
                  <li>Engagement metrics and performance</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        {selectedPerformers.length > 0 && (
          <CardFooter className="flex justify-between border-t pt-6">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Selection
            </Button>
            <Button 
              onClick={handleProceedToCheckout}
              className="flex items-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </AppLayout>
  );
}