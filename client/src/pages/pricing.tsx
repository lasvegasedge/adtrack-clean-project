import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Zap, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { PricingConfig } from '@shared/schema';

const FEATURE_LIST = [
  {
    id: 'roi_tracking',
    name: 'ROI Tracking',
    description: 'Track and analyze ROI for marketing campaigns',
    basic: 'limited',
    professional: 'full',
    premium: 'full'
  },
  {
    id: 'competitor_analysis',
    name: 'Competitor Analysis',
    description: 'Compare performance against similar businesses',
    basic: 'limited',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'Get intelligent suggestions for campaigns',
    basic: 'none',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'marketing_insights',
    name: 'Marketing Insights',
    description: 'Detailed analysis of marketing performance',
    basic: 'none',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'ad_upload',
    name: 'Ad Upload',
    description: 'Upload and manage advertisement files',
    basic: 'limited',
    professional: 'full',
    premium: 'full'
  },
  {
    id: 'location_management',
    name: 'Location Management',
    description: 'Manage business locations and campaigns',
    basic: 'limited',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'benchmark_tooltips',
    name: 'AI Benchmark Tooltips',
    description: 'Contextual insights when viewing performance',
    basic: 'none',
    professional: 'none',
    premium: 'full'
  },
  {
    id: 'comparison_radius_control',
    name: 'Comparison Radius Control',
    description: 'Adjust radius for competitor comparisons',
    basic: 'none', 
    professional: 'none',
    premium: 'full'
  }
];

