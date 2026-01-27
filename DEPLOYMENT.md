# GitHub Pages / Cloudflare Pages Configuration

This project is ready for deployment to:
- GitHub Pages
- Cloudflare Pages (via Wrangler CLI or Git integration)
- Netlify
- Vercel
- Any static hosting service

## File Structure
Source files are in the root directory:
- `index.html` - Landing page (entry point)
- `debug.html` - Debug interface
- `src/` - JavaScript modules
- `public/` - Deployment directory (contains built static assets)
- `build.sh` - Build script to prepare files for deployment

## Build Process
Run the build script to copy static files to the `public/` directory:

```bash
# Using npm script (recommended for Cloudflare deployment)
npm run build

# Or directly
./build.sh

# For local development with large demo files
INCLUDE_LARGE_ASSETS=true ./build.sh
```

This copies all necessary files (HTML, JavaScript modules) to `public/` for deployment. The build script:
- Copies all HTML files (index.html, debug.html, export-hybrid-video.html, etc.)
- Copies JavaScript files (morph-ui.js, webgl-engine.js, etc.)
- Copies the entire `src/` directory structure with all modules
- Copies small image assets (e.g., indrolend.png)
- Maintains correct directory structure for ES6 module imports

### Large Assets - Not Included by Default
Large demonstration files are **NOT copied to public/** by default to ensure successful Cloudflare deployment:

**Files excluded from public/ (484KB without them):**
- `hybrid-transition-9x16.webm` (2.4MB) - Example video
- `cover art.jpeg` (883KB) - Example image

**Why this approach:**
1. Cloudflare Workers has strict asset size limits (~25MB total, individual file limits)
2. These are demonstration files, not required for site functionality
3. They remain in root directory for local development
4. Deployment succeeds reliably without them

**To include for local testing:**
```bash
INCLUDE_LARGE_ASSETS=true ./build.sh
```

This will copy the large files to `public/` for local development/testing but should NOT be used before Cloudflare deployment.

## MIME Types
Ensure your server serves `.js` files with `application/javascript` MIME type for ES6 modules to work correctly.

## GitHub Pages Setup
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: main (or your branch name)
4. Folder: / (root)
5. Save

Your site will be available at: `https://username.github.io/webgl-particle-engine/`

## Cloudflare Pages Setup

### Method 1: Wrangler CLI (Recommended for Local Development)

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy ./public --project-name=webgl-particle-engine
   ```

   This will deploy the static files from the `public/` directory to Cloudflare Pages.

5. **For subsequent deployments**, just run the build and deploy commands:
   ```bash
   npm run build && npx wrangler pages deploy ./public --project-name=webgl-particle-engine
   ```

### Method 2: Git Integration (Automatic Deployments)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `npm run build` or `bash build.sh`
   - **Build output directory**: `public`
   - **Root directory**: `/` (leave as default)
3. Save and deploy

Your site will automatically redeploy on every push to the main branch.

## Configuration Files

### wrangler.toml (Recommended)
The `wrangler.toml` file is configured for Cloudflare Wrangler v4 with:
- `name`: Project name for deployment
- `assets.directory`: Points to `./public` for static asset deployment
- `compatibility_date`: Set to current date for latest features

This is a pure static site configuration. For dynamic functionality with Workers, you would need to add a `main` field pointing to a Worker script.

### wrangler.json (Legacy)
The `wrangler.json` file is also available for compatibility. Both formats are supported by Wrangler v4, but `wrangler.toml` is the recommended modern format.

## Testing Locally

### Option 1: Simple HTTP Server
```bash
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then visit: `http://localhost:8000/`

### Option 2: Wrangler Dev (Testing with Cloudflare environment)
```bash
npm run build
npx wrangler pages dev ./public
```

This runs a local development server that mimics the Cloudflare Pages environment.

## Troubleshooting

### Issue: Module not found errors
**Solution**: Ensure you're serving files via HTTP server, not opening `file://` URLs directly. Browsers block ES6 modules from file:// protocol.

### Issue: MIME type errors for .js files
**Solution**: Configure your server to serve `.js` files with `Content-Type: application/javascript` header.

### Issue: Cloudflare deployment fails
**Solution**: 
1. Ensure you've run `npm run build` to populate the `public/` directory
2. Verify `wrangler.toml` or `wrangler.json` configuration is correct
3. Check you're authenticated: `npx wrangler whoami`
4. Ensure all asset paths in HTML files use relative paths (e.g., `./src/HybridEngine.js`)
5. Verify ES6 modules are properly exported and imported

### Issue: WebGL or sliders not displaying after deployment
**Solution**:
1. Check browser console for any JavaScript errors
2. Verify all module imports use correct relative paths (e.g., `./src/HybridEngine.js`)
3. Ensure the build process copied all files to `public/` directory
4. Test locally first using `npx wrangler pages dev ./public`
5. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Asset Paths and Module Loading

All asset paths in the project use **relative paths** to ensure they work correctly when deployed:

- HTML files reference JavaScript modules: `import { HybridEngine } from './src/HybridEngine.js'`
- All paths start with `./` (current directory) or `../` (parent directory)
- No absolute paths like `/src/...` that could break in subdirectory deployments

The `public/` directory structure mirrors the source structure:
```
public/
├── index.html           (imports from ./src/)
├── debug.html           (imports from ./src/)
├── landing.html
├── src/
│   ├── HybridEngine.js
│   ├── ParticleEngine.js
│   ├── ParticleSystem.js
│   ├── Renderer.js
│   ├── presets/
│   │   ├── Preset.js
│   │   ├── PresetManager.js
│   │   ├── SchoolOfFishPreset.js
│   │   └── HybridTransitionPreset.js
│   └── triangulation/
│       ├── DelaunayTriangulator.js
│       ├── KeyPointManager.js
│       ├── TriangulationMorph.js
│       └── TriangulationRenderer.js
└── ... (other HTML files)
```

## Deployment Verification Checklist

Before deploying to production, verify:

- [ ] Run `npm run build` successfully
- [ ] Test locally with `python3 -m http.server 8000` from the `public/` directory
- [ ] Open `http://localhost:8000/index.html` and verify:
  - [ ] WebGL canvas renders particles
  - [ ] All sliders are functional (Particle Count, Speed, Grid Size, Opacity)
  - [ ] Image upload buttons are visible
  - [ ] Tab navigation works (Images, Patterns, Settings)
  - [ ] No console errors
- [ ] All ES6 modules load without errors
- [ ] Test on different pages (index.html, debug.html, landing.html)


