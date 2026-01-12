# Public Assets Directory

This directory contains the built static assets ready for deployment to Cloudflare Pages.

## Contents
- `index.html` - Landing page
- `debug.html` - Debug interface
- `src/` - JavaScript modules (ParticleEngine.js, ParticleSystem.js, Renderer.js)

## Deployment
This directory is the target for Cloudflare Pages deployment.

Use the following command to deploy:
```bash
npx wrangler pages deploy ./public --project-name=webgl-particle-engine
```

## Building
To rebuild/update this directory from source files, run:
```bash
./build.sh
```

This copies the latest HTML and JavaScript files from the root directory.

