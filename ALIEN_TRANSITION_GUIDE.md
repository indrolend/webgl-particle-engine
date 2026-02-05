# Alien Transition System - Implementation Guide

## Overview

The Alien Transition system is a unified, liquid-like image morphing effect that combines mesh, blob, and particle rendering with advanced physics and visual effects. It's designed to create smooth, organic, alien-like transitions between images while preserving their recognizability.

## Key Features

### 1. Opacity-Based Masking
Only creates mesh vertices and particles for image regions above a configurable opacity threshold. This is perfect for:
- Text logos with transparency
- Icons and symbols with sharp edges
- Any image with meaningful alpha channels

```javascript
await engine.alienTransition(sourceImage, targetImage, {
    opacityThreshold: 0.3  // Only render particles where alpha > 30%
});
```

### 2. Five-Phase Transition System

The transition follows a carefully choreographed sequence:

1. **Static Display** (500ms default)
   - Shows source image briefly
   - Prepares particles with opacity masking

2. **Disintegrate** (1200ms default)
   - Particles emerge from opaque regions
   - Directional or random explosion
   - Maintains particle alpha based on source

3. **Alien Morph** (2000ms default)
   - Liquid-like wave motion
   - Organic rotation effects
   - Viscosity-based damping

4. **Reform** (1800ms default)
   - Particles snap back to target positions
   - Ghost outline rendering active
   - Vacuum pull with chaos factors

5. **Blend** (1500ms default)
   - Smooth crossfade to target image
   - Ghost outline fades out
   - Final color convergence

### 3. Enhanced Mesh Physics

Constraints prevent common artifacts:

```javascript
await engine.alienTransition(sourceImage, targetImage, {
    meshSpringLimit: 2.5,        // Max stretch before constraint kicks in
    meshAngleLimit: 45,          // Max angle deviation in degrees
    meshRestoringForce: 0.4      // Strength of restoration
});
```

**Benefits:**
- No sharp spikes during deformation
- No mesh folding or inversion
- Smooth elastic behavior
- Organic sloshing motion

### 4. Ghost Outline Rendering

During the reform phase, a faint outline of the source image renders beneath particles and mesh:

```javascript
await engine.alienTransition(sourceImage, targetImage, {
    ghostOutlineOpacity: 0.3,    // Visibility of ghost outline
    ghostFadeStart: 0.6          // When to start fading (0-1 of reform)
});
```

**Purpose:**
- Preserves image recognizability during morph
- Provides visual continuity
- Fades out as particles reform
- Helps viewer track transformation

### 5. Alpha-Aware Blob Sizing

Blobs and particles scale proportionally with local image alpha:

```javascript
await engine.alienTransition(sourceImage, targetImage, {
    blobSizeScale: 0.7,          // Scale factor for alpha-based sizing
    blobMinAlpha: 0.2,           // Minimum alpha for blob rendering
    preventBlackout: true        // Enable proportional sizing
});
```

**Benefits:**
- No oversized blobs obscuring the shape
- No particle blackout
- Better outline preservation
- More readable transitions

## Usage Examples

### Basic Alien Transition

```javascript
import { HybridEngine } from './src/HybridEngine.js';

const canvas = document.getElementById('myCanvas');
const engine = new HybridEngine(canvas, {
    particleCount: 2000,
    enableTriangulation: true,
    enableBlobRendering: true
});

await engine.setImage(sourceImage);
engine.start();

// Simple alien transition with defaults
await engine.alienTransition(sourceImage, targetImage);
```

### Text Logo Transition

Perfect for text with transparency:

```javascript
await engine.alienTransition(textLogo1, textLogo2, {
    opacityThreshold: 0.4,        // Only solid letters
    alienIntensity: 0.8,          // Strong alien effect
    explosionDirectional: true,   // Controlled burst
    ghostOutlineOpacity: 0.4,     // Strong ghost for text
    liquidThickness: 0.3,         // Less viscosity for cleaner look
    snapSpeed: 0.3                // Faster reformation
});
```

### Icon Transition

For sharp-edged icons:

```javascript
await engine.alienTransition(iconA, iconB, {
    opacityThreshold: 0.5,        // Very selective
    alienIntensity: 0.6,          // Moderate effect
    explosionIntensity: 100,      // Gentle explosion
    ghostOutlineOpacity: 0.35,    // Visible outline
    preventBlackout: true,        // Essential for icons
    snapSpeed: 0.35               // Quick snap
});
```

### Photo Transition

For photos with alpha channels:

```javascript
await engine.alienTransition(photo1, photo2, {
    opacityThreshold: 0.2,        // Include semi-transparent areas
    alienIntensity: 0.7,          // Full alien effect
    explosionIntensity: 150,      // Strong explosion
    liquidThickness: 0.6,         // High viscosity for fluid look
    ghostOutlineOpacity: 0.25,    // Subtle ghost
    snapSpeed: 0.2                // Slower, more dramatic
});
```

## Parameter Reference

### Core Parameters

