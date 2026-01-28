# Hybrid Particle Transition Feature

## Overview

The WebGL Particle Engine now includes comprehensive **hybrid particle transition** functionality that enables seamless transitions between solid images and particles for dynamic page transitions. This feature combines WebGL particle effects with image rendering to create stunning visual transitions.

## Key Features

### 1. Image-to-Particle Disintegration
- Converts images into dense particle representations
- Gradually disperses particles using velocity and turbulence
- Fades the original image out simultaneously as particles disband
- Configurable duration and intensity

### 2. Particle Dynamics
- Applies velocities, randomness, and turbulence to particle motion for natural effects
- Uses runtime easing functions (`easeInOutCubic`) for smooth animations
- Supports explosion and scatter effects
- Configurable chaos and vacuum strength for recombination

### 3. Particle-to-Image Reconstruction (Reintegration)
- Reverses the disintegration process
- Gradually fades particles in and reassigns them to target positions
- Uses color interpolation to blend particles to match the colors of the new image
- Smooth transition from dispersed particles back to cohesive image

### 4. Unified Transition Logic
- Synchronizes image fades and particle opacity during transitions
- Renders image and particle layers cohesively with dynamic opacity blending
- Multi-phase transition pipeline for professional results

### 5. API Integration
- Simple API call: `engine.startHybridTransition(image1, image2, config)`
- Configuration parameters for all aspects of the transition
- Performance optimization based on device capabilities

## Architecture

### Core Classes

#### `ParticleSystem.js`
Manages particles and their transitions:
- `startDisintegration(duration)` - Dissolve image into particles
- `startReintegration(duration)` - Reverse disintegration (particles → image)
- `extractImageData(image, maxParticles)` - Convert image to particle data
- `easeInOutCubic(t)` - Smooth easing function for natural motion
- Color and position interpolation during transitions

#### `HybridEngine.js`
Orchestrates the complete transition pipeline:
- `startHybridTransition(sourceImage, targetImage, config)` - Main transition method
- `renderHybrid()` - Blends image and particle layers
- Manages transition phases:
  1. Static Display
  2. Disintegration
  3. Explosion
  4. Recombination
  5. Blend
  6. Final Static

#### `HybridPageTransitionAPI.js`
High-level API for easy integration:
- `transitionImages(currentImage, nextImage, options)` - Transition between images
- `transition(currentElement, nextElement, options)` - Transition between DOM elements
- Automatic performance optimization
- WebGL fallback support
- Debug controls

## Usage Examples

### Basic Usage

```javascript
// Import the API
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

// Initialize
const api = new HybridPageTransitionAPI({
    particleCount: 2000,
    autoOptimize: true
});
await api.initialize();

// Transition between two images
await api.transitionImages(image1, image2);
```

### Advanced Configuration

```javascript
await api.transitionImages(image1, image2, {
    // Phase 1: Static Display
    staticDisplayDuration: 500,      // Show source image (ms)
    
    // Phase 2: Disintegration
    disintegrationDuration: 1000,    // Dissolve into particles (ms)
    
    // Phase 3: Explosion
    explosionIntensity: 150,          // Particle scatter strength (50-300)
    explosionTime: 800,               // Explosion duration (ms)
    
    // Phase 4: Recombination
    recombinationDuration: 2000,      // Reassembly duration (ms)
    recombinationChaos: 0.3,          // Chaotic motion (0-1)
    vacuumStrength: 0.15,             // Attraction strength (0-1)
    
    // Phase 5: Blend
    blendDuration: 1500,              // Particle-to-triangulation blend (ms)
    particleFadeRate: 0.7,            // Particle fade rate (0-1)
    
    // Phase 6: Final Static
    finalStaticDuration: 500          // Show final image (ms)
});
```

### Direct Engine Usage

```javascript
import { HybridEngine } from './src/HybridEngine.js';

const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableTriangulation: true
});

engine.startHybridTransition(image1, image2, {
    explosionIntensity: 200,
    recombinationDuration: 2500
});
```

### Reverse Transition (Reintegration)

