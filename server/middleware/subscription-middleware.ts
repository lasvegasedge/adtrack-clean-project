import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { 
  subscriptions, 
  subscriptionPlans, 
  features, 
  featureAccess, 
  featureUsage,
  featureInteractions,
  accessLevelEnum
} from '@shared/subscription-schema';
import { eq, and, gte } from 'drizzle-orm';
import { addDays } from 'date-fns';

/**
 * Interface for feature access result
 */
interface FeatureAccessResult {
  hasAccess: boolean;
  accessLevel: 'none' | 'limited' | 'full';
  limitations: Record<string, any> | null;
  usageCount: number;
  usageLimit: number | null;
  resetDate: Date | null;
  message: string;
}

/**
 * Get the active subscription for a user
 */
export async function getActiveSubscription(userId: number) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1);
  
  if (!subscription) return null;
  
  // Get the subscription plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);
  
  return { ...subscription, plan };
}

/**
 * Check if a feature is accessible for a given plan
 */
export async function checkFeatureAccess(planId: number, featureId: string): Promise<FeatureAccessResult> {
  // Get the feature ID from the feature identifier
  const [featureRecord] = await db
    .select()
    .from(features)
    .where(eq(features.featureId, featureId))
    .limit(1);
  
  if (!featureRecord) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      limitations: null,
      usageCount: 0,
      usageLimit: null,
      resetDate: null,
      message: `Feature ${featureId} not found`
    };
  }
  
  // Check the access level for this feature+plan combination
  const [accessRecord] = await db
    .select()
    .from(featureAccess)
    .where(
      and(
        eq(featureAccess.planId, planId),
        eq(featureAccess.featureId, featureRecord.id)
      )
    )
    .limit(1);
  
  if (!accessRecord) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      limitations: null,
      usageCount: 0,
      usageLimit: null,
      resetDate: null,
      message: 'Feature not included in your plan'
    };
  }
  
  // If access level is 'none', feature is not accessible
  if (accessRecord.accessLevel === 'none') {
    return {
      hasAccess: false,
      accessLevel: 'none',
      limitations: null,
      usageCount: 0,
      usageLimit: null,
      resetDate: null,
      message: 'Feature not included in your plan'
    };
  }
  
  // Feature is accessible (with possible limitations)
  return {
    hasAccess: true,
    accessLevel: accessRecord.accessLevel,
    limitations: accessRecord.limitations,
    usageCount: 0, // Will be filled by usage tracker
    usageLimit: accessRecord.limitations?.maxUsage || null,
    resetDate: null, // Will be filled by usage tracker
    message: accessRecord.accessLevel === 'full' 
      ? 'Full access' 
      : 'Limited access'
  };
}

/**
 * Check usage quota for a feature
 */
export async function checkUsageQuota(userId: number, featureId: string): Promise<{
  withinLimits: boolean;
  current: number;
  limit: number | null;
  resetDate: Date | null;
}> {
  // Get the feature ID from the feature identifier
  const [featureRecord] = await db
    .select()
    .from(features)
    .where(eq(features.featureId, featureId))
    .limit(1);
  
  if (!featureRecord) {
    return {
      withinLimits: false,
      current: 0,
      limit: null,
      resetDate: null
    };
  }
  
  // Get the current usage
  const [usageRecord] = await db
    .select()
    .from(featureUsage)
    .where(
      and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureId, featureRecord.id)
      )
    )
    .limit(1);
  
  if (!usageRecord) {
    // No usage record yet, user is within limits
    return {
      withinLimits: true,
      current: 0,
      limit: null,
      resetDate: null
    };
  }
  
  // Get the user's subscription to find the plan
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return {
      withinLimits: false,
      current: usageRecord.usageCount,
      limit: null,
      resetDate: null
    };
  }
  
  // Get the access record to check limitations
  const [accessRecord] = await db
    .select()
    .from(featureAccess)
    .where(
      and(
        eq(featureAccess.planId, subscription.planId),
        eq(featureAccess.featureId, featureRecord.id)
      )
    )
    .limit(1);
  
  if (!accessRecord || accessRecord.accessLevel === 'none') {
    return {
      withinLimits: false,
      current: usageRecord.usageCount,
      limit: null,
      resetDate: null
    };
  }
  
  // If full access, no usage limits
  if (accessRecord.accessLevel === 'full') {
    return {
      withinLimits: true,
      current: usageRecord.usageCount,
      limit: null,
      resetDate: null
    };
  }
  
  // For limited access, check against limitations
  const maxUsage = accessRecord.limitations?.maxUsage;
  if (!maxUsage) {
    return {
      withinLimits: true,
      current: usageRecord.usageCount,
      limit: null,
      resetDate: null
    };
  }
  
  // Check if usage is within limits
  const withinLimits = usageRecord.usageCount < maxUsage;
  
  return {
    withinLimits,
    current: usageRecord.usageCount,
    limit: maxUsage,
    resetDate: usageRecord.resetDate || subscription.currentPeriodEnd || null
  };
}

