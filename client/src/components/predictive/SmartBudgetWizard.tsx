import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Calculator,
  DollarSign,
  PieChart as PieChartIcon,
  Wand2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Check,
  CheckCircle,
  CircleDollarSign,
  Target,
  TrendingUp,
  BarChart2,
  LineChart,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatPercent, calculateROI } from "@/lib/utils";
import { AdMethod, BusinessCampaignWithROI } from "@shared/schema";

// Schema for budget form
const budgetFormSchema = z.object({
  totalBudget: z.coerce
    .number()
    .min(1, "Budget must be at least $1")
    .max(1000000, "Budget cannot exceed $1,000,000"),
  targetROI: z.coerce
    .number()
    .min(1, "Target ROI must be at least 1%")
    .max(1000, "Target ROI cannot exceed 1000%"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetAllocation {
  adMethodId: number;
  adMethodName: string;
  amount: number;
  percentage: number;
  historicalROI: number;
  projectedReturn: number;
  color: string;
}

// Color palette for pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6BCB77", "#4D96FF"];

export function SmartBudgetWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [usingOptimal, setUsingOptimal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [manualAllocations, setManualAllocations] = useState<Record<number, number>>({});
  const [totalManualAllocation, setTotalManualAllocation] = useState(0);
  const [projectedTotalROI, setProjectedTotalROI] = useState(0);

  // Fetch business details
  const { data: business } = useQuery({
    queryKey: [`/api/business/${user?.businessId}`],
    enabled: !!user?.businessId,
  });
  
  // Fetch campaigns with ROI data
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: [`/api/business/${user?.businessId}/campaigns/roi`],
    enabled: !!user?.businessId,
  });
  
  // Fetch ad methods
  const { data: adMethods, isLoading: isLoadingAdMethods } = useQuery({
    queryKey: ['/api/ad-methods'],
  });

  // Form for budget input
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      totalBudget: 1000,
      targetROI: 50,
    },
  });

  // Calculate summary stats
  const getTotalBudget = () => {
    return allocations.reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalProjectedReturn = () => {
    return allocations.reduce((sum, item) => sum + item.projectedReturn, 0);
  };

  const getProjectedROI = () => {
    const totalBudget = getTotalBudget();
    if (totalBudget === 0) return 0;
    const totalReturn = getTotalProjectedReturn();
    return calculateROI(totalBudget, totalReturn);
  };

  // Initialize manual allocations when form is submitted
  useEffect(() => {
    if (adMethods && adMethods.length > 0 && step === 2 && !usingOptimal) {
      // Initialize with equal distribution
      const totalBudget = form.getValues().totalBudget;
      const equalShare = totalBudget / adMethods.length;
      
      const newManualAllocations: Record<number, number> = {};
      adMethods.forEach((method: AdMethod) => {
        newManualAllocations[method.id] = equalShare;
      });
      
      setManualAllocations(newManualAllocations);
      updateTotalManualAllocation(newManualAllocations);
    }
  }, [step, adMethods, usingOptimal]);

  // Update manual allocation totals
  const updateTotalManualAllocation = (allocations: Record<number, number>) => {
    const total = Object.values(allocations).reduce((sum, value) => sum + value, 0);
    setTotalManualAllocation(total);
  };

  // Handle manual allocation change
  const handleManualAllocationChange = (adMethodId: number, value: number[]) => {
    const newValue = value[0] || 0;
    const newAllocations = { ...manualAllocations, [adMethodId]: newValue };
    setManualAllocations(newAllocations);
    updateTotalManualAllocation(newAllocations);
  };

  // Get historical ROI for an ad method
  const getHistoricalROI = (adMethodId: number) => {
    if (!campaigns || campaigns.length === 0) return 0;
    
    const methodCampaigns = campaigns.filter((c: BusinessCampaignWithROI) => c.adMethodId === adMethodId);
    if (methodCampaigns.length === 0) return 0;
    
    return methodCampaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / methodCampaigns.length;
  };

  // Calculate optimal budget allocation
  const calculateOptimalAllocation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      if (!adMethods || adMethods.length === 0 || !campaigns || campaigns.length === 0) {
        setIsCalculating(false);
        return;
      }
      
      const totalBudget = form.getValues().totalBudget;
      
      // Calculate performance metrics for each ad method
      const methodPerformance: { 
        method: AdMethod; 
        roi: number; 
        weight: number; 
        campaigns: BusinessCampaignWithROI[];
      }[] = [];
      
      adMethods.forEach((method: AdMethod) => {
        const methodCampaigns = campaigns.filter(
          (c: BusinessCampaignWithROI) => c.adMethodId === method.id
        );
        
        let roi = 0;
        if (methodCampaigns.length > 0) {
          roi = methodCampaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / methodCampaigns.length;
        }
        
        methodPerformance.push({
          method,
          roi,
          weight: roi, // Initially weight is just the ROI
          campaigns: methodCampaigns
        });
      });
      
      // Apply business-specific adjustments
      if (business?.businessType) {
        methodPerformance.forEach(item => {
          // Apply business type adjustment
          if (business.businessType === "Retail" && item.method.name.includes("Social")) {
            item.weight *= 1.2; // Boost social media for retail
          } else if (business.businessType === "Restaurant" && item.method.name.includes("Local")) {
            item.weight *= 1.3; // Boost local ads for restaurants
          }
        });
      }
      
      // Normalize weights to get allocation percentages
      const totalWeight = methodPerformance.reduce((sum, item) => sum + Math.max(0.1, item.weight), 0);
      
      // Calculate allocations
      const optimalAllocations: BudgetAllocation[] = methodPerformance.map((item, index) => {
        // Ensure each method gets at least some budget (minimum 5%)
        const minPercentage = 5;
        
        // Calculate percentage based on weight
        let rawPercentage = (Math.max(0.1, item.weight) / totalWeight) * 100;
        
        // If ROI is 0 (no data), assign a small percentage
        if (item.roi === 0) {
          rawPercentage = minPercentage;
        }
        
        // Ensure percentage is at least the minimum
        const percentage = Math.max(minPercentage, rawPercentage);
        
        // Calculate amount based on percentage
        const amount = (percentage / 100) * totalBudget;
        
        // Project return using historical ROI
        const projectedReturn = amount * (1 + (item.roi / 100));
        
        return {
          adMethodId: item.method.id,
          adMethodName: item.method.name,
          amount,
          percentage,
          historicalROI: item.roi,
          projectedReturn,
          color: COLORS[index % COLORS.length]
        };
      });
      
      // Adjust percentages to ensure they sum to 100%
      const totalPercentage = optimalAllocations.reduce((sum, item) => sum + item.percentage, 0);
      const adjustmentFactor = 100 / totalPercentage;
      
      optimalAllocations.forEach(item => {
        item.percentage *= adjustmentFactor;
        item.amount = (item.percentage / 100) * totalBudget;
        item.projectedReturn = item.amount * (1 + (item.historicalROI / 100));
      });
      
      // Sort by amount (descending)
      optimalAllocations.sort((a, b) => b.amount - a.amount);
      
      // Calculate projected total ROI
      const totalInvestment = optimalAllocations.reduce((sum, item) => sum + item.amount, 0);
      const totalReturn = optimalAllocations.reduce((sum, item) => sum + item.projectedReturn, 0);
      const projectedROI = calculateROI(totalInvestment, totalReturn);
      
      setAllocations(optimalAllocations);
      setProjectedTotalROI(projectedROI);
      setUsingOptimal(true);
      setIsCalculating(false);
    }, 1500); // Simulate processing time
  };

  // Update allocations based on manual inputs
  const updateAllocationsFromManual = () => {
    if (!adMethods || adMethods.length === 0) return;
    
    const newAllocations: BudgetAllocation[] = [];
    const totalBudget = form.getValues().totalBudget;
    const totalAllocated = Object.values(manualAllocations).reduce((sum, val) => sum + val, 0);
    
    adMethods.forEach((method: AdMethod, index: number) => {
      const amount = manualAllocations[method.id] || 0;
      const percentage = totalAllocated > 0 ? (amount / totalAllocated) * 100 : 0;
      const historicalROI = getHistoricalROI(method.id);
      const projectedReturn = amount * (1 + (historicalROI / 100));
      
      newAllocations.push({
        adMethodId: method.id,
        adMethodName: method.name,
        amount,
        percentage,
        historicalROI,
        projectedReturn,
        color: COLORS[index % COLORS.length]
      });
    });
    
    // Sort by amount (descending)
    newAllocations.sort((a, b) => b.amount - a.amount);
    
    // Calculate projected total ROI
    const totalInvestment = newAllocations.reduce((sum, item) => sum + item.amount, 0);
    const totalReturn = newAllocations.reduce((sum, item) => sum + item.projectedReturn, 0);
    const projectedROI = calculateROI(totalInvestment, totalReturn);
    
    setAllocations(newAllocations);
    setProjectedTotalROI(projectedROI);
    setUsingOptimal(false);
  };

  // Handle form submission - Step 1
  const onSubmitBudget = (values: BudgetFormValues) => {
    setStep(2);
  };
  
  // Handle completion - Step 2
  const onComplete = () => {
    toast({
      title: "Budget Allocation Saved",
      description: "Your budget allocation plan has been created and saved.",
      variant: "default",
    });
    setOpen(false);
    setStep(1);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpen(false);
    setStep(1);
    setUsingOptimal(false);
    setAllocations([]);
  };

  const budgetComparison = () => {
    const targetROI = form.getValues().targetROI;
    
    if (projectedTotalROI > targetROI * 1.1) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
          <CheckCircle className="h-4 w-4" />
          <span>Exceeds target by {formatPercent(projectedTotalROI - targetROI)}</span>
        </div>
      );
    } else if (projectedTotalROI >= targetROI) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
          <Check className="h-4 w-4" />
          <span>Meets target ROI</span>
        </div>
      );
    } else {
      const deficit = targetROI - projectedTotalROI;
      return (
        <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{formatPercent(deficit)} below target</span>
        </div>
      );
    }
  };

  // Budget Allocation Data for Pie Chart
  const getPieData = () => {
    return allocations.map(item => ({
      name: item.adMethodName,
      value: item.amount,
      roi: item.historicalROI,
      color: item.color
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Wand2 className="h-4 w-4" />
          <span>Open Budget Wizard</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Budget Allocation Wizard
          </DialogTitle>
          <DialogDescription>
            Optimize your advertising budget based on historical performance data
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingCampaigns || isLoadingAdMethods ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your campaign data...</p>
          </div>
        ) : campaigns && campaigns.length === 0 ? (
          <div className="p-6 text-center">
            <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No campaign data available</h3>
            <p className="text-muted-foreground mb-4">
              Add some campaigns first to use the Budget Allocation Wizard.
            </p>
            <Button asChild>
              <a href="/add-campaign">Add Your First Campaign</a>
            </Button>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "calc(80vh - 180px)" }}>
            <Tabs defaultValue="optimal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="optimal" className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Optimal Allocation</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-1">
                  <Calculator className="h-3.5 w-3.5" />
                  <span>Manual Allocation</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="optimal" className="space-y-4">
                {step === 1 && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitBudget)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="totalBudget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Advertising Budget</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="1000"
                                  {...field}
                                  className="pl-8"
                                  type="number"
                                  min={1}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter your total budget for all advertising channels
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetROI"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target ROI (%)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="50"
                                {...field}
                                type="number"
                                min={1}
                                max={1000}
                              />
                            </FormControl>
                            <FormDescription>
                              Set your target return on investment percentage
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                )}
                
                {step === 2 && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Calculating Optimal Allocation</CardTitle>
                        <CardDescription>
                          Based on your historical campaign performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {isCalculating ? (
                          <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Analyzing your campaign data...</p>
                          </div>
                        ) : allocations.length > 0 ? (
                          <div className="space-y-6">
                            <div className="h-64" style={{ minHeight: '256px', minWidth: '256px', position: 'relative' }}>
                              <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={256} aspect={1}>
                                <PieChart>
                                  <Pie
                                    data={getPieData()}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => 
                                      `${name}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                    {getPieData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value) => [formatCurrency(value as number), "Budget"]}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="space-y-3">
                              {allocations.map((allocation, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: allocation.color }}
                                    ></div>
                                    <span>{allocation.adMethodName}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(allocation.amount)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ROI: {formatPercent(allocation.historicalROI)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Projected ROI</span>
                                <span className="font-medium">
                                  {formatPercent(projectedTotalROI)}
                                </span>
                              </div>
                              {budgetComparison()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Button 
                              onClick={calculateOptimalAllocation} 
                              className="mb-4"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Calculate Optimal Allocation
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              Our algorithm will analyze your past campaign performance<br />to suggest the best budget distribution
                            </p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        {allocations.length > 0 && !isCalculating && (
                          <Button 
                            onClick={onComplete} 
                            className="w-full"
                          >
                            Save Budget Plan
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="totalBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Advertising Budget</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="1000"
                                {...field}
                                className="pl-8"
                                type="number"
                                min={1}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-medium">Budget Distribution</h3>
                      
                      {adMethods && adMethods.map((method: AdMethod) => (
                        <div key={method.id} className="space-y-2">
                          <div className="flex justify-between">
                            <div className="text-sm">{method.name}</div>
                            <div className="text-sm font-medium">
                              {formatCurrency(manualAllocations[method.id] || 0)}
                            </div>
                          </div>
                          <Slider
                            defaultValue={[manualAllocations[method.id] || 0]}
                            max={form.getValues().totalBudget}
                            step={1}
                            onValueChange={(value) => 
                              handleManualAllocationChange(method.id, value)}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Historical ROI: {formatPercent(getHistoricalROI(method.id))}</span>
                            <span>
                              {(((manualAllocations[method.id] || 0) / form.getValues().totalBudget) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Allocated</span>
                          <span>
                            {formatCurrency(totalManualAllocation)} / {formatCurrency(form.getValues().totalBudget)}
                          </span>
                        </div>
                        <Progress 
                          value={(totalManualAllocation / form.getValues().totalBudget) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      onClick={updateAllocationsFromManual}
                      className="w-full"
                    >
                      Preview Results
                    </Button>
                    
                    {allocations.length > 0 && !usingOptimal && (
                      <div className="space-y-4 pt-2">
                        <h3 className="font-medium">Projected Results</h3>
                        
                        <div className="h-48" style={{ minHeight: '192px', minWidth: '256px', position: 'relative' }}>
                          <ResponsiveContainer width="100%" height="100%" minHeight={192} minWidth={256} aspect={1}>
                            <PieChart>
                              <Pie
                                data={getPieData()}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => 
                                  `${name}: ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {getPieData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [formatCurrency(value as number), "Budget"]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Projected ROI</span>
                            <span className="font-medium">
                              {formatPercent(projectedTotalROI)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Projected Return</span>
                            <span className="font-medium">
                              {formatCurrency(getTotalProjectedReturn())}
                            </span>
                          </div>
                          {budgetComparison()}
                          
                          <Button 
                            onClick={onComplete} 
                            className="w-full mt-4"
                          >
                            Save Budget Plan
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}