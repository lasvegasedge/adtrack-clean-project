# AdTrack Deployment Troubleshooting Checklist

## Quick Fixes for Common Deployment Issues

Use this checklist to systematically troubleshoot when changes don't appear on adtrack.online after deployment.

### First Steps (Quick Fixes)

- [ ] **Hard Refresh Your Browser**
  - Chrome/Edge: Press `Ctrl+F5` or `Shift+F5`
  - Firefox: Press `Ctrl+Shift+R`
  - Safari: Hold `Option+Command+E` to empty cache, then `Command+R` to reload

- [ ] **Try Incognito/Private Browsing**
  - Open adtrack.online in an incognito/private window
  - This bypasses many browser caching mechanisms

- [ ] **Try a Different Browser**
  - If the changes appear in a different browser, it's likely a cache issue

- [ ] **Add a Cache-Busting Parameter**
  - Add `?refresh=timestamp` to the URL
  - Example: `https://adtrack.online/?refresh=20250519`

### Deeper Investigation

- [ ] **Check Deployed Files**
  - Verify the deployment process completed successfully
  - Check deployment logs for any errors
  - Confirm key changed files were included in the deployment

- [ ] **Check Network Requests**
  - Open browser developer tools (F12)
  - Go to Network tab
  - Reload the page
  - Look for resources returning 304 (Not Modified) status
  - Check for any failed requests (red)

- [ ] **Verify Code Changes**
  - If possible, inspect the deployed code directly
  - Check server-side rendered HTML for expected changes
  - Look for version numbers or timestamps in source code

### CDN and Server Cache Issues

- [ ] **Purge CDN Cache**
  - If using Cloudflare or another CDN:
    - Log into the CDN dashboard
    - Locate the cache purge function
    - Purge cache for adtrack.online domain

- [ ] **Server-Side Cache**
  - Access admin dashboard at adtrack.online/admin (admin credentials required)
  - Navigate to the cache management section
  - Use "Clear All Caches" function
  - Alternatively, clear specific route caches as needed

### Environment and Configuration

- [ ] **Environment Variables**
  - Verify all required environment variables are set in production
  - Check for any environment-specific code paths

- [ ] **Feature Flags**
  - Check if any feature flags might be disabling new features
  - Verify feature flags are configured correctly

### Frontend-Specific Issues

- [ ] **CSS and JavaScript**
  - Check if browser is loading the latest CSS/JS files
  - Look for versioning or hash strings in filenames
  - Verify bundled files include recent changes

- [ ] **Component State**
  - Try clearing local storage and session storage
  - In browser dev tools:
    - Application tab > Storage > Clear site data

### Server-Side Issues

- [ ] **Server Logs**
  - Check server logs for errors or warnings
  - Look for any startup or initialization errors

- [ ] **API Endpoints**
  - Test API endpoints directly using browser or tools like Postman
  - Verify they return expected data

### Last Resort Steps

- [ ] **Contact Hosting Provider**
  - If using external hosting, contact support
  - Check for any maintenance or issues on their end

- [ ] **Force Redeploy**
  - Make a trivial change (add a comment)
  - Deploy again to trigger a complete build process

## Documentation

After resolving the issue, document:
1. What was the problem
2. How it was identified
3. What solution worked
4. How to prevent it in the future

This information will help improve the deployment process for future updates.