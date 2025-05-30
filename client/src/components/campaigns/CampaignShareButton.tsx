import React from 'react';
import { Button } from "@/components/ui/button";
import { Share } from 'lucide-react';
import { Campaign } from '@shared/schema';
import SocialMediaShare from '../share/SocialMediaShare';
import { calculateROI, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface CampaignShareButtonProps {
  campaign: Campaign;
}

interface BusinessData {
  id: number;
  name: string;
  userId: number;
  [key: string]: any;
}

export default function CampaignShareButton({ campaign }: CampaignShareButtonProps) {
  // Fetch business info to include in sharing
  const { data: business } = useQuery<BusinessData>({
    queryKey: [`/api/business/${campaign.businessId}`],
    enabled: !!campaign.businessId,
  });
  
  // Get ROI using the shared utility function
  const getROI = (): number => {
    if (!campaign.amountEarned) return 0;
    
    const spent = parseFloat(campaign.amountSpent);
    const earned = campaign.amountEarned ? parseFloat(campaign.amountEarned) : 0;
    
    return calculateROI(spent, earned);
  };
  
  // Prepare data to be shared
  const shareData = {
    campaignName: campaign.name,
    roi: getROI(),
    adSpend: parseFloat(campaign.amountSpent),
    revenue: campaign.amountEarned ? parseFloat(campaign.amountEarned) : undefined,
    businessName: business?.name,
    startDate: typeof campaign.startDate === 'string' ? campaign.startDate : formatDate(campaign.startDate),
    endDate: campaign.endDate ? (typeof campaign.endDate === 'string' ? campaign.endDate : formatDate(campaign.endDate)) : undefined
  };
  
  return (
    <SocialMediaShare 
      data={shareData} 
      variant="button" 
      text={
        <span className="flex items-center">
          <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="text-xs sm:text-sm">Share</span>
        </span>
      }
      buttonClassName="h-8 px-2 sm:px-3"
    />
  );
}