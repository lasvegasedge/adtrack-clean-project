import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getDemoDataSummary } from '../demo-data-manager';

export const adminRouter = express.Router();

// Middleware to ensure only admins can access these routes
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  next();
}

// Get all users
// Get all businesses
adminRouter.get('/admin/businesses', requireAdmin, async (req, res) => {
  try {
    const businessesResult = await db.execute(sql`
      SELECT b.*, 
             u.username as owner_username,
             u.email as owner_email
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.id DESC
    `);
    
    res.json(businessesResult.rows);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'Failed to load businesses' });
  }
});

adminRouter.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const usersResult = await db.execute(sql`
      SELECT u.*, 
             b.name as business_name,
             COALESCE(u.is_admin, false) as is_admin 
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      WHERE u.status != 'DELETED'
      AND u.username IS NOT NULL
      ORDER BY u.id DESC
    `);
    
    res.json(usersResult.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

// Get admin dashboard statistics  
adminRouter.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    console.log('Admin stats endpoint accessed by:', req.user.username);
    
    // Get total active users count (non-deleted users)
    const usersResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE status != 'DELETED' 
      AND username IS NOT NULL
    `);
    const totalUsers = parseInt(String(usersResult.rows[0].count));

    // Get ad methods
    const adMethodsResult = await db.execute(sql`SELECT * FROM ad_methods`);
    
    // Get business types
    const businessTypesResult = await db.execute(sql`SELECT * FROM business_types`);
    
    // Get campaigns data
    const campaignsResult = await db.execute(sql`
      SELECT c.*, am.name as ad_method_name, b.name as business_name
      FROM campaigns c
      JOIN ad_methods am ON c.ad_method_id = am.id
      JOIN businesses b ON c.business_id = b.id
    `);

    const campaigns = campaignsResult.rows;
    const activeCampaigns = campaigns.filter(c => c.is_active).length;
    
    // Calculate average ROI
    const roiData = campaigns
      .filter(c => Number(c.amount_spent) > 0)
      .map(c => ((Number(c.amount_earned) - Number(c.amount_spent)) / Number(c.amount_spent)) * 100);
    
    const averageROI = roiData.length > 0 
      ? roiData.reduce((a, b) => a + b, 0) / roiData.length 
      : 0;

    // Get total businesses count
    const businessesResult = await db.execute(sql`SELECT COUNT(*) as count FROM businesses`);
    const totalBusinesses = parseInt(String(businessesResult.rows[0].count));
    
    // Get campaign counts
    const dbCampaignsResult = await db.execute(sql`SELECT COUNT(*) as count FROM campaigns`);
    const dbTotalCampaigns = parseInt(String(dbCampaignsResult.rows[0].count));
    
    // Get active campaigns count
    const dbActiveCampaignsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM campaigns WHERE is_active = true
    `);
    const dbActiveCampaigns = parseInt(String(dbActiveCampaignsResult.rows[0].count));
    
    // Calculate average ROI for all campaigns
    const dbRoiResult = await db.execute(sql`
      SELECT AVG((amount_earned - amount_spent) / amount_spent * 100) as avg_roi 
      FROM campaigns 
      WHERE amount_spent > 0
    `);
    
    const dbAverageROI = dbRoiResult.rows[0].avg_roi ? parseFloat(dbRoiResult.rows[0].avg_roi) : 0;
    
    // Get recently joined users
    const recentUsersResult = await db.execute(sql`
      SELECT u.id, u.username, u.email, u.is_verified, u.is_admin, b.name as business_name 
      FROM users u 
      LEFT JOIN businesses b ON u.id = b.user_id 
      ORDER BY u.id DESC 
      LIMIT 5
    `);
    
    const recentUsers = recentUsersResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.is_verified,
      isAdmin: user.is_admin,
      businessName: user.business_name
    }));
    
    // Get campaigns by ad method
    const campaignsByMethodResult = await db.execute(sql`
      SELECT am.name, COUNT(c.id) as count 
      FROM campaigns c 
      JOIN ad_methods am ON c.ad_method_id = am.id 
      GROUP BY am.name
    `);
    
    const campaignsByMethod = campaignsByMethodResult.rows.map(row => ({
      name: row.name,
      count: parseInt(String(row.count))
    }));
    
    // Get campaigns by business type
    const campaignsByBusinessTypeResult = await db.execute(sql`
      SELECT bt.name, COUNT(c.id) as count 
      FROM campaigns c 
      JOIN businesses b ON c.business_id = b.id 
      JOIN business_types bt ON b.business_type = bt.name 
      GROUP BY bt.name
    `);
    
    const campaignsByBusinessType = campaignsByBusinessTypeResult.rows.map(row => ({
      name: row.name,
      count: parseInt(String(row.count))
    }));
    
    // Campaigns by performance (ROI ranges)
    const campaignsByPerformanceResult = await db.execute(sql`
      SELECT
        CASE
          WHEN (amount_earned - amount_spent) / amount_spent * 100 > 75 THEN 'Excellent (75%+)'
          WHEN (amount_earned - amount_spent) / amount_spent * 100 > 50 THEN 'Good (50-75%)'
          WHEN (amount_earned - amount_spent) / amount_spent * 100 > 25 THEN 'Average (25-50%)'
          WHEN (amount_earned - amount_spent) / amount_spent * 100 >= 0 THEN 'Poor (0-25%)'
          ELSE 'Negative'
        END as range,
        COUNT(*) as count
      FROM campaigns
      WHERE amount_spent > 0
      GROUP BY range
      ORDER BY range
    `);
    
    const campaignsByPerformance = campaignsByPerformanceResult.rows.map(row => ({
      range: row.range,
      count: parseInt(String(row.count))
    }));
    
    // Sample user growth data (in a real implementation, this would query by month)
    const userGrowth = [
      { date: '2024-01', count: Math.round(totalUsers * 0.3) },
      { date: '2024-02', count: Math.round(totalUsers * 0.5) },
      { date: '2024-03', count: Math.round(totalUsers * 0.7) },
      { date: '2024-04', count: Math.round(totalUsers * 0.85) },
      { date: '2024-05', count: totalUsers }
    ];
    
    // Sample retention rates
    const retentionRates = [
      { cohort: 'Jan 2024', retention: 78 },
      { cohort: 'Feb 2024', retention: 82 },
      { cohort: 'Mar 2024', retention: 75 },
      { cohort: 'Apr 2024', retention: 85 },
      { cohort: 'May 2024', retention: 91 }
    ];
    
    // Sample user activity
    const userActivity = [
      { date: '2024-05-01', active: Math.round(totalUsers * 0.65), inactive: Math.round(totalUsers * 0.35) },
      { date: '2024-05-08', active: Math.round(totalUsers * 0.70), inactive: Math.round(totalUsers * 0.30) },
      { date: '2024-05-15', active: Math.round(totalUsers * 0.75), inactive: Math.round(totalUsers * 0.25) },
      { date: '2024-05-22', active: Math.round(totalUsers * 0.73), inactive: Math.round(totalUsers * 0.27) },
      { date: '2024-05-29', active: Math.round(totalUsers * 0.78), inactive: Math.round(totalUsers * 0.22) }
    ];
    
    // Construct and return the full stats object
    const stats = {
      totalUsers,
      totalBusinesses,
      totalCampaigns: dbTotalCampaigns,
      activeCampaigns: dbActiveCampaigns,
      averageROI: dbAverageROI,
      recentUsers,
      adMethods: adMethodsResult.rows,
      businessTypes: businessTypesResult.rows,
      campaigns,
      campaignsByMethod,
      campaignsByBusinessType,
      campaignsByPerformance,
      userGrowth,
      retentionRates,
      userActivity
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to load system statistics.' });
  }
});

// Other admin routes can be added here