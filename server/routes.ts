import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, hasAdminRights } from "./auth";
import { sendEmail, emailTemplates } from "./email";
import { generateMarketingAdvice } from "./chatbot";
import { createPaymentIntent, getPaymentIntent } from "./stripe";
import * as stripeModule from "./stripe";
import { addPaymentMethod, checkPaymentMethod, removePaymentMethod } from "./payment-methods";
import { generateMarketingInsights, initializeAnthropicClient, getFallbackInsights } from "./marketingInsights";
import { generatePricingRecommendations } from "./pricingRecommendationEngine";
import * as discountCodeStorage from "./discount-storage";
import locationRouter from "./routes/location-routes";
import emailTemplateRouter from "./routes/email-template-routes";
import { marketingInsightsRouter } from "./routes/marketing-insights-routes";
import { apiRouter } from "./routes/index";
import { generateBenchmarkInsights } from "./services/ai-tooltip-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { 
  insertUserSchema, 
  insertBusinessSchema, 
  insertAdMethodSchema, 
  insertBusinessTypeSchema, 
  insertCampaignSchema, 
  insertNotificationSettingsSchema,
  insertAchievementTypeSchema,
  UserRole,
  UserApprovalStatus,
  insertUserAchievementSchema,
  insertPricingConfigSchema,
  insertAdminNotificationSettingsSchema,
  insertDiscountCodeSchema,
  loginSchema, 
  signupSchema,
  InsertUser,
  Campaign,
  Business,
  AdMethod,
  adRecommendations,
  adRecommendationItems,
  userRecommendationInteractions,
  emailTemplateTypes,
  pricingConfig,
  discountCodes,
  type EmailTemplateType,
  type InsertAdminNotificationSettings,
  type InsertDiscountCode
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, isNull, ne, or, asc, not, like } from "drizzle-orm";
import { extractAuthDataFromRequest } from "./auth-utils";
import { updateUser, updateCampaign, updateBusiness, updateAdMethod } from "./utils";
import moment from "moment";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { parse as parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import { 
  migrateSubscriptions, 
  upgradeUserToTrial, 
  createFreeUser,
  checkSubscriptionAccess,
  updateUserSubscriptionStatus
} from "./subscription-service";
import { 
  updateSubscriptionPlan, 
  cancelSubscription, 
  createOrResumeSubscription,
  createSetupIntent,
  listPaymentMethods,
  getUpcomingInvoice,
  retryInvoice
} from "./subscription-operations";
import crypto from 'crypto';
import { calculateLocalBenchmark } from "./services/benchmark-service";

// In-memory storage for AI completion requests
// Used to avoid duplicating requests and to cache responses
const completionRequests = new Map<string, Promise<any>>();

// Set up multer for file upload
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }
};

const upload = multer({ 
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

import { setupAuth } from './auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with Passport first
  setupAuth(app);
  
  // Root route handling
  app.get('/', (req, res, next) => {
    if (req.isAuthenticated()) {
      // If authenticated, go to dashboard
      res.redirect('/dashboard');
    } else {
      // If not authenticated, continue to show landing page via the client routing
      next();
    }
  });
  
  // Serve the minisite HTML file directly at /minisite route
  app.get('/minisite', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'client/minisite.html'));
  });
  

  
  // Add direct business endpoints - improved with better error handling
  app.get('/api/user/:userId/business', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // For demo account, we know the business ID is 2
      if (userId === 2) {
        const demoBusiness = await storage.getBusiness(2);
        if (demoBusiness) {
          console.log("Returning demo business data:", demoBusiness);
          return res.json(demoBusiness);
        }
      }
      
      // Only allow users to access their own business data unless they're an admin
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized access to business data' });
      }
      
      const business = await storage.getBusinessByUserId(userId);
      
      if (!business) {
        console.error(`No business found for user ID ${userId}`);
        return res.status(404).json({ error: 'Business not found for this user' });
      }
      
      console.log(`Returning business data for user ${userId}:`, business);
      res.json(business);
    } catch (error) {
      console.error('Error fetching business for user:', error);
      res.status(500).json({ error: 'Failed to fetch business data' });
    }
  });
  
  // Add marketing insights routes FIRST - before any other /api routes
  app.use('/api', marketingInsightsRouter);
  
  // Use the routes defined in the api router
  app.use('/api', apiRouter);
  
  // Add explicit fallback for pricing data if API routes fail
  app.get('/api/pricing-public', async (req, res) => {
    try {
      console.log('Fallback pricing-public route called');
      // Return some default pricing data if database isn't available
      const defaultPricing = [
        {
          id: 1,
          name: "Basic Plan",
          description: "Perfect for small businesses getting started",
          features: "Up to 5 campaigns\nBasic ROI tracking\nEmail support",
          price: "378.95",
          discountedPrice: null,
          sortOrder: 1,
          isActive: true
        },
        {
          id: 2,
          name: "Professional Plan", 
          description: "Advanced features for growing businesses",
          features: "Unlimited campaigns\nAdvanced analytics\nPriority support\nAI recommendations",
          price: "678.95",
          discountedPrice: null,
          sortOrder: 2,
          isActive: true
        },
        {
          id: 3,
          name: "Premium Plan",
          description: "Complete solution for enterprise businesses",
          features: "Everything in Professional\nCustom integrations\nDedicated support\nWhite-label options",
          price: "978.95", 
          discountedPrice: null,
          sortOrder: 3,
          isActive: true
        }
      ];
      
      res.setHeader('Content-Type', 'application/json');
      res.json(defaultPricing);
    } catch (error) {
      console.error('Error in fallback pricing route:', error);
      res.status(500).json({ message: 'Failed to fetch pricing' });
    }
  });
  
  // Add location routes
  app.use('/api/locations', locationRouter);
  
  // Add email template routes with specific prefix to avoid conflicts
  app.use('/api/email-templates', emailTemplateRouter);
  
  const httpServer = createServer(app);
  
  // Add WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected',
      message: 'Connected to AdTrack realtime server',
      timestamp: Date.now()
    }));
  });
  
  // Broadcast function to send messages to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  
  // Set up periodic heartbeat to keep connections alive
  setInterval(() => {
    broadcast({ type: 'heartbeat', timestamp: Date.now() });
  }, 30000);
  
  return httpServer;
}
