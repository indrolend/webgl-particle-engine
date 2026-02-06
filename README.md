# WebGL Hybrid Blob Mesh Transition Engine

A high-performance WebGL-based particle engine for creating seamless, animated transitions between images and pages with organic **blob mesh rendering** and **elastic mesh physics**. Built for developers who need stunning mitosis-like visual effects with minimal integration effort.

## ✨ Core Features

- **🎆 Simple Explosion Transition (NEW!)**: Clean two-phase particle explosion and reconstruction effect - Image 1 explodes, particles reconstruct into Image 2
- **🌊 Wave Mesh Transitions**: Immersive page transitions with wavy mesh distortion effects inspired by CodePen demos
- **👽 Alien Transition System**: Unified liquid-like morphing with opacity masking, enhanced physics constraints, and ghost outlines
- **🕸️ Elastic Mesh Transitions**: Physics-driven spring mesh with alpha-aware connections that preserves image holes
- **🎨 Organic Blob Mesh Transitions**: Physics-driven blob meshes that split and merge like cell division/mitosis
- **🧬 Metaball Rendering**: Smooth, organic surfaces generated from particle influence fields using marching squares
- **💧 Surface Tension Physics**: Cohesion forces create liquid-like blob behavior with elasticity
- **🔀 Blob Splitting & Merging**: Automatic mitosis detection and blob recombination
- **⚡ WebGL-Accelerated**: Hardware-accelerated rendering for smooth 60 FPS performance
- **🎬 Video Export**: Record and export transitions as MP4 videos (9:16 portrait format)
- **🎯 Developer-Friendly API**: Clean, intuitive API for easy integration into any web project
- **📱 Responsive**: Works on desktop and mobile devices with automatic performance optimization
- **🔧 Highly Configurable**: Full control over physics parameters, springs, elasticity, and damping

## 🚀 Quick Start

### Live Demo

