# 🚀 Simple Cloudflare Pages Deployment

Deploy this WebGL Particle Engine to Cloudflare Pages in minutes - **no build process needed**!

## Quick Start

### Option 1: Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click **"Create a project"** → **"Connect to Git"**
3. Select your GitHub repository and branch
4. Configure build settings:
   ```
   Build command:    (leave empty)
   Build output dir: /
   Root directory:   (leave empty)
   ```
5. Click **"Save and Deploy"**

That's it! Your site will be live at `https://your-project-name.pages.dev` 🎉

### Option 2: Wrangler CLI

```bash
# Install wrangler (one time)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy (from repository root)
wrangler pages deploy . --project-name=webgl-particle-engine
```

## Why It's Simple

- ✅ **No build step** - all files are ready to serve
- ✅ **Root directory deployment** - no `public/` folder needed
- ✅ **No dependencies to install** - pure HTML/CSS/JS
- ✅ **Works immediately** - just push and deploy

## What Gets Deployed

All files from the root directory including:
- `index.html` - Main demo with Blob Mesh toggle button ⭐
- `blob-demo.html` - Blob mesh interactive demo
- `export-hybrid-video.html` - Video export feature
- `src/` - All engine source code
- Documentation and assets

## Troubleshooting

### Button not showing?
- Make sure you're deploying from the correct branch
- Check that `index.html` has the button (look for "Enable Blob Mesh")
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Files not updating?
- Cloudflare Pages caches aggressively
- Wait 1-2 minutes for deployment to complete
- Use a different browser or incognito mode to test

## Need the Old Build Process?

The previous build process (using `public/` directory) is still available but not recommended. The root directory deployment is simpler and works perfectly.

If you need it, see [CLOUDFLARE_PAGES.md](./CLOUDFLARE_PAGES.md) for the complex build-based approach.
