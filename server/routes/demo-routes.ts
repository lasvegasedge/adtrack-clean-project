import express from 'express';
import { checkAndRestoreDemoData, getDemoDataSummary } from '../demo-data-manager';

export const router = express.Router();

// Only allow admins to trigger demo data restoration
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user.isAdmin || req.user.username === 'admin@adtrack.online')) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// Endpoint to restore demonstration data
router.post('/restore-demo-data', isAdmin, async (req, res) => {
  try {
    console.log('Demo data restoration requested by admin');
    const result = await checkAndRestoreDemoData({
      ensureUsers: req.body.ensureUsers || 6,
      ensureBusinesses: req.body.ensureBusinesses || 6
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error in demo data restoration endpoint:', error);
    res.status(500).json({ error: 'Failed to restore demo data', message: error?.message || 'Unknown error' });
  }
});

// Get status of demo data
router.get('/demo-data-status', isAdmin, async (req, res) => {
  try {
    // Get actual summary of demo data in the database
    const summary = await getDemoDataSummary();
    res.json({ 
      status: 'active',
      summary,
      message: 'Use POST /api/demo/restore-demo-data to restore demonstration data',
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check demo data status', message: error?.message || 'Unknown error' });
  }
});