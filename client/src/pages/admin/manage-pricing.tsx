import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AdminProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, BarChart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { PricingConfig } from '@shared/schema';

// Form schema for pricing configuration
const pricingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  features: z.string().min(1, "Features are required"),
  price: z.string().min(1, "Price is required"), // Using string to match server expectations
  discountedPrice: z.string().optional(), // Using string to match server expectations
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

function ManagePricingContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingConfig | null>(null);
  
  // Function to navigate back to admin pricing tab
  const handleBackToAdmin = () => {
    setLocation('/admin?tab=pricing');
  };

  // Query to fetch pricing configurations
  const { data: pricingConfigs = [], isLoading } = useQuery({
    queryKey: ['/api/pricing-config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pricing-config');
      return await response.json();
    }
  });

  // Form setup
  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      name: '',
      description: '',
      features: '',
      price: '',
      discountedPrice: '',
      isActive: true,
      sortOrder: 0
    }
  });

  // Reset form when editing pricing or closing dialog
  useEffect(() => {
    if (editingPricing) {
      form.reset({
        name: editingPricing.name,
        description: editingPricing.description,
        features: editingPricing.features,
        price: String(editingPricing.price),
        discountedPrice: editingPricing.discountedPrice ? String(editingPricing.discountedPrice) : '',
        isActive: Boolean(editingPricing.isActive),
        sortOrder: editingPricing.sortOrder ? Number(editingPricing.sortOrder) : 0
      });
    } else {
      form.reset({
        name: '',
        description: '',
        features: '',
        price: '',
        discountedPrice: '',
        isActive: true,
        sortOrder: 0
      });
    }
  }, [editingPricing, form]);

  // Mutation to create a new pricing configuration
  const createPricingMutation = useMutation({
    mutationFn: async (data: PricingFormValues) => {
      // Make a copy of the data to preserve the original form values
      const formData = { ...data };
      
      // Ensure price and discountedPrice are sent as strings
      formData.price = String(formData.price).trim();
      if (formData.discountedPrice) {
        formData.discountedPrice = String(formData.discountedPrice).trim();
      }
      
      const response = await apiRequest('POST', '/api/pricing-config', formData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-config'] });
      toast({
        title: 'Success',
        description: 'Pricing configuration created successfully',
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create pricing configuration: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation to update an existing pricing configuration
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PricingFormValues }) => {
      // Make a copy of the data to preserve the original form values
      const formData = { ...data };
      
      // Ensure price and discountedPrice are sent as strings
      formData.price = String(formData.price).trim();
      if (formData.discountedPrice) {
        formData.discountedPrice = String(formData.discountedPrice).trim();
      }
      
      const response = await apiRequest('PUT', `/api/pricing-config/${id}`, formData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-config'] });
      toast({
        title: 'Success',
        description: 'Pricing configuration updated successfully',
      });
      setIsDialogOpen(false);
      setEditingPricing(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update pricing configuration: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation to delete a pricing configuration (soft delete by marking as inactive)
  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/pricing-config/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-config'] });
      toast({
        title: 'Success',
        description: 'Pricing configuration deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete pricing configuration: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: PricingFormValues) => {
    if (editingPricing) {
      updatePricingMutation.mutate({ id: editingPricing.id, data: values });
    } else {
      createPricingMutation.mutate(values);
    }
  };

  // Open dialog for creating a new pricing configuration
  const handleAddNew = () => {
    setEditingPricing(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing pricing configuration
  const handleEdit = (pricing: PricingConfig) => {
    setEditingPricing(pricing);
    setIsDialogOpen(true);
  };

  // Delete a pricing configuration
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this pricing configuration?')) {
      deletePricingMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4" 
            onClick={handleBackToAdmin}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          <span className="text-sm text-muted-foreground">Admin / Pricing</span>
        </div>
      
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Pricing</h1>
            <p className="text-muted-foreground">Create and manage pricing configurations for the platform.</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Pricing
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingConfigs.map((pricing: PricingConfig) => (
            <Card key={pricing.id} className={pricing.isActive ? "border-primary/20" : "border-muted bg-muted/20"}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pricing.name}</CardTitle>
                    <CardDescription>
                      {pricing.isActive ? "Active" : "Inactive"} • Sort Order: {pricing.sortOrder || 0}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(pricing)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(pricing.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Description:</p>
                  <p>{pricing.description}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {pricing.features.split('\n').map((feature, index) => (
                      <li key={index} className="text-sm">{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Price:</p>
                  <p className="text-lg font-semibold">${pricing.price}</p>
                  {pricing.discountedPrice && pricing.discountedPrice !== '' && (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-muted-foreground">Discounted:</p>
                      <p className="text-sm font-semibold text-green-600">${pricing.discountedPrice}</p>
                      <p className="text-xs text-muted-foreground line-through">${pricing.price}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPricing ? 'Edit Pricing Configuration' : 'Create New Pricing Configuration'}</DialogTitle>
            <DialogDescription>
              {editingPricing ? 'Update the details of this pricing configuration.' : 'Add a new pricing option to the platform.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Basic Plan" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a short description of this pricing plan" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter features, one per line" 
                        rows={4}
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="e.g. 49.99"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discounted Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          inputMode="decimal"
                          placeholder="Optional"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPricingMutation.isPending || updatePricingMutation.isPending}
                >
                  {(createPricingMutation.isPending || updatePricingMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPricing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManagePricing() {
  return (
    <AdminProtectedRoute path="/admin/manage-pricing" component={ManagePricingContent} />
  );
}