import { db } from './db';
import { users, businesses, campaigns, locations, userLocations } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Demo business locations with realistic coordinates
const demoLocations = [
  {
    name: 'Downtown Business District',
    address: '123 Main Street, Las Vegas, NV',
    zipCode: '89101',
    latitude: 36.1699,
    longitude: -115.1398,
    businessId: 0 // This will be updated during insertion
  },
  {
    name: 'Westside Shopping Center',
    address: '456 Commerce Ave, Las Vegas, NV',
    zipCode: '89117',
    latitude: 36.1147, 
    longitude: -115.2315,
    businessId: 0 // This will be updated during insertion
  },
  {
    name: 'North Las Vegas',
    address: '789 Industrial Parkway',
    zipCode: '89030',
    latitude: 36.2001,
    longitude: -115.1206
  },
  {
    name: 'Henderson Business Park',
    address: '321 Corporate Drive',
    zipCode: '89074',
    latitude: 36.0395,
    longitude: -115.0629
  },
  {
    name: 'Summerlin Area',
    address: '555 Desert View Blvd',
    zipCode: '89144',
    latitude: 36.1809, 
    longitude: -115.3169
  }
];

// Demo business names and their campaigns
const demoBusiness = [
  {
    name: 'Sunrise Coffee Co.',
    type: 'Food & Beverage',
    campaigns: [
      { name: 'Summer Coffee Promotion', spending: 1500, revenue: 4200, startDate: '2025-01-15', endDate: '2025-02-15', adMethod: 'Social Media Ads' },
      { name: 'Loyalty Card Program', spending: 800, revenue: 2400, startDate: '2025-03-01', endDate: '2025-04-01', adMethod: 'Direct Mail' }
    ]
  },
  {
    name: 'Mountain View Fitness',
    type: 'Fitness',
    campaigns: [
      { name: 'New Year Resolution Special', spending: 2000, revenue: 5800, startDate: '2025-01-01', endDate: '2025-02-01', adMethod: 'TV Commercial' },
      { name: 'Summer Body Challenge', spending: 1200, revenue: 3600, startDate: '2025-04-01', endDate: '2025-05-15', adMethod: 'Social Media Ads' },
      { name: 'Personal Training Promo', spending: 900, revenue: 1800, startDate: '2025-03-15', endDate: '2025-04-15', adMethod: 'Email Marketing' }
    ]
  },
  {
    name: 'Green Valley Dental',
    type: 'Healthcare',
    campaigns: [
      { name: 'Spring Checkup Special', spending: 1800, revenue: 6300, startDate: '2025-03-01', endDate: '2025-04-15', adMethod: 'Radio Advertisement' },
      { name: 'Invisalign Promotion', spending: 2500, revenue: 9500, startDate: '2025-01-15', endDate: '2025-03-15', adMethod: 'Billboard' }
    ]
  },
  {
    name: 'Desert Auto Repair',
    type: 'Automotive',
    campaigns: [
      { name: 'Summer Car Care Special', spending: 1200, revenue: 3600, startDate: '2025-05-01', endDate: '2025-06-30', adMethod: 'Local Newspaper' },
      { name: 'Tire Rotation Deal', spending: 500, revenue: 1200, startDate: '2025-04-01', endDate: '2025-05-01', adMethod: 'Google Ads' },
      { name: 'AC Service Promotion', spending: 800, revenue: 2400, startDate: '2025-04-15', endDate: '2025-05-31', adMethod: 'Social Media Ads' }
    ]
  },
  {
    name: 'Sunset Real Estate',
    type: 'Real Estate',
    campaigns: [
      { name: 'Spring Listings Promotion', spending: 3000, revenue: 12000, startDate: '2025-03-01', endDate: '2025-05-31', adMethod: 'Multiple Listing Service' },
      { name: 'First-Time Homebuyer Special', spending: 2200, revenue: 8800, startDate: '2025-02-01', endDate: '2025-04-30', adMethod: 'Instagram Ads' }
    ]
  },
  {
    name: 'Valley View Boutique',
    type: 'Retail',
    campaigns: [
      { name: 'Spring Fashion Collection', spending: 1800, revenue: 5400, startDate: '2025-02-15', endDate: '2025-04-15', adMethod: 'Fashion Magazine' },
      { name: 'Summer Sale Event', spending: 1500, revenue: 6000, startDate: '2025-05-01', endDate: '2025-06-15', adMethod: 'Influencer Marketing' },
      { name: 'Holiday Gift Guide', spending: 2500, revenue: 10000, startDate: '2025-11-01', endDate: '2025-12-31', adMethod: 'Facebook Ads' }
    ]
  }
];