```javascript
// The ParticleSystem supports reverse transitions
import { ParticleSystem } from './src/ParticleSystem.js';

const particleSystem = new ParticleSystem({ particleCount: 2000 });

// Initialize from an image first (stores initial positions)
particleSystem.initializeFromImage(myImage);

// Start disintegration (particles disperse outward)
particleSystem.startDisintegration(1000);

// Wait for disintegration to complete, then reintegrate
// Reintegration captures current positions and smoothly animates back to initial positions
setTimeout(() => {
    particleSystem.startReintegration(1000);
}, 1500);

// Note: You can call startReintegration at any time after startDisintegration
// It will smoothly animate from the current particle positions back to the original image
```

## Configuration Options

### HybridPageTransitionAPI Constructor

```javascript
{
    // Canvas settings
    canvasId: 'transition-canvas',
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    
    // Performance settings
    autoOptimize: true,           // Auto-adjust based on device
    particleCount: 2000,          // Number of particles
    
    // Transition defaults
    explosionDuration: 800,
    recombinationDuration: 2000,
    explosionIntensity: 150,
    
    // Debug
    debug: false,
    showDebugPanel: false,
    
    // Fallback
    enableFallback: true,
    fallbackDuration: 500
}
```

### Transition Options

All duration values are in milliseconds (ms).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `staticDisplayDuration` | number | 500 | Duration to display source image |
| `disintegrationDuration` | number | 1000 | Duration of image-to-particle disintegration |
| `explosionIntensity` | number | 150 | Strength of particle explosion (50-300) |
| `explosionTime` | number | 800 | Duration of explosion phase |
| `recombinationDuration` | number | 2000 | Duration of particle recombination |
| `recombinationChaos` | number | 0.3 | Amount of chaotic motion (0-1) |
| `vacuumStrength` | number | 0.15 | Strength of vacuum attraction (0-1) |
| `blendDuration` | number | 1500 | Duration of blend phase |
| `particleFadeRate` | number | 0.7 | Rate at which particles fade (0-1) |
| `finalStaticDuration` | number | 500 | Duration to display final image |

## Demos

### Live Examples

1. **hybrid-transition-example.html** - Complete demonstration with documentation
2. **page-transition-demo.html** - Page transition demo
3. **disintegration-demo.html** - Disintegration effect demo
4. **test-hybrid.html** - Testing interface

### Running Demos Locally

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start local server
npm run serve

# Open browser to http://localhost:8000/hybrid-transition-example.html
```

## Performance Optimization

The system includes automatic performance optimization:

- **High-end devices**: 3000-5000 particles, full effects
- **Mid-range devices**: 1500-3000 particles, optimized effects  
- **Low-end devices**: 500-1500 particles, simplified effects
- **No WebGL**: Automatic CSS fallback

Disable auto-optimization:
```javascript
const api = new HybridPageTransitionAPI({
    autoOptimize: false,
    particleCount: 2000  // Manual control
});
```

## Technical Details

### Transition Pipeline

1. **Static Display** (500ms default)
   - Displays source image as solid
   - Prepares particle system

2. **Disintegration** (1000ms default)
   - Image fades out: opacity 1.0 → 0.0
   - Particles fade in: opacity 0.0 → 1.0
   - Particles disperse from image positions

3. **Explosion** (800ms default)
   - Particles scatter in random directions
   - Velocity and turbulence applied
   - Bounded by canvas edges

4. **Recombination** (2000ms default)
   - Vacuum-like attraction to target positions
   - Color interpolation to target colors
   - Chaotic motion for natural feel

5. **Blend** (1500ms default)
   - Particles fade out
   - Triangulation rendering fades in
   - Smooth crossfade

6. **Final Static** (500ms default)
   - Target image displayed as solid
   - Transition complete

### Rendering

The hybrid rendering system combines:
- WebGL particle rendering
- WebGL image rendering with opacity control
- Optional triangulation morphing
- Real-time opacity blending

## Browser Support

- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile browsers with WebGL support
- ⚠️ Automatic CSS fallback for older browsers

## Requirements

- WebGL 1.0 support
- ES6 module support
- html2canvas (for DOM capture, optional)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please submit pull requests or open issues on GitHub.

## Credits

Developed as part of the WebGL Particle Engine project.
