import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Users,
  UserCheck,
  UserX,
  Percent,
  Calendar as CalendarIcon,
  Activity,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { User as UserType } from "@shared/schema";

// Helper to calculate days remaining in trial
const calculateTrialDaysRemaining = (endDate: string | Date | null | undefined): number => {
  if (!endDate) return 0;
  
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Analytics stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color?: string;
}

const StatCard = ({ title, value, icon, description, color = "bg-blue-500" }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-start">
    <div className={`rounded-full p-3 ${color} text-white mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  </div>
);

// User status distribution data for pie chart
const getStatusDistributionData = (users: UserType[]) => {
  const statusCount = users.reduce((acc, user) => {
    const status = user.status || "Active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
};

// User approval status distribution data for pie chart
const getApprovalDistributionData = (users: UserType[]) => {
  const approvalCount = users.reduce((acc, user) => {
    const status = user.approvalStatus || "PENDING";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(approvalCount).map(([name, value]) => ({ name, value }));
};

// User registration over time data for bar chart
const getRegistrationOverTimeData = (users: UserType[]) => {
  // Sort users by creation date (assuming there's a createdAt field)
  // For this example, we'll use the ID as a proxy for creation order
  const sortedUsers = [...users].sort((a, b) => a.id - b.id);
  
  // Group by month (simplified for demo)
  const monthlyRegistrations = sortedUsers.reduce((acc, user, index) => {
    // Using index as a simplified way to group users by month (for demo purposes)
    // In a real implementation, we would use actual dates
    const monthIndex = Math.floor(index / Math.max(1, Math.ceil(users.length / 6)));
    const month = `Month ${monthIndex + 1}`;
    
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month]++;
    
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(monthlyRegistrations).map(([month, count]) => ({
    month,
    count
  }));
};

// Trial period distribution (users in various stages of trial)
const getTrialDistributionData = (users: UserType[]) => {
  const trialStatusCount = {
    'Active Trial': 0,
    'Trial Ended': 0,
    'No Trial': 0,
  };
  
  users.forEach(user => {
    if (user.isTrialPeriod) {
      const daysRemaining = calculateTrialDaysRemaining(user.trialEndDate);
      if (daysRemaining > 0) {
        trialStatusCount['Active Trial']++;
      } else {
        trialStatusCount['Trial Ended']++;
      }
    } else {
      trialStatusCount['No Trial']++;
    }
  });
  
  return Object.entries(trialStatusCount).map(([name, value]) => ({ name, value }));
};

// Color schemes for charts
const STATUS_COLORS: Record<string, string> = {
  'Active': '#4ade80',
  'Suspended Service': '#facc15',
  'Deactivated': '#ef4444',
  'Cancelled': '#94a3b8',
  'Non renew': '#a855f7',
};

const APPROVAL_COLORS: Record<string, string> = {
  'APPROVED': '#4ade80',
  'PENDING': '#facc15',
  'REJECTED': '#ef4444',
};

const TRIAL_COLORS: Record<string, string> = {
  'Active Trial': '#3b82f6',
  'Trial Ended': '#94a3b8',
  'No Trial': '#d1d5db',
};

export default function UserAnalytics() {
  const [timeRange, setTimeRange] = useState("all");
  const [chartView, setChartView] = useState("status");
  
  // Fetch all users
  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Calculate key metrics
  const metrics = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter(user => user.status === 'Active').length || 0,
    trialUsers: users?.filter(user => user.isTrialPeriod).length || 0,
    pendingApproval: users?.filter(user => user.approvalStatus === 'PENDING').length || 0,
    recentlyActive: users?.slice(0, 3).length || 0, // Simplified - would use real activity data
  };
  
  // Calculate conversion rate (simplified)
  const conversionRate = metrics.totalUsers > 0 
    ? ((metrics.totalUsers - metrics.trialUsers) / metrics.totalUsers * 100).toFixed(1)
    : "0.0";
  
  // Determine which chart data to use based on selected view
  const getChartData = () => {
    if (!users) return [];
    
    switch (chartView) {
      case "status":
        return getStatusDistributionData(users);
      case "approval":
        return getApprovalDistributionData(users);
      case "trial":
        return getTrialDistributionData(users);
      default:
        return [];
    }
  };
  
  // Get color scheme for current chart
  const getColorScheme = (): Record<string, string> => {
    switch (chartView) {
      case "status":
        return STATUS_COLORS;
      case "approval":
        return APPROVAL_COLORS;
      case "trial":
        return TRIAL_COLORS;
      default:
        return {};
    }
  };
  
  const chartData = getChartData();
  const colorScheme = getColorScheme();
  const registrationData = users ? getRegistrationOverTimeData(users) : [];
  
  // Extract 5 most recent users
  const recentUsers = users 
    ? [...users].sort((a, b) => b.id - a.id).slice(0, 5) 
    : [];
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading user analytics...</div>;
  }
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            User Account Analytics
          </CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
              title="Total Users" 
              value={metrics.totalUsers} 
              icon={<Users className="h-5 w-5" />} 
              color="bg-blue-500"
            />
            <StatCard 
              title="Active Users" 
              value={metrics.activeUsers} 
              icon={<UserCheck className="h-5 w-5" />} 
              color="bg-green-500"
              description={`${((metrics.activeUsers / Math.max(1, metrics.totalUsers)) * 100).toFixed(1)}% of total`}
            />
            <StatCard 
              title="Trial Users" 
              value={metrics.trialUsers} 
              icon={<Clock className="h-5 w-5" />} 
              color="bg-amber-500"
              description={`${((metrics.trialUsers / Math.max(1, metrics.totalUsers)) * 100).toFixed(1)}% of total`}
            />
            <StatCard 
              title="Pending Approval" 
              value={metrics.pendingApproval} 
              icon={<AlertCircle className="h-5 w-5" />} 
              color="bg-orange-500"
            />
            <StatCard 
              title="Conversion Rate" 
              value={`${conversionRate}%`} 
              icon={<Percent className="h-5 w-5" />} 
              color="bg-purple-500"
              description="Trial to full account"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">User Distribution</h3>
              <div className="flex gap-2">
                <Button 
                  variant={chartView === "status" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setChartView("status")}
                >
                  Status
                </Button>
                <Button 
                  variant={chartView === "approval" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setChartView("approval")}
                >
                  Approval
                </Button>
                <Button 
                  variant={chartView === "trial" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setChartView("trial")}
                >
                  Trial
                </Button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colorScheme[entry.name] || `#${Math.floor(Math.random() * 16777215).toString(16)}`} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-md font-medium mb-4">Registration Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="New Users" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-md font-medium mb-4">Recent User Activity</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => {
                const trialDaysLeft = calculateTrialDaysRemaining(user.trialEndDate);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          user.status === "Active" ? "bg-green-500" : 
                          user.status === "Suspended Service" ? "bg-yellow-500" : 
                          user.status === "Deactivated" ? "bg-red-500" : 
                          user.status === "Cancelled" ? "bg-gray-500" :
                          user.status === "Non renew" ? "bg-purple-500" : 
                          "bg-green-500" // Default to Active
                        }`} />
                        {user.status || "Active"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          user.approvalStatus === "APPROVED" ? "bg-green-500" : 
                          user.approvalStatus === "PENDING" ? "bg-yellow-500" : 
                          user.approvalStatus === "REJECTED" ? "bg-red-500" : 
                          "bg-yellow-500" // Default to PENDING
                        }`} />
                        {user.approvalStatus || "PENDING"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isTrialPeriod ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-amber-500" />
                          {trialDaysLeft > 0 ? `${trialDaysLeft} days left` : "Expired"}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                          Full Account
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {/* This would use actual activity data. Simplified for demo */}
                      {user.approvalDate ? format(new Date(user.approvalDate), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-medium mb-4">Insights & Recommendations</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h4 className="font-medium text-blue-700">User Engagement</h4>
              <p className="text-sm text-gray-600">
                {metrics.activeUsers > (metrics.totalUsers * 0.8) 
                  ? "Strong user engagement with over 80% of users active." 
                  : "Consider improving user engagement through targeted notifications and feature improvements."}
              </p>
            </div>
            
            <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
              <h4 className="font-medium text-amber-700">Trial Conversion</h4>
              <p className="text-sm text-gray-600">
                {parseFloat(conversionRate) > 50 
                  ? "Good conversion rate above 50%. Continue monitoring user onboarding experience." 
                  : "Trial conversion rate below target. Consider extending trials or improving onboarding."}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <h4 className="font-medium text-green-700">Growth Opportunities</h4>
              <p className="text-sm text-gray-600">
                {metrics.pendingApproval > 0 
                  ? `${metrics.pendingApproval} users await approval. Expedite review to improve user experience.` 
                  : "All users are approved. Focus on acquisition strategies to grow user base."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}