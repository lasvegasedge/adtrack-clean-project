import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  RefreshCw, 
  Eye, 
  Code, 
  SendHorizonal,
  Save,
  AlertCircle
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Template types with friendly names
enum TemplateType {
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

const templateTypeNames = {
  [TemplateType.PASSWORD_RESET]: "Password Reset",
  [TemplateType.ROI_ALERT]: "ROI Alert",
  [TemplateType.CAMPAIGN_REMINDER]: "Campaign Reminder",
  [TemplateType.WEEKLY_REPORT]: "Weekly Report",
  [TemplateType.EMAIL_VERIFICATION]: "Email Verification",
  [TemplateType.NEW_ACCOUNT_REQUEST]: "New Account Request",
  [TemplateType.ACCOUNT_APPROVED]: "Account Approved",
  [TemplateType.ACCOUNT_REJECTED]: "Account Rejected",
  [TemplateType.VERIFICATION_SUCCESSFUL]: "Verification Successful"
};

// Template variables by type
const templateVariables = {
  [TemplateType.PASSWORD_RESET]: [
    { name: "resetLink", description: "Password reset URL" },
    { name: "username", description: "User's email address" }
  ],
  [TemplateType.ROI_ALERT]: [
    { name: "campaignName", description: "Name of the campaign" },
    { name: "roi", description: "ROI percentage value" },
    { name: "businessName", description: "Name of the business" }
  ],
  [TemplateType.CAMPAIGN_REMINDER]: [
    { name: "campaignName", description: "Name of the campaign" },
    { name: "daysInactive", description: "Number of days inactive" },
    { name: "businessName", description: "Name of the business" }
  ],
  [TemplateType.WEEKLY_REPORT]: [
    { name: "businessName", description: "Business name" },
    { name: "totalCampaigns", description: "Number of active campaigns" },
    { name: "averageRoi", description: "Average ROI percentage" },
    { name: "weekNumber", description: "Current week number" },
    { name: "reportDate", description: "Date of the report" }
  ],
  [TemplateType.EMAIL_VERIFICATION]: [
    { name: "verificationLink", description: "Email verification URL" },
    { name: "username", description: "User's email address" }
  ],
  [TemplateType.VERIFICATION_SUCCESSFUL]: [
    { name: "businessName", description: "Business name" },
    { name: "phoneNumber", description: "User's phone number" },
    { name: "username", description: "User's email address" }
  ],
  [TemplateType.NEW_ACCOUNT_REQUEST]: [
    { name: "businessName", description: "Business name" },
    { name: "requestDate", description: "Date of request" },
    { name: "username", description: "User's email address" }
  ],
  [TemplateType.ACCOUNT_APPROVED]: [
    { name: "businessName", description: "Business name" },
    { name: "username", description: "User's email address" },
    { name: "loginLink", description: "Link to log in" }
  ],
  [TemplateType.ACCOUNT_REJECTED]: [
    { name: "businessName", description: "Business name" },
    { name: "username", description: "User's email address" },
    { name: "reason", description: "Reason for rejection" }
  ]
};

// Template descriptions
const templateDescriptions = {
  [TemplateType.PASSWORD_RESET]: "Sent to users when they request a password reset.",
  [TemplateType.ROI_ALERT]: "Notification sent when a campaign ROI changes significantly.",
  [TemplateType.CAMPAIGN_REMINDER]: "Reminds users to update their campaign performance data.",
  [TemplateType.WEEKLY_REPORT]: "Weekly summary of business performance and analytics.",
  [TemplateType.EMAIL_VERIFICATION]: "Sent to users to verify their email address.",
  [TemplateType.NEW_ACCOUNT_REQUEST]: "Notification to admins when a new account is requested.",
  [TemplateType.ACCOUNT_APPROVED]: "Sent to users when their account is approved.",
  [TemplateType.ACCOUNT_REJECTED]: "Sent to users when their account request is rejected.",
  [TemplateType.VERIFICATION_SUCCESSFUL]: "Sent to users after they successfully verify their email."
};

// Default template HTML content
const defaultTemplates = {
  [TemplateType.VERIFICATION_SUCCESSFUL]: `<!DOCTYPE html>
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
  [TemplateType.PASSWORD_RESET]: `<!DOCTYPE html>
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
  [TemplateType.ROI_ALERT]: `<!DOCTYPE html>
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
  [TemplateType.CAMPAIGN_REMINDER]: `<!DOCTYPE html>
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
  [TemplateType.WEEKLY_REPORT]: `<!DOCTYPE html>
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
  [TemplateType.EMAIL_VERIFICATION]: `<!DOCTYPE html>
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
  [TemplateType.NEW_ACCOUNT_REQUEST]: `<!DOCTYPE html>
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
  [TemplateType.ACCOUNT_APPROVED]: `<!DOCTYPE html>
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
  [TemplateType.ACCOUNT_REJECTED]: `<!DOCTYPE html>
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
</html>`
};

// Email template schema
const emailTemplateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  isCustomized: z.boolean().optional(),
});

