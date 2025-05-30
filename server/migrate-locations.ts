import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    );
  `);
  if (!result.rows || !result.rows[0]) return false;
  
  // Explicitly handle the value as a boolean
  const existsValue = result.rows[0].exists;
  return existsValue === true || existsValue === 't' || existsValue === 'true' || existsValue === 1;
}

async function createLocationsTable() {
  if (await checkTableExists('locations')) {
    console.log('Locations table already exists, skipping creation');
    return;
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "locations" (
      "id" SERIAL PRIMARY KEY,
      "business_id" INTEGER NOT NULL REFERENCES "businesses"("id"),
      "name" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "zip_code" TEXT NOT NULL,
      "latitude" REAL,
      "longitude" REAL,
      "phone" TEXT,
      "email" TEXT,
      "manager_id" INTEGER REFERENCES "users"("id"),
      "separate_billing" BOOLEAN DEFAULT false,
      "stripe_customer_id" TEXT,
      "stripe_subscription_id" TEXT,
      "subscription_plan_id" INTEGER REFERENCES "pricing_config"("id"),
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Locations table created successfully');
}

async function createUserLocationsTable() {
  if (await checkTableExists('user_locations')) {
    console.log('User locations table already exists, skipping creation');
    return;
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user_locations" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "location_id" INTEGER NOT NULL REFERENCES "locations"("id"),
      "is_primary" BOOLEAN DEFAULT false,
      "assigned_at" TIMESTAMP DEFAULT NOW(),
      "assigned_by" INTEGER REFERENCES "users"("id")
    );
  `);
  console.log('User locations table created successfully');
}

async function alterBusinessesTable() {
  // Check if columns exist first
  const isParentBusinessExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      AND column_name = 'is_parent_business'
    );
  `);
  
  const parentBusinessIdExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      AND column_name = 'parent_business_id'
    );
  `);

  // Add columns if they don't exist
  if (!isParentBusinessExists.rows[0].exists) {
    await db.execute(sql`
      ALTER TABLE "businesses"
      ADD COLUMN "is_parent_business" BOOLEAN DEFAULT false;
    `);
    console.log('Added is_parent_business column to businesses table');
  }
  
  if (!parentBusinessIdExists.rows[0].exists) {
    await db.execute(sql`
      ALTER TABLE "businesses"
      ADD COLUMN "parent_business_id" INTEGER REFERENCES "businesses"("id");
    `);
    console.log('Added parent_business_id column to businesses table');
  }
}

export async function migrateLocations() {
  console.log('Starting locations migration...');
  
  try {
    // Add new columns to the businesses table
    await alterBusinessesTable();
    
    // Create new tables
    await createLocationsTable();
    await createUserLocationsTable();
    
    console.log('Locations migration completed successfully');
  } catch (error) {
    console.error('Error during locations migration:', error);
  }
}

// ES modules don't have require.main === module check
// The migration will be called from server/index.ts