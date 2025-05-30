import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { usePricingRecommendations } from '@/hooks/use-pricing-recommendations';
import { AdMethod } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PricingRecommendationsList } from '@/components/pricing-recommendations/PricingRecommendationsList';
import AppLayout from '@/components/layout/AppLayout';

export default function PricingRecommendationsPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Get the user's business ID
  // Use businessId 2 as a fallback for demo purposes (the demo account is tied to this ID)
  const businessId = user?.businessId || 2;
  
  console.log('Current business ID:', businessId);
  
  // Get ad methods for selection
  const {
    data: adMethods = [],
    isLoading: isLoadingAdMethods,
  } = useQuery<AdMethod[], Error>({
    queryKey: ['/api/ad-methods'],
    queryFn: async () => {
      const response = await fetch('/api/ad-methods');
      if (!response.ok) {
        throw new Error('Failed to load ad methods');
      }
      return response.json();
    },
  });
  
  // Get pricing recommendations
  const {
    pricingRecommendations,
    isLoadingRecommendations,
    isRequestingRecommendation,
  } = usePricingRecommendations(businessId);
  
  console.log('Pricing recommendations loaded:', pricingRecommendations.length);
  
  // Handler for the New Recommendation button - navigate to dedicated page
  const handleNewRecommendationClick = () => {
    console.log('Navigating to new recommendation request page');
    setLocation('/pricing-recommendation-request');
  };
  
  const content = isLoadingAdMethods || isLoadingRecommendations ? (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-medium">Loading pricing recommendations...</h3>
    </div>
  ) : (
    <div className="container max-w-6xl py-6 space-y-6 mb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered pricing suggestions for your advertising campaigns
          </p>
        </div>
        
        <Button onClick={handleNewRecommendationClick} disabled={isRequestingRecommendation}>
          <Plus className="mr-2 h-4 w-4" />
          New Recommendation
        </Button>
      </div>
      
      <div className="space-y-6">
        {pricingRecommendations.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="h-6 w-6 text-gray-400" />}
            title="No pricing recommendations"
            description="You haven't requested any pricing recommendations yet. Get started by requesting a new recommendation."
            actions={[
              {
                label: "Request Recommendation",
                onClick: handleNewRecommendationClick,
              }
            ]}
            className="my-8"
          />
        ) : (
          <PricingRecommendationsList
            recommendations={pricingRecommendations}
            adMethods={adMethods}
            businessId={businessId}
            onRequestNew={handleNewRecommendationClick}
          />
        )}
      </div>
    </div>
  );
  
  return (
    <AppLayout title="Pricing Recommendations">
      {content}
    </AppLayout>
  );
}