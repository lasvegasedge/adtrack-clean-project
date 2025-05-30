import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, hasBillingAccess, hasAdminRights } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, BarChart, Bookmark, Shield } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check user has access to this page
  // Platform Admins should be redirected to the admin page
  useEffect(() => {
    if (!user) return;
    
    // Redirect Platform Admins to the business accounts section in admin
    if (hasAdminRights(user)) {
      setLocation("/admin?tab=businesses");
      return;
    }
    
    // Regular users without billing access are sent to dashboard
    if (!hasBillingAccess(user)) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Show access restricted for admins too
  if (!user || hasAdminRights(user) || !hasBillingAccess(user)) {
    return (
      <AppLayout title="Billing">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Access Restricted</p>
            <p className="text-muted-foreground">
              {hasAdminRights(user) 
                ? "Platform Admins should use the Business Accounts section to monitor business subscriptions."
                : "You don't have permission to view this page."
              }
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Billing Management">
      <div className="space-y-6">
        <div className="flex items-center">
          <CreditCard className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-2xl font-bold">Billing Dashboard</h2>
        </div>
        
        <p className="text-muted-foreground">
          Manage your AdTrack payment methods, subscription plans, and access premium features and competitor insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-medium text-lg">Standard Plan</div>
              <div className="text-muted-foreground">$49.99/month</div>
              <div className="text-sm mt-2">
                Next billing date: May 23, 2025
              </div>
              <div className="mt-4">
                <button 
                  className="text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                  onClick={() => setLocation('/pricing')}
                >
                  View Plans
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Payment Method
              </CardTitle>
              <CardDescription>Manage your payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-medium">Visa ending in 4242</div>
              <div className="text-muted-foreground">Expires 12/2028</div>
              <div className="mt-3">
                <button className="text-sm text-primary hover:underline">
                  Update payment method
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Premium Features
              </CardTitle>
              <CardDescription>Your unlocked premium features</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Competitor Insights
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> AI Marketing Advisor
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Advanced Reports
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="mt-6">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bookmark className="h-5 w-5 mr-2 text-primary" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md divide-y">
                  {/* Current invoice - unpaid */}
                  <div className="p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors">
                    <div>
                      <div className="font-medium">Invoice #6924</div>
                      <div className="text-sm text-muted-foreground">May 23, 2025 (Current)</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">$49.99</div>
                        <div className="text-sm text-amber-600">Due</div>
                      </div>
                      <button className="bg-primary text-white px-3 py-1 rounded text-sm font-medium hover:bg-primary/90">
                        Pay Now
                      </button>
                    </div>
                  </div>

                  {/* Past invoices - paid */}
                  <div className="p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors" 
                       onClick={() => window.open('/invoice/6823', '_blank')}>
                    <div>
                      <div className="font-medium">Invoice #6823</div>
                      <div className="text-sm text-muted-foreground">April 23, 2025</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">$49.99</div>
                        <div className="text-sm text-green-600">Paid</div>
                      </div>
                      <button className="border border-primary text-primary px-3 py-1 rounded text-sm font-medium hover:bg-primary/10">
                        View
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors"
                       onClick={() => window.open('/invoice/6722', '_blank')}>
                    <div>
                      <div className="font-medium">Invoice #6722</div>
                      <div className="text-sm text-muted-foreground">March 23, 2025</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">$49.99</div>
                        <div className="text-sm text-green-600">Paid</div>
                      </div>
                      <button className="border border-primary text-primary px-3 py-1 rounded text-sm font-medium hover:bg-primary/10">
                        View
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors"
                       onClick={() => window.open('/invoice/6621', '_blank')}>
                    <div>
                      <div className="font-medium">Invoice #6621</div>
                      <div className="text-sm text-muted-foreground">February 23, 2025</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">$49.99</div>
                        <div className="text-sm text-green-600">Paid</div>
                      </div>
                      <button className="border border-primary text-primary px-3 py-1 rounded text-sm font-medium hover:bg-primary/10">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="usage" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-primary" />
                  Feature Usage
                </CardTitle>
                <CardDescription>Track your feature consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">Competitor Insights</div>
                      <div className="text-sm text-muted-foreground">18/30 used</div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[60%]"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">AI Marketing Reports</div>
                      <div className="text-sm text-muted-foreground">7/10 used</div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[70%]"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">Performance Exports</div>
                      <div className="text-sm text-muted-foreground">3/25 used</div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[12%]"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscriptions" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  Available Plans
                </CardTitle>
                <CardDescription>Compare plans and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-base">Standard Plan</h3>
                        <p className="text-sm text-muted-foreground">Best for small businesses</p>
                      </div>
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">Current</div>
                    </div>
                    <div className="text-2xl font-bold mb-2">$49.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> 30 competitor insights per month
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> AI marketing advisor access
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> 10 AI marketing reports
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="mb-2">
                      <h3 className="font-medium text-base">Premium Plan</h3>
                      <p className="text-sm text-muted-foreground">Advanced features for growing businesses</p>
                    </div>
                    <div className="text-2xl font-bold mb-2">$89.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> Unlimited competitor insights
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> Priority AI marketing advisor 
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> 30 AI marketing reports
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span> Advanced analytics dashboard
                      </li>
                    </ul>
                    <button className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}