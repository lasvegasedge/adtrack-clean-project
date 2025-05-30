import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Edit2, Eye, TrendingUp, TrendingDown, Ban } from 'lucide-react';
import { Campaign } from '@shared/schema';
import CampaignShareButton from './CampaignShareButton';
import { formatCurrency, formatPercent, formatDate, calculateROI } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  adMethodName?: string;
}

export default function CampaignCard({ campaign, adMethodName }: CampaignCardProps) {
  const [_, navigate] = useLocation();
  
  const statusColor = {
    active: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
    draft: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const getStatusClass = (status: string) => {
    return statusColor[status.toLowerCase() as keyof typeof statusColor] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <TrendingUp className="h-4 w-4" />;
      case 'completed':
        return <Eye className="h-4 w-4" />;
      case 'paused':
        return <Ban className="h-4 w-4" />;
      default:
        return <Edit2 className="h-4 w-4" />;
    }
  };

  // Get campaign status from isActive field
  const getCampaignStatus = (): string => {
    if (campaign.isActive === null) return 'draft';
    if (campaign.isActive === true) return 'active';
    return 'completed';
  };
  
  // Calculate ROI based on amount spent and earned
  const getROI = (): number => {
    if (!campaign.amountEarned) return 0;
    
    const spent = parseFloat(campaign.amountSpent);
    const earned = parseFloat(campaign.amountEarned);
    
    return calculateROI(spent, earned);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-medium line-clamp-2">{campaign.name}</CardTitle>
          <Badge className={`${getStatusClass(getCampaignStatus())} shrink-0`}>
            <span className="flex items-center gap-1">
              {getStatusIcon(getCampaignStatus())}
              {getCampaignStatus()}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <CalendarIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {formatDate(campaign.startDate)} - {campaign.endDate ? formatDate(campaign.endDate) : 'Present'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-3 flex-grow px-3 sm:px-6">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Ad Spend</span>
            <span className="text-sm sm:text-base font-medium">{formatCurrency(parseFloat(campaign.amountSpent))}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Revenue</span>
            <span className="text-sm sm:text-base font-medium">
              {campaign.amountEarned ? formatCurrency(parseFloat(campaign.amountEarned)) : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">ROI</span>
            <div className="flex items-center">
              {campaign.amountEarned ? (
                <>
                  <span className={`text-sm sm:text-base font-medium ${getROI() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(getROI())}
                  </span>
                  {getROI() >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 ml-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 ml-1" />
                  )}
                </>
              ) : (
                <span className="text-sm sm:text-base font-medium text-gray-500">N/A</span>
              )}
            </div>
          </div>
        </div>
        
        {adMethodName && (
          <div className="mt-3">
            <span className="text-xs text-gray-500">Ad Method:</span>
            <span className="ml-1 text-xs sm:text-sm">{adMethodName}</span>
          </div>
        )}
        
        {campaign.description && (
          <p className="mt-3 text-xs sm:text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between px-3 sm:px-6">
        <Button
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm h-8 px-2 sm:px-3"
          onClick={() => navigate(`/campaigns/${campaign.id}`)}
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Details
        </Button>
        
        <CampaignShareButton campaign={campaign} />
      </CardFooter>
    </Card>
  );
}