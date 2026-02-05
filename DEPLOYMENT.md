# Cloudflare Deployment Fix

## Problem
The deployment was failing with error:
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

## Root Cause
The Cloudflare Pages project was configured to run `npx wrangler versions upload` which is for Cloudflare Workers, not Pages static sites.

## Solution

### 1. Configuration Files Added

**wrangler.toml** - Configures the project as a static site:
```toml
name = "webgl-particle-engine"
compatibility_date = "2026-02-05"

[assets]
directory = "."
exclude = [".git", ".github", "node_modules", "package-lock.json"]
```

**_headers** - Ensures proper MIME types for ES6 modules and WebGL resources.

### 2. Cloudflare Dashboard Settings

If deployment still fails, update these settings in Cloudflare Pages dashboard:

**Build Configuration:**
- Framework preset: `None`
- Build command: *(leave empty)*
- Build output directory: `.` (or leave empty)
- Root directory: `/`

**Environment Variables:**
- None required

### 3. Deployment Methods

**Option A: GitHub Actions (Recommended)**
The workflow `.github/workflows/deploy-cloudflare-pages.yml` handles deployment automatically on push to main.

**Option B: Manual Deploy**
```bash
npm run deploy
```

**Option C: Cloudflare Dashboard**
Connect your GitHub repo and use the settings above.

## Verification

After deploying, verify:
1. ✅ index.html loads
2. ✅ JavaScript modules load (check browser console for errors)
3. ✅ WebGL context initializes
4. ✅ Images can be uploaded

## If Deployment Still Fails

1. **Check Cloudflare Pages project settings:**
   - Go to Cloudflare Dashboard > Pages > webgl-particle-engine
   - Click "Settings" > "Builds & deployments"
   - Ensure "Build command" is empty or removed
   - Ensure framework preset is "None"

2. **Check for wrangler command:**
   - If the build log shows `npx wrangler versions upload`, the project is misconfigured
   - This command is for Workers, not Pages
   - Change to Pages deployment via dashboard settings

3. **Retry deployment:**
   - Go to "Deployments" tab
   - Click "Retry deployment" on the failed deployment

## Technical Details

This is a **static site** with:
- No build step required
- ES6 modules loaded directly by browser
- All files served from root directory
- No server-side processing needed

The wrangler.toml tells Cloudflare to deploy everything in the root directory as static assets, excluding git and config files.
