import { ReactNode } from "react";
import { useLocation } from "wouter";
import { LogOut, Info, Home, User, Bug, Receipt, CreditCard, Calculator, BookOpen, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, hasAdminRights, hasBusinessAdminRights, hasBillingAccess } from "@/hooks/use-auth";
import BottomNavigation from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function AppLayout({ 
  children, 
  title, 
  showBack = false, 
  onBack 
}: AppLayoutProps) {
  const { logoutMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-2 sm:px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {showBack && onBack && (
            <button 
              onClick={onBack}
              className="mr-2 rounded-full p-1 hover:bg-muted"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="sm:w-[24px] sm:h-[24px]"
              >
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}
          {title && <h1 className="text-lg sm:text-xl font-bold truncate max-w-[180px] sm:max-w-none">{title}</h1>}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {user ? (
            <>
              {/* Regular user menu items - don't show for platform admins */}
              {!hasAdminRights(user) && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation('/about')}
                    className="flex items-center text-gray-600 p-1 sm:p-2"
                  >
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">About</span>
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation('/profile')}
                    className="flex items-center text-gray-600 p-1 sm:p-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Account</span>
                  </Button>

                  {/* Business Admin section - only show to business admins who aren't platform admins */}
                  {hasBusinessAdminRights(user) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLocation('/business-admin')}
                      className="flex items-center text-gray-600 p-1 sm:p-2"
                    >
                      <Receipt className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Business</span>
                    </Button>
                  )}

                  {/* Locations section - only show to business users, not platform admins */}
                  {hasBusinessAdminRights(user) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLocation('/locations')}
                      className="flex items-center text-gray-600 p-1 sm:p-2"
                    >
                      <Building className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Locations</span>
                    </Button>
                  )}
                </>
              )}

              {/* Billing section - only show to business users, not platform admins */}
              {hasBillingAccess(user) && !hasAdminRights(user) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation('/billing')}
                  className="flex items-center text-gray-600 p-1 sm:p-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Billing</span>
                </Button>
              )}

              {/* Platform Admin section - only shown to VERIFIED platform admins */}
              {user && hasAdminRights(user) && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation('/admin')}
                    className="flex items-center text-gray-600 p-1 sm:p-2"
                  >
                    <svg 
                      className="h-4 w-4" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M12 6a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M20 12h2" />
                      <path d="M2 12h2" />
                      <path d="M17.5 4.5l-1.4 1.4" />
                      <path d="M7.9 17.1l-1.4 1.4" />
                      <path d="M17.5 19.5l-1.4-1.4" />
                      <path d="M7.9 6.9l-1.4-1.4" />
                    </svg>
                    <span className="hidden sm:inline ml-1">Admin</span>
                  </Button>

                  {/* Debug link - only shown to platform admins */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation('/debug')}
                    className="flex items-center text-gray-600 p-1 sm:p-2"
                  >
                    <Bug className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Debug</span>
                  </Button>
                </>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-red-500 p-1 sm:p-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/auth')}
                className="flex items-center text-gray-600 p-1 sm:p-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Login / Sign Up</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-3 sm:px-4 pb-24 pt-3 sm:pt-4 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation - only show for authenticated users on app pages */}
      {user && <BottomNavigation />}
    </div>
  );
}