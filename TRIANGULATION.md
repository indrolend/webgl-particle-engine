# Triangulation-Based Image Morphing System

## Overview

The triangulation-based image morphing system extends the WebGL particle engine with advanced mesh-based transitions. It uses Delaunay triangulation to create smooth, visually appealing morphs between two images.

## Architecture

### Core Components

1. **DelaunayTriangulator** (`src/triangulation/DelaunayTriangulator.js`)
   - Implements Bowyer-Watson algorithm for Delaunay triangulation
   - Handles degenerate triangle cases
   - Self-contained implementation (no external dependencies)

2. **KeyPointManager** (`src/triangulation/KeyPointManager.js`)
   - Grid-based key point generation (uniform distribution)
   - Feature-based detection using Sobel edge detection
   - Boundary-safe coordinate generation

3. **TriangulationMorph** (`src/triangulation/TriangulationMorph.js`)
   - Core morphing logic with affine transformations
   - Triangle-to-triangle mapping between images
   - Texture coordinate calculations

4. **TriangulationRenderer** (`src/triangulation/TriangulationRenderer.js`)
   - WebGL-based triangle renderer
   - Custom shaders for texture mapping
   - Alpha blending support

5. **HybridEngine** (`src/HybridEngine.js`)
   - Extends ParticleEngine with triangulation support
   - Manages three rendering modes (particles/triangulation/hybrid)
   - Synchronizes transitions between both systems

## Usage

### Basic Example

```javascript
import { HybridEngine } from './src/HybridEngine.js';

const canvas = document.getElementById('canvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    triangulationMode: 'hybrid',
    gridSize: 8,
    keyPointMethod: 'grid'
});

// Load images
const img1 = new Image();
img1.onload = () => {
    engine.initializeFromImage(img1);
    engine.start();
};
img1.src = 'image1.png';

// Transition to second image
const img2 = new Image();
img2.onload = () => {
    engine.transitionToImage(img2, 2000);
};
img2.src = 'image2.png';
```

### Configuration Options

```javascript
const config = {
    // Particle settings (inherited from ParticleEngine)
    particleCount: 2000,
    speed: 1.0,
    
    // Triangulation settings
    enableTriangulation: true,
    triangulationMode: 'hybrid',      // 'particles', 'triangulation', 'hybrid'
    keyPointMethod: 'grid',           // 'grid' or 'feature'
    gridSize: 8,                      // 4-16 recommended
    featurePointCount: 64,            // For feature method
    particleOpacity: 0.5,             // 0-1 for hybrid mode
    triangleOpacity: 0.5              // 0-1 for hybrid mode
};
```

### Key Point Detection Methods

#### Grid Method
- Creates uniform grid of key points
- Predictable, consistent results
- Best for geometric patterns
- Adjustable density via `gridSize` parameter

```javascript
engine.updateTriangulationConfig({
    keyPointMethod: 'grid',
    gridSize: 8  // 8x8 grid
});
```

#### Feature Method
- Detects edges using Sobel operator
- Adapts to image content
- Best for photos with distinct features
- Adjustable point count via `featurePointCount`

```javascript
engine.updateTriangulationConfig({
    keyPointMethod: 'feature',
    featurePointCount: 64
});
```

## Rendering Modes

### 1. Particles Only
Traditional particle-based transitions using the original engine behavior.

```javascript
engine.setRenderMode('particles');
```

### 2. Triangulation Only
Pure mesh-based morphing using triangulated images.

```javascript
engine.setRenderMode('triangulation');
```

### 3. Hybrid Mode
Combines both particle and triangulation effects for rich visual transitions.

```javascript
engine.setRenderMode('hybrid');
```

## Performance Considerations

### Grid Size Impact
- **Low (4x4)**: ~16 points, ~20 triangles - Fast, less detail
- **Medium (8x8)**: ~64 points, ~100 triangles - Balanced
- **High (16x16)**: ~256 points, ~400 triangles - Detailed, slower

### Hybrid Mode Performance
- Uses more GPU resources than single mode
- Adjust opacity values to balance visual impact
- Consider 1000-2000 particles for hybrid rendering

### Optimization Tips
1. Use grid method for better performance
2. Lower grid size for complex scenes
3. Reduce particle count in hybrid mode
4. Monitor FPS and adjust settings accordingly

## Technical Details

### Delaunay Triangulation
The Bowyer-Watson algorithm:
1. Creates super-triangle containing all points
2. Adds points incrementally
3. Removes triangles whose circumcircle contains the new point
4. Creates new triangles from boundary edges
5. Removes super-triangle vertices

### Affine Transformation
For each triangle pair (source → target):
1. Calculate affine transformation matrix
2. Map texture coordinates from source to target
3. Interpolate between transformations during transition

### WebGL Rendering
Vertex shader transforms triangle positions, fragment shader applies textures:
```glsl
// Vertex shader
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform mat3 u_matrix;

// Fragment shader
uniform sampler2D u_texture;
uniform float u_alpha;
```

## Security Considerations

- **Division by Zero**: Handled in circumcircle calculations
- **Boundary Checks**: All texture coordinates stay within valid range
- **Memory Management**: Reusable data structures to prevent leaks
- **Input Validation**: Images validated before processing

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (WebGL 1.0)
- Mobile: Supported (performance may vary)

## Demo

See `triangulation-demo.html` for a complete interactive example with:
- Image upload controls
- Mode switching buttons
- Parameter adjustment sliders
- Real-time performance stats

## API Reference

### HybridEngine Methods

#### `setRenderMode(mode)`
Switch between rendering modes.

#### `updateTriangulationConfig(config)`
Update triangulation settings.

#### `getTriangulationConfig()`
Get current triangulation configuration.

### Inherited from ParticleEngine

- `initializeFromImage(image)`
- `transitionToImage(image, duration)`
- `start()` / `stop()`
- `getFPS()`
- `getParticleCount()`

## Future Enhancements

Potential improvements:
- Adaptive grid sizing based on image complexity
- Multiple key point detection algorithms
- Advanced blending modes
- Mesh optimization for mobile devices
- Texture compression support

## License

MIT License - See LICENSE file for details
