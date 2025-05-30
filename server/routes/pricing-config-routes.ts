import express from 'express';
import { db } from '../db';
import { pricingConfig } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { insertPricingConfigSchema } from '@shared/schema';

export const pricingConfigRouter = express.Router();

// PUBLIC endpoint for fetching active pricing configurations (no auth required)
pricingConfigRouter.get('/pricing-public', async (req, res) => {
  try {
    const configs = await db.select()
      .from(pricingConfig)
      .where(eq(pricingConfig.isActive, true))
      .orderBy(desc(pricingConfig.sortOrder), desc(pricingConfig.id));
    
    res.setHeader('Content-Type', 'application/json');
    res.json(configs);
  } catch (error) {
    console.error('Error fetching public pricing configurations:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ message: 'Failed to fetch pricing configurations' });
  }
});

// Middleware to ensure only admins can access these routes
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log('requireAdmin middleware called for:', req.path);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
  if (!req.isAuthenticated() || !req.user) {
    console.log('Authentication failed - returning 401');
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.user.isAdmin) {
    console.log('Authorization failed - user is not admin');
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  console.log('Admin access granted, proceeding...');
  next();
}

// GET /api/pricing-config - Fetch all pricing configurations
pricingConfigRouter.get('/pricing-config', requireAdmin, async (req, res) => {
  try {
    const configs = await db.select().from(pricingConfig).orderBy(desc(pricingConfig.sortOrder), desc(pricingConfig.id));
    res.json(configs);
  } catch (error) {
    console.error('Error fetching pricing configurations:', error);
    res.status(500).json({ message: 'Failed to fetch pricing configurations' });
  }
});

// POST /api/pricing-config - Create new pricing configuration
pricingConfigRouter.post('/pricing-config', requireAdmin, async (req, res) => {
  try {
    console.log('Creating pricing config with data:', req.body);
    
    // Validate the request body
    const validatedData = insertPricingConfigSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    
    // Prepare data for insertion - convert numbers to strings for decimal fields
    const pricingData = {
      name: validatedData.name,
      description: validatedData.description,
      features: validatedData.features,
      price: String(validatedData.price),
      discountedPrice: validatedData.discountedPrice ? String(validatedData.discountedPrice) : null,
      sortOrder: validatedData.sortOrder,
      isActive: validatedData.isActive,
      updatedBy: validatedData.updatedBy
    };
    
    console.log('Processed pricing data:', pricingData);
    
    const [newConfig] = await db.insert(pricingConfig)
      .values([pricingData])
      .returning();
    
    console.log('Created config:', newConfig);
    
    // Ensure we return JSON
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newConfig);
  } catch (error: any) {
    console.error('Error creating pricing configuration:', error);
    res.setHeader('Content-Type', 'application/json');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data provided', errors: error.errors });
    } else {
      return res.status(500).json({ message: 'Failed to create pricing configuration', error: error.message });
    }
  }
});

// PUT /api/pricing-config/:id - Update existing pricing configuration
pricingConfigRouter.put('/pricing-config/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid pricing configuration ID' });
    }
    
    // Validate the request body
    const validatedData = insertPricingConfigSchema.parse(req.body);
    
    // Prepare data for update - convert numbers to strings for decimal fields
    const pricingData = {
      name: validatedData.name,
      description: validatedData.description,
      features: validatedData.features,
      price: String(validatedData.price),
      discountedPrice: validatedData.discountedPrice ? String(validatedData.discountedPrice) : null,
      sortOrder: validatedData.sortOrder,
      isActive: validatedData.isActive,
      updatedBy: validatedData.updatedBy
    };
    
    const [updatedConfig] = await db.update(pricingConfig)
      .set(pricingData)
      .where(eq(pricingConfig.id, id))
      .returning();
    
    if (!updatedConfig) {
      return res.status(404).json({ message: 'Pricing configuration not found' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.json(updatedConfig);
  } catch (error: any) {
    console.error('Error updating pricing configuration:', error);
    res.setHeader('Content-Type', 'application/json');
    
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid data provided', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to update pricing configuration', error: error.message });
    }
  }
});

// DELETE /api/pricing-config/:id - Soft delete pricing configuration (mark as inactive)
pricingConfigRouter.delete('/pricing-config/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid pricing configuration ID' });
    }
    
    const [deletedConfig] = await db.update(pricingConfig)
      .set({ isActive: false })
      .where(eq(pricingConfig.id, id))
      .returning();
    
    if (!deletedConfig) {
      return res.status(404).json({ message: 'Pricing configuration not found' });
    }
    
    res.json({ message: 'Pricing configuration deleted successfully', config: deletedConfig });
  } catch (error) {
    console.error('Error deleting pricing configuration:', error);
    res.status(500).json({ message: 'Failed to delete pricing configuration' });
  }
});

// Public pricing endpoint (no authentication required) - matches frontend expectation
pricingConfigRouter.get('/pricing-public', async (req, res) => {
  try {
    const configs = await db.select().from(pricingConfig)
      .where(eq(pricingConfig.isActive, true))
      .orderBy(desc(pricingConfig.sortOrder), desc(pricingConfig.id));
    
    res.json(configs);
  } catch (error) {
    console.error('Error fetching public pricing configurations:', error);
    res.status(500).json({ message: 'Failed to fetch pricing configurations' });
  }
});