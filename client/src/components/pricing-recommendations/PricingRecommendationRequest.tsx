import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AdMethod } from '@shared/schema';
import { usePricingRecommendations } from '@/hooks/use-pricing-recommendations';
import { toast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Sparkles } from 'lucide-react';

// Create the schema for form validation
const requestFormSchema = z.object({
  adMethodId: z.string().min(1, { message: 'Please select an advertising method' }),
  includeCompetitorData: z.boolean().default(true),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface PricingRecommendationRequestProps {
  businessId: number;
  adMethods: AdMethod[];
  onRequestComplete: () => void;
}

export function PricingRecommendationRequest({
  businessId,
  adMethods,
  onRequestComplete,
}: PricingRecommendationRequestProps) {
  console.log('PricingRecommendationRequest rendered with businessId:', businessId);
  console.log('Available ad methods:', adMethods);
  
  const { requestRecommendation, isRequestingRecommendation } = usePricingRecommendations(businessId);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Initialize the form with react-hook-form
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      adMethodId: '',
      includeCompetitorData: true,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: RequestFormValues) => {
    try {
      console.log('Submitting form with values:', values);
      
      // Ensure we have a valid adMethodId as a number
      const adMethodId = parseInt(values.adMethodId, 10);
      if (isNaN(adMethodId)) {
        throw new Error('Invalid advertising method selected');
      }
      
      // Call the API to request a recommendation
      await requestRecommendation({
        adMethodId: adMethodId,
        includeCompetitorData: values.includeCompetitorData,
      });
      
      setIsSubmitted(true);
      toast({
        title: 'Recommendation requested',
        description: 'Your pricing recommendation is being generated.',
      });
      
      // After a successful request, notify the parent component
      setTimeout(() => {
        onRequestComplete();
      }, 2000);
    } catch (error) {
      console.error('Recommendation request failed:', error);
      toast({
        title: 'Request failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Render different content based on the submission state
  if (isSubmitted) {
    return (
      <Card className="flex flex-col items-center justify-center p-10 text-center">
        <Sparkles className="h-16 w-16 text-primary mb-6" />
        <CardTitle className="text-2xl mb-2">Generating Your Recommendation</CardTitle>
        <CardDescription className="text-lg mb-6">
          Our AI is analyzing your data and market conditions to create a personalized pricing recommendation.
        </CardDescription>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          You'll be redirected to your recommendations shortly...
        </p>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Request Pricing Recommendation</CardTitle>
        <CardDescription>
          Get AI-powered pricing suggestions for your advertising campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="adMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertising Method</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isRequestingRecommendation}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an advertising method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the advertising method you want a pricing recommendation for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeCompetitorData"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Include Competitor Data</FormLabel>
                    <FormDescription>
                      Enhance your recommendation with anonymized data from similar businesses
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isRequestingRecommendation}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">What you'll get:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Optimal budget recommendation based on your business goals</li>
                    <li>Bid amount suggestions to maximize ROI</li>
                    <li>Expected return on investment predictions</li>
                    <li>Implementation strategy details</li>
                    {form.watch('includeCompetitorData') && (
                      <li>Competitor pricing insights within your market</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRequestingRecommendation || !form.formState.isValid}
            >
              {isRequestingRecommendation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Recommendation...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Pricing Recommendation
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
        <p>Recommendations are powered by AdTrack's AI using historical data and market trends.</p>
      </CardFooter>
    </Card>
  );
}