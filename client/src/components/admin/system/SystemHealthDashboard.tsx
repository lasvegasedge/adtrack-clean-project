import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Zap
} from "lucide-react";
import { DemoDataControls } from "@/components/admin/DemoDataControls";

// Mock data - This would come from the API in a real implementation
const generateMockApiResponseTimes = () => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now);
    date.setHours(now.getHours() - (23 - i));
    data.push({
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      response: Math.floor(Math.random() * 150) + 50, // 50-200ms
      error: Math.max(0, Math.floor(Math.random() * 5))
    });
  }
  return data;
};

// Mock database stats
const generateMockDatabaseMetrics = () => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now);
    date.setHours(now.getHours() - (23 - i));
    data.push({
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      queryTime: Math.floor(Math.random() * 80) + 20, // 20-100ms
      connections: Math.floor(Math.random() * 20) + 5, // 5-25 connections
    });
  }
  return data;
};

// System uptime and status
const systemStats = {
  uptime: "32 days, 4 hours",
  status: "Operational",
  lastRestart: "March 15, 2025",
  databaseStatus: "Connected",
  apiAvailability: "99.98%",
  activeUsers: 28,
  errorRate: "0.02%",
  alertsToday: 0
};

export default function SystemHealthDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [apiResponseData] = useState(generateMockApiResponseTimes());
  const [databaseMetrics] = useState(generateMockDatabaseMetrics());

  const averageResponseTime = apiResponseData.reduce((sum, item) => sum + item.response, 0) / apiResponseData.length;
  const averageQueryTime = databaseMetrics.reduce((sum, item) => sum + item.queryTime, 0) / databaseMetrics.length;
  const currentConnections = databaseMetrics[databaseMetrics.length - 1].connections;
  
  return (
    <div className="space-y-6">
      {/* Demo Data Controls section - Making this more prominent */}
      <h2 className="text-2xl font-bold mt-2 mb-4">System Management</h2>
      <DemoDataControls />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-500" />
            System Health Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="api">API Performance</TabsTrigger>
              <TabsTrigger value="database">Database Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">System Status</p>
                      <p className="text-lg font-bold text-green-600">{systemStats.status}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Uptime</p>
                      <p className="text-lg font-bold">{systemStats.uptime}</p>
                    </div>
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Database</p>
                      <p className="text-lg font-bold text-green-600">{systemStats.databaseStatus}</p>
                    </div>
                    <Database className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Active Users</p>
                      <p className="text-lg font-bold">{systemStats.activeUsers}</p>
                    </div>
                    <Activity className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border p-4 bg-white">
                  <h3 className="font-medium text-gray-700 mb-4">System Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Availability</span>
                      <span className="text-sm font-medium text-green-600">{systemStats.apiAvailability}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: systemStats.apiAvailability }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="text-sm font-medium text-green-600">{systemStats.errorRate}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-500 h-2.5 rounded-full" 
                        style={{ width: "0.02%" }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-600">Average Response Time</span>
                      <span className="text-sm font-medium">{averageResponseTime.toFixed(0)}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, (averageResponseTime / 200) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-600">Database Query Time</span>
                      <span className="text-sm font-medium">{averageQueryTime.toFixed(0)}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-500 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, (averageQueryTime / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 bg-white">
                  <h3 className="font-medium text-gray-700 mb-4">System Alerts</h3>
                  {systemStats.alertsToday > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">High API Response Time</p>
                          <p className="text-xs text-gray-500">12:42 PM - Response times exceeded threshold</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700">No Active Alerts</p>
                      <p className="text-sm text-gray-500">All systems are operating normally</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="api">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <Zap className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Average Response Time</p>
                        <p className="text-xl font-bold">{averageResponseTime.toFixed(0)} ms</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Error Rate</p>
                        <p className="text-xl font-bold">{systemStats.errorRate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Availability</p>
                        <p className="text-xl font-bold">{systemStats.apiAvailability}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <h3 className="font-medium text-gray-700 mb-4">API Response Times (Last 24 Hours)</h3>
                  <div className="h-80" style={{ minHeight: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%" aspect={1.5}>
                      <LineChart
                        data={apiResponseData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" orientation="left" label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Errors', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="response" name="Response Time (ms)" stroke="#3B82F6" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="error" name="Errors" stroke="#EF4444" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <h3 className="font-medium text-gray-700 mb-4">Endpoint Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Response Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests/Hr</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">/api/user</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">62ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,284</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">0.00%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">/api/business</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">947</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">0.01%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">/api/campaigns</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">138ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">814</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">0.03%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">/api/top-performers</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">172ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">632</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">0.05%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">/api/auth</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">421</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">0.02%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="database">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <Database className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Average Query Time</p>
                        <p className="text-xl font-bold">{averageQueryTime.toFixed(0)} ms</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-purple-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Active Connections</p>
                        <p className="text-xl font-bold">{currentConnections}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <p className="text-xl font-bold text-green-600">{systemStats.databaseStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <h3 className="font-medium text-gray-700 mb-4">Database Performance (Last 24 Hours)</h3>
                  <div className="h-80" style={{ minHeight: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%" aspect={1.5}>
                      <LineChart
                        data={databaseMetrics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" orientation="left" label={{ value: 'Query Time (ms)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Connections', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="queryTime" name="Query Time (ms)" stroke="#8B5CF6" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="connections" name="Connections" stroke="#10B981" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <h3 className="font-medium text-gray-700 mb-4">Database Tables</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Vacuumed</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">users</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.4 MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,284</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2h ago</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">businesses</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5.8 MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">982</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3h ago</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">campaigns</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.1 MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3,458</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1h ago</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">locations</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.2 MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">782</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4h ago</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">sessions</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.8 MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">421</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2h ago</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}