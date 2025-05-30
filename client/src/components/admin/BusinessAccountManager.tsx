import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building, 
  Search, 
  Badge, 
  Users, 
  CreditCard, 
  CalendarRange,
  Check,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  DollarSign
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge as UIBadge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Business = {
  id: number;
  name: string;
  businessType: string;
  address: string;
  zipCode: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  status?: string;
  isVerified?: boolean;
  verificationDate?: string;
  accountPlan?: string;
  createdAt?: string;
  lastActive?: string;
  activeCampaigns?: number;
  totalCampaigns?: number;
};

type BusinessUser = {
  id: number;
  username: string;
  email?: string;
  role: string;
  status?: string;
};

type BusinessBilling = {
  id: number;
  plan: string;
  amount: number;
  billingCycle: string;
  nextBilling: string;
  paymentMethod: string;
  paymentStatus: string;
  lastPayment?: {
    date: string;
    amount: number;
    status: string;
  };
};

export default function BusinessAccountManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);

  // Fetch businesses - using a working endpoint
  const { data: businessesData, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['/api/admin/businesses'],
    queryFn: async () => {
      const response = await fetch('/api/admin/businesses');
      if (!response.ok) throw new Error('Failed to fetch businesses');
      return response.json();
    }
  });
  
  // Transform the data into our expected format
  const businesses = Array.isArray(businessesData) ? businessesData.map(business => ({
    ...business,
    status: business.status || "Active",
    isVerified: !!business.isVerified,
    verificationDate: business.createdAt ? new Date(business.createdAt).toLocaleDateString() : undefined,
    activeCampaigns: 0,
    totalCampaigns: 0
  })) : [];
  
  const isLoading = isLoadingBusinesses;

  // In a real implementation, these would fetch from actual endpoints
  // For now, we'll create mocked data that matches our component expectations
  const businessUsers: BusinessUser[] = [
    { 
      id: 1, 
      username: "owner@example.com", 
      email: "owner@example.com", 
      role: "Business Admin", 
      status: "active" 
    },
    { 
      id: 2, 
      username: "marketing@example.com", 
      email: "marketing@example.com", 
      role: "Marketing User", 
      status: "active" 
    },
    { 
      id: 3, 
      username: "billing@example.com", 
      email: "billing@example.com", 
      role: "Billing Manager", 
      status: "active" 
    }
  ];
  
  // Generate more realistic billing data based on the selected business
  const generateBillingData = (businessId: number | null): BusinessBilling => {
    // If no business is selected, return default data
    if (!businessId) {
      return {
        id: 1,
        plan: "Business Pro",
        amount: 99.99,
        billingCycle: "Monthly",
        nextBilling: "May 24, 2025",
        paymentMethod: "Credit Card (****4242)",
        paymentStatus: "paid",
        lastPayment: {
          date: "April 24, 2025",
          amount: 99.99,
          status: "completed"
        }
      };
    }
    
    // Get the selected business
    const selectedBusiness = businesses.find(b => b.id === businessId);
    
    // Different plans based on business type
    let plan = "Standard";
    let amount = 49.99;
    let billingCycle = "Monthly";
    
    if (selectedBusiness) {
      // Assign different plans based on business type or ID
      if (selectedBusiness.businessType === "Retail") {
        plan = "Retail Plus";
        amount = 69.99;
      } else if (selectedBusiness.businessType === "Restaurant") {
        plan = "Restaurant Pro";
        amount = 59.99;
      } else if (selectedBusiness.businessType === "Service") {
        plan = "Service Premium";
        amount = 79.99;
      } else if (selectedBusiness.id % 3 === 0) {
        // Every third business has a different plan for variety
        plan = "Enterprise";
        amount = 149.99;
        billingCycle = "Annual";
      }
    }
    
    // Generate next billing date (one month from now)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    // Generate last payment date (current date)
    const lastPaymentDate = new Date();
    
    // Some businesses may have overdue payments
    const paymentStatuses = ["paid", "pending", "overdue"];
    const paymentStatus = selectedBusiness && selectedBusiness.id % 5 === 0 ? 
      paymentStatuses[Math.floor(Math.random() * 3)] : 
      "paid";
    
    return {
      id: businessId,
      plan,
      amount,
      billingCycle,
      nextBilling: nextBillingDate.toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      }),
      paymentMethod: "Credit Card (****" + (Math.floor(Math.random() * 9000) + 1000) + ")",
      paymentStatus,
      lastPayment: {
        date: lastPaymentDate.toLocaleDateString("en-US", { 
          month: "long", 
          day: "numeric", 
          year: "numeric" 
        }),
        amount,
        status: paymentStatus === "paid" ? "completed" : paymentStatus
      }
    };
  };
  
  const businessBilling = generateBillingData(businessId);

  // Filter businesses based on search query
  const filteredBusinesses = !businesses ? [] : businesses.filter(business => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      business.name.toLowerCase().includes(query) ||
      business.businessType.toLowerCase().includes(query) ||
      business.address.toLowerCase().includes(query) ||
      business.zipCode.toLowerCase().includes(query) ||
      (business.ownerName && business.ownerName.toLowerCase().includes(query)) ||
      (business.ownerEmail && business.ownerEmail.toLowerCase().includes(query))
    );
  });

  const handleSelectBusiness = (business: Business) => {
    setBusinessId(business.id);
    setIsDetailsDialogOpen(true);
  };

  const handleVerification = () => {
    // This would call an API to verify the business using the verification code
    // For now, just close the dialog
    setIsVerificationDialogOpen(false);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <UIBadge variant="outline">Unknown</UIBadge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <UIBadge className="bg-green-500">Active</UIBadge>;
      case 'pending':
        return <UIBadge className="bg-yellow-500">Pending</UIBadge>;
      case 'suspended':
        return <UIBadge className="bg-red-500">Suspended</UIBadge>;
      case 'canceled':
        return <UIBadge variant="secondary">Canceled</UIBadge>;
      default:
        return <UIBadge variant="outline">{status}</UIBadge>;
    }
  };

  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Platform Admin: Business Account Management
        </CardTitle>
        <CardDescription>
          View and manage business accounts, verify identities, and monitor subscription status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Search by business name, email, address, zip code..."
            className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0" 
                onClick={() => setSearchQuery("")}
              >
                ×
              </Button>
            </div>
          )}
        </div>

        {/* Businesses list */}
        {isLoading ? (
          <div className="text-center py-4">Loading businesses...</div>
        ) : !filteredBusinesses.length ? (
          <div className="text-center py-4 text-gray-500">
            {searchQuery ? "No businesses match your search query" : "No businesses found"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusinesses.map(business => (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{business.name}</CardTitle>
                    {getStatusBadge(business.status)}
                  </div>
                  <CardDescription className="text-xs">
                    {business.businessType} • ID: {business.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2 text-sm space-y-2">
                  <div className="flex items-start">
                    <Building className="w-4 h-4 mt-0.5 mr-2 text-gray-400" />
                    <div>
                      {business.address}
                      <div className="text-xs text-gray-500">
                        Zip: {business.zipCode}
                      </div>
                    </div>
                  </div>
                  
                  {business.ownerName && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{business.ownerName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Badge className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="flex items-center gap-1">
                      {business.isVerified ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-600">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-amber-600">Unverified</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSelectBusiness(business)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Business Details Dialog */}
        {businessId && (
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {businesses?.find(b => b.id === businessId)?.name || "Business"} Account Details
                </DialogTitle>
                <DialogDescription>
                  Complete business account information and management options
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview">
                <TabsList className="flex flex-wrap gap-1 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users & Roles</TabsTrigger>
                  <TabsTrigger value="billing">Subscription Status</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                  <TabsTrigger value="usage">Usage Stats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Building className="h-4 w-4 mr-2 text-primary" />
                          Business Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-muted-foreground">Name:</div>
                          <div className="font-medium">{businesses?.find(b => b.id === businessId)?.name}</div>
                          
                          <div className="text-muted-foreground">Type:</div>
                          <div>{businesses?.find(b => b.id === businessId)?.businessType}</div>
                          
                          <div className="text-muted-foreground">Address:</div>
                          <div>{businesses?.find(b => b.id === businessId)?.address}</div>
                          
                          <div className="text-muted-foreground">Zip Code:</div>
                          <div>{businesses?.find(b => b.id === businessId)?.zipCode}</div>
                          
                          <div className="text-muted-foreground">Account Status:</div>
                          <div>
                            {getStatusBadge(businesses?.find(b => b.id === businessId)?.status)}
                          </div>
                          
                          <div className="text-muted-foreground">Verification:</div>
                          <div>
                            {businesses?.find(b => b.id === businessId)?.isVerified ? (
                              <span className="flex items-center text-green-600">
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-600">
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-muted-foreground">Owner Name:</div>
                          <div className="font-medium">
                            {businesses?.find(b => b.id === businessId)?.ownerName || "Not specified"}
                          </div>
                          
                          <div className="text-muted-foreground">Owner Email:</div>
                          <div>
                            {businesses?.find(b => b.id === businessId)?.ownerEmail || "Not specified"}
                          </div>
                          
                          <div className="text-muted-foreground">Owner Phone:</div>
                          <div>
                            {businesses?.find(b => b.id === businessId)?.ownerPhone || "Not specified"}
                          </div>
                          
                          <div className="text-muted-foreground">Created:</div>
                          <div>
                            {businesses?.find(b => b.id === businessId)?.createdAt || "Unknown"}
                          </div>
                          
                          <div className="text-muted-foreground">Last Active:</div>
                          <div>
                            {businesses?.find(b => b.id === businessId)?.lastActive || "Unknown"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex space-x-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => setIsVerificationDialogOpen(true)}>
                      Verify Business
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="users" className="space-y-4">
                  <div className="rounded-md border">
                    <div className="p-4 bg-muted/50">
                      <h3 className="text-sm font-medium">Business Users & Roles</h3>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2 text-left font-medium">User</th>
                            <th className="p-2 text-left font-medium">Email</th>
                            <th className="p-2 text-left font-medium">Role</th>
                            <th className="p-2 text-left font-medium">Status</th>
                            <th className="p-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!businessUsers || businessUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                No users found for this business
                              </td>
                            </tr>
                          ) : (
                            businessUsers.map(user => (
                              <tr key={user.id} className="border-b">
                                <td className="p-2">{user.username}</td>
                                <td className="p-2">{user.email || '-'}</td>
                                <td className="p-2">
                                  <UIBadge variant="outline">{user.role}</UIBadge>
                                </td>
                                <td className="p-2">
                                  {user.status === 'active' ? (
                                    <UIBadge className="bg-green-500">Active</UIBadge>
                                  ) : (
                                    <UIBadge variant="secondary">{user.status}</UIBadge>
                                  )}
                                </td>
                                <td className="p-2">
                                  <Button size="sm" variant="ghost">Edit</Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline">Add New User</Button>
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="billing" className="space-y-4">
                  {!businessBilling ? (
                    <div className="text-center py-4 text-gray-500">
                      No billing information available
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Business Subscription Dashboard</h3>
                        <div className="flex space-x-2">
                          <Select defaultValue="active">
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Records</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-muted-foreground">Current Plan</p>
                                <h4 className="text-2xl font-bold">{businessBilling.plan}</h4>
                                <p className="text-sm text-muted-foreground">{businessBilling.billingCycle}</p>
                              </div>
                              <CreditCard className="h-8 w-8 text-primary opacity-80" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                                <h4 className="text-2xl font-bold">${businessBilling.amount}</h4>
                                <p className="text-sm text-muted-foreground">Next: {businessBilling.nextBilling}</p>
                              </div>
                              <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-muted-foreground">Payment Status</p>
                                <h4 className="text-2xl font-bold capitalize">
                                  {businessBilling.paymentStatus}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {businessBilling.paymentStatus === 'paid' ? 'All payments up to date' : 
                                   businessBilling.paymentStatus === 'pending' ? 'Payment processing' : 
                                   'Action required'}
                                </p>
                              </div>
                              {businessBilling.paymentStatus === 'paid' ? (
                                <Check className="h-8 w-8 text-green-500 opacity-80" />
                              ) : businessBilling.paymentStatus === 'pending' ? (
                                <Clock className="h-8 w-8 text-amber-500 opacity-80" />
                              ) : (
                                <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <CalendarRange className="h-4 w-4 mr-2 text-primary" />
                            Subscription History & Invoices
                          </CardTitle>
                          <CardDescription>
                            View business payment history and download invoice records
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                              <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                  <tr className="border-b transition-colors hover:bg-muted/20">
                                    <th className="h-10 px-4 text-left align-middle font-medium">
                                      Invoice #
                                    </th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">
                                      Date
                                    </th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">
                                      Amount
                                    </th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">
                                      Status
                                    </th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                  {/* Current invoice */}
                                  <tr className="border-b transition-colors hover:bg-muted/20">
                                    <td className="p-4 align-middle">INV-{businessId}-{new Date().getFullYear()}-001</td>
                                    <td className="p-4 align-middle">{businessBilling.lastPayment?.date}</td>
                                    <td className="p-4 align-middle">${businessBilling.amount}</td>
                                    <td className="p-4 align-middle">
                                      {businessBilling.paymentStatus === 'paid' ? (
                                        <UIBadge className="bg-green-500">Paid</UIBadge>
                                      ) : businessBilling.paymentStatus === 'pending' ? (
                                        <UIBadge className="bg-yellow-500">Pending</UIBadge>
                                      ) : (
                                        <UIBadge className="bg-red-500">Overdue</UIBadge>
                                      )}
                                    </td>
                                    <td className="p-4 align-middle">
                                      <div className="flex space-x-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <Download className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <Search className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Previous invoices - generate 3 past invoices */}
                                  {Array.from({ length: 3 }).map((_, i) => {
                                    // Generate past dates (one month apart)
                                    const pastDate = new Date();
                                    pastDate.setMonth(pastDate.getMonth() - (i + 1));
                                    
                                    return (
                                      <tr key={i} className="border-b transition-colors hover:bg-muted/20">
                                        <td className="p-4 align-middle">
                                          INV-{businessId}-{pastDate.getFullYear()}-{String(12 - i).padStart(3, '0')}
                                        </td>
                                        <td className="p-4 align-middle">
                                          {pastDate.toLocaleDateString("en-US", { 
                                            month: "long", 
                                            day: "numeric", 
                                            year: "numeric" 
                                          })}
                                        </td>
                                        <td className="p-4 align-middle">${businessBilling.amount}</td>
                                        <td className="p-4 align-middle">
                                          <UIBadge className="bg-green-500">Paid</UIBadge>
                                        </td>
                                        <td className="p-4 align-middle">
                                          <div className="flex space-x-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <Search className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-primary" />
                            Business Payment Method
                          </CardTitle>
                          <CardDescription>
                            View and manage registered payment methods
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex items-center p-3 border rounded-md">
                            <div className="mr-3 flex-shrink-0 bg-gray-100 p-2 rounded-md">
                              <CreditCard className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{businessBilling.paymentMethod}</div>
                              <div className="text-xs text-muted-foreground">Expires 04/2027</div>
                            </div>
                            <div className="ml-auto">
                              <Button variant="outline" size="sm">Update</Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm">Add Payment Method</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              Cancel Subscription
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  <div className="flex justify-between space-x-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Invoices
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="verification" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Business Verification</CardTitle>
                      <CardDescription>
                        Verify business identity to ensure account security and compliance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
                        <p className="font-medium">Verification Status:</p>
                        <p className="mt-1 flex items-center">
                          {businesses?.find(b => b.id === businessId)?.isVerified ? (
                            <>
                              <Check className="w-4 h-4 mr-1 text-green-600" />
                              <span className="text-green-700">
                                Verified on {businesses?.find(b => b.id === businessId)?.verificationDate || "unknown date"}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                              <span className="text-amber-700">Not verified</span>
                            </>
                          )}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Verification Options</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Button variant="outline" className="justify-start" onClick={() => setIsVerificationDialogOpen(true)}>
                            <Building className="w-4 h-4 mr-2" />
                            Verify by Address & Zip Code
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Badge className="w-4 h-4 mr-2" />
                            Verify by Business License
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="usage" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs text-muted-foreground">Campaign Usage</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Active Campaigns:</div>
                            <div className="font-medium">
                              {businesses?.find(b => b.id === businessId)?.activeCampaigns || 0}
                            </div>
                            <div className="text-muted-foreground">Total Campaigns:</div>
                            <div className="font-medium">
                              {businesses?.find(b => b.id === businessId)?.totalCampaigns || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-xs text-muted-foreground">Feature Usage</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">AI Marketing Insights:</div>
                            <div className="font-medium">12 uses</div>
                            <div className="text-muted-foreground">Competitor Analysis:</div>
                            <div className="font-medium">8 reports</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Verification Dialog */}
        <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Business Account</DialogTitle>
              <DialogDescription>
                Enter verification information to confirm this business account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zip-code">Business Zip Code</Label>
                <Input
                  id="zip-code"
                  placeholder="Enter business zip code"
                  defaultValue={businesses?.find(b => b.id === businessId)?.zipCode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter unique verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The verification code is typically sent to the business owner's email or phone.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVerificationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerification}>
                Verify Business
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}