#!/bin/bash

# Build script to prepare static files for Cloudflare Pages deployment
echo "Building project for Cloudflare Pages deployment..."

# Exit on error
set -e

# Function to copy file if it exists
copy_if_exists() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "  ✓ Copied: $src"
    else
        echo "  ⚠ Skipped (not found): $src"
    fi
}

# Function to check and copy required file
copy_required() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "  ✓ Copied: $src"
    else
        echo "  ✗ Error: Required file not found: $src"
        exit 1
    fi
}

# Create public directory if it doesn't exist
mkdir -p public

# Copy HTML files
echo "Copying HTML files..."
copy_required "index.html" "public/"
copy_required "debug.html" "public/"
copy_if_exists "demo.html" "public/"
copy_if_exists "landing.html" "public/"
copy_if_exists "morph.html" "public/"
copy_if_exists "triangulation-demo.html" "public/"
copy_if_exists "disintegration-demo.html" "public/"

# Copy JavaScript files needed by HTML pages
echo "Copying JavaScript files..."
copy_if_exists "morph-ui.js" "public/"
copy_if_exists "webgl-engine.js" "public/"
copy_if_exists "triangulation-demo.js" "public/"

# Copy src directory
echo "Copying src directory..."
mkdir -p public/src

# Copy required core files
copy_required "src/ParticleEngine.js" "public/src/"
copy_required "src/ParticleSystem.js" "public/src/"
copy_required "src/Renderer.js" "public/src/"

# Copy optional core files
copy_if_exists "src/HybridEngine.js" "public/src/"

# Copy presets directory if exists
if [ -d "src/presets" ]; then
    echo "Copying presets directory..."
    mkdir -p public/src/presets
    
    # Copy all preset files
    for preset_file in src/presets/*.js; do
        if [ -f "$preset_file" ]; then
            cp "$preset_file" "public/src/presets/"
            echo "  ✓ Copied preset: $(basename $preset_file)"
        fi
    done
else
    echo "  ⚠ Presets directory not found"
fi

# Copy triangulation directory if exists
if [ -d "src/triangulation" ]; then
    echo "Copying triangulation directory..."
    mkdir -p public/src/triangulation
    
    # Copy all triangulation files
    for tri_file in src/triangulation/*.js; do
        if [ -f "$tri_file" ]; then
            cp "$tri_file" "public/src/triangulation/"
            echo "  ✓ Copied triangulation: $(basename $tri_file)"
        fi
    done
else
    echo "  ⚠ Triangulation directory not found"
fi

# Copy examples directory if exists
if [ -d "examples" ]; then
    echo "Copying examples directory..."
    mkdir -p public/examples
    cp -r examples/* public/examples/
    echo "  ✓ Copied examples"
fi

# Create a build info file
echo "Creating build info..."
cat > public/build-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildScript": "build.sh",
  "version": "1.0.0"
}
EOF
echo "  ✓ Created build-info.json"

echo ""
echo "✅ Build complete! Files are ready in ./public directory"
echo ""
echo "📦 Deployment options:"
echo "  • Cloudflare Pages: npx wrangler pages deploy ./public --project-name=webgl-particle-engine"
echo "  • GitHub Pages: Push to repository and enable Pages in settings"
echo "  • Local preview: cd public && python3 -m http.server 8000"
echo ""
