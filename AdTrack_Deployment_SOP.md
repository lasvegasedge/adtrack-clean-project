# AdTrack Deployment SOP
## Standard Operating Procedure for Deploying Website Updates to adtrack.online

**Document Created:** May 19, 2025  
**Last Updated:** May 19, 2025  
**Version:** 1.0

## Purpose
This document outlines the official standard operating procedure for deploying updates to the AdTrack marketing performance analytics platform (adtrack.online), ensuring all changes made in the development environment are properly reflected on the live production website.

## Prerequisites
- Administrative access to the AdTrack Replit workspace
- Deployment authorization credentials
- SFTP access to the production environment (if applicable)
- Understanding of the specific changes being deployed
- Access to AdTrack deployment checklist

## Deployment Process

### 1. Pre-Deployment Verification

Before deploying any changes to the live site, complete a comprehensive verification in the development environment:

1. **Code Review**
   - Review all modified files to ensure they contain the intended changes
   - Verify no syntax errors or linting issues remain
   - Check that all routes and navigation paths are properly configured

2. **Feature Testing in Replit Preview**
   - Test all modified features thoroughly in the Replit preview environment
   - Specific AdTrack verification points:
     - Public marketing pages (landing, features, about) should NOT display the bottom navigation
     - Marketing Insights link in footer should direct to Coming Soon page, not authenticated area
     - Authentication flows should work properly for all user types (demo, trial, admin)
     - Admin routes should be accessible only to admin users
     - All pricing pages should display correct subscription tiers

3. **Regression Testing**
   - Test unmodified features to ensure they still work as expected
   - Verify integrations with external services (Stripe, SendGrid, etc.)

### 2. Deployment Process for AdTrack.online

#### 2.1 Primary Deployment Method (Replit)

1. **Prepare Deployment Package**
   - Ensure all files are saved in the development environment
   - Commit changes to version control (if using Git)
   - Create a deployment notes document detailing changes

2. **Execute Deployment**
   - Click the "Deploy" button in the Replit interface
   - Select production environment target
   - Review the deployment configuration settings
   - Confirm the deployment when prompted

3. **Monitor Deployment Process**
   - The full deployment process typically takes 1-3 minutes
   - Monitor the deployment logs for any errors or warnings
   - Verify all build steps complete successfully

#### 2.2 Custom Domain Configuration (adtrack.online specific)

1. **Domain Settings Verification** 
   - DNS configuration should be set as follows:
     - A record: Points to Replit's IP address (provided in Replit deployment settings)
     - CNAME record: `www.adtrack.online` should point to your Replit deployment URL
   - SSL certificate should be valid and active (auto-renewed through Replit)

2. **CDN Configuration**
   - Verify CDN settings if using a Content Delivery Network
   - Check cache expiration settings (recommended: 1 hour for static assets, no cache for HTML)

### 3. Post-Deployment Verification for AdTrack.online

1. **Cache Management**
   - Perform a complete browser cache clear:
     - Chrome/Edge: Ctrl+F5 or Ctrl+Shift+R
     - Firefox: Ctrl+Shift+R or Cmd+Shift+R
     - Safari: Option+Cmd+E (to clear cache) then Cmd+R to reload
   - Test in a private/incognito browsing session
   - Add `?v=[timestamp]` parameter to URLs to bypass cache (e.g., `adtrack.online/?v=202505190001`)

2. **Critical Path Testing**
   - Visit the production site at `https://adtrack.online/`
   - Verify homepage appears correctly with no bottom navigation
   - Test feature page links, especially Marketing Insights redirect to Coming Soon
   - Complete login/logout processes with test accounts
   - Test authenticated user experience shows correct navigation
   - Verify admin user flows (if applicable)

3. **Multi-Device Verification**
   - Test on desktop browsers (Chrome, Firefox, Safari, Edge)
   - Verify mobile responsiveness (iOS and Android devices)
   - Check tablet layout and functionality

4. **Performance Verification**
   - Verify page load times are acceptable (under 3 seconds)
   - Check for any JavaScript errors in browser console
   - Verify API endpoints respond within expected timeframes

### 4. AdTrack-Specific Troubleshooting Guide

If changes don't appear on the live site after deployment:

1. **AdTrack Cache System**
   - AdTrack implements special caching for dynamic content
   - Access the cache control panel at `adtrack.online/admin/cache` (admin access required)
   - Use the "Purge All Caches" function for immediate update
   - Specific routes can be purged individually as needed

2. **Build Process Verification**
   - Check deployment logs for AdTrack-specific build errors
   - Verify all client-side components were properly compiled
   - Ensure server-side routes are properly registered

3. **Environment Configuration**
   - Verify all AdTrack environment variables are set correctly:
     - API keys (Stripe, SendGrid, etc.)
     - Database connection strings
     - Feature flag settings
   - Check for environment-specific code paths that may be causing issues

4. **AdTrack-Specific Code Considerations**
   - Check for hard-coded development URLs (should use environment variables)
   - Verify authentication token handling is working correctly
   - Check subscription tier access controls

### 5. Emergency Rollback Procedure

If critical issues are discovered after deployment that impact business operations:

1. **Initiate Emergency Response**
   - Notify the technical team lead immediately
   - Document the specific issues encountered

2. **Execute Rollback**
   - Access Replit deployment history for AdTrack
   - Select the most recent stable version
   - Deploy the stable version using emergency deployment procedure
   - Verify critical functionality is restored

3. **Post-Incident Analysis**
   - Document the root cause of the issue
   - Update deployment procedures to prevent recurrence
   - Schedule a fix for the identified issues

## Maintenance

This SOP should be reviewed and updated:
- After each major feature deployment
- When deployment infrastructure changes
- At minimum quarterly (January, April, July, October)

## Related Documents
- AdTrack Feature Testing Checklist
- AdTrack Environment Configuration Guide
- Emergency Response Protocol

## Approval

This SOP has been approved for use by AdTrack development and operations teams.

**Approved by:** [Management Name]  
**Position:** [Title]  
**Date:** May 19, 2025