Visit the [live demo](https://webgl-particle-engine.pages.dev/) to see the engine in action.

### Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/indrolend/webgl-particle-engine.git
cd webgl-particle-engine
```

2. **Serve with a local web server** (required for ES6 modules):
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

3. **Open in browser**:
```
http://localhost:8000/                           # Main hybrid transition demo
http://localhost:8000/simple-explosion-demo.html # Simple explosion transition (NEW!)
http://localhost:8000/examples/wave-mesh-demo.html # Wave mesh transition demo
http://localhost:8000/blob-demo.html             # Blob mesh rendering demo
http://localhost:8000/test-mesh.html             # Elastic mesh transition demo
http://localhost:8000/export-hybrid-video.html   # Video export demo
```

> **🎆 Try the Simple Explosion Demo!** Experience clean particle explosion and reconstruction. Watch Image 1 explode into particles that smoothly reconstruct into Image 2!

> **🌊 Try the Wave Mesh Demo!** Experience immersive page transitions with wavy mesh distortion effects. Watch images ripple and morph like viewing through water!

> **🕸️ Try the Elastic Mesh Demo!** Experience physics-driven spring mesh with alpha-aware connections. Watch the mesh explode, break, reconnect, and morph with organic sloshing motion!

> **🧬 Try the Blob Demo!** Experience organic blob mesh rendering with interactive controls. Watch particles form liquid-like blobs that automatically split (mitosis) and merge!

## 📖 API Usage

### Simple Explosion Transition (NEW!)

The default transition effect - clean particle explosion and reconstruction:

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Initialize engine
const engine = new HybridEngine(canvas, {
  particleCount: 2000
});

// Start simple explosion transition
await engine.startHybridTransition(image1, image2, {
  explosionIntensity: 250,       // Explosion force (default: 200)
  explosionDuration: 1200,       // Explosion phase duration in ms (default: 1000)
  reconstructionDuration: 1800,  // Reconstruction phase duration in ms (default: 1500)
  attractionStrength: 0.25,      // Particle attraction force (default: 0.2)
  particleFriction: 0.95,        // Velocity damping (default: 0.95)
  colorTransitionSpeed: 0.15     // Color change rate (default: 0.15)
});
```

**Two-Phase System:**
1. **Explosion**: Particles explode outward from image center with random velocities
2. **Reconstruction**: Particles are attracted to target positions, smoothly reconstructing into Image 2

**Key Features:**
- No triangulation blending - pure particle animation
- Smooth color morphing during reconstruction
- Physics-based movement with velocity and friction
- Configurable easing functions (easeOutQuad, easeOutCubic, easeInOutCubic)

### Wave Mesh Transition

Create immersive page transitions with wavy mesh distortion effects:

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

// Initialize API
const api = new HybridPageTransitionAPI({
  canvasId: 'transition-canvas',
  particleCount: 2000
});

await api.initialize();

// Perform wave mesh transition
await api.waveMeshPageTransition(
  document.getElementById('page1'),
  document.getElementById('page2'),
  {
    amplitude: 20,        // Wave height in pixels
    frequency: 0.05,      // Wave density
    speed: 2.0,           // Animation speed
    gridRows: 20,         // Mesh grid rows
    gridCols: 20,         // Mesh grid columns
    morphDuration: 1500   // Morph phase duration
  }
);
```

See [Wave Mesh Transition Documentation](docs/WAVE_MESH_TRANSITION.md) for complete guide.

### Alien Transition System

The alien transition provides a unified, liquid-like morphing effect with advanced features perfect for text, icons, and images with transparency.

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableTriangulation: true,
    enableBlobRendering: true
});

// Load source image
await engine.setImage(sourceImage);
engine.start();

// Trigger alien transition
await engine.alienTransition(sourceImage, targetImage, {
    // Core alien parameters
    alienIntensity: 0.7,              // Alien effect intensity (0-1)
    opacityThreshold: 0.3,            // Alpha threshold for masking (0-1)
    
    // Physics
    explosionIntensity: 120,          // Explosion force
    explosionDirectional: true,       // Directional vs random explosion
    liquidThickness: 0.5,             // Viscosity/chaos (0-1)
    snapSpeed: 0.25,                  // Reformation speed (0.1-0.5)
    
    // Visual polish
    ghostOutlineOpacity: 0.3,         // Ghost outline alpha (0-1)
    preventBlackout: true,            // Scale blobs by alpha
    
    // Phase timing (ms)
    staticDisplayDuration: 500,
    disintegrateDuration: 1200,
    alienMorphDuration: 2000,
    reformDuration: 1800,
    blendDuration: 1500
});
```

**Key Features:**
- **Opacity Masking**: Only creates particles/mesh for opaque regions (configurable threshold)
- **Enhanced Physics**: Spring constraints prevent sharp spikes and folding artifacts
- **Ghost Outline**: Faint source image overlay during morph preserves recognizability
- **Liquid Motion**: Smooth, organic, alien-like deformation with wave effects
- **Alpha-Aware Blobs**: Blob size scales with local alpha to prevent blackouts

**Best Use Cases:**
- Text logos with transparency
- Icons and symbols with sharp edges
- Photos with alpha channels
- Any image where preserving shape is important

### Elastic Mesh Transitions

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance with elastic mesh
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableMesh: true,
    triangulationMode: 'mesh',
    
    // Elastic mesh parameters
    meshGridDensity: 1.5,          // Vertices per 100px
    meshSpringConstant: 0.3,       // Spring stiffness
    meshDamping: 0.95,             // Velocity damping
    meshBreakThreshold: 300,       // Distance for spring breaking
    meshAlphaThreshold: 0.5,       // Alpha threshold for connections
    showMesh: false,               // Debug: show mesh lines
    showVertices: false            // Debug: show vertices
});

// Load source image
await engine.setImage(sourceImage);
engine.start();

// Trigger elastic mesh transition
await engine.hybridTransition(sourceImage, targetImage, {
    mode: 'mesh',
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

### Basic Integration with Blob Rendering

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance with blob mesh rendering
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableBlobRendering: true,
    triangulationMode: 'blob',  // Use blob mesh rendering
    
    // Blob-specific parameters
    blobInfluenceRadius: 80,    // Particle influence radius for metaball
    surfaceTension: 0.5,        // Surface tension strength (0-1)
    cohesionStrength: 0.3,      // Blob cohesion force (0-1)
    elasticity: 0.7,            // Bounce/recovery (0-1)
    mitosisFactor: 0.5,         // Splitting tendency (0-1)
    splitThreshold: 150,        // Distance threshold for blob splitting
    mergeThreshold: 80          // Distance threshold for blob merging
});

// Load source image
await engine.setImage(sourceImage);
engine.start();

// Trigger hybrid blob transition
await engine.startHybridTransition(sourceImage, targetImage, {
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

### Rendering Modes

The engine supports multiple rendering modes:

```javascript
// Elastic mesh mode - physics-driven spring mesh with alpha-aware connections
engine.setRenderMode('mesh');

// Blob mesh mode - organic liquid-like rendering
engine.setRenderMode('blob');

// Particle mode - individual particle points
engine.setRenderMode('particles');

// Triangulation mode - mesh morphing
engine.setRenderMode('triangulation');

// Hybrid mode - particles + triangulation
engine.setRenderMode('hybrid');
```

### Basic Integration

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableTriangulation: true,
    triangulationMode: 'hybrid'
});

