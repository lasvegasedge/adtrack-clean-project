import { db } from './db';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function restoreDemoData() {
  try {
    console.log('Starting simplified demo data restoration...');
    
    // Create a single demo user if it doesn't exist
    const demoUsername = 'demo2@adtrack.online';
    const hashedPassword = await hashPassword('{ZmV:NSMN(T4*^:0');
    
    // Check if user already exists
    const existingUserResult = await db.execute(sql`
      SELECT id, username FROM users WHERE username = ${demoUsername}
    `);
    
    let userId;
    
    if (existingUserResult.rows.length === 0) {
      // Insert new user
      const userResult = await db.execute(sql`
        INSERT INTO users (
          username, password, is_admin, email, role, 
          approval_status, is_verified, is_trial_period
        )
        VALUES (
          ${demoUsername}, 
          ${hashedPassword}, 
          false, 
          ${demoUsername}, 
          'BUSINESS_ADMIN', 
          'APPROVED', 
          true, 
          true
        )
        RETURNING id
      `);
      
      userId = userResult.rows[0].id;
      console.log(`Created demo user: ${demoUsername} with ID: ${userId}`);
    } else {
      userId = existingUserResult.rows[0].id;
      console.log(`User ${demoUsername} already exists with ID: ${userId}`);
    }
    
    // Create business if it doesn't exist
    const businessName = 'Sweet Treats Bakery';
    
    const existingBusinessResult = await db.execute(sql`
      SELECT id FROM businesses WHERE user_id = ${userId}
    `);
    
    let businessId;
    
    if (existingBusinessResult.rows.length === 0) {
      // Create business
      const businessResult = await db.execute(sql`
        INSERT INTO businesses (
          user_id, name, business_type, address, zip_code,
          latitude, longitude
        )
        VALUES (
          ${userId},
          ${businessName},
          ${'Food & Beverage'},
          ${'123 Main St, Las Vegas, NV'},
          ${'89101'},
          ${36.1699},
          ${-115.1398}
        )
        RETURNING id
      `);
      
      businessId = businessResult.rows[0].id;
      console.log(`Created business: ${businessName} with ID: ${businessId}`);
      
      // Create a single demo location
      const locationResult = await db.execute(sql`
        INSERT INTO locations (
          business_id, name, address, zip_code, 
          latitude, longitude
        )
        VALUES (
          ${businessId},
          ${'Main Location'},
          ${'123 Main St, Las Vegas, NV'},
          ${'89101'},
          ${36.1699},
          ${-115.1398}
        )
        RETURNING id
      `);
      
      const locationId = locationResult.rows[0].id;
      console.log(`Created location with ID: ${locationId}`);
      
      // Get an ad method ID
      let adMethodId;
      const adMethodResult = await db.execute(sql`
        SELECT id FROM ad_methods LIMIT 1
      `);
      
      if (adMethodResult.rows.length > 0) {
        adMethodId = adMethodResult.rows[0].id;
      } else {
        // Create a default ad method if none exist
        const createMethodResult = await db.execute(sql`
          INSERT INTO ad_methods (name, description)
          VALUES ('Social Media', 'Facebook, Instagram, and other social platforms')
          RETURNING id
        `);
        adMethodId = createMethodResult.rows[0].id;
      }
      
      // Create a single campaign
      await db.execute(sql`
        INSERT INTO campaigns (
          business_id, name, amount_spent, amount_earned,
          start_date, end_date, ad_method_id, is_active
        )
        VALUES (
          ${businessId},
          ${'Summer Special'},
          ${800},
          ${2000},
          ${'2025-05-01'}::timestamp,
          ${'2025-05-31'}::timestamp,
          ${adMethodId},
          true
        )
      `);
      
      console.log(`Created campaign for business ${businessName}`);
    } else {
      businessId = existingBusinessResult.rows[0].id;
      console.log(`Business already exists for user with ID: ${businessId}`);
    }
    
    return { 
      success: true, 
      message: 'Demo data restoration completed successfully',
      details: 'Created demo business with user, location, and campaign'
    };
  } catch (error: any) {
    console.error('Error restoring demo data:', error);
    return { 
      success: false, 
      message: `Error restoring demo data: ${error.message}`,
      details: error.stack
    };
  }
}