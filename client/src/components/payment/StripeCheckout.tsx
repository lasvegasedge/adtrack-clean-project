import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Load Stripe outside of component render to avoid recreating the instance on each render
// Use environment variable for Stripe public key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeCheckoutProps {
  amount: number;
  itemIds: number[];
  title: string;
  description?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StripeCheckout({
  amount,
  itemIds,
  title,
  description,
  onSuccess,
  onCancel
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create a payment intent as soon as the component loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        
        // Create a real payment intent with the server
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: amount * 100, // Convert to cents for Stripe
            selectedItemIds: itemIds 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from the server');
        }
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Payment intent creation error:', err);
        setError(err.message || 'An unexpected error occurred');
        toast({
          title: 'Payment setup failed',
          description: err.message || 'Could not initialize payment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, itemIds, toast]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            <p>{error}</p>
            <button 
              className="mt-4 text-primary underline" 
              onClick={onCancel}
            >
              Go back
            </button>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0074d9',
                },
              },
            }}
          >
            <StripePaymentForm 
              amount={amount} 
              onSuccess={onSuccess} 
              onCancel={onCancel} 
            />
          </Elements>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}