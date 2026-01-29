# Elastic Blob Physics - Water in Space Behavior

## Overview

Implemented comprehensive elastic physics to make blobs behave like **water in space** - with elastic deformation, surface tension, volume preservation, and natural recovery.

## Problem Solved

**Before:** Blobs were just collections of individual particles moving independently without cohesion.

**After:** Blobs behave as unified elastic bodies that deform and recover like liquid droplets in zero gravity.

## Visual Result

![Elastic Blobs](https://github.com/user-attachments/assets/c170c7bd-b441-408f-87aa-538b2031e01e)

*17 elastic blobs with interactive controls. Blobs maintain cohesive shape while allowing elastic deformation.*

## Physics Implementation

### 1. Spring Forces

**Purpose:** Maintain blob shape through elastic connections between particles.

**Implementation:**
- Adjacent outline particles connected by springs (Hooke's law)
- Diagonal springs for additional stability
- Springs store rest lengths calculated at initialization

```javascript
// Calculate spring force
displacement = currentLength - restLength
force = springStiffness * displacement

// Apply to both connected particles
particle1.vx += (dx / distance) * force * 0.5
particle2.vx -= (dx / distance) * force * 0.5
```

**Parameters:**
- `springStiffness`: 0-2 (default: 0.5) - Higher = stiffer springs
- `damping`: 0.5-0.99 (default: 0.92) - Higher = slower decay

### 2. Surface Tension

**Purpose:** Create cohesive behavior by pulling particles toward blob center.

**Implementation:**
- Calculates force pulling each particle toward blob center
- Force proportional to distance from ideal radius
- Creates water-like surface cohesion

```javascript
// Vector from particle to center
dx = centerX - particle.x
dy = centerY - particle.y
distance = sqrt(dx² + dy²)

// Apply inward force
force = surfaceTension * (distance - radius * 0.8) / distance
particle.vx += dx * force
particle.vy += dy * force
```

**Parameters:**
- `surfaceTension`: 0-1 (default: 0.3) - Higher = stronger cohesion

### 3. Volume Preservation

**Purpose:** Maintain constant blob area (incompressible fluid behavior).

**Implementation:**
- Calculates current area using shoelace formula
- Applies pressure forces along particle normals
- Prevents collapse or over-expansion

```javascript
// Calculate area difference
currentArea = calculateArea() // Shoelace formula
areaDiff = restArea - currentArea
pressure = pressureStrength * areaDiff / restArea

// Apply normal forces
for each particle:
    normal = perpendicular to edges
    particle.v += normal * pressure
```

**Parameters:**
- `pressureStrength`: 0-1 (default: 0.2) - Higher = incompressible

### 4. Velocity Damping

**Purpose:** Create realistic motion decay and energy dissipation.

**Implementation:**
```javascript
// Each frame
particle.vx *= damping
particle.vy *= damping
```

## Configuration

### BlobSystem Configuration

```javascript
const blobSystem = new BlobSystem({
    enableElastic: true,        // Enable elastic physics
    springStiffness: 0.5,       // Spring force strength
    damping: 0.92,              // Velocity damping (0.5-0.99)
    surfaceTension: 0.3,        // Surface cohesion (0-1)
    pressureStrength: 0.2       // Volume preservation (0-1)
});
```

### Per-Blob Configuration

```javascript
const blob = new Blob({
    outlineParticles: particles,
    enableElastic: true,
    springStiffness: 0.5,
    damping: 0.92,
    surfaceTension: 0.3,
    pressureStrength: 0.2
});
```

## Usage Examples

### Basic Elastic Blobs

```javascript
import { BlobSystem, BlobRenderer } from './src/...';

// Create system with elastic physics
const blobSystem = new BlobSystem({
    enableElastic: true,
    springStiffness: 0.5,
    damping: 0.92,
    surfaceTension: 0.3
});

// Create blobs from particles
blobSystem.createBlobsFromParticles(particles);

// Animation loop
function animate() {
    blobSystem.update(deltaTime);
    renderer.renderBlobs(blobSystem);
    requestAnimationFrame(animate);
}
```

### Interactive Physics

```javascript
// Apply force to blob (e.g., mouse interaction)
for (const blob of blobSystem.blobs) {
    for (const particle of blob.outlineParticles) {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < forceRadius) {
            const force = 5 * (1 - distance / forceRadius);
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
        }
    }
}

// Elastic forces automatically restore blob shape
```

### Dynamic Parameter Adjustment

```javascript
// Change physics in real-time
for (const blob of blobSystem.blobs) {
    blob.springStiffness = 1.0;  // Stiffer
    blob.surfaceTension = 0.5;    // More cohesive
    blob.pressureStrength = 0.4;  // Incompressible
}
```

## Behavior Characteristics

### Water in Space

The elastic physics create water-like behavior in zero gravity:

1. **Elastic Deformation:** Blobs deform when forces applied
2. **Shape Recovery:** Springs restore original shape
3. **Cohesive Surface:** Surface tension keeps blob unified
4. **Volume Conservation:** Pressure maintains constant area
5. **Natural Damping:** Energy dissipates realistically

### Parameter Effects

**Spring Stiffness (0-2):**
- Low (0.1-0.3): Soft, jelly-like
- Medium (0.5-0.8): Water-like elasticity
- High (1.0-2.0): Stiff, rubber-like

**Damping (0.5-0.99):**
- Low (0.5-0.7): Bouncy, oscillates
- Medium (0.8-0.9): Smooth settling
- High (0.95-0.99): Slow motion

**Surface Tension (0-1):**
- Low (0-0.2): Loose cohesion
- Medium (0.3-0.5): Water-like
- High (0.6-1.0): Strong pull to center

**Pressure Strength (0-1):**
- Low (0-0.1): Compressible
- Medium (0.2-0.3): Semi-rigid
- High (0.4-1.0): Incompressible

## Performance

### Computational Complexity

**Per Blob, Per Frame:**
- Spring forces: O(n) where n = outline particles
- Surface tension: O(n)
- Volume preservation: O(n)
- Total: O(n) per blob

**For k Blobs:**
- Total: O(k * n) per frame
- Typically: 15-30 blobs × 10-15 particles = 150-450 operations
- Runs at 60 FPS with smooth physics

### Optimization

- Springs only between adjacent particles (not all pairs)
- Diagonal springs for stability without full connectivity
- Cached rest lengths and rest area
- Efficient normal calculations

## Demo Pages

### test-elastic-blobs.html

Interactive demo with full control over elastic physics:

**Features:**
- Real-time parameter adjustment (sliders)
- Mouse interaction (click and drag)
- Random force application
- Physics reset
- Visual feedback

**Controls:**
- Spring Stiffness slider (0-2)
- Damping slider (0.5-0.99)
- Surface Tension slider (0-1)
- Pressure Strength slider (0-1)

## Comparison

### Before (Individual Particles)
```
Particle A: x, y, vx, vy
Particle B: x, y, vx, vy
Particle C: x, y, vx, vy
// No connection between particles
// Move independently
```

### After (Elastic Blobs)
```
Blob {
    Particle A ←→ Spring ←→ Particle B
         ↓         ↓           ↓
    Surface    Springs    Surface
    Tension               Tension
         ↓         ↓           ↓
    Volume Pressure Applied
}
// Particles connected by forces
// Move as cohesive unit
// Elastic deformation + recovery
```

## Technical Details

### Shoelace Formula (Area Calculation)

```javascript
calculateArea() {
    let area = 0;
    for (let i = 0; i < n; i++) {
        const p1 = particles[i];
        const p2 = particles[(i + 1) % n];
        area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
}
```

### Normal Vector Calculation

```javascript
// For pressure forces
const prev = particles[(i - 1 + n) % n];
const next = particles[(i + 1) % n];

// Edge vectors
dx1 = particle.x - prev.x
dy1 = particle.y - prev.y
dx2 = next.x - particle.x
dy2 = next.y - particle.y

// Average normal (perpendicular)
nx = -(dy1 + dy2) / 2
ny = (dx1 + dx2) / 2
```

### Spring Network

```
   P0 ━━━━━ P1
   ┃ ╲   ╱ ┃
   ┃  ╲ ╱  ┃   Adjacent springs (solid)
   ┃   ✕   ┃   Diagonal springs (dashed)
   ┃  ╱ ╲  ┃
   ┃ ╱   ╲ ┃
   P3 ━━━━━ P2
```

## Future Enhancements

Possible improvements:
- Blob-blob collision and merging
- Viscosity control
- Turbulence simulation
- Blob splitting under stress
- Advanced fluid dynamics (SPH)

## Files Modified

1. `src/Blob.js` - Added elastic physics methods
2. `src/BlobSystem.js` - Pass elastic config to blobs
3. `test-elastic-blobs.html` - Interactive demo

## References

- Hooke's Law: F = -k × x
- Shoelace Formula: Area calculation for polygons
- Surface Tension: Minimal surface area principle
- Zero-gravity liquid behavior: NASA fluid dynamics research