/**
 * Increment usage count for a feature
 */
export async function incrementUsage(userId: number, featureId: string): Promise<void> {
  // Get the feature ID from the feature identifier
  const [featureRecord] = await db
    .select()
    .from(features)
    .where(eq(features.featureId, featureId))
    .limit(1);
  
  if (!featureRecord) return;
  
  // Get the current usage record
  const [usageRecord] = await db
    .select()
    .from(featureUsage)
    .where(
      and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureId, featureRecord.id)
      )
    )
    .limit(1);
  
  const now = new Date();
  
  if (usageRecord) {
    // Update existing record
    await db
      .update(featureUsage)
      .set({ 
        usageCount: usageRecord.usageCount + 1,
        lastUsed: now,
        updatedAt: now
      })
      .where(eq(featureUsage.id, usageRecord.id));
  } else {
    // Create new record
    const subscription = await getActiveSubscription(userId);
    const resetDate = subscription?.currentPeriodEnd || addDays(now, 30); // Default to 30 days if no subscription
    
    await db
      .insert(featureUsage)
      .values({
        userId,
        featureId: featureRecord.id,
        usageCount: 1,
        lastUsed: now,
        resetDate,
        createdAt: now,
        updatedAt: now
      });
  }
  
  // Track the interaction
  await db
    .insert(featureInteractions)
    .values({
      userId,
      featureId: featureRecord.id,
      interactionType: 'use',
      timestamp: now
    });
}

/**
 * Reset usage counts for all users when their billing period renews
 */
export async function resetUsageCounts(): Promise<void> {
  const now = new Date();
  
  // Find all active subscriptions
  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));
    
  // Filter subscriptions that have renewed
  const renewedSubscriptions = activeSubscriptions.filter(
    sub => sub.currentPeriodStart && now >= sub.currentPeriodStart
  );
  
  // Reset usage for each user with a renewed subscription
  for (const subscription of renewedSubscriptions) {
    await db
      .update(featureUsage)
      .set({ 
        usageCount: 0,
        resetDate: subscription.currentPeriodEnd,
        updatedAt: now
      })
      .where(eq(featureUsage.userId, subscription.userId));
  }
}

/**
 * Middleware to check subscription permission for a feature
 */
export function checkSubscriptionPermission(featureId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip for non-authenticated requests
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this feature'
      });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this feature'
      });
    }
    
    // Get user's active subscription
    const subscription = await getActiveSubscription(userId);
    if (!subscription) {
      // Track the interaction
      const [featureRecord] = await db
        .select()
        .from(features)
        .where(eq(features.featureId, featureId))
        .limit(1);
      
      if (featureRecord) {
        await db
          .insert(featureInteractions)
          .values({
            userId,
            featureId: featureRecord.id,
            interactionType: 'limit_reached',
            timestamp: new Date()
          });
      }
      
      return res.status(403).json({
        error: 'Subscription required',
        message: 'You need an active subscription to access this feature',
        upgradeUrl: '/pricing'
      });
    }
    
    // Check if feature is included in plan
    const accessResult = await checkFeatureAccess(subscription.planId, featureId);
    if (!accessResult.hasAccess) {
      // Track the interaction
      const [featureRecord] = await db
        .select()
        .from(features)
        .where(eq(features.featureId, featureId))
        .limit(1);
      
      if (featureRecord) {
        await db
          .insert(featureInteractions)
          .values({
            userId,
            featureId: featureRecord.id,
            interactionType: 'limit_reached',
            timestamp: new Date()
          });
      }
      
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `Your current plan doesn't include access to ${featureId}`,
        accessResult,
        upgradeUrl: `/pricing?feature=${featureId}`
      });
    }
    
    // For limited access, check usage quotas
    if (accessResult.accessLevel === 'limited') {
      const usageStatus = await checkUsageQuota(userId, featureId);
      if (!usageStatus.withinLimits) {
        // Track the interaction
        const [featureRecord] = await db
          .select()
          .from(features)
          .where(eq(features.featureId, featureId))
          .limit(1);
        
        if (featureRecord) {
          await db
            .insert(featureInteractions)
            .values({
              userId,
              featureId: featureRecord.id,
              interactionType: 'limit_reached',
              timestamp: new Date()
            });
        }
        
        return res.status(429).json({
          error: 'Usage limit reached',
          message: `You've reached your ${featureId} usage limit for this billing cycle`,
          currentUsage: usageStatus.current,
          limit: usageStatus.limit,
          nextReset: usageStatus.resetDate,
          upgradeUrl: `/pricing?feature=${featureId}`
        });
      }
    }
    
    // Add feature access info to the request object for use in controllers
    req.featureAccess = {
      ...accessResult,
      featureId
    };
    
    // Continue to the actual feature handler
    next();
  };
}

// Add feature access to Express Request type
declare global {
  namespace Express {
    interface Request {
      featureAccess?: FeatureAccessResult & { featureId: string };
    }
  }
}