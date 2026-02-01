#!/bin/bash

# Build script for WebGL Hybrid Particle Transition Engine
# Prepares files for Cloudflare Pages / GitHub Pages deployment

echo "Building WebGL Hybrid Particle Transition Engine..."

# Create public directory
mkdir -p public

# Copy core HTML files for hybrid transition demo
echo "Copying demo files..."
cp index.html public/
cp export-hybrid-video.html public/
cp test-hybrid.html public/
cp hybrid-transition-example.html public/

# Copy src directory
echo "Copying source files..."
mkdir -p public/src

# Core engine files
cp src/ParticleEngine.js public/src/
cp src/ParticleSystem.js public/src/
cp src/Renderer.js public/src/
cp src/HybridEngine.js public/src/
cp src/HybridPageTransitionAPI.js public/src/

# Copy presets
mkdir -p public/src/presets
cp src/presets/Preset.js public/src/presets/
cp src/presets/HybridTransitionPreset.js public/src/presets/
cp src/presets/PresetManager.js public/src/presets/
cp src/presets/index.js public/src/presets/

# Copy triangulation (needed for hybrid mode)
mkdir -p public/src/triangulation
cp -r src/triangulation/* public/src/triangulation/

# Copy utils
mkdir -p public/src/utils
cp -r src/utils/* public/src/utils/

# Copy documentation
echo "Copying documentation..."
cp README.md public/
cp API.md public/
cp HYBRID_PAGE_TRANSITION_API.md public/

# Copy assets
echo "Copying assets..."
if [ -f indrolend.png ]; then
  cp indrolend.png public/
fi

# Copy configuration files
if [ -f _headers ]; then
  cp _headers public/
  echo "  - Copied _headers file"
fi

# Copy package.json for npm integration info
if [ -f package.json ]; then
  cp package.json public/
fi

echo ""
echo "✅ Build complete!"
echo "📦 Public directory size: $(du -sh public | cut -f1)"
echo ""
echo "Included files:"
echo "  - index.html (main hybrid transition demo)"
echo "  - export-hybrid-video.html (video export)"
echo "  - test-hybrid.html (development demo)"
echo "  - src/ (modular engine source)"
echo "  - Documentation (README.md, API docs)"
echo ""
echo "Archived files (not included in deployment):"
echo "  - Legacy demos and obsolete features"
echo "  - See archived/ directory in source repository"
echo ""
echo "🚀 Ready to deploy:"
echo "   npx wrangler pages deploy ./public --project-name=webgl-particle-engine"
