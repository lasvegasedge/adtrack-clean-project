import { sendEmail, emailTemplates } from './email';
import { storage } from './storage';
import { Campaign, Business, NotificationSettings } from '@shared/schema';

// ROI thresholds that trigger notifications (in percentages)
const ROI_NOTIFICATION_THRESHOLDS = [25, 50, 100, 200];

// Days of inactivity before sending a reminder
const CAMPAIGN_REMINDER_DAYS = 14;

// Day of the week for weekly reports (0 = Sunday, 1 = Monday, etc.)
const WEEKLY_REPORT_DAY = 1; // Monday

/**
 * Processes a campaign update and sends notifications if needed
 */
export async function processCampaignUpdate(campaign: Campaign): Promise<boolean> {
  try {
    // Check if this campaign has amountEarned set (required for ROI calculation)
    if (!campaign.amountEarned) {
      return false;
    }
    
    // Get business details
    const business = await storage.getBusiness(campaign.businessId);
    if (!business) {
      console.error(`Business not found for campaign ${campaign.id}`);
      return false;
    }
    
    // Get user details
    const user = await storage.getUser(business.userId);
    if (!user) {
      console.error(`User not found for business ${business.id}`);
      return false;
    }
    
    // Get notification settings
    const settings = await storage.getNotificationSettings(user.id);
    if (!settings || !settings.roiAlerts) {
      // User doesn't have notification settings or has disabled ROI alerts
      return false;
    }
    
    // Calculate ROI
    const amountSpent = parseFloat(campaign.amountSpent.toString());
    const amountEarned = parseFloat(campaign.amountEarned.toString());
    const roi = ((amountEarned - amountSpent) / amountSpent) * 100;
    
    // Check if ROI crosses any notification thresholds
    const shouldNotify = ROI_NOTIFICATION_THRESHOLDS.some(threshold => {
      // Ensure ROI is just crossing the threshold (within 5%)
      return roi >= threshold && roi <= threshold + 5;
    });
    
    if (shouldNotify) {
      // Send ROI notification
      const emailContent = emailTemplates.roiAlert(campaign.name, roi);
      await sendEmail({
        to: settings.email,
        from: 'noreply@adtrack.com',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
      
      // Update last notification timestamp
      await storage.updateNotificationSettings(settings.id, {
        lastNotified: new Date()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error processing campaign update:', error);
    return false;
  }
}

/**
 * Sends reminders for campaigns that haven't been updated for a while
 */
export async function sendCampaignReminders(): Promise<number> {
  try {
    let remindersSent = 0;
    
    // Get all active campaigns
    const allCampaigns = await storage.getAllActiveCampaigns();
    
    // Get the current date
    const now = new Date();
    const reminderCutoffDate = new Date(now);
    reminderCutoffDate.setDate(reminderCutoffDate.getDate() - CAMPAIGN_REMINDER_DAYS);
    
    // Process each campaign
    for (const campaign of allCampaigns) {
      // Skip campaigns that were updated recently or have an end date
      if (campaign.endDate || new Date(campaign.startDate) > reminderCutoffDate) {
        continue;
      }
      
      // Get business details
      const business = await storage.getBusiness(campaign.businessId);
      if (!business) continue;
      
      // Get user details
      const user = await storage.getUser(business.userId);
      if (!user) continue;
      
      // Get notification settings
      const settings = await storage.getNotificationSettings(user.id);
      if (!settings || !settings.campaignReminders) continue;
      
      // Calculate days since campaign start
      const daysActive = Math.floor((now.getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder
      const emailContent = emailTemplates.campaignReminder(campaign.name, daysActive);
      const emailSent = await sendEmail({
        to: settings.email,
        from: 'noreply@adtrack.com',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
      
      if (emailSent) {
        remindersSent++;
        
        // Update last notification timestamp
        await storage.updateNotificationSettings(settings.id, {
          lastNotified: new Date()
        });
      }
    }
    
    return remindersSent;
  } catch (error) {
    console.error('Error sending campaign reminders:', error);
    return 0;
  }
}

/**
 * Sends weekly performance reports to users who have enabled them
 */
export async function sendWeeklyReports(): Promise<number> {
  try {
    let reportsSent = 0;
    
    // Only run this on the configured day of the week
    const today = new Date();
    if (today.getDay() !== WEEKLY_REPORT_DAY) {
      return 0;
    }
    
    // Get all businesses
    const allBusinesses = await storage.getAllBusinesses();
    
    // Process each business
    for (const business of allBusinesses) {
      // Get user details
      const user = await storage.getUser(business.userId);
      if (!user) continue;
      
      // Get notification settings
      const settings = await storage.getNotificationSettings(user.id);
      if (!settings || !settings.weeklyReports) continue;
      
      // Get business stats
      const stats = await storage.getBusinessStats(business.id);
      
      // Send weekly report
      const emailContent = emailTemplates.weeklyReport(
        business.name,
        stats.activeCampaigns,
        stats.averageRoi
      );
      
      const emailSent = await sendEmail({
        to: settings.email,
        from: 'noreply@adtrack.com',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
      
      if (emailSent) {
        reportsSent++;
        
        // Update last notification timestamp
        await storage.updateNotificationSettings(settings.id, {
          lastNotified: new Date()
        });
      }
    }
    
    return reportsSent;
  } catch (error) {
    console.error('Error sending weekly reports:', error);
    return 0;
  }
}