import { useLocation } from "wouter";
import { useState, useEffect, useRef } from 'react';
import { Step } from 'react-joyride';
import AppLayout from "@/components/layout/AppLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import RoiRankCard from "@/components/dashboard/RoiRankCard";
import CampaignsList from "@/components/dashboard/CampaignsList";
import TopPerformers from "@/components/dashboard/TopPerformers";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AdRecommendations from "@/components/dashboard/AdRecommendations";
import { CompetitorBenchmarkInsights } from "@/components/analytics/CompetitorBenchmarkInsights";
import { AchievementSummary } from "@/components/achievements/AchievementSummary";
import FeatureUsageDisplay from "@/components/dashboard/FeatureUsageDisplay";
import MarketingInsightsSummary from "@/components/dashboard/MarketingInsightsSummary";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { MarketingMascot } from "@/components/onboarding/MarketingMascot";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isFirstLogin, setIsFirstLogin] = useLocalStorage('adtrack-first-login', true);
  const [mascotMessage, setMascotMessage] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  // Fetch business data for the current user
  const { data: business } = useQuery({
    queryKey: ['/api/user', user?.id, 'business'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/user/${user.id}/business`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch trial period status for the current user
  const { data: trialStatus } = useQuery({
    queryKey: ['/api/user', user?.id, 'trial-status'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/user/${user.id}/trial-status`);
        if (!res.ok) {
          console.log("Dashboard: Trial status fetch failed:", res.status);
          return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint fails
        }
        return res.json();
      } catch (error) {
        console.error("Dashboard: Error fetching trial status:", error);
        return { isTrialPeriod: true, remainingDays: 7 }; // Default to trial if endpoint errors
      }
    },
    enabled: !!user,
    retry: false, // Don't retry if it fails
  });
  
  // References for tour targets
  const quickStatsRef = useRef<HTMLDivElement>(null);
  const roiRankRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const topPerformersRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  // Define the tour steps
  const onboardingSteps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to AdTrack, your AI-Powered Solution for marketing analytics! Let\'s take a quick tour to help you understand how to track and improve your marketing ROI.',
      placement: 'center',
      disableBeacon: true,
      locale: {
        next: 'Start Tour'
      },
      styles: {
        buttonNext: {
          backgroundColor: '#22c55e',
          borderRadius: '4px',
          color: 'white',
          fontWeight: 'bold',
          padding: '10px 20px',
        }
      }
    },
    {
      target: '.quick-stats-section',
      content: 'Here\'s a quick overview of your marketing performance statistics.',
      placement: 'bottom',
    },
    {
      target: '.roi-rank-section',
      content: 'See how your business ranks compared to others in your area.',
      placement: 'bottom',
    },
    {
      target: '.charts-section',
      content: 'These charts show your ROI trends over time and spending by advertising method.',
      placement: 'top',
    },
    {
      target: '.campaigns-section',
      content: 'View and manage all your advertising campaigns here. Add new campaigns or update existing ones.',
      placement: 'right',
    },
    {
      target: '.insights-section',
      content: 'Get AI-powered marketing insights to help improve your strategy.',
      placement: 'left',
    },
    {
      target: '.top-performers-section',
      content: 'See the top performing campaigns in your area. Purchase insights to learn from successful businesses.',
      placement: 'left',
    },
    {
      target: '.ad-recommendations-section',
      content: 'Get AI-powered ad recommendations tailored to your business. Our system analyzes your campaigns and suggests the most effective advertising methods.',
      placement: 'top',
    },
    {
      target: 'body',
      content: 'That\'s it! You\'re ready to start tracking and improving your marketing ROI. Our mascot will be here if you need any help.',
      placement: 'center',
      locale: {
        last: 'Finish Tour'
      }
    },
  ];

  // Redirect to login if not authenticated
  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Set mascot message based on user state
  useEffect(() => {
    if (isFirstLogin) {
      setMascotMessage('Welcome to AdTrack, your AI-Powered marketing solution! I\'m your marketing assistant. I\'ll guide you through our platform and help you improve your ROI.');
      setIsFirstLogin(false);
    }
  }, [isFirstLogin, setIsFirstLogin]);

  const handleTourComplete = () => {
    setMascotMessage('Great job completing the tour! Now you\'re ready to start tracking your marketing performance.');
    
    // Show the message for 5 seconds
    setTimeout(() => {
      setMascotMessage(undefined);
    }, 5000);
  };

  const handleTourSkip = () => {
    setMascotMessage('You skipped the tour. I\'ll be here if you need any help!');
    
    // Show the message for 5 seconds
    setTimeout(() => {
      setMascotMessage(undefined);
    }, 5000);
  };

  // Function to handle upgrade click
  const handleUpgradeClick = () => {
    toast({
      title: "Premium Upgrade",
      description: "Redirecting to subscription options...",
      duration: 3000,
    });
    // Redirect to the minisite pricing section
    window.location.href = '/minisite#pricing';
  };
  
  return (
    <AppLayout title="Dashboard">
      {/* Onboarding Components */}
      <OnboardingTour 
        isNewUser={isFirstLogin} 
        steps={onboardingSteps} 
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
      <MarketingMascot 
        message={mascotMessage}
        position="bottom-right"
        size="md"
      />
      
      {/* Trial Period Alert */}
      {trialStatus?.isTrialPeriod && (
        <Alert className="mb-4 sm:mb-6 border-amber-500">
          <Clock className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-600 font-semibold">
            Trial Period Active
          </AlertTitle>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <AlertDescription className="mt-1 text-sm sm:text-base">
              {trialStatus.remainingDays > 0 
                ? `You have ${trialStatus.remainingDays} day${trialStatus.remainingDays !== 1 ? 's' : ''} remaining in your trial period.`
                : "Your trial period is ending today."} Upgrade to unlock all premium features.
            </AlertDescription>
            <Button 
              className="mt-3 sm:mt-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-sm sm:text-base"
              onClick={handleUpgradeClick}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Dashboard Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Stats Section */}
        <div className="quick-stats-section" ref={quickStatsRef}>
          <QuickStats />
        </div>
        
        {/* ROI Rank Section */}
        <div className="roi-rank-section" ref={roiRankRef}>
          <RoiRankCard />
        </div>
        
        {/* Charts Section */}
        <div className="charts-section" ref={chartsRef}>
          <DashboardCharts />
        </div>
        
        {/* Competitor Insights */}
        <div>
          <CompetitorBenchmarkInsights />
        </div>
        
        {/* Ad Recommendations */}
        {business && (
          <div className="ad-recommendations-section" ref={recommendationsRef}>
            <AdRecommendations businessId={business.id} />
          </div>
        )}
        
        {/* Campaigns and Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="campaigns-section" ref={campaignsRef}>
              <CampaignsList />
            </div>
            <FeatureUsageDisplay />
          </div>
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <div className="insights-section">
              <MarketingInsightsSummary />
            </div>
            <AchievementSummary />
            <div className="top-performers-section" ref={topPerformersRef}>
              <TopPerformers />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
