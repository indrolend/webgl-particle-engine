# 🚀 Cloudflare Pages Deployment Guide

This guide walks you through deploying the WebGL Hybrid Particle Transition Engine to Cloudflare Pages.

## 📋 Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works!)
- Node.js installed locally (for building)
- Git repository access

## 🎯 Quick Deployment

### Option 1: Deploy via Cloudflare Dashboard (Recommended for First-Time Setup)

1. **Build the project locally**:
   ```bash
   npm run build
   ```
   This creates the `public/` directory with all necessary files (360KB).

2. **Log in to Cloudflare Dashboard**:
   - Visit [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"

3. **Connect your repository**:
   - Select "Connect to Git"
   - Authorize GitHub and select this repository
   - Choose the branch (e.g., `main` or `master`)

4. **Configure build settings**:
   ```
   Build command:    npm run build
   Build output dir: public
   Root directory:   (leave empty for repository root)
   ```

5. **Environment Variables**: None required!

6. **Deploy**: Click "Save and Deploy"

Your site will be live at `https://your-project-name.pages.dev` in ~1 minute! 🎉

### Option 2: Deploy via Wrangler CLI

For faster deployments and CI/CD integration:

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Build and deploy**:
   ```bash
   npm run build
   npx wrangler pages deploy ./public --project-name=webgl-particle-engine
   ```

4. **Subsequent deployments**:
   ```bash
   npm run build && npx wrangler pages deploy ./public
   ```

## 📁 What Gets Deployed

The `public/` directory includes:

```
public/
├── index.html                          # Main hybrid transition demo
├── export-hybrid-video.html            # Video export demo
├── test-hybrid.html                    # Development/testing demo
├── hybrid-transition-example.html      # Complete example
├── src/                                # Modular engine source
│   ├── HybridEngine.js
│   ├── ParticleEngine.js
│   ├── ParticleSystem.js
│   ├── Renderer.js
│   ├── HybridPageTransitionAPI.js
│   ├── presets/
│   ├── triangulation/
│   └── utils/
├── README.md                           # Documentation
├── API.md                              # API reference
├── HYBRID_PAGE_TRANSITION_API.md       # Page transition guide
├── _headers                            # CORS headers for video export
├── package.json                        # Project metadata
└── indrolend.png                       # Logo/assets
```

**Total size**: ~360KB (optimized for fast loading!)

## 🔧 Configuration Files

### wrangler.toml

The repository includes a `wrangler.toml` configuration:

```toml
name = "webgl-particle-engine"
compatibility_date = "2026-01-12"

[assets]
directory = "./public"
exclude = ["*.webm", "*.mp4", "cover art.jpeg"]
```

This excludes large video files from deployment while keeping all essential assets.

### _headers

For the video export feature to work properly (requires SharedArrayBuffer for FFmpeg.wasm):

```
/export-hybrid-video.html
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

Cloudflare Pages automatically respects the `_headers` file!

## 🎨 Custom Domain (Optional)

1. Go to your Pages project → "Custom domains"
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `particles.yourdomain.com`)
4. Add the CNAME record to your DNS:
   ```
   CNAME particles your-project-name.pages.dev
   ```
5. Wait for SSL certificate provisioning (~5 minutes)

## 🔄 Automatic Deployments

Cloudflare Pages automatically deploys when you:
- Push to your connected branch (production)
- Create a pull request (preview deployments)

### Branch Deployments

- **Production**: `main` or `master` branch → `https://your-project.pages.dev`
- **Preview**: Pull requests → `https://<branch>.your-project.pages.dev`

## 🧪 Testing Your Deployment

After deployment, verify:

1. **Main demo loads**: Visit `https://your-project.pages.dev/`
   - Canvas initializes ✅
   - Upload controls work ✅
   - WebGL context created ✅

2. **Video export demo**: Visit `https://your-project.pages.dev/export-hybrid-video.html`
   - FFmpeg loads (may take a moment) ✅
   - CORS headers applied correctly ✅

3. **API documentation**: Visit `https://your-project.pages.dev/API.md`
   - Markdown renders correctly ✅

4. **Check browser console**: Should see initialization logs, no errors ✅

## 🐛 Troubleshooting

### Issue: 404 on deployment
**Solution**: Verify `public/` directory exists and contains `index.html`
```bash
npm run build
ls -la public/
```

### Issue: WebGL not initializing
**Solution**: Check browser console for errors. Ensure all `.js` files in `src/` are deployed.

### Issue: Video export fails
**Solution**: Verify `_headers` file is in `public/` directory:
```bash
cat public/_headers
```

### Issue: Module import errors
**Solution**: All files use ES6 modules with `.js` extensions. Ensure your browser supports modules.

### Issue: Large files excluded
**Solution**: This is intentional! The `wrangler.toml` excludes `.webm`, `.mp4`, and large images to stay under Cloudflare's limits. The demos work without them.

## 📊 Performance Tips

1. **Enable Cloudflare CDN caching**:
   - Automatic for all static assets
   - JavaScript files cached at edge locations worldwide

2. **Monitor with Analytics**:
   - Go to Pages project → Analytics
   - Track visitors, bandwidth, and performance

3. **Optimize particle counts**:
   - Default: 2000 particles (good for most devices)
   - High-end: 3000 particles
   - Low-end/mobile: 1000 particles

## 🔐 Security

- No API keys or secrets required
- All processing happens client-side
- CORS headers properly configured for video export
- No backend services needed

## 💡 Advanced: CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: webgl-particle-engine
          directory: public
```

**Setup**:
1. Get API token from Cloudflare Dashboard → API Tokens
2. Add to GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

## 🎉 Success!

Your WebGL Particle Engine is now live on Cloudflare Pages with:
- ⚡ Edge caching worldwide
- 🔒 Free SSL certificate
- 🚀 Automatic deployments
- 📊 Built-in analytics
- 💰 Free hosting (generous limits)

Share your demo and enjoy! 🎨✨

---

**Need help?** 
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Repository Issues](https://github.com/indrolend/webgl-particle-engine/issues)
- [API Documentation](./API.md)
