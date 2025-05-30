import { Route, Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

/**
 * A route that requires the user to have a payment method on file to access premium features
 */
export function PaymentProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch the user's payment methods
  const { data: paymentMethodStatus, isLoading: isLoadingPaymentMethod } = useQuery({
    queryKey: ["/api/user/payment-method"],
    // Only run this query if the user is authenticated
    enabled: !!user,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/payment-method");
      return res.json();
    }
  });

  // Keep track of redirect attempts to prevent infinite loops
  const [redirectAttempt, setRedirectAttempt] = useState(false);

  // Handle redirect to add payment method
  const handleAddPaymentMethod = () => {
    setLocation("/add-payment-method");
  };

  // Check if user has payment method on file or is a demo account
  // The demo account (demo@adtrack.online) has special access to all premium features
  // without requiring payment method for demonstration purposes
  const isDemoAccount = user?.username === "demo@adtrack.online";
  const hasPaymentMethod = paymentMethodStatus?.hasPaymentMethod || isDemoAccount || false;

  useEffect(() => {
    // Reset redirect attempt when the user or payment method status changes
    if (user && paymentMethodStatus) {
      setRedirectAttempt(false);
    }
  }, [user, paymentMethodStatus]);

  return (
    <Route path={path}>
      {isLoading || isLoadingPaymentMethod ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : !hasPaymentMethod && !redirectAttempt ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Payment Method Required</h1>
            <p className="text-gray-600 text-center mb-6">
              This feature requires a payment method on file. Please add a payment method to continue.
            </p>
            <p className="text-sm text-blue-600 text-center mb-6">
              Premium features help you maximize ROI, analyze competitors, and get AI-powered recommendations.
            </p>
            <div className="space-y-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleAddPaymentMethod}
              >
                Add Payment Method
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setRedirectAttempt(true);
                  setLocation("/");
                }}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}