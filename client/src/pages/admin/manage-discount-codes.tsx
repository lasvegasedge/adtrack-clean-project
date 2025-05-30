import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
// Removed AdminProtectedRoute import as it's not needed here - protection is handled in App.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Tag, Percent, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define the DiscountCode type
interface DiscountCode {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  planType: 'basic' | 'professional' | 'premium' | 'all';
  createdAt: string;
  description: string | null;
}

// Form schema for discount code
const discountCodeFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().min(0, "Discount value must be 0 or higher"),
  maxUses: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isActive: z.boolean().default(true),
  planType: z.enum(['basic', 'professional', 'premium', 'all']).default('all'),
  description: z.string().nullable()
});

type DiscountFormValues = z.infer<typeof discountCodeFormSchema>;

function ManageDiscountCodesContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
  
  // Function to navigate back to admin pricing tab
  const handleBackToAdmin = () => {
    setLocation('/admin?tab=pricing');
  };

  // Query to fetch discount codes
  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ['/api/discount-codes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/discount-codes');
      return await response.json();
    }
  });

  // Form setup
  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountCodeFormSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUses: null,
      startDate: null,
      endDate: null,
      isActive: true,
      planType: 'all',
      description: ''
    }
  });

  // Reset form when editing discount code or closing dialog
  useEffect(() => {
    if (editingDiscountCode) {
      form.reset({
        code: editingDiscountCode.code,
        discountType: editingDiscountCode.discountType,
        discountValue: editingDiscountCode.discountValue,
        maxUses: editingDiscountCode.maxUses,
        startDate: editingDiscountCode.startDate,
        endDate: editingDiscountCode.endDate,
        isActive: editingDiscountCode.isActive,
        planType: editingDiscountCode.planType,
        description: editingDiscountCode.description
      });
    } else {
      form.reset({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        maxUses: null,
        startDate: null,
        endDate: null,
        isActive: true,
        planType: 'all',
        description: ''
      });
    }
  }, [editingDiscountCode, form]);

  // Mutation to create a new discount code
  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data: DiscountFormValues) => {
      const response = await apiRequest('POST', '/api/discount-codes', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code created successfully',
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create discount code: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation to update an existing discount code
  const updateDiscountCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DiscountFormValues }) => {
      const response = await apiRequest('PUT', `/api/discount-codes/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code updated successfully',
      });
      setIsDialogOpen(false);
      setEditingDiscountCode(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update discount code: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation to delete a discount code
  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/discount-codes/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete discount code: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: DiscountFormValues) => {
    if (editingDiscountCode) {
      updateDiscountCodeMutation.mutate({ id: editingDiscountCode.id, data: values });
    } else {
      createDiscountCodeMutation.mutate(values);
    }
  };

  // Open dialog for creating a new discount code
  const handleAddNew = () => {
    setEditingDiscountCode(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing discount code
  const handleEdit = (discountCode: DiscountCode) => {
    setEditingDiscountCode(discountCode);
    setIsDialogOpen(true);
  };

  // Delete a discount code
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      deleteDiscountCodeMutation.mutate(id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  // Get badge color based on discount type and value
  const getDiscountBadgeColor = (type: string, value: number) => {
    if (type === 'percentage') {
      if (value >= 75) return 'bg-green-500';
      if (value >= 50) return 'bg-emerald-500';
      if (value >= 25) return 'bg-blue-500';
      return 'bg-slate-500';
    }
    return 'bg-purple-500';
  };

  // Get plan type display name
  const getPlanTypeDisplay = (planType: string) => {
    switch (planType) {
      case 'basic': return 'Basic Plan';
      case 'professional': return 'Professional Plan';
      case 'premium': return 'Premium Plan';
      case 'all': return 'All Plans';
      default: return planType;
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
          <Tag className="h-5 w-5 mr-2 text-primary" />
          <span className="text-sm text-muted-foreground">Admin / Pricing / Discount Codes</span>
        </div>
      
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Discount Codes</h1>
            <p className="text-muted-foreground">Create and manage discount codes for subscription plans.</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Discount Code
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-4 font-medium">Code</th>
                      <th className="text-left p-4 font-medium">Discount</th>
                      <th className="text-left p-4 font-medium">Plan Type</th>
                      <th className="text-left p-4 font-medium">Usage</th>
                      <th className="text-left p-4 font-medium">Validity</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((discount: DiscountCode) => (
                      <tr key={discount.id} className="border-t border-gray-200">
                        <td className="p-4 align-middle">
                          <div className="font-medium">{discount.code}</div>
                          {discount.description && (
                            <div className="text-xs text-muted-foreground mt-1">{discount.description}</div>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge className={getDiscountBadgeColor(discount.discountType, discount.discountValue)}>
                            {discount.discountType === 'percentage' ? (
                              <span>{discount.discountValue}% off</span>
                            ) : (
                              <span>${discount.discountValue} off</span>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          {getPlanTypeDisplay(discount.planType)}
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <span className="font-medium">{discount.usedCount}</span>
                            {discount.maxUses && (
                              <span className="text-muted-foreground"> / {discount.maxUses}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {discount.startDate && (
                            <div className="text-sm">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {formatDate(discount.startDate)}
                            </div>
                          )}
                          {discount.endDate && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Expires: </span>
                              {formatDate(discount.endDate)}
                            </div>
                          )}
                          {!discount.startDate && !discount.endDate && (
                            <span className="text-sm text-muted-foreground">No time limit</span>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={discount.isActive ? "default" : "outline"}>
                            {discount.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(discount)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(discount.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {discountCodes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          No discount codes found. Create your first discount code.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingDiscountCode ? 'Edit Discount Code' : 'Create New Discount Code'}</DialogTitle>
            <DialogDescription>
              {editingDiscountCode ? 'Update the details of this discount code.' : 'Add a new discount code for subscription plans.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WELCOME25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('discountType') === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step={form.watch('discountType') === 'percentage' ? '1' : '0.01'} 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable Plan</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select applicable plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="basic">Basic Plan Only</SelectItem>
                        <SelectItem value="professional">Professional Plan Only</SelectItem>
                        <SelectItem value="premium">Premium Plan Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Uses (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Leave empty for unlimited uses" 
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
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
                      <FormLabel>Start Date (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
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
                      <FormLabel>End Date (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description for this discount code" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
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
                  disabled={createDiscountCodeMutation.isPending || updateDiscountCodeMutation.isPending}
                >
                  {(createDiscountCodeMutation.isPending || updateDiscountCodeMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDiscountCode ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManageDiscountCodes() {
  return <ManageDiscountCodesContent />;
}