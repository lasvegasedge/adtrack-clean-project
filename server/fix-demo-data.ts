import { db } from './db';
import { users, businesses, campaigns, userLocations, locations } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Sample demo data with realistic metrics
const demoBusiness = [
  {
    name: 'Sweet Treats Bakery',
    type: 'Food & Beverage',
    campaigns: [
      { name: 'Summer Special Promotion', spending: 500, revenue: 1200, startDate: '2025-04-01', endDate: '2025-04-30', adMethod: 'Facebook Ads' },
      { name: 'New Product Launch', spending: 800, revenue: 2100, startDate: '2025-05-01', endDate: '2025-05-31', adMethod: 'Google Ads' }
    ]
  },
  {
    name: 'Fitness First Gym',
    type: 'Health & Fitness',
    campaigns: [
      { name: 'New Year Promotion', spending: 1000, revenue: 2800, startDate: '2025-01-01', endDate: '2025-01-31', adMethod: 'Instagram Ads' },
      { name: 'Summer Body Challenge', spending: 1500, revenue: 3200, startDate: '2025-04-01', endDate: '2025-05-31', adMethod: 'Facebook Ads' }
    ]
  },
  {
    name: 'Luxury Auto Detailing',
    type: 'Automotive',
    campaigns: [
      { name: 'Spring Cleaning Special', spending: 600, revenue: 1500, startDate: '2025-03-01', endDate: '2025-04-15', adMethod: 'Local Newspaper' },
      { name: 'Premium Service Package', spending: 450, revenue: 1100, startDate: '2025-05-01', endDate: '2025-05-31', adMethod: 'Google Ads' }
    ]
  },
  {
    name: 'Tech Solutions Inc',
    type: 'Technology',
    campaigns: [
      { name: 'Business IT Support', spending: 3000, revenue: 7500, startDate: '2025-02-01', endDate: '2025-04-30', adMethod: 'LinkedIn Ads' },
      { name: 'Cloud Migration Services', spending: 5000, revenue: 12000, startDate: '2025-05-01', endDate: '2025-07-31', adMethod: 'Industry Magazine' }
    ]
  },
  {
    name: 'Green Thumb Landscaping',
    type: 'Home & Garden',
    campaigns: [
      { name: 'Spring Garden Makeover', spending: 800, revenue: 2400, startDate: '2025-03-01', endDate: '2025-04-30', adMethod: 'Local Flyers' },
      { name: 'Commercial Property Services', spending: 1200, revenue: 3600, startDate: '2025-05-01', endDate: '2025-06-30', adMethod: 'Business Directory' }
    ]
  },
  {
    name: 'Cozy Corner Cafe',
    type: 'Food & Beverage',
    campaigns: [
      { name: 'Weekend Brunch Special', spending: 300, revenue: 900, startDate: '2025-04-01', endDate: '2025-05-31', adMethod: 'Instagram Ads' },
      { name: 'Local Loyalty Program', spending: 200, revenue: 1100, startDate: '2025-06-01', endDate: '2025-07-31', adMethod: 'Email Marketing' }
    ]
  }
];

/**
 * Creates demonstration data for the platform
 */
export async function restoreDemoData() {
  try {
    console.log('Starting demo data restoration...');
    
    // Create demo users with different usernames
    const demoUsers = [];
    
    for (let i = 1; i <= 6; i++) {
      const username = `demo${i}@adtrack.online`;
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username)
      });
      
      if (!existingUser) {
        // Create new user
        const user = await db.insert(users).values({
          username,
          password: await hashPassword('{ZmV:NSMN(T4*^:0'),
          isAdmin: false,
          email: username,
          role: 'BUSINESS_ADMIN',
          approvalStatus: 'APPROVED',
          isVerified: true,
          isTrialPeriod: true,
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
          trialDuration: 7
        }).returning().then(users => users[0]);
        
        console.log(`Created demo user: ${username} with ID: ${user.id}`);
        demoUsers.push(user);
      } else {
        console.log(`User ${username} already exists with ID: ${existingUser.id}`);
        demoUsers.push(existingUser);
      }
    }

    // Create businesses and their campaigns
    for (let i = 0; i < demoUsers.length && i < demoBusiness.length; i++) {
      const user = demoUsers[i];
      const business = demoBusiness[i];

      // Check if business already exists for this user
      const existingBusiness = await db.query.businesses.findFirst({
        where: (businesses, { eq }) => eq(businesses.userId, user.id)
      });

      if (!existingBusiness) {
        // Create business with address but no city/state columns (matching actual DB schema)
        const [newBusiness] = await db.insert(businesses).values({
          userId: user.id,
          name: business.name,
          businessType: business.type,
          address: `123 Main St, Las Vegas, NV`,
          zipCode: '89101',
          latitude: 36.1699 + (i * 0.01), // Slightly different locations
          longitude: -115.1398 + (i * 0.01)
        }).returning();

        console.log(`Created business: ${business.name} with ID: ${newBusiness.id}`);
        
        // Create location for this business - match actual DB columns
        const [newLocation] = await db.insert(locations).values({
          business_id: newBusiness.id,
          name: `${business.name} Main Location`,
          address: `123 Main St, Las Vegas, NV`,
          zip_code: '89101',
          latitude: 36.1699 + (i * 0.01),
          longitude: -115.1398 + (i * 0.01)
        }).returning();
        
        console.log(`Created location for ${business.name} with ID: ${newLocation.id}`);
        
        // Associate user with location
        await db.insert(userLocations).values({
          userId: user.id,
          locationId: newLocation.id,
          isPrimary: true
        });
        
        // Create campaigns for this business - match actual DB columns
        for (const campaign of business.campaigns) {
          const [newCampaign] = await db.insert(campaigns).values({
            business_id: newBusiness.id,
            name: campaign.name,
            amount_spent: campaign.spending,
            amount_earned: campaign.revenue,
            start_date: new Date(campaign.startDate),
            end_date: new Date(campaign.endDate),
            ad_method_id: 1, // Default method ID
            is_active: true
          }).returning();
          
          console.log(`Created campaign: ${campaign.name} for business ${business.name}`);
        }
      } else {
        console.log(`Business already exists for user ${user.username}, skipping`);
      }
    }

    console.log('Demo data restoration completed successfully');
    return { success: true, message: 'Demo data restoration completed successfully' };
  } catch (error: any) {
    console.error('Error restoring demo data:', error);
    return { success: false, message: `Error restoring demo data: ${error.message}` };
  }
}