// Load source image
await engine.setImage(sourceImage);
engine.start();

// Trigger hybrid transition
await engine.startHybridTransition(sourceImage, targetImage, {
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

### Configuration Options

The blob mesh transition system supports extensive configuration:

```javascript
const config = {
    // Timing
    staticDisplayDuration: 500,      // Initial static display (ms)
    disintegrationDuration: 1000,    // Particle emergence duration (ms)
    explosionTime: 800,              // Explosion phase duration (ms)
    recombinationDuration: 2500,     // Recombination duration (ms)
    blendDuration: 2000,             // Blend to target duration (ms)
    finalStaticDuration: 500,        // Final static display (ms)
    
    // Physics
    explosionIntensity: 150,         // Explosion force (50-300)
    recombinationChaos: 0.3,         // Chaos during recombination (0-1)
    vacuumStrength: 0.15,            // Vacuum pull strength (0.05-0.5)
    
    // Blob-specific parameters
    blobInfluenceRadius: 80,         // Particle influence radius for metaball (50-150)
    surfaceTension: 0.5,             // Surface tension strength (0-1)
    cohesionStrength: 0.3,           // Blob cohesion force (0-1)
    elasticity: 0.7,                 // Bounce/recovery factor (0-1)
    mitosisFactor: 0.5,              // Controls splitting tendency (0-1)
    splitThreshold: 150,             // Distance for blob mitosis (100-300)
    mergeThreshold: 80,              // Distance for blob merging (50-150)
    blobResolution: 4,               // Grid resolution for marching squares (2-8)
    blobFillOpacity: 0.85,           // Blob interior opacity (0-1)
    
    // Particles
    particleCount: 2000,             // Number of particles (500-5000)
    particleDensity: 1.0             // Sampling density (0.1-2.0)
};

await engine.startHybridTransition(image1, image2, config);
```

### Parameter Guide

#### Alien Transition Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| **alienIntensity** | Overall alien effect strength | 0-1 | 0.7 |
| **opacityThreshold** | Alpha cutoff for particle creation | 0-1 | 0.3 |
| **explosionIntensity** | Explosion force magnitude | 50-300 | 120 |
| **explosionDirectional** | Use directional vs random explosion | boolean | true |
| **liquidThickness** | Viscosity/chaos factor | 0-1 | 0.5 |
| **snapSpeed** | Speed of reformation to target | 0.1-0.5 | 0.25 |
| **ghostOutlineOpacity** | Ghost image overlay opacity | 0-1 | 0.3 |
| **preventBlackout** | Scale blobs by local alpha | boolean | true |
| **meshSpringLimit** | Max spring stretch before constraint | 1.5-4.0 | 2.5 |
| **meshRestoringForce** | Spring restoration strength | 0.1-1.0 | 0.4 |

#### Hybrid Transition Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| **explosionWeight** | Controls explosion force and spread | 50-300 | 150 |
| **recombinationWeight** | Duration of particle recombination | 1000-4000ms | 2500ms |
| **blendWeight** | Duration of final blend transition | 500-3000ms | 2000ms |
| **liquidThickness** | Chaos factor during recombination | 0-1 | 0.3 |
| **watercolorIntensity** | Vacuum strength pulling particles | 0.05-0.5 | 0.15 |
| **surfaceTension** | Blob surface tension strength | 0-1 | 0.5 |
| **mitosisFactor** | Controls blob splitting tendency | 0-1 | 0.5 |
| **elasticity** | Blob bounce and recovery | 0-1 | 0.7 |
| **blobInfluenceRadius** | Particle influence for metaball | 50-150 | 80 |

## 🎬 Video Export

The engine includes built-in video recording capabilities:

```javascript
// See export-hybrid-video.html for complete implementation
// Supports MP4 export in 9:16 portrait format
```

Visit `/export-hybrid-video.html` for a ready-to-use video export interface.

## 🧬 Blob Mesh Demo

Experience organic blob rendering with the dedicated demo page:

```bash
# Open blob-demo.html in your browser
http://localhost:8000/blob-demo.html
```

**Interactive Features:**
- **Random Particles**: Generate random particle formations
- **Circle/Grid Formation**: Organize particles into shapes
- **Explode!**: Trigger mitosis effect - watch one blob split into many
- **Real-time Stats**: Monitor particle count, blob count, and FPS

The demo showcases:
- Metaball rendering with marching squares algorithm
- Automatic blob detection and splitting (mitosis)
- Organic blob merging when particles come together
- Surface tension physics creating liquid-like behavior

## 🏗️ Project Structure

```
webgl-particle-engine/
├── src/
│   ├── HybridEngine.js              # Main hybrid engine
│   ├── HybridPageTransitionAPI.js   # High-level API for page transitions
│   ├── ParticleEngine.js            # Core particle engine
│   ├── ParticleSystem.js            # Particle physics and management
│   ├── Renderer.js                  # WebGL rendering
│   ├── presets/
│   │   └── HybridTransitionPreset.js # Preset for hybrid transitions
│   ├── triangulation/               # Triangulation morphing system
│   └── utils/
│       └── DevicePerformance.js     # Performance optimization
├── index.html                       # Main demo
├── export-hybrid-video.html         # Video export demo
├── test-hybrid.html                 # Development/testing demo
└── HYBRID_PAGE_TRANSITION_API.md    # Detailed API documentation

archived/                            # Legacy demos (not part of core engine)
```

## 🎯 Use Cases

### Page Transitions

Create stunning transitions between web pages:

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

const api = new HybridPageTransitionAPI({
    autoOptimize: true,
    particleCount: 2000
});

await api.initialize();
await api.transition('#page1', '#page2');
```

### Image Galleries

Smooth transitions between gallery images:

```javascript
const engine = new HybridEngine(canvas);
await engine.setImage(gallery[currentIndex]);
engine.start();

// On image change
await engine.startHybridTransition(
    gallery[currentIndex],
    gallery[nextIndex]
);
```

### Marketing & Landing Pages

Eye-catching visual effects for product showcases and hero sections.

### Video Content

Export transitions as video for use in presentations, social media, or video editing.

## 📚 Documentation

- **[API Documentation](API.md)** - Complete API reference with examples
- **[Page Transition API Guide](HYBRID_PAGE_TRANSITION_API.md)** - Detailed page transition documentation
- **[JSDoc Comments](src/)** - Inline documentation in source files
- **[Live Demo](index.html)** - Interactive demo with source code

## ⚡ Performance

The engine automatically optimizes based on device capabilities:

- **High-end devices**: 3000 particles, full resolution, 2000ms transitions
- **Mid-range devices**: 2000 particles, 0.8x resolution, 2400ms transitions  
- **Low-end devices**: 1000 particles, 0.6x resolution, 3000ms transitions

Manual optimization:

```javascript
engine.config.particleCount = 1500;  // Reduce particle count
engine.config.speed = 0.8;           // Adjust animation speed
```

## 🌐 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (WebGL 1.0)
- **Mobile browsers**: Supported with performance adjustments

## 📦 Deployment

> **📍 Deployment Location**: This project deploys directly from the **repository root** (`.`), not from a `/public` or `/dist` folder. All deployable files (HTML, JS, assets) are in the root directory for static deployment to Cloudflare Workers, Cloudflare Pages, or GitHub Pages.

### Cloudflare Pages (Recommended) - Simple!

**No build step needed!** Just deploy directly from your repository:

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect your GitHub repository
3. Set build output directory to: `/` (root)
4. Leave build command empty
5. Deploy!

**OR use Wrangler CLI**:
```bash
# One-time setup
npm install -g wrangler
wrangler login

# Deploy (no build needed!)
wrangler pages deploy . --project-name=webgl-particle-engine
```

📖 **[Simple Deployment Guide](CLOUDFLARE_SIMPLE.md)** - Quick start with no build complexity!

📖 **[Advanced Deployment Guide](CLOUDFLARE_PAGES.md)** - Build-based approach (not needed for most cases)

### GitHub Pages

You can also deploy directly to GitHub Pages from the repository root. No build step required!

### CDN Integration

```html
<!-- Include dependencies -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- Import and use -->
<script type="module">
    import { HybridEngine } from './src/HybridEngine.js';
    // Your code here
</script>
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Local development server
npm run serve
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

MIT License - feel free to use this in your projects, commercial or otherwise.

## 🙏 Credits

Built with:
- WebGL for hardware-accelerated rendering
- Custom particle physics engine
- Delaunay triangulation for mesh morphing

---

**[Live Demo](https://webgl-particle-engine.pages.dev/)** | **[GitHub Repository](https://github.com/indrolend/webgl-particle-engine)** | **[API Docs](API.md)**
