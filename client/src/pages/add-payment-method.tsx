import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, LockIcon } from "lucide-react";

// Load Stripe outside of component render to avoid recreating the instance on each render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key, using mock implementation');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const PaymentMethodForm = ({ returnUrl = "/" }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("POST", "/api/user/payment-method", { paymentMethodId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/payment-method"] });
      toast({
        title: "Payment method added",
        description: "Your payment method has been added successfully",
      });
      // Redirect to return URL after successful payment method addition
      setLocation(returnUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add payment method",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method 
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Failed to create payment method");
      }

      // Save payment method to user
      addPaymentMethodMutation.mutate(paymentMethod.id);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Payment Failed",
        description: err.message || "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="p-4 border rounded-md bg-blue-50 border-blue-100">
          <div className="mb-4">
            <label htmlFor="card-element" className="text-sm font-medium text-gray-700 block mb-1">
              Card Information
            </label>
            <div className="p-4 bg-white border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center mb-4">
            <LockIcon className="h-3 w-3 mr-1" /> Your payment information is encrypted and secure
          </div>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-100 rounded">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mt-6">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Save Payment Method
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation(returnUrl)}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default function AddPaymentMethodPage() {
  const [searchParams] = useLocation();
  const params = new URLSearchParams(searchParams);
  const returnUrl = params.get('returnUrl') || "/";
  
  // Mock implementation if Stripe is not available
  const [useMockStripe, setUseMockStripe] = useState(false);
  
  useEffect(() => {
    // If Stripe is not available after 2 seconds, use mock implementation
    if (!stripePromise) {
      const timer = setTimeout(() => {
        setUseMockStripe(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center mb-2">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              <CardTitle>Add Payment Method</CardTitle>
            </div>
            <CardDescription>
              Your payment details will be securely stored for future transactions. You won't be charged now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!stripePromise && !useMockStripe ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading payment system...</p>
              </div>
            ) : stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentMethodForm returnUrl={returnUrl} />
              </Elements>
            ) : (
              // Mock implementation for when Stripe is not available
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded text-amber-800 text-sm">
                  <p className="font-medium">Demo Mode</p>
                  <p className="mt-1">Stripe integration is not fully configured. This is a demonstration of the payment form.</p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Card Number
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded" 
                      placeholder="4242 4242 4242 4242" 
                      disabled={useMockStripe}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Expiration
                      </label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded" 
                        placeholder="MM/YY" 
                        disabled={useMockStripe}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        CVC
                      </label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded" 
                        placeholder="123" 
                        disabled={useMockStripe}
                      />
                    </div>
                  </div>
                </div>
                
                <CardFooter className="flex justify-end space-x-2 px-0">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = returnUrl;
                    }}
                  >
                    Add Payment Method (Demo)
                  </Button>
                </CardFooter>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}