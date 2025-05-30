import { db } from './db';
import { campaigns, businesses, adMethods, businessTypes, users } from "@shared/schema";
import { eq } from 'drizzle-orm';

const DEMO_USER_ID = 2; // The ID of the demo@adtrack.online user

export async function setupDemoData() {
  console.log('Starting demo data setup...');
  
  try {
    // Check if demo user exists
    const demoUser = await db.query.users.findFirst({
      where: eq(users.id, DEMO_USER_ID)
    });
    
    if (!demoUser) {
      console.log('Demo user not found. Skipping demo data setup.');
      return;
    }
    
    console.log('Demo user found. Checking for existing demo data...');
    
    // Check if business exists for demo user
    const existingBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, DEMO_USER_ID)
    });
    
    if (existingBusiness) {
      // Check if there are campaigns for this business
      const existingCampaigns = await db.query.campaigns.findMany({
        where: eq(campaigns.businessId, existingBusiness.id)
      });
      
      if (existingCampaigns && existingCampaigns.length > 0) {
        console.log(`Demo business already has ${existingCampaigns.length} campaigns. Skipping setup.`);
        return;
      }
      
      console.log('Demo business exists but has no campaigns. Adding campaigns...');
      await createCampaignsForBusiness(existingBusiness);
      return;
    }
    
    console.log('No demo business found. Setting up demo data...');
    
    // Get a business type for the demo business
    const businessTypeResult = await db.select().from(businessTypes).limit(1);
    let businessType = businessTypeResult[0];
    
    if (!businessType) {
      console.log('No business types found. Creating one...');
      // Create a default business type if none exists
      const newBusinessTypes = await db.insert(businessTypes).values({
        name: 'Retail'
      }).returning();
      businessType = newBusinessTypes[0];
    }
    
    // Create a business for the demo user
    const demoBusinesses = await db.insert(businesses).values({
      userId: DEMO_USER_ID,
      name: 'Demo Marketing Agency',
      businessType: 'Retail',
      address: '123 Main Street, San Francisco, CA 94105',
      zipCode: '94105',
      phone: '(555) 123-4567',
      ownerName: 'Demo User',
      ownerEmail: 'demo@adtrack.online',
      ownerPhone: '(555) 123-4567'
    }).returning();
    
    const demoBusiness = demoBusinesses[0];
    console.log('Demo business created:', demoBusiness.name);
    
    await createCampaignsForBusiness(demoBusiness);
    
    console.log('Demo data setup completed successfully');
    
    return {
      business: demoBusiness
    };
  } catch (error) {
    console.error('Error setting up demo data:', error);
    throw error;
  }
}

async function createCampaignsForBusiness(business: any) {
  // Create ad methods for different campaigns
  const adMethodNames = [
    'Social Media',
    'Search Engine Marketing',
    'Print Media',
    'Email Marketing',
    'Billboard Advertising'
  ];
  
  const insertedAdMethods = [];
  for (const name of adMethodNames) {
    try {
      // Check if ad method already exists
      const existingMethods = await db.select().from(adMethods).where(eq(adMethods.name, name));
      
      if (existingMethods && existingMethods.length > 0) {
        console.log(`Ad method ${name} already exists, using existing one`);
        insertedAdMethods.push(existingMethods[0]);
      } else {
        console.log(`Creating new ad method: ${name}`);
        const newAdMethods = await db.insert(adMethods).values({
          name
        }).returning();
        insertedAdMethods.push(newAdMethods[0]);
      }
    } catch (error) {
      console.error(`Error with ad method ${name}:`, error);
    }
  }
  
  console.log(`Using ${insertedAdMethods.length} ad methods for demo business`);
  
  // Create campaigns with varying performance to demonstrate ROI differences
  const campaignData = [
    {
      name: 'Summer Promotion',
      description: 'Special offers for summer season',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-31'),
      amountSpent: "5000",
      amountEarned: "15000", // 200% ROI
      adMethodId: insertedAdMethods[0].id,
      businessId: business.id,
      isActive: false
    },
    {
      name: 'Holiday Marketing Push',
      description: 'End of year holiday marketing campaign',
      startDate: new Date('2023-11-15'),
      endDate: new Date('2023-12-31'),
      amountSpent: "8000",
      amountEarned: "36000", // 350% ROI
      adMethodId: insertedAdMethods[1].id,
      businessId: business.id,
      isActive: false
    },
    {
      name: 'Brand Awareness Campaign',
      description: 'Focus on increasing brand recognition',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2023-10-31'),
      amountSpent: "3500",
      amountEarned: "4200", // 20% ROI (lower performance)
      adMethodId: insertedAdMethods[2].id,
      businessId: business.id,
      isActive: false
    },
    {
      name: 'Weekly Newsletter Series',
      description: 'Targeted email marketing to existing customers',
      startDate: new Date('2023-02-01'),
      endDate: new Date('2023-05-31'),
      amountSpent: "1200",
      amountEarned: "9600", // 700% ROI (very successful)
      adMethodId: insertedAdMethods[3].id,
      businessId: business.id,
      isActive: false
    },
    {
      name: 'Spring Product Launch',
      description: 'New product introduction campaign',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-04-30'),
      amountSpent: "7500",
      amountEarned: "18750", // 150% ROI
      adMethodId: insertedAdMethods[4].id,
      businessId: business.id,
      isActive: true
    },
    {
      name: 'Current Digital Strategy',
      description: 'Ongoing digital marketing efforts',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      amountSpent: "12000",
      amountEarned: "24000", // 100% ROI so far
      adMethodId: insertedAdMethods[1].id,
      businessId: business.id,
      isActive: true
    }
  ];
  
  const insertedCampaigns = [];
  for (const campaign of campaignData) {
    try {
      const newCampaigns = await db.insert(campaigns).values(campaign).returning();
      insertedCampaigns.push(newCampaigns[0]);
    } catch (error) {
      console.error(`Error inserting campaign ${campaign.name}:`, error);
    }
  }
  
  console.log(`Created ${insertedCampaigns.length} campaigns for demo business`);
  return insertedCampaigns;
}