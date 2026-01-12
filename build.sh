#!/bin/bash

# Build script to prepare static files for Cloudflare Pages deployment
echo "Building project for Cloudflare Pages deployment..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy HTML files
echo "Copying HTML files..."
cp index.html public/
cp debug.html public/

# Copy src directory
echo "Copying src directory..."
cp -r src public/

echo "Build complete! Files are ready in ./public directory"
echo "To deploy: npx wrangler pages deploy ./public --project-name=webgl-particle-engine"
