import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';

// Create a simple middleware for authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const campaignRouter = Router();

// Get all campaigns for a business
campaignRouter.get('/business/:businessId/campaigns', requireAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    const campaigns = await storage.getCampaigns(businessId);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaigns with ROI data for a business
campaignRouter.get('/business/:businessId/campaigns/roi', requireAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    const campaigns = await storage.getCampaignsWithROI(businessId);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns with ROI:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns with ROI' });
  }
});

// Get business statistics
campaignRouter.get('/business/:businessId/stats', requireAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    // Import the business stats calculator
    const { calculateBusinessStats } = await import('../business-stats');
    const stats = await calculateBusinessStats(businessId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching business stats:', error);
    res.status(500).json({ error: 'Failed to fetch business statistics' });
  }
});

// Get campaign details
campaignRouter.get('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const campaign = await storage.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Get top performers in an area
campaignRouter.get('/top-performers', requireAuth, async (req, res) => {
  try {
    // Since we don't have a direct area-based method, we'll use the general top performers
    const topPerformers = await storage.getTopPerformers();
    res.json(topPerformers);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});