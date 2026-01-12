#!/bin/bash

# Build script to prepare static files for Cloudflare Pages deployment
echo "Building project for Cloudflare Pages deployment..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy HTML files
echo "Copying HTML files..."
cp index.html public/
cp debug.html public/

# Copy src directory (excluding Worker entry point)
echo "Copying src directory..."
mkdir -p public/src
cp src/ParticleEngine.js public/src/
cp src/ParticleSystem.js public/src/
cp src/Renderer.js public/src/

echo "Build complete! Files are ready in ./public directory"
echo "To deploy: npx wrangler pages deploy ./public --project-name=webgl-particle-engine"

