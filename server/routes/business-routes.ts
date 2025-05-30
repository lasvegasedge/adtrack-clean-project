import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Ensure Express.User has the required properties
declare global {
  namespace Express {
    interface User {
      id: number;
      isAdmin: boolean;
    }
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const businessRouter = Router();

// Get business for a specific user
businessRouter.get('/user/:userId/business', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    
    // Only allow users to access their own business data unless they're an admin
    // @ts-ignore - We know req.user exists because of the requireAuth middleware
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access to business data' });
    }
    
    const business = await storage.getBusinessByUserId(userId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found for this user' });
    }
    
    res.json(business);
  } catch (error) {
    console.error('Error fetching business for user:', error);
    res.status(500).json({ error: 'Failed to fetch business data' });
  }
});

// Get business by ID
businessRouter.get('/business/:id', requireAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.id);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    
    const business = await storage.getBusiness(businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Check if user has access to this business (either it's theirs or they're an admin)
    if (business.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access to business data' });
    }
    
    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business data' });
  }
});

// Update business
businessRouter.put('/business/:id', requireAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.params.id);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    
    const business = await storage.getBusiness(businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Check if user has permission to update this business
    if (business.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access to update business data' });
    }
    
    const updatedBusiness = await storage.updateBusiness(businessId, req.body);
    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business data' });
  }
});