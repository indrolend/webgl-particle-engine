# WebGL Hybrid Blob Mesh Transition Engine - API Reference

## Overview

The WebGL Hybrid Blob Mesh Transition Engine provides a developer-friendly API for creating stunning animated transitions between images and web pages using organic blob mesh rendering, elastic mesh physics, and WebGL-accelerated physics with metaball algorithms.

## Quick Start

### Elastic Mesh Transitions (NEW!)

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance with elastic mesh
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableMesh: true,
    triangulationMode: 'mesh',  // Use elastic mesh mode
    
    // Mesh physics parameters
    meshGridDensity: 1.5,          // Vertices per 100px
    meshSpringConstant: 0.3,       // Spring stiffness (0-1)
    meshDamping: 0.95,             // Velocity damping (0-1)
    meshBreakThreshold: 300,       // Distance for spring breaking
    meshAlphaThreshold: 0.5,       // Alpha threshold for connections (0-1)
    meshExplosionStrength: 100,    // Default explosion force
    
    // Debug visualization
    showMesh: false,               // Show mesh lines
    showVertices: false            // Show vertices
});

// Load source image
await engine.setImage(sourceImage);
engine.start();

// Trigger elastic mesh transition
await engine.hybridTransition(sourceImage, targetImage, {
    mode: 'mesh',
    explosionIntensity: 150,
    staticDisplayDuration: 500,
    explosionTime: 800,
    settleDuration: 1000,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

### Blob Mesh Rendering

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance with blob rendering
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableBlobRendering: true,
    triangulationMode: 'blob',  // Use blob mesh mode
    
    // Blob physics parameters
    blobInfluenceRadius: 80,
    surfaceTension: 0.5,
    cohesionStrength: 0.3,
    elasticity: 0.7,
    mitosisFactor: 0.5
});

// Load and display source image
await engine.setImage(sourceImage);
engine.start();

// Trigger blob transition with mitosis effect
await engine.startHybridTransition(sourceImage, targetImage, {
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

### Traditional Particle Rendering

```javascript
import { HybridEngine } from './src/HybridEngine.js';

// Create engine instance
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableTriangulation: true
});

// Load and display source image
await engine.setImage(sourceImage);
engine.start();

// Trigger transition to target image
await engine.startHybridTransition(sourceImage, targetImage, {
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

## Core APIs

### HybridEngine

The main engine class for blob mesh and particle-based transitions.

#### Constructor

```javascript
new HybridEngine(canvas, config)
```

**Parameters:**
- `canvas` (HTMLCanvasElement): Canvas element for rendering
- `config` (Object): Configuration options
  - `particleCount` (number): Number of particles (default: 2000)
  - `speed` (number): Animation speed multiplier (default: 1.0)
  - `enableTriangulation` (boolean): Enable triangulation rendering (default: true)
  - `triangulationMode` (string): 'particles', 'blob', 'triangulation', 'hybrid', or 'mesh' (default: 'hybrid')
  - `gridSize` (number): Triangulation grid density (default: 8)
  
  **Blob-Specific Options:**
  - `enableBlobRendering` (boolean): Enable blob mesh rendering (default: true)
  - `blobInfluenceRadius` (number): Particle influence radius for metaball (default: 80)
  - `surfaceTension` (number): Surface tension strength 0-1 (default: 0.5)
  - `cohesionStrength` (number): Blob cohesion force 0-1 (default: 0.3)
  - `elasticity` (number): Bounce/recovery factor 0-1 (default: 0.7)
  - `mitosisFactor` (number): Blob splitting tendency 0-1 (default: 0.5)
  - `splitThreshold` (number): Distance for blob mitosis (default: 150)
  - `mergeThreshold` (number): Distance for blob merging (default: 80)
  - `blobResolution` (number): Grid resolution for marching squares (default: 4)
  - `blobFillOpacity` (number): Blob interior opacity 0-1 (default: 0.85)
  
  **Elastic Mesh Options (NEW!):**
  - `enableMesh` (boolean): Enable elastic mesh system (default: false, auto-enabled for mode='mesh')
  - `meshGridDensity` (number): Mesh grid density - vertices per 100px (default: 1.5)
  - `meshSpringConstant` (number): Spring stiffness 0-1 (default: 0.3)
  - `meshDamping` (number): Velocity damping 0-1 (default: 0.95)
  - `meshBreakThreshold` (number): Distance for spring breaking (default: 300)
  - `meshAlphaThreshold` (number): Alpha threshold for connections 0-1 (default: 0.5)
  - `meshExplosionStrength` (number): Default explosion force (default: 100)
  - `showMesh` (boolean): Show mesh lines for debugging (default: false)
  - `showVertices` (boolean): Show vertices for debugging (default: false)

**Example:**
```javascript
// Blob mesh configuration
const engine = new HybridEngine(canvas, {
    particleCount: 3000,
    speed: 1.2,
    enableBlobRendering: true,
    triangulationMode: 'blob',
    blobInfluenceRadius: 100,
    surfaceTension: 0.6,
    mitosisFactor: 0.7
});

// Elastic mesh configuration
const meshEngine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableMesh: true,
    triangulationMode: 'mesh',
    meshGridDensity: 2.0,
    meshSpringConstant: 0.4,
    meshDamping: 0.97,
    meshBreakThreshold: 250,
    meshAlphaThreshold: 0.6,
    showMesh: true,  // Debug: show spring connections
    showVertices: true  // Debug: show mesh vertices
});
```

#### Methods

##### `setImage(image)`

Load an image into the engine.

**Parameters:**
- `image` (HTMLImageElement): Source image to load

**Returns:** Promise<void>

**Example:**
```javascript
const img = new Image();
img.src = 'image1.jpg';
await img.decode();
await engine.setImage(img);
```

##### `start()`

Start the render loop.

**Example:**
```javascript
engine.start();
```

##### `stop()`

Stop the render loop.

**Example:**
```javascript
engine.stop();
```

##### `setRenderMode(mode)`

Set the rendering mode for the engine.

**Parameters:**
- `mode` (string): 'particles', 'blob', 'triangulation', 'hybrid', or 'mesh'

**Example:**
```javascript
// Switch to elastic mesh mode
engine.setRenderMode('mesh');

