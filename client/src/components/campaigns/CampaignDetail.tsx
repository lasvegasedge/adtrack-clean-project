import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CloneCampaignButton from "./CloneCampaignButton";

interface CampaignDetailProps {
  campaignId: number;
}

export default function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const [, setLocation] = useLocation();

  const { data: campaign, isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  const { data: topPerformers, isLoading: isLoadingComparison } = useQuery({
    queryKey: [
      '/api/top-performers', 
      campaign?.business?.businessType, 
      campaign?.adMethodId, 
      campaign?.business?.latitude || 0, 
      campaign?.business?.longitude || 0, 
      3, // 3 mile radius
      20 // Show top 20
    ],
    enabled: !!campaign?.business?.businessType && !!campaign?.adMethodId 
      && !!campaign?.business?.latitude && !!campaign?.business?.longitude,
  });

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-20" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          
          <Skeleton className="h-48 mb-6" />
          <Skeleton className="h-32 mb-6" />
          
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaign) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">Campaign not found</p>
          <Button onClick={() => setLocation("/campaigns")}>
            Back to Campaigns
          </Button>
        </CardContent>
      </Card>
    );
  }

  const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

  // Calculate performance rank
  const performanceRank = topPerformers?.findIndex(
    p => p.id === campaign.id
  );
  
  const totalBusinesses = topPerformers?.length || 0;

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{campaign.adMethod?.name}</h3>
            <p className="text-sm text-gray-600">
              {startDate ? format(startDate, 'MMM d, yyyy') : ''} 
              {endDate ? ` - ${format(endDate, 'MMM d, yyyy')}` : ''}
            </p>
          </div>
          <Badge 
            variant={campaign.isActive ? "success" : "outline"}
            className={campaign.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}
          >
            {campaign.isActive ? 'Active' : 'Completed'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Amount Spent</p>
            <p className="text-xl font-medium">
              ${Number(campaign.amountSpent).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount Earned</p>
            <p className="text-xl font-medium">
              ${campaign.amountEarned ? Number(campaign.amountEarned).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ROI</p>
            <p className={`text-xl font-medium ${campaign.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {campaign.roi ? campaign.roi.toFixed(1) : 'N/A'}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Area Ranking</p>
            <p className="text-xl font-medium">
              {performanceRank !== undefined && performanceRank >= 0 
                ? `#${performanceRank + 1} of ${totalBusinesses}` 
                : 'N/A'}
            </p>
          </div>
        </div>
        
        {campaign.fileUrl && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Advertisement Preview</h4>
            <div className="border rounded-lg overflow-hidden">
              {campaign.fileUrl.endsWith('.pdf') ? (
                <div className="h-48 flex items-center justify-center bg-gray-100">
                  <a 
                    href={campaign.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View PDF Document
                  </a>
                </div>
              ) : (
                <img 
                  src={campaign.fileUrl} 
                  alt="Advertisement" 
                  className="w-full h-48 object-contain bg-gray-50" 
                />
              )}
            </div>
          </div>
        )}
        
        {!isLoadingComparison && topPerformers && topPerformers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Performance Comparison</h4>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm mb-2">Your ROI compared to other similar businesses in your area:</p>
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ 
                    width: `${Math.min(
                      (performanceRank !== undefined && performanceRank >= 0 
                        ? 100 - (performanceRank / totalBusinesses * 100) 
                        : 0), 
                      100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>
                  Average: {topPerformers
                    .reduce((sum, p) => sum + p.roi, 0) / topPerformers.length
                    .toFixed(1)}%
                </span>
                <span>50%</span>
                <span>Max: {Math.max(...topPerformers.map(p => p.roi)).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-center"
            onClick={() => setLocation(`/add-campaign?edit=${campaignId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Campaign
          </Button>
          <CloneCampaignButton campaignId={campaignId} />
        </div>
      </CardContent>
    </Card>
  );
}
