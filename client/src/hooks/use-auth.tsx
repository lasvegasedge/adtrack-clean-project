import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Utility functions for role-based access control
export function hasAdminRights(user: SelectUser | null): boolean {
  if (!user) return false;
  
  // For debugging - log admin check
  console.log('Checking admin rights for user:', {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    is_admin: (user as any).is_admin,
    role: user.role
  });
  
  // Critical security check: Admin username is required
  // This ensures only intended admin accounts can access admin features
  if (user.username !== "admin@adtrack.online") {
    console.log('Admin access denied: Not an admin username');
    return false;
  }
  
  // Secondary criteria check
  // User must meet at least one of the following additional criteria:
  const additionalCriteria = [
    user.isAdmin === true,                // isAdmin flag from server
    (user as any).is_admin === true,      // Legacy is_admin flag  
    user.role === UserRole.PLATFORM_ADMIN // Platform admin role
  ];
  
  // Count how many additional criteria are met
  const criteriaCount = additionalCriteria.filter(Boolean).length;
  
  // Require at least 1 secondary criterion after username check
  const isAdmin = criteriaCount >= 1;
  
  console.log(`Admin access ${isAdmin ? 'granted' : 'denied'}: ${criteriaCount}/1 criteria met`);
  return isAdmin;
}

// Check if user has business admin access
export function hasBusinessAdminRights(user: SelectUser | null): boolean {
  if (!user) return false;
  
  return !!(
    user.role === UserRole.BUSINESS_ADMIN ||
    user.role === UserRole.PLATFORM_ADMIN ||
    hasAdminRights(user)
  );
}

// Check if user has billing access
export function hasBillingAccess(user: SelectUser | null): boolean {
  if (!user) return false;
  
  return !!(
    user.role === UserRole.BILLING_MANAGER ||
    user.role === UserRole.BUSINESS_ADMIN ||
    user.role === UserRole.PLATFORM_ADMIN ||
    hasAdminRights(user) ||
    hasBusinessAdminRights(user)
  );
}

// Check if user has marketing access
export function hasMarketingAccess(user: SelectUser | null): boolean {
  if (!user) return false;
  
  // All roles have marketing access, including GENERAL_USER
  return true;
}

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, InsertUser>;
  demoAccountMutation?: UseMutationResult<SelectUser, Error, void>;
  resendVerificationMutation?: UseMutationResult<any, Error, {email: string}>;
  checkVerificationMutation?: UseMutationResult<any, Error, {email: string}>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        // Parse error message from response
        const errorData = await res.json();
        throw new Error(errorData.message || "Authentication failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Add extra logging to debug admin redirection
      console.log('Login successful, user data:', {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        is_admin: (user as any).is_admin,
        role: user.role
      });
      
      // Flag for admin detection
      const isAdminUser = hasAdminRights(user);
      console.log('Is admin account?', isAdminUser);
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back to AdTrack${isAdminUser ? ' (Admin)' : ''}!`,
      });
    },
    onError: (error: Error) => {
      // Verification errors will be handled in the AuthPage component
      // So only show toast for other types of errors
      if (!error.message.includes("verify")) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data: any) => {
      // Handle requiresVerification flag from the server
      if (data.requiresVerification) {
        // Don't set the user in the global state
        // We'll show a verification message instead
        toast({
          title: "Registration successful",
          description: data.message || "Please check your email to verify your account.",
        });
        
        // If there was an email error, show an additional warning
        if (data.emailError) {
          toast({
            title: "Email Delivery Issue",
            description: "There was a problem sending the verification email. You may need to use the resend option.",
            variant: "destructive",
          });
        }
      } else {
        // For backward compatibility or if verification is not required
        queryClient.setQueryData(["/api/user"], data);
        toast({
          title: "Registration successful",
          description: "Welcome to AdTrack! Your account has been created.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const demoAccountMutation = useMutation({
    mutationFn: async () => {
      // First logout if already logged in
      if (user) {
        await apiRequest("POST", "/api/logout");
        // Clear existing user data from cache
        queryClient.setQueryData(["/api/user"], null);
      }
      
      // Now create/login to demo account with fresh session
      const res = await apiRequest("POST", "/api/demo-account");
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Set the user with its properties as returned from the server
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Demo Account Created",
        description: "You've been logged into a demo account with sample data.",
      });
      
      // Force reload page to ensure all authentication state is fresh
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "Demo Account Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/resend-verification", { email });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to resend verification email");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add check verification status mutation
  const checkVerificationMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/check-verification", { email });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check verification status");
      }
      return await res.json();
    },
  });

  // Handle special user accounts in the frontend layer
  let enhancedUser = user;
  
  // Set default status if it's missing
  if (enhancedUser && !enhancedUser.status) {
    enhancedUser = { ...enhancedUser, status: 'Active' };
  }
  
  // SECURITY FIX: NEVER override security permissions on the client
  // We now rely on the server to set correct admin rights
  // The server sets the isAdmin flag based on proper database checks
  // Do not set or modify isAdmin here
    
  return (
    <AuthContext.Provider
      value={{
        user: enhancedUser ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        demoAccountMutation,
        resendVerificationMutation,
        checkVerificationMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}