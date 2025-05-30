import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { generateMarketingInsights } from '../marketingInsights';

// Create a simple middleware for authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const marketingInsightsRouter = Router();

// Marketing insights endpoint
marketingInsightsRouter.post('/marketing-insights', requireAuth, async (req, res) => {
  try {
    console.log('Marketing insights route hit!', req.body);
    
    const { insightType } = req.body;
    
    if (!insightType) {
      return res.status(400).json({ error: 'Insight type is required' });
    }

    // Get user's business data
    const business = await storage.getBusinessByUserId(req.user!.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get campaigns for the business
    const campaigns = await storage.getCampaigns(business.id);

    // Get business stats
    const stats = await storage.getBusinessStats(business.id);

    // Get ad methods
    const adMethods = await storage.getAdMethods();

    // Construct the request object
    const insightRequest = {
      businessName: business.name,
      businessType: business.businessType,
      campaigns: campaigns,
      userMetrics: {
        averageRoi: stats.averageRoi,
        totalSpent: stats.totalSpent,
        totalEarned: stats.totalEarned,
        activeCampaigns: stats.activeCampaigns,
        totalCampaigns: campaigns.length
      },
      adMethods: adMethods,
      insightType: insightType
    };

    // Generate insights
    const insights = await generateMarketingInsights(insightRequest);

    res.json(insights);
  } catch (error) {
    console.error('Error generating marketing insights:', error);
    res.status(500).json({ error: 'Failed to generate marketing insights' });
  }
});