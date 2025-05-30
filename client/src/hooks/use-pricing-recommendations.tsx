import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PricingRecommendation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Simple interface for frontend components to use
interface SimplePricingRecommendationRequest {
  adMethodId: number;
  includeCompetitorData?: boolean;
}

interface PricingRecommendationUpdate {
  id: number;
  userFeedback?: string;
  implementedAt?: Date | null;
  dismissedAt?: Date | null;
  isImplemented?: boolean;
}

export function usePricingRecommendations(businessId: number) {
  const queryClient = useQueryClient();
  const queryKey = `/api/business/${businessId}/pricing-recommendations`;
  
  // Get all recommendations for a business
  const {
    data: pricingRecommendations = [],
    isLoading: isLoadingRecommendations,
    isError: isErrorRecommendations,
    error: errorRecommendations,
  } = useQuery<PricingRecommendation[], Error>({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await apiRequest('GET', queryKey);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load pricing recommendations');
      }
      return response.json();
    },
    enabled: !!businessId,
  });
  
  // Request a new pricing recommendation
  const {
    mutateAsync: requestRecommendation,
    isPending: isRequestingRecommendation,
  } = useMutation<PricingRecommendation, Error, SimplePricingRecommendationRequest>({
    mutationFn: async (requestData) => {
      const response = await apiRequest('POST', queryKey, requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request pricing recommendation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
  
  // Update pricing recommendation feedback or implementation status
  const {
    mutateAsync: updateRecommendation,
    isPending: isUpdatingRecommendation,
  } = useMutation<PricingRecommendation, Error, PricingRecommendationUpdate>({
    mutationFn: async (updateData) => {
      const response = await apiRequest('PATCH', `${queryKey}/${updateData.id}`, updateData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update pricing recommendation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
  
  // Get recommendations by status - current, implemented, dismissed
  const getCurrentRecommendations = () => {
    return pricingRecommendations.filter(rec => !rec.implementedAt && !rec.dismissedAt);
  };
  
  const getImplementedRecommendations = () => {
    return pricingRecommendations.filter(rec => !!rec.implementedAt);
  };
  
  const getDismissedRecommendations = () => {
    return pricingRecommendations.filter(rec => !!rec.dismissedAt);
  };
  
  return {
    pricingRecommendations,
    isLoadingRecommendations,
    isErrorRecommendations,
    errorRecommendations,
    requestRecommendation,
    isRequestingRecommendation,
    updateRecommendation,
    isUpdatingRecommendation,
    getCurrentRecommendations,
    getImplementedRecommendations,
    getDismissedRecommendations,
  };
}