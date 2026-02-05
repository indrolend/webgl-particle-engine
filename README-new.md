# Alien Jelly Mesh Transition Engine

A WebGL-based engine for creating organic, liquid-like transitions between images using elastic mesh physics and blob rendering.

## ✨ Features

- **🧬 Elastic Mesh Physics**: Spring-based mesh with alpha-aware connections
- **💧 Jelly-like Deformation**: Springs can break and reconnect for organic motion
- **🎨 Blob Rendering**: Smooth, organic surfaces with solid fill
- **⚡ WebGL Accelerated**: Hardware-accelerated rendering for smooth 60 FPS
- **🎯 Simple API**: Clean, minimal interface

## 🚀 Quick Start

### 1. Serve the Project

Use any local web server (required for ES6 modules):

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### 2. Open in Browser

Navigate to `http://localhost:8000/` and use the interface to:

1. **Load Source Image**: Select your starting image
2. **Load Target Image**: Select your destination image
3. **Play Transition**: Watch the jelly-like morphing effect

## 📖 Usage

### Basic Example

```javascript
import { AlienTransitionEngine } from './src/AlienTransitionEngine.js';

// Create engine instance
const canvas = document.getElementById('myCanvas');
const engine = new AlienTransitionEngine(canvas, {
    gridDensity: 1.5,           // Mesh density (vertices per 100px)
    explosionIntensity: 120,    // Force of explosion phase
    snapSpeed: 0.25             // Speed of snap-back to target
});

// Load images
const sourceImg = new Image();
sourceImg.src = 'source.jpg';
await sourceImg.decode();

const targetImg = new Image();
targetImg.src = 'target.jpg';
await targetImg.decode();

// Run transition
await engine.transition(sourceImg, targetImg);
```

### Configuration Options

```javascript
const config = {
    // Mesh Physics
    gridDensity: 1.5,          // Vertices per 100px (0.5-3.0)
    springConstant: 0.3,       // Spring stiffness (0.1-1.0)
    damping: 0.95,             // Velocity damping (0.8-0.99)
    breakThreshold: 300,       // Distance for spring breaking (pixels)
    reconnectThreshold: 80,    // Distance for spring reconnection (pixels)
    alphaThreshold: 0.5,       // Alpha threshold for connections (0-1)
    
    // Blob Rendering
    blobInfluenceRadius: 80,   // Metaball influence radius (pixels)
    blobResolution: 4,         // Grid resolution for marching squares (2-8)
    fillOpacity: 0.85,         // Blob fill opacity (0-1)
    edgeSoftness: 0.15,        // Edge fade amount (0-1)
    
    // Transition Timing (milliseconds)
    staticDuration: 500,       // Initial static display
    explodeDuration: 800,      // Explosion phase
    snapBackDuration: 2000,    // Snap back to target
    blendDuration: 1500,       // Color blend phase
    finalDuration: 500,        // Final static display
    
    // Physics
    explosionIntensity: 120,   // Explosion force (50-300)
    snapSpeed: 0.25            // Attraction to target (0.1-0.5)
};

const engine = new AlienTransitionEngine(canvas, config);
```

## 🎬 Transition Phases

The engine uses a simple 4-phase state machine:

1. **Static** - Display source image (500ms)
2. **Explode** - Mesh explodes outward with spring physics (800ms)
3. **Snap Back** - Springs pull mesh to target shape with color blend (2000ms)
4. **Final** - Display final target image (500ms)

## 📁 Project Structure

```
webgl-particle-engine/
├── src/
│   ├── AlienTransitionEngine.js    # Main transition orchestrator
│   ├── Renderer.js                  # WebGL rendering utilities
│   ├── mesh/
│   │   ├── ElasticMesh.js          # Mesh structure & vertices
│   │   └── MeshPhysics.js          # Spring physics simulation
│   └── blob/
│       └── BlobRenderer.js          # Organic blob rendering
├── index.html                       # Demo interface
└── README.md                        # This file
```

## 🎯 How It Works

### Elastic Mesh

The engine generates a grid mesh of vertices connected by springs. The mesh is "alpha-aware" - it only creates connections between vertices where the image is opaque, preserving holes and transparency.

- **Vertices**: Grid points with position, velocity, and color
- **Springs**: Elastic connections that can break and reconnect
- **Physics**: Verlet integration with spring forces

### Blob Rendering

Instead of rendering individual mesh points, the BlobRenderer uses a metaball algorithm with marching squares to create smooth, organic surfaces:

1. **Field Calculation**: Each vertex creates an influence field
2. **Marching Squares**: Samples the field on a grid to find contours
3. **Triangle Generation**: Creates mesh geometry from contours
4. **Solid Fill**: Renders with WebGL as opaque blobs

## 🔧 API Reference

### AlienTransitionEngine

#### Constructor

```javascript
new AlienTransitionEngine(canvas, config)
```

- `canvas` - HTMLCanvasElement for rendering
- `config` - Configuration object (see Configuration Options)

#### Methods

##### `transition(sourceImage, targetImage, options)`

Initiates a transition from source to target image.

- Returns: `Promise` that resolves when transition completes
- `sourceImage` - HTMLImageElement
- `targetImage` - HTMLImageElement  
- `options` - Optional config overrides for this transition

##### `start()`

Starts the animation loop.

##### `stop()`

Stops the animation loop.

##### `destroy()`

Cleans up resources and stops animation.

##### `getStats()`

Returns current statistics:

```javascript
{
    mesh: { vertexCount, springCount, activeSpringCount, brokenSpringCount },
    physics: { kineticEnergy, maxSpeed, morphing, morphProgress },
    blobs: number,
    phase: string
}
```

## 🎨 Tips & Best Practices

### Image Preparation

- **Resolution**: 800x600 or similar works well
- **Alpha Channel**: Use transparent PNGs to create interesting effects
- **Contrast**: Higher contrast images create more dramatic transitions

### Performance Tuning

For better performance on slower devices:

```javascript
{
    gridDensity: 1.0,           // Fewer vertices
    blobResolution: 6,          // Coarser blob mesh
    snapBackDuration: 1500      // Faster transition
}
```

For higher quality on powerful devices:

```javascript
{
    gridDensity: 2.0,           // More vertices
    blobResolution: 3,          // Finer blob mesh
    snapBackDuration: 2500      // Smoother transition
}
```

### Creative Effects

- **Thick Jelly**: High `damping` (0.97), low `snapSpeed` (0.15)
- **Bouncy**: Low `damping` (0.90), high `springConstant` (0.5)
- **Chaotic Explosion**: High `explosionIntensity` (200+)
- **Smooth Morph**: Low `explosionIntensity` (60), high `snapSpeed` (0.4)

## 🌐 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (WebGL 1.0)
- **Mobile**: Supported with performance adjustments

Requires WebGL 1.0 support.

## 📄 License

MIT License - feel free to use in your projects.

## 🙏 Credits

Built with:
- WebGL for hardware-accelerated rendering
- Custom elastic mesh physics
- Marching squares algorithm for blob rendering
