import { db } from "./db";
import { eq } from "drizzle-orm";
import { Business, businesses } from "@shared/schema";

export class BusinessStorage {
  async getBusiness(id: number): Promise<Business | undefined> {
    const results = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getBusinessByUserId(userId: number): Promise<Business | undefined> {
    const results = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, userId));
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }
  
  async isUserBusinessOwner(userId: number, businessId: number): Promise<boolean> {
    const results = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId));
    
    if (results.length === 0) {
      return false;
    }
    
    return results[0].userId === userId;
  }
}