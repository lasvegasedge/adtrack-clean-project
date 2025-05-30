import { integer, pgTable, serial, text, timestamp, boolean, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { users } from './schema';
import { z } from 'zod';

// Plan types enum
export const planTypeEnum = pgEnum('plan_type', ['basic', 'professional', 'premium']);

// Subscription statuses enum
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'expired',
  'past_due',
  'trialing',
  'unpaid'
]);

// Feature access levels enum
export const accessLevelEnum = pgEnum('access_level', ['none', 'limited', 'full']);

// Subscription plans table
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: planTypeEnum('type').notNull(),
  price: integer('price').notNull(), // In cents
  interval: text('interval').notNull().default('month'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  stripePriceId: text('stripe_price_id'),
  features: json('features').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  planId: integer('plan_id').notNull().references(() => subscriptionPlans.id),
  status: subscriptionStatusEnum('status').notNull().default('trialing'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Feature definitions table
export const features = pgTable('features', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  limits: json('limits').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Feature access configuration table
export const featureAccess = pgTable('feature_access', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => subscriptionPlans.id),
  featureId: integer('feature_id').notNull().references(() => features.id),
  accessLevel: accessLevelEnum('access_level').notNull().default('none'),
  limitations: json('limitations').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Usage tracking table
export const featureUsage = pgTable('feature_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  featureId: integer('feature_id').notNull().references(() => features.id),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsed: timestamp('last_used'),
  resetDate: timestamp('reset_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Feature interaction tracking for analytics
export const featureInteractions = pgTable('feature_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  featureId: integer('feature_id').notNull().references(() => features.id),
  interactionType: text('interaction_type').notNull(), // view, use, limit_reached, upgrade_shown, upgrade_clicked
  timestamp: timestamp('timestamp').notNull().defaultNow()
});

// Personalized subscription offers table
export const personalizedOffers = pgTable('personalized_offers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  triggerFeatureId: integer('trigger_feature_id').references(() => features.id),
  recommendedPlanId: integer('recommended_plan_id').notNull().references(() => subscriptionPlans.id),
  discountPercentage: integer('discount_percentage'),
  offerMessage: text('offer_message'),
  offerCode: text('offer_code').notNull().unique(),
  expirationDate: timestamp('expiration_date'),
  isRedeemed: boolean('is_redeemed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Relations
export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id]
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id]
  })
}));

export const featureAccessRelations = relations(featureAccess, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [featureAccess.planId],
    references: [subscriptionPlans.id]
  }),
  feature: one(features, {
    fields: [featureAccess.featureId],
    references: [features.id]
  })
}));

export const featureUsageRelations = relations(featureUsage, ({ one }) => ({
  user: one(users, {
    fields: [featureUsage.userId],
    references: [users.id]
  }),
  feature: one(features, {
    fields: [featureUsage.featureId],
    references: [features.id]
  })
}));

// Zod schemas for insertion
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertFeatureSchema = createInsertSchema(features);
export const insertFeatureAccessSchema = createInsertSchema(featureAccess);
export const insertFeatureUsageSchema = createInsertSchema(featureUsage);
export const insertFeatureInteractionSchema = createInsertSchema(featureInteractions);
export const insertPersonalizedOfferSchema = createInsertSchema(personalizedOffers);

// Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;

export type FeatureAccess = typeof featureAccess.$inferSelect;
export type InsertFeatureAccess = z.infer<typeof insertFeatureAccessSchema>;

export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;

export type FeatureInteraction = typeof featureInteractions.$inferSelect;
export type InsertFeatureInteraction = z.infer<typeof insertFeatureInteractionSchema>;

export type PersonalizedOffer = typeof personalizedOffers.$inferSelect;
export type InsertPersonalizedOffer = z.infer<typeof insertPersonalizedOfferSchema>;