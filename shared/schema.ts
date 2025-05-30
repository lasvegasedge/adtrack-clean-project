import { pgTable, text, serial, integer, boolean, real, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define user roles as enum
export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',  // AdTrack platform admin
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',  // Business admin with full access
  BILLING_MANAGER = 'BILLING_MANAGER', // Access to billing information
  MARKETING_USER = 'MARKETING_USER',  // Standard marketing user
  GENERAL_USER = 'GENERAL_USER'       // Basic user with limited access
}

// Define user approval status as enum
export enum UserApprovalStatus {
  PENDING = 'PENDING',  // Awaiting admin approval
  APPROVED = 'APPROVED', // Access granted by admin
  REJECTED = 'REJECTED', // Access denied by admin
}

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false), // This is now for platform admins only
  email: text("email"),
  phoneNumber: text("phone_number"), // Mobile number for text notifications
  role: text("role").default(UserRole.MARKETING_USER), // Default role for new users
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  status: text("status").default("Active"),
  approvalStatus: text("approval_status").default(UserApprovalStatus.PENDING), // Admin approval status
  approvalDate: timestamp("approval_date"), // When the user was approved/rejected
  approvedBy: integer("approved_by"), // Admin user ID who approved/rejected
  rejectionReason: text("rejection_reason"), // Optional reason for rejection
  isTrialPeriod: boolean("is_trial_period").default(true), // Whether user is in trial period
  trialStartDate: timestamp("trial_start_date").defaultNow(), // When trial started
  trialEndDate: timestamp("trial_end_date"), // When trial ends
  trialDuration: integer("trial_duration").default(7), // Trial duration in days (default 7)
  // Stripe payment fields
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for payment processing
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID for recurring billing
});

// Admin settings for customization
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  notificationEmail: text("notification_email"),
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),
  customEmailTemplates: boolean("custom_email_templates").default(false),
  customizedAt: timestamp("customized_at"),
});

