import { db } from './db';
import { sql } from 'drizzle-orm';

interface DemoDataSummary {
  users: number;
  businesses: number;
  locations: number;
  campaigns: number;
}

export async function getDemoDataSummary(): Promise<DemoDataSummary> {
  try {
    // Count demo users (all users with username containing 'demo')
    const userCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM users 
      WHERE username LIKE '%demo%'
    `);
    
    // Count businesses associated with demo users
    const businessCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM businesses 
      WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%demo%')
    `);
    
    // Count locations associated with demo businesses
    const locationCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM locations 
      WHERE business_id IN (
        SELECT id FROM businesses 
        WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%demo%')
      )
    `);
    
    // Count campaigns associated with demo businesses
    const campaignCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM campaigns 
      WHERE business_id IN (
        SELECT id FROM businesses 
        WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%demo%')
      )
    `);
    
    return {
      users: parseInt(String(userCountResult.rows[0].count)),
      businesses: parseInt(String(businessCountResult.rows[0].count)),
      locations: parseInt(String(locationCountResult.rows[0].count)),
      campaigns: parseInt(String(campaignCountResult.rows[0].count))
    };
  } catch (error) {
    console.error('Error getting demo data summary:', error);
    return { users: 0, businesses: 0, locations: 0, campaigns: 0 };
  }
}

/**
 * Check if specified demo data exists and restore it if missing
 */
export async function checkAndRestoreDemoData(options: {
  ensureUsers?: number;     // Minimum number of demo users to ensure exist
  ensureBusinesses?: number; // Minimum number of businesses to ensure exist
}): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('Checking demo data existence...');
    
    const summary = await getDemoDataSummary();
    console.log('Current demo data summary:', summary);
    
    // If we already have sufficient data, no need to restore
    if (
      (!options.ensureUsers || summary.users >= options.ensureUsers) &&
      (!options.ensureBusinesses || summary.businesses >= options.ensureBusinesses)
    ) {
      return {
        success: true,
        message: 'Demo data is sufficient, no restoration needed',
        details: summary
      };
    }
    
    console.log('Insufficient demo data, restoring missing data...');
    
    // We need to create more demo users and businesses
    const existingUsernames = await db.execute(sql`
      SELECT username FROM users WHERE username LIKE 'demo%@adtrack.online'
    `);
    
    const existingNames = existingUsernames.rows.map(row => row.username);
    
    // Find next available demo user number
    let nextDemoNumber = 1;
    while (existingNames.includes(`demo${nextDemoNumber}@adtrack.online`)) {
      nextDemoNumber++;
    }
    
    // Business types and names
    const businessTypes = [
      { type: 'Food & Beverage', name: 'Sweet Treats Bakery' },
      { type: 'Health & Fitness', name: 'Fitness First Gym' },
      { type: 'Automotive', name: 'Luxury Auto Detailing' },
      { type: 'Technology', name: 'Tech Solutions Inc' },
      { type: 'Home & Garden', name: 'Green Thumb Landscaping' },
      { type: 'Retail', name: 'Fashion Forward Boutique' },
      { type: 'Hospitality', name: 'Sunset View Hotel' },
      { type: 'Education', name: 'Knowledge Academy' }
    ];
    
    const createdEntities = {
      users: [] as any[],
      businesses: [] as any[],
      locations: [] as any[],
      campaigns: [] as any[]
    };
    
    // Create necessary demo users and businesses
    const usersNeeded = options.ensureUsers ? Math.max(0, options.ensureUsers - summary.users) : 0;
    
    for (let i = 0; i < usersNeeded; i++) {
      const username = `demo${nextDemoNumber + i}@adtrack.online`;
      const businessInfo = businessTypes[i % businessTypes.length];
      
      // Create the SQL transaction with multiple operations
      const result = await db.execute(sql`
        DO $$
        DECLARE
          new_user_id INTEGER;
          business_id INTEGER;
          location_id INTEGER;
          ad_method_id INTEGER;
        BEGIN
          -- Create demo user
          INSERT INTO users (
            username, password, is_admin, email, role, 
            approval_status, is_verified, is_trial_period
          )
          VALUES (
            ${username},
            -- Hashed 'demo123' password
            'c9e52989674c402ab52a472e177ab17c51c8b7255391be0294a2d8476c0c99a4d77dcf930bb7a9a6f832652fe501e4fef5244778f91c07ab9776ece6f2493f78.1ad72ef19362c05c',
            FALSE,
            ${username},
            'BUSINESS_ADMIN',
            'APPROVED',
            TRUE,
            TRUE
          )
          RETURNING id INTO new_user_id;
          
          -- Create business
          INSERT INTO businesses (
            user_id, name, business_type, address, zip_code,
            latitude, longitude
          )
          VALUES (
            new_user_id,
            ${businessInfo.name + ' ' + (i+1)},
            ${businessInfo.type},
            ${'123 Main St, Las Vegas, NV'},
            ${'89101'},
            ${36.1699 + (i * 0.01)},
            ${-115.1398 + (i * 0.01)}
          )
          RETURNING id INTO business_id;
          
          -- Create location
          INSERT INTO locations (
            business_id, name, address, zip_code, 
            latitude, longitude
          )
          VALUES (
            business_id,
            ${'Main Location'},
            ${'123 Main St, Las Vegas, NV'},
            ${'89101'},
            ${36.1699 + (i * 0.01)},
            ${-115.1398 + (i * 0.01)}
          )
          RETURNING id INTO location_id;
          
          -- Create user-location association
          INSERT INTO user_locations (
            user_id, location_id, is_primary
          )
          VALUES (
            new_user_id,
            location_id,
            TRUE
          );
          
          -- Get ad method
          SELECT id INTO ad_method_id FROM ad_methods LIMIT 1;
          
          IF ad_method_id IS NULL THEN
            INSERT INTO ad_methods (name, description)
            VALUES ('Social Media', 'Facebook, Instagram, and other social platforms')
            RETURNING id INTO ad_method_id;
          END IF;
          
          -- Create campaigns
          INSERT INTO campaigns (
            business_id, name, amount_spent, amount_earned,
            start_date, end_date, ad_method_id, is_active
          )
          VALUES 
          (
            business_id,
            ${'Spring Campaign'},
            ${800 + (i * 100)},
            ${2400 + (i * 250)},
            ${'2025-03-01'}::timestamp,
            ${'2025-04-30'}::timestamp,
            ad_method_id,
            TRUE
          ),
          (
            business_id,
            ${'Summer Campaign'},
            ${1200 + (i * 100)},
            ${3600 + (i * 300)},
            ${'2025-05-01'}::timestamp,
            ${'2025-06-30'}::timestamp,
            ad_method_id,
            TRUE
          );
        END $$;
      `);
      
      createdEntities.users.push({ username });
      createdEntities.businesses.push({ name: businessInfo.name + ' ' + (i+1) });
      
      console.log(`Created demo user ${username} with business and campaigns`);
    }
    
    const updatedSummary = await getDemoDataSummary();
    
    return {
      success: true,
      message: `Demo data restored successfully. Created ${usersNeeded} new demo users with businesses and campaigns.`,
      details: {
        created: createdEntities,
        before: summary,
        after: updatedSummary
      }
    };
  } catch (error: any) {
    console.error('Error checking and restoring demo data:', error);
    return {
      success: false,
      message: `Error checking and restoring demo data: ${error.message}`,
      details: error.stack
    };
  }
}