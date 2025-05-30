import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DiscountCode } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface DiscountInfo {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

interface SubscriptionFormProps {
  planDetails: any;
  onDiscountApplied: (discountCode: DiscountCode, discountInfo: DiscountInfo) => void;
}

const SubscriptionForm = ({ planDetails, onDiscountApplied }: SubscriptionFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [validDiscount, setValidDiscount] = useState<DiscountCode | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }
    
    setIsValidatingCode(true);
    setDiscountError(null);
    
    try {
      // Get the plan type from the plan details if available
      const planType = planDetails?.name?.toLowerCase().includes('basic') 
        ? 'basic' 
        : planDetails?.name?.toLowerCase().includes('professional') 
          ? 'professional' 
          : planDetails?.name?.toLowerCase().includes('premium') 
            ? 'premium' 
            : 'all';
      
      // Get the price from plan details if available
      const originalPrice = planDetails?.price ? Number(planDetails.price) : null;
      
      const response = await apiRequest('POST', '/api/discount-codes/validate', {
        code: discountCode,
        planType,
        price: originalPrice
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid discount code');
      }
      
      const data = await response.json();
      
      if (data.valid && data.discountCode) {
        setValidDiscount(data.discountCode);
        if (data.discountInfo) {
          setDiscountInfo(data.discountInfo);
          
          // Notify parent component about the applied discount
          onDiscountApplied(data.discountCode, data.discountInfo);
        }
        
        toast({
          title: "Discount Applied",
          description: `Your discount code "${discountCode}" has been applied successfully.`,
          variant: "default",
        });
      } else {
        throw new Error('Unknown error validating discount code');
      }
    } catch (error: any) {
      setDiscountError(error.message || 'Failed to validate discount code');
      setValidDiscount(null);
      setDiscountInfo(null);
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe has not been properly initialized",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // If discount code is valid, apply it by recording usage when confirming payment
      let returnUrl = `${window.location.origin}/subscription-success`;
      
      if (validDiscount) {
        returnUrl += `?discountCode=${encodeURIComponent(discountCode)}`;
        
        // Record discount code usage in our system
        try {
          const planId = planDetails?.id;
          const planName = planDetails?.name || 'Subscription Plan';
          const originalAmount = planDetails?.price || 0;
          
          await apiRequest('POST', '/api/discount-codes/apply', {
            code: discountCode,
            planId,
            planName,
            originalAmount
          });
          
          // We don't need to handle the response here as this is just recording the usage
        } catch (discountErr: any) {
          console.error('Error applying discount code:', discountErr);
          // Continue with payment even if recording discount fails
        }
      }
      
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDiscountCode = () => {
    setDiscountCode('');
    setValidDiscount(null);
    setDiscountInfo(null);
    setDiscountError(null);
    // Notify the parent component that discount was removed
    if (planDetails?.price) {
      const originalPrice = Number(planDetails.price);
      onDiscountApplied(null as any, {
        originalPrice,
        discountedPrice: originalPrice,
        discountAmount: 0,
        discountPercentage: 0
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="discount-code">Discount Code</Label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Input
                id="discount-code"
                placeholder="Enter your code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className={validDiscount ? "pr-10 border-green-500" : ""}
                disabled={!!validDiscount || isValidatingCode}
              />
              {validDiscount && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
            {validDiscount ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearDiscountCode}
                disabled={isLoading || isValidatingCode}
              >
                Clear
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={validateDiscountCode}
                disabled={!discountCode || isLoading || isValidatingCode}
              >
                {isValidatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            )}
          </div>
          
          {discountError && (
            <p className="text-sm text-destructive mt-1">{discountError}</p>
          )}
          
          {validDiscount && discountInfo && (
            <Alert className="mt-2 bg-muted/50">
              <Tag className="h-4 w-4" />
              <AlertTitle>Discount Applied</AlertTitle>
              <AlertDescription className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Code: <strong>{validDiscount.code}</strong></span>
                  <span>Original price: <strong>${discountInfo.originalPrice.toFixed(2)}</strong></span>
                  <span>Discount amount: <strong>${discountInfo.discountAmount.toFixed(2)} ({Math.round(discountInfo.discountPercentage)}%)</strong></span>
                  <span>New price: <strong>${discountInfo.discountedPrice.toFixed(2)}</strong></span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      <div className="pt-4">
        <PaymentElement />
      </div>
      
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [discountedPlanDetails, setDiscountedPlanDetails] = useState<any>(null);
  const { toast } = useToast();

  // Extract plan ID and discount code from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get('planId');
  const discountCodeParam = searchParams.get('code');

  // First useEffect to fetch plan details if planId is provided
  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (planId) {
        try {
          const response = await apiRequest("GET", `/api/pricing-config/${planId}`);
          if (response.ok) {
            const data = await response.json();
            setPlanDetails(data);
          } else {
            console.error("Failed to fetch plan details");
          }
        } catch (err) {
          console.error("Error fetching plan details:", err);
        }
      }
    };
    
    fetchPlanDetails();
  }, [planId]);

  // Handle discount application to the plan
  const handleDiscountApplied = (discountCode: DiscountCode | null, discountInfo: any) => {
    if (planDetails && discountInfo) {
      // Create a copy of the plan details with the discounted price
      const discounted = {
        ...planDetails,
        originalPrice: planDetails.price,
        discountedPrice: discountInfo.discountedPrice.toFixed(2),
        discountPercentage: Math.round(discountInfo.discountPercentage),
        discountAmount: discountInfo.discountAmount.toFixed(2),
        appliedDiscountCode: discountCode
      };
      setDiscountedPlanDetails(discounted);
    } else {
      // Reset to original plan details if discount is removed
      setDiscountedPlanDetails(null);
    }
  };
  
  // Apply discount code from URL (if any) after plan details are loaded
  useEffect(() => {
    if (planDetails && discountCodeParam && !discountedPlanDetails) {
      // Auto-validate the discount code from URL parameter after component loads
      const validateUrlDiscountCode = async () => {
        try {
          const planType = planDetails?.name?.toLowerCase().includes('basic') 
            ? 'basic' 
            : planDetails?.name?.toLowerCase().includes('professional') 
              ? 'professional' 
              : planDetails?.name?.toLowerCase().includes('premium') 
                ? 'premium' 
                : 'all';
          
          const originalPrice = planDetails?.price ? Number(planDetails.price) : null;
          
          const response = await apiRequest('POST', '/api/discount-codes/validate', {
            code: discountCodeParam,
            planType,
            price: originalPrice
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.valid && data.discountCode && data.discountInfo) {
              handleDiscountApplied(data.discountCode, data.discountInfo);
              
              toast({
                title: "Discount Applied",
                description: `Discount code "${discountCodeParam}" has been automatically applied.`,
                variant: "default",
              });
            }
          }
        } catch (error) {
          console.error("Failed to validate discount code from URL:", error);
        }
      };
      
      validateUrlDiscountCode();
    }
  }, [planDetails, discountCodeParam, discountedPlanDetails, toast]);

  // Second useEffect to create the subscription
  useEffect(() => {
    // Create subscription as soon as the page loads
    const getOrCreateSubscription = async () => {
      try {
        setIsLoading(true);
        
        // Pass the plan ID if it's available
        const endpoint = "/api/get-or-create-subscription";
        const options: any = planId ? { planId: parseInt(planId, 10) } : {};
        
        // If we have a validated discount code, add it to the options
        if (discountedPlanDetails?.appliedDiscountCode) {
          options.discountCode = discountedPlanDetails.appliedDiscountCode.code;
        } else if (discountCodeParam) {
          // If we have a discount code from URL but it wasn't validated yet
          options.discountCode = discountCodeParam;
        }
        
        console.log("Requesting subscription with options:", options);
        const response = await apiRequest("POST", endpoint, options);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to initialize subscription");
        }
        
        const data = await response.json();
        
        if (!data.clientSecret) {
          if (data.status === "active") {
            setError("You already have an active subscription.");
          } else {
            throw new Error("No client secret returned from the server");
          }
        }
        
        // Check if this is a mock subscription
        if (data.isMockSubscription) {
          console.log("Using mock subscription data for testing");
          // In a mock scenario, we'll redirect directly to success page since we 
          // can't use Stripe Elements with mock data
          window.location.href = '/subscription-success?mock=true';
          return;
        }
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Subscription setup error:", err);
        setError(err.message || "An error occurred while setting up your subscription");
        toast({
          title: "Subscription Setup Failed",
          description: err.message || "Could not initialize subscription. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    getOrCreateSubscription();
  }, [toast, planId, discountedPlanDetails, discountCodeParam]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription Error</CardTitle>
            <CardDescription>We encountered a problem setting up your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            {error.includes("API Key") && (
              <p className="mt-4 text-sm text-muted-foreground">
                There appears to be an issue with our payment processor configuration. 
                Please contact support and we'll get this resolved for you.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You already have an active subscription.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>
            {planDetails ? `Subscribe to ${planDetails.name}` : 'Subscribe to AdTrack Premium'}
          </CardTitle>
          <CardDescription>
            {planDetails ? (
              <div className="space-y-2">
                {discountedPlanDetails ? (
                  <div className="text-xl font-bold">
                    <span className="text-primary">${discountedPlanDetails.discountedPrice}/month</span>
                    {' '}
                    <span className="text-muted-foreground line-through text-sm">
                      ${Number(planDetails.price).toFixed(2)}
                    </span>
                    {' '}
                    <span className="text-sm text-green-600">
                      Save {discountedPlanDetails.discountPercentage}%
                    </span>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-primary">
                    ${Number(planDetails.price).toFixed(2)}/month
                  </div>
                )}
                <p>{planDetails.description}</p>
              </div>
            ) : (
              <p>Get access to all premium features including competitor analytics, advanced ROI tracking,
              and AI-powered marketing recommendations</p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planDetails && (
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-sm font-medium mb-2">Plan Features:</h3>
              <ul className="space-y-2">
                {planDetails.features.split('\n').map((feature: string, index: number) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg 
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" 
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscriptionForm 
              planDetails={discountedPlanDetails || planDetails} 
              onDiscountApplied={handleDiscountApplied} 
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}