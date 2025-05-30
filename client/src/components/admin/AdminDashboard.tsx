import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, TrendingUp, TrendingDown, Users, Building, FileBarChart, FileCheck, Percent, ChevronRight, ArrowUpRight, ArrowDownRight, CalendarRange, Filter, LayoutDashboard, MoreHorizontal, Check, X, Mail, Phone, User, UserPlus, Key, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FeatureUsageAnalytics from "./FeatureUsageAnalytics";
import {
  PieChart as RechartsPieChart,
  Pie,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from "recharts";

// Chart color constants
const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
  "#00c49f", "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57"
];

const PERFORMANCE_COLORS = [
  "#4caf50", // Excellent - Green
  "#8bc34a", // Good - Light Green
  "#ffc107", // Average - Amber
  "#f44336", // Poor - Red
  "#9e9e9e"  // No Data - Gray
];

// Define the type for system stats
interface SystemStats {
  totalUsers: number;
  totalBusinesses: number;
  totalCampaigns: number;
  activeCampaigns: number;
  averageROI: number;
  recentUsers: {
    id: number;
    username: string;
    email: string | null;
    isVerified: boolean | null;
    isAdmin: boolean;
    businessName: string | null;
  }[];
  campaignsByMethod: { name: string; count: number }[];
  campaignsByBusinessType: { name: string; count: number }[];
  campaignsByPerformance: { range: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  retentionRates: { cohort: string; retention: number }[];
  userActivity: { date: string; active: number; inactive: number }[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  detailPath?: string;
}

function StatCard({ title, value, icon, change = 0, detailPath }: StatCardProps) {
  const [, setLocation] = useLocation();
  
  const handleClick = () => {
    if (detailPath) {
      // Use pushState and dispatch a popstate event to update the UI
      window.history.pushState(null, '', detailPath);
      window.dispatchEvent(new Event('popstate'));
    }
  };
  
  return (
    <Card 
      className="bg-white hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {change !== 0 && (
              <div className="flex items-center mt-1 text-xs">
                {change > 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{change}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{change}%</span>
                  </>
                )}
                <span className="text-gray-400 ml-1">vs. previous period</span>
              </div>
            )}
          </div>
          <div className="rounded-full p-2 bg-gray-50">
            {icon}
          </div>
        </div>
        {detailPath && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs p-0 h-5 w-full flex justify-end items-center text-primary hover:underline transition-all">
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  // Fetch system stats
  const { data: stats, isLoading } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
  });
  
  // User detail modal state
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Use Wouter for navigation
  const [, setLocation] = useLocation();
  
  const [timeRange, setTimeRange] = useState("all");
  const [chartType, setChartType] = useState("pie");
  const [growthPeriod, setGrowthPeriod] = useState("month");
  
  // Handle opening user detail modal
  const handleViewUserDetail = (userId: number) => {
    const user = stats?.recentUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setSelectedUserId(userId);
      setIsUserDetailOpen(true);
    }
  };
  
  return (
    <div>
      <Card className="bg-white mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <LineChart className="mr-2 h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-600">
              Key platform metrics and performance indicators.
            </p>
            
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
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<Users className="h-5 w-5 text-blue-500" />}
                  change={+15}
                  detailPath="/admin?tab=users"
                />
                <StatCard
                  title="Businesses"
                  value={stats.totalBusinesses}
                  icon={<Building className="h-5 w-5 text-green-500" />}
                  change={+8}
                  detailPath="/admin?tab=businesses"
                />
                <StatCard
                  title="Total Campaigns"
                  value={stats.totalCampaigns}
                  icon={<FileBarChart className="h-5 w-5 text-purple-500" />}
                  change={+23}
                  detailPath="/admin?tab=content&subtab=campaigns"
                />
                <StatCard
                  title="Active Campaigns"
                  value={stats.activeCampaigns}
                  icon={<FileCheck className="h-5 w-5 text-yellow-500" />}
                  change={+5}
                  detailPath="/admin?tab=content&subtab=campaigns"
                />
                <StatCard
                  title="Average ROI"
                  value={`${stats.averageROI.toFixed(2)}%`}
                  icon={<Percent className="h-5 w-5 text-red-500" />}
                  change={+2.1}
                  detailPath="/admin?tab=analytics&subtab=performance"
                />
                <StatCard
                  title="Campaign Success Rate"
                  value={`${stats.totalCampaigns > 0 ? ((stats.activeCampaigns / stats.totalCampaigns) * 100).toFixed(1) : 0}%`}
                  icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                  change={+1.8}
                  detailPath="/admin?tab=analytics&subtab=performance"
                />
              </div>

              <div className="mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Recently Joined Users
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => setLocation("/admin?tab=users")}
                      >
                        View All Users
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>New users who recently registered on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email || '-'}</TableCell>
                            <TableCell>{user.businessName || '-'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                user.isVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Button 
                                      variant="ghost" 
                                      className="w-full justify-start" 
                                      onClick={() => handleViewUserDetail(user.id)}
                                    >
                                      <Users className="mr-2 h-4 w-4" />
                                      <span>View Details</span>
                                    </Button>
                                  </DropdownMenuItem>
                                  {!user.isVerified && (
                                    <>
                                      <DropdownMenuItem asChild>
                                        <Button 
                                          variant="ghost" 
                                          className="w-full justify-start" 
                                          onClick={() => {
                                            setLocation("/admin?tab=users-approval");
                                          }}
                                        >
                                          <Check className="mr-2 h-4 w-4 text-green-500" />
                                          <span>Approve</span>
                                        </Button>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Button 
                                          variant="ghost" 
                                          className="w-full justify-start" 
                                          onClick={() => {
                                            setLocation("/admin?tab=users-approval");
                                          }}
                                        >
                                          <X className="mr-2 h-4 w-4 text-red-500" />
                                          <span>Reject</span>
                                        </Button>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md flex items-center">
                        <PieChart className="mr-2 h-4 w-4" />
                        Campaign Distribution
                      </CardTitle>
                      <div className="flex gap-1">
                        <Select value={chartType} onValueChange={setChartType}>
                          <SelectTrigger className="h-8 w-[100px] text-xs">
                            <SelectValue placeholder="Chart Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Distribution of campaigns by category and performance
                    </CardDescription>
                  </CardHeader>
                  <Tabs defaultValue="adMethod" className="w-full">
                    <div className="px-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="adMethod">Ad Method</TabsTrigger>
                        <TabsTrigger value="businessType">Business Type</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="adMethod" className="px-6 pt-4">
                      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        {stats.campaignsByMethod.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250} minHeight={250}>
                            {chartType === "pie" ? (
                              <RechartsPieChart>
                                <Pie
                                  data={stats.campaignsByMethod}
                                  dataKey="count"
                                  nameKey="name"
                                  cx="40%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  paddingAngle={10}
                                  labelLine={false}
                                  label={false}
                                >
                                  {stats.campaignsByMethod.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                              </RechartsPieChart>
                            ) : chartType === "bar" ? (
                              <RechartsBarChart data={stats.campaignsByMethod}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Bar dataKey="count" fill="#8884d8" name="Campaigns">
                                  {stats.campaignsByMethod.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </RechartsBarChart>
                            ) : (
                              <RechartsLineChart data={stats.campaignsByMethod}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Line
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#8884d8"
                                  name="Campaigns"
                                  activeDot={{ r: 8 }}
                                />
                              </RechartsLineChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No campaign data available for ad methods.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="businessType" className="px-6 pt-4">
                      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        {stats.campaignsByBusinessType.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250} minHeight={250}>
                            {chartType === "pie" ? (
                              <RechartsPieChart>
                                <Pie
                                  data={stats.campaignsByBusinessType}
                                  dataKey="count"
                                  nameKey="name"
                                  cx="40%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  paddingAngle={10}
                                  labelLine={false}
                                  label={false}
                                >
                                  {stats.campaignsByBusinessType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                              </RechartsPieChart>
                            ) : chartType === "bar" ? (
                              <RechartsBarChart data={stats.campaignsByBusinessType}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Bar dataKey="count" name="Campaigns">
                                  {stats.campaignsByBusinessType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </RechartsBarChart>
                            ) : (
                              <RechartsLineChart data={stats.campaignsByBusinessType}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Line
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#8884d8"
                                  name="Campaigns"
                                  activeDot={{ r: 8 }}
                                />
                              </RechartsLineChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No campaign data available for business types.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="performance" className="px-6 pt-4">
                      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        {stats.campaignsByPerformance.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250} minHeight={250}>
                            {chartType === "pie" ? (
                              <RechartsPieChart>
                                <Pie
                                  data={stats.campaignsByPerformance}
                                  dataKey="count"
                                  nameKey="range"
                                  cx="40%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  paddingAngle={10}
                                  labelLine={false}
                                  label={false}
                                >
                                  {stats.campaignsByPerformance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                              </RechartsPieChart>
                            ) : chartType === "bar" ? (
                              <RechartsBarChart data={stats.campaignsByPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Bar dataKey="count" name="Campaigns">
                                  {stats.campaignsByPerformance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                                  ))}
                                </Bar>
                              </RechartsBarChart>
                            ) : (
                              <RechartsLineChart data={stats.campaignsByPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} campaigns`, 'Count']} />
                                <Line
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#8884d8"
                                  name="Campaigns"
                                  activeDot={{ r: 8 }}
                                />
                              </RechartsLineChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No campaign performance data available.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md flex items-center">
                        <LineChart className="mr-2 h-4 w-4" />
                        User Growth
                      </CardTitle>
                      <Select value={growthPeriod} onValueChange={setGrowthPeriod}>
                        <SelectTrigger className="h-8 w-[100px] text-xs">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Weekly</SelectItem>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="quarter">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <CardDescription>
                      New user registrations over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                      {stats.userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250} minHeight={250}>
                          <AreaChart data={stats.userGrowth}>
                            <defs>
                              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} users`, 'New Users']} />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#8884d8" 
                              fillOpacity={1} 
                              fill="url(#colorGrowth)" 
                              name="New Users"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No user growth data available.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <p className="text-gray-500">Failed to load system statistics.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{selectedUser.username}</h3>
                  <p className="text-sm text-gray-500">User ID: {selectedUser.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Email Address</p>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{selectedUser.email || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Admin Status</p>
                  <div className="flex items-center">
                    <Key className="h-4 w-4 mr-2 text-gray-400" />
                    <Badge variant={selectedUser.isAdmin ? "default" : "outline"}>
                      {selectedUser.isAdmin ? "Admin" : "Regular User"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Business Account</p>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{selectedUser.businessName || "No business associated"}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Verification Status</p>
                  <div className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2 text-gray-400" />
                    <Badge variant={selectedUser.isVerified ? "success" : "warning"}>
                      {selectedUser.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-gray-500">Account Age</p>
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-2 text-gray-400" />
                    <p>30 days</p> {/* This would be calculated in a real app */}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsUserDetailOpen(false)}
            >
              Close
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/admin?tab=users&edit=${selectedUserId}`)}
              >
                Edit User
              </Button>
              
              {selectedUser && !selectedUser.isVerified && (
                <Button
                  onClick={() => setLocation(`/admin?tab=users-approval`)}
                >
                  Manage Approval
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}