import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  LineChart, 
  Award, 
  Gift, 
  Calculator, 
  BookOpen,
  Users,
  Settings,
  ServerCrash,
  Activity,
  CreditCard,
  Bug,
  Layers,
  MoveHorizontal,
  ClipboardList,
  BarChart,
  ArrowUpDown,
  DollarSign,
  Building
} from "lucide-react";
import { NavLink } from "@/components/ui/nav-link";
import { useAuth, hasAdminRights } from "@/hooks/use-auth";

export default function BottomNavigation() {
  const { user } = useAuth();
  // Use the hasAdminRights function for consistency across the app
  const isAdminUser = hasAdminRights(user);

  console.log('Bottom Navigation - Admin check:', {
    userId: user?.id,
    username: user?.username,
    isAdmin: user?.isAdmin,
    result: isAdminUser
  });

  // Check if user has implementations
  const { data: hasImplementations = false } = useQuery({
    queryKey: ["/api/user", user?.id, "has-implementations"],
    queryFn: async () => {
      if (!user) return false;
      const res = await fetch(`/api/user/${user.id}/implementations`);
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    },
    enabled: !!user,
  });

  // Route detection
  const [isDashboard] = useRoute("/dashboard");
  const [isHome] = useRoute("/");
  const [isCampaigns] = useRoute("/campaigns");
  const [isAddCampaign] = useRoute("/add-campaign");
  const [isCompare] = useRoute("/compare");
  const [isComparison] = useRoute("/comparison");
  const [isProfile] = useRoute("/profile");
  const [isAnalytics] = useRoute("/analytics");
  const [isPrediction] = useRoute("/prediction");
  const [isAchievements] = useRoute("/achievements");
  const [isRewards] = useRoute("/rewards");
  const [isCalculator] = useRoute("/calculator");
  const [isRoiCalculator] = useRoute("/roi-calculator");
  const [isMarketingInsights] = useRoute("/marketing-insights");
  const [isCampaignVisualizer] = useRoute("/campaign-visualizer");
  const [isImplementations] = useRoute("/implementations");
  const [isPricingRecommendations] = useRoute("/pricing-recommendations");
  const [isPricingPage] = useRoute("/pricing");
  const [isPlansPage] = useRoute("/plans");

  // Admin routes
  const [isAdminPage] = useRoute("/admin");
  const [isDebugPage] = useRoute("/debug");
  const [isBillingPage] = useRoute("/billing");

  // Function to check if a specific admin tab is active
  const isAdminTabActive = (tabName: string) => {
    if (!isAdminPage) return false;

    // Only run on client side
    if (typeof window === 'undefined') return false;

    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab') || 'dashboard';

    // Debug info to console
    console.log('isAdminTabActive check:', { tabName, currentTab, isMatch: currentTab === tabName });

    return currentTab === tabName;
  };

  // Direct tab handling function for admin panel
  const handleAdminTabClick = (tabName: string) => {
    console.log("BottomNavigation: Direct tab click handler:", tabName);

    // Update URL without reloading page
    window.history.pushState(null, '', `/admin?tab=${tabName}`);

    // Manually trigger tab change if we're already on the admin page
    if (isAdminPage) {
      // Create and dispatch a custom event that admin.tsx will listen for
      const event = new CustomEvent('adminTabChange', { 
        detail: { tab: tabName }
      });
      window.dispatchEvent(event);
    } else {
      // If not on admin page, navigate there with the tab parameter
      window.location.href = `/admin?tab=${tabName}`;
    }
  };

  // Different navigation for platform admins
  if (isAdminUser) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 overflow-x-auto">
        <div className="flex justify-between md:justify-around min-w-max px-1">
          <div
            className={`flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px] ${
              isAdminTabActive('dashboard') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleAdminTabClick('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span className="text-xs mt-1">Dashboard</span>
          </div>

          <div
            className={`flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px] ${
              isAdminTabActive('billing') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleAdminTabClick('billing')}
          >
            <DollarSign size={18} />
            <span className="text-xs mt-1">Billing</span>
          </div>

          <div
            className={`flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px] ${
              isAdminTabActive('pricing') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleAdminTabClick('pricing')}
          >
            <BarChart size={18} />
            <span className="text-xs mt-1">Pricing</span>
          </div>

          <div
            className={`flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px] ${
              isAdminTabActive('settings') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleAdminTabClick('settings')}
          >
            <Settings size={18} />
            <span className="text-xs mt-1">Settings</span>
          </div>

          <div
            className={`flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px] ${
              isAdminTabActive('system') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleAdminTabClick('system')}
          >
            <ServerCrash size={18} />
            <span className="text-xs mt-1">System</span>
          </div>
        </div>
      </nav>
    );
  }

  // Regular navigation for all other users
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 overflow-x-auto pb-1">
      <div className="flex justify-start md:justify-around min-w-max px-2">
        <NavLink 
          href="/dashboard" 
          active={isDashboard || isHome}
          icon={<LayoutDashboard size={18} />}
        >
          Dashboard
        </NavLink>
        <NavLink 
          href="/campaigns" 
          active={isCampaigns}
          icon={<FileSpreadsheet size={18} />}
        >
          Campaigns
        </NavLink>
        <NavLink 
          href="/campaign-visualizer" 
          active={isCampaignVisualizer}
          icon={<MoveHorizontal size={18} />}
          className="hidden sm:flex"
        >
          Visualize
        </NavLink>
        <NavLink 
          href="/analytics" 
          active={isAnalytics}
          icon={<LineChart size={18} />}
        >
          Analytics
        </NavLink>
        <NavLink 
          href="/comparison" 
          active={isComparison}
          icon={<BarChart size={18} />}
        >
          Compare
        </NavLink>
        <NavLink 
          href="/marketing-insights" 
          active={isMarketingInsights}
          icon={<BookOpen size={18} />}
          className="hidden sm:flex"
        >
          Insights
        </NavLink>
        <NavLink 
          href="/achievements" 
          active={isAchievements}
          icon={<Award size={18} />}
          className="hidden sm:flex"
        >
          Achieve
        </NavLink>
        <NavLink 
          href="/app/roi-calculator" 
          active={isRoiCalculator}
          icon={<Calculator size={18} />}
        >
          ROI Calc
        </NavLink>
        <NavLink 
          href="/pricing-recommendations" 
          active={isPricingRecommendations}
          icon={<DollarSign size={18} />}
        >
          Price Rec
        </NavLink>
        <NavLink 
          href="/implementations" 
          active={isImplementations}
          icon={
            <div className="relative">
              <ClipboardList size={18} />
              {hasImplementations && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          }
          className="hidden sm:flex"
        >
          Plans
        </NavLink>

      </div>
    </nav>
  );
}