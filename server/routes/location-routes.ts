import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LocationStorage } from '../location-storage';
import { storage } from '../storage';
import { insertLocationSchema, insertUserLocationSchema } from '../../shared/schema';

const locationRouter = Router();
const locationStorage = new LocationStorage();

// Middleware to check business ownership
const checkBusinessOwnership = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const businessId = parseInt(req.params.businessId || req.body.businessId);
  
  if (isNaN(businessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  // Admin can access all businesses
  if (req.user.isAdmin) {
    return next();
  }

  const isOwner = await storage.isUserBusinessOwner(req.user.id, businessId);
  
  if (!isOwner) {
    return res.status(403).json({ message: 'Not authorized to access this business' });
  }

  next();
};

// Get all locations (admin only)
locationRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Filter by business ID if provided
    const businessId = req.query.businessId ? parseInt(req.query.businessId as string) : undefined;
    
    if (businessId) {
      // Non-admin users can only access their own business locations
      if (!req.user.isAdmin) {
        const isOwner = await storage.isUserBusinessOwner(req.user.id, businessId);
        if (!isOwner) {
          return res.status(403).json({ message: 'Not authorized to access this business' });
        }
      }
      
      const locations = await locationStorage.getBusinessLocations(businessId);
      return res.json(locations);
    }
    
    // Only admins can see all locations
    if (!req.user.isAdmin) {
      // For non-admin users, return locations they have access to
      const userLocations = await locationStorage.getUserLocations(req.user.id);
      return res.json(userLocations);
    }
    
    const locations = await locationStorage.getAllLocations();
    res.json(locations);
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get business locations
locationRouter.get('/business/:businessId', checkBusinessOwnership, async (req: Request, res: Response) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const locations = await locationStorage.getBusinessLocations(businessId);
    res.json(locations);
  } catch (error: any) {
    console.error('Error fetching business locations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get location by ID
locationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    
    // Add validation to ensure locationId is a valid number
    if (isNaN(locationId)) {
      console.error(`Invalid location ID: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid location ID format' });
    }
    
    const location = await locationStorage.getLocationById(locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if user has access to this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, location.businessId);
      const userLocations = await locationStorage.getUserLocationAssignments(req.user.id);
      const hasAccess = userLocations.some(ul => ul.locationId === locationId);
      
      if (!isOwner && !hasAccess) {
        return res.status(403).json({ message: 'Not authorized to access this location' });
      }
    }
    
    res.json(location);
  } catch (error: any) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new location
locationRouter.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationData = insertLocationSchema.parse(req.body);
    
    // Check if user has access to the business
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, locationData.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to create locations for this business' });
      }
    }

    const location = await locationStorage.createLocation(locationData);
    
    // If this is marked as primary, handle setting it as primary
    if (locationData.isPrimary) {
      await locationStorage.setPrimaryLocation(location.id);
    }
    
    res.status(201).json(location);
  } catch (error: any) {
    console.error('Error creating location:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid location data', errors: error.errors });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Update location
locationRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    const locationData = insertLocationSchema.partial().parse(req.body);
    
    // Verify the location exists
    const existingLocation = await locationStorage.getLocationById(locationId);
    if (!existingLocation) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if user has access to update this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, existingLocation.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to update this location' });
      }
    }

    const updatedLocation = await locationStorage.updateLocation(locationId, locationData);
    
    // If this is marked as primary, handle setting it as primary
    if (locationData.isPrimary) {
      await locationStorage.setPrimaryLocation(locationId);
    }
    
    res.json(updatedLocation);
  } catch (error: any) {
    console.error('Error updating location:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid location data', errors: error.errors });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Delete location
locationRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    
    // Verify the location exists
    const existingLocation = await locationStorage.getLocationById(locationId);
    if (!existingLocation) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if user has access to delete this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, existingLocation.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to delete this location' });
      }
    }

    // Check if it's the last location for the business
    const businessLocations = await locationStorage.getBusinessLocations(existingLocation.businessId);
    if (businessLocations.length === 1) {
      return res.status(400).json({ 
        message: 'Cannot delete the last location for a business. A business must have at least one location.' 
      });
    }

    const result = await locationStorage.deleteLocation(locationId);
    
    if (result) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: 'Failed to delete location' });
    }
  } catch (error: any) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: error.message });
  }
});

// Set primary location
locationRouter.post('/:id/set-primary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    
    // Verify the location exists
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if user has access to update this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, location.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to update this location' });
      }
    }

    const result = await locationStorage.setPrimaryLocation(locationId);
    
    if (result) {
      res.json({ message: 'Primary location updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to update primary location' });
    }
  } catch (error: any) {
    console.error('Error setting primary location:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get users assigned to a location
locationRouter.get('/:id/users', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    
    // Verify the location exists
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if user has access to view this location's users
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, location.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to view users for this location' });
      }
    }

    const users = await locationStorage.getLocationUsers(locationId);
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching location users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Assign user to location
locationRouter.post('/:id/users', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    const { userId, isPrimary } = req.body;
    
    // Validate request data
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    // Verify the location exists
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Verify the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if authenticated user has access to update this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, location.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to assign users to this location' });
      }
    }

    const assignment = insertUserLocationSchema.parse({
      userId,
      locationId, 
      isPrimary: isPrimary || false,
      assignedBy: req.user.id,
      assignedAt: new Date()
    });

    const result = await locationStorage.assignUserToLocation(assignment);
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error assigning user to location:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid assignment data', errors: error.errors });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Remove user from location
locationRouter.delete('/:id/users/:userId', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const locationId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // Verify the location exists
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if authenticated user has access to update this location
    if (!req.user.isAdmin) {
      const isOwner = await storage.isUserBusinessOwner(req.user.id, location.businessId);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to remove users from this location' });
      }
    }

    const result = await locationStorage.removeUserFromLocation(userId, locationId);
    
    if (result) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: 'Failed to remove user from location' });
    }
  } catch (error: any) {
    console.error('Error removing user from location:', error);
    res.status(500).json({ message: error.message });
  }
});

export default locationRouter;