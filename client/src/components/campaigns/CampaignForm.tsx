import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

// Campaign form schema with validation
const campaignFormSchema = z.object({
  name: z.string().min(1, { message: "Please enter a campaign name" }),
  description: z.string().optional(),
  adMethodId: z.string().min(1, { message: "Please select an ad method" }),
  amountSpent: z.string()
    .min(1, { message: "Please enter amount spent" })
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Amount spent must be a positive number"
    }),
  startDate: z.string().min(1, { message: "Please enter start date" }),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  amountEarned: z.string()
    .optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Amount earned must be a positive number"
    }),
}).refine(data => {
  // Skip validation if end date is not provided
  if (!data.endDate) return true;
  
  // Ensure end date is after start date
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"] // Point the error to the endDate field
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  campaignId?: number;
}

export default function CampaignForm({ campaignId }: CampaignFormProps) {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [calculatedRoi, setCalculatedRoi] = useState<number>(0);
  
  // Fetch ad methods
  const { data: adMethods, isLoading: isLoadingAdMethods } = useQuery({
    queryKey: ['/api/ad-methods'],
  });

  // Fetch campaign data if editing
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  // Set up form with default values
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      adMethodId: "",
      amountSpent: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      isActive: true,
      amountEarned: "",
    }
  });

  // Update form values when campaign data is loaded
  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name || "",
        description: campaign.description || "",
        adMethodId: campaign.adMethodId.toString(),
        amountSpent: campaign.amountSpent ? campaign.amountSpent.toString() : "",
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : "",
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "",
        isActive: campaign.isActive,
        amountEarned: campaign.amountEarned ? campaign.amountEarned.toString() : "",
      });

      // Calculate ROI
      if (campaign.amountSpent && campaign.amountEarned) {
        const spent = parseFloat(campaign.amountSpent.toString());
        const earned = parseFloat(campaign.amountEarned.toString());
        if (spent > 0 && earned > 0) {
          setCalculatedRoi(((earned - spent) / spent) * 100);
        }
      }
    }
  }, [campaign, form]);

  // Calculate ROI whenever amount spent or earned changes
  useEffect(() => {
    const spent = parseFloat(form.watch("amountSpent") || "0");
    const earned = parseFloat(form.watch("amountEarned") || "0");
    
    if (spent > 0 && earned > 0) {
      setCalculatedRoi(((earned - spent) / spent) * 100);
    } else {
      setCalculatedRoi(0);
    }
  }, [form.watch("amountSpent"), form.watch("amountEarned")]);

  // Handle file change
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns/roi`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/stats`] });
      toast({
        title: "Campaign created",
        description: "Your advertisement campaign has been created successfully.",
      });
      setLocation("/campaigns");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("PUT", `/api/campaigns/${campaignId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns/roi`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/stats`] });
      toast({
        title: "Campaign updated",
        description: "Your advertisement campaign has been updated successfully.",
      });
      setLocation("/campaigns");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: CampaignFormValues) => {
    const formData = new FormData();
    
    // Prepare campaign data
    const campaignData = {
      businessId,
      name: values.name,
      description: values.description || null,
      adMethodId: parseInt(values.adMethodId),
      amountSpent: parseFloat(values.amountSpent),
      startDate: new Date(values.startDate),
      endDate: values.endDate ? new Date(values.endDate) : null,
      isActive: values.isActive,
      amountEarned: values.amountEarned ? parseFloat(values.amountEarned) : null,
    };
    
    // Add data to form
    formData.append("data", JSON.stringify(campaignData));
    
    // Add file if present
    if (file) {
      formData.append("file", file);
    }
    
    // Submit form
    if (campaignId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = isLoadingAdMethods || (campaignId && isLoadingCampaign);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Summer Facebook Campaign"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the campaign"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="adMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement Method</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adMethods?.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
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
              name="amountSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Spent ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""}
                        disabled={form.watch("isActive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Upload Advertisement</Label>
              <FileUpload
                accept=".jpg,.jpeg,.png,.pdf"
                onFileChange={handleFileChange}
                defaultPreview={campaign?.fileUrl}
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium mb-4">Campaign Results</h3>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Campaign is still active</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className={form.watch("isActive") ? "opacity-50" : ""}>
                <FormField
                  control={form.control}
                  name="amountEarned"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Amount Earned ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          disabled={form.watch("isActive")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-4">
                  <Label>Calculated ROI</Label>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <span className={`text-lg font-medium ${
                      calculatedRoi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculatedRoi.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ROI = (Amount Earned - Amount Spent) / Amount Spent × 100%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/campaigns")}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isLoading}>
                {isPending ? 'Saving...' : (campaignId ? 'Update Campaign' : 'Save Campaign')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
