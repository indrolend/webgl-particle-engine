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
1. Connect repository
2. Build command: (leave empty)
3. Build output directory: `/`
4. Deploy

## Testing Locally
```bash
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then visit: `http://localhost:8000/`
