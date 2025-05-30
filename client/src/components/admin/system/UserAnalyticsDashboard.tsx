import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Mock data - would be fetched from the API in a real implementation
const generateMonthlyUserData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];
  
  let newUsers = 75;
  let activeUsers = 200;
  
  for (let i = 0; i < 12; i++) {
    // Add some variation
    const growthTrend = Math.sin(i / 2) * 30 + (i * 8);
    newUsers = Math.max(20, Math.floor(newUsers + growthTrend + (Math.random() * 40 - 20)));
    activeUsers = Math.max(newUsers, Math.floor(activeUsers + (newUsers/2) - (Math.random() * 30)));
    
    data.push({
      month: months[i],
      newUsers,
      activeUsers,
      churnedUsers: Math.max(0, Math.floor(newUsers * 0.2 + (Math.random() * 15)))
    });
  }
  return data;
};

const generateRetentionData = () => {
  const data = [];
  for (let i = 1; i <= 12; i++) {
    const monthRetention = Math.max(40, Math.min(95, 90 - (i * 5) + (Math.random() * 10)));
    data.push({
      month: i,
      retention: monthRetention
    });
  }
  return data;
};

const userActivityData = [
  { name: 'Daily Active', value: 215 },
  { name: 'Weekly Active', value: 428 },
  { name: 'Monthly Active', value: 876 },
  { name: 'Inactive', value: 112 }
];

