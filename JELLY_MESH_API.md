# Jelly Mesh Hybrid Transition API

## Overview

The Jelly Mesh Hybrid Transition feature provides perimeter-accurate mesh transitions between images using physics-based "jelly" dynamics. This system extracts image perimeters, creates triangulated meshes, and applies spring-mass physics for organic, visually immersive transitions.

## Architecture

### Core Modules

#### 1. JellyMesh (`src/hybrid/JellyMesh.js`)
Handles mesh extraction from images using the alpha channel.

**Features:**
- Perimeter extraction using marching squares algorithm
- Adaptive point sampling (configurable min/max vertex count)
- Interior triangulation with ear clipping
- UV coordinate generation for texture mapping
- Result caching for performance

**Configuration:**
```javascript
{
  minVertexCount: 20,        // Minimum vertices for mesh
  maxVertexCount: 200,       // Maximum vertices for mesh
  detailLevel: 0.5,          // 0-1, controls point density
  alphaThreshold: 128,       // 0-255, alpha threshold for perimeter
  simplifyTolerance: 2.0,    // Douglas-Peucker simplification tolerance
  enableUVs: true            // Generate UV coordinates
}
```

#### 2. JellyPhysics (`src/hybrid/JellyPhysics.js`)
Implements spring-mass simulation for jelly-like behavior.

**Features:**
- Spring connections between perimeter vertices
- Impulse/explosion from centroid
- Edge breaking based on tension threshold
- Automatic piece rejoining
- Fade-out for distant/timeout pieces

**Configuration:**
```javascript
{
  springStiffness: 0.5,           // 0-1, spring strength
  springDamping: 0.95,            // Velocity damping
  bodyType: 'soft',               // 'soft' or 'stiff'
  explosionStrength: 100,         // Explosion force
  enableEdgeBreaking: true,       // Allow edge breaking
  breakTensionThreshold: 2.5,     // Multiple of rest length
  breakProbability: 0.3,          // 0-1, chance of breaking
  enableRejoin: true,             // Allow piece rejoining
  rejoinDistance: 20,             // Distance for rejoin
  rejoinTimeout: 3000,            // ms, timeout before fade
  fadeDistance: 200,              // Distance threshold for fade
  fadeTimeout: 5000               // ms, timeout before removal
}
```

#### 3. HybridTransition (`src/hybrid/HybridTransition.js`)
Orchestrates the complete transition state machine.

**Phases:**
1. **Expansion**: Mesh explodes outward from centroid
2. **Contraction**: Mesh contracts back with cohesion forces
3. **Morph**: Vertices morph to target image positions

**Configuration:**
```javascript
{
  expansionDuration: 800,         // ms, explosion phase
  contractionDuration: 1200,      // ms, contraction phase
  morphDuration: 1000,            // ms, morphing phase
  explosionIntensity: 100,        // Explosion strength
  edgeBreakChance: 0.3,           // 0-1, probability of breaks
  enableAdaptiveDetail: true,     // Auto-adjust detail for FPS
  targetFPS: 30,                  // Target FPS for adaptation
  minDetailLevel: 0.3,            // Minimum detail when adapting
  maxDetailLevel: 1.0             // Maximum detail level
}
```

#### 4. HybridDebugPanel (`src/debug/HybridDebugPanel.js`)
Real-time debug UI for controlling transitions.

**Features:**
- Live FPS and mesh statistics
- Adjustable mesh detail slider
- Explosion intensity control
- Edge break chance slider
- Spring stiffness control
- Vertex count range controls
- Preset configurations (Default, Soft, Stiff, Explosive, Gentle)
- Manual trigger and reset buttons

## API Usage

### Basic Integration

