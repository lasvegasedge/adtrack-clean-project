import { db } from "./db";
import { discountCodes, discountCodeUsage, type DiscountCode, type InsertDiscountCode, type DiscountCodeUsage, type InsertDiscountCodeUsage } from "@shared/schema";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  return await db.select().from(discountCodes).orderBy(discountCodes.createdAt);
}

export async function getActiveDiscountCodes(): Promise<DiscountCode[]> {
  const currentDate = new Date();
  return await db.select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.isActive, true),
        or(
          isNull(discountCodes.validUntil),
          gte(discountCodes.validUntil, currentDate)
        ),
        lte(discountCodes.validFrom, currentDate)
      )
    )
    .orderBy(discountCodes.createdAt);
}

export async function getDiscountCodeById(id: number): Promise<DiscountCode | undefined> {
  const [discountCode] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.id, id));
  
  return discountCode;
}

export async function getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
  const [discountCode] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, code));
  
  return discountCode;
}

export async function createDiscountCode(data: InsertDiscountCode): Promise<DiscountCode> {
  const [discountCode] = await db
    .insert(discountCodes)
    .values(data)
    .returning();
  
  return discountCode;
}

export async function updateDiscountCode(id: number, data: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined> {
  const [discountCode] = await db
    .update(discountCodes)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(discountCodes.id, id))
    .returning();
  
  return discountCode;
}

export async function deactivateDiscountCode(id: number): Promise<DiscountCode | undefined> {
  return await updateDiscountCode(id, { isActive: false });
}

export async function incrementDiscountCodeUsage(id: number): Promise<DiscountCode | undefined> {
  const [discountCode] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.id, id));
  
  if (!discountCode) {
    return undefined;
  }
  
  const [updatedCode] = await db
    .update(discountCodes)
    .set({
      usedCount: discountCode.usedCount + 1,
      updatedAt: new Date()
    })
    .where(eq(discountCodes.id, id))
    .returning();
  
  return updatedCode;
}

export async function recordDiscountCodeUsage(data: InsertDiscountCodeUsage): Promise<DiscountCodeUsage> {
  const [usage] = await db
    .insert(discountCodeUsage)
    .values(data)
    .returning();
  
  // Increment the usage count on the discount code
  await incrementDiscountCodeUsage(data.discountCodeId);
  
  return usage;
}

export async function getDiscountCodeUsageByUser(userId: number): Promise<DiscountCodeUsage[]> {
  return await db
    .select()
    .from(discountCodeUsage)
    .where(eq(discountCodeUsage.userId, userId))
    .orderBy(discountCodeUsage.appliedAt);
}

export async function validateDiscountCode(code: string, planType: string = 'all'): Promise<{ 
  valid: boolean; 
  discountCode?: DiscountCode; 
  message?: string;
}> {
  const discountCode = await getDiscountCodeByCode(code);
  
  // Check if code exists
  if (!discountCode) {
    return { valid: false, message: 'Invalid discount code' };
  }
  
  // Check if code is active
  if (!discountCode.isActive) {
    return { valid: false, discountCode, message: 'This discount code is no longer active' };
  }
  
  // Check if code applies to the selected plan
  if (discountCode.appliesTo !== 'all' && discountCode.appliesTo !== planType) {
    return { valid: false, discountCode, message: `This discount code does not apply to the ${planType} plan` };
  }
  
  const now = new Date();
  
  // Check if code is within valid date range
  if (discountCode.validFrom > now) {
    return { valid: false, discountCode, message: 'This discount code is not yet active' };
  }
  
  if (discountCode.validUntil && discountCode.validUntil < now) {
    return { valid: false, discountCode, message: 'This discount code has expired' };
  }
  
  // Check if code has reached max usage
  if (discountCode.maxUses !== null && discountCode.usedCount >= discountCode.maxUses) {
    return { valid: false, discountCode, message: 'This discount code has reached its maximum usage limit' };
  }
  
  // Code is valid
  return { valid: true, discountCode };
}

export async function calculateDiscountedPrice(originalPrice: number, discountCode: DiscountCode): Promise<{
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
}> {
  let discountedPrice = originalPrice;
  let discountAmount = 0;
  
  if (discountCode.discountType === 'percentage') {
    discountAmount = (originalPrice * Number(discountCode.discountValue)) / 100;
    discountedPrice = originalPrice - discountAmount;
  } else if (discountCode.discountType === 'fixed') {
    discountAmount = Number(discountCode.discountValue);
    discountedPrice = Math.max(0, originalPrice - discountAmount);
  }
  
  // Ensure we don't have negative prices
  discountedPrice = Math.max(0, discountedPrice);
  
  // Calculate discount percentage
  const discountPercentage = (discountAmount / originalPrice) * 100;
  
  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    discountPercentage
  };
}