type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;

// Test email schema
const testEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type TestEmailFormValues = z.infer<typeof testEmailSchema>;

export default function EmailTemplates() {
  const { toast } = useToast();
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType>(TemplateType.PASSWORD_RESET);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch templates from API
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/email-templates');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching email templates:', error);
        return {};
      }
    }
  });

  // Get the currently selected template
  const selectedTemplate = templates && templates[selectedTemplateType] 
    ? templates[selectedTemplateType] 
    : {
        subject: `AdTrack - ${templateTypeNames[selectedTemplateType]}`,
        htmlContent: defaultTemplates[selectedTemplateType],
        isCustomized: false
      };

  // Form for editing template
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      subject: selectedTemplate?.subject || '',
      htmlContent: selectedTemplate?.htmlContent || '',
      isCustomized: selectedTemplate?.isCustomized || false
    }
  });

  // Form for test email
  const testEmailForm = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      email: ''
    }
  });

  // Current template variables
  const currentTemplateVariables = templateVariables[selectedTemplateType] || [];

  // Update form values when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.reset({
        subject: selectedTemplate.subject || '',
        htmlContent: selectedTemplate.htmlContent || '',
        isCustomized: selectedTemplate.isCustomized || false
      });
    } else {
      // Use default template if none exists
      const defaultTemplate = defaultTemplates[selectedTemplateType];
      form.reset({
        subject: `AdTrack - ${templateTypeNames[selectedTemplateType]}`,
        htmlContent: defaultTemplate,
        isCustomized: false
      });
    }
  }, [selectedTemplate, selectedTemplateType, form, templates]);

  // Update iframe preview when content changes
  useEffect(() => {
    if (previewIframeRef.current) {
      const doc = previewIframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // Replace template variables with sample values for preview
        let htmlContent = form.watch('htmlContent');
        
        currentTemplateVariables.forEach(variable => {
          const placeholderRegex = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
          
          // Sample values for preview
          let sampleValue = '';
          switch(variable.name) {
            case 'resetLink':
            case 'verificationLink':
            case 'loginLink':
              sampleValue = 'https://example.com/link';
              break;
            case 'username':
              sampleValue = 'user@example.com';
              break;
            case 'businessName':
              sampleValue = 'Example Business';
              break;
            case 'campaignName':
              sampleValue = 'Summer Promotion';
              break;
            case 'roi':
              sampleValue = '142.5';
              break;
            case 'daysInactive':
              sampleValue = '7';
              break;
            case 'totalCampaigns':
              sampleValue = '5';
              break;
            case 'averageRoi':
              sampleValue = '128.3';
              break;
            case 'weekNumber':
              sampleValue = '24';
              break;
            case 'reportDate':
              sampleValue = 'May 16, 2025';
              break;
            case 'requestDate':
              sampleValue = 'May 15, 2025';
              break;
            case 'reason':
              sampleValue = 'Additional verification required';
              break;
            default:
              sampleValue = `[${variable.name}]`;
          }
          
          htmlContent = htmlContent.replace(placeholderRegex, sampleValue);
        });
        
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [form.watch('htmlContent'), currentTemplateVariables, previewIframeRef]);

  // Function to handle sending test email
  const handleSendTestEmail = async () => {
    // Get values from the form
    const email = testEmailForm.getValues().email;
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setSendingTestEmail(true);
    
    try {
      const templateData = form.getValues();
      
      // Log what we're sending to help debug
      console.log('Sending email test request with template type:', selectedTemplateType);
      
      // Use a generic type string for test emails to avoid validation errors
      const response = await apiRequest('POST', '/api/email-templates/send-test-email', {
        email: email,
        templateType: String(selectedTemplateType),
        type: String(selectedTemplateType), // Add type field for backward compatibility 
        subject: templateData.subject,
        htmlContent: templateData.htmlContent
      });
      
      if (response.ok) {
        toast({
          title: "Test email sent",
          description: `Email sent to ${email}`,
        });
        testEmailForm.reset();
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to send test email",
          description: errorData.message || "An error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Mutation to save template
  const saveMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormValues) => {
      const response = await apiRequest('POST', `/api/email-templates/${selectedTemplateType}`, {
        ...data,
        isCustomized: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Template saved",
        description: "Email template has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Mutation to reset template to default
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/email-templates/${selectedTemplateType}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Template reset",
        description: "Email template has been reset to default"
      });
      
      // Reset form with default values
      form.reset({
        subject: `AdTrack - ${templateTypeNames[selectedTemplateType]}`,
        htmlContent: defaultTemplates[selectedTemplateType],
        isCustomized: false
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: EmailTemplateFormValues) => {
    saveMutation.mutate(values);
  };

  // Template selection
  const handleTemplateChange = (value: string) => {
    setSelectedTemplateType(value as TemplateType);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          <CardTitle>Email Templates</CardTitle>
        </div>
        <CardDescription>
          Customize system email templates for various notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load email templates. Please try again later.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue={selectedTemplateType} onValueChange={handleTemplateChange}>
          <TabsList className="mb-4 flex flex-wrap">
            {Object.entries(templateTypeNames).map(([type, name]) => (
              <TabsTrigger key={type} value={type}>{name}</TabsTrigger>
            ))}
          </TabsList>
          
          <div className="my-4">
            <p className="text-sm text-muted-foreground">
              {templateDescriptions[selectedTemplateType]}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edit panel */}
            <div>
              <h3 className="text-lg font-medium mb-4">Edit Template</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="htmlContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter email HTML content" 
                            className="font-mono h-[400px] resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => resetMutation.mutate()}
                      disabled={isLoading || resetMutation.isPending || !selectedTemplate?.isCustomized}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Default
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={isLoading || saveMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </form>
              </Form>
              
              <div className="mt-6 p-4 border rounded-md bg-muted">
                <h3 className="text-md font-medium mb-2">Available Template Variables</h3>
                <div className="grid grid-cols-1 gap-2">
                  {currentTemplateVariables.map((variable) => (
                    <div key={variable.name} className="bg-card p-2 rounded text-sm flex justify-between items-center">
                      <code>${'{' + variable.name + '}'}</code>
                      <span className="text-muted-foreground">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Test email form */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Send Test Email</h3>
                <Form {...testEmailForm}>
                  <div className="space-y-4">
                    <FormField
                      control={testEmailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} />
                            </FormControl>
                            <Button 
                              type="button"
                              onClick={handleSendTestEmail}
                              disabled={sendingTestEmail}
                            >
                              <SendHorizonal className="mr-2 h-4 w-4" />
                              {sendingTestEmail ? 'Sending...' : 'Send'}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </div>
            
            {/* Preview panel */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Preview</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="preview-mode" className="text-sm">View mode:</Label>
                  <div className="flex space-x-1">
                    <Button 
                      variant={previewMode === 'desktop' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      Desktop
                    </Button>
                    <Button 
                      variant={previewMode === 'mobile' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      Mobile
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className={`border rounded-md overflow-hidden bg-white ${
                previewMode === 'mobile' ? 'w-[375px] mx-auto h-[600px]' : 'w-full h-[600px]'
              }`}>
                <iframe 
                  ref={previewIframeRef}
                  title="Email Preview" 
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                />
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <Code className="mr-2 h-4 w-4" />
                  <p className="text-sm font-medium">Subject: {form.watch('subject')}</p>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Changes to email templates will affect all outgoing emails of the selected type.
        </p>
      </CardFooter>
    </Card>
  );
}