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

echo "Build complete! Files are ready in ./public directory"
echo "To deploy: npx wrangler pages deploy ./public --project-name=webgl-particle-engine"
