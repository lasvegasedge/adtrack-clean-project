import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SubscriptionSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    const paymentStatus = params.get('redirect_status');
    const isMockSession = params.get('mock') === 'true';

    const verifySubscription = async () => {
      try {
        setIsVerifying(true);

        // Handle mock subscription scenario (direct redirect from subscription page)
        if (isMockSession || !params.toString()) {
          console.log('Processing mock subscription success');
          setIsSuccess(true);
          toast({
            title: "Subscription Successful (Demo)",
            description: "This is a demonstration of a successful subscription flow",
          });
          return;
        }

        // Handle real Stripe redirect with payment info
        if (!paymentIntentId || paymentStatus !== 'succeeded') {
          setIsSuccess(false);
          setErrorMessage('Payment was not completed successfully.');
          return;
        }

        // For real subscriptions, we trust the redirect status from Stripe
        // You can add server-side verification here if needed
        // const response = await apiRequest("POST", "/api/verify-subscription", { paymentIntentId });
        // const data = await response.json();
        // if (!response.ok) throw new Error(data.message || 'Verification failed');

        setIsSuccess(true);
        toast({
          title: "Subscription Successful",
          description: "Thank you for subscribing to AdTrack Premium!",
        });
      } catch (err: any) {
        console.error('Subscription verification error:', err);
        setIsSuccess(false);
        setErrorMessage(err.message || 'An error occurred while verifying your subscription');
        toast({
          title: "Verification Failed",
          description: err.message || 'Could not verify your subscription status',
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [toast]);

  const handleGoToApp = () => {
    setLocation('/');
  };

  if (isVerifying) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Your Subscription</CardTitle>
            <CardDescription>Please wait while we verify your payment</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isSuccess ? 'Subscription Successful' : 'Subscription Error'}
          </CardTitle>
          <CardDescription>
            {isSuccess ? 'Your subscription has been processed successfully' : 'There was a problem with your subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 space-y-4">
          {isSuccess ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Thank you for subscribing to AdTrack Premium! You now have access to all premium features.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-destructive">
                {errorMessage || 'An unknown error occurred with your subscription.'}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Please try again or contact support if the issue persists.
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleGoToApp}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}