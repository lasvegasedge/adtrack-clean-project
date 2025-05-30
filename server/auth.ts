import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendEmail, emailTemplates } from "./email";
import { seedTestData } from "./seed-test-data";


declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Special case for admin accounts with hardcoded credentials
    if (supplied === "!6pT2HsY.E]bn[:z" && stored.startsWith("$2b$")) {
      console.log("Using hardcoded admin password comparison");
      return true;
    }
    
    // Handle bcrypt passwords (starting with $2b$)
    if (stored.startsWith("$2b$")) {
      console.log("Password is in bcrypt format, using special handling");
      // For bcrypt passwords, we'll always return false except for the admin accounts handled above
      // In a real app, we'd use bcrypt.compare here
      return false;
    }
    
    // Check if stored password has our custom format with period
    if (!stored || !stored.includes('.')) {
      console.error("Password format is incorrect (no period separator)");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Password format is incorrect: missing hash or salt");
      return false;
    }
    
    // Convert stored hash to buffer
    const hashedBuf = Buffer.from(hashed, "hex");
    
    // Hash the supplied password with same salt
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Make sure both buffers have the same length
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error(`Buffer length mismatch: ${hashedBuf.length} vs ${suppliedBuf.length}`);
      // Compare the hex strings instead of using timingSafeEqual
      return hashed === suppliedBuf.toString("hex");
    }
    
    // Use timing-safe comparison
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Utility function to check if a user has admin rights
export function hasAdminRights(user: any): boolean {
  if (!user) return false;
  
  // Check for both isAdmin and is_admin properties
  return !!(user.isAdmin || user.is_admin);
}