// Switch to blob mesh mode
engine.setRenderMode('blob');

// Switch to particle mode
engine.setRenderMode('particles');
```

##### `hybridTransition(source, target, options)`

Main API method for hybrid transitions with support for multiple modes.

**Parameters:**
- `source` (HTMLImageElement): Source image
- `target` (HTMLImageElement): Target image
- `options` (Object): Transition options
  - `mode` (string): Transition mode - 'particles', 'blob', 'triangulation', 'mesh', or 'hybrid' (default: current mode)
  - `explosionIntensity` (number): Explosion strength (50-300, default: 150)
  - `staticDisplayDuration` (number): Initial static display (ms, default: 500)
  - `explosionTime` (number): Explosion phase duration (ms, default: 800)
  - `settleDuration` (number): Settling phase after explosion (ms, default: 1000, mesh only)
  - `recombinationDuration` (number): Recombination phase duration (ms, default: 2500)
  - `blendDuration` (number): Final blend duration (ms, default: 2000)
  - `meshConfig` (Object): Mesh-specific configuration
    - `gridDensity` (number): Vertices per 100px (0.5-3.0, default: 1.5)
    - `springConstant` (number): Spring stiffness (0.1-1.0, default: 0.3)
    - `damping` (number): Velocity damping (0.8-0.99, default: 0.95)
    - `breakThreshold` (number): Spring break distance (100-500, default: 300)
    - `alphaThreshold` (number): Alpha threshold for connections (0-1, default: 0.5)
    - `showMesh` (boolean): Show mesh lines for debug (default: false)
    - `showVertices` (boolean): Show vertices for debug (default: false)

**Returns:** Promise<void> - Resolves when transition completes

**Example:**
```javascript
// Elastic mesh transition with custom parameters
await engine.hybridTransition(image1, image2, {
    mode: 'mesh',
    explosionIntensity: 200,
    staticDisplayDuration: 800,
    explosionTime: 1000,
    settleDuration: 1200,
    recombinationDuration: 3000,
    blendDuration: 2500,
    meshConfig: {
        gridDensity: 2.0,
        springConstant: 0.4,
        damping: 0.97,
        breakThreshold: 250,
        alphaThreshold: 0.6,
        showMesh: true,  // Enable debug visualization
        showVertices: true
    }
});

// Blob transition
await engine.hybridTransition(image1, image2, {
    mode: 'blob',
    explosionIntensity: 150,
    recombinationDuration: 2500,
    blendDuration: 2000
});
```

##### `startHybridTransition(sourceImage, targetImage, config)`

Legacy method for hybrid transitions (particles/triangulation modes).

**Parameters:**
- `mode` (string): Rendering mode - 'particles', 'blob', 'triangulation', or 'hybrid'

**Example:**
```javascript
// Switch to blob mesh rendering
engine.setRenderMode('blob');

// Switch to particle rendering
engine.setRenderMode('particles');

