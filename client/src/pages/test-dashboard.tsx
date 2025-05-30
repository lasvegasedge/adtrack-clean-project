import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BusinessCampaignWithROI {
  id: number;
  name?: string;
  adMethod?: { id: number; name: string };
  startDate?: string;
  endDate?: string;
  amountSpent: string;
  amountEarned?: string;
  isActive: boolean;
  createdAt?: string;
  roi: number;
}

interface BusinessStats {
  activeCampaigns: number;
  averageRoi: number;
  totalSpent: number;
  totalEarned: number;
}

export default function TestDashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<{ id: number; name: string } | null>(null);
  const [campaigns, setCampaigns] = useState<BusinessCampaignWithROI[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user?.id) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        // Step 1: Get user's business
        const businessRes = await fetch(`/api/user/${user.id}/business`);
        if (!businessRes.ok) throw new Error("Failed to fetch business data");
        const businessData = await businessRes.json();
        setBusiness(businessData);

        // Step 2: Get campaigns with ROI data
        const campaignsRes = await fetch(`/api/business/${businessData.id}/campaigns/roi`);
        if (!campaignsRes.ok) throw new Error("Failed to fetch campaign data");
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);

        // Step 3: Get business stats
        const statsRes = await fetch(`/api/business/${businessData.id}/stats`);
        if (!statsRes.ok) throw new Error("Failed to fetch business stats");
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard Test</h1>
        <p>Please log in to view dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Data Test</h1>
      
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-600">Error: {error}</p>
          <Button 
            className="mt-2" 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2">User Info</h2>
          <Card className="mb-6">
            <CardContent className="p-4">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Business ID:</strong> {business?.id}</p>
              <p><strong>Business Name:</strong> {business?.name}</p>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mb-2">Business Stats</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">Active Campaigns</h3>
                <p className="text-2xl font-medium">{stats?.activeCampaigns || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">Average ROI</h3>
                <p className={`text-2xl font-medium ${(stats?.averageRoi || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.averageRoi.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">Total Spent</h3>
                <p className="text-2xl font-medium">
                  ${stats?.totalSpent.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">Total Earned</h3>
                <p className="text-2xl font-medium">
                  ${stats?.totalEarned.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mb-2">Campaigns ({campaigns.length})</h2>
          {campaigns.length === 0 ? (
            <p>No campaigns found.</p>
          ) : (
            <div className="grid gap-4">
              {campaigns.map(campaign => (
                <Card key={campaign.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{campaign.name || `Campaign #${campaign.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-600">Amount Spent</p>
                        <p className="font-medium">${parseFloat(campaign.amountSpent).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount Earned</p>
                        <p className="font-medium">${parseFloat(campaign.amountEarned || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ROI</p>
                        <p className={`font-medium ${campaign.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {campaign.roi}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`font-medium ${campaign.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}