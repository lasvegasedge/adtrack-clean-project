import { useAuth } from "@/hooks/use-auth";
import { hasAdminRights } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UserDebugger() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  if (isLoading) {
    return <div>Loading user data...</div>;
  }
  
  const userHasAdminRights = hasAdminRights(user);
  
  const forceAdminStatus = async () => {
    try {
      // Force the user to have admin rights in the client state
      if (user) {
        // Set both admin flag variations to ensure compatibility
        const enhancedUser = { 
          ...user, 
          isAdmin: true,
          is_admin: true 
        };
        queryClient.setQueryData(["/api/user"], enhancedUser);
        
        toast({
          title: "Admin Status Updated",
          description: "Admin status has been forced in the client state",
        });
        
        // Force refresh the page to update UI components
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    }
  };
  
  const forceAdminUsername = async () => {
    try {
      // Force the user to have admin username
      if (user) {
        const enhancedUser = { 
          ...user, 
          username: "admin@adtrack.online"
        };
        queryClient.setQueryData(["/api/user"], enhancedUser);
        
        toast({
          title: "Username Updated",
          description: "Username changed to admin@adtrack.online",
        });
        
        // Force refresh the page to update UI components
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating username:", error);
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
    }
  };
  
  const refreshSession = async () => {
    try {
      // Force clear and get fresh session
      await apiRequest("POST", "/api/refresh-session");
      // Invalidate cache to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Session Refreshed",
        description: "Your session has been refreshed",
      });
      // Reload page to update all components
      window.location.reload();
    } catch (error) {
      toast({
        title: "Session Refresh Failed",
        description: "Failed to refresh session",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>User Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">User Data:</h3>
            <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-auto max-h-40">
              {user ? JSON.stringify(user, null, 2) : "No user data available"}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium">Admin Status:</h3>
            <p>
              Has Admin Rights: <strong>{userHasAdminRights ? "Yes" : "No"}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Checks for: isAdmin, is_admin, and special usernames
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              onClick={forceAdminStatus} 
              variant="outline" 
              size="sm"
              disabled={!user}
            >
              Force Admin Status
            </Button>
            <Button 
              onClick={forceAdminUsername} 
              variant="outline" 
              size="sm"
              disabled={!user}
            >
              Use Admin Username
            </Button>
            <Button 
              onClick={refreshSession} 
              variant="outline" 
              size="sm"
            >
              Refresh Session
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin-login'} 
              variant="outline" 
              size="sm"
              className="bg-blue-50"
            >
              Go To Admin Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}