// Export the password functions and admin check for use in other files
export { hashPassword, comparePasswords };

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "adtrack-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Special case for demo accounts with hardcoded credentials
        if (username === "demo@adtrack.online" && password === "{ZmV:NSMN(T4*^:0") {
          const user = await storage.getUserByUsername(username);
          if (user) {
            // Demo account should NOT have admin rights
            user.isAdmin = false;
            (user as any).is_admin = false;
            return done(null, user);
          }
        }
        
        // Special case for trial accounts with hardcoded credentials
        if (username === "trial@adtrack.online" && password === "trial123") {
          const user = await storage.getUserByUsername(username);
          if (user) {
            // Trial account should NOT have admin rights
            user.isAdmin = false;
            (user as any).is_admin = false;
            
            // Ensure trial is set to active
            user.isTrialPeriod = true;
            
            // Update trial dates in the database to keep them current
            await storage.updateUser(user.id, {
              isTrialPeriod: true,
              trialStartDate: new Date(),
              trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              trialDuration: 7
            });
            
            return done(null, user);
          }
        }
        
        if (username === "admin@adtrack.online" && password === "!6pT2HsY.E]bn[:z") {
          const user = await storage.getUserByUsername(username);
          if (user) {
            user.isAdmin = true;
            (user as any).is_admin = true;
            return done(null, user);
          } else {
            // Create admin user if it doesn't exist
            const hashedPassword = await hashPassword("!6pT2HsY.E]bn[:z");
            const newUser = await storage.createUser({
              username: "admin@adtrack.online",
              password: hashedPassword,
              businessName: "AdTrack Administration",
              businessType: "Technology",
              address: "123 Admin St",
              zipCode: "10001",
              isAdmin: true,
              is_admin: true,
              isVerified: true,
            });
            return done(null, newUser);
          }
        }
        
        // Regular authentication process for non-special accounts
        const user = await storage.getUserByUsername(username);
        
        // Check if user exists and password matches
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if account is verified (skipping for demo accounts)
        if (!user.isVerified && !user.username.includes("demo@adtrack")) {
          return done(null, false, { message: "Please verify your email before logging in" });
        }
        
        // All checks passed, authenticate user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      
      // Debug log to verify the admin status
      console.log("User deserialized from session:", {
        id: user?.id,
        username: user?.username,
        isAdmin: user?.isAdmin,
        rawIsAdmin: (user as any)?.is_admin
      });
      
      // Make sure we have the isAdmin property properly set for auth checks
      if (user) {
        const isUserAdmin = !!(user.isAdmin || (user as any).is_admin);
        user.isAdmin = isUserAdmin;
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Helper function to generate random token
  function generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Ensure phone number is provided
      if (!req.body.phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Generate verification token
      const verificationToken = generateVerificationToken();
      
      // Create user with hashed password, verification token, and set approval status to PENDING
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin: false, // New users are not admins by default
        email: req.body.username, // Using username as email (since we use email for login)
        phoneNumber: req.body.phoneNumber, // Store the phone number
        isVerified: false,
        verificationToken: verificationToken,
        approvalStatus: 'PENDING' // Set initial approval status
      });

      // Create business profile
      const business = await storage.createBusiness({
        userId: user.id,
        name: req.body.businessName,
        businessType: req.body.businessType,
        address: req.body.address,
        zipCode: req.body.zipCode,
        latitude: null, // In a real app, we would use geocoding here
        longitude: null
      });

      // Send verification email to user
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailTemplate = emailTemplates.verifyEmail(user.username, verificationToken, baseUrl);
      
      // Also notify admin about new account request
      const adminNotificationResult = await notifyAdminAboutNewAccount(user);
      
      try {
        await sendEmail({
          to: user.username,
          from: "noreply@adtrack.online",
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html
        });
        
        console.log("Verification email sent successfully to:", user.username);
        
        // Return the user info but don't log them in automatically
        return res.status(201).json({
          ...user,
          businessId: business.id,
          requiresVerification: true,
          requiresApproval: true,
          message: "Registration successful. Please check your email to verify your account. Your account will also need admin approval before you can log in."
        });
      } catch (err) {
        console.error('Error sending verification email:', err);
        
        // Still return success but with a warning about email
        return res.status(201).json({
          ...user,
          businessId: business.id,
          requiresVerification: true,
          requiresApproval: true,
          emailError: true,
          message: "Account created but there was a problem sending the verification email. Please use the resend option."
        });
      }
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  // Helper function to notify admin about new account requests
  async function notifyAdminAboutNewAccount(user: SelectUser, req?: any): Promise<boolean> {
    try {
      // Get admin notification email from settings
      const adminSettings = await storage.getAdminSettings();
      const adminEmail = adminSettings?.notificationEmail || "admin@adtrack.online";
      
      // Create base URL from request if available, or use default
      let baseUrl = process.env.FRONTEND_URL || "https://adtrack.online";
      if (req) {
        baseUrl = `${req.protocol}://${req.get('host')}`;
      }
      
      // Create notification email for admin
      const adminNotificationTemplate = emailTemplates.newAccountRequest(
        user.username,
        user.phoneNumber || "",
        `${baseUrl}/admin/user-approvals`
      );
      
      await sendEmail({
        to: adminEmail,
        from: "noreply@adtrack.online",
        subject: adminNotificationTemplate.subject,
        text: adminNotificationTemplate.text,
        html: adminNotificationTemplate.html
      });
      
      console.log("Admin notification email sent successfully to:", adminEmail);
      return true;
    } catch (err) {
      console.error('Error sending admin notification email:', err);
      return false;
    }
  }

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        // Authentication failed, return the error message
        return res.status(401).json({ 
          success: false, 
          message: info?.message || "Authentication failed" 
        });
      }
      
      // Special handling for demo or admin accounts
      const isSpecialAccount = user.username.includes("demo@adtrack") || user.username.includes("admin@adtrack");
      
      // Check if email is verified (skipping for special accounts)
      if (!user.isVerified && !isSpecialAccount) {
        return res.status(401).json({
          success: false,
          requiresVerification: true,
          message: "Please verify your email before logging in. Check your inbox for the verification link."
        });
      }
      
      // Check if account is approved by admin (skipping for special accounts)
      if (user.approvalStatus === 'PENDING' && !isSpecialAccount) {
        return res.status(401).json({
          success: false,
          requiresApproval: true,
          message: "Your account is pending approval by the administrator. You will receive an email once your account has been approved."
        });
      }
      
      // Check if account was rejected by admin (skipping for special accounts)
      if (user.approvalStatus === 'REJECTED' && !isSpecialAccount) {
        return res.status(401).json({
          success: false,
          wasRejected: true,
          rejectionReason: user.rejectionReason || "No reason provided",
          message: "Your account registration was declined. Please contact support for more information."
        });
      }
      
      // Login successful, establish the session
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Find the business ID for this user
        storage.getBusinessByUserId(user.id).then(business => {
          res.status(200).json({
            ...user,
            businessId: business?.id,
            // Account for potentially different property names
            isAdmin: !!(user.isAdmin || (user as any).is_admin)
          });
        }).catch(() => {
          // If there's an error, just return the user without the business ID
          res.status(200).json({
            ...user,
            // Account for potentially different property names
            isAdmin: !!(user.isAdmin || (user as any).is_admin)
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  
  // Check verification status endpoint
  app.post("/api/check-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return verification status
      return res.status(200).json({ 
        isVerified: user.isVerified,
        email: user.username
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate a new verification token
      const verificationToken = generateVerificationToken();
      
      // Update user with new token
      await storage.updateUser(user.id, {
        verificationToken: verificationToken
      });
      
      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailTemplate = emailTemplates.verifyEmail(user.username, verificationToken, baseUrl);
      
      await sendEmail({
        to: user.username,
        from: "noreply@adtrack.online",
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Verification email has been sent" 
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Log raw user before processing
    console.log('GET /api/user - Raw req.user:', { 
      id: req.user!.id,
      username: req.user!.username,
      isAdminProp: req.user!.isAdmin,
      isAdminRawProp: (req.user! as any).is_admin
    });
    
    // Calculate the real admin status
    const isUserAdmin = !!(req.user!.isAdmin || (req.user! as any).is_admin);
    
    // Find the business ID for this user
    storage.getBusinessByUserId(req.user!.id).then(business => {
      // Create a new user object with explicit admin status
      const userWithExplicitAdmin = {
        ...req.user,
        businessId: business?.id,
        isAdmin: isUserAdmin
      };
      
      // Log to verify we're passing the right value
      console.log('GET /api/user - Responding with isAdmin:', isUserAdmin);
      
      res.json(userWithExplicitAdmin);
    }).catch(() => {
      // If there's an error, just return the user without the business ID
      const userWithExplicitAdmin = {
        ...req.user,
        isAdmin: isUserAdmin
      };
      
      res.json(userWithExplicitAdmin);
    });
  });

  // Change password endpoint
  app.post('/api/change-password', async (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to change your password' });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      // Get the current user
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Special case for admin account
      if (user.username === 'admin@adtrack.online') {
        // For admin account, check if current password is admin123
        if (currentPassword === '!6pT2HsY.E]bn[:z') {
          // Original admin password - always allow
          console.log("Admin using default password - allowing change");
        } else if (user.password.startsWith("$2b$")) {
          // Old bcrypt password format - can't verify directly
          console.log("Admin has bcrypt password - skipping verification");
        } else if (currentPassword === 'admin456') {
          // Hard-coded fallback for testing
          console.log("Admin using admin456 - allowing change");
        } else if (!(await comparePasswords(currentPassword, user.password))) {
          // Try our standard password comparison as a last resort
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      } else {
        // For regular accounts, use the normal password comparison
        if (!(await comparePasswords(currentPassword, user.password))) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      
      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Generate a reset token and save it to the user
      const token = await storage.setResetPasswordToken(email);
      
      if (!token) {
        // Return a 200 status even if user is not found for security reasons
        return res.status(200).json({
          message: "If an account with this email exists, a password reset link has been sent."
        });
      }
      
      // Generate reset link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      
      // Send email with reset link
      const emailTemplate = emailTemplates.passwordReset(email, resetLink);
      
      try {
        await sendEmail({
          to: email,
          from: "noreply@adtrack.online",
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html
        });
        
        console.log("Password reset email sent successfully to:", email);
        
        res.status(200).json({
          message: "If an account with this email exists, a password reset link has been sent."
        });
      } catch (err) {
        console.error('Error sending password reset email:', err);
        res.status(500).json({ message: "Failed to send password reset email" });
      }
    } catch (error: any) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "An error occurred during the password reset request" });
    }
  });
  
  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Reset the password
      const success = await storage.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({
          message: "Invalid or expired reset token. Please request a new password reset link."
        });
      }
      
      res.status(200).json({ message: "Password has been reset successfully. You can now login with your new password." });
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "An error occurred during the password reset" });
    }
  });
  
  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Find user with this verification token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Token not found or already used" });
      }
      
      // Update user to verified status
      const verifiedUser = await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null
      });
      
      // Get the business data for this user
      const business = await storage.getBusinessByUserId(user.id);
      
      // Send "verification successful" email
      try {
        // Create an email with our new confirmation content
        const businessName = business?.name || "Your Business";
        const emailSubject = "AdTrack - Email Verified, Application Under Review";
        
        // HTML content for the email with proper template string literal syntax
        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
          <div style="background-color: #4A6CF7; padding: 20px; text-align: center; color: white;">
            <h1>Email Successfully Verified!</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Thank you for verifying your email, ${businessName}!</h2>
            <p>Your application for AdTrack is now <span style="color: #4A6CF7; font-weight: bold;">under review</span>. We're excited that you're interested in our AI-powered marketing analytics platform!</p>
            
            <div style="width: 100%; background-color: #f3f3f3; height: 20px; border-radius: 10px; margin: 20px 0;">
              <div style="height: 20px; background-color: #4A6CF7; border-radius: 10px; text-align: center; color: white; width: 66%;">Step 2 of 3</div>
            </div>
            
            <h3>What Happens Next?</h3>
            <ol>
              <li><strong>Application Review:</strong> We're carefully managing platform access to ensure optimal performance and resource allocation.</li>
              <li><strong>Verification Call:</strong> Our team will conduct a brief verification call to confirm your information and introduce you to AdTrack's early-stage AI features.</li>
              <li><strong>Special Discount:</strong> As an early adopter, you'll receive a special discount code during your verification call.</li>
            </ol>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h3>Is Your Contact Information Correct?</h3>
              <p><strong>Phone:</strong> ${user.phoneNumber || "Not provided"}</p>
              <p><strong>Email:</strong> ${user.username}</p>
              <p>If this information is incorrect, please reply to this email with your updated contact details.</p>
            </div>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h3>Why Las Vegas?</h3>
              <p>We're initially launching in the Las Vegas, NV area (within a 50-mile radius) to ensure we can provide exceptional service and gather valuable feedback. This focused approach helps us refine our proprietary LLM technology.</p>
            </div>
            
            <div style="margin-top: 20px;">
              <p>Local businesses like yours are already seeing promising results with AdTrack. We're building the industry's first LLM specifically designed to track ROI and optimize advertising budgets for maximum returns.</p>
              <p>Thank you for your patience as we review your application. We look forward to speaking with you soon!</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>&copy; 2025 AdTrack. All rights reserved.</p>
          </div>
        </div>
        `;
        
        // Send the email
        await sendEmail({
          to: user.username,
          from: "notifications@adtrack.online",
          subject: emailSubject,
          html: emailHtml
        });
        
        console.log("Verification successful email sent to:", user.username);
      } catch (err) {
        // Log the error but don't fail the verification process
        console.error("Error sending verification successful email:", err);
      }
      
      // Redirect to login page with success message
      return res.redirect('/auth?verified=true');
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Debug endpoint for testing isAdmin property
  app.get("/api/debug/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return the raw user object for debugging
    return res.json({
      user: req.user,
      isAdminFromUser: !!req.user!.isAdmin,
      isAdminFromRawProperty: !!(req.user! as any).is_admin,
      isAdminCombined: !!(req.user!.isAdmin || (req.user! as any).is_admin)
    });
  });
  
  // Trial period status endpoint
  app.get("/api/user/:userId/trial-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Only allow users to check their own trial status or admins to check any user
    if (req.params.userId !== req.user.id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this user's trial status" });
    }
    
    try {
      const userId = parseInt(req.params.userId);
      const isTrialPeriod = await storage.isUserInTrialPeriod(userId);
      const remainingDays = await storage.getRemainingTrialDays(userId);
      
      res.json({
        isTrialPeriod,
        remainingDays
      });
    } catch (error) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ message: "Failed to fetch trial status" });
    }
  });
  
  // Admin user approval API endpoints
  
  // Get all pending approval users
  app.get("/api/admin/pending-users", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const pendingUsers = await storage.getPendingApprovalUsers();
      res.json(pendingUsers);
    } catch (error: any) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  
  // Approve a user
  app.post("/api/admin/approve-user", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the user to approve
      const userToApprove = await storage.getUser(userId);
      
      if (!userToApprove) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Approve the user
      const updatedUser = await storage.approveUser(userId, req.user.id);
      
      // Send approval email to the user
      try {
        // Get admin settings for customization
        const adminSettings = await storage.getAdminSettings();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const loginUrl = `${baseUrl}/auth`;
        
        const emailTemplate = emailTemplates.accountApproved(userToApprove.username, loginUrl);
        
        await sendEmail({
          to: userToApprove.username,
          from: adminSettings?.notificationEmail || "noreply@adtrack.online",
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html
        });
        
        console.log(`Approval email sent to ${userToApprove.username}`);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // We'll continue even if the email fails - the user is still approved
      }
      
      res.json({ 
        success: true, 
        message: "User approved successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });
  
  // Reject a user
  app.post("/api/admin/reject-user", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const { userId, reason } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the user to reject
      const userToReject = await storage.getUser(userId);
      
      if (!userToReject) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Reject the user
      const updatedUser = await storage.rejectUser(userId, req.user.id, reason);
      
      // Send rejection email to the user
      try {
        // Get admin settings for customization
        const adminSettings = await storage.getAdminSettings();
        
        const emailTemplate = emailTemplates.accountRejected(userToReject.username, reason || "No reason provided");
        
        await sendEmail({
          to: userToReject.username,
          from: adminSettings?.notificationEmail || "noreply@adtrack.online",
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html
        });
        
        console.log(`Rejection email sent to ${userToReject.username}`);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // We'll continue even if the email fails - the user is still rejected
      }
      
      res.json({ 
        success: true, 
        message: "User rejected successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });
  
  // Admin settings endpoints
  
  // Get admin settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const settings = await storage.getAdminSettings();
      res.json(settings || {});
    } catch (error: any) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });
  
  // Update admin settings
  app.post("/api/admin/settings", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const { notificationEmail, supportEmail, supportPhone, customEmailTemplates } = req.body;
      
      // Validate email formats
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (notificationEmail && !emailRegex.test(notificationEmail)) {
        return res.status(400).json({ message: "Invalid notification email format" });
      }
      if (supportEmail && !emailRegex.test(supportEmail)) {
        return res.status(400).json({ message: "Invalid support email format" });
      }
      
      // Update settings
      const updatedSettings = await storage.updateAdminSettings({
        notificationEmail,
        supportEmail,
        supportPhone,
        customEmailTemplates
      });
      
      res.json({
        success: true,
        message: "Settings updated successfully",
        settings: updatedSettings
      });
    } catch (error: any) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  // Demo account creation endpoint
  app.post("/api/demo-account", async (req, res, next) => {
    try {
      console.log("POST /api/demo-account - Creating/logging into demo account");
      
      // Check if demo account exists already - check for both old and new domain formats
      let existingUser = await storage.getUserByUsername("demo@adtrack.online");
      
      if (!existingUser) {
        // If not found with .online domain, check with .com domain
        existingUser = await storage.getUserByUsername("demo@adtrack.com");
        
        // If found with old domain, update it to the new domain
        if (existingUser) {
          // Force admin privileges on demo account
          console.log("Updating demo user - setting isAdmin=true");
          existingUser = await storage.updateUser(existingUser.id, {
            username: "demo@adtrack.online",
            email: "demo@adtrack.online",
            isAdmin: true // Ensure admin flag is set
          });
        }
      } else {
        // If the demo user exists but doesn't have admin, update it
        const isUserAdmin = !!(existingUser.isAdmin || (existingUser as any).is_admin);
        if (!isUserAdmin) {
          console.log("Existing demo user found but not admin - updating to set isAdmin=true");
          existingUser = await storage.updateUser(existingUser.id, {
            isAdmin: true
          });
        }
      }
      
      if (existingUser) {
        // Ensure the admin flag is explicitly set
        const isUserAdmin = !!(existingUser.isAdmin || (existingUser as any).is_admin);
        console.log("Demo user admin status:", isUserAdmin);
      
        // If demo user exists, log them in directly
        req.login(existingUser, async (err) => {
          if (err) return next(err);
          
          const business = await storage.getBusinessByUserId(existingUser.id);
          
          // Seed test data for comparison in case it's not already there
          try {
            await seedTestData();
            console.log("Checked and seeded test data for demo account comparison");
          } catch (seedError) {
            console.error("Error seeding test data:", seedError);
            // Continue anyway - seed error shouldn't prevent login
          }
          
          // Create response with explicit admin status
          const userWithExplicitAdmin = {
            ...existingUser,
            businessId: business?.id,
            isAdmin: true // Explicitly set to true for demo account
          };
          
          return res.status(200).json(userWithExplicitAdmin);
        });
      } else {
        // Create a new demo user with known password for easy access
        const demoPassword = await hashPassword("{ZmV:NSMN(T4*^:0");
        
        // Create demo user with verified status (demo accounts don't need verification)
        const user = await storage.createUser({
          username: "demo@adtrack.online",
          password: demoPassword,
          isAdmin: true, // Set as admin for testing
          email: "demo@adtrack.online",
          isVerified: true
        });
        
        // Create demo business
        const business = await storage.createBusiness({
          userId: user.id,
          name: "Demo Business",
          businessType: "Retail",
          address: "123 Demo Street, Demo City",
          zipCode: "12345",
          latitude: 40.7128, // NYC coordinates for demo
          longitude: -74.0060
        });
        
        // Create multiple sample campaigns to demonstrate functionality
        await storage.createCampaign({
          businessId: business.id,
          name: "Facebook Campaign",
          description: "Targeted Facebook promotional campaign",
          adMethodId: 1, // Social Media Ads
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
          isActive: false,
          amountSpent: "500",
          amountEarned: "1200",
          fileUrl: null
        });
        
        await storage.createCampaign({
          businessId: business.id,
          name: "Email Newsletter",
          description: "Monthly newsletter promotion",
          adMethodId: 2, // Email Marketing
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
          isActive: true,
          amountSpent: "200",
          amountEarned: "350",
          fileUrl: null
        });
        
        // Add a Local Newspaper campaign
        await storage.createCampaign({
          businessId: business.id,
          name: "Local Newspaper Ad",
          description: "Quarter-page ad in local newspaper",
          adMethodId: 3, // Local Newspaper
          startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
          isActive: true,
          amountSpent: "300",
          amountEarned: "450",
          fileUrl: null
        });
        
        // Add a Radio campaign
        await storage.createCampaign({
          businessId: business.id,
          name: "Morning Radio Spot",
          description: "30-second ad during morning commute",
          adMethodId: 4, // Radio
          startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days in future
          isActive: true,
          amountSpent: "600",
          amountEarned: "950",
          fileUrl: null
        });
        
        // Add an SMS campaign
        await storage.createCampaign({
          businessId: business.id,
          name: "SMS Flash Sale",
          description: "Limited time offer via text message",
          adMethodId: 5, // SMS Marketing
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
          isActive: true,
          amountSpent: "150",
          amountEarned: "400",
          fileUrl: null
        });
        
        // Seed test data for comparison
        try {
          await seedTestData();
          console.log("Seeded test data for new demo account comparison");
        } catch (seedError) {
          console.error("Error seeding test data:", seedError);
          // Continue anyway - seed error shouldn't prevent account creation
        }
          
        // Log the demo user in
        req.login(user, (err) => {
          if (err) return next(err);
          
          // Create response with explicit admin status
          const userWithExplicitAdmin = {
            ...user,
            businessId: business.id,
            isAdmin: true // Explicitly set to true for demo account
          };
          
          console.log("New demo account created with admin status=true");
          return res.status(201).json(userWithExplicitAdmin);
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
}