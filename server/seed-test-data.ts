import { db } from './db';
import { users, businesses, campaigns } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Function to check if test data already exists
async function checkTestDataExists() {
  const testUsers = await db.select().from(users).where(eq(users.username, 'test1@adtrack.online'));
  return testUsers.length > 0;
}

// Main function to seed test data
export async function seedTestData() {
  try {
    // Check if test data already exists to avoid duplicates
    const exists = await checkTestDataExists();
    if (exists) {
      console.log('Test data already exists. Skipping seed.');
      return;
    }

    console.log('Seeding test data...');

    // Define our test business zip codes (nearby the demo business which is 12345)
    const zipCodes = ['12345', '12346', '12344', '12347', '12343'];
    
    // Create test users, businesses, and campaigns
    const testData = [
      {
        user: {
          username: 'test1@adtrack.online',
          password: 'test123',
          isVerified: true,
        },
        business: {
          name: 'SuperMart Retail',
          businessType: 'Retail',
          address: '456 Market St, Test City',
          zipCode: zipCodes[1], // 12346
          latitude: 40.7130,
          longitude: -74.0080,
        },
        campaigns: [
          {
            name: 'Spring Promotion',
            description: 'Social media campaign for spring products',
            adMethodId: 1, // Social Media Ads
            amountSpent: 800.00,
            startDate: new Date(2025, 2, 1), // March 1, 2025
            endDate: new Date(2025, 2, 31), // March 31, 2025
            amountEarned: 2400.00, // Good ROI (3.0)
            isActive: false,
          },
          {
            name: 'Email Newsletter',
            description: 'Monthly product updates',
            adMethodId: 2, // Email Marketing
            amountSpent: 300.00,
            startDate: new Date(2025, 3, 1), // April 1, 2025
            endDate: null, // Still running
            amountEarned: 450.00, // Moderate ROI (1.5)
            isActive: true,
          }
        ]
      },
      {
        user: {
          username: 'test2@adtrack.online',
          password: 'test123',
          isVerified: true,
        },
        business: {
          name: 'ValueStore',
          businessType: 'Retail',
          address: '789 Budget Ave, Test City',
          zipCode: zipCodes[2], // 12344
          latitude: 40.7125,
          longitude: -74.0055,
        },
        campaigns: [
          {
            name: 'Radio Advertisement',
            description: 'Local radio spots',
            adMethodId: 4, // Radio
            amountSpent: 1200.00,
            startDate: new Date(2025, 2, 15), // March 15, 2025
            endDate: new Date(2025, 3, 15), // April 15, 2025
            amountEarned: 1800.00, // Medium ROI (1.5)
            isActive: false,
          },
          {
            name: 'Billboard Campaign',
            description: 'Highway billboard advertisements',
            adMethodId: 5, // Billboard
            amountSpent: 2000.00,
            startDate: new Date(2025, 3, 1), // April 1, 2025
            endDate: null, // Still running
            amountEarned: 1500.00, // Low ROI (0.75)
            isActive: true,
          }
        ]
      },
      {
        user: {
          username: 'test3@adtrack.online',
          password: 'test123',
          isVerified: true,
        },
        business: {
          name: 'ShopSmart',
          businessType: 'Retail',
          address: '321 Commerce Blvd, Test City',
          zipCode: zipCodes[3], // 12347
          latitude: 40.7140,
          longitude: -74.0070,
        },
        campaigns: [
          {
            name: 'Local Newspaper Ad',
            description: 'Weekly newspaper advertisements',
            adMethodId: 3, // Local Newspaper
            amountSpent: 600.00,
            startDate: new Date(2025, 2, 10), // March 10, 2025
            endDate: new Date(2025, 3, 10), // April 10, 2025
            amountEarned: 900.00, // Medium ROI (1.5)
            isActive: false,
          },
          {
            name: 'Social Media Contest',
            description: 'Instagram photo contest with prizes',
            adMethodId: 1, // Social Media Ads
            amountSpent: 400.00,
            startDate: new Date(2025, 3, 5), // April 5, 2025
            endDate: null, // Still running
            amountEarned: 1200.00, // High ROI (3.0)
            isActive: true,
          }
        ]
      },
      {
        user: {
          username: 'test4@adtrack.online',
          password: 'test123',
          isVerified: true,
        },
        business: {
          name: 'BudgetBasket',
          businessType: 'Retail',
          address: '567 Discount Dr, Test City',
          zipCode: zipCodes[4], // 12343
          latitude: 40.7120,
          longitude: -74.0040,
        },
        campaigns: [
          {
            name: 'Email Promotions',
            description: 'Special discount offers via email',
            adMethodId: 2, // Email Marketing
            amountSpent: 250.00,
            startDate: new Date(2025, 2, 20), // March 20, 2025
            endDate: new Date(2025, 3, 20), // April 20, 2025
            amountEarned: 200.00, // Poor ROI (0.8)
            isActive: false,
          },
          {
            name: 'Local Radio Ads',
            description: 'Morning and evening radio spots',
            adMethodId: 4, // Radio
            amountSpent: 800.00,
            startDate: new Date(2025, 3, 10), // April 10, 2025
            endDate: null, // Still running
            amountEarned: 900.00, // Medium ROI (1.125)
            isActive: true,
          }
        ]
      },
    ];

    // Create users, businesses, and campaigns
    for (const data of testData) {
      // Create user
      const hashedPassword = await hashPassword(data.user.password);
      const [user] = await db.insert(users).values({
        username: data.user.username,
        password: hashedPassword,
        isVerified: data.user.isVerified,
        status: 'Active'
      }).returning({ id: users.id });

      // Create business
      const [business] = await db.insert(businesses).values({
        userId: user.id,
        name: data.business.name,
        businessType: data.business.businessType,
        address: data.business.address,
        zipCode: data.business.zipCode,
        latitude: data.business.latitude,
        longitude: data.business.longitude,
      }).returning({ id: businesses.id });

      // Create campaigns
      for (const campaign of data.campaigns) {
        await db.insert(campaigns).values({
          businessId: business.id,
          name: campaign.name,
          description: campaign.description,
          adMethodId: campaign.adMethodId, // This uses camelCase in model but snake_case in DB
          amountSpent: campaign.amountSpent,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          amountEarned: campaign.amountEarned,
          isActive: campaign.isActive,
        });
      }
    }

    console.log('Test data seeded successfully.');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}