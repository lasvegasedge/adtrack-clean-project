import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { usePricingRecommendations } from '@/hooks/use-pricing-recommendations';
import { AdMethod } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PricingRecommendationRequest } from '@/components/pricing-recommendations/PricingRecommendationRequest';
import AppLayout from '@/components/layout/AppLayout';

export default function PricingRecommendationRequestPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Get the user's business ID
  // Use businessId 2 as a fallback for demo purposes (the demo account is tied to this ID)
  const businessId = user?.businessId || 2;
  
  console.log('PricingRecommendationRequestPage - businessId:', businessId);
  
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
  
  // Handler for when a recommendation request is completed
  const handleRequestComplete = () => {
    console.log('Request completed, returning to recommendations list');
    setLocation('/pricing-recommendations');
  };
  
  const content = isLoadingAdMethods ? (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-medium">Loading advertising methods...</h3>
    </div>
  ) : (
    <div className="container max-w-3xl py-6 space-y-6 mb-16">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4" 
          onClick={() => setLocation('/pricing-recommendations')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recommendations
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Pricing Recommendation</h1>
      </div>
      
      <PricingRecommendationRequest
        businessId={businessId}
        adMethods={adMethods}
        onRequestComplete={handleRequestComplete}
      />
    </div>
  );
  
  return (
    <AppLayout title="New Pricing Recommendation">
      {content}
    </AppLayout>
  );
}