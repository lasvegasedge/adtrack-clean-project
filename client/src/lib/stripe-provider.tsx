import React, { ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Try to use the environment variable, fall back to test key if not available
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51OvvBWNPWDo6eQkI6g3oKaxUbbD04Qgm5ey8mWTkASR9mJH5ChiLpHMwmBEbIUZRgxz7GRWrxMHquxz1O1KjnmOR00RpEXOdwC';

console.log('Using Stripe public key:', STRIPE_PUBLIC_KEY.substring(0, 10) + '...');
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

type StripeProviderProps = {
  children: ReactNode;
};

export function StripeProvider({ children }: StripeProviderProps) {
  // Always proceed with hardcoded test key for demonstration

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0074d9',
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}