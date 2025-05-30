import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AdPerformanceComparison from '@/components/dashboard/AdPerformanceComparison';
import YourROIRanking from '@/components/dashboard/YourROIRanking';
import { useAuth } from '@/hooks/use-auth';

const ComparisonPage: React.FC = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [businessType, setBusinessType] = useState<string>('');
  
  // Fetch business data for the current user
  const { data: businessData, isLoading: loadingBusiness } = useQuery<any>({
    queryKey: ['/api/user', user?.id, 'business'],
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (businessData) {
      setBusinessId(businessData.id);
      setBusinessType(businessData.businessType);
    }
  }, [businessData]);
  
  if (loadingBusiness) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading comparison data...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!businessId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <p className="text-lg font-medium mb-2">No business data available</p>
          <p className="text-muted-foreground">
            Please set up your business profile to access comparisons.
          </p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-2">Ad Performance Comparisons</h1>
        <p className="text-muted-foreground mb-6">
          Compare your business performance against similar businesses and analyze which advertising methods provide the best ROI
        </p>
        
        <div className="space-y-8">
          {/* Ranking Component */}
          <div>
            <YourROIRanking businessId={businessId} businessType={businessType} />
          </div>
          
          {/* Performance Comparison Component */}
          <div>
            <AdPerformanceComparison />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ComparisonPage;