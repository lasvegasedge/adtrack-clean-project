import { useState } from 'react';
import { PricingRecommendation, AdMethod } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { usePricingRecommendations } from '@/hooks/use-pricing-recommendations';

interface PricingRecommendationCardProps {
  recommendation: PricingRecommendation;
  adMethod?: AdMethod;
  businessId: number;
  showFeedbackForm?: boolean;
}

export function PricingRecommendationCard({ 
  recommendation,
  adMethod,
  businessId,
  showFeedbackForm = true
}: PricingRecommendationCardProps) {
  const [feedback, setFeedback] = useState('');
  const [isImplementationDialogOpen, setIsImplementationDialogOpen] = useState(false);
  const { updateRecommendation, isUpdatingRecommendation } = usePricingRecommendations(businessId);
  
  const handleImplement = async () => {
    try {
      await updateRecommendation({
        id: recommendation.id,
        implementedAt: new Date(),
      });
      
      toast({
        title: "Recommendation implemented",
        description: "The pricing recommendation has been marked as implemented.",
      });
      
      setIsImplementationDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error updating recommendation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleDismiss = async () => {
    try {
      await updateRecommendation({
        id: recommendation.id,
        dismissedAt: new Date(),
      });
      
      toast({
        title: "Recommendation dismissed",
        description: "The pricing recommendation has been dismissed.",
      });
    } catch (error) {
      toast({
        title: "Error dismissing recommendation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Please enter feedback",
        description: "Feedback cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateRecommendation({
        id: recommendation.id,
        userFeedback: feedback,
      });
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      setFeedback('');
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const getStatusBadge = () => {
    if (recommendation.implementedAt) {
      return <Badge className="bg-green-500">Implemented</Badge>;
    } else if (recommendation.dismissedAt) {
      return <Badge className="bg-red-500">Dismissed</Badge>;
    } else {
      return <Badge>Active</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{adMethod?.name || `Ad Method #${recommendation.adMethodId}`}</CardTitle>
            <CardDescription className="mt-1">
              Created {formatDistanceToNow(new Date(recommendation.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Recommended Budget</p>
              <p className="text-lg font-bold">${recommendation.recommendedBudget}</p>
            </div>
          </div>
          
          {recommendation.recommendedBidAmount && (
            <div className="flex items-center space-x-2">
              <DollarSign className="text-primary" size={20} />
              <div>
                <p className="text-sm font-medium">Recommended Bid</p>
                <p className="text-lg font-bold">${recommendation.recommendedBidAmount}</p>
              </div>
            </div>
          )}
          
          {recommendation.expectedRoi && (
            <div className="flex items-center space-x-2">
              <DollarSign className="text-primary" size={20} />
              <div>
                <p className="text-sm font-medium">Expected ROI</p>
                <p className="text-lg font-bold">{recommendation.expectedRoi}%</p>
              </div>
            </div>
          )}
          
          {recommendation.confidenceScore && (
            <div className="flex items-center space-x-2">
              <Check className="text-primary" size={20} />
              <div>
                <p className="text-sm font-medium">Confidence Score</p>
                <p className="text-lg font-bold">{recommendation.confidenceScore}%</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Rationale</h3>
          <p className="text-sm text-gray-700">{recommendation.rationale}</p>
        </div>
        
        {/* Competitor insights section removed as it's not in our schema */}
        
        {recommendation.implementationDetails && (() => {
          try {
            const details = JSON.parse(recommendation.implementationDetails.toString());
            return (
              <div className="space-y-2">
                <h3 className="font-medium">Implementation Details</h3>
                <div className="text-sm text-gray-700">
                  {details.steps?.map((step: string, index: number) => (
                    <div key={index} className="mb-1 flex items-start">
                      <div className="mr-2 mt-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-xs">{index + 1}</div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch (e) {
            return (
              <div className="space-y-2">
                <h3 className="font-medium">Implementation Details</h3>
                <p className="text-sm text-gray-700">Implementation steps are available for this recommendation.</p>
              </div>
            );
          }
        })()}
        
        {recommendation.implementedAt && (
          <div className="flex items-center space-x-2">
            <Calendar className="text-green-500" size={16} />
            <span className="text-sm text-gray-600">
              Implemented on {format(new Date(recommendation.implementedAt), 'MMM d, yyyy')}
            </span>
          </div>
        )}
        
        {recommendation.dismissedAt && (
          <div className="flex items-center space-x-2">
            <X className="text-red-500" size={16} />
            <span className="text-sm text-gray-600">
              Dismissed on {format(new Date(recommendation.dismissedAt), 'MMM d, yyyy')}
            </span>
          </div>
        )}
        
        {recommendation.userFeedback && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="text-primary" size={16} />
              <h3 className="font-medium">Your Feedback</h3>
            </div>
            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md">{recommendation.userFeedback}</p>
          </div>
        )}
        
        {showFeedbackForm && !recommendation.dismissedAt && !recommendation.implementedAt && (
          <div className="space-y-3 mt-4">
            <h3 className="font-medium">Provide Feedback</h3>
            <Textarea 
              placeholder="What do you think about this recommendation?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleSubmitFeedback} 
              disabled={isUpdatingRecommendation || !feedback.trim()}
              variant="outline"
              size="sm"
            >
              {isUpdatingRecommendation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Feedback
            </Button>
          </div>
        )}
      </CardContent>
      
      {!recommendation.dismissedAt && !recommendation.implementedAt && (
        <CardFooter className="flex justify-between">
          <Dialog open={isImplementationDialogOpen} onOpenChange={setIsImplementationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Check className="mr-2 h-4 w-4" />
                Implement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Implement this recommendation?</DialogTitle>
                <DialogDescription>
                  You're about to mark this pricing recommendation as implemented. 
                  This will help us track the performance of your campaigns.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImplementationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImplement}
                  disabled={isUpdatingRecommendation}
                >
                  {isUpdatingRecommendation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Implementation"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            disabled={isUpdatingRecommendation}
          >
            {isUpdatingRecommendation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Dismiss
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}