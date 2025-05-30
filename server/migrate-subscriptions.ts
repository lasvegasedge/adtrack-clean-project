import { db } from "./db";
import { pool } from "./db";
import { 
  subscriptionPlans, 
  features, 
  featureAccess, 
  planTypeEnum,
  accessLevelEnum,
  subscriptions,
  featureUsage,
  featureInteractions,
  personalizedOffers
} from '@shared/subscription-schema';
import { eq } from 'drizzle-orm';

/**
 * Create database tables if they don't exist
 */
async function createTablesIfNotExist() {
  // Check if plan_type enum exists, create if not
  const checkPlanTypeEnum = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'plan_type'
    );
  `);
  
  if (!checkPlanTypeEnum.rows[0].exists) {
    console.log('Creating plan_type enum...');
    await pool.query(`
      CREATE TYPE plan_type AS ENUM ('basic', 'professional', 'premium');
    `);
  }
  
  // Check if subscription_status enum exists, create if not
  const checkSubscriptionStatusEnum = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'subscription_status'
    );
  `);
  
  if (!checkSubscriptionStatusEnum.rows[0].exists) {
    console.log('Creating subscription_status enum...');
    await pool.query(`
      CREATE TYPE subscription_status AS ENUM (
        'active',
        'canceled',
        'expired',
        'past_due',
        'trialing',
        'unpaid'
      );
    `);
  }
  
  // Check if access_level enum exists, create if not
  const checkAccessLevelEnum = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'access_level'
    );
  `);
  
  if (!checkAccessLevelEnum.rows[0].exists) {
    console.log('Creating access_level enum...');
    await pool.query(`
      CREATE TYPE access_level AS ENUM ('none', 'limited', 'full');
    `);
  }
  
  // Check if subscription_plans table exists, create if not
  const checkPlansTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans'
    );
  `);
  
  if (!checkPlansTable.rows[0].exists) {
    console.log('Creating subscription_plans table...');
    await pool.query(`
      CREATE TABLE subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type plan_type NOT NULL,
        price INTEGER NOT NULL,
        interval TEXT NOT NULL DEFAULT 'month',
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        stripe_price_id TEXT,
        features JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if subscriptions table exists, create if not
  const checkSubscriptionsTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'subscriptions'
    );
  `);
  
  if (!checkSubscriptionsTable.rows[0].exists) {
    console.log('Creating subscriptions table...');
    await pool.query(`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status subscription_status NOT NULL DEFAULT 'trialing',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if features table exists, create if not
  const checkFeaturesTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'features'
    );
  `);
  
  if (!checkFeaturesTable.rows[0].exists) {
    console.log('Creating features table...');
    await pool.query(`
      CREATE TABLE features (
        id SERIAL PRIMARY KEY,
        feature_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if feature_access table exists, create if not
  const checkFeatureAccessTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'feature_access'
    );
  `);
  
  if (!checkFeatureAccessTable.rows[0].exists) {
    console.log('Creating feature_access table...');
    await pool.query(`
      CREATE TABLE feature_access (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        feature_id INTEGER NOT NULL REFERENCES features(id),
        access_level access_level NOT NULL DEFAULT 'none',
        limitations JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if feature_usage table exists, create if not
  const checkFeatureUsageTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'feature_usage'
    );
  `);
  
  if (!checkFeatureUsageTable.rows[0].exists) {
    console.log('Creating feature_usage table...');
    await pool.query(`
      CREATE TABLE feature_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        feature_id INTEGER NOT NULL REFERENCES features(id),
        usage_count INTEGER NOT NULL DEFAULT 0,
        last_used TIMESTAMP,
        reset_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if feature_interactions table exists, create if not
  const checkFeatureInteractionsTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'feature_interactions'
    );
  `);
  
  if (!checkFeatureInteractionsTable.rows[0].exists) {
    console.log('Creating feature_interactions table...');
    await pool.query(`
      CREATE TABLE feature_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        feature_id INTEGER NOT NULL REFERENCES features(id),
        interaction_type TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Check if personalized_offers table exists, create if not
  const checkPersonalizedOffersTable = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'personalized_offers'
    );
  `);
  
  if (!checkPersonalizedOffersTable.rows[0].exists) {
    console.log('Creating personalized_offers table...');
    await pool.query(`
      CREATE TABLE personalized_offers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        trigger_feature_id INTEGER REFERENCES features(id),
        recommended_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        discount_percentage INTEGER,
        offer_message TEXT,
        offer_code TEXT NOT NULL UNIQUE,
        expiration_date TIMESTAMP,
        is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  console.log('Database tables created or already exist');
}

/**
 * Migrate subscription plans, features, and access levels
 */
export async function migrateSubscriptions() {
  console.log('Starting subscription system migration...');
  
  try {
    // Check if the necessary tables exist and create them if they don't
    await createTablesIfNotExist();
    
    // Create subscription plans if they don't exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      console.log('Creating subscription plans...');
      
      // Add the three subscription tiers
      await db.insert(subscriptionPlans).values([
        {
          name: 'Basic Plan',
          type: 'basic',
          price: 37895, // $378.95
          interval: 'month',
          description: 'Essential features for small businesses.',
          isActive: true,
          features: {
            includedFeatures: [
              'basic_roi_tracking',
              'limited_competitor_analysis',
              'ad_upload',
              'location_management'
            ]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Professional Plan',
          type: 'professional',
          price: 67895, // $678.95
          interval: 'month',
          description: 'Advanced features for growing businesses.',
          isActive: true,
          features: {
            includedFeatures: [
              'full_roi_tracking',
              'competitor_analysis',
              'basic_ai_recommendations',
              'ad_upload',
              'location_management',
              'marketing_insights'
            ]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Premium Plan',
          type: 'premium',
          price: 97895, // $978.95
          interval: 'month',
          description: 'Complete solution for maximum business impact.',
          isActive: true,
          features: {
            includedFeatures: [
              'full_roi_tracking',
              'competitor_analysis',
              'advanced_ai_recommendations',
              'ad_upload',
              'multi_location_management',
              'marketing_insights',
              'benchmark_tooltips',
              'comparison_radius_control'
            ]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      console.log('Subscription plans created');
    } else {
      console.log('Subscription plans already exist, skipping creation');
    }
    
    // Check if features table exists and has data
    let existingFeatures = [];
    try {
      // First check if the table exists
      const tableExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'features'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('Features table does not exist, will be created...');
        // Create the table with the correct schema
        await db.execute(`
          CREATE TABLE IF NOT EXISTS features (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            limits JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );
        `);
      }

      // Now try to select from the table
      existingFeatures = await db.select().from(features);
      console.log('Found existing features:', existingFeatures.length);
    } catch (error: any) {
      console.error('Error during features table check/creation:', error);
      // Instead of returning, we'll throw a more descriptive error
      throw new Error(`Failed to initialize features table: ${error.message}`);
    }
    
    if (existingFeatures.length === 0) {
      console.log('Creating feature definitions...');
      
      await db.insert(features).values([
        {
          featureId: 'roi_tracking',
          displayName: 'ROI Tracking',
          description: 'Track and analyze return on investment for your marketing campaigns.',
          category: 'analytics',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'competitor_analysis',
          displayName: 'Competitor Analysis',
          description: 'Compare your performance against similar businesses in your area.',
          category: 'intelligence',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'ai_recommendations',
          displayName: 'AI Recommendations',
          description: 'Get intelligent suggestions for optimizing your advertising strategy.',
          category: 'ai',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'marketing_insights',
          displayName: 'Marketing Insights',
          description: 'Detailed analysis and storytelling of your marketing performance.',
          category: 'reporting',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'ad_upload',
          displayName: 'Ad Upload',
          description: 'Upload and manage your advertisement files.',
          category: 'content',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'location_management',
          displayName: 'Location Management',
          description: 'Manage business locations and region-specific campaigns.',
          category: 'administration',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'benchmark_tooltips',
          displayName: 'AI Benchmark Tooltips',
          description: 'Contextual insights when viewing performance metrics.',
          category: 'ai',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          featureId: 'comparison_radius_control',
          displayName: 'Comparison Radius Control',
          description: 'Adjust the geographic radius for competitor comparisons.',
          category: 'intelligence',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      console.log('Feature definitions created');
    } else {
      console.log('Feature definitions already exist, skipping creation');
    }
    
    // Set up feature access levels for each plan
    if (existingPlans.length > 0 && existingFeatures.length > 0) {
      console.log('Setting up feature access levels...');
      
      // Get all plans and features
      const plans = existingPlans;
      const allFeatures = existingFeatures;
      
      // Check if feature access records already exist
      let existingAccess = [];
      try {
        existingAccess = await db.select().from(featureAccess);
      } catch (error: any) {
        console.log('Error checking feature access table:', error.message);
        return true; // Exit early and try again later
      }
      
      if (existingAccess.length === 0) {
        // Map of feature access configuration
        const featureAccessMap = {
          // Basic plan access
          basic: {
            roi_tracking: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 10,
                sampleMode: true 
              } 
            },
            competitor_analysis: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 5,
                sampleMode: true 
              } 
            },
            ai_recommendations: { level: 'none', limitations: null },
            marketing_insights: { level: 'none', limitations: null },
            ad_upload: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 20,
                watermarked: true 
              } 
            },
            location_management: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 3
              } 
            },
            benchmark_tooltips: { level: 'none', limitations: null },
            comparison_radius_control: { level: 'none', limitations: null }
          },
          
          // Professional plan access
          professional: {
            roi_tracking: { level: 'full', limitations: null },
            competitor_analysis: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 25
              } 
            },
            ai_recommendations: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 15,
                cooldownHours: 24
              } 
            },
            marketing_insights: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 10
              } 
            },
            ad_upload: { level: 'full', limitations: null },
            location_management: { 
              level: 'limited', 
              limitations: { 
                maxUsage: 10
              } 
            },
            benchmark_tooltips: { level: 'none', limitations: null },
            comparison_radius_control: { level: 'none', limitations: null }
          },
          
          // Premium plan access
          premium: {
            roi_tracking: { level: 'full', limitations: null },
            competitor_analysis: { level: 'full', limitations: null },
            ai_recommendations: { level: 'full', limitations: null },
            marketing_insights: { level: 'full', limitations: null },
            ad_upload: { level: 'full', limitations: null },
            location_management: { level: 'full', limitations: null },
            benchmark_tooltips: { level: 'full', limitations: null },
            comparison_radius_control: { level: 'full', limitations: null }
          }
        };
        
        // Insert feature access records
        for (const plan of plans) {
          const planType = plan.type;
          const accessConfig = featureAccessMap[planType as keyof typeof featureAccessMap];
          
          if (accessConfig) {
            for (const feature of allFeatures) {
              const featureId = feature.featureId;
              const accessSettings = accessConfig[featureId as keyof typeof accessConfig] || { 
                level: 'none', 
                limitations: null 
              };
              
              await db.insert(featureAccess).values({
                planId: plan.id,
                featureId: feature.id,
                accessLevel: accessSettings.level as typeof accessLevelEnum.enumValues[number],
                limitations: accessSettings.limitations,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
        
        console.log('Feature access levels created');
      } else {
        console.log('Feature access levels already exist, skipping creation');
      }
    }
    
    console.log('Subscription system migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during subscription system migration:', error);
    return false;
  }
}