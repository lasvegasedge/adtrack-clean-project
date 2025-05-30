import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Landing from "./landing";

export default function HomeRedirect() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user) {
      // If user is logged in, redirect to dashboard
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);
  
  // If user is not logged in, show the landing page
  return isLoading ? (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  ) : (
    <Landing />
  );
}