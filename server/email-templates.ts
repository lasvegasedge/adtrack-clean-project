// Template types
export enum EmailTemplateType {
  PASSWORD_RESET = "passwordReset",
  ROI_ALERT = "roiAlert",
  CAMPAIGN_REMINDER = "campaignReminder",
  WEEKLY_REPORT = "weeklyReport",
  EMAIL_VERIFICATION = "emailVerification",
  NEW_ACCOUNT_REQUEST = "newAccountRequest",
  ACCOUNT_APPROVED = "accountApproved",
  ACCOUNT_REJECTED = "accountRejected",
  VERIFICATION_SUCCESSFUL = "verificationSuccessful"
}

// Email template interface
export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  isCustomized: boolean;
}

// Store templates in memory (in production, these would be stored in the database)
const templates: Record<string, EmailTemplate> = {};

// Default templates (used when no customized template exists)
export const defaultTemplates: Record<string, EmailTemplate> = {
  [EmailTemplateType.VERIFICATION_SUCCESSFUL]: {
    subject: "AdTrack - Email Verified, Application Under Review",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified - Application Under Review</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .section { margin-bottom: 20px; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .progress-container { width: 100%; background-color: #f3f3f3; height: 20px; border-radius: 10px; margin: 20px 0; }
    .progress-bar { height: 20px; background-color: #4A6CF7; border-radius: 10px; text-align: center; color: white; }
    .faq { background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .faq h3 { margin-top: 0; }
    .contact-info { background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Successfully Verified!</h1>
    </div>
    <div class="content">
      <div class="section">
        <h2>Thank you for verifying your email, \${businessName}!</h2>
        <p>Your application for AdTrack is now <span class="highlight">under review</span>. We're excited that you're interested in our AI-powered marketing analytics platform!</p>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar" style="width: 66%">Step 2 of 3</div>
      </div>
      
      <div class="section">
        <h3>What Happens Next?</h3>
        <p>We're currently reviewing applications in the order they were received. Here's what you can expect:</p>
        <ol>
          <li><strong>Application Review:</strong> We're carefully managing platform access to ensure optimal performance and resource allocation.</li>
          <li><strong>Verification Call:</strong> Our team will conduct a brief verification call to confirm your information and introduce you to AdTrack's early-stage AI features.</li>
          <li><strong>Special Discount:</strong> As an early adopter, you'll receive a special discount code during your verification call.</li>
        </ol>
      </div>
      
      <div class="contact-info">
        <h3>Is Your Contact Information Correct?</h3>
        <p>We'll use this information for your verification call:</p>
        <p><strong>Phone:</strong> \${phoneNumber}</p>
        <p><strong>Email:</strong> \${username}</p>
        <p>If this information is incorrect, please reply to this email with your updated contact details.</p>
      </div>
      
      <div class="section">
        <h3>Why Las Vegas?</h3>
        <p>We're initially launching in the Las Vegas, NV area (within a 50-mile radius) to ensure we can provide exceptional service and gather valuable feedback. This focused approach helps us refine our proprietary LLM technology.</p>
      </div>
      
      <div class="faq">
        <h3>Frequently Asked Questions</h3>
        <p><strong>Q: How long will the approval process take?</strong><br>
        A: Typically 2-3 business days, depending on application volume.</p>
        
        <p><strong>Q: What should I expect during the verification call?</strong><br>
        A: A brief 10-15 minute conversation to confirm your business details and explain how AdTrack's AI will evolve as we gather more data.</p>
        
        <p><strong>Q: Will I be charged during the initial period?</strong><br>
        A: No. You'll receive a 7-day free trial after approval, and as an early adopter, you'll qualify for special pricing.</p>
      </div>
      
      <div class="section" style="margin-top: 20px;">
        <p>Local businesses like yours are already seeing promising results with AdTrack. We're building the industry's first LLM specifically designed to track ROI and optimize advertising budgets for maximum returns.</p>
        <p>Thank you for your patience as we review your application. We look forward to speaking with you soon!</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.PASSWORD_RESET]: {
    subject: "AdTrack - Reset Your Password",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello \${username},</p>
      <p>We received a request to reset your AdTrack password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="\${resetLink}" class="button">Reset Password</a>
      </p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.ROI_ALERT]: {
    subject: "AdTrack - ROI Alert for Your Campaign",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROI Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ROI Alert</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We noticed a significant change in the ROI for your campaign <span class="highlight">\${campaignName}</span> at <span class="highlight">\${businessName}</span>.</p>
      <p>Current ROI: <span class="highlight">\${roi}%</span></p>
      <p>Log in to your AdTrack dashboard to see detailed performance metrics and AI-powered recommendations for optimizing this campaign.</p>
      <p style="text-align: center;">
        <a href="https://adtrack.online/dashboard" class="button">View Campaign Details</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.CAMPAIGN_REMINDER]: {
    subject: "AdTrack - Campaign Update Reminder",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Update Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Campaign Update Reminder</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your campaign <span class="highlight">\${campaignName}</span> for <span class="highlight">\${businessName}</span> has not been updated in <span class="highlight">\${daysInactive} days</span>.</p>
      <p>Regular updates help our AI provide more accurate recommendations and ROI tracking. Please take a moment to update your campaign performance data.</p>
      <p style="text-align: center;">
        <a href="https://adtrack.online/dashboard" class="button">Update Campaign Data</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.WEEKLY_REPORT]: {
    subject: "AdTrack - Your Weekly Performance Report",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .stats { margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly Performance Report</h1>
      <p>Week \${weekNumber} | \${reportDate}</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Here's your weekly performance summary for <span class="highlight">\${businessName}</span>:</p>
      
      <div class="stats">
        <p><strong>Active Campaigns:</strong> \${totalCampaigns}</p>
        <p><strong>Average ROI:</strong> \${averageRoi}%</p>
      </div>
      
      <p>Log in to your AdTrack dashboard to view detailed performance metrics and AI-powered recommendations.</p>
      <p style="text-align: center;">
        <a href="https://adtrack.online/dashboard" class="button">View Full Report</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.EMAIL_VERIFICATION]: {
    subject: "AdTrack - Verify Your Email Address",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p>Hello \${username},</p>
      <p>Thank you for creating an account with AdTrack. Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="\${verificationLink}" class="button">Verify Email</a>
      </p>
      <p>If you didn't create an account with AdTrack, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.NEW_ACCOUNT_REQUEST]: {
    subject: "AdTrack - New Account Request",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Account Request</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Account Request</h1>
    </div>
    <div class="content">
      <p>Hello Admin,</p>
      <p>A new account request has been submitted:</p>
      <p><strong>Business Name:</strong> \${businessName}</p>
      <p><strong>Email:</strong> \${username}</p>
      <p><strong>Date Requested:</strong> \${requestDate}</p>
      <p>Please review this request in the AdTrack admin panel.</p>
      <p style="text-align: center;">
        <a href="https://adtrack.online/admin" class="button">Review Request</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.ACCOUNT_APPROVED]: {
    subject: "AdTrack - Your Account Has Been Approved",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .highlight { color: #4A6CF7; font-weight: bold; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Approved</h1>
    </div>
    <div class="content">
      <p>Hello \${username},</p>
      <p>Congratulations! Your AdTrack account for <span class="highlight">\${businessName}</span> has been approved.</p>
      <p>You can now log in and start tracking your advertising ROI, accessing AI recommendations, and comparing your performance with similar businesses.</p>
      <p style="text-align: center;">
        <a href="\${loginLink}" class="button">Log In Now</a>
      </p>
      <p>Thank you for choosing AdTrack for your marketing analytics needs.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  },
  [EmailTemplateType.ACCOUNT_REJECTED]: {
    subject: "AdTrack - Account Request Not Approved",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Request Not Approved</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A6CF7; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .reason { margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px; }
    .button { display: inline-block; background-color: #4A6CF7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Request Not Approved</h1>
    </div>
    <div class="content">
      <p>Hello \${username},</p>
      <p>We regret to inform you that your AdTrack account request for <strong>\${businessName}</strong> has not been approved at this time.</p>
      
      <div class="reason">
        <p><strong>Reason:</strong> \${reason}</p>
      </div>
      
      <p>If you believe this is an error or would like to provide additional information, please contact our support team.</p>
      <p style="text-align: center;">
        <a href="https://adtrack.online/contact" class="button">Contact Support</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 AdTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    isCustomized: false
  }
};

// Get a template (either customized or default)
export function getTemplate(type: EmailTemplateType): EmailTemplate {
  return templates[type] || defaultTemplates[type];
}

// Get all templates
export function getAllTemplates(): Record<string, EmailTemplate> {
  const allTemplates: Record<string, EmailTemplate> = {};
  
  // Start with all default templates
  Object.keys(defaultTemplates).forEach(key => {
    allTemplates[key] = defaultTemplates[key as EmailTemplateType];
  });
  
  // Override with any customized templates
  Object.keys(templates).forEach(key => {
    allTemplates[key] = templates[key];
  });
  
  return allTemplates;
}

// Save a customized template
export function saveTemplate(type: EmailTemplateType, template: EmailTemplate): void {
  templates[type] = {
    ...template,
    isCustomized: true
  };
}

// Delete a customized template (revert to default)
export function deleteTemplate(type: EmailTemplateType): void {
  delete templates[type];
}

// Helper to apply template variables
export function applyTemplateVariables(htmlContent: string, variables: Record<string, string>): string {
  let result = htmlContent;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}