// Admin notification settings
export const adminNotificationSettings = pgTable("admin_notification_settings", {
  id: serial("id").primaryKey(),
  systemNotifications: boolean("system_notifications").default(true),
  userRegistrationAlerts: boolean("user_registration_alerts").default(true),
  businessVerificationAlerts: boolean("business_verification_alerts").default(true),
  weeklyAdminReports: boolean("weekly_admin_reports").default(true),
  failedPaymentAlerts: boolean("failed_payment_alerts").default(true),
  securityAlerts: boolean("security_alerts").default(true),
  performanceAlerts: boolean("performance_alerts").default(true),
  maintenanceNotifications: boolean("maintenance_notifications").default(true),
  notificationEmail: text("notification_email"),
  alertFrequency: text("alert_frequency").default("immediate"),
  customAlertThreshold: integer("custom_alert_threshold").default(10),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Email templates model
export const emailTemplateTypes = [
  "passwordReset",
  "roiAlert", 
  "campaignReminder", 
  "weeklyReport", 
  "verifyEmail",
  "newAccountRequest",
  "accountApproved",
  "accountRejected"
] as const;

export type EmailTemplateType = typeof emailTemplateTypes[number];

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  templateType: text("template_type").$type<EmailTemplateType>().notNull(),
  subject: text("subject").notNull(),
  textContent: text("text_content").notNull(),
  htmlContent: text("html_content").notNull(),
  isCustomized: boolean("is_customized").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Pricing configuration model
export const pricingConfig = pgTable("pricing_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  features: text("features").notNull(), // Features as newline-separated text
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Business profile model
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  businessType: text("business_type").notNull(),
  address: text("address").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Business owner contact information
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  ownerTextOk: boolean("owner_text_ok").default(false),
  // Marketing contact information
  marketingName: text("marketing_name"),
  marketingPhone: text("marketing_phone"),
  marketingEmail: text("marketing_email"),
  marketingTextOk: boolean("marketing_text_ok").default(false),
  // Billing contact information
  billingName: text("billing_name"),
  billingPhone: text("billing_phone"),
  billingEmail: text("billing_email"),
  billingTextOk: boolean("billing_text_ok").default(false),
  phone: text("phone"),
  // Multi-location fields
  isParentBusiness: boolean("is_parent_business").default(false),
  parentBusinessId: integer("parent_business_id"),
});

// Fix the circular reference by adding the constraint separately
// This avoids "references itself in its initializer" error
export const businessRelations = relations(businesses, ({ one, many }) => ({
  parent: one(businesses, {
    fields: [businesses.parentBusinessId],
    references: [businesses.id],
  }),
  childLocations: many(businesses),
}));

// Business locations model
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default("USA"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  phone: text("phone"),
  phoneNumber: text("phone_number"), 
  email: text("email"),
  // Location manager
  managerId: integer("manager_id").references(() => users.id),
  managerName: text("manager_name"),
  // Location status
  isPrimary: boolean("is_primary").default(false),
  // Billing configuration
  separateBilling: boolean("separate_billing").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPlanId: integer("subscription_plan_id").references(() => pricingConfig.id),
  // Performance tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advertisement method model
export const adMethods = pgTable("ad_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Business type model
export const businessTypes = pgTable("business_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Campaign model
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  description: text("description"),
  adMethodId: integer("ad_method_id").notNull().references(() => adMethods.id),
  amountSpent: decimal("amount_spent", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  amountEarned: decimal("amount_earned", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification settings model
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  roiAlerts: boolean("roi_alerts").default(true),
  campaignReminders: boolean("campaign_reminders").default(true),
  weeklyReports: boolean("weekly_reports").default(true),
  lastNotified: timestamp("last_notified"),
});

// Achievement type model
export const achievementTypes = pgTable("achievement_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  points: integer("points").notNull(),
  category: text("category").notNull(),
  criteria: json("criteria").notNull(),
});

// User achievements model
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementTypeId: integer("achievement_type_id").notNull().references(() => achievementTypes.id),
  dateEarned: timestamp("date_earned").defaultNow(),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
});

// Rewards that can be purchased with achievement points
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  category: text("category").notNull(), // "feature", "report", "template", etc.
  icon: text("icon").notNull(),
  featureKey: text("feature_key").notNull(), // identifier for the feature to unlock
  durationDays: integer("duration_days"), // null for permanent rewards
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User's purchased rewards
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration date for time-limited rewards
  isActive: boolean("is_active").default(true).notNull(),
});

// Badge rewards that users can display on their profile
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  tier: text("tier").notNull(), // bronze, silver, gold, etc.
  achievementTypeId: integer("achievement_type_id").references(() => achievementTypes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Available features that can be used in the system
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // unique identifier for the feature (e.g., "competitor_insights")
  name: text("name").notNull(), // display name (e.g., "Competitor Insights")
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "analytics", "reporting", "marketing"
  limits: json("limits").notNull(), // JSON object with limits based on subscription plan
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature usage tracking for platform analytics
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  featureId: integer("feature_id").notNull().references(() => features.id),
  usedAt: timestamp("used_at").defaultNow().notNull(),
  usageCount: integer("usage_count").default(1).notNull(), // For batch recording
  metadata: json("metadata"), // Additional usage details specific to the feature
});

// Payment methods for users
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentMethodId: text("payment_method_id").notNull(), // Stripe payment method ID
  last4: text("last4"), // Last 4 digits of card
  brand: text("brand"), // Card brand (Visa, Mastercard, etc.)
  expiryMonth: integer("expiry_month"), // Card expiry month
  expiryYear: integer("expiry_year"), // Card expiry year
  isDefault: boolean("is_default").default(true), // Is this the default payment method
  createdAt: timestamp("created_at").defaultNow(), // When the payment method was created
});

