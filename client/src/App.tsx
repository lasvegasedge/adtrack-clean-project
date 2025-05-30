import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import ComingSoonPage from "@/pages/coming-soon";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Campaigns from "@/pages/campaigns";
import AddCampaign from "@/pages/add-campaign";
import CampaignDetail from "@/pages/campaign-detail";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Profile from "@/pages/profile";
import Compare from "@/pages/compare";
import ComparisonPage from "@/pages/comparison";
import Analytics from "@/pages/analytics";
import Prediction from "@/pages/prediction";
import PurchaseTopPerformers from "@/pages/purchase-top-performers";
import PricingPage from "@/pages/pricing-page";
import Pricing from "@/pages/pricing";
import MarketingPricingPage from "@/pages/marketing-pricing-new";
import AboutPage from "@/pages/about";
import AchievementsPage from "@/pages/achievements-page";
import RewardsPage from "@/pages/rewards-page";
import CostEfficiencyCalculator from "@/pages/cost-efficiency-calculator";
import SharedReportPage from "@/pages/shared-report";
import DebugPage from "@/pages/debug";
import MarketingInsights from "@/pages/marketing-insights";
import Billing from "@/pages/billing";
import BusinessAdmin from "@/pages/business-admin";
import CampaignVisualizerPage from "@/pages/campaign-visualizer";
import ImplementationsPage from "@/pages/implementations";

import ManagePricing from "@/pages/admin/manage-pricing";
import ManageDiscountCodes from "@/pages/admin/manage-discount-codes";
import PricingRecommendations from "@/pages/pricing-recommendations";
import PricingRecommendationRequest from "@/pages/pricing-recommendation-request";
import ROICalculator from "@/pages/roi-calculator";
import AppRoiCalculator from "@/pages/app-roi-calculator";
import QuickStartGuide from "@/pages/quick-start-guide";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import MiniSite from "@/pages/minisite";
import Landing from "@/pages/landing";
import HomeRedirect from "@/pages/home-redirect";
import LandingRedirect from "@/pages/landing-redirect";
import MinisiteSimple from "@/pages/minisite-simple";
import MinisiteFixed from "@/pages/minisite-fixed";
import MinisiteDynamic from "@/pages/minisite-dynamic";
import MinisiteSimpleUpdated from "@/pages/minisite-simple-updated";
import MinisiteNew from "@/pages/minisite-new";
import MinisiteComplete from "@/pages/minisite-complete";
import MinisiteWorking from "@/pages/minisite-working";
import MinisiteFinal from "@/pages/minisite-final";
import MinisiteFixedFooter from "@/pages/minisite-fixed-footer";
import MinisiteSimpleFooter from "@/pages/minisite-simple-footer";
import LandingPage from "@/pages/landing-page-no-pricing";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import ROITrackingFeature from "@/pages/features/roi-tracking";
import CompetitorAnalysisFeature from "@/pages/features/competitor-analysis";
import AIRecommendationsFeature from "@/pages/features/ai-recommendations";
import AddPaymentMethodPage from "@/pages/add-payment-method";
import LocationsPage from "@/pages/locations";
import ContactPage from "@/pages/contact";
import TestDashboard from "@/pages/test-dashboard";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { SubscriptionProvider } from "./hooks/use-subscription";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import { PaymentProtectedRoute } from "@/lib/payment-protected-route";
import { queryClient } from "@/lib/queryClient";
import MarketingChatbot from "@/components/chatbot/MarketingChatbot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
<Route path="/landing-no-pricing" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/test-dashboard" component={TestDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/admin-login" component={AdminLogin} />
      <ProtectedRoute path="/add-campaign" component={AddCampaign} />
      <ProtectedRoute path="/campaigns/:id" component={CampaignDetail} />
      <ProtectedRoute path="/campaign/:id" component={CampaignDetail} />
      <ProtectedRoute path="/campaigns" component={Campaigns} />
      <AdminProtectedRoute path="/admin" component={Admin} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/compare" component={Compare} />
      <ProtectedRoute path="/comparison" component={ComparisonPage} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/prediction" component={Prediction} />
      <Route path="/roi-calculator" component={ROICalculator} />
      <Route path="/app/roi-calculator" component={AppRoiCalculator} />
      <Route path="/quick-start-guide" component={QuickStartGuide} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      <Route path="/plans" component={MarketingPricingPage} />

      <ProtectedRoute path="/pricing-page" component={PricingPage} />
      <ProtectedRoute path="/purchase-top-performers" component={PurchaseTopPerformers} />
      <AdminProtectedRoute path="/admin/manage-pricing" component={ManagePricing} />
      <AdminProtectedRoute path="/admin/manage-discount-codes" component={ManageDiscountCodes} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <ProtectedRoute path="/rewards" component={RewardsPage} />
      <ProtectedRoute path="/calculator" component={CostEfficiencyCalculator} />
      <PaymentProtectedRoute path="/marketing-insights" component={MarketingInsights} />
      <ProtectedRoute path="/pricing-recommendations" component={PricingRecommendations} />
      <ProtectedRoute path="/pricing-recommendation-request" component={PricingRecommendationRequest} />
      <Route path="/minisite" component={MinisiteSimpleFooter} />
      <Route path="/minisite/" component={MinisiteSimpleFooter} />
      <Route path="/minisite-footer-test" component={MinisiteSimpleFooter} />
      <Route path="/landing" component={Landing} />
      <Route path="/simple" component={MinisiteSimple} />
      <Route path="/simple-updated" component={MinisiteSimpleUpdated} />
      <Route path="/minisite-fixed" component={MinisiteFixed} />
      <Route path="/minisite-dynamic" component={MinisiteDynamic} />
      <Route path="/minisite-complete" component={MinisiteComplete} />
      <Route path="/minisite-final" component={MinisiteFinal} />
      <Route path="/about" component={AboutPage} />
      <Route path="/shared-report" component={SharedReportPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/coming-soon" component={ComingSoonPage} />
      <Route path="/blog" component={ComingSoonPage} />
      <Route path="/case-studies" component={ComingSoonPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/features/roi-tracking" component={ROITrackingFeature} />
      <Route path="/features/competitor-analysis" component={CompetitorAnalysisFeature} />
      <Route path="/features/ai-recommendations" component={AIRecommendationsFeature} />
      <Route path="/features/marketing-insights" component={ComingSoonPage} />
      <ProtectedRoute path="/debug" component={DebugPage} />
      <ProtectedRoute path="/billing" component={Billing} />
      <ProtectedRoute path="/business-admin" component={BusinessAdmin} />
      <ProtectedRoute path="/campaign-visualizer" component={CampaignVisualizerPage} />
      <ProtectedRoute path="/implementations" component={ImplementationsPage} />
      <ProtectedRoute path="/locations" component={LocationsPage} />
      <ProtectedRoute path="/subscribe" component={Subscribe} />
      <ProtectedRoute path="/subscription-success" component={SubscriptionSuccess} />
      <ProtectedRoute path="/add-payment-method" component={AddPaymentMethodPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <Router />
          <Toaster />
          {/* Marketing Chatbot - Available on all authenticated pages */}
          <ProtectedChatbot />
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Helper component to render the chatbot only when user is authenticated and not on analytics
function ProtectedChatbot() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Don't render while loading or if no user or if on analytics page
  if (isLoading || !user || location === '/analytics') {
    return null;
  }

  return <MarketingChatbot />;
}

export default App;