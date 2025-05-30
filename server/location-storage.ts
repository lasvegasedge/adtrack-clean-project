import { db } from "./db";
import { eq, and, or, asc, sql, isNull } from "drizzle-orm";
import { 
  Location, 
  locations, 
  InsertLocation, 
  userLocations, 
  InsertUserLocation, 
  UserLocation,
  businesses, 
  users,
  User 
} from "@shared/schema";
import { UserStorage } from "./user-storage";

const userStorage = new UserStorage();

export class LocationStorage {
  // Get all locations
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }
  
  // Get locations for a specific business
  async getBusinessLocations(businessId: number): Promise<any[]> {
    try {
      // Select only columns that exist in the database table
      return await db
        .select({
          id: locations.id,
          businessId: locations.businessId,
          name: locations.name,
          address: locations.address,
          zipCode: locations.zipCode,
          phone: locations.phone,
          email: locations.email,
          managerId: locations.managerId,
          separateBilling: locations.separateBilling,
          createdAt: locations.createdAt,
          updatedAt: locations.updatedAt
        })
        .from(locations)
        .where(eq(locations.businessId, businessId))
        .orderBy(asc(locations.name));
    } catch (error) {
      console.error("Error in getBusinessLocations:", error);
      return [];
    }
  }
  
  // Get a specific location by ID
  async getLocationById(id: number): Promise<any | undefined> {
    try {
      // Additional validation to ensure id is a valid number
      if (isNaN(id) || id <= 0) {
        console.error(`Invalid location ID passed to getLocationById: ${id}`);
        return undefined;
      }
      
      // Only select columns that exist in the database table
      const results = await db
        .select({
          id: locations.id,
          businessId: locations.businessId,
          name: locations.name,
          address: locations.address,
          zipCode: locations.zipCode,
          phone: locations.phone,
          email: locations.email,
          managerId: locations.managerId,
          separateBilling: locations.separateBilling,
          stripeCustomerId: locations.stripeCustomerId,
          stripeSubscriptionId: locations.stripeSubscriptionId,
          subscriptionPlanId: locations.subscriptionPlanId,
          createdAt: locations.createdAt,
          updatedAt: locations.updatedAt
        })
        .from(locations)
        .where(eq(locations.id, id));
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error("Error in getLocationById:", error);
      return undefined;
    }
  }
  
  // Create a new location
  async createLocation(locationData: InsertLocation): Promise<Location> {
    // Create sanitized data object with only existing fields that are in the actual database
    // The database table has these columns: id, business_id, name, address, zip_code, latitude, longitude,
    // phone, email, manager_id, separate_billing, stripe_customer_id, stripe_subscription_id, 
    // subscription_plan_id, created_at, updated_at
    
    const sanitizedData = {
      business_id: locationData.businessId,
      name: locationData.name,
      address: locationData.address,
      zip_code: locationData.zipCode
    } as any;
    
    // Add optional fields if they exist (only ones that exist in the database)
    if (locationData.latitude !== undefined) sanitizedData.latitude = locationData.latitude;
    if (locationData.longitude !== undefined) sanitizedData.longitude = locationData.longitude;
    if (locationData.email !== undefined) sanitizedData.email = locationData.email;
    if (locationData.managerId !== undefined) sanitizedData.manager_id = locationData.managerId;
    if (locationData.separateBilling !== undefined) sanitizedData.separate_billing = locationData.separateBilling;
    if (locationData.stripeCustomerId !== undefined) sanitizedData.stripe_customer_id = locationData.stripeCustomerId;
    if (locationData.stripeSubscriptionId !== undefined) sanitizedData.stripe_subscription_id = locationData.stripeSubscriptionId;
    if (locationData.subscriptionPlanId !== undefined) sanitizedData.subscription_plan_id = locationData.subscriptionPlanId;
    
    // Use direct insert via direct pool query instead of Drizzle
    try {
      const columns = Object.keys(sanitizedData);
      const values = Object.values(sanitizedData);
      
      // Build the prepared statement placeholders
      const placeholders = [];
      for (let i = 1; i <= values.length; i++) {
        placeholders.push(`$${i}`);
      }
      
      // Construct the raw SQL statement
      const insertQuery = `
        INSERT INTO locations (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      // Execute the raw SQL query using the pool directly
      const { pool } = await import('./db');
      const result = await pool.query(insertQuery, values);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in createLocation:", error);
      throw error;
    }
  }
  
  // Update a location
  async updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location | undefined> {
    // Create sanitized data object with only existing fields that are in the actual database
    // The database table has these columns: id, business_id, name, address, zip_code, latitude, longitude,
    // phone, email, manager_id, separate_billing, stripe_customer_id, stripe_subscription_id, 
    // subscription_plan_id, created_at, updated_at
    
    const sanitizedData = {} as any;
    
    // Map model fields to database column names
    if (locationData.businessId !== undefined) sanitizedData.business_id = locationData.businessId;
    if (locationData.name !== undefined) sanitizedData.name = locationData.name;
    if (locationData.address !== undefined) sanitizedData.address = locationData.address;
    if (locationData.zipCode !== undefined) sanitizedData.zip_code = locationData.zipCode;
    if (locationData.latitude !== undefined) sanitizedData.latitude = locationData.latitude;
    if (locationData.longitude !== undefined) sanitizedData.longitude = locationData.longitude;
    if (locationData.email !== undefined) sanitizedData.email = locationData.email;
    if (locationData.managerId !== undefined) sanitizedData.manager_id = locationData.managerId;
    if (locationData.separateBilling !== undefined) sanitizedData.separate_billing = locationData.separateBilling;
    if (locationData.stripeCustomerId !== undefined) sanitizedData.stripe_customer_id = locationData.stripeCustomerId;
    if (locationData.stripeSubscriptionId !== undefined) sanitizedData.stripe_subscription_id = locationData.stripeSubscriptionId;
    if (locationData.subscriptionPlanId !== undefined) sanitizedData.subscription_plan_id = locationData.subscriptionPlanId;
    
    // Only update if there are valid fields to update
    if (Object.keys(sanitizedData).length === 0) {
      return undefined;
    }
    
    try {
      // Build a set of SQL fragments for each field to update
      const updateParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(sanitizedData)) {
        updateParts.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
      
      // Construct the SQL query using the manual approach
      const updateQuery = `
        UPDATE locations 
        SET ${updateParts.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      // Add the ID as the last parameter
      values.push(id);
      
      // Execute the raw SQL query using the pool directly
      const { pool } = await import('./db');
      const result = await pool.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }
  
  // Delete a location
  async deleteLocation(id: number): Promise<boolean> {
    // First check if we're deleting the primary location
    const location = await this.getLocationById(id);
    if (!location) {
      return false;
    }
    
    // Remove all user-location assignments for this location
    await db
      .delete(userLocations)
      .where(eq(userLocations.locationId, id));
    
    // Delete the location
    const result = await db
      .delete(locations)
      .where(eq(locations.id, id))
      .returning();
    
    // If this was a primary location and we have other locations for this business,
    // we need to make another location the primary
    if (location.isPrimary) {
      const otherLocations = await this.getBusinessLocations(location.businessId);
      if (otherLocations.length > 0) {
        await this.setPrimaryLocation(otherLocations[0].id);
      }
    }
    
    return result.length > 0;
  }
  
  // Get locations with business info
  async getLocationsWithBusinessInfo(): Promise<any[]> {
    return await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        // Skip columns that might not exist in the database schema
        // city: locations.city,
        // state: locations.state,
        // zipCode: locations.zipCode,
        // country: locations.country,
        phone: locations.phone,
        phoneNumber: locations.phoneNumber,
        email: locations.email,
        isPrimary: locations.isPrimary,
        businessId: locations.businessId,
        businessName: businesses.name,
        businessType: businesses.businessType
      })
      .from(locations)
      .leftJoin(businesses, eq(locations.businessId, businesses.id))
      .orderBy(asc(locations.name));
  }
  
  // Get locations that a user has access to
  async getUserLocations(userId: number): Promise<any[]> {
    const user = await userStorage.getUser(userId);
    
    // Platform admin can see all locations
    if (user?.role === 'PLATFORM_ADMIN') {
      return this.getLocationsWithBusinessInfo();
    }
    
    // Get locations by direct assignment
    const assignedLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        // Skip columns that might not exist in the database schema
        // city: locations.city,
        // state: locations.state,
        // zipCode: locations.zipCode,
        // country: locations.country,
        phone: locations.phone,
        phoneNumber: locations.phoneNumber,
        email: locations.email,
        isPrimary: locations.isPrimary,
        businessId: locations.businessId,
        businessName: businesses.name,
        businessType: businesses.businessType,
        isPrimaryForUser: userLocations.isPrimary
      })
      .from(locations)
      .leftJoin(businesses, eq(locations.businessId, businesses.id))
      .innerJoin(userLocations, and(
        eq(userLocations.locationId, locations.id),
        eq(userLocations.userId, userId)
      ))
      .orderBy(asc(locations.name));
    
    // If user is a business admin or billing manager, get all locations for their business
    if (user?.businessId && (user?.role === 'BUSINESS_ADMIN' || user?.role === 'BILLING_MANAGER')) {
      const businessLocations = await db
        .select({
          id: locations.id,
          name: locations.name,
          address: locations.address,
          // Skip columns that might not exist in the database schema
          // city: locations.city,
          // state: locations.state,
          // zipCode: locations.zipCode,
          // country: locations.country,
          phone: locations.phone,
          phoneNumber: locations.phoneNumber,
          email: locations.email,
          isPrimary: locations.isPrimary,
          businessId: locations.businessId,
          businessName: businesses.name,
          businessType: businesses.businessType,
          isPrimaryForUser: sql<boolean>`false`.as('isPrimaryForUser')
        })
        .from(locations)
        .leftJoin(businesses, eq(locations.businessId, businesses.id))
        .where(
          and(
            eq(locations.businessId, user.businessId),
            // Exclude locations already in assignedLocations
            ...assignedLocations.map(loc => sql`${locations.id} != ${loc.id}`)
          )
        )
        .orderBy(asc(locations.name));
        
      return [...assignedLocations, ...businessLocations];
    }
    
    return assignedLocations;
  }
  
  // Assign a user to a location
  async assignUserToLocation(assignment: InsertUserLocation): Promise<UserLocation> {
    // Check if this assignment already exists
    const existing = await db
      .select()
      .from(userLocations)
      .where(
        and(
          eq(userLocations.userId, assignment.userId),
          eq(userLocations.locationId, assignment.locationId)
        )
      );
    
    if (existing.length > 0) {
      // Update existing assignment
      const [updated] = await db
        .update(userLocations)
        .set({
          isPrimary: assignment.isPrimary,
          // Note: assignedBy is used for both assignment and updates
          // Field name is different in DB schema
          assignedBy: assignment.assignedBy
        })
        .where(eq(userLocations.id, existing[0].id))
        .returning();
      
      return updated;
    }
    
    // If setting as primary, unset any existing primary location for this user
    if (assignment.isPrimary) {
      await db
        .update(userLocations)
        .set({ isPrimary: false })
        .where(
          and(
            eq(userLocations.userId, assignment.userId),
            eq(userLocations.isPrimary, true)
          )
        );
    }
    
    // Create new assignment
    const [newAssignment] = await db
      .insert(userLocations)
      .values(assignment)
      .returning();
    
    return newAssignment;
  }
  
  // Remove a user from a location
  async removeUserFromLocation(userId: number, locationId: number): Promise<boolean> {
    const result = await db
      .delete(userLocations)
      .where(
        and(
          eq(userLocations.userId, userId),
          eq(userLocations.locationId, locationId)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  // Get all users assigned to a location
  async getLocationUsers(locationId: number): Promise<User[]> {
    const results = await db
      .select({
        user: users
      })
      .from(userLocations)
      .innerJoin(users, eq(userLocations.userId, users.id))
      .where(eq(userLocations.locationId, locationId));
    
    // Map to user objects
    return await Promise.all(
      results.map(r => userStorage.getUser(r.user.id))
    ).then(users => users.filter(u => u !== undefined) as User[]);
  }
  
  // Get user-location assignments for a specific user
  async getUserLocationAssignments(userId: number): Promise<UserLocation[]> {
    return await db
      .select()
      .from(userLocations)
      .where(eq(userLocations.userId, userId));
  }
  
  // Set a location as primary
  async setPrimaryLocation(locationId: number): Promise<boolean> {
    const location = await this.getLocationById(locationId);
    if (!location) {
      return false;
    }
    
    // Unset primary for all other locations for this business
    await db
      .update(locations)
      .set({ isPrimary: false })
      .where(
        and(
          eq(locations.businessId, location.businessId),
          sql`${locations.id} != ${locationId}`
        )
      );
    
    // Set this location as primary
    const result = await db
      .update(locations)
      .set({ isPrimary: true })
      .where(eq(locations.id, locationId))
      .returning();
    
    return result.length > 0;
  }
}