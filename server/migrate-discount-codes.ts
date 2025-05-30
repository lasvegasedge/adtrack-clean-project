import { eq } from 'drizzle-orm';
import { db } from './db';
import { discountCodes, type InsertDiscountCode } from '@shared/schema';

const DEFAULT_ADMIN_ID = 1; // Assuming the admin user has ID 1

async function createDiscountCode(code: InsertDiscountCode) {
  try {
    // Check if code already exists
    const existingCodes = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code.code));
    
    if (existingCodes.length > 0) {
      console.log(`Discount code ${code.code} already exists, skipping`);
      return existingCodes[0];
    }
    
    // Create the code
    const [newCode] = await db
      .insert(discountCodes)
      .values(code)
      .returning();
    
    console.log(`Created discount code: ${newCode.code}`);
    return newCode;
  } catch (error) {
    console.error(`Error creating discount code ${code.code}:`, error);
    throw error;
  }
}

export async function migrateDiscountCodes() {
  console.log('Starting discount codes migration...');
  
  const now = new Date();
  // Set expiration date to 1 year from now
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  // Define default discount codes
  const defaultCodes: InsertDiscountCode[] = [
    // 100% discount codes for each plan type
    {
      code: 'BASIC100',
      description: 'Free Basic Plan (100% discount)',
      discountType: 'percentage',
      discountValue: '100',
      maxUses: 50,
      appliesTo: 'basic',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    {
      code: 'PRO100',
      description: 'Free Professional Plan (100% discount)',
      discountType: 'percentage',
      discountValue: '100',
      maxUses: 20,
      appliesTo: 'professional',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    {
      code: 'PREMIUM100',
      description: 'Free Premium Plan (100% discount)',
      discountType: 'percentage',
      discountValue: '100',
      maxUses: 10,
      appliesTo: 'premium',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    
    // Universal tiered discount codes
    {
      code: 'ADTRACK25',
      description: '25% off any plan',
      discountType: 'percentage',
      discountValue: '25',
      maxUses: 100,
      appliesTo: 'all',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    {
      code: 'ADTRACK50',
      description: '50% off any plan',
      discountType: 'percentage',
      discountValue: '50',
      maxUses: 50,
      appliesTo: 'all',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    {
      code: 'ADTRACK75',
      description: '75% off any plan',
      discountType: 'percentage',
      discountValue: '75',
      maxUses: 25,
      appliesTo: 'all',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    
    // Special fixed amount codes
    {
      code: 'ADTRACK10DOLLARS',
      description: '$10 off any plan',
      discountType: 'fixed',
      discountValue: '10',
      maxUses: 200,
      appliesTo: 'all',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    },
    {
      code: 'WELCOME20',
      description: '$20 off for new users',
      discountType: 'fixed',
      discountValue: '20',
      maxUses: 100,
      appliesTo: 'all',
      isActive: true,
      validFrom: now,
      validUntil: oneYearFromNow,
      createdBy: DEFAULT_ADMIN_ID,
      updatedBy: DEFAULT_ADMIN_ID
    }
  ];
  
  // Create all discount codes
  try {
    for (const code of defaultCodes) {
      await createDiscountCode(code);
    }
    console.log('Discount codes migration completed successfully');
  } catch (error) {
    console.error('Error during discount codes migration:', error);
  }
}

// For ESM modules, we can't use require.main === module
// The migration will be called from index.ts instead