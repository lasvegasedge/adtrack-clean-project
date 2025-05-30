import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';

// Types for subscription data
export interface SubscriptionResponse {
  id: number;
  userId: number;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  isTrialPeriod: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureUsage {
  featureId: string;
  name: string;
  description?: string;
  used: number;
  limit: number | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionResponse | null;
  subscriptionType: string | null;
  usageData: Record<string, FeatureUsage> | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasFeatureAccess: (featureId: string) => boolean;
  getFeatureAccessLevel: (featureId: string) => 'full' | 'limited' | 'none';
  getCurrentUsage: (featureId: string) => number | null;
  getRemainingUsage: (featureId: string) => number | null;
  isPremium: boolean;
  isProfessional: boolean;
  isBasic: boolean;
  isFree: boolean;
  daysLeft: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Fetch subscription data
  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/subscription'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    // Poll every 5 minutes to keep subscription status up to date
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch feature usage data
  const { data: usageData } = useQuery({
    queryKey: ['/api/subscription/usage'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    // Only fetch if user has a subscription
    enabled: !!subscriptionData?.subscription,
    // Poll every 5 minutes to keep usage data up to date
    refetchInterval: 5 * 60 * 1000,
  });

  // Extract subscription data
  const subscription = subscriptionData?.subscription || null;
  const subscriptionType = subscription?.planId || null;
  
  // Determine plan level
  const isPremium = subscriptionType === 'premium';
  const isProfessional = subscriptionType === 'professional';
  const isBasic = subscriptionType === 'basic';
  const isFree = !subscriptionType || subscriptionType === 'free';

  // Calculate days left in subscription period
  const daysLeft = subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Check if user has access to a specific feature
  const hasFeatureAccess = (featureId: string): boolean => {
    if (!subscription) return false;

    const accessLevel = getFeatureAccessLevel(featureId);
    if (accessLevel === 'none') return false;
    
    // For limited access, also check usage limits
    if (accessLevel === 'limited') {
      const remainingUsage = getRemainingUsage(featureId);
      // If there's a limit and it's reached, no access
      if (remainingUsage !== null && remainingUsage <= 0) {
        return false;
      }
    }
    
    return true;
  };

  // Get access level for a feature
  const getFeatureAccessLevel = (featureId: string): 'full' | 'limited' | 'none' => {
    if (!subscription) return 'none';
    
    // Determine access based on subscription type and feature
    // This is a simplified version - in production, this would be fetched from the server
    if (isPremium) {
      // Premium has full access to everything
      return 'full';
    } else if (isProfessional) {
      // Professional has full access to some features, limited to others
      if (['roi_tracking', 'ad_upload'].includes(featureId)) {
        return 'full';
      } else if (['competitor_analysis', 'ai_recommendations', 'marketing_insights', 'location_management'].includes(featureId)) {
        return 'limited';
      }
      return 'none';
    } else if (isBasic) {
      // Basic has limited access to some features
      if (['roi_tracking', 'competitor_analysis', 'ad_upload', 'location_management'].includes(featureId)) {
        return 'limited';
      }
      return 'none';
    }
    
    // Free users get no access to premium features
    return 'none';
  };

  // Get current usage for a feature
  const getCurrentUsage = (featureId: string): number | null => {
    if (!usageData?.features) return null;
    return usageData.features[featureId]?.used || 0;
  };

  // Get remaining usage for a feature
  const getRemainingUsage = (featureId: string): number | null => {
    if (!usageData?.features) return null;
    const feature = usageData.features[featureId];
    
    if (!feature || feature.limit === null) return null;
    return Math.max(0, feature.limit - feature.used);
  };

  // Refetch subscription data
  const handleRefetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] })
    ]);
  };

  // Context value
  const value: SubscriptionContextType = {
    subscription,
    subscriptionType,
    usageData: usageData?.features || null,
    isLoading,
    error,
    refetch: handleRefetch,
    hasFeatureAccess,
    getFeatureAccessLevel,
    getCurrentUsage,
    getRemainingUsage,
    isPremium,
    isProfessional,
    isBasic,
    isFree,
    daysLeft
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
}