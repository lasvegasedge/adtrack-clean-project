import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Edit, LogOut, MapPin, Building, Mail, Bell, Shield, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { BusinessProfileForm } from "@/components/profile/BusinessProfileForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!user) {
    setLocation("/auth");
    return null;
  }
  
  const businessId = user.businessId;

  // Fetch business details
  const { data: business, isLoading } = useQuery({
    queryKey: [`/api/business/${businessId}`],
    enabled: !!businessId,
  });

  // Fetch campaign stats
  const { data: stats } = useQuery({
    queryKey: [`/api/business/${businessId}/stats`],
    enabled: !!businessId,
  });

  return (
    <AppLayout title="Profile">
      <Tabs 
        defaultValue="profile" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center justify-center">
            <Building className="h-4 w-4 mr-2" />
            <span>Business Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center">
            <Shield className="h-4 w-4 mr-2" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center">
            <Bell className="h-4 w-4 mr-2" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Business Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{business?.name}</h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span>{business?.businessType}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{business?.address}, {business?.zipCode}</span>
                    </div>
                    {business?.phone && (
                      <div className="flex items-center text-gray-600">
                        <span className="ml-6">{business.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{user.username}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-xl font-medium">
                    {stats ? (stats.activeCampaigns + (stats.totalEarned > 0 ? 1 : 0)) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Campaigns</p>
                  <p className="text-xl font-medium">{stats?.activeCampaigns || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-xl font-medium">
                    ${stats?.totalSpent ? stats.totalSpent.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }) : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-xl font-medium">
                    ${stats?.totalEarned ? stats.totalEarned.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }) : '0'}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall ROI</p>
                <div className="flex items-baseline">
                  <p className={`text-2xl font-medium ${stats?.averageRoi && stats.averageRoi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.averageRoi ? stats.averageRoi.toFixed(1) : '0'}%
                  </p>
                  <p className="text-sm text-gray-500 ml-2">
                    lifetime return on investment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  logoutMutation.mutate(undefined, {
                    onSuccess: () => {
                      setLocation("/auth");
                    }
                  });
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Update your password to keep your account secure. You will need to enter your current password first.
              </p>
              <PasswordChangeForm />
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  logoutMutation.mutate(undefined, {
                    onSuccess: () => {
                      setLocation("/auth");
                    }
                  });
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
          
          <Card className="bg-white mt-6">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  logoutMutation.mutate(undefined, {
                    onSuccess: () => {
                      setLocation("/auth");
                    }
                  });
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Business Profile Edit Dialog */}
      {business && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Business Profile</DialogTitle>
            </DialogHeader>
            <BusinessProfileForm 
              business={business} 
              onClose={() => setEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