// Switch to hybrid mode (particles + triangulation)
engine.setRenderMode('hybrid');
```

**Rendering Modes:**
- `'particles'`: Individual particle points
- `'blob'`: Organic blob mesh with metaball rendering
- `'triangulation'`: Mesh morphing with Delaunay triangulation
- `'hybrid'`: Combined particles and triangulation

##### `startHybridTransition(sourceImage, targetImage, config)`

Execute a multi-phase hybrid transition.

**Parameters:**
- `sourceImage` (HTMLImageElement): Starting image
- `targetImage` (HTMLImageElement): Target image
- `config` (Object): Transition configuration
  - `staticDisplayDuration` (number): Initial display time (ms) - default: 500
  - `disintegrationDuration` (number): Particle emergence time (ms) - default: 1000
  - `explosionTime` (number): Explosion phase duration (ms) - default: 800
  - `explosionIntensity` (number): Explosion force (50-300) - default: 150
  - `recombinationDuration` (number): Recombination time (ms) - default: 2500
  - `recombinationChaos` (number): Chaos factor (0-1) - default: 0.3
  - `vacuumStrength` (number): Pull strength (0.05-0.5) - default: 0.15
  - `blendDuration` (number): Final blend time (ms) - default: 2000
  - `finalStaticDuration` (number): Final display time (ms) - default: 500

**Returns:** Promise<void>

**Example:**
```javascript
await engine.startHybridTransition(img1, img2, {
    explosionIntensity: 200,
    recombinationDuration: 3000,
    recombinationChaos: 0.4,
    vacuumStrength: 0.2,
    blendDuration: 2500
});
```

### HybridPageTransitionAPI

High-level API for page transitions with DOM capture.

#### Constructor

```javascript
new HybridPageTransitionAPI(config)
```

**Parameters:**
- `config` (Object): Configuration options
  - `canvasId` (string): Canvas element ID (default: 'transition-canvas')
  - `canvasWidth` (number): Canvas width (default: window.innerWidth)
  - `canvasHeight` (number): Canvas height (default: window.innerHeight)
  - `autoOptimize` (boolean): Auto-optimize for device (default: true)
  - `particleCount` (number): Number of particles (default: 2000)
  - `explosionDuration` (number): Explosion duration (ms) (default: 800)
  - `recombinationDuration` (number): Recombination duration (ms) (default: 2000)
  - `explosionIntensity` (number): Explosion force (default: 150)
  - `showDebugPanel` (boolean): Show debug controls (default: false)
  - `enableFallback` (boolean): Enable CSS fallback (default: true)

**Example:**
```javascript
const api = new HybridPageTransitionAPI({
    autoOptimize: true,
    particleCount: 2500,
    showDebugPanel: true
});
```

#### Methods

##### `initialize()`

Initialize the API and create the canvas.

**Returns:** Promise<void>

**Example:**
```javascript
await api.initialize();
```

##### `transition(currentElement, nextElement, options)`

Transition between page elements using DOM capture.

**Parameters:**
- `currentElement` (HTMLElement|string): Current page element or CSS selector
- `nextElement` (HTMLElement|string): Next page element or CSS selector
- `options` (Object): Transition options (same as HybridEngine.startHybridTransition)

**Returns:** Promise<void>

**Example:**
```javascript
await api.transition('#page1', '#page2', {
    explosionIntensity: 175,
    recombinationDuration: 2800
});
```

##### `transitionImages(currentImage, nextImage, options)`

Transition between pre-rendered images.

**Parameters:**
- `currentImage` (HTMLImageElement|HTMLCanvasElement): Current image
- `nextImage` (HTMLImageElement|HTMLCanvasElement): Next image
- `options` (Object): Transition options (same as HybridEngine.startHybridTransition)

**Returns:** Promise<void>

**Example:**
```javascript
await api.transitionImages(canvas1, canvas2, {
    explosionTime: 1000,
    blendDuration: 2200
});
```

##### `updateConfig(config)`

Update API configuration dynamically.

**Parameters:**
- `config` (Object): Configuration updates

**Example:**
```javascript
api.updateConfig({
    particleCount: 3000,
    explosionIntensity: 200
});
```

##### `getPerformanceInfo()`

Get device performance information.

**Returns:** Object with performance data

**Example:**
```javascript
const perf = api.getPerformanceInfo();
console.log('Performance level:', perf.level); // 'high', 'medium', or 'low'
console.log('Recommended particles:', perf.profile.particleCount);
```

## Transition Parameters

### Unified Control Mapping

The API uses unified parameter names that map to physics behaviors:

| UI Control | API Parameter | Description | Range |
|------------|---------------|-------------|-------|
| **Explosion Weight** | `explosionIntensity` | Controls explosion force and particle spread | 50-300 |
| **Recombination Weight** | `recombinationDuration` | Duration of particle gathering phase | 1000-4000ms |
| **Blend Weight** | `blendDuration` | Duration of final blend transition | 500-3000ms |
| **Liquid Thickness** | `recombinationChaos` | Adds organic, fluid-like chaos to movement | 0-1 |
| **Watercolor Intensity** | `vacuumStrength` | Vacuum force pulling particles to targets | 0.05-0.5 |
| **Total Duration** | (calculated) | Sum of all phase durations | 3000-12000ms |
| **Particle Density** | `particleCount` | Number of particles in the system | 500-5000 |

### Phase Breakdown

A complete hybrid transition consists of 6 phases:

1. **Static Display** (`staticDisplayDuration`): Show source image
2. **Disintegration** (`disintegrationDuration`): Image dissolves into particles
3. **Explosion** (`explosionTime` + `explosionIntensity`): Particles scatter
4. **Recombination** (`recombinationDuration` + `recombinationChaos` + `vacuumStrength`): Particles gather to form target
5. **Blend** (`blendDuration`): Transition from particles to solid image
6. **Final Static** (`finalStaticDuration`): Show target image

## Performance Optimization

### Automatic Optimization

When `autoOptimize: true`, the API automatically adjusts settings based on device capabilities:

```javascript
const api = new HybridPageTransitionAPI({
    autoOptimize: true  // Recommended for production
});
```

**Performance Profiles:**

- **High-end** (8+ cores, 8+ GB RAM):
  - Particles: 3000
  - Canvas Scale: 1.0
  - Explosion Intensity: 200

- **Mid-range** (4+ cores, 4+ GB RAM):
  - Particles: 2000
  - Canvas Scale: 0.8
  - Explosion Intensity: 150

- **Low-end** (Budget hardware):
  - Particles: 1000
  - Canvas Scale: 0.6
  - Explosion Intensity: 100

### Manual Optimization

```javascript
// Check device performance
const perf = api.getPerformanceInfo();

