import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock, Share2, Zap, ArrowRight } from 'lucide-react';

interface FeatureWrapperProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  watermark?: boolean;
  limitedMessage?: string;
  unavailableMessage?: string;
  onUsage?: () => void;
}

export default function FeatureWrapper({
  featureId,
  children,
  fallback,
  watermark = true,
  limitedMessage = "You have limited access to this feature",
  unavailableMessage = "Upgrade your subscription to access this feature",
  onUsage
}: FeatureWrapperProps) {
  const [, navigate] = useLocation();
  const { hasFeatureAccess, getFeatureAccessLevel, getCurrentUsage, getRemainingUsage, isLoading } = useSubscription();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);

  // If still loading subscription data, show minimal UI
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md animate-pulse">
        <div className="h-8 w-2/3 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  // Check if user has access to the feature
  const accessLevel = getFeatureAccessLevel(featureId);
  const remainingUsage = getRemainingUsage(featureId);
  const currentUsage = getCurrentUsage(featureId);
  const hasAccess = hasFeatureAccess(featureId);
  
  // Determine access messaging
  const hasLimitedAccess = accessLevel === 'limited';
  const hasNoAccess = accessLevel === 'none';

  // Function to track feature usage
  const trackFeatureUsage = async () => {
    if (isTracking) return;

    try {
      setIsTracking(true);
      
      // Call API to track usage
      const response = await apiRequest('POST', '/api/subscription/track-usage', {
        featureId
      });
      
      if (!response.ok) {
        throw new Error('Failed to track feature usage');
      }
      
      // Invalidate subscription query to refresh usage data
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      
      // Call onUsage callback if provided
      if (onUsage) {
        onUsage();
      }
    } catch (error) {
      toast({
        title: 'Usage tracking failed',
        description: 'Unable to track feature usage. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTracking(false);
    }
  };

  // For full access, just render children with usage tracking
  if (accessLevel === 'full') {
    // Track usage when rendered (optional)
    React.useEffect(() => {
      trackFeatureUsage();
    }, []);

    return <>{children}</>;
  }

  // For limited access
  if (hasLimitedAccess) {
    // If there's a usage limit and user has used it all
    if (remainingUsage !== null && remainingUsage <= 0) {
      return (
        <Card className="p-6 space-y-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-lg font-medium">Usage Limit Reached</h3>
            </div>
            <Badge variant="outline" className="border-amber-500 text-amber-600">Limited Access</Badge>
          </div>
          
          <p className="text-gray-600">
            You've reached your usage limit for this feature. Upgrade your subscription to get unlimited access.
          </p>
          
          {currentUsage !== null && (
            <div className="text-sm text-gray-500">
              <span>Used: {currentUsage} times this billing period</span>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing?feature=' + featureId)}>
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Upgrade Now
            </Button>
          </div>
        </Card>
      );
    }
    
    // User still has remaining usage
    React.useEffect(() => {
      trackFeatureUsage();
    }, []);

    // Add watermark if specified
    return (
      <div className="relative">
        {watermark && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="border-amber-500 text-amber-600 bg-white bg-opacity-75 shadow-sm">
              <Unlock className="h-3 w-3 mr-1" />
              Limited
            </Badge>
          </div>
        )}
        
        {children}
        
        {remainingUsage !== null && (
          <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
            <span>
              {remainingUsage} uses remaining this month
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => navigate('/pricing?feature=' + featureId)}
            >
              Upgrade
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // No access - show restriction UI
  if (hasNoAccess) {
    // If a fallback UI is provided, show that
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Otherwise show standard locked feature message
    return (
      <Card className="p-6 space-y-4 border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium">Premium Feature</h3>
          </div>
          <Badge variant="outline" className="border-red-500 text-red-600">Locked</Badge>
        </div>
        
        <p className="text-gray-600">
          {unavailableMessage}
        </p>
        
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/pricing?feature=' + featureId)}>
            <Zap className="mr-1.5 h-4 w-4" />
            Upgrade Now
          </Button>
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            <Share2 className="mr-1.5 h-4 w-4" />
            View Plans
          </Button>
        </div>
      </Card>
    );
  }

  // Default case - shouldn't normally reach here
  return <>{children}</>;
}