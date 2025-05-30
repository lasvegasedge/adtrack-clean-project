import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, hasBusinessAdminRights } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Building, Settings, UserPlus, UserMinus, 
  UserCheck, ShieldCheck, LucideIcon 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRole, Business } from "@shared/schema";

// Dummy user data for the mockup
const userRoles = [
  { id: 1, name: "John Smith", email: "john@example.com", role: UserRole.BUSINESS_ADMIN, status: "Active" },
  { id: 2, name: "Sarah Johnson", email: "sarah@example.com", role: UserRole.BILLING_MANAGER, status: "Active" },
  { id: 3, name: "Mike Davis", email: "mike@example.com", role: UserRole.MARKETING_USER, status: "Active" },
  { id: 4, name: "Lisa Brown", email: "lisa@example.com", role: UserRole.MARKETING_USER, status: "Invited" },
];

// Role badge component
function RoleBadge({ role }: { role: UserRole }) {
  let color = "bg-primary";
  let label = "User";
  
  switch (role) {
    case UserRole.BUSINESS_ADMIN:
      color = "bg-blue-500";
      label = "Admin";
      break;
    case UserRole.BILLING_MANAGER:
      color = "bg-green-500";
      label = "Billing";
      break;
    case UserRole.MARKETING_USER:
      color = "bg-purple-500";
      label = "Marketing";
      break;
    case UserRole.GENERAL_USER:
      color = "bg-gray-500";
      label = "General";
      break;
  }
  
  return (
    <span className={`${color} text-white text-xs px-2 py-1 rounded-full`}>
      {label}
    </span>
  );
}

// Permission card component
interface PermissionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  permissions: string[];
}

function PermissionCard({ title, description, icon: Icon, permissions }: PermissionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base">
          <Icon className="h-5 w-5 mr-2 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {permissions.map((permission, i) => (
            <li key={i} className="flex items-center">
              <span className="mr-2 text-green-500">✓</span> {permission}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function BusinessAdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get business info
  const { data: business } = useQuery<Business>({
    queryKey: ["/api/business/2"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  // Check user has access to this page
  useEffect(() => {
    if (user && !hasBusinessAdminRights(user)) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (!user || !hasBusinessAdminRights(user)) {
    return (
      <AppLayout title="Business Administration">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Access Restricted</p>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Business Administration">
      <div className="space-y-6">
        <div className="flex items-center">
          <Building className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-2xl font-bold">Business Control Panel</h2>
        </div>
        
        <p className="text-muted-foreground">
          Manage your business settings, user access, and permissions for {business?.name || "your business"}.
        </p>

        <Tabs defaultValue="users" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="settings">Business Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Team Members
                    </CardTitle>
                    <CardDescription>Manage access to your business account</CardDescription>
                  </div>
                  <Button className="flex items-center" size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md divide-y">
                  {userRoles.map((teamMember) => (
                    <div key={teamMember.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {teamMember.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{teamMember.name}</div>
                          <div className="text-sm text-muted-foreground">{teamMember.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <RoleBadge role={teamMember.role} />
                        <Badge variant={teamMember.status === "Active" ? "outline" : "secondary"}>
                          {teamMember.status}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                          {teamMember.status === "Invited" ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PermissionCard
                title="Business Admin"
                description="Full access to business settings"
                icon={ShieldCheck}
                permissions={[
                  "Manage all business settings",
                  "Add/remove users",
                  "Assign user roles",
                  "Manage billing and subscriptions",
                  "Full access to marketing data",
                  "Export all reports",
                ]}
              />
              
              <PermissionCard
                title="Billing Manager"
                description="Access to financial settings"
                icon={ShieldCheck}
                permissions={[
                  "View and update payment methods",
                  "Manage subscriptions",
                  "View invoices and billing history",
                  "Purchase premium features",
                  "Basic access to marketing data",
                ]}
              />
              
              <PermissionCard
                title="Marketing User"
                description="Standard marketing capabilities"
                icon={ShieldCheck}
                permissions={[
                  "Create and manage campaigns",
                  "View ROI analytics",
                  "Access competitor insights",
                  "Generate marketing reports",
                  "Use AI marketing advisor",
                ]}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  Business Profile
                </CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Business Name</label>
                      <input 
                        type="text"
                        className="w-full mt-1 rounded-md border border-input px-3 py-2"
                        value={business?.name || "Demo Business"}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Business Type</label>
                      <input 
                        type="text"
                        className="w-full mt-1 rounded-md border border-input px-3 py-2"
                        value={business?.businessType || "Retail"}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <input 
                        type="text"
                        className="w-full mt-1 rounded-md border border-input px-3 py-2"
                        value={business?.address || "123 Main St"}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Zip Code</label>
                      <input 
                        type="text"
                        className="w-full mt-1 rounded-md border border-input px-3 py-2"
                        value={business?.zipCode || "12345"}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <Button className="mt-4">
                    Edit Business Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}