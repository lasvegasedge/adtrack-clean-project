import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, FilterX } from 'lucide-react';
import SocialMediaShare from '@/components/share/SocialMediaShare';
import { Campaign } from '@shared/schema';

// Define types for our data structures
interface AdMethod {
  id: number;
  name: string;
}

interface BusinessStats {
  averageRoi: number;
  totalSpent: number;
  totalEarned: number;
  [key: string]: any; // For any other properties
}

interface Business {
  id: number;
  name: string;
  [key: string]: any; // For any other properties
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adMethodFilter, setAdMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get the user's business ID
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['/api/business', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/user/${user?.id}/business`);
      if (!res.ok) throw new Error('Failed to load business data');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Get all campaigns for the business
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['/api/business/campaigns', business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${business?.id}/campaigns`);
      if (!res.ok) throw new Error('Failed to load campaigns');
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Get all ad methods
  const { data: adMethods, isLoading: isLoadingAdMethods } = useQuery({
    queryKey: ['/api/ad-methods'],
    queryFn: async () => {
      const res = await fetch('/api/ad-methods');
      if (!res.ok) throw new Error('Failed to load ad methods');
      return res.json();
    },
  });

  // Get business stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/business/stats', business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${business?.id}/stats`);
      if (!res.ok) throw new Error('Failed to load business stats');
      return res.json();
    },
    enabled: !!business?.id,
  });

  const isLoading = isLoadingBusiness || isLoadingCampaigns || isLoadingAdMethods || isLoadingStats;

  // Helper function to get status from isActive field
  const getCampaignStatus = (campaign: Campaign): string => {
    if (campaign.isActive === null) return 'draft';
    if (campaign.isActive === true) return 'active';
    return 'completed';
  };

  // Filter campaigns based on status, ad method, and search term
  const filteredCampaigns = (): Campaign[] => {
    if (!campaigns) return [];
    
    return campaigns.filter((campaign: Campaign) => {
      // Get the status for the campaign
      const campaignStatus = getCampaignStatus(campaign);
      
      // Status filter
      const statusMatch = statusFilter === 'all' || campaignStatus === statusFilter.toLowerCase();
      
      // Ad method filter
      const adMethodMatch = adMethodFilter === 'all' || campaign.adMethodId.toString() === adMethodFilter;
      
      // Search term filter
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = !searchTerm || 
        campaign.name.toLowerCase().includes(searchTermLower) || 
        (campaign.description && campaign.description.toLowerCase().includes(searchTermLower));
      
      return statusMatch && adMethodMatch && searchMatch;
    });
  };

  // Group campaigns by status
  const activeCampaigns = campaigns ? campaigns.filter((c: Campaign) => getCampaignStatus(c) === 'active') : [];
  const completedCampaigns = campaigns ? campaigns.filter((c: Campaign) => getCampaignStatus(c) === 'completed') : [];
  const draftCampaigns = campaigns ? campaigns.filter((c: Campaign) => 
    getCampaignStatus(c) === 'draft' || getCampaignStatus(c) === 'paused'
  ) : [];

  // Helper function to get ad method name
  const getAdMethodName = (adMethodId: number): string => {
    if (!adMethods) return '';
    const method = adMethods.find((m: AdMethod) => m.id === adMethodId);
    return method ? method.name : '';
  };

  // Prepare shareable data for all campaigns
  const getOverallShareData = () => {
    if (!campaigns || !stats) return {
      campaignName: "Campaign Performance",
      roi: 0,
      adSpend: 0,
      revenue: 0,
      businessName: business?.name
    };

    return {
      campaignName: "Overall Campaign Performance",
      roi: stats.averageRoi || 0,
      adSpend: stats.totalSpent || 0,
      revenue: stats.totalEarned || 0,
      businessName: business?.name
    };
  };

  return (
    <AppLayout title="Campaigns">
      <div className="space-y-4 sm:space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Manage and track your advertising campaigns
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <SocialMediaShare data={getOverallShareData()} text="Share Results" />
            
            <Button onClick={() => navigate('/add-campaign')} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-1" />
              New Campaign
            </Button>
          </div>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 sm:gap-4 items-end">
              <div className="space-y-1 w-full lg:min-w-[200px] lg:flex-1">
                <label htmlFor="search" className="text-sm font-medium">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search campaigns..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 w-full sm:w-auto">
                <label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full sm:w-auto">
                <label htmlFor="admethod-filter" className="text-sm font-medium">
                  Ad Method
                </label>
                <Select value={adMethodFilter} onValueChange={setAdMethodFilter}>
                  <SelectTrigger id="admethod-filter">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {adMethods?.map((method: AdMethod) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(statusFilter !== 'all' || adMethodFilter !== 'all' || searchTerm) && (
                <div className="flex items-end sm:justify-end lg:justify-start w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('all');
                      setAdMethodFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    <FilterX className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Campaigns list */}
            {statusFilter === 'all' && adMethodFilter === 'all' && !searchTerm ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 flex w-full overflow-x-auto">
                  <TabsTrigger value="all" className="whitespace-nowrap">All ({campaigns.length})</TabsTrigger>
                  <TabsTrigger value="active" className="whitespace-nowrap">Active ({activeCampaigns.length})</TabsTrigger>
                  <TabsTrigger value="completed" className="whitespace-nowrap">Completed ({completedCampaigns.length})</TabsTrigger>
                  <TabsTrigger value="draft" className="whitespace-nowrap">Draft ({draftCampaigns.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign: Campaign) => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        adMethodName={getAdMethodName(campaign.adMethodId)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="active">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeCampaigns.map((campaign: Campaign) => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        adMethodName={getAdMethodName(campaign.adMethodId)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="completed">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedCampaigns.map((campaign: Campaign) => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        adMethodName={getAdMethodName(campaign.adMethodId)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="draft">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {draftCampaigns.map((campaign: Campaign) => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        adMethodName={getAdMethodName(campaign.adMethodId)}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Filtered results
              <div>
                <h2 className="text-lg font-medium mb-4">
                  Filtered Results ({filteredCampaigns().length})
                </h2>
                {filteredCampaigns().length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCampaigns().map((campaign: Campaign) => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign}
                        adMethodName={getAdMethodName(campaign.adMethodId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-muted-foreground">
                      No campaigns match your current filters.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setStatusFilter('all');
                        setAdMethodFilter('all');
                        setSearchTerm('');
                      }}
                      className="mt-2"
                    >
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Empty state
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <h2 className="text-2xl font-bold mb-2">No Campaigns Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't created any campaigns yet. Create your first campaign to start tracking your advertising ROI.
            </p>
            <Button onClick={() => navigate('/add-campaign')}>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Campaign
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}