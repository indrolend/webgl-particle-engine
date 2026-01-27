#!/bin/bash

# Build script to prepare static files for Cloudflare Pages deployment
echo "Building project for Cloudflare Pages deployment..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy HTML files
echo "Copying HTML files..."
if [ -f index.html ]; then
  cp index.html public/
else
  echo "Warning: index.html not found"
  exit 1
fi

if [ -f debug.html ]; then
  cp debug.html public/
else
  echo "Warning: debug.html not found"
  exit 1
fi

if [ -f image-morph-demo.html ]; then
  cp image-morph-demo.html public/
fi

if [ -f export-hybrid-video.html ]; then
  cp export-hybrid-video.html public/
fi

if [ -f test-hybrid.html ]; then
  cp test-hybrid.html public/
fi

if [ -f morph.html ]; then
  cp morph.html public/
fi

if [ -f triangulation-demo.html ]; then
  cp triangulation-demo.html public/
fi

if [ -f disintegration-demo.html ]; then
  cp disintegration-demo.html public/
fi

if [ -f page-transition-demo.html ]; then
  cp page-transition-demo.html public/
fi

if [ -f simple-page-transition-demo.html ]; then
  cp simple-page-transition-demo.html public/
fi

if [ -f minimal-example.html ]; then
  cp minimal-example.html public/
fi

if [ -f create-test-images.html ]; then
  cp create-test-images.html public/
fi

# Copy JavaScript files needed by index.html
echo "Copying JavaScript files..."
if [ -f morph-ui.js ]; then
  cp morph-ui.js public/
fi

if [ -f webgl-engine.js ]; then
  cp webgl-engine.js public/
fi

if [ -f triangulation-demo.js ]; then
  cp triangulation-demo.js public/
fi

# Copy src directory (excluding Worker entry point)
echo "Copying src directory..."
mkdir -p public/src

if [ -f src/ParticleEngine.js ]; then
  cp src/ParticleEngine.js public/src/
else
  echo "Warning: src/ParticleEngine.js not found"
  exit 1
fi

if [ -f src/ParticleSystem.js ]; then
  cp src/ParticleSystem.js public/src/
else
  echo "Warning: src/ParticleSystem.js not found"
  exit 1
fi

if [ -f src/Renderer.js ]; then
  cp src/Renderer.js public/src/
else
  echo "Warning: src/Renderer.js not found"
  exit 1
fi

# Copy HybridEngine if exists
if [ -f src/HybridEngine.js ]; then
  cp src/HybridEngine.js public/src/
fi

# Copy HybridPageTransitionAPI if exists
if [ -f src/HybridPageTransitionAPI.js ]; then
  cp src/HybridPageTransitionAPI.js public/src/
fi

# Copy presets directory if exists
if [ -d src/presets ]; then
  mkdir -p public/src/presets
  cp -r src/presets/* public/src/presets/
fi

# Copy triangulation directory if exists
if [ -d src/triangulation ]; then
  mkdir -p public/src/triangulation
  cp -r src/triangulation/* public/src/triangulation/
fi

# Copy utils directory if exists
if [ -d src/utils ]; then
  mkdir -p public/src/utils
  cp -r src/utils/* public/src/utils/
fi

# Copy image files needed for demos
echo "Copying image files..."
if [ -f indrolend.png ]; then
  cp indrolend.png public/
fi

# Note: Large files like cover art.jpeg and hybrid-transition-9x16.webm 
# are excluded from Cloudflare deployment (see wrangler.toml)
# They are available for local development only
if [ -f "cover art.jpeg" ]; then
  cp "cover art.jpeg" public/
  echo "Note: cover art.jpeg copied for local use (excluded from Cloudflare deployment)"
fi

# Copy video files if they exist (for local development only)
if [ -f hybrid-transition-9x16.webm ]; then
  cp hybrid-transition-9x16.webm public/
  echo "Note: hybrid-transition-9x16.webm copied for local use (excluded from Cloudflare deployment)"
fi

echo "Build complete! Files are ready in ./public directory"
echo "Note: Large demo files (.webm, cover art.jpeg) are excluded from Cloudflare deployment"
echo "To deploy: npx wrangler pages deploy ./public --project-name=webgl-particle-engine"