export default function PricingPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { subscription, subscriptionType } = useSubscription();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch pricing data from admin configuration
  const { data: pricingConfigs, isLoading: isPricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-public"],
    queryFn: async () => {
      const response = await fetch("/api/pricing-public");
      if (!response.ok) {
        throw new Error("Failed to fetch pricing data");
      }
      return response.json();
    }
  });

  // Convert admin pricing configs to plan details format
  const getPlanDetails = () => {
    if (!pricingConfigs || pricingConfigs.length === 0) {
      // Fallback to default plans if no admin config is available
      return [
        {
          id: 'basic',
          name: 'Basic',
          monthlyPrice: 378.95,
          yearlyPrice: 4070.67,
          description: 'Essential features for small businesses',
          buttonText: 'Start with Basic',
          highlightFeatures: ['ROI tracking (limited)', 'Competitor analysis (limited)', 'Up to 3 business locations']
        },
        {
          id: 'professional',
          name: 'Professional',
          monthlyPrice: 678.95,
          yearlyPrice: 7295.56,
          description: 'Advanced features for growing businesses',
          buttonText: 'Choose Professional',
          highlightFeatures: ['Full ROI tracking', 'Up to 10 business locations', 'AI recommendations (limited)']
        },
        {
          id: 'premium',
          name: 'Premium',
          monthlyPrice: 978.95,
          yearlyPrice: 10518.16,
          description: 'Complete solution for maximum business impact',
          buttonText: 'Get Premium',
          highlightFeatures: ['Unlimited business locations', 'Full AI capabilities', 'Benchmark tooltips']
        }
      ];
    }

    return pricingConfigs
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((config) => {
        const monthlyPrice = parseFloat(config.price);
        const yearlyPrice = monthlyPrice * 12 * 0.9; // 10% discount for yearly
        const features = config.features.split('\n').filter(f => f.trim() !== '');
        
        // Map config names to plan IDs
        let planId = 'basic';
        if (config.name.toLowerCase().includes('professional') || config.name.toLowerCase().includes('pro')) {
          planId = 'professional';
        } else if (config.name.toLowerCase().includes('premium') || config.name.toLowerCase().includes('enterprise')) {
          planId = 'premium';
        }

        return {
          id: planId,
          name: config.name,
          monthlyPrice,
          yearlyPrice,
          description: config.description,
          buttonText: `Choose ${config.name}`,
          highlightFeatures: features
        };
      });
  };
  
  // Check if a specific feature was highlighted in the URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const highlightedFeature = urlParams.get('feature');

  // Fix scroll issue - ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // If user already has this plan, don't do anything
    if (subscription && subscriptionType === planId) {
      toast({
        title: 'Already subscribed',
        description: `You are already subscribed to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/subscription/create', {
        planId,
        billingCycle
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      
      // If Stripe checkout URL is provided, redirect to it
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Otherwise, refresh subscription data and show success message
        queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
        toast({
          title: 'Subscription updated',
          description: `You have successfully subscribed to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Subscription failed',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Helper function to render feature availability
  const renderFeatureAvailability = (availability: string) => {
    switch (availability) {
      case 'full':
        return (
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-1.5" />
            <span className="text-sm">Full</span>
          </div>
        );
      case 'limited':
        return (
          <div className="flex items-center">
            <Check className="h-5 w-5 text-amber-500 mr-1.5" />
            <span className="text-sm">Limited</span>
          </div>
        );
      case 'none':
      default:
        return (
          <div className="flex items-center">
            <X className="h-5 w-5 text-gray-300 mr-1.5" />
            <span className="text-sm text-gray-400">No</span>
          </div>
        );
    }
  };

  return (
    <AppLayout title="Subscription Plans">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the plan that best fits your business needs and scale as you grow
          </p>
          
          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-primary' : 'text-gray-500'}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-primary' : 'text-gray-500'}`}>
              Yearly <span className="text-green-500 font-semibold">(Save 10%)</span>
            </Label>
          </div>
        </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {isPricingLoading ? (
          <div className="col-span-3 flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading pricing plans...</span>
          </div>
        ) : (
          getPlanDetails().map((plan) => {
            const isCurrentPlan = subscriptionType === plan.id;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          
            return (
            <Card 
              key={plan.id} 
              className={`flex flex-col h-full ${plan.id === 'professional' ? 'border-blue-400 shadow-lg' : ''} ${isCurrentPlan ? 'bg-blue-50/30' : ''}`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">
                  {plan.name}
                  {plan.id === 'professional' && (
                    <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${price.toFixed(2)}</span>
                  <span className="text-gray-500 ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.highlightFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.id === 'professional' ? 'bg-blue-600 hover:bg-blue-700' : ''} ${isCurrentPlan ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={isCurrentPlan}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
            );
          })
        )}
      </div>

      {/* Features comparison table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Compare Features</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-gray-700 font-medium">Feature</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">Basic</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">Professional</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {FEATURE_LIST.map((feature) => (
                <tr 
                  key={feature.id}
                  className={highlightedFeature === feature.id ? 'bg-blue-50' : ''}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-gray-500">{feature.description}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderFeatureAvailability(feature.basic)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderFeatureAvailability(feature.professional)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderFeatureAvailability(feature.premium)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          <TabsContent value="pricing" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>What's included in each plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Each plan offers a different level of access to AdTrack's features. The Basic plan includes essential ROI tracking and competitor analysis with limitations. The Professional plan adds more advanced features with higher usage limits. The Premium plan provides unlimited access to all features.</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Can I upgrade or downgrade my plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Yes, you can upgrade or downgrade your subscription at any time. When upgrading, we'll prorate the remaining days in your billing cycle. When downgrading, the new plan will take effect at the start of your next billing cycle.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="billing" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>How does the 7-day free trial work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>All new accounts start with a 7-day free trial of the Professional plan. During this period, you can explore AdTrack's features without being charged. After the trial period, you'll be automatically switched to the plan you selected during signup.</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Privacy-Focused Benchmarking</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Competitor data is anonymized to preserve privacy while still providing valuable insights.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="features" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>What does "limited" access mean?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Limited access means you can use the feature but with certain restrictions. These may include usage limits, sample data only, watermarked exports, or lower resolution visualizations. The exact limitations vary by feature and plan.</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Can I add more users to my account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Yes, all plans support multiple users. The Basic plan includes 2 users, Professional includes 5 users, and Premium includes unlimited users. Additional users can be added to any plan for an extra monthly fee.</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Geographic Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p>See how you compare to similar businesses within an adjustable radius (default 3 miles).</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Call to action removed for authenticated users */}
      </div>
    </AppLayout>
  );
}