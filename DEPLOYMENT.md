# GitHub Pages / Cloudflare Pages Configuration

This project is ready for deployment to:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Any static hosting service

## File Structure
All files are in the root directory:
- `index.html` - Landing page (entry point)
- `debug.html` - Debug interface
- `src/` - JavaScript modules
- `public/` - Static assets

## No Build Required
This is a pure static site with ES6 modules. No build step needed.

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

**Important**: This is a pure static site. Do NOT configure any build commands or use wrangler.

### Setup Steps:
1. Connect your repository to Cloudflare Pages
2. Configure the deployment:
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: None (or "None - plain static site")
   - **Build command**: (leave completely empty)
   - **Build output directory**: `/` (root directory)
   - **Root directory**: (leave empty)
3. Click "Save and Deploy"

### Common Issues:
- If Cloudflare tries to run `npx wrangler versions upload`, you have the wrong configuration
- Make sure the build command is completely empty - not "npm run build", not "wrangler deploy", just empty
- The site should deploy directly from the repository root with zero build steps

### What NOT to do:
- ❌ Don't set a build command
- ❌ Don't use `wrangler.toml` (it's for Workers, not static sites)
- ❌ Don't use Pages Functions or any Workers features
- ✅ Just deploy the static files directly

## Testing Locally
```bash
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then visit: `http://localhost:8000/`
