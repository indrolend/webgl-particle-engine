# 🚀 Quick Deployment Reference

## Cloudflare Pages - 3 Easy Steps

### 1️⃣ Build
```bash
npm run build
```

### 2️⃣ Deploy (First Time)
```bash
npx wrangler pages deploy ./public --project-name=webgl-particle-engine
```

### 3️⃣ Subsequent Deploys
```bash
npm run build && npx wrangler pages deploy ./public
```

---

## 📊 What You Get

✅ **Live at**: `https://webgl-particle-engine.pages.dev`  
✅ **Free SSL** certificate  
✅ **Global CDN** (edge caching worldwide)  
✅ **Automatic deployments** (with GitHub Actions)  
✅ **Preview deployments** for pull requests  
✅ **Built-in analytics**  

---

## 🎯 URLs After Deployment

- **Main Demo**: `https://your-project.pages.dev/`
- **Video Export**: `https://your-project.pages.dev/export-hybrid-video.html`
- **API Docs**: `https://your-project.pages.dev/API.md`
- **Test Demo**: `https://your-project.pages.dev/test-hybrid.html`

---

## 📝 Need Help?

**Full Guide**: See [CLOUDFLARE_PAGES.md](CLOUDFLARE_PAGES.md) for:
- Dashboard deployment walkthrough
- Custom domain setup
- Troubleshooting
- CI/CD configuration
- Performance tips

**Quick Links**:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [API Documentation](API.md)
- [GitHub Repository](https://github.com/indrolend/webgl-particle-engine)

---

## 🔧 Configuration Files

All configuration is ready! The repo includes:
- ✅ `wrangler.toml` - Cloudflare Pages config
- ✅ `_headers` - CORS headers for video export
- ✅ `build.sh` - Build script (creates public/ directory)
- ✅ `.github/workflows/` - Optional GitHub Actions automation

---

**Deployment time**: ~60 seconds ⚡  
**Build size**: 360KB 📦  
**Zero configuration needed** - just build and deploy! 🎉
