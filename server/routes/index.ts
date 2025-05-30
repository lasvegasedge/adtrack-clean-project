import { Router } from 'express';
import { subscriptionRouter } from './subscription-routes';
import { campaignRouter } from './campaign-routes';
import { businessRouter } from './business-routes';
import { router as demoRouter } from './demo-routes';
import { adminRouter } from './admin-routes';
import { emailTemplateRouter } from './email-template-routes';
import { marketingInsightsRouter } from './marketing-insights-routes';
import { pricingConfigRouter } from './pricing-config-routes';

export const apiRouter = Router();

// Register all routes
apiRouter.use(subscriptionRouter);
apiRouter.use(campaignRouter);
apiRouter.use(businessRouter);
apiRouter.use('/demo', demoRouter);
apiRouter.use(adminRouter);
apiRouter.use('/email-templates', emailTemplateRouter);
apiRouter.use('/marketing-insights', marketingInsightsRouter);
apiRouter.use(pricingConfigRouter);

// Add more route modules as needed