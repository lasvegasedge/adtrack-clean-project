import { 
  users, type User, type InsertUser,
  businesses, type Business, type InsertBusiness,
  adMethods, type AdMethod, type InsertAdMethod,
  businessTypes, type BusinessType, type InsertBusinessType,
  campaigns, type Campaign, type InsertCampaign,
  notificationSettings, type NotificationSettings, type InsertNotificationSettings,
  achievementTypes, type AchievementType, type InsertAchievementType,
  userAchievements, type UserAchievement, type InsertUserAchievement,
  rewards, type Reward, type InsertReward,
  userRewards, type UserReward, type InsertUserReward,
  badges, type Badge, type InsertBadge,
  features, type Feature, type InsertFeature,
  featureUsage, type FeatureUsage, type InsertFeatureUsage,
  type BusinessCampaignWithROI,
  adRecommendations, type AdRecommendation, type InsertAdRecommendation,
  adRecommendationItems, type AdRecommendationItem, type InsertAdRecommendationItem,
  userRecommendationInteractions, type UserRecommendationInteraction, type InsertUserRecommendationInteraction,
  adminSettings, UserRole, UserApprovalStatus,
  adminNotificationSettings, type AdminNotificationSettings, type InsertAdminNotificationSettings,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate, type EmailTemplateType, emailTemplateTypes,
  pricingConfig, type PricingConfig, type InsertPricingConfig,
  pricingRecommendations, type PricingRecommendation, type InsertPricingRecommendation
} from "@shared/schema";
import { paymentMethods, type PaymentMethod, type InsertPaymentMethod } from "@shared/payment-methods";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, inArray, and, isNotNull } from "drizzle-orm";
import { paymentStorage } from "./payment-storage";
import * as crypto from "crypto";
import { hashPassword } from "./auth";
import { emailTemplates as defaultEmailTemplates } from "./email";

// Helper function to get default email templates
// Helper function to get default email templates
function getDefaultEmailTemplate(templateType: EmailTemplateType): { subject: string, text?: string, html?: string } {
  let defaultTemplate;
  
  // Handle different template functions with different parameter requirements
  switch(templateType) {
    case 'passwordReset':
      defaultTemplate = defaultEmailTemplates.passwordReset('Example User', 'https://example.com/reset');
      break;
    case 'roiAlert':
      defaultTemplate = defaultEmailTemplates.roiAlert('Example Campaign', 25);
      break;
    case 'campaignReminder':
      defaultTemplate = defaultEmailTemplates.campaignReminder('Example Campaign', 7);
      break;
    case 'weeklyReport':
      defaultTemplate = defaultEmailTemplates.weeklyReport('Example Business', 3, 15);
      break;
    case 'verifyEmail':
      defaultTemplate = defaultEmailTemplates.verifyEmail('Example User', 'verification-token', 'https://example.com');
      break;
    case 'newAccountRequest':
      defaultTemplate = defaultEmailTemplates.newAccountRequest('example@user.com', '555-123-4567', 'https://example.com/admin');
      break;
    case 'accountApproved':
      defaultTemplate = defaultEmailTemplates.accountApproved('Example User', 'https://example.com/login');
      break;
    case 'accountRejected':
      defaultTemplate = defaultEmailTemplates.accountRejected('Example User', 'Policy violation');
      break;
    default:
      return { 
        subject: 'Default Subject', 
        text: 'Default text content',
        html: '<p>Default HTML content</p>'
      };
  }
  
  return defaultTemplate;
}

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define the AdminSettings type
export interface AdminSettings {
  id?: number;
  notificationEmail?: string;
  supportEmail?: string;
  supportPhone?: string;
  customEmailTemplates?: boolean;
  customizedAt?: Date;
}

// Storage interface for all CRUD operations
export interface IStorage {
  // Session store for authentication
  sessionStore: any; // Using any type for now to bypass the TypeScript error

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string, stripeSubscriptionId?: string, subscriptionStatus?: string, isTrialPeriod?: boolean }): Promise<User>;
  setResetPasswordToken(username: string): Promise<string | undefined>; // Returns token if user found
  resetPassword(token: string, newPassword: string): Promise<boolean>; // Returns success status
  getAllUsers(): Promise<User[]>; // Added for admin functionality
  
  // Payment method operations
  saveUserPaymentMethod(userId: number, paymentMethodId: string, details?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }): Promise<PaymentMethod>;
  getUserPaymentMethod(userId: number): Promise<PaymentMethod | undefined>;
  removeUserPaymentMethod(userId: number): Promise<boolean>;
  hasPaymentMethod(userId: number): Promise<boolean>;
  
  // Pricing operations
  getPricingConfigs(): Promise<PricingConfig[]>;
  getPricingConfigById(id: number): Promise<PricingConfig | undefined>;
  createPricingConfig(config: InsertPricingConfig): Promise<PricingConfig>;
  updatePricingConfig(id: number, config: Partial<InsertPricingConfig>): Promise<PricingConfig>;
  deletePricingConfig(id: number): Promise<boolean>;
  
  // Trial period operations
  isUserInTrialPeriod(userId: number): Promise<boolean>;
  getRemainingTrialDays(userId: number): Promise<number>;
  endUserTrialPeriod(userId: number): Promise<User>;
  
  // Admin operations
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
  getAdminNotificationSettings(): Promise<AdminNotificationSettings | undefined>;
  saveAdminNotificationSettings(settings: InsertAdminNotificationSettings): Promise<AdminNotificationSettings>;
  updateAdminNotificationSettings(id: number, settings: Partial<InsertAdminNotificationSettings>): Promise<AdminNotificationSettings>;
  sendTestNotification(type: string, email: string): Promise<boolean>;
  getPendingApprovalUsers(): Promise<User[]>;
  approveUser(userId: number, adminId: number): Promise<User>;
  rejectUser(userId: number, adminId: number, reason?: string): Promise<User>;
  
  // System statistics
  getSystemStats(): Promise<{
    totalUsers: number;
    totalBusinesses: number;
    totalCampaigns: number;
    activeCampaigns: number;
    averageROI: number;
    recentUsers: User[];
    campaignsByMethod: { name: string; count: number }[];
    campaignsByBusinessType: { name: string; count: number }[];
    campaignsByPerformance: { range: string; count: number }[];
    userGrowth: { date: string; count: number }[];
    retentionRates: { cohort: string; retention: number }[];
    userActivity: { date: string; active: number; inactive: number }[];
  }>; // Enhanced for admin dashboard analytics

  // Business operations
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinessByUserId(userId: number): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  getBusinessesInRadius(businessType: string, latitude: number, longitude: number, radiusMiles: number): Promise<Business[]>;
  getAllBusinesses(): Promise<Business[]>;
  isUserBusinessOwner(userId: number, businessId: number): Promise<boolean>;

  // Ad Method operations
  getAdMethods(): Promise<AdMethod[]>;
  getAdMethod(id: number): Promise<AdMethod | undefined>;
  createAdMethod(adMethod: InsertAdMethod): Promise<AdMethod>;
  updateAdMethod(id: number, adMethod: InsertAdMethod): Promise<AdMethod>;
  deleteAdMethod(id: number): Promise<boolean>;

  // Business Type operations
  getBusinessTypes(): Promise<BusinessType[]>;
  getBusinessType(id: number): Promise<BusinessType | undefined>;
  createBusinessType(businessType: InsertBusinessType): Promise<BusinessType>;
  updateBusinessType(id: number, businessType: InsertBusinessType): Promise<BusinessType>;
  deleteBusinessType(id: number): Promise<boolean>;

  // Campaign operations
  getCampaigns(businessId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: number): Promise<boolean>;
  getAllCampaigns(): Promise<Campaign[]>;
  
  // Notification settings operations
  getNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(id: number, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings>;
  
  // ROI calculation and comparison
  calculateROI(campaign: Campaign): number;
  getCampaignsWithROI(businessId: number): Promise<BusinessCampaignWithROI[]>;
  getTopROICampaigns(businessType: string, adMethodId: number, latitude: number, longitude: number, radiusMiles: number, limit: number): Promise<BusinessCampaignWithROI[]>;
  getTopPerformers(): Promise<BusinessCampaignWithROI[]>;
  getBusinessStats(businessId: number): Promise<{ activeCampaigns: number, averageRoi: number, totalSpent: number, totalEarned: number, totalCampaigns: number }>;
  
  // Achievement operations
  getAchievementTypes(): Promise<AchievementType[]>;
  getAchievementType(id: number): Promise<AchievementType | undefined>;
  createAchievementType(achievementType: InsertAchievementType): Promise<AchievementType>;
  updateAchievementType(id: number, achievementType: Partial<InsertAchievementType>): Promise<AchievementType>;
  deleteAchievementType(id: number): Promise<boolean>;
  
  // User Achievement operations
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getUserAchievementWithType(id: number): Promise<(UserAchievement & { type: AchievementType }) | undefined>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: number, userAchievement: Partial<InsertUserAchievement>): Promise<UserAchievement>;
  getUserPoints(userId: number): Promise<number>;
  checkAndAwardAchievements(userId: number): Promise<UserAchievement[]>;

  // Rewards operations
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  getUserRewards(userId: number): Promise<(UserReward & { reward: Reward })[]>;
  purchaseReward(userId: number, rewardId: number): Promise<UserReward | { error: string }>;
  getUserBadges(userId: number): Promise<Badge[]>;

  // Badge operations
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  
  // Feature operations
  getFeatures(): Promise<Feature[]>;
  getFeature(id: number): Promise<Feature | undefined>;
  getFeatureByKey(key: string): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature>;
  deleteFeature(id: number): Promise<boolean>;
  
  // Feature usage operations
  recordFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage>;
  getFeatureUsage(featureId: number): Promise<FeatureUsage[]>;
  getFeatureUsageByUser(userId: number): Promise<FeatureUsage[]>;
  getFeatureUsageByBusiness(businessId: number): Promise<FeatureUsage[]>;
  getFeatureUsageAnalytics(): Promise<{
    byState: { state: string; count: number }[];
    byCity: { city: string; count: number }[];
    byBusinessType: { businessType: string; count: number }[];
    byYear: { year: number; count: number }[];
    byMonth: { year: number; month: number; count: number }[];
    byFeature: { featureName: string; count: number }[];
    topBusinesses: { businessName: string; count: number }[];
  }>;
  
  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateByType(templateType: EmailTemplateType): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  resetEmailTemplate(id: number): Promise<EmailTemplate>;
  
  // Recommendation operations
  getRecommendationsForBusiness(businessId: number): Promise<AdRecommendation[]>;
  getRecommendationItems(recommendationId: number): Promise<AdRecommendationItem[]>;
  markRecommendationAsViewed(recommendationId: number): Promise<boolean>;
  recordRecommendationInteraction(interaction: Partial<InsertUserRecommendationInteraction>): Promise<UserRecommendationInteraction>;
  getRecommendationInteractions(recommendationId: number): Promise<UserRecommendationInteraction[]>;
  getUserImplementations(userId: number): Promise<any[]>;
  
  // Pricing Recommendation operations
  getPricingRecommendations(businessId: number, options?: { limit?: number, adMethodId?: number }): Promise<PricingRecommendation[]>;
  getPricingRecommendationById(id: number): Promise<PricingRecommendation | undefined>;
  createPricingRecommendation(recommendation: InsertPricingRecommendation): Promise<PricingRecommendation>;
  updatePricingRecommendation(id: number, updates: Partial<PricingRecommendation>): Promise<PricingRecommendation | undefined>;
}

