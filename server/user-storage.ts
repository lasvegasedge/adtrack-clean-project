import { db } from "./db";
import { eq } from "drizzle-orm";
import { User, users, UserRole, UserApprovalStatus } from "@shared/schema";

export class UserStorage {
  async getUser(id: number): Promise<User | undefined> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    if (results.length === 0) {
      return undefined;
    }
    
    const dbUser = results[0] as any;
    
    // Convert to the User type with proper type handling
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password,
      email: dbUser.email,
      phoneNumber: dbUser.phoneNumber,
      isVerified: dbUser.isVerified,
      verificationToken: dbUser.verificationToken,
      resetPasswordToken: dbUser.resetPasswordToken,
      resetPasswordExpires: dbUser.resetPasswordExpires,
      status: dbUser.status,
      businessId: dbUser.businessId,
      locationId: dbUser.locationId,
      isTrialPeriod: dbUser.isTrialPeriod,
      trialStartDate: dbUser.trialStartDate,
      trialEndDate: dbUser.trialEndDate,
      trialDuration: dbUser.trialDuration,
      stripeCustomerId: dbUser.stripeCustomerId,
      stripeSubscriptionId: dbUser.stripeSubscriptionId,
      
      // Special handling for enumerated fields
      isAdmin: dbUser.is_admin || dbUser.isAdmin || false,
      role: dbUser.role ? (dbUser.role as UserRole) : undefined,
      approvalStatus: dbUser.approvalStatus ? (dbUser.approvalStatus as UserApprovalStatus) : undefined,
      
      // Additional optional fields
      approvalDate: dbUser.approvalDate || null,
      approvedBy: dbUser.approvedBy || null,
      rejectionReason: dbUser.rejectionReason || null
    };
    
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    if (results.length === 0) {
      return undefined;
    }
    
    const dbUser = results[0] as any;
    
    // Convert to the User type with proper type handling - same mapping as above
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password,
      email: dbUser.email,
      phoneNumber: dbUser.phoneNumber,
      isVerified: dbUser.isVerified,
      verificationToken: dbUser.verificationToken,
      resetPasswordToken: dbUser.resetPasswordToken,
      resetPasswordExpires: dbUser.resetPasswordExpires,
      status: dbUser.status,
      businessId: dbUser.businessId,
      locationId: dbUser.locationId,
      isTrialPeriod: dbUser.isTrialPeriod,
      trialStartDate: dbUser.trialStartDate,
      trialEndDate: dbUser.trialEndDate,
      trialDuration: dbUser.trialDuration,
      stripeCustomerId: dbUser.stripeCustomerId,
      stripeSubscriptionId: dbUser.stripeSubscriptionId,
      
      // Special handling for enumerated fields
      isAdmin: dbUser.is_admin || dbUser.isAdmin || false,
      role: dbUser.role ? (dbUser.role as UserRole) : undefined,
      approvalStatus: dbUser.approvalStatus ? (dbUser.approvalStatus as UserApprovalStatus) : undefined,
      
      // Additional optional fields
      approvalDate: dbUser.approvalDate || null,
      approvedBy: dbUser.approvedBy || null,
      rejectionReason: dbUser.rejectionReason || null
    };
    
    return user;
  }
}