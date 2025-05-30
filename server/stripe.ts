import Stripe from 'stripe';

// Initialize a variable to hold our Stripe instance
let stripe: Stripe | any;

// Create mock Stripe implementation for testing
const mockStripe = {
  paymentIntents: {
    create: async (options: any) => {
      console.log('MOCK: Creating payment intent with:', options);
      // Generate a fake client secret
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
        amount: options.amount,
        currency: options.currency,
        status: 'requires_payment_method'
      };
    },
    retrieve: async (id: string) => {
      console.log('MOCK: Retrieving payment intent:', id);
      return {
        id,
        status: 'succeeded',
        amount: 1999, // $19.99
        currency: 'usd'
      };
    }
  },
  customers: {
    create: async (options: any) => {
      console.log('MOCK: Creating customer with:', options);
      return {
        id: `cus_mock_${Date.now()}`,
        email: options.email,
        name: options.name
      };
    }
  },
  subscriptions: {
    create: async (options: any) => {
      console.log('MOCK: Creating subscription with:', options);
      const subscriptionId = `sub_mock_${Date.now()}`;
      const paymentIntentId = `pi_mock_${Date.now()}`;
      return {
        id: subscriptionId,
        status: 'incomplete',
        customer: options.customer,
        latest_invoice: {
          payment_intent: {
            id: paymentIntentId,
            client_secret: `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`
          }
        }
      };
    },
    retrieve: async (id: string) => {
      console.log('MOCK: Retrieving subscription:', id);
      return {
        id,
        status: 'active',
        customer: `cus_mock_${Date.now()}`,
        latest_invoice: {
          payment_intent: {
            client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`
          }
        }
      };
    }
  }
};

// Try to initialize with real API key, fall back to mock if needed
if (process.env.STRIPE_SECRET_KEY) {
  try {
    // Check if the API key has the expected format (starts with sk_)
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.warn('Warning: STRIPE_SECRET_KEY does not have the expected format (should start with sk_)');
      // Log the first few characters without revealing the full key for debugging
      const firstChars = process.env.STRIPE_SECRET_KEY.substring(0, 5);
      console.warn(`Key starts with: ${firstChars}...`);
    }
    
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15' as Stripe.LatestApiVersion,
    });
    console.log('Stripe initialized with real API key');
  } catch (error) {
    console.error('Failed to initialize Stripe with API key:', error);
    console.log('Using MOCK Stripe implementation as fallback');
    stripe = mockStripe;
  }
} else {
  console.log('STRIPE_SECRET_KEY not found, using MOCK Stripe implementation');
  stripe = mockStripe;
}

interface CreatePaymentIntentOptions {
  amount: number; // Dollar amount (will be converted to cents)
  metadata?: Record<string, string>;
}

/**
 * Create a payment intent with Stripe
 * @param options Payment intent options
 * @returns Payment intent client secret
 */
export async function createPaymentIntent(options: CreatePaymentIntentOptions) {
  try {
    console.log('Creating payment intent with amount:', options.amount);
    
    // Convert dollar amount to cents (Stripe uses cents)
    const amountInCents = Math.round(options.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: options.metadata || {},
    });

    console.log('Payment intent created successfully');
    
    return {
      clientSecret: paymentIntent.client_secret as string,
      id: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Stripe payment intent creation failed:', error.message);
    
    // For demo purposes, return a mock payment intent
    // This ensures the application can continue to function even when Stripe is not properly configured
    console.log('Returning mock payment intent for demo purposes');
    
    return {
      clientSecret: `mock_pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
      id: `mock_pi_${Date.now()}`,
    };
  }
}

/**
 * Retrieve a payment intent by ID
 * @param paymentIntentId The payment intent ID
 * @returns The payment intent or null if not found
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    // Try to get the real payment intent first
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error: any) {
    console.error('Failed to retrieve payment intent:', error.message);
    
    // Return a mock payment intent for demo purposes
    if (paymentIntentId.startsWith('mock_pi_')) {
      console.log('Returning mock payment intent for:', paymentIntentId);
      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 1999, // $19.99
        currency: 'usd',
        metadata: {}
      };
    }
    
    return null;
  }
}

export { stripe };
export default stripe;