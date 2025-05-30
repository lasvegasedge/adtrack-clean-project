import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { CalendarDays, CreditCard, Info, LifeBuoy, RefreshCw, Settings, Trash2, BarChart, BarChart3, Sparkles } from 'lucide-react';

export default function SubscriptionManager() {
  const { subscription, subscriptionType, usageData, isLoading, error } = useSubscription();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load subscription information</h3>
        <p className="text-red-600">Please try refreshing the page, or contact support if the issue persists.</p>
      </div>
    );
  }

  // If user doesn't have a subscription, show upgrade prompt
  if (!subscription) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Subscribe to AdTrack</CardTitle>
          <CardDescription>
            Upgrade your account to access premium features and maximize your marketing ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start">
              <BarChart3 className="h-6 w-6 text-indigo-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium">Advanced ROI Tracking</h4>
                <p className="text-sm text-muted-foreground">Get detailed analytics on all your marketing campaigns</p>
              </div>
            </div>
            <div className="flex items-start">
              <BarChart className="h-6 w-6 text-indigo-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium">Competitor Analysis</h4>
                <p className="text-sm text-muted-foreground">Compare your performance against similar businesses</p>
              </div>
            </div>
            <div className="flex items-start">
              <Sparkles className="h-6 w-6 text-indigo-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium">AI-Powered Recommendations</h4>
                <p className="text-sm text-muted-foreground">Get intelligent suggestions to optimize your campaigns</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => navigate('/pricing')}>
            View Pricing Options
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return 'Not available';
    }
  };

  const getPlanBadge = () => {
    switch (subscriptionType) {
      case 'premium':
        return <Badge className="bg-purple-500">Premium</Badge>;
      case 'professional':
        return <Badge className="bg-blue-500">Professional</Badge>;
      case 'basic':
        return <Badge className="bg-green-500">Basic</Badge>;
      default:
        return <Badge>Free</Badge>;
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      setCancellationDialogOpen(false);
      
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled. You will still have access until the end of your current billing period.',
      });
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </div>
            {getPlanBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Plan</label>
              <div className="font-medium">
                {subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} Plan
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="font-medium">
                {subscription.isTrialPeriod ? (
                  <span className="text-amber-600 font-medium">Trial Period</span>
                ) : subscription.subscriptionStatus === 'active' ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : subscription.subscriptionStatus === 'canceled' ? (
                  <span className="text-red-600 font-medium">Cancelled</span>
                ) : (
                  <span className="text-gray-600 font-medium">
                    {subscription.subscriptionStatus?.charAt(0).toUpperCase() + subscription.subscriptionStatus?.slice(1) || 'Unknown'}
                  </span>
                )}
              </div>
            </div>
            
            {subscription.currentPeriodEnd && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Current Period Ends</label>
                <div className="font-medium flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                  {formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            )}
            
            {subscription.lastPaymentDate && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Last Payment</label>
                <div className="font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                  {formatDate(subscription.lastPaymentDate)}
                </div>
              </div>
            )}
          </div>

          {usageData && (
            <div className="mt-8 space-y-6">
              <h3 className="text-lg font-medium">Feature Usage</h3>
              
              {Object.entries(usageData).map(([featureId, usage]) => {
                // Skip features without limits
                if (!usage.limit) return null;
                
                const usagePercentage = Math.min(100, (usage.used / usage.limit) * 100);
                
                return (
                  <div key={featureId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">
                        {usage.name || featureId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {usage.used} / {usage.limit}
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Manage Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Payment Methods</DialogTitle>
                <DialogDescription>
                  Update your payment information or billing details.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <p className="text-center text-muted-foreground">
                  This feature will be available soon. Please contact customer support for assistance with payment methods.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => window.open('mailto:support@adtrack.online')}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Change Plan
            </Button>
            
            <AlertDialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You're about to cancel your {subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} plan subscription.
                    You'll still have access to all features until the end of your current billing period on {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'your next billing date'}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isCancelling}>Nevermind</AlertDialogCancel>
                  <AlertDialogAction 
                    disabled={isCancelling} 
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    onClick={handleCancelSubscription}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>

      {/* Help card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-blue-500" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you have any questions about your subscription or need help with billing,
            our support team is available to assist you.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => window.open('mailto:support@adtrack.online')}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}