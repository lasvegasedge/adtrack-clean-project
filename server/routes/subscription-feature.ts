import { Router } from 'express';
import { db } from '../db';
import { SQL, and, eq } from 'drizzle-orm';
import { features, featureAccess, subscriptionPlans, userSubscriptions } from '@shared/subscription-schema';
import { z } from 'zod';

const router = Router();

// Schema for track usage request
const trackUsageSchema = z.object({
  featureId: z.string(),
});

/**
 * Track feature usage
 * POST /api/subscription/track-usage
 */
router.post('/track-usage', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Validate request
    const { featureId } = trackUsageSchema.parse(req.body);
    
    // Check if the feature exists
    const [feature] = await db.select().from(features).where(eq(features.featureId, featureId));
    
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }
    
    // Get user's active subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, req.user.id),
          eq(userSubscriptions.isActive, true)
        )
      );
    
    if (!subscription) {
      return res.status(403).json({ message: 'No active subscription found' });
    }
    
    // Check if user has access to this feature
    const [accessLevel] = await db
      .select()
      .from(featureAccess)
      .where(
        and(
          eq(featureAccess.planId, subscription.planId),
          eq(featureAccess.featureId, featureId)
        )
      );
    
    if (!accessLevel || accessLevel.level === 'none') {
      return res.status(403).json({ message: 'Access denied to this feature' });
    }
    
    // Check usage limits for limited access
    if (accessLevel.level === 'limited' && accessLevel.usageLimit) {
      // Get current usage for this billing period
      const currentPeriodStart = subscription.currentPeriodStart || subscription.createdAt;
      
      // Get or create usage record
      const [usageRecord] = await db.execute(SQL`
        INSERT INTO feature_usage (user_id, feature_id, subscription_id, usage_count, period_start)
        VALUES (${req.user.id}, ${featureId}, ${subscription.id}, 1, ${currentPeriodStart})
        ON CONFLICT (user_id, feature_id, period_start)
        DO UPDATE SET usage_count = feature_usage.usage_count + 1
        RETURNING *
      `);
      
      // Check if usage limit is exceeded
      if (usageRecord.usage_count > accessLevel.usageLimit) {
        return res.status(403).json({ 
          message: 'Usage limit exceeded',
          limit: accessLevel.usageLimit,
          used: usageRecord.usage_count 
        });
      }
    }
    
    // Usage tracking successful
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return res.status(500).json({ message: 'Failed to track feature usage' });
  }
});

/**
 * Get feature usage
 * GET /api/subscription/usage
 */
router.get('/usage', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Get user's active subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, req.user.id),
          eq(userSubscriptions.isActive, true)
        )
      );
    
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
    
    // Get current usage for this billing period
    const currentPeriodStart = subscription.currentPeriodStart || subscription.createdAt;
    const usageRecords = await db.execute(SQL`
      SELECT feature_id, usage_count 
      FROM feature_usage 
      WHERE user_id = ${req.user.id} 
      AND period_start = ${currentPeriodStart}
    `);
    
    // Build response with feature usage information
    const featuresWithUsage = {};
    
    allFeatures.forEach(feature => {
      const access = accessLevels.find(a => a.featureId === feature.featureId);
      const usage = usageRecords.find(u => u.feature_id === feature.featureId);
      
      featuresWithUsage[feature.featureId] = {
        featureId: feature.featureId,
        name: feature.name,
        description: feature.description,
        used: usage ? usage.usage_count : 0,
        limit: access && access.level === 'limited' ? access.usageLimit : null,
        level: access ? access.level : 'none'
      };
    });
    
    return res.status(200).json({ features: featuresWithUsage });
  } catch (error) {
    console.error('Error getting feature usage:', error);
    return res.status(500).json({ message: 'Failed to get feature usage' });
  }
});

/**
 * Check feature access
 * GET /api/subscription/check-access/:featureId
 */
router.get('/check-access/:featureId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { featureId } = req.params;
    
    // Check if the feature exists
    const [feature] = await db.select().from(features).where(eq(features.featureId, featureId));
    
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }
    
    // Get user's active subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, req.user.id),
          eq(userSubscriptions.isActive, true)
        )
      );
    
    if (!subscription) {
      return res.status(200).json({ 
        hasAccess: false,
        level: 'none',
        message: 'No active subscription found'
      });
    }
    
    // Get subscription plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId));
    
    // Check if user has access to this feature
    const [accessLevel] = await db
      .select()
      .from(featureAccess)
      .where(
        and(
          eq(featureAccess.planId, subscription.planId),
          eq(featureAccess.featureId, featureId)
        )
      );
    
    if (!accessLevel || accessLevel.level === 'none') {
      return res.status(200).json({ 
        hasAccess: false,
        level: 'none',
        message: `Upgrade to a higher plan to access this feature`,
        planName: plan?.name
      });
    }
    
    // For limited access, check usage limits
    if (accessLevel.level === 'limited' && accessLevel.usageLimit) {
      // Get current usage for this billing period
      const currentPeriodStart = subscription.currentPeriodStart || subscription.createdAt;
      const [usageRecord] = await db.execute(SQL`
        SELECT usage_count 
        FROM feature_usage 
        WHERE user_id = ${req.user.id} 
        AND feature_id = ${featureId}
        AND period_start = ${currentPeriodStart}
      `);
      
      const currentUsage = usageRecord ? usageRecord.usage_count : 0;
      
      // Check if usage limit is exceeded
      if (currentUsage >= accessLevel.usageLimit) {
        return res.status(200).json({ 
          hasAccess: false,
          level: 'limited',
          message: 'Usage limit exceeded',
          limit: accessLevel.usageLimit,
          used: currentUsage,
          planName: plan?.name
        });
      }
      
      // Has access but limited
      return res.status(200).json({ 
        hasAccess: true,
        level: 'limited',
        limit: accessLevel.usageLimit,
        used: currentUsage,
        remaining: accessLevel.usageLimit - currentUsage,
        planName: plan?.name
      });
    }
    
    // Full access
    return res.status(200).json({ 
      hasAccess: true,
      level: 'full',
      planName: plan?.name
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    return res.status(500).json({ message: 'Failed to check feature access' });
  }
});

export default router;