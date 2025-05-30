import { useAuth, hasAdminRights } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserApprovalStatus } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : (
        <Component />
      )}
    </Route>
  );
}

export function ApprovedUserRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  
  // Check if user is approved
  const isApproved = user?.approvalStatus === UserApprovalStatus.APPROVED;
  
  // Debug logging for approval status check
  console.log('Approved route access attempt:', { 
    path,
    userId: user?.id,
    username: user?.username,
    approvalStatus: user?.approvalStatus,
    isApproved
  });

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : !isApproved ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Account Not Approved</h1>
          <p className="text-gray-600 mb-4">
            Your account is pending approval. Once approved, you'll have access to our premium features.
          </p>
          <Redirect to="/" />
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  
  // Use our centralized function to check admin status
  // Add debug logging to trace access attempts
  console.log('Admin route access attempt:', { 
    path,
    userId: user?.id,
    username: user?.username,
    isAdmin: user?.isAdmin,
    is_admin: (user as any)?.is_admin,
    role: user?.role
  });
  
  const isAllowed = hasAdminRights(user);
  
  // Extra safety check - only specific admin accounts should access
  const strictlyAdmin = user && (
    user.username === "admin@adtrack.online" || 
    user.isAdmin === true || 
    (user as any).is_admin === true
  );
  
  console.log('Admin access decision:', { isAllowed, strictlyAdmin });

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : !isAllowed || !strictlyAdmin ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Redirect to="/" />
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}