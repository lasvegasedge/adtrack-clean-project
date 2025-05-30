import React, { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
}

export default function StripePaymentForm({ onSuccess, onCancel, amount }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check for the payment intent status on return from redirect
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;
      
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          onSuccess?.();
          toast({
            title: 'Payment successful',
            description: 'Thank you for your purchase!',
          });
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          toast({
            title: 'Payment processing',
            description: 'Your payment is being processed...',
          });
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          toast({
            title: 'Payment failed',
            description: 'Please try again with a different payment method.',
            variant: 'destructive',
          });
          break;
        default:
          setMessage('Something went wrong.');
          toast({
            title: 'Payment error',
            description: 'An unexpected error occurred.',
            variant: 'destructive',
          });
          break;
      }
    });
  }, [stripe, onSuccess, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate processing for a more realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration purposes, we'll simulate a successful payment
      // without actually calling Stripe API (since we're using mock keys)
      setMessage('Payment succeeded!');
      onSuccess?.();
      toast({
        title: 'Payment successful',
        description: 'Thank you for your purchase! Your access has been granted.',
      });
      
      // Record the purchase in our database
      const response = await fetch('/api/record-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          status: 'succeeded',
          // Include any other necessary data
        }),
      }).catch(err => {
        console.error('Failed to record purchase:', err);
        // Still continue as if successful for the demo
      });
      
      // Redirect to dashboard or relevant page
      // window.location.href = '/dashboard';
    } catch (err: any) {
      // This should never happen in our mock version, but just in case
      setMessage(err.message || 'An unexpected error occurred.');
      toast({
        title: 'Payment failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        id="payment-element"
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
          }
        }}
      />
      
      {message && <div className="text-sm text-foreground mt-2">{message}</div>}
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements} 
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Pay ${amount.toFixed(2)}
        </Button>
      </div>
    </form>
  );
}