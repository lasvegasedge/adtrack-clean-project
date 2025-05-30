import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const businessFormSchema = z.object({
  // Business details
  name: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  businessType: z.string().min(1, {
    message: "Please select a business type.",
  }),
  address: z.string().min(5, {
    message: "Please enter a valid address.",
  }),
  zipCode: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  phone: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  
  // Business owner
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email("Please enter a valid email address").optional(),
  ownerTextOk: z.boolean().default(false),
  
  // Marketing contact
  marketingName: z.string().optional(),
  marketingPhone: z.string().optional(),
  marketingEmail: z.string().email("Please enter a valid email address").optional(),
  marketingTextOk: z.boolean().default(false),
  
  // Billing contact
  billingName: z.string().optional(),
  billingPhone: z.string().optional(),
  billingEmail: z.string().email("Please enter a valid email address").optional(),
  billingTextOk: z.boolean().default(false),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

interface BusinessProfileFormProps {
  business: any;
  onClose: () => void;
}

export function BusinessProfileForm({ business, onClose }: BusinessProfileFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  
  // Fetch business types for the select dropdown
  const { data: businessTypes = [] } = useQuery({
    queryKey: ['/api/business-types'],
  });
  
  // Form setup
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      // Business details
      name: business?.name || "",
      businessType: business?.businessType || "",
      address: business?.address || "",
      zipCode: business?.zipCode || "",
      phone: business?.phone || "",
      latitude: business?.latitude || undefined,
      longitude: business?.longitude || undefined,
      
      // Business owner
      ownerName: business?.ownerName || "",
      ownerPhone: business?.ownerPhone || "",
      ownerEmail: business?.ownerEmail || "",
      ownerTextOk: business?.ownerTextOk || false,
      
      // Marketing contact
      marketingName: business?.marketingName || "",
      marketingPhone: business?.marketingPhone || "",
      marketingEmail: business?.marketingEmail || "",
      marketingTextOk: business?.marketingTextOk || false,
      
      // Billing contact
      billingName: business?.billingName || "",
      billingPhone: business?.billingPhone || "",
      billingEmail: business?.billingEmail || "",
      billingTextOk: business?.billingTextOk || false,
    },
  });

  // Update business mutation
  const updateBusinessMutation = useMutation({
    mutationFn: async (data: BusinessFormValues) => {
      const response = await apiRequest("PUT", `/api/business/${business.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update business profile");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the business data
      queryClient.invalidateQueries({ queryKey: [`/api/business/${business.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/business`] });
      
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  async function onSubmit(data: BusinessFormValues) {
    setIsSubmitting(true);
    updateBusinessMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="owner">Owner</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          {/* BUSINESS DETAILS TAB */}
          <TabsContent value="business" className="space-y-4">
            <h3 className="text-md font-semibold mb-2">Business Details</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-2" />
            <h3 className="text-sm font-medium">Location Coordinates (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" placeholder="40.7128" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" placeholder="-74.0060" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* OWNER CONTACT TAB */}
          <TabsContent value="owner" className="space-y-4">
            <h3 className="text-md font-semibold mb-2">Business Owner Contact Information</h3>
            
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="owner@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ownerTextOk"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Text Message Preference</FormLabel>
                    <FormDescription>
                      Allow text messages to be sent to this phone number
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
          </TabsContent>
          
          {/* MARKETING CONTACT TAB */}
          <TabsContent value="marketing" className="space-y-4">
            <h3 className="text-md font-semibold mb-2">Marketing Contact Information</h3>
            
            <FormField
              control={form.control}
              name="marketingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marketingPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="marketingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="marketing@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="marketingTextOk"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Text Message Preference</FormLabel>
                    <FormDescription>
                      Allow text messages to be sent to this phone number
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
          </TabsContent>
          
          {/* BILLING CONTACT TAB */}
          <TabsContent value="billing" className="space-y-4">
            <h3 className="text-md font-semibold mb-2">Billing Contact Information</h3>
            
            <FormField
              control={form.control}
              name="billingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="billing@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="billingTextOk"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Text Message Preference</FormLabel>
                    <FormDescription>
                      Allow text messages to be sent to this phone number
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}