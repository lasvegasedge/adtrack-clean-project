import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  Mail, 
  Timer, 
  TrendingUp
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotificationSettings {
  id: number;
  userId: number;
  email: string;
  roiAlerts: boolean;
  campaignReminders: boolean;
  weeklyReports: boolean;
  lastNotified: string | null;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;
  
  // State for form
  const [email, setEmail] = useState<string>("");
  const [roiAlerts, setRoiAlerts] = useState<boolean>(true);
  const [campaignReminders, setCampaignReminders] = useState<boolean>(true);
  const [weeklyReports, setWeeklyReports] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("settings");
  
  // Fetch notification settings
  const { 
    data: settings,
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/user', userId, 'notification-settings'],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const res = await apiRequest(
          "GET", 
          `/api/user/${userId}/notification-settings`
        );
        return await res.json();
      } catch (error) {
        // Not found is expected if settings don't exist yet
        if (error instanceof Response && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!userId,
  });
  
  // Set form values when settings are loaded
  useEffect(() => {
    if (settings) {
      setEmail(settings.email);
      setRoiAlerts(settings.roiAlerts);
      setCampaignReminders(settings.campaignReminders);
      setWeeklyReports(settings.weeklyReports);
    } else if (user) {
      // Default to user's username (email) if settings don't exist
      setEmail(user.username);
    }
  }, [settings, user]);
  
  // Create new notification settings
  const createMutation = useMutation({
    mutationFn: async (data: Omit<NotificationSettings, 'id' | 'userId' | 'lastNotified'>) => {
      if (!userId) throw new Error("User not authenticated");
      
      const res = await apiRequest(
        "POST", 
        `/api/user/${userId}/notification-settings`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'notification-settings'] });
      toast({
        title: "Notification settings created",
        description: "Your notification preferences have been saved.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create notification settings",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update existing notification settings
  const updateMutation = useMutation({
    mutationFn: async (data: Omit<NotificationSettings, 'id' | 'userId' | 'lastNotified'>) => {
      if (!userId || !settings?.id) throw new Error("Settings not found");
      
      const res = await apiRequest(
        "PUT", 
        `/api/user/${userId}/notification-settings/${settings.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'notification-settings'] });
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update notification settings",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Send test notification
  const testNotificationMutation = useMutation({
    mutationFn: async (type: 'roi' | 'reminder' | 'weekly') => {
      if (!userId) throw new Error("User not authenticated");
      
      const res = await apiRequest(
        "POST", 
        `/api/user/${userId}/send-test-notification`, 
        { type }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test notification sent",
        description: data.message || "Check your email",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test notification",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      email,
      roiAlerts,
      campaignReminders,
      weeklyReports,
    };
    
    if (settings) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  // Handle sending test notifications
  const sendTestNotification = (type: 'roi' | 'reminder' | 'weekly') => {
    if (!settings) {
      toast({
        title: "Save settings first",
        description: "You need to save your notification settings before sending test notifications.",
        variant: "default",
      });
      return;
    }
    
    testNotificationMutation.mutate(type);
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Loading notification settings...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Settings
        </CardTitle>
        <CardDescription>
          Configure when and how you receive notifications about your advertising campaigns
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  All notifications will be sent to this email address
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Types</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="roi-alerts" className="text-base">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        ROI Alert Notifications
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when campaigns reach significant ROI milestones
                    </p>
                  </div>
                  <Switch
                    id="roi-alerts"
                    checked={roiAlerts}
                    onCheckedChange={setRoiAlerts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="campaign-reminders" className="text-base">
                      <span className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Campaign Reminders
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive reminders to update campaigns that haven't been updated in a while
                    </p>
                  </div>
                  <Switch
                    id="campaign-reminders"
                    checked={campaignReminders}
                    onCheckedChange={setCampaignReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports" className="text-base">
                      <span className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        Weekly Performance Reports
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get a weekly summary of your campaign performance
                    </p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  "Saving..."
                ) : settings ? (
                  "Update Settings"
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="test">
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-1">
              <p className="text-sm">
                Send test notifications to verify your email is configured correctly
              </p>
              {!settings && (
                <div className="flex items-center mt-4 p-2 bg-amber-50 text-amber-900 rounded-md">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    You need to save your notification settings before sending test notifications
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <TooltipProvider>
                <div className="flex flex-col space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => sendTestNotification('roi')}
                        disabled={!settings || !roiAlerts || testNotificationMutation.isPending}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        ROI Alert
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Test ROI milestone notification</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    {roiAlerts ? (
                      <Check className="h-3 w-3 inline-block mr-1 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 inline-block mr-1 text-amber-500" />
                    )}
                    {roiAlerts ? "Enabled" : "Disabled"}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => sendTestNotification('reminder')}
                        disabled={!settings || !campaignReminders || testNotificationMutation.isPending}
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Reminder
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Test campaign update reminder</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    {campaignReminders ? (
                      <Check className="h-3 w-3 inline-block mr-1 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 inline-block mr-1 text-amber-500" />
                    )}
                    {campaignReminders ? "Enabled" : "Disabled"}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => sendTestNotification('weekly')}
                        disabled={!settings || !weeklyReports || testNotificationMutation.isPending}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Weekly Report
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Test weekly performance report</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    {weeklyReports ? (
                      <Check className="h-3 w-3 inline-block mr-1 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 inline-block mr-1 text-amber-500" />
                    )}
                    {weeklyReports ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </TooltipProvider>
            </div>
            
            {testNotificationMutation.isPending && (
              <div className="mt-4 p-2 bg-blue-50 text-blue-900 rounded-md">
                <p className="text-sm">Sending test notification...</p>
              </div>
            )}
            
            {testNotificationMutation.isSuccess && (
              <div className="mt-4 p-2 bg-green-50 text-green-900 rounded-md">
                <p className="text-sm">
                  Test notification sent! Check your email or the console logs.
                </p>
              </div>
            )}
            
            {testNotificationMutation.isError && (
              <div className="mt-4 p-2 bg-red-50 text-red-900 rounded-md">
                <p className="text-sm">
                  {(testNotificationMutation.error as Error)?.message || 
                    "Failed to send test notification"}
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}