const deviceUsageData = [
  { name: 'Desktop', value: 42 },
  { name: 'Mobile', value: 53 },
  { name: 'Tablet', value: 5 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function UserAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("growth");
  const [monthlyData] = useState(generateMonthlyUserData());
  const [retentionData] = useState(generateRetentionData());
  const [activePieIndex, setActivePieIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" fontSize={24} fontWeight="bold">
          {value}
        </text>
        <text x={cx} y={cy + 35} textAnchor="middle" fill="#999" fontSize={14}>
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  // Calculate current vs. previous period metrics
  const currentMonthNewUsers = monthlyData[monthlyData.length - 1].newUsers;
  const prevMonthNewUsers = monthlyData[monthlyData.length - 2].newUsers;
  const newUsersChange = ((currentMonthNewUsers - prevMonthNewUsers) / prevMonthNewUsers) * 100;
  
  const currentActiveUsers = monthlyData[monthlyData.length - 1].activeUsers;
  const prevActiveUsers = monthlyData[monthlyData.length - 2].activeUsers;
  const activeUsersChange = ((currentActiveUsers - prevActiveUsers) / prevActiveUsers) * 100;
  
  const currentChurn = monthlyData[monthlyData.length - 1].churnedUsers;
  const prevChurn = monthlyData[monthlyData.length - 2].churnedUsers;
  const churnChange = ((currentChurn - prevChurn) / prevChurn) * 100;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-500" />
          User Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="growth">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">New Users</p>
                    <p className="text-xl font-bold">{currentMonthNewUsers}</p>
                    <div className="flex items-center mt-1">
                      {newUsersChange >= 0 ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {newUsersChange.toFixed(1)}% from last month
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(newUsersChange).toFixed(1)}% from last month
                        </span>
                      )}
                    </div>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Active Users</p>
                    <p className="text-xl font-bold">{currentActiveUsers}</p>
                    <div className="flex items-center mt-1">
                      {activeUsersChange >= 0 ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {activeUsersChange.toFixed(1)}% from last month
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(activeUsersChange).toFixed(1)}% from last month
                        </span>
                      )}
                    </div>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500 bg-green-50 p-1.5 rounded-lg" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User Churn</p>
                    <p className="text-xl font-bold">{currentChurn}</p>
                    <div className="flex items-center mt-1">
                      {churnChange <= 0 ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {Math.abs(churnChange).toFixed(1)}% from last month
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {churnChange.toFixed(1)}% from last month
                        </span>
                      )}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 bg-orange-50 p-1.5 rounded-lg" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
              <h3 className="font-medium text-gray-700 mb-4">User Growth Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="newUsers" 
                      name="New Users" 
                      stroke="#3B82F6" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      name="Active Users" 
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="churnedUsers" 
                      name="Churned Users" 
                      stroke="#F97316"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">Top User Acquisition Channels</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { channel: 'Organic Search', users: 312 },
                        { channel: 'Direct', users: 187 },
                        { channel: 'Social Media', users: 143 },
                        { channel: 'Email', users: 96 },
                        { channel: 'Referral', users: 65 },
                        { channel: 'Other', users: 22 }
                      ]}
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="channel" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" name="New Users (Last 30 Days)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">User Growth Forecast</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: 'Jan', actual: 75, forecast: 80 },
                        { month: 'Feb', actual: 112, forecast: 105 },
                        { month: 'Mar', actual: 134, forecast: 140 },
                        { month: 'Apr', actual: 162, forecast: 168 },
                        { month: 'May', actual: 185, forecast: 190 },
                        { month: 'Jun', actual: 221, forecast: 215 },
                        { month: 'Jul', actual: 247, forecast: 245 },
                        { month: 'Aug', actual: 284, forecast: 280 },
                        { month: 'Sep', actual: 315, forecast: 320 },
                        { month: 'Oct', actual: 342, forecast: 350 },
                        { month: 'Nov', actual: 371, forecast: 385 },
                        { month: 'Dec', actual: null, forecast: 415 },
                        { month: 'Jan', actual: null, forecast: 450 },
                        { month: 'Feb', actual: null, forecast: 480 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Growth" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        name="Forecasted Growth" 
                        stroke="#9333EA" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="retention">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">1-Month Retention</p>
                    <p className="text-xl font-bold">72%</p>
                    <p className="text-xs text-green-600 mt-1">+3.2% from previous</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">3-Month Retention</p>
                    <p className="text-xl font-bold">58%</p>
                    <p className="text-xs text-green-600 mt-1">+2.1% from previous</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">6-Month Retention</p>
                    <p className="text-xl font-bold">41%</p>
                    <p className="text-xs text-green-600 mt-1">+1.8% from previous</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">Retention Over Time</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={retentionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Retention']}/>
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        name="User Retention" 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">Cohort Retention Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week 4</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week 8</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">January</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">253</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">76%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">62%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">February</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">187</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">72%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">57%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">43%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">March</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">214</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">78%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">64%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">49%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">April</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">243</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">92%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">81%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">68%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">52%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-medium text-gray-700 mb-4">User Segment Retention</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-center text-sm font-medium mb-3">Small Business</p>
                  <div className="flex flex-col items-center">
                    <p className="text-3xl font-bold text-blue-600">68%</p>
                    <p className="text-sm text-gray-500">3-month retention</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-center text-sm font-medium mb-3">Medium Business</p>
                  <div className="flex flex-col items-center">
                    <p className="text-3xl font-bold text-green-600">73%</p>
                    <p className="text-sm text-gray-500">3-month retention</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-center text-sm font-medium mb-3">Enterprise</p>
                  <div className="flex flex-col items-center">
                    <p className="text-3xl font-bold text-purple-600">82%</p>
                    <p className="text-sm text-gray-500">3-month retention</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Avg. Session Duration</p>
                    <p className="text-xl font-bold">8m 42s</p>
                    <p className="text-xs text-green-600 mt-1">+14% from previous</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Avg. Sessions per User</p>
                    <p className="text-xl font-bold">4.7</p>
                    <p className="text-xs text-green-600 mt-1">+8% from previous</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Feature Engagement</p>
                    <p className="text-xl font-bold">76%</p>
                    <p className="text-xs text-green-600 mt-1">+5% from previous</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">User Activity Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        data={userActivityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                      >
                        {userActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-4">Device Usage</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-medium text-gray-700 mb-4">Most Used Features</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { feature: 'Campaign Tracking', usage: 89 },
                      { feature: 'ROI Calculator', usage: 76 },
                      { feature: 'Competitor Analysis', usage: 64 },
                      { feature: 'Business Profile', usage: 58 },
                      { feature: 'Achievements', usage: 52 },
                      { feature: 'Notifications', usage: 47 },
                      { feature: 'Marketing Advice', usage: 41 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    <Bar dataKey="usage" name="Feature Usage" fill="#8884d8">
                      {[
                        { feature: 'Campaign Tracking', usage: 89 },
                        { feature: 'ROI Calculator', usage: 76 },
                        { feature: 'Competitor Analysis', usage: 64 },
                        { feature: 'Business Profile', usage: 58 },
                        { feature: 'Achievements', usage: 52 },
                        { feature: 'Notifications', usage: 47 },
                        { feature: 'Marketing Advice', usage: 41 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}