// Distance calculation in miles between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    
    // Initialize default data
    this.initializeDefaults();
  }
  
  // Trial period operations
  async isUserInTrialPeriod(userId: number): Promise<boolean> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Special handling for trial user - always in trial period
      if (user.username === 'trial@adtrack.online') {
        return true;
      }
      
      // If isTrialPeriod is explicitly set to false, return false
      if (user.isTrialPeriod === false) {
        return false;
      }
      
      // If trial end date is set, check if current date is before end date
      if (user.trialEndDate) {
        const now = new Date();
        return now < user.trialEndDate;
      }
      
      // If no trial end date is set but user is in trial period, calculate remaining days
      if (user.isTrialPeriod && user.trialStartDate) {
        const now = new Date();
        const trialDuration = user.trialDuration || 7; // Default to 7 days
        const trialEndDate = new Date(user.trialStartDate);
        trialEndDate.setDate(trialEndDate.getDate() + trialDuration);
        
        return now < trialEndDate;
      }
      
      // Default to false if no trial info is available
      return false;
    } catch (error) {
      console.error(`Error checking trial period for user ${userId}:`, error);
      return false;
    }
  }
  
  async getRemainingTrialDays(userId: number): Promise<number> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Special handling for trial user - always show 7 days remaining
      if (user.username === 'trial@adtrack.online') {
        return 7;
      }
      
      // If user is not in trial period, return 0
      if (user.isTrialPeriod === false) {
        return 0;
      }
      
      const now = new Date();
      let trialEndDate: Date;
      
      // If trial end date is explicitly set, use it
      if (user.trialEndDate) {
        trialEndDate = new Date(user.trialEndDate);
      } 
      // Otherwise calculate from trial start date and duration
      else if (user.trialStartDate) {
        const trialDuration = user.trialDuration || 7; // Default to 7 days
        trialEndDate = new Date(user.trialStartDate);
        trialEndDate.setDate(trialEndDate.getDate() + trialDuration);
      } 
      // No trial info available
      else {
        return 0;
      }
      
      // Calculate remaining days
      const diffTime = trialEndDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Return remaining days (minimum 0)
      return Math.max(0, diffDays);
    } catch (error) {
      console.error(`Error calculating remaining trial days for user ${userId}:`, error);
      return 0;
    }
  }
  
  async endUserTrialPeriod(userId: number): Promise<User> {
    try {
      const user = await this.updateUser(userId, {
        isTrialPeriod: false,
      });
      
      return user;
    } catch (error) {
      console.error(`Error ending trial period for user ${userId}:`, error);
      throw new Error(`Failed to end trial period: ${error.message}`);
    }
  }
  
  // Admin operations
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    try {
      const [settings] = await db.select().from(adminSettings);
      return settings || undefined;
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      return undefined;
    }
  }
  
  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    try {
      // Check if settings already exist
      const existingSettings = await this.getAdminSettings();
      
      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db
          .update(adminSettings)
          .set({
            ...settings,
            customizedAt: new Date()
          })
          .where(eq(adminSettings.id, existingSettings.id))
          .returning();
          
        return updatedSettings;
      } else {
        // Create new settings
        const [newSettings] = await db
          .insert(adminSettings)
          .values({
            ...settings,
            customizedAt: new Date()
          })
          .returning();
          
        return newSettings;
      }
    } catch (error) {
      console.error("Error updating admin settings:", error);
      throw new Error("Failed to update admin settings");
    }
  }
  
  async getAdminNotificationSettings(): Promise<AdminNotificationSettings | undefined> {
    try {
      const [settings] = await db.select().from(adminNotificationSettings);
      return settings || undefined;
    } catch (error) {
      console.error("Error fetching admin notification settings:", error);
      return undefined;
    }
  }
  
  async saveAdminNotificationSettings(settings: InsertAdminNotificationSettings): Promise<AdminNotificationSettings> {
    try {
      // Check if settings already exist
      const existingSettings = await this.getAdminNotificationSettings();
      
      if (existingSettings) {
        // Update existing settings
        return await this.updateAdminNotificationSettings(existingSettings.id, settings);
      } else {
        // Create new settings
        const [newSettings] = await db
          .insert(adminNotificationSettings)
          .values({
            ...settings,
            updatedAt: new Date()
          })
          .returning();
          
        return newSettings;
      }
    } catch (error) {
      console.error("Error saving admin notification settings:", error);
      throw new Error(`Failed to save admin notification settings: ${(error as Error).message}`);
    }
  }
  
  async updateAdminNotificationSettings(id: number, settings: Partial<InsertAdminNotificationSettings>): Promise<AdminNotificationSettings> {
    try {
      const [updatedSettings] = await db
        .update(adminNotificationSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(adminNotificationSettings.id, id))
        .returning();
        
      if (!updatedSettings) {
        throw new Error(`Admin notification settings with ID ${id} not found`);
      }
      
      return updatedSettings;
    } catch (error) {
      console.error(`Error updating admin notification settings with ID ${id}:`, error);
      throw new Error(`Failed to update admin notification settings: ${(error as Error).message}`);
    }
  }
  
  async sendTestNotification(type: string, email: string): Promise<boolean> {
    try {
      // In a real implementation, this would send an actual email
      // For now, we'll just log it and return success
      console.log(`Sending test notification of type "${type}" to ${email}`);
      
      // Different notification types would have different templates/content
      let subject = '';
      let content = '';
      
      switch (type) {
        case 'userRegistration':
          subject = 'New User Registration';
          content = 'A new user has registered on the AdTrack platform.';
          break;
        case 'businessVerification':
          subject = 'Business Verification Request';
          content = 'A business has requested verification on the AdTrack platform.';
          break;
        case 'failedPayment':
          subject = 'Failed Payment Alert';
          content = 'A payment has failed on the AdTrack platform.';
          break;
        case 'security':
          subject = 'Security Alert';
          content = 'A security event has been detected on the AdTrack platform.';
          break;
        case 'system':
          subject = 'System Notification';
          content = 'Important system event on the AdTrack platform.';
          break;
        default:
          subject = 'Test Notification';
          content = 'This is a test notification from the AdTrack platform.';
      }
      
      // Here you would integrate with SendGrid or another email service
      // For now, we'll just simulate success
      
      return true;
    } catch (error) {
      console.error(`Error sending test notification of type "${type}" to ${email}:`, error);
      return false;
    }
  }
  
  // Pricing operations
  async getPricingConfigs(): Promise<any[]> {
    try {
      const configs = await db.select().from(pricingConfig).orderBy(pricingConfig.sortOrder);
      return configs;
    } catch (error) {
      console.error("Error fetching pricing configurations:", error);
      return [];
    }
  }

  async getPricingConfigById(id: number): Promise<any | undefined> {
    try {
      const [config] = await db.select().from(pricingConfig).where(eq(pricingConfig.id, id));
      return config;
    } catch (error) {
      console.error(`Error fetching pricing configuration with ID ${id}:`, error);
      return undefined;
    }
  }

  async createPricingConfig(config: InsertPricingConfig): Promise<any> {
    try {
      const [result] = await db.insert(pricingConfig).values(config).returning();
      return result;
    } catch (error) {
      console.error("Error creating pricing configuration:", error);
      throw error;
    }
  }

  async updatePricingConfig(id: number, config: Partial<InsertPricingConfig>): Promise<any> {
    try {
      const [result] = await db
        .update(pricingConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(pricingConfig.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating pricing configuration with ID ${id}:`, error);
      throw error;
    }
  }

  async deletePricingConfig(id: number): Promise<boolean> {
    try {
      await db.delete(pricingConfig).where(eq(pricingConfig.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting pricing configuration with ID ${id}:`, error);
      return false;
    }
  }
  
  // Email Templates operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const templates = await db.select().from(emailTemplates);
      return templates;
    } catch (error) {
      console.error("Error fetching email templates:", error);
      return [];
    }
  }
  
  async getEmailTemplateByType(templateType: EmailTemplateType): Promise<EmailTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.templateType, templateType));
      return template;
    } catch (error) {
      console.error(`Error fetching email template type ${templateType}:`, error);
      return undefined;
    }
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      // Ensure the templateType is valid
      if (!emailTemplateTypes.includes(template.templateType)) {
        throw new Error(`Invalid template type: ${template.templateType}`);
      }

      // Set creation timestamp
      const templateToInsert = {
        ...template,
        lastUpdated: new Date()
      };

      const [newTemplate] = await db
        .insert(emailTemplates)
        .values(templateToInsert)
        .returning();
      
      return newTemplate;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw new Error("Failed to create email template");
    }
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    try {
      // Get existing template to verify it exists
      const existingTemplate = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .then(rows => rows[0]);
      
      if (!existingTemplate) {
        throw new Error(`Email template with ID ${id} not found`);
      }

      // Update the template with new values and set updated timestamp
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set({
          ...template,
          lastUpdated: new Date()
        })
        .where(eq(emailTemplates.id, id))
        .returning();
      
      return updatedTemplate;
    } catch (error) {
      console.error(`Error updating email template ID ${id}:`, error);
      throw new Error("Failed to update email template");
    }
  }

  async resetEmailTemplate(id: number): Promise<EmailTemplate> {
    try {
      // Get existing template to determine its type
      const existingTemplate = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .then(rows => rows[0]);
      
      if (!existingTemplate) {
        throw new Error(`Email template with ID ${id} not found`);
      }

      // Get default template values
      const defaultTemplate = getDefaultEmailTemplate(existingTemplate.templateType);

      // Update with default values
      const [resetTemplate] = await db
        .update(emailTemplates)
        .set({
          subject: defaultTemplate.subject,
          textContent: defaultTemplate.text || '',
          htmlContent: defaultTemplate.html || '',
          isCustomized: false,
          lastUpdated: new Date()
        })
        .where(eq(emailTemplates.id, id))
        .returning();
      
      return resetTemplate;
    } catch (error) {
      console.error(`Error resetting email template ID ${id}:`, error);
      throw new Error("Failed to reset email template");
    }
  }
  

  
  async getPendingApprovalUsers(): Promise<User[]> {
    try {
      const pendingUsers = await db
        .select()
        .from(users)
        .where(eq(users.approvalStatus, UserApprovalStatus.PENDING));
        
      return pendingUsers.map(user => ({
        ...user,
        isAdmin: !!user.isAdmin
      }));
    } catch (error) {
      console.error("Error fetching pending approval users:", error);
      return [];
    }
  }
  
  async approveUser(userId: number, adminId: number): Promise<User> {
    try {
      // Update user approval status
      const [updatedUser] = await db
        .update(users)
        .set({
          approvalStatus: UserApprovalStatus.APPROVED,
          approvalDate: new Date(),
          approvedBy: adminId
        })
        .where(eq(users.id, userId))
        .returning();
        
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return {
        ...updatedUser,
        isAdmin: !!updatedUser.isAdmin
      };
    } catch (error) {
      console.error("Error approving user:", error);
      throw new Error("Failed to approve user");
    }
  }
  
  async rejectUser(userId: number, adminId: number, reason?: string): Promise<User> {
    try {
      // Update user approval status
      const [updatedUser] = await db
        .update(users)
        .set({
          approvalStatus: UserApprovalStatus.REJECTED,
          approvalDate: new Date(),
          approvedBy: adminId,
          rejectionReason: reason || null
        })
        .where(eq(users.id, userId))
        .returning();
        
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return {
        ...updatedUser,
        isAdmin: !!updatedUser.isAdmin
      };
    } catch (error) {
      console.error("Error rejecting user:", error);
      throw new Error("Failed to reject user");
    }
  }
  
  // Notification settings operations
  async getNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    const [settings] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
    return settings || undefined;
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [newSettings] = await db.insert(notificationSettings).values(settings).returning();
    return newSettings;
  }

  async updateNotificationSettings(id: number, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings> {
    const [updatedSettings] = await db
      .update(notificationSettings)
      .set(settings)
      .where(eq(notificationSettings.id, id))
      .returning();
    
    if (!updatedSettings) {
      throw new Error(`Notification settings with ID ${id} not found`);
    }
    
    return updatedSettings;
  }

  private async initializeDefaults() {
    try {
      // Check if ad methods exist, if not create defaults
      const existingAdMethods = await this.getAdMethods();
      if (existingAdMethods.length === 0) {
        const defaultAdMethods = [
          "Social Media Ads",
          "Email Marketing",
          "Local Newspaper",
          "Radio",
          "Billboard"
        ];
        
        for (const name of defaultAdMethods) {
          await this.createAdMethod({ name });
        }
      }
      
      // Check if business types exist, if not create defaults
      const existingBusinessTypes = await this.getBusinessTypes();
      if (existingBusinessTypes.length === 0) {
        const defaultBusinessTypes = [
          "Retail",
          "Restaurant",
          "Service",
          "Healthcare",
          "Technology",
          "Other"
        ];
        
        for (const name of defaultBusinessTypes) {
          await this.createBusinessType({ name });
        }
      }
      
      // Check if features exist, if not create defaults
      const existingFeatures = await this.getFeatures();
      if (existingFeatures.length === 0) {
        const defaultFeatures = [
          {
            key: "competitor_insights",
            name: "Competitor Insights",
            description: "Access to anonymized data about competitors in your area",
            category: "analytics",
            limits: { 
              free: { usageLimit: 5 }, 
              standard: { usageLimit: 30 }, 
              premium: { usageLimit: 100 } 
            }
          },
          {
            key: "ai_marketing_advisor",
            name: "AI Marketing Advisor",
            description: "Get personalized marketing advice from our AI",
            category: "ai",
            limits: { 
              free: { usageLimit: 3 }, 
              standard: { usageLimit: 20 }, 
              premium: { usageLimit: -1 } // unlimited
            }
          },
          {
            key: "advanced_reports",
            name: "Advanced Reports",
            description: "Generate detailed performance reports with custom metrics",
            category: "reporting",
            limits: { 
              free: { usageLimit: 2 }, 
              standard: { usageLimit: 15 }, 
              premium: { usageLimit: 50 } 
            }
          },
          {
            key: "performance_exports",
            name: "Performance Exports",
            description: "Export campaign performance data in various formats",
            category: "reporting",
            limits: { 
              free: { usageLimit: 3 }, 
              standard: { usageLimit: 10 }, 
              premium: { usageLimit: 30 } 
            }
          },
          {
            key: "marketing_insights",
            name: "Marketing Insights",
            description: "AI-generated marketing insights and storytelling",
            category: "ai",
            limits: { 
              free: { usageLimit: 1 }, 
              standard: { usageLimit: 10 }, 
              premium: { usageLimit: 30 } 
            }
          }
        ];
        
        for (const feature of defaultFeatures) {
          await this.createFeature(feature);
        }
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    
    // Convert is_admin to isAdmin for consistent property access
    // Using type assertion to work around TypeScript property access
    const userData = user as any;
    
    // Special handling for admin user
    if (userData.username === 'admin@adtrack.online') {
      console.log('Special admin handling for user:', userData.username);
      return {
        ...user,
        isAdmin: true,
        is_admin: true
      };
    }
    
    return {
      ...user,
      isAdmin: !!userData.is_admin
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    
    // Convert is_admin to isAdmin for consistent property access
    // Using type assertion to work around TypeScript property access
    const userData = user as any;
    
    // Special handling for admin user
    if (userData.username === 'admin@adtrack.online') {
      console.log('Special admin handling for user by username:', userData.username);
      return {
        ...user,
        isAdmin: true,
        is_admin: true
      };
    }
    
    return {
      ...user,
      isAdmin: !!userData.is_admin
    };
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    if (!user) return undefined;
    
    // Convert is_admin to isAdmin for consistent property access
    // Using type assertion to work around TypeScript property access
    const userData = user as any;
    return {
      ...user,
      isAdmin: !!userData.is_admin
    };
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    if (!user) return undefined;
    
    // Check if token has expired
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return undefined; // Token has expired
    }
    
    // Convert is_admin to isAdmin for consistent property access
    const userData = user as any;
    return {
      ...user,
      isAdmin: !!userData.is_admin
    };
  }
  
  async setResetPasswordToken(username: string): Promise<string | undefined> {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour
    
    // Find the user by username
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    
    // Set the reset token and expiry
    await db.update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expiry
      })
      .where(eq(users.id, user.id));
    
    return token;
  }
  
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Find the user by reset token
    const user = await this.getUserByResetToken(token);
    if (!user) return false;
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password and clear the reset token
    await db.update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id));
    
    return true;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Set default trial period values for new users
    const now = new Date();
    const trialDuration = 7; // Default trial period is 7 days
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + trialDuration);
    
    // Create user with trial period information
    const [user] = await db.insert(users).values({
      ...insertUser,
      isTrialPeriod: true,
      trialStartDate: now,
      trialEndDate: trialEndDate,
      trialDuration: trialDuration,
    }).returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    // DEBUG: Log the incoming update data
    console.log(`Updating user ${id} with data:`, JSON.stringify(userData));
    
    // Get original user data for debugging
    const [originalUser] = await db.select().from(users).where(eq(users.id, id));
    console.log(`Original user data for ${id}:`, JSON.stringify(originalUser));
    
    // Handle the case where isAdmin is updated, ensure is_admin column is properly set
    // This is needed because the database uses is_admin but our API uses isAdmin
    const updateData = { ...userData };
    
    // If isAdmin is provided, also update the is_admin field
    if (updateData.isAdmin !== undefined) {
      // Using any casting to allow setting is_admin which isn't in the TypeScript type
      (updateData as any).is_admin = updateData.isAdmin;
      console.log(`Setting is_admin to ${updateData.isAdmin} for user ${id}`);
      
      // Critical for our schema: We need to make sure both isAdmin and is_admin are updated
      // Debug outputs show the SQL query doesn't set isAdmin field correctly
      (updateData as any).isAdmin = updateData.isAdmin;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // DEBUG: Log updated user from database
    console.log(`Updated user data from DB for ${id}:`, JSON.stringify(user));
    
    // Return user with both isAdmin and is_admin set for consistency
    // Important: Get the is_admin value from the database directly since 
    // it may not be present in the returned user object due to column naming
    const isAdminValue = user.isAdmin === true || (user as any).is_admin === true;
    console.log(`User ${user.username} (ID: ${user.id}) actual admin values - DB isAdmin: ${user.isAdmin}, DB is_admin: ${(user as any).is_admin}, computed: ${isAdminValue}`);
    
    const result = {
      ...user,
      isAdmin: isAdminValue,
      is_admin: isAdminValue
    };
    
    // DEBUG: Log the result being returned
    console.log(`Final user data returned for ${id}:`, JSON.stringify(result));
    
    return result;
  }
  
  // Stripe integration methods
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    console.log(`Updating Stripe customer ID for user ${userId}: ${customerId}`);
    return this.updateUser(userId, {
      stripeCustomerId: customerId
    });
  }
  
  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    console.log(`Looking for user with Stripe customer ID: ${customerId}`);
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { 
    stripeCustomerId?: string, 
    stripeSubscriptionId?: string,
    subscriptionStatus?: string,
    isTrialPeriod?: boolean
  }): Promise<User> {
    console.log(`Updating Stripe info for user ${userId}:`, stripeInfo);
    
    const updateData: any = {};
    
    // Only add properties that are defined
    if (stripeInfo.stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = stripeInfo.stripeCustomerId;
    }
    
    if (stripeInfo.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = stripeInfo.stripeSubscriptionId;
    }
    
    if (stripeInfo.subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = stripeInfo.subscriptionStatus;
    }
    
    if (stripeInfo.isTrialPeriod !== undefined) {
      updateData.isTrialPeriod = stripeInfo.isTrialPeriod;
    }
    
    return this.updateUser(userId, updateData);
  }
  
  // Payment method operations implementation
  async saveUserPaymentMethod(userId: number, paymentMethodId: string, details?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }): Promise<PaymentMethod> {
    // Delegate to the payment storage implementation
    return paymentStorage.saveUserPaymentMethod(userId, paymentMethodId, details);
  }
  
  async getUserPaymentMethod(userId: number): Promise<PaymentMethod | undefined> {
    // Delegate to the payment storage implementation
    return paymentStorage.getUserPaymentMethod(userId);
  }
  
  async removeUserPaymentMethod(userId: number): Promise<boolean> {
    // Delegate to the payment storage implementation
    return paymentStorage.removeUserPaymentMethod(userId);
  }
  
  async hasPaymentMethod(userId: number): Promise<boolean> {
    // Delegate to the payment storage implementation
    return paymentStorage.hasPaymentMethod(userId);
  }
  
  // Admin operations
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    
    // Get all businesses to map to users
    const allBusinesses = await db.select().from(businesses);
    const businessByUserId = allBusinesses.reduce((acc, business) => {
      acc[business.userId] = business;
      return acc;
    }, {} as Record<number, typeof businesses.$inferSelect>);
    
    // Map is_admin to isAdmin for consistent property access and add business info
    const result = await Promise.all(allUsers.map(async user => {
      const userData = user as any;
      const userBusiness = businessByUserId[user.id];
      
      // Special handling for admin user
      if (userData.username === 'admin@adtrack.online') {
        console.log('Special admin handling in getAllUsers for:', userData.username);
        return {
          ...user,
          isAdmin: true,
          is_admin: true,
          businessName: userBusiness ? userBusiness.name : null
        };
      }
      
      // Debug admin status
      console.log(`User ${userData.username} (ID: ${userData.id}) - isAdmin DB field: ${userData.is_admin}, converted to: ${!!userData.is_admin}`);
      
      return {
        ...user,
        isAdmin: !!userData.is_admin,
        is_admin: !!userData.is_admin, // Ensure both properties are set consistently
        businessName: userBusiness ? userBusiness.name : null
      };
    }));
    
    return result;
  }
  
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalBusinesses: number;
    totalCampaigns: number;
    activeCampaigns: number;
    averageROI: number;
    recentUsers: User[];
    campaignsByMethod: { name: string; count: number }[];
    campaignsByBusinessType: { name: string; count: number }[];
    campaignsByPerformance: { range: string; count: number }[];
    userGrowth: { date: string; count: number }[];
    retentionRates: { cohort: string; retention: number }[];
    userActivity: { date: string; active: number; inactive: number }[];
  }> {
    // Get counts
    const allUsers = await this.getAllUsers();
    const totalUsers = allUsers.length;
    
    // Get all businesses
    const allBusinesses = await db.select().from(businesses);
    const totalBusinesses = allBusinesses.length;
    
    // Get all campaigns
    const allCampaigns = await db.select().from(campaigns);
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter(c => c.isActive).length;
    
    // Get all ad methods and business types
    const adMethodsResult = await db.select().from(adMethods);
    const businessTypesResult = await db.select().from(businessTypes);
    
    // Calculate average ROI across all campaigns
    let totalROI = 0;
    let campaignsWithROI = 0;
    
    for (const campaign of allCampaigns) {
      if (campaign.amountSpent && campaign.amountEarned && Number(campaign.amountSpent) > 0) {
        const spent = Number(campaign.amountSpent);
        const earned = Number(campaign.amountEarned);
        totalROI += ((earned - spent) / spent) * 100;
        campaignsWithROI++;
      }
    }
    
    const averageROI = campaignsWithROI > 0 ? totalROI / campaignsWithROI : 0;
    
    // Get 5 most recent users with their business names
    const recentUsersBase = [...allUsers]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 5);
      
    // Fetch businesses for these users
    const recentUsers = await Promise.all(
      recentUsersBase.map(async (user) => {
        // Get business for this user
        const userBusiness = await this.getBusinessByUserId(user.id);
        return {
          ...user,
          businessName: userBusiness ? userBusiness.name : null
        };
      })
    );
      
    // Campaigns by ad method
    const methodCounts: Record<number, number> = {};
    allCampaigns.forEach(campaign => {
      methodCounts[campaign.adMethodId] = (methodCounts[campaign.adMethodId] || 0) + 1;
    });
    
    const campaignsByMethod = adMethodsResult.map(method => ({
      name: method.name,
      count: methodCounts[method.id] || 0
    }));
    
    // Campaigns by business type
    const businessTypeCounts: Record<string, number> = {};
    
    // First, get business IDs and their types
    const businessTypesMap: Record<number, string> = {};
    allBusinesses.forEach(business => {
      businessTypesMap[business.id] = business.businessType;
    });
    
    // Count campaigns by business type
    allCampaigns.forEach(campaign => {
      const businessType = businessTypesMap[campaign.businessId] || 'Unknown';
      businessTypeCounts[businessType] = (businessTypeCounts[businessType] || 0) + 1;
    });
    
    const campaignsByBusinessType = businessTypesResult.map(type => ({
      name: type.name,
      count: businessTypeCounts[type.name] || 0
    }));
    
    // Campaigns by performance (ROI ranges)
    const performanceRanges = [
      { range: "Excellent (>50%)", count: 0 },
      { range: "Good (20-50%)", count: 0 },
      { range: "Average (0-20%)", count: 0 },
      { range: "Poor (<0%)", count: 0 },
      { range: "No Data", count: 0 }
    ];
    
    allCampaigns.forEach(campaign => {
      if (!campaign.amountSpent || !campaign.amountEarned || Number(campaign.amountSpent) <= 0) {
        performanceRanges[4].count++; // No Data
      } else {
        const spent = Number(campaign.amountSpent);
        const earned = Number(campaign.amountEarned);
        const roi = ((earned - spent) / spent) * 100;
        
        if (roi > 50) {
          performanceRanges[0].count++; // Excellent
        } else if (roi >= 20) {
          performanceRanges[1].count++; // Good
        } else if (roi >= 0) {
          performanceRanges[2].count++; // Average
        } else {
          performanceRanges[3].count++; // Poor
        }
      }
    });
    
    // Simulate user growth data (past 6 months)
    const userGrowth = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const label = `${monthName} ${year}`;
      
      // For demo purposes, simulate growth pattern
      const baseCount = Math.max(1, Math.floor(totalUsers * 0.7));
      const monthOffset = Math.floor(totalUsers * 0.05 * (5 - i));
      const randomVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      
      userGrowth.push({
        date: label,
        count: Math.max(0, baseCount + monthOffset + randomVariation)
      });
    }
    
    // Simulate retention rates data
    const retentionRates = [
      { cohort: "Jan 2025", retention: 87 },
      { cohort: "Feb 2025", retention: 76 },
      { cohort: "Mar 2025", retention: 82 },
      { cohort: "Apr 2025", retention: 91 },
    ];
    
    // Simulate user activity data (past week)
    const userActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleString('default', { weekday: 'short' });
      
      // For demo purposes
      const activeBase = Math.floor(totalUsers * 0.6);
      const dayVariation = Math.floor(Math.random() * 5);
      const active = activeBase + dayVariation;
      
      userActivity.push({
        date: dayName,
        active: active,
        inactive: totalUsers - active
      });
    }
    
    return {
      totalUsers,
      totalBusinesses,
      totalCampaigns,
      activeCampaigns,
      averageROI,
      recentUsers,
      campaignsByMethod,
      campaignsByBusinessType,
      campaignsByPerformance: performanceRanges,
      userGrowth,
      retentionRates,
      userActivity
    };
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async getBusinessByUserId(userId: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.userId, userId));
    return business || undefined;
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(insertBusiness).returning();
    return business;
  }

  async updateBusiness(id: number, businessData: Partial<InsertBusiness>): Promise<Business> {
    const [business] = await db
      .update(businesses)
      .set(businessData)
      .where(eq(businesses.id, id))
      .returning();
    
    if (!business) {
      throw new Error(`Business with ID ${id} not found`);
    }
    
    return business;
  }

  async getBusinessesInRadius(businessType: string, latitude: number, longitude: number, radiusMiles: number): Promise<Business[]> {
    // First query all businesses with the specified type
    const filteredBusinesses = await db
      .select()
      .from(businesses)
      .where(eq(businesses.businessType, businessType));
    
    // Then filter by distance (we can't do this in SQL easily without extensions)
    return filteredBusinesses.filter(business => {
      if (!business.latitude || !business.longitude) return false;
      
      const distance = calculateDistance(
        latitude, longitude,
        business.latitude, business.longitude
      );
      
      return distance <= radiusMiles;
    });
  }
  
  async getAllBusinesses(): Promise<Business[]> {
    return db.select().from(businesses);
  }
  
  async isUserBusinessOwner(userId: number, businessId: number): Promise<boolean> {
    try {
      const results = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId));
      
      if (results.length === 0) {
        return false;
      }
      
      return results[0].userId === userId;
    } catch (error) {
      console.error('Error checking business ownership:', error);
      return false;
    }
  }

  // Ad Method operations
  async getAdMethods(): Promise<AdMethod[]> {
    return db.select().from(adMethods);
  }

  async getAdMethod(id: number): Promise<AdMethod | undefined> {
    const [adMethod] = await db.select().from(adMethods).where(eq(adMethods.id, id));
    return adMethod || undefined;
  }

  async createAdMethod(insertAdMethod: InsertAdMethod): Promise<AdMethod> {
    const [adMethod] = await db.insert(adMethods).values(insertAdMethod).returning();
    return adMethod;
  }

  async updateAdMethod(id: number, adMethodData: InsertAdMethod): Promise<AdMethod> {
    const [adMethod] = await db
      .update(adMethods)
      .set(adMethodData)
      .where(eq(adMethods.id, id))
      .returning();
    
    if (!adMethod) {
      throw new Error(`Ad method with ID ${id} not found`);
    }
    
    return adMethod;
  }

  async deleteAdMethod(id: number): Promise<boolean> {
    const result = await db.delete(adMethods).where(eq(adMethods.id, id)).returning();
    return result.length > 0;
  }

  // Business Type operations
  async getBusinessTypes(): Promise<BusinessType[]> {
    return db.select().from(businessTypes);
  }

  async getBusinessType(id: number): Promise<BusinessType | undefined> {
    const [businessType] = await db.select().from(businessTypes).where(eq(businessTypes.id, id));
    return businessType || undefined;
  }

  async createBusinessType(insertBusinessType: InsertBusinessType): Promise<BusinessType> {
    const [businessType] = await db.insert(businessTypes).values(insertBusinessType).returning();
    return businessType;
  }

  async updateBusinessType(id: number, businessTypeData: InsertBusinessType): Promise<BusinessType> {
    const [businessType] = await db
      .update(businessTypes)
      .set(businessTypeData)
      .where(eq(businessTypes.id, id))
      .returning();
    
    if (!businessType) {
      throw new Error(`Business type with ID ${id} not found`);
    }
    
    return businessType;
  }

  async deleteBusinessType(id: number): Promise<boolean> {
    const result = await db.delete(businessTypes).where(eq(businessTypes.id, id)).returning();
    return result.length > 0;
  }

  // Campaign operations
  async getCampaigns(businessId: number): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.businessId, businessId));
  }
  
  async getAllCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    // CreatedAt is handled by defaultNow() in the schema
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: number, campaignData: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set(campaignData)
      .where(eq(campaigns.id, id))
      .returning();
    
    if (!campaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }
    
    return campaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
  }

  // ROI calculation and comparison
  calculateROI(campaign: Campaign): number {
    if (!campaign.amountEarned || !campaign.amountSpent || Number(campaign.amountSpent) === 0) {
      return 0;
    }
    
    const spent = Number(campaign.amountSpent);
    const earned = Number(campaign.amountEarned);
    
    return ((earned - spent) / spent) * 100;
  }

  async getCampaignsWithROI(businessId: number): Promise<BusinessCampaignWithROI[]> {
    const campaigns = await this.getCampaigns(businessId);
    return campaigns.map(campaign => ({
      ...campaign,
      roi: this.calculateROI(campaign),
    }));
  }

  async getTopROICampaigns(
    businessType: string, 
    adMethodId: number, 
    latitude: number, 
    longitude: number, 
    radiusMiles: number,
    limit: number
  ): Promise<BusinessCampaignWithROI[]> {
    // Get businesses in radius
    const businessesInRadius = await this.getBusinessesInRadius(businessType, latitude, longitude, radiusMiles);
    const businessIds = businessesInRadius.map(b => b.id);
    
    if (businessIds.length === 0) {
      return [];
    }
    
    // Get campaigns for these businesses with the specified ad method
    const campaignsWithBusinesses = await db
      .select()
      .from(campaigns)
      .where(
        and(
          inArray(campaigns.businessId, businessIds),
          eq(campaigns.adMethodId, adMethodId)
        )
      );
    
    // Calculate ROI for each campaign
    const campaignsWithROI = await Promise.all(
      campaignsWithBusinesses.map(async campaign => {
        const business = businessesInRadius.find(b => b.id === campaign.businessId);
        const adMethod = await this.getAdMethod(campaign.adMethodId);
        
        return {
          ...campaign,
          roi: this.calculateROI(campaign),
          business,
          adMethod
        };
      })
    );
    
    // Sort by ROI and get top performers
    campaignsWithROI.sort((a, b) => b.roi - a.roi);
    
    // Add area rank
    const campaignsWithRank = campaignsWithROI.map((campaign, index) => ({
      ...campaign,
      areaRank: index + 1,
      totalInArea: campaignsWithROI.length
    }));
    
    return campaignsWithRank.slice(0, limit);
  }

  async getTopPerformers(): Promise<BusinessCampaignWithROI[]> {
    // Get all businesses
    const allBusinesses = await db.select().from(businesses);
    
    // Get all campaigns that have both spent and earned values
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .where(
        and(
          isNotNull(campaigns.amountSpent),
          isNotNull(campaigns.amountEarned)
        )
      );
    
    // Get all ad methods for reference
    const allAdMethods = await db.select().from(adMethods);
    
    // Calculate ROI for each campaign and add business and ad method info
    const campaignsWithROI = await Promise.all(
      allCampaigns.map(async campaign => {
        const business = allBusinesses.find(b => b.id === campaign.businessId);
        const adMethod = allAdMethods.find(m => m.id === campaign.adMethodId);
        
        return {
          ...campaign,
          roi: this.calculateROI(campaign),
          business,
          adMethod
        };
      })
    );
    
    // Sort by ROI descending and get top 10 performers
    const topPerformers = campaignsWithROI
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);
    
    return topPerformers;
  }

  async getBusinessStats(businessId: number): Promise<{ 
    activeCampaigns: number; 
    averageRoi: number; 
    totalSpent: number; 
    totalEarned: number;
    totalCampaigns: number;
  }> {
    const campaigns = await this.getCampaigns(businessId);
    
    const activeCampaigns = campaigns.filter(c => c.isActive).length;
    
    let totalSpent = 0;
    let totalEarned = 0;
    let totalRoi = 0;
    let completedCampaigns = 0;
    
    campaigns.forEach(campaign => {
      if (campaign.amountSpent) {
        totalSpent += Number(campaign.amountSpent);
      }
      
      if (campaign.amountEarned) {
        totalEarned += Number(campaign.amountEarned);
        completedCampaigns++;
        
        // Calculate ROI for this campaign
        if (campaign.amountSpent && Number(campaign.amountSpent) > 0) {
          const roi = this.calculateROI(campaign);
          totalRoi += roi;
        }
      }
    });
    
    const averageRoi = completedCampaigns > 0 ? totalRoi / completedCampaigns : 0;
    
    return {
      activeCampaigns,
      averageRoi,
      totalSpent,
      totalEarned,
      totalCampaigns: campaigns.length
    };
  }

  // Achievement operations
  async getAchievementTypes(): Promise<AchievementType[]> {
    return db.select().from(achievementTypes);
  }

  async getAchievementType(id: number): Promise<AchievementType | undefined> {
    const [achievementType] = await db.select().from(achievementTypes).where(eq(achievementTypes.id, id));
    return achievementType || undefined;
  }

  async createAchievementType(achievementType: InsertAchievementType): Promise<AchievementType> {
    const [newAchievementType] = await db.insert(achievementTypes).values(achievementType).returning();
    return newAchievementType;
  }

  async updateAchievementType(id: number, achievementType: Partial<InsertAchievementType>): Promise<AchievementType> {
    const [updatedAchievementType] = await db
      .update(achievementTypes)
      .set(achievementType)
      .where(eq(achievementTypes.id, id))
      .returning();
    
    if (!updatedAchievementType) {
      throw new Error(`Achievement type with ID ${id} not found`);
    }
    
    return updatedAchievementType;
  }

  async deleteAchievementType(id: number): Promise<boolean> {
    const result = await db.delete(achievementTypes).where(eq(achievementTypes.id, id)).returning();
    return result.length > 0;
  }
  
  // User Achievement operations
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async getUserAchievementWithType(id: number): Promise<(UserAchievement & { type: AchievementType }) | undefined> {
    const [userAchievement] = await db.select().from(userAchievements).where(eq(userAchievements.id, id));
    
    if (!userAchievement) {
      return undefined;
    }
    
    const achievementType = await this.getAchievementType(userAchievement.achievementTypeId);
    
    if (!achievementType) {
      throw new Error(`Achievement type with ID ${userAchievement.achievementTypeId} not found`);
    }
    
    return {
      ...userAchievement,
      type: achievementType
    };
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();
    return newUserAchievement;
  }

  async updateUserAchievement(id: number, userAchievement: Partial<InsertUserAchievement>): Promise<UserAchievement> {
    const [updatedUserAchievement] = await db
      .update(userAchievements)
      .set(userAchievement)
      .where(eq(userAchievements.id, id))
      .returning();
    
    if (!updatedUserAchievement) {
      throw new Error(`User achievement with ID ${id} not found`);
    }
    
    return updatedUserAchievement;
  }

  async getUserPoints(userId: number): Promise<number> {
    const userAchievements = await this.getUserAchievements(userId);
    
    if (userAchievements.length === 0) {
      return 0;
    }
    
    // Get all achievement types in a single query
    const achievementTypeIds = userAchievements.map(ua => ua.achievementTypeId);
    const types = await db.select().from(achievementTypes).where(inArray(achievementTypes.id, achievementTypeIds));
    
    // Map of achievement type ID to points
    const pointsMap = types.reduce((map, type) => {
      map[type.id] = type.points;
      return map;
    }, {} as Record<number, number>);
    
    // Calculate total points for completed achievements
    const totalPoints = userAchievements.reduce((total, ua) => {
      // The database may store boolean as null, so we need to explicitly check for true
      if ((ua.isCompleted === true) && pointsMap[ua.achievementTypeId]) {
        return total + pointsMap[ua.achievementTypeId];
      }
      return total;
    }, 0);
    
    return totalPoints;
  }

  async checkAndAwardAchievements(userId: number): Promise<UserAchievement[]> {
    // Get all achievement types
    const allAchievementTypes = await this.getAchievementTypes();
    
    // Get the user's existing achievements
    const existingAchievements = await this.getUserAchievements(userId);
    
    // Get user business
    const business = await this.getBusinessByUserId(userId);
    if (!business) {
      return [];
    }
    
    // Get user's campaigns
    const campaigns = await this.getCampaigns(business.id);
    const campaignsWithROI = campaigns.map(campaign => ({
      ...campaign,
      roi: this.calculateROI(campaign)
    }));
    
    // Get stats for criteria evaluation
    const stats = await this.getBusinessStats(business.id);
    
    const newAchievements: UserAchievement[] = [];
    
    // Check each achievement type that the user doesn't already have completed
    for (const achievementType of allAchievementTypes) {
      // Skip if the user already has this achievement completed
      const existingAchievement = existingAchievements.find(ea => 
        ea.achievementTypeId === achievementType.id && ea.isCompleted
      );
      
      if (existingAchievement) {
        continue;
      }
      
      // Parse criteria
      const criteria = achievementType.criteria as any;
      let progress = 0;
      let isCompleted = false;
      
      // Check criteria based on type
      if (criteria.type === 'campaignCount' || criteria.type === 'campaigns_created') {
        progress = campaigns.length;
        isCompleted = progress >= criteria.threshold;
      } 
      else if (criteria.type === 'activeCampaignCount' || criteria.type === 'active_campaigns') {
        progress = campaigns.filter(c => c.isActive).length;
        isCompleted = progress >= criteria.threshold;
      }
      else if (criteria.type === 'totalSpent' || criteria.type === 'total_spent') {
        progress = Math.round(stats.totalSpent);
        isCompleted = progress >= criteria.threshold;
      }
      else if (criteria.type === 'totalEarned' || criteria.type === 'total_earned') {
        progress = Math.round(stats.totalEarned);
        isCompleted = progress >= criteria.threshold;
      }
      else if (criteria.type === 'averageRoi' || criteria.type === 'roi_achieved') {
        progress = Math.round(stats.averageRoi);
        isCompleted = progress >= criteria.threshold;
      }
      
      // Create or update the achievement
      const existingInProgressAchievement = existingAchievements.find(ea => 
        ea.achievementTypeId === achievementType.id && !ea.isCompleted
      );
      
      if (existingInProgressAchievement) {
        // Update existing achievement
        const updated = await this.updateUserAchievement(existingInProgressAchievement.id, {
          progress,
          isCompleted
        });
        
        if (isCompleted) {
          newAchievements.push(updated);
        }
      } else {
        // Create new achievement
        const newAchievement = await this.createUserAchievement({
          userId,
          achievementTypeId: achievementType.id,
          progress,
          isCompleted
        });
        
        if (isCompleted) {
          newAchievements.push(newAchievement);
        }
      }
    }
    
    return newAchievements;
  }

  // Rewards operations
  async getRewards(): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.isActive, true));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward || undefined;
  }
  
  async getUserRewards(userId: number): Promise<(UserReward & { reward: Reward })[]> {
    const userRewardsResult = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId))
      .leftJoin(rewards, eq(userRewards.rewardId, rewards.id));
    
    // Transform join result into the expected format
    return userRewardsResult.map(result => ({
      ...result.user_rewards,
      reward: result.rewards
    }));
  }
  
  async purchaseReward(userId: number, rewardId: number): Promise<UserReward | { error: string }> {
    // Get the reward
    const reward = await this.getReward(rewardId);
    if (!reward) {
      return { error: "Reward not found" };
    }
    
    // Check if user has enough points
    const userPoints = await this.getUserPoints(userId);
    if (userPoints < reward.pointsCost) {
      return { error: "Not enough points" };
    }
    
    // Calculate expiration date if needed
    let expiresAt = null;
    if (reward.durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + reward.durationDays);
    }
    
    // Create user reward
    const [userReward] = await db
      .insert(userRewards)
      .values({
        userId,
        rewardId,
        expiresAt,
        isActive: true
      })
      .returning();
    
    return userReward;
  }
  
  async getUserBadges(userId: number): Promise<Badge[]> {
    // Get user's rewards that unlock badges
    const userRewardsResult = await db
      .select()
      .from(userRewards)
      .where(
        and(
          eq(userRewards.userId, userId),
          eq(userRewards.isActive, true)
        )
      )
      .leftJoin(rewards, eq(userRewards.rewardId, rewards.id));
    
    // Filter to only badge rewards
    const badgeRewards = userRewardsResult
      .filter(result => result.rewards.category === 'badge')
      .map(result => result.rewards.featureKey);
    
    // Get all badges
    const allBadges = await this.getBadges();
    
    // Return badges that match the unlocked feature keys
    return allBadges.filter(badge => 
      badgeRewards.includes(badge.name.toLowerCase().replace(/\s+/g, '_'))
    );
  }
  
  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge || undefined;
  }

  // Feature operations
  async getFeatures(): Promise<Feature[]> {
    return db.select().from(features);
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    const [feature] = await db.select().from(features).where(eq(features.id, id));
    return feature;
  }

  async getFeatureByKey(key: string): Promise<Feature | undefined> {
    const [feature] = await db.select().from(features).where(eq(features.key, key));
    return feature;
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    const [newFeature] = await db.insert(features).values(feature).returning();
    return newFeature;
  }

  async updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature> {
    const [updatedFeature] = await db
      .update(features)
      .set(feature)
      .where(eq(features.id, id))
      .returning();
    
    if (!updatedFeature) {
      throw new Error(`Feature with ID ${id} not found`);
    }
    
    return updatedFeature;
  }

  async deleteFeature(id: number): Promise<boolean> {
    const [deletedFeature] = await db
      .delete(features)
      .where(eq(features.id, id))
      .returning();
    
    return !!deletedFeature;
  }

  // Feature usage operations
  async recordFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage> {
    const [newUsage] = await db.insert(featureUsage).values(usage).returning();
    return newUsage;
  }

  async getFeatureUsage(featureId: number): Promise<FeatureUsage[]> {
    return db.select().from(featureUsage).where(eq(featureUsage.featureId, featureId));
  }

  async getFeatureUsageByUser(userId: number): Promise<FeatureUsage[]> {
    return db.select().from(featureUsage).where(eq(featureUsage.userId, userId));
  }

  async getFeatureUsageByBusiness(businessId: number): Promise<FeatureUsage[]> {
    return db.select().from(featureUsage).where(eq(featureUsage.businessId, businessId));
  }

  async getFeatureUsageAnalytics(): Promise<{
    byState: { state: string; count: number }[];
    byCity: { city: string; count: number }[];
    byBusinessType: { businessType: string; count: number }[];
    byYear: { year: number; count: number }[];
    byMonth: { year: number; month: number; count: number }[];
    byFeature: { featureName: string; count: number }[];
    topBusinesses: { businessName: string; count: number }[];
  }> {
    // Get all usage data with joined business and feature info
    const usageData = await db
      .select({
        usage: featureUsage,
        business: businesses,
        feature: features
      })
      .from(featureUsage)
      .leftJoin(businesses, eq(featureUsage.businessId, businesses.id))
      .leftJoin(features, eq(featureUsage.featureId, features.id));

    // Get list of all business types for counting
    const businessTypesList = await db.select().from(businessTypes);
    
    // Extract states and cities from addresses
    const stateRegex = /[A-Z]{2}$/; // Assumes US state format at end of address
    const cityBusinessMap = new Map<string, Set<number>>();
    const stateBusinessMap = new Map<string, Set<number>>();
    const businessTypeMap = new Map<string, Set<number>>();
    
    // Parse dates for time-based analytics
    const yearCounts: Record<number, number> = {};
    const monthCounts: Record<string, number> = {};
    
    // Feature usage counts
    const featureCounts: Record<string, number> = {};
    
    // Business usage counts
    const businessCounts: Record<string, number> = {};
    
    usageData.forEach(record => {
      if (record.business && record.business.address) {
        // Extract state (assuming US format)
        const stateMatch = record.business.address.match(stateRegex);
        if (stateMatch) {
          const state = stateMatch[0];
          if (!stateBusinessMap.has(state)) {
            stateBusinessMap.set(state, new Set());
          }
          stateBusinessMap.get(state)?.add(record.business.id);
        }
        
        // Extract city (this is simplified, would need more robust parsing in production)
        const addressParts = record.business.address.split(',');
        if (addressParts.length >= 2) {
          const city = addressParts[addressParts.length - 2].trim();
          if (!cityBusinessMap.has(city)) {
            cityBusinessMap.set(city, new Set());
          }
          cityBusinessMap.get(city)?.add(record.business.id);
        }
        
        // Business type tracking
        if (record.business.businessType) {
          if (!businessTypeMap.has(record.business.businessType)) {
            businessTypeMap.set(record.business.businessType, new Set());
          }
          businessTypeMap.get(record.business.businessType)?.add(record.business.id);
        }
        
        // Business name tracking
        if (record.business.name) {
          businessCounts[record.business.name] = (businessCounts[record.business.name] || 0) + (record.usage.usageCount || 1);
        }
      }
      
      // Date parsing
      if (record.usage.usedAt) {
        const date = new Date(record.usage.usedAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Count by year
        yearCounts[year] = (yearCounts[year] || 0) + (record.usage.usageCount || 1);
        
        // Count by year-month
        const yearMonthKey = `${year}-${month}`;
        monthCounts[yearMonthKey] = (monthCounts[yearMonthKey] || 0) + (record.usage.usageCount || 1);
      }
      
      // Feature counting
      if (record.feature && record.feature.name) {
        featureCounts[record.feature.name] = (featureCounts[record.feature.name] || 0) + (record.usage.usageCount || 1);
      }
    });
    
    // Format results
    const byState = Array.from(stateBusinessMap.entries()).map(([state, businesses]) => ({
      state,
      count: usageData.filter(r => r.business && businesses.has(r.business.id))
        .reduce((sum, r) => sum + (r.usage.usageCount || 1), 0)
    }));
    
    const byCity = Array.from(cityBusinessMap.entries()).map(([city, businesses]) => ({
      city,
      count: usageData.filter(r => r.business && businesses.has(r.business.id))
        .reduce((sum, r) => sum + (r.usage.usageCount || 1), 0)
    }));
    
    const byBusinessType = Array.from(businessTypeMap.entries()).map(([businessType, businesses]) => ({
      businessType,
      count: usageData.filter(r => r.business && businesses.has(r.business.id))
        .reduce((sum, r) => sum + (r.usage.usageCount || 1), 0)
    }));
    
    const byYear = Object.entries(yearCounts).map(([year, count]) => ({
      year: parseInt(year),
      count
    }));
    
    const byMonth = Object.entries(monthCounts).map(([yearMonth, count]) => {
      const [year, month] = yearMonth.split('-').map(Number);
      return { year, month, count };
    });
    
    const byFeature = Object.entries(featureCounts).map(([featureName, count]) => ({
      featureName,
      count
    }));
    
    const topBusinesses = Object.entries(businessCounts)
      .map(([businessName, count]) => ({ businessName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      byState,
      byCity,
      byBusinessType,
      byYear,
      byMonth,
      byFeature,
      topBusinesses
    };
  }
  
  // Recommendation operations
  async getRecommendationsForBusiness(businessId: number): Promise<AdRecommendation[]> {
    // Get the most recent recommendations first
    const recommendations = await db
      .select()
      .from(adRecommendations)
      .where(eq(adRecommendations.businessId, businessId))
      .orderBy(adRecommendations.generatedAt, 'desc');
      
    return recommendations;
  }
  
  async getRecommendationItems(recommendationId: number): Promise<AdRecommendationItem[]> {
    const items = await db
      .select()
      .from(adRecommendationItems)
      .where(eq(adRecommendationItems.recommendationId, recommendationId))
      .orderBy(adRecommendationItems.rank, 'asc');
      
    // Get ad method details for each item
    const adMethodIds = items.map(item => item.adMethodId);
    if (adMethodIds.length === 0) return items;
    
    const methods = await db
      .select()
      .from(adMethods)
      .where(inArray(adMethods.id, adMethodIds));
      
    // Join the ad methods with the items
    return items.map(item => {
      const adMethod = methods.find(m => m.id === item.adMethodId);
      return {
        ...item,
        adMethod
      };
    });
  }
  
  async markRecommendationAsViewed(recommendationId: number): Promise<boolean> {
    try {
      await db
        .update(adRecommendations)
        .set({ isViewed: true })
        .where(eq(adRecommendations.id, recommendationId));
      return true;
    } catch (error) {
      console.error("Error marking recommendation as viewed:", error);
      return false;
    }
  }
  
  async recordRecommendationInteraction(interaction: {
    userId: number;
    recommendationId: number;
    interactionType: string;
    feedback?: string | null;
    implementationDetails?: any;
  }): Promise<UserRecommendationInteraction> {
    const [result] = await db
      .insert(userRecommendationInteractions)
      .values(interaction as any)
      .returning();
    return result;
  }
  
  async getRecommendationInteractions(recommendationId: number): Promise<UserRecommendationInteraction[]> {
    const timestampColumn = userRecommendationInteractions.timestamp;
    return db
      .select()
      .from(userRecommendationInteractions)
      .where(eq(userRecommendationInteractions.recommendationId, recommendationId))
      .orderBy(timestampColumn, 'desc');
  }
  
  async getUserImplementations(userId: number): Promise<any[]> {
    // Get all IMPLEMENT interactions for this user
    const timestampColumn = userRecommendationInteractions.timestamp;
    const interactionTypeColumn = userRecommendationInteractions.interactionType;
    const userIdColumn = userRecommendationInteractions.userId;
    
    const interactions = await db
      .select()
      .from(userRecommendationInteractions)
      .where(
        and(
          eq(userIdColumn, userId),
          eq(interactionTypeColumn, 'IMPLEMENT')
        )
      )
      .orderBy(timestampColumn, 'desc');
    
    // If there are no implementations, return empty array
    if (interactions.length === 0) {
      return [];
    }
    
    // Get all the recommendation IDs from the interactions
    const recommendationIds = Array.from(new Set(interactions.map(i => i.recommendationId)));
    
    // Get the recommendations
    const recommendations = await db
      .select()
      .from(adRecommendations)
      .where(inArray(adRecommendations.id, recommendationIds));
    
    // Get all recommendation items
    const recommendationItems = await db
      .select()
      .from(adRecommendationItems)
      .where(inArray(adRecommendationItems.recommendationId, recommendationIds));
    
    // Get all related ad methods
    const adMethodIds = Array.from(new Set(recommendationItems.map(item => item.adMethodId)));
    const methods = await db
      .select()
      .from(adMethods)
      .where(inArray(adMethods.id, adMethodIds));
    
    // Combine data for response
    return interactions.map(interaction => {
      const recommendation = recommendations.find(r => r.id === interaction.recommendationId);
      if (!recommendation) return null;
      
      const items = recommendationItems
        .filter(item => item.recommendationId === recommendation.id)
        .map(item => {
          const adMethod = methods.find(m => m.id === item.adMethodId);
          return {
            ...item,
            adMethod
          };
        });
      
      return {
        id: interaction.id,
        timestamp: interaction.timestamp,
        feedback: interaction.feedback,
        implementationDetails: interaction.implementationDetails,
        recommendation: {
          ...recommendation,
          adRecommendationItems: items
        }
      };
    }).filter(Boolean); // Remove any null entries
  }
  
  // Pricing Recommendation operations
  async getPricingRecommendations(businessId: number, options: { limit?: number, adMethodId?: number } = {}): Promise<PricingRecommendation[]> {
    try {
      // Start with a base query
      let query = db
        .select()
        .from(pricingRecommendations)
        .where(eq(pricingRecommendations.businessId, businessId));
      
      // Add filter by ad method if specified
      if (options.adMethodId) {
        query = query.where(eq(pricingRecommendations.adMethodId, options.adMethodId));
      }
      
      // Order by most recent first
      query = query.orderBy(pricingRecommendations.createdAt, 'desc');
      
      // Limit results if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // Execute query
      const recommendations = await query;
      return recommendations;
    } catch (error) {
      console.error(`Error fetching pricing recommendations for business ${businessId}:`, error);
      return [];
    }
  }
  
  async getPricingRecommendationById(id: number): Promise<PricingRecommendation | undefined> {
    try {
      const [recommendation] = await db
        .select()
        .from(pricingRecommendations)
        .where(eq(pricingRecommendations.id, id));
      
      return recommendation;
    } catch (error) {
      console.error(`Error fetching pricing recommendation ${id}:`, error);
      return undefined;
    }
  }
  
  async createPricingRecommendation(recommendation: InsertPricingRecommendation): Promise<PricingRecommendation> {
    try {
      // Ensure createdAt is set
      const recWithTimestamp = {
        ...recommendation,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [result] = await db
        .insert(pricingRecommendations)
        .values(recWithTimestamp)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating pricing recommendation:', error);
      throw new Error('Failed to create pricing recommendation');
    }
  }
  
  async updatePricingRecommendation(id: number, updates: Partial<PricingRecommendation>): Promise<PricingRecommendation | undefined> {
    try {
      // Ensure updatedAt is set
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      
      const [result] = await db
        .update(pricingRecommendations)
        .set(updatesWithTimestamp)
        .where(eq(pricingRecommendations.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Error updating pricing recommendation ${id}:`, error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();