if (perf.level === 'low') {
    api.updateConfig({
        particleCount: 800,
        explosionIntensity: 80
    });
}
```

## Integration Examples

### Single Page Application (SPA)

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

class Router {
    constructor() {
        this.transitionAPI = new HybridPageTransitionAPI({
            autoOptimize: true
        });
        await this.transitionAPI.initialize();
    }
    
    async navigate(from, to) {
        await this.transitionAPI.transition(
            `#page-${from}`,
            `#page-${to}`
        );
    }
}
```

### Image Gallery

```javascript
import { HybridEngine } from './src/HybridEngine.js';

class Gallery {
    constructor(canvas, images) {
        this.engine = new HybridEngine(canvas);
        this.images = images;
        this.currentIndex = 0;
    }
    
    async next() {
        const current = this.images[this.currentIndex];
        const next = this.images[(this.currentIndex + 1) % this.images.length];
        
        await this.engine.startHybridTransition(current, next, {
            explosionIntensity: 120,
            recombinationDuration: 2000
        });
        
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
}
```

### React Integration

```jsx
import { useEffect, useRef } from 'react';
import { HybridEngine } from './src/HybridEngine.js';

function TransitionCanvas({ sourceImage, targetImage, onComplete }) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    
    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            engineRef.current = new HybridEngine(canvasRef.current);
        }
    }, []);
    
    useEffect(() => {
        if (engineRef.current && sourceImage && targetImage) {
            engineRef.current.startHybridTransition(
                sourceImage,
                targetImage
            ).then(onComplete);
        }
    }, [sourceImage, targetImage]);
    
    return <canvas ref={canvasRef} width={800} height={600} />;
}
```

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (WebGL 1.0)
- **Mobile browsers**: Supported with automatic performance adjustments

## Troubleshooting

### Issue: Slow Performance on Mobile

**Solution:** Enable auto-optimization or manually reduce particle count:

```javascript
const api = new HybridPageTransitionAPI({
    autoOptimize: true,
    particleCount: 1000  // Lower for mobile
});
```

### Issue: WebGL Context Lost

**Solution:** The API handles this automatically, but you can reinitialize:

```javascript
api.destroy();
api = new HybridPageTransitionAPI(config);
await api.initialize();
```

### Issue: Images Not Loading

**Solution:** Ensure images are CORS-enabled and fully loaded:

```javascript
const img = new Image();
img.crossOrigin = 'anonymous';
img.src = 'image.jpg';
await img.decode();
await engine.setImage(img);
```

## License

MIT License - Free for commercial and personal use.
