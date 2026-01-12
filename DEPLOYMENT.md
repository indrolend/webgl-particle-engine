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
./build.sh
```

This copies all necessary files (HTML, JavaScript modules) to `public/` for deployment.

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
   ./build.sh
   ```

4. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy ./public --project-name=webgl-particle-engine
   ```

   This will deploy the static files from the `public/` directory to Cloudflare Pages.

5. **For subsequent deployments**, just run the build and deploy commands:
   ```bash
   ./build.sh && npx wrangler pages deploy ./public --project-name=webgl-particle-engine
   ```

### Method 2: Git Integration (Automatic Deployments)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `./build.sh`
   - **Build output directory**: `public`
   - **Root directory**: `/` (leave as default)
3. Save and deploy

Your site will automatically redeploy on every push to the main branch.

## Configuration Files

### wrangler.json
The `wrangler.json` file is configured for Cloudflare Wrangler v4 with:
- `assets.directory`: Points to `./public` for static asset deployment
- `compatibility_date`: Set to current date for latest features

This is a pure static site configuration. For dynamic functionality with Workers, you would need to add a `main` field pointing to a Worker script and an `assets.binding` field.

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
./build.sh
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
1. Ensure you've run `./build.sh` to populate the `public/` directory
2. Verify `wrangler.json` configuration is correct
3. Check you're authenticated: `npx wrangler whoami`

