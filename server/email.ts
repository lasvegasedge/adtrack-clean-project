import { MailService } from '@sendgrid/mail';

// Check if SendGrid API key is available
// Set a hardcoded API key for testing

console.log("API key first 10 chars:", apiKey.substring(0, 10));

// Initialize the SendGrid mail service
const mailService = new MailService();

// Track if we're in mock mode
let mockMode = false;

// Validate SendGrid API key format
if (!apiKey) {
  console.log("INFO: SENDGRID_API_KEY environment variable is not set. Running in EMAIL MOCK MODE.");
  mockMode = true;
} else if (!apiKey.startsWith('SG.')) {
  console.log("INFO: API key does not start with \"SG.\". Running in EMAIL MOCK MODE.");
  mockMode = true;
} else {
  try {
    mailService.setApiKey(apiKey);
    console.log("SendGrid API key successfully configured");
  } catch (error) {
    console.error("Error setting SendGrid API key:", error);
    mockMode = true;
  }
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // For test emails, always log content regardless of API key
    if (params.subject && params.subject.includes('[TEST]')) {
      console.log('-------- TEST EMAIL CONTENT --------');
      console.log(`To: ${params.to}`);
      console.log(`From: ${params.from}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text: ${params.text || 'No text content'}`);
      console.log(`HTML: ${params.html ? 'HTML content available' : 'No HTML content'}`);
      console.log('-------- END TEST EMAIL --------');
    }
    const apiKey = process.env.SENDGRID_API_KEY || "";    
    // Check if API key is set and valid
    if (!apiKey || !apiKey.startsWith('SG.')) {
      // Log the email content for testing when no valid API key is available
      console.log('-------- EMAIL WOULD BE SENT (MOCK MODE) --------');
      console.log(`To: ${params.to}`);
      console.log(`From: ${params.from}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text: ${params.text || ''}`);
      console.log('-------- END EMAIL --------');
      
      // If in mock mode, still record that we would have sent an email in the verification flow
      if (params.subject && params.subject.includes('Verify Your AdTrack Account')) {
        console.log(`Verification email would be sent to ${params.to} (verification link in email content)`);
      }
      
      return true; // Return success in mock mode
    }
    
    // In production mode, use a safer sender domain 
    // SendGrid requires the sender domain to be verified
    // For testing, we'll use a 'from' address from a common domain
    if (params.from === "noreply@adtrack.com") {
      params.from = "test@example.com";
    }
    
    // Real email sending with error handling
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });
    
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  passwordReset: (username: string, resetLink: string) => ({
    subject: `Reset Your AdTrack Password`,
    text: `Hello ${username},\n\nWe received a request to reset your password for your AdTrack account. To reset your password, please click the following link: ${resetLink}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you did not request a password reset, please ignore this email and your password will remain unchanged.\n\nBest regards,\nThe AdTrack Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
        <h2 style="color: #333;">Reset Your AdTrack Password</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password for your AdTrack account. To reset your password, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="margin-bottom: 5px;">This link will expire in 1 hour for security reasons.</p>
        <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="background-color: #f9f9f9; padding: 10px; word-break: break-all; font-size: 14px;">${resetLink}</p>
        <p style="color: #666;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
          <p>This is an automated email from AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  }),
  
  roiAlert: (campaignName: string, roi: number) => ({
    subject: `ROI Update: ${campaignName}`,
    text: `Your campaign "${campaignName}" has reached an ROI of ${roi.toFixed(2)}%.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
        <h2 style="color: #333;">ROI Update: ${campaignName}</h2>
        <p>Good news! Your campaign "${campaignName}" has reached an ROI of <strong style="color: #22c55e;">${roi.toFixed(2)}%</strong>.</p>
        <p>Log in to your AdTrack dashboard to see more details about this campaign's performance.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
          <p>This is an automated notification from AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  }),
  
  campaignReminder: (campaignName: string, daysInactive: number) => ({
    subject: `Reminder: Update Required for ${campaignName}`,
    text: `Your campaign "${campaignName}" has been inactive for ${daysInactive} days. Please update its status or results.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
        <h2 style="color: #333;">Campaign Update Reminder</h2>
        <p>Your campaign "${campaignName}" has been inactive for <strong>${daysInactive} days</strong>.</p>
        <p>Please log in to your AdTrack dashboard to update its status or results.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
          <p>This is an automated notification from AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  }),
  
  weeklyReport: (businessName: string, totalCampaigns: number, averageRoi: number) => ({
    subject: `Weekly Report: ${businessName}`,
    text: `Weekly report for ${businessName}: You have ${totalCampaigns} active campaigns with an average ROI of ${averageRoi.toFixed(2)}%.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
        <h2 style="color: #333;">Weekly Performance Report: ${businessName}</h2>
        <p>Here's a summary of your advertising performance this week:</p>
        <ul>
          <li>Active Campaigns: <strong>${totalCampaigns}</strong></li>
          <li>Average ROI: <strong style="color: ${averageRoi >= 0 ? '#22c55e' : '#ef4444'};">${averageRoi.toFixed(2)}%</strong></li>
        </ul>
        <p>Log in to your AdTrack dashboard for more detailed insights and analytics.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
          <p>This is an automated notification from AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  }),
  
  verifyEmail: (username: string, verificationToken: string, baseUrl: string) => {
    const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;
    
    return {
      subject: `Verify Your AdTrack Account`,
      text: `Welcome to AdTrack! Please verify your email address by clicking on the following link: ${verificationLink}\n\nAfter verification, your account will be reviewed by our admin team. You will receive another email once your account has been approved.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to AdTrack!</h2>
          <p>Thank you for registering. To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px;">${verificationLink}</p>
          <p style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border-left: 4px solid #3b82f6; font-size: 14px;">
            <strong>Important:</strong> After verification, your account will be reviewed by our admin team. You will receive another email once your account has been approved.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
            <p>If you did not create an account with AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>, please ignore this email.</p>
          </div>
        </div>
      `,
    };
  },
  
  newAccountRequest: (username: string, phoneNumber: string, approvalUrl: string) => ({
    subject: `New AdTrack Account Request Requires Your Approval`,
    text: `ACTION REQUIRED: New Account Request on AdTrack Platform

A new business has registered for AdTrack and is awaiting your approval.

REQUEST DETAILS:
- Email Address: ${username}
- Phone Number: ${phoneNumber}

To APPROVE this request, visit: ${approvalUrl}
To REJECT this request, visit: ${approvalUrl}

You can also review this request in detail on the Admin Dashboard.

SECURITY NOTE: All approval actions are securely logged for audit purposes. For security reasons, this approval link will expire in 24 hours.

This is an automated message from the AdTrack platform.
© 2025 AdTrack. All rights reserved.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3f57f5; padding: 20px; text-align: center;">
            <img src="https://adtrack.online/logo.png" alt="AdTrack Logo" style="max-height: 60px;">
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e1e1e1; border-top: none;">
            <h2 style="color: #333;">Action Required: New Account Request</h2>
            
            <p>A new business has requested to join the AdTrack platform and is awaiting your approval.</p>
            
            <div style="background-color: #f7f9fc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3f57f5;">
              <h3 style="margin-top: 0;">Request Details</h3>
              <p style="margin: 5px 0;"><strong>Email Address:</strong> ${username}</p>
              <p style="margin: 5px 0;"><strong>Phone Number:</strong> ${phoneNumber}</p>
              <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${approvalUrl}?action=approve" style="display: inline-block; padding: 12px 25px; border-radius: 4px; text-decoration: none; font-weight: bold; background-color: #4caf50; color: white; margin: 0 10px;">Approve Account</a>
              <a href="${approvalUrl}?action=reject" style="display: inline-block; padding: 12px 25px; border-radius: 4px; text-decoration: none; font-weight: bold; background-color: #f44336; color: white; margin: 0 10px;">Reject Account</a>
            </div>
            
            <p>You can also review this request in detail on the <a href="${approvalUrl}" style="color: #3f57f5; text-decoration: none;">Admin Dashboard</a>.</p>
            
            <div style="background-color: #fffde7; padding: 12px; border-radius: 4px; margin: 20px 0; font-size: 14px;">
              <strong>Security Note:</strong> All approval actions are securely logged for audit purposes. For security reasons, this approval link will expire in 24 hours.
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message from the AdTrack platform.</p>
            <p>&copy; 2025 AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  accountApproved: (username: string, loginUrl: string) => ({
    subject: `Congratulations! Your AdTrack Account is Approved`,
    text: `WELCOME TO ADTRACK, ${username}!

Great news! Your account has been approved and is now ready to use.

NEXT STEPS:
1. Log in to your account
2. Complete your business profile
3. Add your first advertising campaign
4. Explore the ROI tracking dashboard

To log in now, visit: ${loginUrl}

KEY FEATURES AVAILABLE TO YOU:

- ROI Tracking: Monitor the performance of all your advertising campaigns in real-time.
- Competitor Analysis: See how your campaigns perform against similar businesses in your area.
- AI Recommendations: Get smart suggestions to optimize your advertising budget and strategy.
- Marketing Insights: Translate complex data into actionable business intelligence.

If you have any questions, our support team is here to help you get started.

© 2025 AdTrack. All rights reserved.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3f57f5; padding: 20px; text-align: center;">
            <img src="https://adtrack.online/logo.png" alt="AdTrack Logo" style="max-height: 60px;">
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e1e1e1; border-top: none;">
            <h2 style="color: #333;">Welcome to AdTrack, ${username}!</h2>
            
            <div style="font-size: 18px; text-align: center; margin: 20px 0;">
              <p>Great news! Your account has been approved and is now ready to use.</p>
            </div>
            
            <div style="background-color: #f7f9fc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="margin-top: 0;">Next Steps:</h3>
              <ol style="margin-bottom: 0;">
                <li>Log in to your account</li>
                <li>Complete your business profile</li>
                <li>Add your first advertising campaign</li>
                <li>Explore the ROI tracking dashboard</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; background-color: #3f57f5; color: white;">Log In Now</a>
            </div>
            
            <h3>Key Features Available to You:</h3>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin: 20px 0;">
              <div style="flex-basis: 48%; margin-bottom: 15px; padding: 10px; background-color: #f0f4f8; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #3f57f5;">ROI Tracking</h4>
                <p style="margin-bottom: 0;">Monitor the performance of all your advertising campaigns in real-time.</p>
              </div>
              <div style="flex-basis: 48%; margin-bottom: 15px; padding: 10px; background-color: #f0f4f8; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #3f57f5;">Competitor Analysis</h4>
                <p style="margin-bottom: 0;">See how your campaigns perform against similar businesses in your area.</p>
              </div>
              <div style="flex-basis: 48%; margin-bottom: 15px; padding: 10px; background-color: #f0f4f8; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #3f57f5;">AI Recommendations</h4>
                <p style="margin-bottom: 0;">Get smart suggestions to optimize your advertising budget and strategy.</p>
              </div>
              <div style="flex-basis: 48%; margin-bottom: 15px; padding: 10px; background-color: #f0f4f8; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #3f57f5;">Marketing Insights</h4>
                <p style="margin-bottom: 0;">Translate complex data into actionable business intelligence.</p>
              </div>
            </div>
            
            <p>If you have any questions, our support team is here to help you get started.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>&copy; 2025 AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. All rights reserved.</p>
            <p>
              <a href="#" style="color: #3f57f5; text-decoration: none;">Help Center</a> | 
              <a href="mailto:support@adtrack.online" style="color: #3f57f5; text-decoration: none;">Contact Support</a> | 
              <a href="#" style="color: #3f57f5; text-decoration: none;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  accountRejected: (username: string, reason: string) => ({
    subject: `Your AdTrack Account Request`,
    text: `Hello ${username},\n\nUnfortunately, your AdTrack account request has been declined. Reason: ${reason || "No specific reason provided."}\n\nIf you believe this is an error or have questions, please contact our support team.\n\nBest regards,\nThe AdTrack Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
        <h2 style="color: #333;">Your Account Request Status</h2>
        <p>Hello ${username},</p>
        <p>Unfortunately, your AdTrack account request has been declined.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || "No specific reason provided."}</p>
        </div>
        <p>If you believe this is an error or have questions, please contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #888;">
          <p>This is an automated notification from AdTrack | <span style="color: #2563eb; font-weight: 500;">AI-Powered Solutions</span>. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  })
};

