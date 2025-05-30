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
    console.log('Starting demo data restoration using direct SQL...');
    
    // Create demo users
    const demoUsers = [];
    
    for (let i = 1; i <= 6; i++) {
      const username = `demo${i}@adtrack.online`;
      const hashedPassword = await hashPassword('demo123');
      
      // Check if user already exists
      const existingUserResult = await db.execute(sql`
        SELECT id, username FROM users WHERE username = ${username}
      `);
      
      if (existingUserResult.rows.length === 0) {
        // Insert new user
        const insertUserResult = await db.execute(sql`
          INSERT INTO users (
            username, password, is_admin, email, role, 
            approval_status, is_verified, is_trial_period, 
            trial_start_date, trial_end_date, trial_duration
          )
          VALUES (
            ${username}, 
            ${hashedPassword}, 
            false, 
            ${username}, 
            'BUSINESS_ADMIN', 
            'APPROVED', 
            true, 
            true, 
            NOW(), 
            NOW() + INTERVAL '7 days', 
            7
          )
          RETURNING id, username
        `);
        
        const newUser = insertUserResult.rows[0];
        console.log(`Created demo user: ${newUser.username} with ID: ${newUser.id}`);
        demoUsers.push(newUser);
      } else {
        const existingUser = existingUserResult.rows[0];
        console.log(`User ${existingUser.username} already exists with ID: ${existingUser.id}`);
        demoUsers.push(existingUser);
      }
    }
    
    // Create businesses and campaigns for each demo user
    for (let i = 0; i < demoUsers.length; i++) {
      const user = demoUsers[i];
      const businessName = [
        'Sweet Treats Bakery', 
        'Fitness First Gym', 
        'Luxury Auto Detailing', 
        'Tech Solutions Inc',
        'Green Thumb Landscaping',
        'Cozy Corner Cafe'
      ][i];
      
      const businessType = [
        'Food & Beverage',
        'Health & Fitness',
        'Automotive',
        'Technology',
        'Home & Garden',
        'Food & Beverage'
      ][i];
      
      // Check if business already exists for this user
      const existingBusinessResult = await db.execute(sql`
        SELECT id, name FROM businesses WHERE user_id = ${user.id}
      `);
      
      let businessId;
      
      if (existingBusinessResult.rows.length === 0) {
        // Create business
        const insertBusinessResult = await db.execute(sql`
          INSERT INTO businesses (
            user_id, name, business_type, address, zip_code,
            latitude, longitude
          )
          VALUES (
            ${user.id},
            ${businessName},
            ${businessType},
            ${'123 Main St, Las Vegas, NV'},
            ${'89101'},
            ${36.1699 + (i * 0.01)},
            ${-115.1398 + (i * 0.01)}
          )
          RETURNING id, name
        `);
        
        const newBusiness = insertBusinessResult.rows[0];
        businessId = newBusiness.id;
        console.log(`Created business: ${newBusiness.name} with ID: ${businessId}`);
        
        // Create location for this business
        const insertLocationResult = await db.execute(sql`
          INSERT INTO locations (
            business_id, name, address, zip_code, 
            latitude, longitude
          )
          VALUES (
            ${businessId},
            ${businessName + ' Main Location'},
            ${'123 Main St, Las Vegas, NV'},
            ${'89101'},
            ${36.1699 + (i * 0.01)},
            ${-115.1398 + (i * 0.01)}
          )
          RETURNING id
        `);
        
        const locationId = insertLocationResult.rows[0].id;
        console.log(`Created location for ${businessName} with ID: ${locationId}`);
        
        // Associate user with location
        await db.execute(sql`
          INSERT INTO user_locations (
            user_id, location_id, is_primary
          )
          VALUES (
            ${user.id},
            ${locationId},
            true
          )
        `);
        
        // Get list of ad methods
        const adMethodsResult = await db.execute(sql`
          SELECT id, name FROM ad_methods LIMIT 5
        `);
        
        // Default to first method if none exist
        let adMethods = adMethodsResult.rows;
        if (adMethods.length === 0) {
          // Create a default ad method if none exist
          const createMethodResult = await db.execute(sql`
            INSERT INTO ad_methods (name, description)
            VALUES ('Social Media', 'Facebook, Instagram, and other social platforms')
            RETURNING id, name
          `);
          adMethods = [createMethodResult.rows[0]];
        }
        
        // Create 2 campaigns per business
        const campaignData = [
          {
            name: 'Spring Promotion',
            spent: 500 + (i * 100),
            earned: 1200 + (i * 200),
            startDate: '2025-04-01',
            endDate: '2025-04-30'
          },
          {
            name: 'Summer Special',
            spent: 800 + (i * 100),
            earned: 2000 + (i * 250),
            startDate: '2025-05-01',
            endDate: '2025-05-31'
          }
        ];
        
        for (let j = 0; j < campaignData.length; j++) {
          const campaign = campaignData[j];
          const adMethodId = adMethods[j % adMethods.length].id;
          
          await db.execute(sql`
            INSERT INTO campaigns (
              business_id, name, amount_spent, amount_earned,
              start_date, end_date, ad_method_id, is_active
            )
            VALUES (
              ${businessId},
              ${campaign.name},
              ${campaign.spent},
              ${campaign.earned},
              ${campaign.startDate}::timestamp,
              ${campaign.endDate}::timestamp,
              ${adMethodId},
              true
            )
          `);
          
          console.log(`Created campaign: ${campaign.name} for business ${businessName}`);
        }
      } else {
        const existingBusiness = existingBusinessResult.rows[0];
        businessId = existingBusiness.id;
        console.log(`Business ${existingBusiness.name} already exists for user ${user.username}, skipping`);
      }
    }
    
    return { 
      success: true, 
      message: 'Demo data restoration completed successfully',
      details: 'Created 6 demo businesses with users, locations, and campaigns'
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