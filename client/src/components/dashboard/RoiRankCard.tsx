import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BusinessCampaignWithROI } from "@shared/schema";

export default function RoiRankCard() {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const [, setLocation] = useLocation();

  const { data: campaigns, isLoading } = useQuery<BusinessCampaignWithROI[]>({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
  });

  // Find the best performing campaign
  const bestCampaign = campaigns?.sort((a, b) => b.roi - a.roi)[0];

  if (isLoading) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Your ROI Ranking</CardTitle>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 mb-4" />
          <Skeleton className="h-12 mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!bestCampaign) {
    return (
      <Card className="bg-white mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Your ROI Ranking</CardTitle>
            <Button 
              variant="link" 
              className="text-primary text-sm" 
              onClick={() => setLocation('/add-campaign')}
            >
              Create First Campaign <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-gray-500">
              You haven't created any campaigns yet. Start tracking your advertisement performance by creating your first campaign.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/add-campaign')}
            >
              Add New Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Your ROI Ranking</CardTitle>
          <Button 
            variant="link" 
            className="text-primary text-sm" 
            onClick={() => setLocation('/compare')}
          >
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Best Campaign</p>
              <h4 className="font-medium">{bestCampaign.adMethod?.name}</h4>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-lg font-medium text-green-600">{bestCampaign.roi.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <div className="bg-gray-100 h-10 rounded-full w-full relative">
            <div className="absolute inset-0 flex items-center px-4">
              <div className="w-full flex justify-between text-xs text-gray-700">
                <span>0%</span>
                <span>Local Average: {bestCampaign.areaRank ? '22.1%' : 'N/A'}</span>
                <span>50%</span>
              </div>
            </div>
            <div 
              className="bg-green-500 h-10 rounded-full" 
              style={{ width: `${Math.min(bestCampaign.roi, 50) * 2}%` }}
            >
              <div className="flex h-full items-center justify-end pr-4">
                <span className="text-white text-xs font-medium">
                  You: {bestCampaign.roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm mt-4 text-gray-600">
          {bestCampaign.areaRank 
            ? `You're outperforming ${Math.floor((1 - bestCampaign.areaRank / bestCampaign.totalInArea!) * 100)}% of similar businesses in your area with ${bestCampaign.adMethod?.name} advertising.`
            : `Create more campaigns to see how you compare to similar businesses in your area.`
          }
        </p>
      </CardContent>
    </Card>
  );
}
