import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Calculator, Printer, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";

type FormValues = {
  marketingBudget: number;
  socialMediaPercentage: number;
  emailPercentage: number;
  searchEnginePercentage: number;
  printPercentage: number;
  otherPercentage: number;
  currentRoi: number;
};

export default function ROICalculator() {
  const [location, navigate] = useLocation();
  const [results, setResults] = useState<{
    currentRevenue: number;
    conservative: {
      roi: number;
      revenue: number;
      additional: number;
      annual: number;
      roiOnInvestment: number;
    };
    average: {
      roi: number;
      revenue: number;
      additional: number;
      annual: number;
      roiOnInvestment: number;
    };
    optimized: {
      roi: number;
      revenue: number;
      additional: number;
      annual: number;
      roiOnInvestment: number;
    };
    timeSavings: number;
    totalBenefit: number;
    netBenefit: number;
  } | null>(null);

  const [percentageTotal, setPercentageTotal] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [hourlyCost, setHourlyCost] = useState(50);

  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      marketingBudget: 5000,
      socialMediaPercentage: 35,
      emailPercentage: 20,
      searchEnginePercentage: 25,
      printPercentage: 10,
      otherPercentage: 10,
      currentRoi: 150,
    },
  });

  const watchAllFields = form.watch();

  useEffect(() => {
    const total = 
      Number(watchAllFields.socialMediaPercentage || 0) +
      Number(watchAllFields.emailPercentage || 0) +
      Number(watchAllFields.searchEnginePercentage || 0) +
      Number(watchAllFields.printPercentage || 0) +
      Number(watchAllFields.otherPercentage || 0);
    
    setPercentageTotal(total);
  }, [watchAllFields]);

  // Fix scroll issue - ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const calculateResults = (data: FormValues) => {
    // Validate that percentages add up to 100
    if (percentageTotal !== 100) {
      toast({
        title: "Channel percentages must add up to 100%",
        description: `Current total: ${percentageTotal}%`,
        variant: "destructive",
      });
      return;
    }

    const currentRevenue = 
      data.marketingBudget * (1 + data.currentRoi / 100);
    
    // AdTrack subscription costs
    const subscriptionCosts = {
      basic: 49 * 12, // Annual cost
      professional: 99 * 12,
      premium: 199 * 12
    };
    
    // Calculate improvement scenarios
    const conservative = {
      roi: data.currentRoi * 1.15, // 15% improvement
      revenue: data.marketingBudget * (1 + data.currentRoi * 1.15 / 100),
      additional: 0,
      annual: 0,
      roiOnInvestment: 0
    };
    conservative.additional = conservative.revenue - currentRevenue;
    conservative.annual = conservative.additional * 12;
    conservative.roiOnInvestment = 
      (conservative.annual / subscriptionCosts[selectedPlan as keyof typeof subscriptionCosts]) * 100;

    const average = {
      roi: data.currentRoi * 1.27, // 27% improvement
      revenue: data.marketingBudget * (1 + data.currentRoi * 1.27 / 100),
      additional: 0,
      annual: 0,
      roiOnInvestment: 0
    };
    average.additional = average.revenue - currentRevenue;
    average.annual = average.additional * 12;
    average.roiOnInvestment = 
      (average.annual / subscriptionCosts[selectedPlan as keyof typeof subscriptionCosts]) * 100;

    const optimized = {
      roi: data.currentRoi * 1.40, // 40% improvement
      revenue: data.marketingBudget * (1 + data.currentRoi * 1.40 / 100),
      additional: 0,
      annual: 0,
      roiOnInvestment: 0
    };
    optimized.additional = optimized.revenue - currentRevenue;
    optimized.annual = optimized.additional * 12;
    optimized.roiOnInvestment = 
      (optimized.annual / subscriptionCosts[selectedPlan as keyof typeof subscriptionCosts]) * 100;

    // Calculate time savings (5 hours per week at hourly cost)
    const timeSavings = 5 * 52 * hourlyCost;
    
    // Total and net benefits
    const totalBenefit = average.annual + timeSavings;
    const netBenefit = totalBenefit - subscriptionCosts[selectedPlan as keyof typeof subscriptionCosts];

    setResults({
      currentRevenue,
      conservative,
      average,
      optimized,
      timeSavings,
      totalBenefit,
      netBenefit
    });
  };

  const printResults = () => {
    window.print();
  };

  const goBackToMinisite = () => {
    // Use client-side navigation
    navigate('/');
    // Manually scroll to top after navigation
    window.scrollTo(0, 0);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 print:py-2">
        <div className="space-y-6 print:space-y-2">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={goBackToMinisite}
              className="print:hidden"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              AdTrack Home
            </Button>
          </div>
          
          <div className="text-center mb-8 print:mb-2">
            <h1 className="text-4xl font-bold tracking-tight print:text-2xl">AdTrack ROI Calculator</h1>
            <p className="text-lg text-muted-foreground mt-2 print:text-sm">
              Estimate your potential marketing improvements with AdTrack
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 print:gap-4 print:grid-cols-1">
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Your Current Marketing
                </CardTitle>
                <CardDescription>
                  Enter your current marketing budget and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(calculateResults)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="marketingBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Marketing Budget ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="500"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="font-medium">Channel Allocation (%)</h3>
                      <div className={`text-sm mb-2 ${percentageTotal !== 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Total: {percentageTotal}% {percentageTotal !== 100 ? '(must equal 100%)' : ''}
                      </div>

                      <FormField
                        control={form.control}
                        name="socialMediaPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Social Media Ads</FormLabel>
                              <span className="text-sm">
                                {field.value}% = ${(watchAllFields.marketingBudget * field.value / 100).toFixed(0)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emailPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Email Marketing</FormLabel>
                              <span className="text-sm">
                                {field.value}% = ${(watchAllFields.marketingBudget * field.value / 100).toFixed(0)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="searchEnginePercentage"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Search Engine Ads</FormLabel>
                              <span className="text-sm">
                                {field.value}% = ${(watchAllFields.marketingBudget * field.value / 100).toFixed(0)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="printPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Print Advertising</FormLabel>
                              <span className="text-sm">
                                {field.value}% = ${(watchAllFields.marketingBudget * field.value / 100).toFixed(0)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="otherPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Other</FormLabel>
                              <span className="text-sm">
                                {field.value}% = ${(watchAllFields.marketingBudget * field.value / 100).toFixed(0)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="currentRoi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Current ROI (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <h3 className="font-medium">AdTrack Plan</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          type="button" 
                          variant={selectedPlan === "basic" ? "default" : "outline"}
                          onClick={() => setSelectedPlan("basic")}
                          className="w-full"
                        >
                          Basic<br />
                          <span className="text-xs">$49/mo</span>
                        </Button>
                        <Button 
                          type="button" 
                          variant={selectedPlan === "professional" ? "default" : "outline"}
                          onClick={() => setSelectedPlan("professional")}
                          className="w-full"
                        >
                          Professional<br />
                          <span className="text-xs">$99/mo</span>
                        </Button>
                        <Button 
                          type="button" 
                          variant={selectedPlan === "premium" ? "default" : "outline"}
                          onClick={() => setSelectedPlan("premium")}
                          className="w-full"
                        >
                          Premium<br />
                          <span className="text-xs">$199/mo</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Hourly Cost of Marketing Time</h3>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="20"
                          max="500"
                          value={hourlyCost}
                          onChange={(e) => setHourlyCost(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">$/hour</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The estimated hourly cost of time spent on marketing analysis
                      </p>
                    </div>

                    <Button type="submit" className="w-full">
                      Calculate Potential ROI
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {results && (
              <Card className="print:shadow-none">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Your Customized Results</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={printResults}
                      className="print:hidden"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                  <CardDescription>
                    Based on your inputs and AdTrack customer data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Current Monthly Performance</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Marketing Budget</TableCell>
                          <TableCell className="text-right">${watchAllFields.marketingBudget.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Current ROI</TableCell>
                          <TableCell className="text-right">{watchAllFields.currentRoi}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Monthly Revenue from Marketing</TableCell>
                          <TableCell className="text-right">${results.currentRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Potential with AdTrack</h3>
                    <Tabs defaultValue="average">
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="conservative">Conservative</TabsTrigger>
                        <TabsTrigger value="average">Average</TabsTrigger>
                        <TabsTrigger value="optimized">Optimized</TabsTrigger>
                      </TabsList>

                      <TabsContent value="conservative" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Based on a 15% ROI improvement (conservative estimate)
                        </p>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">New Estimated ROI</TableCell>
                              <TableCell className="text-right">{results.conservative.roi.toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">New Monthly Revenue</TableCell>
                              <TableCell className="text-right">${results.conservative.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Additional Monthly Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.conservative.additional.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Annual Additional Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.conservative.annual.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ROI on AdTrack Investment</TableCell>
                              <TableCell className="text-right text-green-600">{results.conservative.roiOnInvestment.toFixed(0)}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>

                      <TabsContent value="average" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Based on a 27% ROI improvement (average result)
                        </p>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">New Estimated ROI</TableCell>
                              <TableCell className="text-right">{results.average.roi.toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">New Monthly Revenue</TableCell>
                              <TableCell className="text-right">${results.average.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Additional Monthly Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.average.additional.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Annual Additional Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.average.annual.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ROI on AdTrack Investment</TableCell>
                              <TableCell className="text-right text-green-600">{results.average.roiOnInvestment.toFixed(0)}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>

                      <TabsContent value="optimized" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Based on a 40% ROI improvement (optimized result)
                        </p>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">New Estimated ROI</TableCell>
                              <TableCell className="text-right">{results.optimized.roi.toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">New Monthly Revenue</TableCell>
                              <TableCell className="text-right">${results.optimized.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Additional Monthly Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.optimized.additional.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Annual Additional Revenue</TableCell>
                              <TableCell className="text-right text-green-600">${results.optimized.annual.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ROI on AdTrack Investment</TableCell>
                              <TableCell className="text-right text-green-600">{results.optimized.roiOnInvestment.toFixed(0)}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Time Savings Value</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Based on 5 hours saved weekly on marketing analysis
                    </p>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Annual Time Value</TableCell>
                          <TableCell className="text-right text-green-600">${results.timeSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Total Annual Benefit</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Additional Revenue (Average Scenario)</TableCell>
                          <TableCell className="text-right">${results.average.annual.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Time Savings Value</TableCell>
                          <TableCell className="text-right">${results.timeSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total Annual Benefit</TableCell>
                          <TableCell className="text-right font-bold">${results.totalBenefit.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Annual AdTrack Subscription</TableCell>
                          <TableCell className="text-right">-${
                            (selectedPlan === "basic" ? 49 * 12 : 
                             selectedPlan === "professional" ? 99 * 12 : 
                             199 * 12).toLocaleString()
                          }</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Net Annual Benefit</TableCell>
                          <TableCell className="text-right font-bold text-green-600">${results.netBenefit.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4">
                    This calculator provides estimates based on average results from existing AdTrack customers. Individual results may vary based on your business type, location, and marketing execution.
                  </p>
                  <Button className="w-full" onClick={goBackToMinisite}>
                    AdTrack Home <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}