// Discount codes for subscription plans
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // Percentage (e.g. 25.00) or fixed amount
  maxUses: integer("max_uses"), // Maximum number of times this code can be used (null for unlimited)
  usedCount: integer("used_count").default(0).notNull(),
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until"), // Expiration date (null for no expiration)
  isActive: boolean("is_active").default(true).notNull(),
  appliesTo: text("applies_to").default("all"), // "all", "basic", "professional", "premium" (plan type this code applies to)
  stripePromoId: text("stripe_promo_id"), // ID of corresponding promotion in Stripe
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Track discount code usage
export const discountCodeUsage = pgTable("discount_code_usage", {
  id: serial("id").primaryKey(),
  discountCodeId: integer("discount_code_id").notNull().references(() => discountCodes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  planId: integer("plan_id").references(() => pricingConfig.id),
  planName: text("plan_name").notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  discountedAmount: decimal("discounted_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// AI-powered pricing recommendations
export const pricingRecommendations = pgTable("pricing_recommendations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  userId: integer("user_id").notNull().references(() => users.id),
  adMethodId: integer("ad_method_id").notNull().references(() => adMethods.id),
  businessType: text("business_type").notNull(),
  recommendedBudget: decimal("recommended_budget", { precision: 10, scale: 2 }).notNull(),
  recommendedBidAmount: decimal("recommended_bid_amount", { precision: 10, scale: 2 }),
  expectedRoi: decimal("expected_roi", { precision: 10, scale: 2 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  rationale: text("rationale").notNull(),
  scenarioBudgets: json("scenario_budgets"), // Different budget scenarios with ROI projections
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  implementedAt: timestamp("implemented_at"),
  isImplemented: boolean("is_implemented").default(false),
  implementationDetails: json("implementation_details"),
  userFeedback: text("user_feedback"),
  interactionHistory: json("interaction_history"),
  dismissedAt: timestamp("dismissed_at"), // Add the missing field that exists in the migration
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  email: true,
  phoneNumber: true,
  role: true,
  isVerified: true,
  verificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  status: true,
  approvalStatus: true,
  approvalDate: true,
  approvedBy: true,
  rejectionReason: true,
  isTrialPeriod: true,
  trialStartDate: true,
  trialEndDate: true,
  trialDuration: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).pick({
  userId: true,
  name: true,
  businessType: true,
  address: true,
  zipCode: true,
  latitude: true,
  longitude: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  ownerTextOk: true,
  marketingName: true,
  marketingPhone: true,
  marketingEmail: true,
  marketingTextOk: true,
  billingName: true,
  billingPhone: true,
  billingEmail: true,
  billingTextOk: true,
  phone: true,
  isParentBusiness: true,
  parentBusinessId: true,
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  businessId: true,
  name: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  latitude: true,
  longitude: true,
  phoneNumber: true,
  email: true,
  managerId: true,
  managerName: true,
  isPrimary: true,
  separateBilling: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionPlanId: true,
});

// This will be defined after userLocations table is created

export const insertAdMethodSchema = createInsertSchema(adMethods).pick({
  name: true,
});

export const insertBusinessTypeSchema = createInsertSchema(businessTypes).pick({
  name: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  businessId: true,
  name: true,
  description: true,
  adMethodId: true,
  amountSpent: true,
  startDate: true,
  endDate: true,
  amountEarned: true,
  isActive: true,
  fileUrl: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).pick({
  userId: true,
  email: true,
  roiAlerts: true,
  campaignReminders: true,
  weeklyReports: true,
});

export const insertAchievementTypeSchema = createInsertSchema(achievementTypes).pick({
  name: true,
  description: true,
  icon: true,
  points: true,
  category: true,
  criteria: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementTypeId: true,
  progress: true,
  isCompleted: true,
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  name: true,
  description: true,
  pointsCost: true,
  category: true,
  icon: true,
  featureKey: true,
  durationDays: true,
  isActive: true,
});

export const insertUserRewardSchema = createInsertSchema(userRewards).pick({
  userId: true,
  rewardId: true,
  expiresAt: true,
  isActive: true,
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  imageUrl: true,
  tier: true,
  achievementTypeId: true,
});

export const insertFeatureSchema = createInsertSchema(features).pick({
  key: true,
  name: true,
  description: true,
  category: true,
  limits: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).pick({
  userId: true,
  businessId: true,
  featureId: true,
  usedAt: true,
  usageCount: true,
  metadata: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  paymentMethodId: true,
  last4: true,
  brand: true,
  expiryMonth: true,
  expiryYear: true,
  isDefault: true,
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).pick({
  notificationEmail: true,
  supportEmail: true,
  supportPhone: true,
  customEmailTemplates: true,
});

export const insertAdminNotificationSettingsSchema = createInsertSchema(adminNotificationSettings).pick({
  systemNotifications: true,
  userRegistrationAlerts: true,
  businessVerificationAlerts: true,
  weeklyAdminReports: true,
  failedPaymentAlerts: true,
  securityAlerts: true,
  performanceAlerts: true,
  maintenanceNotifications: true,
  notificationEmail: true,
  alertFrequency: true,
  customAlertThreshold: true,
  updatedBy: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).pick({
  templateType: true,
  subject: true,
  textContent: true,
  htmlContent: true,
  isCustomized: true,
  createdBy: true,
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfig).pick({
  name: true,
  description: true,
  features: true,
  price: true,
  discountedPrice: true,
  sortOrder: true,
  isActive: true,
  updatedBy: true,
});

// Auth schemas
export const loginSchema = z.object({
  // Allow any valid username without strict email validation
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number can only contain digits"),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  address: z.string().min(1, "Address is required"),
  zipCode: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits"),
});

// The User-Location relationship will be defined later
// after both users and locations tables are defined

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean | null;    // Map for consistently using isAdmin property throughout the application
  is_admin?: boolean | null;   // PostgreSQL column name for admin status
  email: string | null;
  phoneNumber?: string | null; // Mobile number for text notifications
  role?: UserRole;            // User role for access control
  isVerified: boolean | null;
  verificationToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  status: string | null;
  approvalStatus?: UserApprovalStatus; // Admin approval status
  approvalDate?: Date | null;
  approvedBy?: number | null;
  rejectionReason?: string | null;
  // Trial period fields
  isTrialPeriod?: boolean;
  trialStartDate?: Date | null;
  trialEndDate?: Date | null;
  trialDuration?: number;
  // Stripe payment fields
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  // Additional properties
  businessId?: number;  // Add businessId for auth context
  locationId?: number;  // Add locationId for multi-location context
};

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertAdMethod = z.infer<typeof insertAdMethodSchema>;
export type AdMethod = typeof adMethods.$inferSelect;

export type InsertBusinessType = z.infer<typeof insertBusinessTypeSchema>;
export type BusinessType = typeof businessTypes.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

export type InsertAchievementType = z.infer<typeof insertAchievementTypeSchema>;
export type AchievementType = typeof achievementTypes.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;

export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type FeatureUsage = typeof featureUsage.$inferSelect;

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

export type InsertAdminNotificationSettings = z.infer<typeof insertAdminNotificationSettingsSchema>;
export type AdminNotificationSettings = typeof adminNotificationSettings.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfig.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;

// ROI calculation type
export type BusinessCampaignWithROI = Campaign & {
  roi: number;
  business?: Business;
  adMethod?: AdMethod;
  areaRank?: number;
  totalInArea?: number;
};

// AI Recommendation Engine schemas
export const adRecommendations = pgTable("ad_recommendations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isViewed: boolean("is_viewed").default(false),
  summaryText: text("summary_text").notNull(),
  confidenceScore: real("confidence_score").notNull(),
});

export const adRecommendationItems = pgTable("ad_recommendation_items", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").notNull().references(() => adRecommendations.id),
  adMethodId: integer("ad_method_id").notNull().references(() => adMethods.id),
  rank: integer("rank").notNull(), // 1 = highest recommendation
  predictedRoi: real("predicted_roi").notNull(),
  recommendedBudget: decimal("recommended_budget", { precision: 10, scale: 2 }).notNull(),
  rationale: text("rationale").notNull(),
  confidenceScore: real("confidence_score").notNull(), // 0-1 confidence level
  scenarioData: json("scenario_data"), // JSON data for what-if scenarios
});

export const userRecommendationInteractions = pgTable("user_recommendation_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  recommendationId: integer("recommendation_id").notNull().references(() => adRecommendations.id),
  interactionType: text("interaction_type").notNull(), // viewed, implemented, dismissed, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  feedback: text("feedback"), // Optional user feedback
  implementationDetails: json("implementation_details"), // Details if user implemented recommendation
});

// Insert schemas for recommendations
export const insertAdRecommendationSchema = createInsertSchema(adRecommendations);
export const insertAdRecommendationItemSchema = createInsertSchema(adRecommendationItems);
// Insert schemas for discount codes
export const insertDiscountCodeSchema = createInsertSchema(discountCodes).pick({
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  maxUses: true,
  validFrom: true,
  validUntil: true,
  isActive: true,
  appliesTo: true,
  stripePromoId: true,
  createdBy: true,
  updatedBy: true,
});

export const insertDiscountCodeUsageSchema = createInsertSchema(discountCodeUsage).pick({
  discountCodeId: true,
  userId: true,
  planId: true,
  planName: true,
  originalAmount: true, 
  discountedAmount: true,
  stripePaymentIntentId: true,
  stripeSubscriptionId: true,
});

export const insertPricingRecommendationSchema = createInsertSchema(pricingRecommendations).pick({
  businessId: true,
  userId: true,
  adMethodId: true,
  businessType: true,
  recommendedBudget: true,
  recommendedBidAmount: true,
  expectedRoi: true,
  confidenceScore: true,
  rationale: true,
  scenarioBudgets: true,
  implementedAt: true,
  isImplemented: true,
  implementationDetails: true,
  userFeedback: true,
  interactionHistory: true,
  dismissedAt: true, // Add the dismissed field to the insert schema
});
export const insertUserRecommendationInteractionSchema = createInsertSchema(userRecommendationInteractions);

// Export types for recommendations
export type InsertAdRecommendation = z.infer<typeof insertAdRecommendationSchema>;
export type AdRecommendation = typeof adRecommendations.$inferSelect;

export type InsertAdRecommendationItem = z.infer<typeof insertAdRecommendationItemSchema>;
export type AdRecommendationItem = typeof adRecommendationItems.$inferSelect;

export type InsertUserRecommendationInteraction = z.infer<typeof insertUserRecommendationInteractionSchema>;
export type UserRecommendationInteraction = typeof userRecommendationInteractions.$inferSelect;

// Now that all tables are defined, we can add the user-location relationship
export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  locationId: integer("location_id").notNull().references(() => locations.id),
  isPrimary: boolean("is_primary").default(false),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: integer("assigned_by").references(() => users.id),
});

export const userLocationRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [userLocations.locationId],
    references: [locations.id],
  }),
}));

export const insertUserLocationSchema = createInsertSchema(userLocations).pick({
  userId: true,
  locationId: true,
  isPrimary: true,
  assignedBy: true,
});

export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;
export type UserLocation = typeof userLocations.$inferSelect;

export type InsertPricingRecommendation = z.infer<typeof insertPricingRecommendationSchema>;
export type PricingRecommendation = typeof pricingRecommendations.$inferSelect;

// Discount code types
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCodeUsage = z.infer<typeof insertDiscountCodeUsageSchema>;
export type DiscountCodeUsage = typeof discountCodeUsage.$inferSelect;