// Types to match the database schema
type Location = {
  id: number;
  name: string;
  address: string;
  zipCode: string;
  latitude: number;
  longitude: number;
};

// Main function to restore demo data
export async function restoreDemoData() {
  console.log('Starting demo data restoration...');

  try {
    // Create demo users (starting with userId 20 to avoid conflicts)
    let userId = 20;
    const demoUsers: typeof users.$inferSelect[] = [];

    for (let i = 1; i <= 6; i++) {
      const username = `demo${i}@adtrack.online`;
      const password = await hashPassword('{ZmV:NSMN(T4*^:0');
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username)
      });

      if (!existingUser) {
        const [user] = await db.insert(users).values({
          username,
          password,
          isAdmin: false,
          isVerified: true,
          status: 'Active',
          role: 'BUSINESS_ADMIN',
          approvalStatus: 'APPROVED',
          approvalDate: new Date(),
          approvedBy: 6, // Admin user ID
          isTrialPeriod: true,
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
          trialDuration: 7
        }).returning();
        
        console.log(`Created demo user: ${username} with ID: ${user.id}`);
        demoUsers.push(user);
      } else {
        console.log(`User ${username} already exists, skipping`);
        demoUsers.push(existingUser);
      }
    }

    // Create locations
    const createdLocations: Location[] = [];

    for (const location of demoLocations) {
      // Check if location already exists
      const existingLocation = await db.query.locations.findFirst({
        where: (locations, { eq, and }) => 
          and(
            eq(locations.latitude, location.latitude),
            eq(locations.longitude, location.longitude)
          )
      });

      if (!existingLocation) {
        const [newLocation] = await db.insert(locations).values({
          name: location.name,
          address: location.address,
          zipCode: location.zipCode,
          latitude: location.latitude,
          longitude: location.longitude
        }).returning();
        
        console.log(`Created location: ${location.name} with ID: ${newLocation.id}`);
        createdLocations.push(newLocation as Location);
      } else {
        console.log(`Location at ${location.name} already exists, skipping`);
        // Ensure we have all the properties needed
        createdLocations.push({
          id: existingLocation.id,
          name: existingLocation.name,
          address: existingLocation.address || location.address,
          zipCode: existingLocation.zipCode || location.zipCode,
          latitude: existingLocation.latitude || location.latitude,
          longitude: existingLocation.longitude || location.longitude
        });
      }
    }

    // Create businesses and their campaigns
    for (let i = 0; i < demoUsers.length && i < demoBusiness.length; i++) {
      const user = demoUsers[i];
      const business = demoBusiness[i];
      const location = createdLocations[i % createdLocations.length];

      // Check if business already exists for this user
      const existingBusiness = await db.query.businesses.findFirst({
        where: (businesses, { eq }) => eq(businesses.userId, user.id)
      });

      if (!existingBusiness) {
        // Create business
        const [newBusiness] = await db.insert(businesses).values({
          userId: user.id,
          name: business.name,
          businessType: business.type,
          address: `${location.address}, Las Vegas, NV`,
          zipCode: location.zipCode,
          latitude: location.latitude,
          longitude: location.longitude
        }).returning();

        console.log(`Created business: ${business.name} with ID: ${newBusiness.id}`);

        // Associate business with location
        await db.insert(userLocations).values({
          userId: user.id as number,
          locationId: location.id,
          isPrimary: true
        });
        
        // Create campaigns for this business
        for (const campaign of business.campaigns) {
          await db.insert(campaigns).values({
            businessId: newBusiness.id,
            name: campaign.name,
            spending: campaign.spending,
            revenue: campaign.revenue,
            startDate: new Date(campaign.startDate),
            endDate: new Date(campaign.endDate),
            adMethod: campaign.adMethod
          });
          
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