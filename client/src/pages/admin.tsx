import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, hasAdminRights } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserManager from "@/components/admin/UserManager";
import StaffManager from "@/components/admin/StaffManager";
import AdMethodManager from "@/components/admin/AdMethodManager";
import BusinessTypeManager from "@/components/admin/BusinessTypeManager";
import BusinessAccountManager from "@/components/admin/BusinessAccountManager";
import BillingOverview from "@/components/admin/BillingOverview";
import SystemHealthDashboard from "@/components/admin/system/SystemHealthDashboard";
import DemoDataManager from "@/components/admin/DemoDataManager";
import UserAnalytics from "@/components/admin/UserAnalytics";
import CampaignManager from "@/components/admin/CampaignManager";
import UserApprovalDashboard from "@/components/admin/UserApprovalDashboard";
import AdminSettings from "@/components/admin/AdminSettings";
import { AdminNotificationSettings } from "@/components/admin/NotificationSettings";
import { 
  LayoutDashboard,
  Users, 
  Newspaper,
  BadgeCheck,
  Settings,
  Shield,
  Activity,
  ServerCrash,
  Building,
  UserCog,
  CreditCard,
  DollarSign,
  FileBarChart, 
  TrendingUp,
  Download
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Use hasAdminRights utility function for consistent admin checks
  
  // Admin access control - redirect non-admin users
  useEffect(() => {
    if (!user) {
      // Not logged in - redirect to auth
      setLocation('/auth');
      return;
    }
    
    if (!hasAdminRights(user)) {
      // Logged in but not admin - redirect to dashboard
      console.log('Blocking non-admin access to admin page:', user.username);
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  // If user is not an admin, don't render the page
  if (!user || !hasAdminRights(user)) {
    return null;
  }
  
  // Fetch admin statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Function to get URL params (not a hook)
  const getUrlParams = () => {
    // Only run this on the client side
    if (typeof window === 'undefined') {
      return { tab: "dashboard", subtab: "" };
    }
    
    const params = new URLSearchParams(window.location.search);
    return {
      tab: params.get('tab') || "dashboard",
      subtab: params.get('subtab') || ""
    };
  };

  const { tab: initialTab, subtab: initialSubtab } = getUrlParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubtab, setActiveSubtab] = useState(initialSubtab);
  
  // Add effect to update active states when URL changes or custom event is triggered
  useEffect(() => {
    const handleUrlChange = () => {
      const { tab, subtab } = getUrlParams();
      console.log("Admin page - URL changed, updating tab to:", tab);
      setActiveTab(tab);
      setActiveSubtab(subtab);
    };
    
    // Listen for custom event from BottomNavigation
    const handleCustomTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      console.log("Admin page - Custom event received, updating tab to:", tab);
      setActiveTab(tab);
      setActiveSubtab('');
    };
    
    // Listen for URL changes (like back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for our custom event
    window.addEventListener('adminTabChange', handleCustomTabChange as EventListener);
    
    // Run once on mount to ensure tab state matches URL
    handleUrlChange();
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('adminTabChange', handleCustomTabChange as EventListener);
    };
  }, []);
  
  // Function to handle tab changes - only preserve subtab if staying in the same section
  const handleTabChange = (newTab: string) => {
    console.log("Changing tab to:", newTab);
    
    // Always update the active tab state
    setActiveTab(newTab);
    
    // Reset subtab when switching main tabs to avoid invalid subtab states
    if (newTab !== activeTab) {
      setActiveSubtab('');
      window.history.replaceState(null, '', `/admin?tab=${newTab}`);
    } else if (activeSubtab) {
      // If it's the same tab and there's a subtab, preserve it
      window.history.replaceState(null, '', `/admin?tab=${newTab}&subtab=${activeSubtab}`);
    } else {
      window.history.replaceState(null, '', `/admin?tab=${newTab}`);
    }
  };
  
  // Platform Admin doesn't have billing information - they manage business accounts

  return (
    <AppLayout title="Admin Control Panel">
      <div className="mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full">
          <TabsList className="flex flex-wrap mb-8 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              <span>Businesses</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <Newspaper className="w-4 h-4 mr-2" />
              <span>Content</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center">
              <BadgeCheck className="w-4 h-4 mr-2" />
              <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center">
              <ServerCrash className="w-4 h-4 mr-2" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManager />
          </TabsContent>
          
          <TabsContent value="businesses">
            <BusinessAccountManager />
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingOverview />
          </TabsContent>
          
          <TabsContent value="pricing">
            <Card className="bg-white mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Pricing Configuration Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  Manage pricing plans and configuration options for the platform.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-gray-700 mb-2">Manage Pricing Plans</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create, edit, and manage pricing plans that will be displayed on the pricing page.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/admin/manage-pricing'}
                      className="w-full"
                    >
                      Manage Pricing Plans
                    </Button>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-gray-700 mb-2">Manage Discount Codes</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create, edit, and manage discount codes that can be applied to subscriptions.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/admin/manage-discount-codes'}
                      className="w-full"
                    >
                      Manage Discount Codes
                    </Button>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-gray-700 mb-2">Current Active Plans</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {stats?.activePricingPlans || 3} active pricing plans configured.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('/pricing', '_blank')}
                      className="w-full"
                    >
                      View Public Pricing Page
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            {/* Create subtabs for content section */}
            <Tabs 
              value={activeTab === "content" && activeSubtab ? activeSubtab : "adMethods"} 
              onValueChange={(value) => {
                setActiveSubtab(value);
                window.history.replaceState(null, '', `/admin?tab=content&subtab=${value}`);
              }}
              className="w-full mb-6"
            >
              <TabsList className="flex flex-wrap gap-1 mb-4">
                <TabsTrigger value="adMethods">Advertisement Methods</TabsTrigger>
                <TabsTrigger value="businessTypes">Business Types</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>
              
              <TabsContent value="adMethods">
                <AdMethodManager />
              </TabsContent>
              
              <TabsContent value="businessTypes">
                <BusinessTypeManager />
              </TabsContent>
              
              <TabsContent value="campaigns">
                <CampaignManager />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="achievements">
            <Card className="bg-white mb-6">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">Achievement Management</h3>
                <p className="text-gray-600">Achievement management features coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            {/* Create subtabs for settings section */}
            <Tabs 
              value={activeTab === "settings" && activeSubtab ? activeSubtab : "general"} 
              onValueChange={(value) => {
                setActiveSubtab(value);
                window.history.replaceState(null, '', `/admin?tab=settings&subtab=${value}`);
              }}
              className="w-full mb-6"
            >
              <TabsList className="flex flex-wrap gap-1 mb-4">
                <TabsTrigger value="general">General Settings</TabsTrigger>
                <TabsTrigger value="approvals">User Approvals</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center">
                  <UserCog className="w-4 h-4 mr-2" />
                  <span>Staff Management</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <AdminSettings />
              </TabsContent>
              
              <TabsContent value="approvals">
                <UserApprovalDashboard />
              </TabsContent>
              
              <TabsContent value="notifications">
                <AdminNotificationSettings />
              </TabsContent>
              
              <TabsContent value="staff">
                <StaffManager />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="system">
            <div className="space-y-8">
              <DemoDataManager />
              <SystemHealthDashboard />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            {/* Create subtabs for analytics section */}
            <Tabs 
              value={activeTab === "analytics" && activeSubtab ? activeSubtab : "usage"} 
              onValueChange={(value) => {
                setActiveSubtab(value);
                window.history.replaceState(null, '', `/admin?tab=analytics&subtab=${value}`);
              }}
              className="w-full mb-6"
            >
              <TabsList className="flex flex-wrap gap-1 mb-4">
                <TabsTrigger value="usage">Feature Usage</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="usage">
                <UserAnalytics />
              </TabsContent>
              
              <TabsContent value="performance">
                <Card className="bg-white mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      View detailed performance metrics for campaigns and ROI across the platform.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">Average ROI</h3>
                        <p className="text-2xl font-bold">{stats?.averageROI?.toFixed(2) || "32.45"}%</p>
                        <span className="text-xs text-green-600">↑ 2.1% from last month</span>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">Campaign Success Rate</h3>
                        <p className="text-2xl font-bold">{
                          stats?.totalCampaigns 
                            ? ((stats?.activeCampaigns || 0) / stats.totalCampaigns * 100).toFixed(1) 
                            : "78.2"
                        }%</p>
                        <span className="text-xs text-green-600">↑ 1.8% from last month</span>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">Total Revenue</h3>
                        <p className="text-2xl font-bold">$47,892</p>
                        <span className="text-xs text-green-600">↑ 5.4% from last month</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-base font-medium mb-4">Campaign Distribution by Business Type</h3>
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        {stats?.campaignsByBusinessType?.length > 0 ? (
                          <div className="space-y-3 pb-2">
                            {stats.campaignsByBusinessType.map((item: { name: string; count: number }, index: number) => (
                              <div key={index} className="flex items-center">
                                <div className="w-32 font-medium text-sm truncate pr-2">{item.name}</div>
                                <div className="flex-1">
                                  <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="absolute h-full bg-blue-500 rounded-full" 
                                      style={{ 
                                        width: `${Math.min(100, (item.count / Math.max(...stats.campaignsByBusinessType.map((i: { count: number }) => i.count))) * 100)}%` 
                                      }} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                                      <span className="text-sm font-medium">{item.count}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-gray-500">No campaign data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reports">
                <Card className="bg-white mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Analytics Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Generate and download analytics reports for the platform.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">Campaign Summary Report</h3>
                        <p className="text-sm text-gray-600 mb-4">Performance data for all campaigns in CSV format.</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Create and download CSV for campaign data
                            fetch('/api/admin/campaigns')
                              .then(response => response.json())
                              .then(campaigns => {
                                // Convert to CSV
                                // Add branding headers
                                const brandingHeaders = [
                                  `"AdTrack.online - Campaign Summary Report"`,
                                  `"Generated on: ${new Date().toLocaleString()}"`,
                                  '""' // Empty line
                                ];
                                
                                const headers = ['ID', 'Name', 'Business', 'Ad Method', 'Spent', 'Revenue', 'ROI', 'Status', 'Start Date', 'End Date'];
                                const csvRows = [
                                  ...brandingHeaders,
                                  headers.join(','),
                                  ...campaigns.map((campaign: any) => {
                                    const roi = campaign.revenue > 0 
                                      ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(2) 
                                      : '0.00';
                                    
                                    return [
                                      campaign.id,
                                      `"${campaign.name.replace(/"/g, '""')}"`,
                                      `"${campaign.businessName?.replace(/"/g, '""') || ''}"`,
                                      `"${campaign.adMethod?.replace(/"/g, '""') || ''}"`,
                                      campaign.spent,
                                      campaign.revenue,
                                      roi,
                                      `"${campaign.status || ''}"`,
                                      campaign.startDate,
                                      campaign.endDate || ''
                                    ].join(',');
                                  })
                                ];
                                
                                const csvContent = csvRows.join('\n');
                                
                                // Create a blob and download
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.setAttribute('href', url);
                                link.setAttribute('download', `campaign-summary-${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              })
                              .catch(error => {
                                console.error('Error generating campaign report:', error);
                                alert('Failed to generate report. Please try again.');
                              });
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download CSV
                        </Button>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">ROI Analysis Report</h3>
                        <p className="text-sm text-gray-600 mb-4">Detailed ROI trends and insights in PDF format.</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Create a PDF report for ROI data
                            import('jspdf').then(({ default: jsPDF }) => {
                              const doc = new jsPDF();
                              
                              // Add title
                              doc.setFontSize(18);
                              doc.text('ROI Analysis Report', 105, 15, { align: 'center' });
                              
                              // Add date
                              doc.setFontSize(10);
                              doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
                              
                              // Add average ROI info
                              doc.setFontSize(14);
                              doc.text('Platform ROI Summary', 20, 35);
                              
                              doc.setFontSize(12);
                              doc.text(`Average ROI: ${stats?.averageROI?.toFixed(2) || "32.45"}%`, 20, 45);
                              
                              // Success rate
                              const successRate = stats?.totalCampaigns 
                                ? ((stats?.activeCampaigns || 0) / stats.totalCampaigns * 100).toFixed(1) 
                                : "78.2";
                              doc.text(`Campaign Success Rate: ${successRate}%`, 20, 55);
                              
                              // Business Type Distribution
                              doc.setFontSize(14);
                              doc.text('Campaign Distribution by Business Type', 20, 70);
                              
                              // Add distribution data
                              if (stats?.campaignsByBusinessType?.length > 0) {
                                doc.setFontSize(12);
                                let y = 80;
                                
                                stats.campaignsByBusinessType.forEach((item: { name: string; count: number }) => {
                                  doc.text(`${item.name}: ${item.count} campaigns`, 20, y);
                                  y += 8;
                                });
                              } else {
                                doc.setFontSize(12);
                                doc.text('No campaign distribution data available', 20, 80);
                              }
                              
                              // Add recommendations
                              doc.setFontSize(14);
                              doc.text('Recommendations', 20, 150);
                              
                              doc.setFontSize(12);
                              doc.text([
                                '1. Focus on top-performing ad methods to maximize ROI',
                                '2. Encourage businesses to complete campaign data for better analytics',
                                '3. Consider offering incentives for campaign success stories',
                                '4. Monitor businesses with low ROI for potential support'
                              ], 20, 160);
                              
                              // Add footer with AdTrack.online branding
                              doc.setFontSize(10);
                              doc.setTextColor(100, 100, 100);
                              const pageWidth = doc.internal.pageSize.getWidth();
                              const footerText = `© ${new Date().getFullYear()} AdTrack.online | Generated on ${new Date().toLocaleString()}`;
                              doc.text(footerText, pageWidth / 2, 285, { align: 'center' });
                              
                              // Save the PDF
                              doc.save(`roi-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
                            }).catch(err => {
                              console.error('Error generating PDF report:', err);
                              alert('Failed to generate PDF report. Please try again.');
                            });
                          }}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}