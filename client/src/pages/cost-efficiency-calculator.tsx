import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calculator, DollarSign, BarChart as BarChartIcon, PieChart as PieChartIcon, Percent, TrendingUp, Clock, ArrowRight } from "lucide-react";

interface AdMethodOption {
  id: number;
  name: string;
}

interface CalculationResult {
  roi: number;
  potentialEarnings: number;
  breakEvenPoint: number;
  costPerLead: number | null;
  paybackPeriodDays: number;
  profitMargin: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CostEfficiencyCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [adSpend, setAdSpend] = useState(1000);
  const [expectedRevenue, setExpectedRevenue] = useState(2000);
  const [campaignDays, setCampaignDays] = useState(30);
  const [selectedAdMethod, setSelectedAdMethod] = useState<number | null>(null);
  const [expectedLeads, setExpectedLeads] = useState<number | null>(100);
  const [conversionRate, setConversionRate] = useState(5); // percentage
  
  // Advanced inputs
  const [acquisitionCost, setAcquisitionCost] = useState(0); // Additional costs per acquisition
  const [operationalCosts, setOperationalCosts] = useState(0); // Monthly operational costs
  
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [comparisonData, setComparisonData] = useState<Array<{name: string, value: number}>>([]);

  // Fetch ad methods from API
  const { data: adMethods = [] } = useQuery<AdMethodOption[]>({
    queryKey: ['/api/ad-methods'],
  });

