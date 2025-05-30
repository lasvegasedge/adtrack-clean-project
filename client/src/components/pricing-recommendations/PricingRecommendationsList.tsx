import { useState } from 'react';
import { PricingRecommendation, AdMethod } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PricingRecommendationCard } from './PricingRecommendationCard';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface PricingRecommendationsListProps {
  recommendations: PricingRecommendation[];
  adMethods: AdMethod[];
  businessId: number;
  onRequestNew: () => void;
}

export function PricingRecommendationsList({
  recommendations,
  adMethods,
  businessId,
  onRequestNew
}: PricingRecommendationsListProps) {
  const [activeTab, setActiveTab] = useState('current');
  
  // Filter recommendations by status
  const currentRecommendations = recommendations.filter(rec => !rec.implementedAt && !rec.dismissedAt);
  const implementedRecommendations = recommendations.filter(rec => !!rec.implementedAt);
  const dismissedRecommendations = recommendations.filter(rec => !!rec.dismissedAt);
  
  // Find ad method by ID
  const getAdMethod = (adMethodId: number) => {
    return adMethods.find(method => method.id === adMethodId);
  };
  
  const renderEmptyState = () => {
    if (activeTab === 'current' && currentRecommendations.length === 0) {
      return (
        <EmptyState
          icon={<DollarSign className="h-6 w-6 text-gray-400" />}
          title="No active pricing recommendations"
          description="You don't have any active pricing recommendations at the moment. Request a new recommendation to get started."
          actions={[
            {
              label: "Request Recommendation",
              onClick: onRequestNew,
            }
          ]}
          className="my-8"
        />
      );
    } else if (activeTab === 'implemented' && implementedRecommendations.length === 0) {
      return (
        <EmptyState
          icon={<CheckCircle className="h-6 w-6 text-gray-400" />}
          title="No implemented recommendations"
          description="You haven't implemented any pricing recommendations yet. When you do, they'll appear here."
          actions={[
            {
              label: "View Current Recommendations",
              onClick: () => setActiveTab('current'),
              variant: "outline"
            }
          ]}
          className="my-8"
        />
      );
    } else if (activeTab === 'dismissed' && dismissedRecommendations.length === 0) {
      return (
        <EmptyState
          icon={<XCircle className="h-6 w-6 text-gray-400" />}
          title="No dismissed recommendations"
          description="You haven't dismissed any pricing recommendations yet. When you do, they'll appear here."
          actions={[
            {
              label: "View Current Recommendations",
              onClick: () => setActiveTab('current'),
              variant: "outline"
            }
          ]}
          className="my-8"
        />
      );
    }
    
    return null;
  };
  
  return (
    <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="current" className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>Current</span>
          {currentRecommendations.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {currentRecommendations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="implemented" className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Implemented</span>
          {implementedRecommendations.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {implementedRecommendations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="dismissed" className="flex items-center">
          <XCircle className="h-4 w-4 mr-2" />
          <span>Dismissed</span>
          {dismissedRecommendations.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {dismissedRecommendations.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      {renderEmptyState()}
      
      <TabsContent value="current" className="space-y-6">
        {currentRecommendations.map((recommendation) => (
          <PricingRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            adMethod={getAdMethod(recommendation.adMethodId)}
            businessId={businessId}
            showFeedbackForm={true}
          />
        ))}
      </TabsContent>
      
      <TabsContent value="implemented" className="space-y-6">
        {implementedRecommendations.map((recommendation) => (
          <PricingRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            adMethod={getAdMethod(recommendation.adMethodId)}
            businessId={businessId}
            showFeedbackForm={false}
          />
        ))}
      </TabsContent>
      
      <TabsContent value="dismissed" className="space-y-6">
        {dismissedRecommendations.map((recommendation) => (
          <PricingRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            adMethod={getAdMethod(recommendation.adMethodId)}
            businessId={businessId}
            showFeedbackForm={false}
          />
        ))}
      </TabsContent>
    </Tabs>
  );
}