| Parameter | Description | Range | Default | Best For |
|-----------|-------------|-------|---------|----------|
| `alienIntensity` | Overall effect strength | 0-1 | 0.7 | Adjust overall "alien-ness" |
| `opacityThreshold` | Alpha cutoff for particles | 0-1 | 0.3 | Text, icons, shapes |
| `explosionIntensity` | Explosion force | 50-300 | 120 | Control burst strength |
| `explosionDirectional` | Directional vs random | boolean | true | Organized explosions |
| `liquidThickness` | Viscosity factor | 0-1 | 0.5 | Fluid vs solid feel |
| `snapSpeed` | Reformation speed | 0.1-0.5 | 0.25 | Timing control |

### Visual Polish

| Parameter | Description | Range | Default | Best For |
|-----------|-------------|-------|---------|----------|
| `ghostOutlineOpacity` | Ghost image alpha | 0-1 | 0.3 | Recognizability |
| `ghostFadeStart` | When ghost fades | 0-1 | 0.6 | Timing control |
| `preventBlackout` | Scale blobs by alpha | boolean | true | Shape preservation |
| `blobSizeScale` | Blob size multiplier | 0-1 | 0.7 | Fine-tuning |
| `blobMinAlpha` | Min alpha for blobs | 0-1 | 0.2 | Edge clarity |

### Physics Constraints

| Parameter | Description | Range | Default | Best For |
|-----------|-------------|-------|---------|----------|
| `meshSpringLimit` | Max spring stretch | 1.5-4.0 | 2.5 | Prevent spikes |
| `meshAngleLimit` | Max angle deviation | 0-90° | 45° | Prevent folding |
| `meshRestoringForce` | Spring restoration | 0.1-1.0 | 0.4 | Elastic feel |

### Phase Timing (milliseconds)

| Parameter | Description | Default | Recommended Range |
|-----------|-------------|---------|-------------------|
| `staticDisplayDuration` | Initial display | 500 | 300-1000 |
| `disintegrateDuration` | Particle emergence | 1200 | 800-2000 |
| `alienMorphDuration` | Liquid deformation | 2000 | 1500-3000 |
| `reformDuration` | Snap back | 1800 | 1200-2500 |
| `blendDuration` | Final crossfade | 1500 | 1000-2500 |

## Recommended Configurations

### High-Speed Transition
```javascript
{
    staticDisplayDuration: 300,
    disintegrateDuration: 800,
    alienMorphDuration: 1500,
    reformDuration: 1200,
    blendDuration: 1000,
    snapSpeed: 0.4
}
```

### Dramatic Slow-Motion
```javascript
{
    staticDisplayDuration: 800,
    disintegrateDuration: 2000,
    alienMorphDuration: 3000,
    reformDuration: 2500,
    blendDuration: 2000,
    snapSpeed: 0.15,
    liquidThickness: 0.7
}
```

### Text-Optimized
```javascript
{
    opacityThreshold: 0.4,
    alienIntensity: 0.8,
    explosionDirectional: true,
    ghostOutlineOpacity: 0.4,
    liquidThickness: 0.3,
    snapSpeed: 0.3,
    preventBlackout: true
}
```

## Edge Cases & Troubleshooting

### Issue: Particles disappearing in transparent areas
**Solution:** Lower `opacityThreshold` or enable `ghostParticles`
```javascript
{ opacityThreshold: 0.2, ghostParticles: true }
```

### Issue: Blobs too large, obscuring shape
**Solution:** Increase `blobSizeScale`, enable `preventBlackout`
```javascript
{ blobSizeScale: 0.8, preventBlackout: true }
```

### Issue: Mesh artifacts (spikes, folding)
**Solution:** Adjust mesh constraints
```javascript
{ 
    meshSpringLimit: 2.0,      // Stricter limit
    meshRestoringForce: 0.6    // Stronger restoration
}
```

### Issue: Ghost outline too prominent/subtle
**Solution:** Adjust opacity and fade timing
```javascript
{ 
    ghostOutlineOpacity: 0.4,  // Increase visibility
    ghostFadeStart: 0.5        // Fade earlier
}
```

### Issue: Transition too slow/fast
**Solution:** Scale all phase durations proportionally
```javascript
// 75% speed (faster)
{
    staticDisplayDuration: 375,
    disintegrateDuration: 900,
    alienMorphDuration: 1500,
    reformDuration: 1350,
    blendDuration: 1125
}
```

## Performance Tips

1. **Particle Count**: Start with 2000, adjust based on device
2. **Blob Resolution**: Lower for better performance on mobile
3. **Phase Timing**: Longer phases = smoother but slower
4. **Opacity Threshold**: Higher = fewer particles = better performance
5. **Mesh Density**: Lower density for better mobile performance

## Browser Compatibility

- **Chrome/Edge**: Full support, best performance
- **Firefox**: Full support
- **Safari**: Full support (WebGL 1.0)
- **Mobile**: Supported with automatic optimization

## API Reference

See the main README.md for complete API documentation and additional examples.

## Contributing

Found an edge case? Have a cool configuration? Please open an issue or PR!
