/**
 * Migration script to add the pricing recommendations table
 * Run this script directly with: npx tsx server/migrate-pricing-recommendations.ts
 */
import { db } from './db';
import { pricingRecommendations } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function migratePricingRecommendations() {
  try {
    console.log('Starting migration: Creating pricing_recommendations table...');
    
    // Create the table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pricing_recommendations" (
        "id" SERIAL PRIMARY KEY,
        "business_id" INTEGER NOT NULL REFERENCES "businesses"("id"),
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "ad_method_id" INTEGER NOT NULL REFERENCES "ad_methods"("id"),
        "business_type" TEXT NOT NULL,
        "recommended_budget" DECIMAL(10, 2) NOT NULL,
        "recommended_bid_amount" DECIMAL(10, 2),
        "expected_roi" DECIMAL(10, 2),
        "confidence_score" DECIMAL(5, 2),
        "rationale" TEXT NOT NULL,
        "scenario_budgets" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "implemented_at" TIMESTAMP,
        "is_implemented" BOOLEAN DEFAULT FALSE,
        "implementation_details" JSONB,
        "user_feedback" TEXT,
        "interaction_history" JSONB,
        "dismissed_at" TIMESTAMP
      );
    `);
    
    console.log('Migration complete: pricing_recommendations table created successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migratePricingRecommendations();