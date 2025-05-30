import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DownloadCloud,
  ArrowUpDown,
  Search,
  CreditCard,
  DollarSign,
  Users,
  AlertTriangle,
  PieChart,
  Wallet,
  CheckCircle,
  XCircle,
  FilterX,
  Filter,
  CalendarRange
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Define types for our billing data structure
interface PlanData {
  name: string;
  value: number;
  color: string;
}

interface Invoice {
  id: string;
  business: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
}

interface BusinessAccount {
  id: number;
  name: string;
  plan: string;
  status: "active" | "hold" | "deactivated";
  lastPayment: string;
  amount: string;
}

interface BillingData {
  revenue: {
    total: string;
    monthly: string;
    growth: number;
    pendingAmount: string;
    overdue: string;
  };
  subscriptions: {
    total: number;
    active: number;
    trialEnding: number;
    canceled: number;
    byPlan: PlanData[];
  };
  invoices: Invoice[];
  accounts: BusinessAccount[];
}

// Mock data for billing overview - would be replaced by API data in production
const mockBillingData: BillingData = {
  revenue: {
    total: "$127,850.00",
    monthly: "$21,250.00",
    growth: 18,
    pendingAmount: "$8,750.00",
    overdue: "$3,250.00"
  },
  subscriptions: {
    total: 215,
    active: 189,
    trialEnding: 12,
    canceled: 26,
    byPlan: [
      { name: "Basic", value: 85, color: "#8884d8" },
      { name: "Standard", value: 78, color: "#82ca9d" },
      { name: "Premium", value: 26, color: "#ffc658" }
    ]
  },
  invoices: [
    { id: "INV-2023-0123", business: "Acme Corp", amount: "$99.99", date: "2025-04-15", status: "paid" },
    { id: "INV-2023-0124", business: "XYZ Industries", amount: "$199.99", date: "2025-04-15", status: "paid" },
    { id: "INV-2023-0125", business: "Global Retail", amount: "$49.99", date: "2025-04-14", status: "pending" },
    { id: "INV-2023-0126", business: "Tech Solutions", amount: "$149.99", date: "2025-04-14", status: "pending" },
    { id: "INV-2023-0127", business: "Marketing Pro", amount: "$99.99", date: "2025-04-10", status: "overdue" },
    { id: "INV-2023-0128", business: "Design Studio", amount: "$149.99", date: "2025-04-05", status: "overdue" },
    { id: "INV-2023-0129", business: "Restaurant Chain", amount: "$79.99", date: "2025-04-01", status: "overdue" }
  ],
  accounts: [
    { id: 1, name: "Midwest Supplies", plan: "Standard", status: "active", lastPayment: "2025-04-12", amount: "$99.99" },
    { id: 2, name: "Urban Clothing", plan: "Premium", status: "active", lastPayment: "2025-04-10", amount: "$199.99" },
    { id: 3, name: "Tech Innovations", plan: "Basic", status: "hold", lastPayment: "2025-03-10", amount: "$49.99" },
    { id: 4, name: "Food Delivery Co", plan: "Standard", status: "deactivated", lastPayment: "2025-02-15", amount: "$99.99" },
    { id: 5, name: "Healthcare Services", plan: "Premium", status: "active", lastPayment: "2025-04-08", amount: "$199.99" }
  ]
};

export default function BillingOverview() {
  const [timeRange, setTimeRange] = useState("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // In a real implementation, this would be a query to the backend
  const { data: billingData, isLoading } = useQuery<BillingData>({
    queryKey: ["admin", "billing-overview"],
    queryFn: async () => {
      // Simulate API call
      return new Promise<BillingData>(resolve => {
        setTimeout(() => resolve(mockBillingData), 500);
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <BillingOverviewSkeleton />;
  }

  // Filter accounts based on status and search term
  const filteredAccounts = billingData?.accounts.filter((account: BusinessAccount) => {
    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing Overview</h2>
          <p className="text-muted-foreground">
            Platform-wide subscription and revenue status
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <CalendarRange className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Revenue and Subscription Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.revenue.monthly}</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-green-500">+{billingData?.revenue.growth}%</span>
              <span className="text-muted-foreground ml-1">vs. last month</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="font-medium">{billingData?.revenue.pendingAmount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Overdue</div>
                <div className="font-medium text-red-500">{billingData?.revenue.overdue}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.subscriptions.active} Active</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-muted-foreground">of {billingData?.subscriptions.total} total subscriptions</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Trial Ending</div>
                <div className="font-medium text-amber-500">{billingData?.subscriptions.trialEnding}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Canceled</div>
                <div className="font-medium text-red-500">{billingData?.subscriptions.canceled}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-primary" />
              Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={billingData?.subscriptions.byPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {billingData?.subscriptions.byPlan.map((entry: PlanData, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Account Status</TabsTrigger>
          <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Business Accounts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-[180px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      className="pl-8 h-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 w-[130px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="hold">On Hold</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts?.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.plan}</TableCell>
                      <TableCell>
                        {account.status === "active" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            Active
                          </Badge>
                        )}
                        {account.status === "hold" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                            On Hold
                          </Badge>
                        )}
                        {account.status === "deactivated" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                            Deactivated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(account.lastPayment).toLocaleDateString()}</TableCell>
                      <TableCell>{account.amount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                Invoice status for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingData?.invoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.business}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {invoice.status === "paid" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            Paid
                          </Badge>
                        )}
                        {invoice.status === "pending" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                            Pending
                          </Badge>
                        )}
                        {invoice.status === "overdue" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                            Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            <DownloadCloud className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Download and analyze platform financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-primary" />
                      Revenue Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Monthly Revenue Report</div>
                          <div className="text-xs text-muted-foreground">April 2025</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Quarterly Revenue Report</div>
                          <div className="text-xs text-muted-foreground">Q1 2025</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Annual Revenue Report</div>
                          <div className="text-xs text-muted-foreground">2024</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      Subscription Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Current Subscriptions</div>
                          <div className="text-xs text-muted-foreground">All active plans</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Subscription Changes</div>
                          <div className="text-xs text-muted-foreground">Upgrades/Downgrades</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Churn Report</div>
                          <div className="text-xs text-muted-foreground">Last 12 months</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BillingOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-80 mb-4" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}