  // Calculate ROI and other metrics
  const calculateMetrics = () => {
    if (adSpend <= 0) {
      toast({
        title: "Invalid input",
        description: "Ad spend must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Basic ROI calculation
    const totalRevenue = expectedRevenue;
    const roi = ((totalRevenue - adSpend) / adSpend) * 100;
    
    // Advanced metrics
    const totalCost = adSpend + operationalCosts + (acquisitionCost * (expectedLeads || 0) * (conversionRate / 100));
    const profit = totalRevenue - totalCost;
    const profitMargin = (profit / totalRevenue) * 100;
    
    // Calculate break-even point
    const breakEvenPoint = adSpend / (totalRevenue / adSpend);
    
    // Calculate cost per lead (if leads are specified)
    const costPerLead = expectedLeads ? adSpend / expectedLeads : null;
    
    // Calculate payback period in days
    const dailyRevenue = totalRevenue / campaignDays;
    const paybackPeriodDays = adSpend / dailyRevenue;

    setCalculationResult({
      roi,
      potentialEarnings: profit,
      breakEvenPoint,
      costPerLead,
      paybackPeriodDays,
      profitMargin,
    });

    // Create comparison data for charts
    setComparisonData([
      { name: 'Ad Spend', value: adSpend },
      { name: 'Expected Revenue', value: totalRevenue },
      { name: 'Profit', value: profit > 0 ? profit : 0 },
      { name: 'Operational Costs', value: operationalCosts },
      { name: 'Acquisition Costs', value: acquisitionCost * (expectedLeads || 0) * (conversionRate / 100) },
    ]);
  };

  // Reset calculation values
  const resetCalculator = () => {
    setAdSpend(1000);
    setExpectedRevenue(2000);
    setCampaignDays(30);
    setSelectedAdMethod(null);
    setExpectedLeads(100);
    setConversionRate(5);
    setAcquisitionCost(0);
    setOperationalCosts(0);
    setCalculationResult(null);
    setComparisonData([]);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Calculator className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Interactive Cost-Efficiency Calculator</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Analyze and optimize your marketing campaign costs and returns with this interactive calculator. 
          Determine ROI, break-even points, and more to make data-driven decisions.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Parameters</CardTitle>
              <CardDescription>
                Enter your campaign details to calculate cost efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="adSpend" className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      Advertising Spend ($)
                    </Label>
                    <Input
                      id="adSpend"
                      type="number"
                      value={adSpend}
                      onChange={(e) => setAdSpend(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                    <div className="pt-2">
                      <Slider
                        value={[adSpend]}
                        min={0}
                        max={10000}
                        step={100}
                        onValueChange={(value) => setAdSpend(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>$5,000</span>
                        <span>$10,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedRevenue" className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
                      Expected Revenue ($)
                    </Label>
                    <Input
                      id="expectedRevenue"
                      type="number"
                      value={expectedRevenue}
                      onChange={(e) => setExpectedRevenue(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                    <div className="pt-2">
                      <Slider
                        value={[expectedRevenue]}
                        min={0}
                        max={20000}
                        step={100}
                        onValueChange={(value) => setExpectedRevenue(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>$10,000</span>
                        <span>$20,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaignDays" className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      Campaign Duration (days)
                    </Label>
                    <Input
                      id="campaignDays"
                      type="number"
                      value={campaignDays}
                      onChange={(e) => setCampaignDays(Number(e.target.value))}
                      min={1}
                      max={365}
                    />
                    <div className="pt-2">
                      <Slider
                        value={[campaignDays]}
                        min={1}
                        max={90}
                        step={1}
                        onValueChange={(value) => setCampaignDays(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 day</span>
                        <span>45 days</span>
                        <span>90 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Advertising Method
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {adMethods.map((method) => (
                        <Button 
                          key={method.id}
                          variant={selectedAdMethod === method.id ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setSelectedAdMethod(method.id)}
                        >
                          {method.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedLeads" className="flex items-center">
                      Expected Leads/Inquiries
                    </Label>
                    <Input
                      id="expectedLeads"
                      type="number"
                      value={expectedLeads || ""}
                      onChange={(e) => setExpectedLeads(e.target.value ? Number(e.target.value) : null)}
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conversionRate" className="flex items-center">
                      <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                      Conversion Rate (%)
                    </Label>
                    <Input
                      id="conversionRate"
                      type="number"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(Number(e.target.value))}
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <div className="pt-2">
                      <Slider
                        value={[conversionRate]}
                        min={0}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => setConversionRate(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>10%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acquisitionCost" className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      Cost per Acquisition ($)
                    </Label>
                    <Input
                      id="acquisitionCost"
                      type="number"
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operationalCosts" className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      Operational Costs ($)
                    </Label>
                    <Input
                      id="operationalCosts"
                      type="number"
                      value={operationalCosts}
                      onChange={(e) => setOperationalCosts(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetCalculator}>Reset</Button>
              <Button onClick={calculateMetrics}>Calculate</Button>
            </CardFooter>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Results Analysis</CardTitle>
              <CardDescription>
                Cost-efficiency metrics based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculationResult ? (
                <>
                  <div className="grid gap-4 grid-cols-2">
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">Return on Investment</div>
                        <div className="text-2xl font-bold mt-1">
                          {calculationResult.roi.toFixed(2)}%
                        </div>
                        <div className={`text-sm mt-1 ${calculationResult.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {calculationResult.roi >= 0 ? 'Profitable' : 'Loss-making'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">Potential Earnings</div>
                        <div className="text-2xl font-bold mt-1">
                          ${calculationResult.potentialEarnings.toFixed(2)}
                        </div>
                        <div className="text-sm mt-1 text-muted-foreground">
                          After all costs
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">Break-even Point</div>
                        <div className="text-2xl font-bold mt-1">
                          ${calculationResult.breakEvenPoint.toFixed(2)}
                        </div>
                        <div className="text-sm mt-1 text-muted-foreground">
                          Minimum revenue needed
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">Payback Period</div>
                        <div className="text-2xl font-bold mt-1">
                          {calculationResult.paybackPeriodDays.toFixed(1)} days
                        </div>
                        <div className="text-sm mt-1 text-muted-foreground">
                          Time to recover costs
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {calculationResult.costPerLead !== null && (
                    <div className="mt-6">
                      <div className="mb-2 text-sm font-medium">Cost per Lead</div>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">
                          ${calculationResult.costPerLead.toFixed(2)}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-lg font-semibold">
                          ${(calculationResult.costPerLead / (conversionRate / 100)).toFixed(2)} per acquisition
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Based on {conversionRate}% conversion rate
                      </div>
                    </div>
                  )}

                  {/* Visualization */}
                  <div className="mt-6">
                    <Tabs defaultValue="bar">
                      <TabsList className="mb-4">
                        <TabsTrigger value="bar" className="flex items-center">
                          <BarChartIcon className="h-4 w-4 mr-1" />
                          Bar Chart
                        </TabsTrigger>
                        <TabsTrigger value="pie" className="flex items-center">
                          <PieChartIcon className="h-4 w-4 mr-1" /> 
                          Pie Chart
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="bar">
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparisonData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => typeof value === 'number' ? ['$' + value.toFixed(2), ''] : ['$' + value, '']} />
                              <Legend />
                              <Bar dataKey="value" fill="#3b82f6" name="Amount ($)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pie">
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={comparisonData.filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {comparisonData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => typeof value === 'number' ? ['$' + value.toFixed(2), ''] : ['$' + value, '']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-72 text-center text-muted-foreground">
                  <Calculator className="h-12 w-12 mb-4 text-muted" />
                  <h3 className="text-xl font-medium mb-2">No Calculation Yet</h3>
                  <p>Enter your campaign parameters and click Calculate to see results here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations Section */}
        {calculationResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Based on your inputs and calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculationResult.roi < 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="font-medium text-red-800">Warning: Negative ROI</h3>
                    <p className="text-red-700 mt-1">
                      Your campaign is projected to lose money. Consider reducing your ad spend, targeting a different audience, 
                      or using a different ad method to improve returns.
                    </p>
                  </div>
                )}

                {calculationResult.roi >= 0 && calculationResult.roi < 20 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-medium text-yellow-800">Marginal Returns</h3>
                    <p className="text-yellow-700 mt-1">
                      Your campaign is profitable but with modest returns. Consider optimizing your targeting or creative to improve conversion rates.
                    </p>
                  </div>
                )}

                {calculationResult.roi >= 20 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-medium text-green-800">Strong Performance</h3>
                    <p className="text-green-700 mt-1">
                      Your campaign shows promising returns. Consider scaling your budget to maximize total profit.
                    </p>
                  </div>
                )}

                {calculationResult.paybackPeriodDays > campaignDays && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-medium text-blue-800">Extended Payback Period</h3>
                    <p className="text-blue-700 mt-1">
                      Your campaign will take longer than its duration to recoup costs. This may be acceptable for brand-building campaigns,
                      but consider adjusting expectations or costs for immediate ROI.
                    </p>
                  </div>
                )}

                {calculationResult.costPerLead !== null && calculationResult.costPerLead > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                    <h3 className="font-medium text-indigo-800">Lead Generation Focus</h3>
                    <p className="text-indigo-700 mt-1">
                      Your cost per lead is ${calculationResult.costPerLead.toFixed(2)}. Industry benchmarks vary, but aim for costs that allow
                      for profitable conversion rates in your business model.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}