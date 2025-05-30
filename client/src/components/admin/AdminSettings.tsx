import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Phone, RefreshCw, CheckCircle2, X } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import EmailTemplates from "./EmailTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

const adminSettingsSchema = z.object({
  notificationEmail: z.string().email("Must be a valid email address").optional().or(z.literal('')),
  supportEmail: z.string().email("Must be a valid email address").optional().or(z.literal('')),
  supportPhone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
  customEmailTemplates: z.boolean().default(false),
});

type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailPreview, setEmailPreview] = useState<string>("");
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  
  // Fetch current admin settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: getQueryFn(),
  });
  
  // Create form instance
  const form = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: {
      notificationEmail: '',
      supportEmail: '',
      supportPhone: '',
      customEmailTemplates: false,
    }
  });
  
  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        notificationEmail: settings.notificationEmail || '',
        supportEmail: settings.supportEmail || '',
        supportPhone: settings.supportPhone || '',
        customEmailTemplates: settings.customEmailTemplates || false,
      });
    }
  }, [settings, form]);
  
  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AdminSettingsFormValues) => {
      const response = await apiRequest('PUT', '/api/admin/settings', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/admin/settings'], data);
      toast({
        title: "Settings Updated",
        description: "Admin settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: AdminSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <div className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            <CardTitle>Admin Settings</CardTitle>
          </div>
          <CardDescription>Configure platform-wide settings and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>Configure platform-wide settings and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            Failed to load settings. Please try again.
          </div>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] })}
            className="mt-2 mx-auto block"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          <CardTitle>Admin Settings</CardTitle>
        </div>
        <CardDescription>Configure platform-wide settings and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                <p className="text-sm text-gray-500 mb-4">Configure emails for system notifications</p>
                
                <FormField
                  control={form.control}
                  name="notificationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Email</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-500" />
                          <Input placeholder="admin@adtrack.online" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Receive notifications about new user sign-ups and system alerts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">Support Contact Information</h3>
                <p className="text-sm text-gray-500 mb-4">These details will be displayed to users who need help</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            <Input placeholder="support@adtrack.online" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supportPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Phone</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            <Input placeholder="(555) 123-4567" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Email Template Settings</h3>
                <p className="text-sm text-gray-500 mb-4">Customize system email templates</p>
                
                <FormField
                  control={form.control}
                  name="customEmailTemplates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Custom Email Templates</FormLabel>
                        <FormDescription>
                          Use customized templates for system emails
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
              
              {/* Show email template editor when custom templates are enabled */}
              {form.watch("customEmailTemplates") && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Email Templates</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Create the verification success email HTML
                        const businessName = "Your Business";
                        const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
                          <div style="background-color: #4A6CF7; padding: 20px; text-align: center; color: white;">
                            <h1>Email Successfully Verified!</h1>
                          </div>
                          
                          <div style="padding: 20px; background-color: #f9f9f9;">
                            <h2>Thank you for verifying your email, ${businessName}!</h2>
                            <p>Your application for AdTrack is now <span style="color: #4A6CF7; font-weight: bold;">under review</span>. We're excited that you're interested in our AI-powered marketing analytics platform!</p>
                            
                            <div style="width: 100%; background-color: #f3f3f3; height: 20px; border-radius: 10px; margin: 20px 0;">
                              <div style="height: 20px; background-color: #4A6CF7; border-radius: 10px; text-align: center; color: white; width: 66%;">Step 2 of 3</div>
                            </div>
                            
                            <h3>What Happens Next?</h3>
                            <ol>
                              <li><strong>Application Review:</strong> We're carefully managing platform access to ensure optimal performance and resource allocation.</li>
                              <li><strong>Verification Call:</strong> Our team will conduct a brief verification call to confirm your information and introduce you to AdTrack's early-stage AI features.</li>
                              <li><strong>Special Discount:</strong> As an early adopter, you'll receive a special discount code during your verification call.</li>
                            </ol>
                            
                            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
                              <h3>Is Your Contact Information Correct?</h3>
                              <p><strong>Phone:</strong> Not provided</p>
                              <p><strong>Email:</strong> user@example.com</p>
                              <p>If this information is incorrect, please reply to this email with your updated contact details.</p>
                            </div>
                            
                            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
                              <h3>Why Las Vegas?</h3>
                              <p>We're initially launching in the Las Vegas, NV area (within a 50-mile radius) to ensure we can provide exceptional service and gather valuable feedback. This focused approach helps us refine our proprietary LLM technology.</p>
                            </div>
                            
                            <div style="margin-top: 20px;">
                              <p>Local businesses like yours are already seeing promising results with AdTrack. We're building the industry's first LLM specifically designed to track ROI and optimize advertising budgets for maximum returns.</p>
                              <p>Thank you for your patience as we review your application. We look forward to speaking with you soon!</p>
                            </div>
                          </div>
                          
                          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
                            <p>&copy; 2025 AdTrack. All rights reserved.</p>
                          </div>
                        </div>
                        `;
                        
                        setEmailPreview(emailHtml);
                        setShowEmailPreview(true);
                        
                        toast({
                          title: "Verification Email Preview",
                          description: "Viewing the email sent after email verification",
                        });
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Preview Verification Success Email
                    </Button>
                  </div>
                  
                  <EmailTemplates />
                </div>
              )}
              
              {/* Email Preview Dialog */}
              <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Verification Success Email Preview</DialogTitle>
                    <DialogDescription>
                      This email is sent automatically when a user verifies their email address
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4 border rounded-md p-2">
                    <div dangerouslySetInnerHTML={{ __html: emailPreview }} />
                  </div>
                  
                  <DialogFooter className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Email sent from: notifications@adtrack.online
                    </div>
                    <DialogClose asChild>
                      <Button variant="outline">Close Preview</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <CardFooter className="px-0 pb-0 pt-4">
              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Settings"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Helper function for data fetching
function getQueryFn() {
  return async () => {
    const response = await fetch('/api/admin/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch admin settings');
    }
    return response.json();
  };
}