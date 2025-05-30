import { useState } from "react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth, hasAdminRights } from "@/hooks/use-auth";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // If already authenticated and admin, redirect to admin panel
  if (user && hasAdminRights(user)) {
    return <Redirect to="/admin" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First logout if already logged in
      if (user) {
        await apiRequest("POST", "/api/logout");
        queryClient.setQueryData(["/api/user"], null);
      }
      
      // Use the dedicated admin login endpoint
      const res = await apiRequest("POST", "/api/admin-login", { username, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Admin authentication failed");
      }
      
      const userData = await res.json();
      
      // Double-check admin status using our centralized function
      if (!hasAdminRights(userData)) {
        console.error("Admin login endpoint did not return an admin user:", userData);
        throw new Error("Server did not grant administrator privileges");
      }
      
      // Store user data in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the Admin Panel"
      });
      
      // Force a complete page reload to ensure clean state
      window.location.href = '/admin';
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mb-4">
        <Link href="/auth" className="inline-flex items-center text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </Link>
      </div>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Administrator Login</CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to access the management panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input 
                id="username" 
                type="email" 
                placeholder="Enter admin email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : "Sign In as Administrator"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}