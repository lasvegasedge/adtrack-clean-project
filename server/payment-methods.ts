import { Request, Response } from "express";
import { storage } from "./storage";
import { paymentStorage } from "./payment-storage";
import stripe from "./stripe";

/**
 * Add a payment method to a user's account
 * @param req Request with the payment method ID in the body
 * @param res Response
 */
export async function addPaymentMethod(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to add a payment method" });
    }

    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID is required" });
    }

    const user = req.user;

    // If we don't have a Stripe customer ID for this user, create one
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Create a customer in Stripe
      const customer = await stripe.customers.create({
        name: user.username,
        email: user.email || undefined,
        phone: user.phoneNumber || undefined,
      });
      
      stripeCustomerId = customer.id;
      
      // Save the Stripe customer ID to the user
      await storage.updateStripeCustomerId(user.id, customer.id);
    }
    
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
    
    // Set as the default payment method for the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Get payment method details from Stripe
    const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Save the payment method in our database
    await paymentStorage.createPaymentMethod({
      userId: user.id,
      paymentMethodId,
      last4: paymentMethodDetails.card?.last4,
      brand: paymentMethodDetails.card?.brand,
      expiryMonth: paymentMethodDetails.card?.exp_month,
      expiryYear: paymentMethodDetails.card?.exp_year,
      isDefault: true
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error adding payment method:", error);
    
    let errorMessage = "Failed to add payment method";
    
    if (error.type && error.type.startsWith('Stripe')) {
      errorMessage = error.message || errorMessage;
    }
    
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Check if a user has a payment method on file
 * @param req Request
 * @param res Response
 */
export async function checkPaymentMethod(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        hasPaymentMethod: false,
        error: "Not authenticated" 
      });
    }

    const user = req.user;
    
    // First check if the user has a payment method in our database
    const hasPaymentMethod = await paymentStorage.hasPaymentMethod(user.id);
    
    // If we have a record, verify it with Stripe
    if (hasPaymentMethod && user.stripeCustomerId) {
      try {
        // Get payment methods from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'card',
        });
        
        // If we have at least one payment method, return true
        const hasPaymentMethod = paymentMethods.data.length > 0;
        
        // If no payment methods found on Stripe, but we have one in database, we could potentially
        // remove it, but we'll need to implement this functionality later as we need the payment method ID
        
        return res.json({ 
          hasPaymentMethod,
          paymentMethodDetails: hasPaymentMethod ? {
            brand: paymentMethods.data[0].card.brand,
            last4: paymentMethods.data[0].card.last4,
            expMonth: paymentMethods.data[0].card.exp_month,
            expYear: paymentMethods.data[0].card.exp_year,
          } : null
        });
      } catch (err) {
        console.error("Error verifying payment method with Stripe:", err);
        // If we can't verify with Stripe, return based on our database record
        return res.json({ hasPaymentMethod });
      }
    }
    
    // No payment method found
    res.json({ hasPaymentMethod: false });
  } catch (error) {
    console.error("Error checking payment method:", error);
    res.status(500).json({ 
      hasPaymentMethod: false,
      error: "Failed to check payment method status" 
    });
  }
}

/**
 * Remove a payment method from a user's account
 * @param req Request
 * @param res Response
 */
export async function removePaymentMethod(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to remove a payment method" });
    }

    const user = req.user;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID is required" });
    }

    // Detach the payment method from the customer in Stripe
    if (user.stripeCustomerId) {
      await stripe.paymentMethods.detach(paymentMethodId);
    }
    
    // First, find the payment method record in our database by Stripe payment method ID
    const paymentMethods = await paymentStorage.getPaymentMethodsByUserId(user.id);
    const paymentMethod = paymentMethods.find(pm => pm.paymentMethodId === paymentMethodId);
    
    if (paymentMethod) {
      // Remove the payment method from our database using our ID
      await paymentStorage.deletePaymentMethod(paymentMethod.id);
    } else {
      console.warn(`Payment method ${paymentMethodId} not found in database for user ${user.id}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res.status(500).json({ error: "Failed to remove payment method" });
  }
}