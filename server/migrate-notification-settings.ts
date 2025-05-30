/**
 * Migration script to add the admin notification settings table
 * Run this script directly with: npx tsx server/migrate-notification-settings.ts
 */
import { db } from './db';
import { adminNotificationSettings } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function migrateNotificationSettings() {
  try {
    console.log('Starting migration: Creating admin_notification_settings table...');
    
    // Create the table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "admin_notification_settings" (
        "id" SERIAL PRIMARY KEY,
        "system_notifications" BOOLEAN DEFAULT true,
        "user_registration_alerts" BOOLEAN DEFAULT true,
        "business_verification_alerts" BOOLEAN DEFAULT true,
        "weekly_admin_reports" BOOLEAN DEFAULT true,
        "failed_payment_alerts" BOOLEAN DEFAULT true,
        "security_alerts" BOOLEAN DEFAULT true,
        "performance_alerts" BOOLEAN DEFAULT true,
        "maintenance_notifications" BOOLEAN DEFAULT true,
        "notification_email" TEXT,
        "alert_frequency" TEXT DEFAULT 'immediate',
        "custom_alert_threshold" INTEGER DEFAULT 10,
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "updated_by" INTEGER REFERENCES "users"("id")
      );
    `);
    
    console.log('Migration complete: admin_notification_settings table created successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateNotificationSettings();