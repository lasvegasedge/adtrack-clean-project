import { storage } from './storage';
import { Campaign } from '@shared/schema';

// Interface for business statistics
export interface BusinessStats {
  activeCampaigns: number;
  averageRoi: number;
  totalSpent: number;
  totalEarned: number;
}

// Calculate business statistics from campaigns
export async function calculateBusinessStats(businessId: number): Promise<BusinessStats> {
  // Get all campaigns for this business
  const campaigns = await storage.getCampaigns(businessId);
  
  // Calculate active campaigns
  const activeCampaigns = campaigns.filter(campaign => campaign.isActive).length;
  
  // Calculate totals and ROI
  let totalSpent = 0;
  let totalEarned = 0;
  let roiValues: number[] = [];
  
  campaigns.forEach(campaign => {
    // Parse numeric values
    const amountSpent = parseFloat(campaign.amountSpent?.toString() || '0');
    const amountEarned = parseFloat(campaign.amountEarned?.toString() || '0');
    
    // Add to totals
    totalSpent += amountSpent;
    totalEarned += amountEarned;
    
    // Calculate ROI for this campaign if it has both values
    if (amountSpent > 0 && amountEarned > 0) {
      const roi = storage.calculateROI(campaign);
      roiValues.push(roi);
    }
  });
  
  // Calculate average ROI
  const averageRoi = roiValues.length > 0 
    ? roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length 
    : 0;
  
  return {
    activeCampaigns,
    averageRoi,
    totalSpent,
    totalEarned
  };
}