import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add the role column to the users table
 * Run this script directly with: npx tsx server/migrate-roles.ts
 */
async function migrateRoles() {
  console.log("Starting migration to add role column to users table...");
  
  try {
    // Check if the role column already exists
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (columns.rows.length === 0) {
      console.log("Role column does not exist, adding it now...");
      
      // Add the role column with default value 'MARKETING_USER'
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN role TEXT DEFAULT 'MARKETING_USER'
      `);
      
      console.log("Role column added successfully!");
      
      // Set admin@adtrack.online to PLATFORM_ADMIN
      const adminResult = await db.execute(sql`
        UPDATE users 
        SET role = 'PLATFORM_ADMIN' 
        WHERE username = 'admin@adtrack.online'
      `);
      
      console.log(`Updated admin roles: ${adminResult.rowCount} rows affected`);
      
      // Set demo@adtrack.online to BUSINESS_ADMIN
      const demoResult = await db.execute(sql`
        UPDATE users 
        SET role = 'BUSINESS_ADMIN' 
        WHERE username = 'demo@adtrack.online'
      `);
      
      console.log(`Updated demo roles: ${demoResult.rowCount} rows affected`);
      
      console.log("Migration completed successfully!");
    } else {
      console.log("Role column already exists, no migration needed.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("Migration completed, closing database connection...");
      process.exit(0);
    }).catch(err => {
      console.error("Error closing connection:", err);
      process.exit(1);
    });
  }
}

// Run the migration
migrateRoles();