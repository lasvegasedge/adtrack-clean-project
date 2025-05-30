/**
 * Migration script to add the trial period columns to the users table
 * Run this script directly with: npx tsx server/migrate-trial-period.ts
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrateTrialPeriod() {
  try {
    console.log("Starting trial period migration...");

    // Add the trial period columns to the users table
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_trial_period BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS trial_duration INTEGER DEFAULT 7;
    `);

    // Update trial_end_date for all existing users based on trial_start_date and trial_duration
    await db.execute(sql`
      UPDATE users
      SET trial_end_date = trial_start_date + (trial_duration * INTERVAL '1 day')
      WHERE trial_end_date IS NULL AND trial_start_date IS NOT NULL;
    `);

    console.log("Trial period migration completed successfully!");
  } catch (error) {
    console.error("Error during trial period migration:", error);
  }
}

migrateTrialPeriod();