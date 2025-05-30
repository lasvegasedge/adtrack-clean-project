import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Copy, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
// Define interfaces based on DB schema
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
  areaRank?: number;
  totalInArea?: number;
}

// Define business interface based on DB schema
interface Business {
  id: number;
  name: string;
  businessType: string;
  address: string;
  zipCode: string;
  [key: string]: any; // For any other properties
}

export default function CampaignsList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  
  // First fetch the business for the user
  const { data: business, isLoading: isLoadingBusiness } = useQuery<Business>({
    queryKey: [`/api/user/${user?.id}/business`],
    enabled: !!user?.id,
    retry: 3, // Retry up to 3 times
  });
  
  const businessId = business?.id;

  // Then fetch campaigns with ROI data for that business
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
    retry: 3, // Retry up to 3 times
  });

  const filteredCampaigns = campaigns?.filter((campaign: BusinessCampaignWithROI) => {
    if (filter === "all") return true;
    return filter === "active" ? campaign.isActive : !campaign.isActive;
  });

  // Sort campaigns by date (newest first)
  const sortedCampaigns = filteredCampaigns?.sort((a: BusinessCampaignWithROI, b: BusinessCampaignWithROI) => {
    // Use a safe date parsing approach to handle potential null/undefined values
    const getDateValue = (campaign: BusinessCampaignWithROI): number => {
      if (!campaign.createdAt) return Date.now(); // Default to current time if no date
      try {
        return new Date(campaign.createdAt).getTime();
      } catch {
        return Date.now(); // Fallback to current time if parsing fails
      }
    };
    
    return getDateValue(b) - getDateValue(a);
  });

  // Limit to 3 campaigns for display
  const displayCampaigns = sortedCampaigns?.slice(0, 3);

  const handleViewCampaign = (id: number) => {
    setLocation(`/campaigns/${id}`);
  };

  const handleEditCampaign = (id: number) => {
    setLocation(`/campaigns/${id}`);
  };

  // Check for any loading state
  if (isLoadingBusiness || isLoadingCampaigns) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Recent Campaigns</CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 pb-4 mb-4">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <div className="relative">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="text-sm bg-gray-100 border-none rounded-full">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!displayCampaigns?.length ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No campaigns found</p>
            <Button onClick={() => setLocation('/add-campaign')}>
              Add New Campaign
            </Button>
          </div>
        ) : (
          <>
            {displayCampaigns.map((campaign: BusinessCampaignWithROI) => {
              const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
              const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
              
              return (
                <div key={campaign.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{campaign.adMethod?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {startDate ? format(startDate, 'MMM d, yyyy') : ''} 
                        {endDate ? ` - ${format(endDate, 'MMM d, yyyy')}` : ''}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={campaign.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}
                    >
                      {campaign.isActive ? 'Active' : 'Completed'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-600">Spent</p>
                      <p className="text-sm font-medium">
                        ${Number(campaign.amountSpent).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Earned</p>
                      <p className="text-sm font-medium">
                        ${campaign.amountEarned ? Number(campaign.amountEarned).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">ROI</p>
                      <p className={`text-sm font-medium ${campaign.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {campaign.roi ? campaign.roi.toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Area Rank</p>
                      <p className="text-sm font-medium">
                        {campaign.areaRank ? `#${campaign.areaRank} of ${campaign.totalInArea}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex mt-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary p-0 h-auto"
                      onClick={() => handleViewCampaign(campaign.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Ad
                    </Button>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary p-0 h-auto ml-4"
                      onClick={() => handleEditCampaign(campaign.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
            
            <Button 
              variant="outline" 
              className="mt-4 w-full" 
              onClick={() => setLocation('/campaigns')}
            >
              <Plus className="h-4 w-4 mr-1" />
              View All Campaigns
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
