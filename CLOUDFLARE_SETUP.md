# ⚡ Cloudflare Pages Configuration

## Quick Setup (Copy-Paste Ready)

When connecting your repository to Cloudflare Pages, use these settings:

### Build Settings
```
Framework preset:     None
Build command:        (leave empty - no build needed!)
Build output dir:     /
Root directory:       (leave empty)
Environment vars:     (none needed)
```

### Why These Settings?

- **No build command**: All files are ready to serve from the root directory
- **Output dir `/`**: Deploys the root directory directly
- **No root directory**: Uses repository root (where index.html is)

## The Button IS There!

The "Enable Blob Mesh" button is in the root `index.html` file at line 360:

```html
<button id="blobToggleBtn" class="blob-toggle-btn" aria-label="Toggle Blob Mesh rendering mode">
    <span class="blob-icon" aria-hidden="true">🧬</span>
    <span class="blob-text">Enable Blob Mesh</span>
</button>
```

## Deployment Checklist

- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Select the branch with the button (e.g., `copilot/add-enable-blob-mesh-button`)
- [ ] Set build output directory to `/`
- [ ] Leave build command empty
- [ ] Save and deploy
- [ ] Wait 1-2 minutes for deployment
- [ ] Visit your site and look below the canvas for the cyan button!

## Troubleshooting

### "I don't see the button!"

1. **Check which branch is deployed**: 
   - Go to Cloudflare Pages → Your Project → Settings → Builds & deployments
   - Verify the production branch is the one with the button

2. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - Or use incognito/private mode

3. **Check deployment logs**:
   - Look for errors in Cloudflare Pages deployment logs
   - Verify all files were deployed (should see index.html, src/, etc.)

4. **Verify the file in deployment**:
   - In Cloudflare dashboard, check Functions → Assets
   - Confirm index.html is present and recent

### "Deployment failed!"

- Make sure output directory is `/` (not `public` or `./public`)
- Verify build command is empty
- Check that the branch exists and has the latest commits

### "Button is there but not working"

- Check browser console for JavaScript errors
- Verify all `src/` files are loading correctly
- Make sure WebGL is supported in your browser

## Alternative: Deploy from Command Line

```bash
# Install wrangler (one time)
npm install -g wrangler

# Login (one time)
wrangler login

# Deploy from repository root
cd /path/to/webgl-particle-engine
wrangler pages deploy . --project-name=webgl-particle-engine
```

## Success!

Once deployed, you should see:
- ✅ Canvas loads with WebGL context
- ✅ Cyan "Enable Blob Mesh" button below canvas
- ✅ Button toggles to "Disable Blob Mesh" when clicked
- ✅ All controls and features work

The button looks like this:

🧬 **Enable Blob Mesh** ← Cyan gradient button with DNA emoji

---

**Still having issues?** Check that you're deploying from the correct branch that includes the button changes.
