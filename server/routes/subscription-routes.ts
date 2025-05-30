import { Router } from 'express';
import { 
  checkFeatureAccess, 
  checkUsageQuota, 
  incrementUsage,
  getActiveSubscription
} from '../middleware/subscription-middleware';
import { db } from '../db';
import { features, featureInteractions, featureAccess, subscriptionPlans, userSubscriptions } from '@shared/subscription-schema';
import { eq, and, SQL } from 'drizzle-orm';

export const subscriptionRouter = Router();

// GET /api/subscription/usage
subscriptionRouter.get('/usage', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Get user's active subscription
    const subscription = await getActiveSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(403).json({ message: 'No active subscription found' });
    }

    // Get all features
    const allFeatures = await db.select().from(features);
    
    // Get access levels for the subscription plan
    const accessLevels = await db
      .select()
      .from(featureAccess)
      .where(eq(featureAccess.planId, subscription.planId));
    
    // Get current usage data
    const usageData = await checkUsageQuota(req.user.id);
    
    // Build response with feature usage information
    const featuresWithUsage = {};
    
    allFeatures.forEach(feature => {
      const access = accessLevels.find(a => a.featureId === feature.id);
      const usage = usageData[feature.featureId];
      
      featuresWithUsage[feature.key] = {
        featureId: feature.key, // Keep featureId in response for backward compatibility
        name: feature.name,
        description: feature.description,
        used: usage?.current || 0,
        limit: (access && access.accessLevel === 'limited') ? 
          (access.limitations?.usageLimit || null) : 
          null,
        level: access ? access.accessLevel : 'none'
      };
    });
    
    return res.status(200).json({ features: featuresWithUsage });
  } catch (error) {
    console.error('Error getting feature usage:', error);
    return res.status(500).json({ message: 'Failed to get feature usage' });
  }
});

// POST /api/subscription/track-usage
subscriptionRouter.post('/track-usage', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { featureId } = req.body;
    
    if (!featureId) {
      return res.status(400).json({ message: 'Feature ID is required' });
    }
    
    // Increment feature usage
    await incrementUsage(req.user.id, featureId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return res.status(500).json({ message: 'Failed to track feature usage' });
  }
});

// Get feature access information
subscriptionRouter.get('/feature-access/:featureId', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      hasAccess: false
    });
  }

  const { featureId } = req.params;
  const userId = req.user.id;

  try {
    // Get user's active subscription
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
      return res.json({
        hasAccess: false,
        accessLevel: 'none',
        limitations: null,
        usageCount: 0,
        usageLimit: null,
        resetDate: null,
        message: 'You need an active subscription to access this feature'
      });
    }

    // Check feature access for this plan
    const accessResult = await checkFeatureAccess(subscription.planId, featureId);
    
    // For features with access, check usage quotas
    if (accessResult.hasAccess) {
      const usageStatus = await checkUsageQuota(userId, featureId);
      
      return res.json({
        ...accessResult,
        usageCount: usageStatus.current,
        usageLimit: usageStatus.limit,
        resetDate: usageStatus.resetDate,
      });
    }
    
    return res.json(accessResult);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to check feature access'
    });
  }
});

// Track feature interaction
subscriptionRouter.post('/feature-interaction', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const { featureId, interactionType } = req.body;
  
  if (!featureId || !interactionType) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'featureId and interactionType are required'
    });
  }

  try {
    // Get the feature ID from the feature identifier
    const [featureRecord] = await db
      .select()
      .from(features)
      .where(eq(features.featureId, featureId))
      .limit(1);
    
    if (!featureRecord) {
      return res.status(404).json({
        error: 'Feature not found',
        message: `Feature ${featureId} not found`
      });
    }
    
    // Record the interaction
    await db
      .insert(featureInteractions)
      .values({
        userId: req.user.id,
        featureId: featureRecord.id,
        interactionType,
        timestamp: new Date()
      });
    
    // If this is a 'use' interaction, increment usage counter
    if (interactionType === 'use') {
      await incrementUsage(req.user.id, featureId);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking feature interaction:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to track feature interaction'
    });
  }
});

// Get user's subscription details
subscriptionRouter.get('/subscription', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  try {
    const subscription = await getActiveSubscription(req.user.id);
    
    if (!subscription) {
      return res.json({
        hasSubscription: false,
        message: 'No active subscription found'
      });
    }
    
    return res.json({
      hasSubscription: true,
      ...subscription
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch subscription details'
    });
  }
});