import { useEffect, useState } from "react";
import { useAuth, hasAdminRights } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import UserDebugger from "@/components/debug/UserDebugger";

export default function DebugPage() {
  const { user } = useAuth();
  const [userJson, setUserJson] = useState<string>("");
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (user) {
      setUserJson(JSON.stringify(user, null, 2));
    }
  }, [user]);
  
  return (
    <AppLayout title="Debug User Object">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Debug User Information</h1>
          <Button onClick={() => setLocation('/dashboard')}>Back to Dashboard</Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current User Object</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-[70vh] text-sm">
                {userJson}
              </pre>
            ) : (
              <div className="text-center p-4 text-gray-500">
                Not logged in. Please sign in to see user data.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Advanced User Debugger with utility functions */}
        <UserDebugger />
        
        {/* Legacy Admin Status Check */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Legacy Admin Status Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium w-40">user.isAdmin:</span>
                <span className={user?.isAdmin ? "text-green-600" : "text-red-600"}>
                  {user?.isAdmin ? "True" : "False"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-40">user.is_admin:</span>
                <span className={(user as any)?.is_admin ? "text-green-600" : "text-red-600"}>
                  {(user as any)?.is_admin ? "True" : "False"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-40">Combined check:</span>
                <span className={user?.isAdmin || (user as any)?.is_admin ? "text-green-600" : "text-red-600"}>
                  {user?.isAdmin || (user as any)?.is_admin ? "True" : "False"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-40">hasAdminRights():</span>
                <span className={hasAdminRights(user) ? "text-green-600" : "text-red-600"}>
                  {hasAdminRights(user) ? "True" : "False"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}