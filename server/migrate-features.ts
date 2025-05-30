/**
 * Migration script to add the feature tracking tables
 * Run this script directly with: npx tsx server/migrate-features.ts
 */
import { db } from './db';
import { features, featureUsage } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function migrateFeatures() {
  console.log('Starting feature tables migration...');

  try {
    // Create features table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "features" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "limits" JSONB NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('Created features table');

    // Create feature_usage table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "feature_usage" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "business_id" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "feature_id" INTEGER NOT NULL REFERENCES "features"("id") ON DELETE CASCADE,
        "used_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "usage_count" INTEGER DEFAULT 1 NOT NULL,
        "metadata" JSONB
      );
    `);
    console.log('Created feature_usage table');

    // Seed default features
    const existingFeatures = await db.select().from(features);
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
        await db.insert(features).values(feature);
        console.log(`Added default feature: ${feature.name}`);
      }
    }

    // Seed some sample feature usage data
    // Get users
    const users = await db.execute(sql`SELECT id FROM "users" LIMIT 5`);
    const userIds = users.rows.map(user => Number(user.id));

    // Get businesses
    const businesses = await db.execute(sql`SELECT id FROM "businesses" LIMIT 5`);
    const businessIds = businesses.rows.map(business => Number(business.id));

    // Get features
    const allFeatures = await db.select().from(features);
    const featureIds = allFeatures.map(feature => feature.id);

    // Add sample usage data if userIds, businessIds, and featureIds are available
    if (userIds.length > 0 && businessIds.length > 0 && featureIds.length > 0) {
      // Only add sample data if no usage data exists
      const existingUsage = await db.select().from(featureUsage).limit(1);
      
      if (existingUsage.length === 0) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const sampleUsageData = [
          {
            userId: userIds[0],
            businessId: businessIds[0],
            featureId: featureIds[0],
            usedAt: now,
            usageCount: 3,
            metadata: { source: "dashboard" }
          },
          {
            userId: userIds[0],
            businessId: businessIds[0],
            featureId: featureIds[1],
            usedAt: yesterday,
            usageCount: 1,
            metadata: { source: "report" }
          },
          {
            userId: userIds[1],
            businessId: businessIds[1],
            featureId: featureIds[0],
            usedAt: lastWeek,
            usageCount: 2,
            metadata: { source: "mobile" }
          },
          {
            userId: userIds[1],
            businessId: businessIds[1],
            featureId: featureIds[2],
            usedAt: lastMonth,
            usageCount: 4,
            metadata: { source: "api" }
          }
        ];

        for (const usage of sampleUsageData) {
          await db.insert(featureUsage).values(usage);
        }
        console.log(`Added ${sampleUsageData.length} sample feature usage records`);
      }
    }

    console.log('Feature tables migration completed successfully');
  } catch (error) {
    console.error('Error during feature tables migration:', error);
  }
}

// Run the migration
migrateFeatures().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});