```javascript
import { HybridEngine } from './src/HybridEngine.js';
import { HybridDebugPanel } from './src/debug/HybridDebugPanel.js';

// Create engine with jelly mesh enabled
const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableJellyMesh: true,
    triangulationMode: 'jelly'
});

// Start engine
engine.start();

// Load images
const image1 = new Image();
image1.onload = () => {
    const image2 = new Image();
    image2.onload = () => {
        // Start jelly mesh transition
        engine.hybridTransition(image1, image2, {
            explosionIntensity: 100,
            edgeBreakChance: 0.3,
            expansionDuration: 800,
            contractionDuration: 1200,
            morphDuration: 1000
        });
    };
    image2.src = 'image2.png';
};
image1.src = 'image1.png';
```

### With Debug Panel

```javascript
// Create debug panel
const debugPanel = new HybridDebugPanel();

// Set up callbacks
debugPanel.on('meshDetail', (value) => {
    engine.updateJellyMeshConfig({ detailLevel: value });
});

debugPanel.on('explosionIntensity', (value) => {
    engine.updateJellyMeshConfig({ explosionIntensity: value });
});

debugPanel.on('edgeBreakChance', (value) => {
    engine.updateJellyMeshConfig({ edgeBreakChance: value });
});

debugPanel.on('triggerTransition', () => {
    engine.hybridTransition(image1, image2);
});

debugPanel.on('reset', () => {
    engine.jellyTransition.reset();
});

// Update stats periodically
setInterval(() => {
    const state = engine.getJellyMeshState();
    if (state) {
        debugPanel.updateStats({
            fps: state.fps,
            vertices: state.meshStats.totalSprings,
            triangles: 0,
            brokenEdges: state.meshStats.brokenEdges,
            pieces: state.meshStats.pieces,
            detailLevel: state.detailLevel
        });
    }
}, 100);
```

### Advanced Configuration

```javascript
// Custom jelly mesh configuration
engine.updateJellyMeshConfig({
    // Mesh detail
    minVertexCount: 30,
    maxVertexCount: 250,
    detailLevel: 0.8,
    
    // Physics
    springStiffness: 0.6,
    breakTensionThreshold: 3.0,
    breakProbability: 0.4,
    
    // Transition timing
    expansionDuration: 1000,
    contractionDuration: 1500,
    morphDuration: 1200,
    
    // Effects
    explosionIntensity: 150,
    edgeBreakChance: 0.5
});

// Get current state
const state = engine.getJellyMeshState();
console.log('Current phase:', state.state);
console.log('FPS:', state.fps);
console.log('Mesh stats:', state.meshStats);
```

## Presets

The debug panel includes several presets for different effects:

### Default
Balanced settings for general use.
```javascript
{
    meshDetail: 50%,
    explosionIntensity: 100,
    edgeBreakChance: 30%,
    springStiffness: 50%,
    minVertices: 20,
    maxVertices: 200
}
```

### Soft Body
Gentle, elastic transitions.
```javascript
{
    meshDetail: 60%,
    explosionIntensity: 80,
    edgeBreakChance: 40%,
    springStiffness: 30%,
    minVertices: 20,
    maxVertices: 150
}
```

### Stiff Body
Rigid, controlled transitions.
```javascript
{
    meshDetail: 70%,
    explosionIntensity: 120,
    edgeBreakChance: 20%,
    springStiffness: 80%,
    minVertices: 30,
    maxVertices: 250
}
```

### Explosive
Dramatic, high-energy transitions.
```javascript
{
    meshDetail: 40%,
    explosionIntensity: 250,
    edgeBreakChance: 60%,
    springStiffness: 40%,
    minVertices: 15,
    maxVertices: 120
}
```

### Gentle
Smooth, subtle transitions.
```javascript
{
    meshDetail: 80%,
    explosionIntensity: 50,
    edgeBreakChance: 10%,
    springStiffness: 60%,
    minVertices: 30,
    maxVertices: 300
}
```

## Performance Optimization

### Adaptive Detail
The system automatically reduces mesh detail when FPS drops below the target:

```javascript
{
    enableAdaptiveDetail: true,
    targetFPS: 30,
    minDetailLevel: 0.3,    // Won't go below 30% detail
    maxDetailLevel: 1.0     // Starts at 100% detail
}
```

