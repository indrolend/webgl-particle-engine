# Ferrofluid-Inspired Particle Dynamics

## Overview

The WebGL Particle Transition Engine now includes ferrofluid-inspired particle dynamics for creating smooth, cohesive, and visually stunning transitions. This enhancement adds blob-like clustering, surface tension effects, and container-based physics to create immersive and fluid page transitions.

## Features

### 1. Ferrofluid Physics

The new `FerrofluidPhysics` class simulates ferrofluid-like behavior for particles:

#### **Particle Cohesion**
- Nearby particles attract each other to form cohesive groups
- Configurable cohesion radius and strength
- Creates natural blob-like clustering during transitions

#### **Surface Tension**
- Particles form smooth, organic shapes
- Strengthens blob formation for more realistic ferrofluid behavior
- Adjustable tension parameter for different visual effects

#### **Attraction/Repulsion**
- Dynamic forces between particles based on distance
- Repulsion at very close distances prevents particle stacking
- Attraction at medium distances maintains cohesive clusters

#### **Performance Optimization**
- Spatial hashing for efficient neighbor detection
- O(n) complexity for large particle counts
- Grid-based cell system for fast queries

### 2. Image Container Physics

The new `ImageContainer` class manages particle boundaries:

#### **Automatic Container Generation**
- Analyzes image alpha channel to find content boundaries
- Creates bounding containers around image edges
- Configurable padding for explosion space

#### **Particle Collision Detection**
- Keeps particles within image container bounds
- Soft edge constraints with bounce effects
- Edge map for precise collision detection

#### **Dynamic Scaling**
- Containers adapt to different image sizes
- Smooth scaling during recombination phase
- Maintains aspect ratios and centering

### 3. Enhanced Transition Phases

#### **Explosion Phase**
- Particles stay within source image container
- Ferrofluid cohesion maintains blob-like groups during explosion
- Natural, organic particle movement

#### **Recombination Phase**
- Target container created from destination image
- Particles scale and adapt to fit new container
- Cohesive blob formation as particles recombine
- Vacuum-like attraction enhanced with ferrofluid physics

## Usage

### Basic Usage

```javascript
import { HybridEngine } from './src/HybridEngine.js';

const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2500,
    enableTriangulation: true
});

// Start transition with ferrofluid features
engine.startHybridTransition(image1, image2, {
    // Enable ferrofluid physics
    enableFerrofluid: true,
    cohesionStrength: 0.05,
    surfaceTension: 0.1,
    
    // Enable container physics
    enableContainer: true,
    containerPadding: 10,
    
    // Standard transition settings
    explosionIntensity: 150,
    recombinationDuration: 2000
});
```

### Advanced Configuration

```javascript
// Custom ferrofluid physics configuration
engine.startHybridTransition(image1, image2, {
    // Ferrofluid settings
    enableFerrofluid: true,
    cohesionStrength: 0.08,      // Higher = stronger attraction
    surfaceTension: 0.15,         // Higher = tighter blobs
    
    // Container settings
    enableContainer: true,
    containerPadding: 20,         // More space for particle movement
    
    // Transition timing
    staticDisplayDuration: 500,
    disintegrationDuration: 1000,
    explosionIntensity: 200,
    explosionTime: 800,
    recombinationDuration: 2500,
    recombinationChaos: 0.3,
    vacuumStrength: 0.15,
    blendDuration: 1500
});
```

## Configuration Parameters

### Ferrofluid Physics

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableFerrofluid` | boolean | true | Enable ferrofluid physics |
| `cohesionStrength` | number | 0.05 | Strength of particle cohesion (0-0.2) |
| `surfaceTension` | number | 0.1 | Surface tension for blob formation (0-0.3) |
| `cohesionRadius` | number | 30 | Distance for cohesion effect (pixels) |
| `attractionStrength` | number | 0.2 | Attraction force between particles |
| `repulsionDistance` | number | 5 | Min distance before repulsion |
| `repulsionStrength` | number | 0.3 | Repulsion force strength |

### Container Physics

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableContainer` | boolean | true | Enable container physics |
| `containerPadding` | number | 10 | Padding around image bounds (pixels) |
| `bounceStrength` | number | 0.3 | Bounce velocity multiplier |
| `edgeSoftness` | number | 8 | Soft edge distance (pixels) |
| `alphaThreshold` | number | 0.1 | Min alpha for edge detection |

## Demos

### Live Demo

Visit `ferrofluid-demo.html` for an interactive demonstration with real-time controls:
- Adjust cohesion and surface tension
- Control explosion and recombination parameters
- Toggle ferrofluid and container features on/off
- Test with your own images

### Running the Demo

```bash
# Build project
npm run build

# Start local server
npm run serve

# Open browser
open http://localhost:8000/ferrofluid-demo.html
```

## Technical Details

### Ferrofluid Physics Implementation

The ferrofluid physics system uses spatial hashing for performance:

1. **Spatial Hash Grid**: Divides canvas into cells for fast neighbor queries
2. **Cohesion Forces**: Calculates center of mass for nearby particles
3. **Attraction/Repulsion**: Distance-based forces for natural movement
4. **Surface Tension**: Additional forces to strengthen blob formation

### Container System Implementation

The container system analyzes image alpha channels:

1. **Boundary Detection**: Scans image pixels to find content edges
2. **Padding Application**: Adds configurable space around boundaries
3. **Edge Map Generation**: Creates grid for precise collision detection
4. **Constraint Application**: Soft edges with bounce effects

### Performance Considerations

- **Spatial Hashing**: O(n) neighbor detection vs O(n²) brute force
- **Cell Size**: Adjustable for different particle densities
- **Optional Disabling**: Features can be disabled for performance
- **Efficient Updates**: Only active particles are processed

## Browser Support

- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile browsers with WebGL support

## Examples

### Smooth Blob Transitions

```javascript
engine.startHybridTransition(image1, image2, {
    enableFerrofluid: true,
    cohesionStrength: 0.1,
    surfaceTension: 0.2,
    explosionIntensity: 100,
    recombinationDuration: 3000
});
```

### Explosive Scattered Transitions

```javascript
engine.startHybridTransition(image1, image2, {
    enableFerrofluid: false,
    explosionIntensity: 250,
    recombinationDuration: 2000,
    recombinationChaos: 0.5
});
```

### Contained Organic Movement

```javascript
engine.startHybridTransition(image1, image2, {
    enableFerrofluid: true,
    enableContainer: true,
    cohesionStrength: 0.08,
    containerPadding: 15,
    explosionIntensity: 150
});
```

## Troubleshooting

### Particles Don't Cluster

**Issue**: Particles move independently without cohesion

**Solutions**:
- Increase `cohesionStrength` (try 0.1-0.15)
- Increase `surfaceTension` (try 0.15-0.2)
- Ensure `enableFerrofluid` is true

### Particles Escape Container

**Issue**: Particles move outside expected boundaries

**Solutions**:
- Enable container physics: `enableContainer: true`
- Increase `containerPadding` for more space
- Adjust `bounceStrength` for stronger containment

### Performance Issues

**Issue**: Transition is slow or choppy

**Solutions**:
- Reduce particle count
- Disable ferrofluid physics: `enableFerrofluid: false`
- Increase spatial hash `cellSize` (default: 50)
- Disable container physics if not needed

## API Reference

See `src/physics/FerrofluidPhysics.js` and `src/physics/ImageContainer.js` for detailed API documentation.

## Credits

Developed as an enhancement to the WebGL Particle Engine project, inspired by ferrofluid dynamics and magnetic field interactions.

## License

MIT License - See LICENSE file for details.
