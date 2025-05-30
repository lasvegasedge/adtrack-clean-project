import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RefreshCw, 
  Mail, 
  Bell, 
  Settings, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Zap 
} from "lucide-react";

// Notification configuration schema
const adminNotificationSchema = z.object({
  systemNotifications: z.boolean().default(true),
  userRegistrationAlerts: z.boolean().default(true),
  businessVerificationAlerts: z.boolean().default(true),
  weeklyAdminReports: z.boolean().default(true),
  failedPaymentAlerts: z.boolean().default(true),
  securityAlerts: z.boolean().default(true),
  performanceAlerts: z.boolean().default(true),
  maintenanceNotifications: z.boolean().default(true),
  notificationEmail: z.string().email("Must be a valid email").or(z.literal('')),
  alertFrequency: z.enum(["immediate", "hourly", "daily", "weekly"]).default("immediate"),
  customAlertThreshold: z.number().min(0).max(100).default(10),
});

type AdminNotificationData = z.infer<typeof adminNotificationSchema>;

export function AdminNotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  // Setup form with Zod validation
  const form = useForm<AdminNotificationData>({
    resolver: zodResolver(adminNotificationSchema),
    defaultValues: {
      systemNotifications: true,
      userRegistrationAlerts: true,
      businessVerificationAlerts: true,
      weeklyAdminReports: true,
      failedPaymentAlerts: true,
      securityAlerts: true,
      performanceAlerts: true,
      maintenanceNotifications: true,
      notificationEmail: "",
      alertFrequency: "immediate",
      customAlertThreshold: 10,
    },
  });
  
  // Fetch the current notification settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/notification-settings'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/notification-settings");
        return await res.json();
      } catch (error) {
        // Return defaults if settings don't exist yet
        if (error instanceof Response && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
  
  // Update the form when data is loaded
  useEffect(() => {
    if (data) {
      Object.keys(data).forEach((key) => {
        if (key in form.getValues()) {
          form.setValue(key as any, data[key]);
        }
      });
    }
  }, [data, form]);
  
  // Save notification settings mutation
  const mutation = useMutation({
    mutationFn: async (data: AdminNotificationData) => {
      const res = await apiRequest("POST", "/api/admin/notification-settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Notification settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    },
  });
  
  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", "/api/admin/test-notification", { type });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test notification sent",
        description: "Check your email for the test notification.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending notification",
        description: error.message || "Failed to send test notification.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: AdminNotificationData) => {
    mutation.mutate(data);
  };
  
  // Handle sending test notification
  const sendTestNotification = (type: string) => {
    testNotificationMutation.mutate(type);
  };
  
  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure platform-wide notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when the system should send notifications
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CardContent>
          <TabsList className="flex flex-wrap gap-1 mb-6">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="users">User Notifications</TabsTrigger>
            <TabsTrigger value="business">Business Alerts</TabsTrigger>
            <TabsTrigger value="security">Security & System</TabsTrigger>
            <TabsTrigger value="test">Test Notifications</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="general" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Notification Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notification Email</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            <Input placeholder="admin@adtrack.online" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Primary email for receiving system alerts and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="alertFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Frequency</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[200px]">
                              <Clock className="w-4 h-4 mr-2 text-gray-500" />
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="hourly">Hourly Digest</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Summary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often admin notifications should be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="systemNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">System Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications about system events and status
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">User-Related Notifications</h3>
                  
                  <FormField
                    control={form.control}
                    name="userRegistrationAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">New User Registration</FormLabel>
                          <FormDescription>
                            Get notified when new users register on the platform
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weeklyAdminReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Weekly Admin Reports</FormLabel>
                          <FormDescription>
                            Receive weekly summary reports of user activities and growth
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="business" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Business-Related Alerts</h3>
                  
                  <FormField
                    control={form.control}
                    name="businessVerificationAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Business Verification Requests</FormLabel>
                          <FormDescription>
                            Get notified when businesses request verification
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="failedPaymentAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Failed Payment Alerts</FormLabel>
                          <FormDescription>
                            Get notified about failed payments and billing issues
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="performanceAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Performance Threshold Alerts</FormLabel>
                          <FormDescription>
                            Get notified when system performance falls below thresholds
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customAlertThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Alert Threshold (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Set threshold percentage for performance alerts (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security & System Notifications</h3>
                  
                  <FormField
                    control={form.control}
                    name="securityAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Security Alerts</FormLabel>
                          <FormDescription>
                            Get notified about suspicious activities and security events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maintenanceNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Maintenance Notifications</FormLabel>
                          <FormDescription>
                            Get notified about scheduled maintenance and updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="test" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Test Notification System</h3>
                  <p className="text-sm text-muted-foreground">
                    Send test notifications to verify the notification system is working correctly
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">System Notification</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-xs text-muted-foreground">
                          Test system-level notification delivery
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => sendTestNotification('system')}
                          disabled={testNotificationMutation.isPending}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">User Registration Alert</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-xs text-muted-foreground">
                          Test user registration notification
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => sendTestNotification('registration')}
                          disabled={testNotificationMutation.isPending}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Business Verification Alert</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-xs text-muted-foreground">
                          Test business verification notification
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => sendTestNotification('verification')}
                          disabled={testNotificationMutation.isPending}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Security Alert</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-xs text-muted-foreground">
                          Test security alert notification
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => sendTestNotification('security')}
                          disabled={testNotificationMutation.isPending}
                        >
                          {testNotificationMutation.isPending ? 'Sending...' : 'Send Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {activeTab !== "test" && (
                <div className="flex justify-end mt-6">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Tabs>
    </Card>
  );
}