### Mesh Caching
Extracted meshes are automatically cached by image reference:

```javascript
const mesh = jellyMesh.extractMesh(image, 'unique-cache-key');

// Clear cache when needed
jellyMesh.clearCache();

// Get cache stats
const stats = jellyMesh.getCacheStats();
console.log('Cached meshes:', stats.size);
```

## Events and Callbacks

The debug panel supports various event callbacks:

```javascript
debugPanel.on('meshDetail', (value) => { /* 0-1 */ });
debugPanel.on('explosionIntensity', (value) => { /* 20-300 */ });
debugPanel.on('edgeBreakChance', (value) => { /* 0-1 */ });
debugPanel.on('springStiffness', (value) => { /* 0-1 */ });
debugPanel.on('minVertexCount', (value) => { /* 10-100 */ });
debugPanel.on('maxVertexCount', (value) => { /* 50-500 */ });
debugPanel.on('triggerTransition', () => { /* Manual trigger */ });
debugPanel.on('reset', () => { /* Reset engine */ });
debugPanel.on('updateStats', () => { /* Update display */ });
```

## Troubleshooting

### Mesh Not Extracted
- Ensure images have alpha channel transparency
- Check `alphaThreshold` setting (default: 128)
- Verify image is fully loaded before extraction

### Poor Performance
- Enable `enableAdaptiveDetail` for automatic optimization
- Reduce `maxVertexCount` for simpler meshes
- Lower `detailLevel` manually
- Reduce spring count by simplifying perimeter

### Edge Breaking Not Working
- Ensure `enableEdgeBreaking` is true
- Increase `breakProbability` (0-1)
- Lower `breakTensionThreshold` for easier breaking
- Increase `explosionIntensity` to create more tension

### Pieces Not Rejoining
- Ensure `enableRejoin` is true
- Increase `rejoinDistance` threshold
- Check `rejoinTimeout` isn't too short
- Verify contraction forces are strong enough

## Example: Complete Implementation

```javascript
// HTML
<canvas id="transition-canvas" width="800" height="600"></canvas>

// JavaScript
import { HybridEngine } from './src/HybridEngine.js';
import { HybridDebugPanel } from './src/debug/HybridDebugPanel.js';

class JellyTransitionApp {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = null;
        this.debugPanel = null;
        this.images = [];
        
        this.init();
    }
    
    async init() {
        // Initialize engine
        this.engine = new HybridEngine(this.canvas, {
            particleCount: 2000,
            enableJellyMesh: true,
            triangulationMode: 'jelly'
        });
        
        // Initialize debug panel
        this.debugPanel = new HybridDebugPanel();
        this.setupDebugCallbacks();
        
        // Load images
        await this.loadImages(['image1.png', 'image2.png']);
        
        // Start engine
        this.engine.start();
    }
    
    setupDebugCallbacks() {
        this.debugPanel.on('meshDetail', (v) => 
            this.engine.updateJellyMeshConfig({ detailLevel: v }));
        
        this.debugPanel.on('explosionIntensity', (v) => 
            this.engine.updateJellyMeshConfig({ explosionIntensity: v }));
        
        this.debugPanel.on('triggerTransition', () => 
            this.startTransition());
        
        this.debugPanel.on('reset', () => 
            this.engine.jellyTransition.reset());
    }
    
    async loadImages(urls) {
        this.images = await Promise.all(
            urls.map(url => this.loadImage(url))
        );
    }
    
    loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = url;
        });
    }
    
    startTransition() {
        if (this.images.length >= 2) {
            this.engine.hybridTransition(
                this.images[0],
                this.images[1],
                {
                    explosionIntensity: 100,
                    edgeBreakChance: 0.3
                }
            );
        }
    }
}

// Initialize app
const app = new JellyTransitionApp('transition-canvas');
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support for hardware acceleration.

## License

MIT
