# WebGL Particle Engine - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Layer](#core-layer)
3. [Rendering Systems](#rendering-systems)
4. [Physics Systems](#physics-systems)
5. [Transition Presets](#transition-presets)
6. [Data Flow & Interaction Diagrams](#data-flow--interaction-diagrams)
7. [File-by-File Reference](#file-by-file-reference)

---

## System Overview

### Architecture Pattern
The codebase follows a **layered component architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  (index.html, blob-demo.html, test-mesh.html)           │
└─────────────────────┬────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────┐
│               High-Level API Layer                        │
│         (HybridPageTransitionAPI.js)                     │
└─────────────────────┬────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────┐
│               Engine Layer                                │
│  ParticleEngine.js ──extends──> HybridEngine.js         │
└─────┬───────────────┬──────────────────┬─────────────────┘
      │               │                  │
┌─────▼──────┐ ┌─────▼──────┐ ┌─────────▼──────────────┐
│ Rendering  │ │  Physics   │ │   Presets/Effects      │
│  System    │ │   System   │ │       System           │
└────────────┘ └────────────┘ └────────────────────────┘
```

### Three Main Rendering Modes

1. **Particles** - Individual points with physics simulation
2. **Triangulation** - Mesh morphing using Delaunay triangulation
3. **Blob/Mesh** - Organic deformation with spring physics

---

## Core Layer

### `/src/ParticleEngine.js`
**Purpose**: Base orchestrator class that manages the core particle animation system.

**Responsibilities**:
- Initializes and owns the Renderer, ParticleSystem, and PresetManager
- Manages the animation loop (`requestAnimationFrame`)
- Handles image loading and particle initialization from images
- Implements disintegration effects (image → particles transition)
- Provides lifecycle methods: `start()`, `stop()`, `destroy()`

**Key Properties**:
```javascript
{
  renderer: Renderer,          // WebGL rendering context
  particleSystem: ParticleSystem, // Particle state management
  presetManager: PresetManager,   // Animation effects registry
  canvas: HTMLCanvasElement,    // WebGL canvas
  config: {
    particleCount: 2000,
    speed: 1.0,
    autoResize: true,
    enableTriangulation: false
  }
}
```

**Key Methods**:
- `setImage(image)` - Initialize particles from image
- `start()` - Begin animation loop
- `update(deltaTime)` - Per-frame update (calls preset.update())
- `startDisintegration()` - Trigger image-to-particles effect
- `registerPreset(id, preset)` - Add custom animation preset
- `activatePreset(id, options)` - Start specific animation

**Interaction**:
```
ParticleEngine
  ├─ calls → Renderer.render(particles)
  ├─ calls → ParticleSystem.update(deltaTime)
  ├─ calls → PresetManager.update(particles, deltaTime)
  └─ emits → events (onTransitionComplete, etc.)
```

---

### `/src/HybridEngine.js`
**Purpose**: Extended engine that adds triangulation, blob, and elastic mesh rendering capabilities.

**Extends**: `ParticleEngine`

**Additional Features**:
1. **Triangulation System** - Mesh morphing between images
2. **Blob Rendering** - Metaball-based organic rendering
3. **Elastic Mesh** - Spring-physics mesh deformation

**Additional Properties**:
```javascript
{
  // Triangulation
  triangulationMorph: TriangulationMorph,
  triangulationRenderer: TriangulationRenderer,
  triangulationImages: { source, target },
  
  // Blob system
  blobRenderer: BlobRenderer,
  blobPhysics: BlobPhysics,
  
  // Mesh system
  elasticMesh: ElasticMesh,
  meshPhysics: MeshPhysics,
  meshRenderer: MeshRenderer,
  
  // Configuration
  triangulationConfig: { mode: 'hybrid', gridSize: 8, ... },
  blobConfig: { influenceRadius: 80, surfaceTension: 0.5, ... },
  meshConfig: { gridDensity: 1.5, springConstant: 0.3, ... }
}
```

**Key Methods**:
- `initializeTriangulation()` - Setup triangulation system
- `initializeBlobRendering()` - Setup blob system
- `initializeElasticMesh()` - Setup mesh system
- `startHybridTransition(source, target, config)` - Start multi-phase transition
- `alienTransition(source, target, config)` - Start alien morph effect
- `setRenderMode(mode)` - Switch between 'particles', 'blob', 'triangulation', 'mesh', 'hybrid'
- `renderHybrid()` - Composite rendering of all active systems

**Rendering Decision Logic**:
```javascript
renderHybrid() {
  if (staticImageState.isDisplaying) {
    renderStaticImageToWebGL(image);
  } else if (meshTransition.isActive) {
    meshRenderer.render(elasticMesh);
  } else if (disintegrationState.isActive) {
    renderer.render(particles, { imageOpacity, particleOpacity });
  } else {
    // Standard hybrid rendering
    if (mode === 'blob') blobRenderer.render(particles);
    if (mode === 'triangulation' || mode === 'hybrid') {
      triangulationRenderer.render(morphData, progress);
    }
    if (mode === 'particles' || mode === 'hybrid') {
      renderer.render(particles);
    }
  }
}
```

**State Machine**:
The HybridEngine manages complex state transitions:
```
[Static Display] → [Disintegration] → [Explosion] → [Recombination] → [Blend] → [Complete]
```

---

## Rendering Systems

### `/src/Renderer.js`
**Purpose**: WebGL interface for GPU-accelerated particle and image rendering.

**Core Concepts**:
- **Shader Programs**: Compiled GLSL code running on GPU
- **Buffers**: GPU memory for vertex positions, colors, sizes
- **Textures**: GPU image storage for background rendering

**WebGL Setup Flow**:
```
1. Get WebGL context from canvas
2. Compile vertex + fragment shaders
3. Link shader program
4. Create attribute buffers (positions, colors, sizes)
5. Create uniform locations (resolution, opacity)
6. Create image texture + quad buffers
```

**Vertex Shader** (particles):
```glsl
attribute vec2 a_position;    // Particle XY
attribute vec3 a_color;       // RGB color
attribute float a_size;       // Point size
uniform vec2 u_resolution;    // Canvas dimensions

void main() {
  // Convert pixel coordinates to clip space (-1 to 1)
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;  // Flip Y-axis
  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = a_size;
}
```

**Fragment Shader** (particles):
```glsl
precision mediump float;
varying vec3 v_color;

void main() {
  // Create circular particles
  vec2 coord = gl_PointCoord - 0.5;
  float dist = length(coord);
  if (dist > 0.5) discard;  // Discard pixels outside circle
  
  float alpha = 1.0 - (dist * 2.0);  // Smooth edges
  gl_FragColor = vec4(v_color, alpha);
}
```

**Key Methods**:
- `render(particles, options)` - Draw particles + optional background image
- `loadImageTexture(image)` - Upload image to GPU
- `renderImage(opacity)` - Draw background quad with texture
- `updateBuffers(particles)` - Upload particle data to GPU (position, color, size arrays)

**Buffer Management**:
```javascript
// CPU-side arrays (JavaScript)
const positions = new Float32Array(particleCount * 2);  // [x1,y1, x2,y2, ...]
const colors = new Float32Array(particleCount * 3);     // [r1,g1,b1, r2,g2,b2, ...]
const sizes = new Float32Array(particleCount);          // [s1, s2, s3, ...]

// Upload to GPU
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
```

**Rendering Pipeline**:
```
1. Clear canvas (gl.clear)
2. If imageOpacity > 0: Render textured quad
3. Bind particle shader program
4. Update position/color/size buffers
5. Set uniforms (resolution, opacity)
6. gl.drawArrays(gl.POINTS) - GPU renders all particles in parallel
```

**Performance Optimization**:
- Uses `DYNAMIC_DRAW` hint for frequently updated buffers
- Minimizes state changes (bind once per frame)
- Batch rendering (single draw call for all particles)

---

### `/src/triangulation/TriangulationMorph.js`
**Purpose**: Generates morphing meshes between two images using Delaunay triangulation.

**Algorithm**:
1. **Key Point Detection**:
   - **Grid method**: Evenly spaced points across image
   - **Feature method**: Edge detection (high gradient areas)
2. **Delaunay Triangulation**: Connect points into non-overlapping triangles
3. **Correspondence Matching**: Map source triangles to target triangles
4. **Affine Transformation**: Calculate per-triangle morphing matrices

**Key Methods**:
- `setImages(source, target)` - Initialize morph between images
- `getTriangulationData()` - Returns triangle mesh for rendering
- `getMorphedPositions(progress)` - Interpolate triangle vertices (0=source, 1=target)

**Triangle Structure**:
```javascript
{
  vertices: [
    {x: 100, y: 200},  // Source position
    {x: 150, y: 180},
    {x: 120, y: 250}
  ],
  targetVertices: [
    {x: 300, y: 400},  // Target position
    {x: 350, y: 380},
    {x: 320, y: 450}
  ],
  textureCoords: [
    {u: 0.125, v: 0.333},  // UV coordinates for texture sampling
    {u: 0.187, v: 0.300},
    {u: 0.150, v: 0.417}
  ]
}
```

**Morphing Formula**:
```javascript
// Linear interpolation between source and target
morphedX = sourceX * (1 - progress) + targetX * progress;
morphedY = sourceY * (1 - progress) + targetY * progress;
```

---

### `/src/triangulation/TriangulationRenderer.js`
**Purpose**: Renders triangulated meshes to a 2D canvas with texture mapping.

**Key Methods**:
- `render(triangulationData, progress, sourceTexture, targetTexture)` - Draw morphed mesh
- `createTexture(image, id)` - Store image for texture mapping
- `setOpacity(alpha)` - Control mesh transparency

**Rendering Process**:
```javascript
// For each triangle:
1. Calculate morphed vertex positions
2. Set up canvas transform matrix
3. Draw source texture clipped to triangle
4. Draw target texture clipped to triangle (blended by progress)
5. Restore canvas state
```

---

### `/src/blob/BlobRenderer.js`
**Purpose**: Renders particles as connected organic blobs using metaball algorithm.

**Metaball Algorithm**:
1. Create influence field grid (e.g., 800x600 canvas divided into 5px cells = 160x120 grid)
2. For each grid point, calculate influence from all particles:
   ```javascript
   influence = Σ (particleRadius / distance)
   ```
3. Detect blob boundaries where influence crosses threshold (typically 1.0)
4. Use marching squares to trace blob outlines
5. Fill blob shapes with particle colors

**Marching Squares**:
- Processes 2x2 grid cells
- Each cell corner is either inside (influence ≥ threshold) or outside
- 16 possible configurations determine edge segments
- Traces smooth curves around blobs

**Key Methods**:
- `render(particles, width, height)` - Main rendering
- `calculateInfluenceField(particles)` - Build 2D influence grid
- `detectBlobs()` - Find connected blob regions
- `renderBlob(blob)` - Draw individual blob with marching squares

**Performance**:
- Grid resolution controlled by `blobResolution` (lower = faster but blockier)
- Spatial partitioning for influence calculation (only check nearby particles)

---

### `/src/mesh/MeshRenderer.js`
**Purpose**: Renders elastic mesh with WebGL, supporting texture mapping and debug visualization.

**Dual-Layer Rendering**:
1. **WebGL Layer**: Renders textured mesh triangles
2. **Canvas Overlay** (optional): Debug visualization of springs/vertices

**Key Methods**:
- `render(mesh, crossfadeProgress)` - Draw mesh with source/target texture blend
- `loadTexture(image, id)` - Upload image to WebGL texture
- `updateDebugOverlay(mesh)` - Draw springs/vertices on overlay canvas

**Mesh Rendering**:
```javascript
// Build triangle list from mesh springs
for (spring in mesh.springs) {
  if (!spring.active) continue;
  
  // Add triangle vertices
  vertices.push(spring.v1.x, spring.v1.y);
  vertices.push(spring.v2.x, spring.v2.y);
  // ... (third vertex to form triangle)
  
  // Add texture coordinates
  texCoords.push(spring.v1.u, spring.v1.v);
  texCoords.push(spring.v2.u, spring.v2.v);
}

// Upload to GPU and render
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
```

---

## Physics Systems

### `/src/ParticleSystem.js`
**Purpose**: Manages particle lifecycle, patterns, and basic physics.

**Particle Structure**:
```javascript
{
  x, y: number,           // Current position
  vx, vy: number,         // Velocity
  ax, ay: number,         // Acceleration
  r, g, b: number,        // Color (0-255)
  alpha: number,          // Opacity (0-1)
  size: number,           // Render size
  mass: number,           // For physics calculations
  targetX, targetY: number, // Destination (for transitions)
  initialX, initialY: number // Starting position (for resets)
}
```

**Initialization Patterns**:
- `initializeRandom()` - Scatter particles randomly
- `initializeGrid()` - Organized grid layout
- `initializeCircle()` - Ring formation
- `initializeSpiral()` - Spiral pattern
- `initializeFromImage(image)` - Extract from image pixels

**Image Extraction Process**:
```javascript
1. Scale image to fit canvas
2. Sample image at grid points
3. For each pixel with alpha > threshold:
   - Create particle at that position
   - Copy RGB color from pixel
   - Set size based on local density
4. Result: Particles form shape of image
```

**Update Physics**:
```javascript
update(deltaTime) {
  for (particle of particles) {
    // Apply acceleration
    particle.vx += particle.ax * deltaTime;
    particle.vy += particle.ay * deltaTime;
    
    // Apply velocity
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    
    // Apply damping (friction)
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    
    // Boundary checks (optional wrapping/bouncing)
  }
}
```

**Transition System**:
```javascript
transitionTo(targets, duration) {
  for (i = 0; i < particles.length; i++) {
    particle.targetX = targets[i].x;
    particle.targetY = targets[i].y;
    particle.targetR = targets[i].r;
    // ... set color targets
  }
  
  // Over time, interpolate: current = lerp(current, target, speed)
}
```

---

### `/src/blob/BlobPhysics.js`
**Purpose**: Implements organic physics simulation for blob behavior.

**Forces**:

1. **Surface Tension** (particle-to-particle attraction):
   ```javascript
   for (particle1 of particles) {
     for (particle2 of particles) {
       distance = dist(particle1, particle2);
       if (distance < tensionRadius) {
         force = surfaceTension * (1 - distance / tensionRadius);
         particle1.vx += force * dx / distance;
         particle1.vy += force * dy / distance;
       }
     }
   }
   ```

2. **Cohesion** (pull toward blob center):
   ```javascript
   centerX = average(particles.x);
   centerY = average(particles.y);
   
   for (particle of particles) {
     dx = centerX - particle.x;
     dy = centerY - particle.y;
     distance = sqrt(dx² + dy²);
     
     if (distance < cohesionRadius) {
       force = cohesionStrength * distance;
       particle.vx += force * dx / distance;
       particle.vy += force * dy / distance;
     }
   }
   ```

3. **Elasticity** (bounce/recovery):
   ```javascript
   // When particles collide or reach targets
   particle.vx *= elasticity;  // e.g., 0.7 = 70% velocity retained
   particle.vy *= elasticity;
   ```

**Mitosis (Splitting)**:
```javascript
detectSplitting(particles) {
  // Find connected components using distance threshold
  blobs = groupParticlesByProximity(particles, splitThreshold);
  
  if (blobs.length > 1) {
    console.log(`Blob split into ${blobs.length} pieces`);
    // Each blob now acts independently
  }
}
```

**Merging**:
```javascript
detectMerging(particles) {
  for (blob1 of blobs) {
    for (blob2 of blobs) {
      if (blobDistance(blob1, blob2) < mergeThreshold) {
        mergeBlobs(blob1, blob2);
      }
    }
  }
}
```

---

### `/src/mesh/ElasticMesh.js`
**Purpose**: Generates spring-connected mesh grids for elastic deformation.

**Mesh Generation**:
```javascript
generateMesh(imageData) {
  // 1. Create grid vertices
  spacing = 100 / gridDensity;  // e.g., 1.5 density = 66px spacing
  cols = ceil(width / spacing);
  rows = ceil(height / spacing);
  
  for (row = 0; row < rows; row++) {
    for (col = 0; col < cols; col++) {
      x = col * spacing;
      y = row * spacing;
      
      vertices.push({
        x, y,
        vx: 0, vy: 0,  // Velocity
        mass: 1.0,
        u: x / width,   // Texture coordinate
        v: y / height
      });
    }
  }
  
  // 2. Create springs (4 directions: right, down, diagonal-right, diagonal-left)
  for (vertex of vertices) {
    neighbors = [right, down, diagonalRight, diagonalLeft];
    for (neighbor of neighbors) {
      if (shouldConnect(vertex, neighbor, imageData)) {
        restLength = distance(vertex, neighbor);
        springs.push({v1: vertex, v2: neighbor, restLength, active: true});
      }
    }
  }
}
```

**Alpha-Aware Connection**:
```javascript
shouldConnect(v1, v2, imageData) {
  // Sample points along line between v1 and v2
  numSamples = 5;
  for (i = 0; i < numSamples; i++) {
    t = i / numSamples;
    x = lerp(v1.x, v2.x, t);
    y = lerp(v1.y, v2.y, t);
    
    alpha = sampleAlpha(imageData, x, y);
    if (alpha < alphaThreshold) {
      return false;  // Don't connect through transparent areas
    }
  }
  return true;  // Path is opaque, create spring
}
```

This preserves holes in images (like the center of letter 'O' or 'A').

**Methods**:
- `generateMesh(imageData)` - Create grid + springs
- `explode(intensity)` - Add random velocity to vertices
- `sampleColor(imageData, x, y)` - Get pixel color for vertex
- `shouldConnect(v1, v2, imageData)` - Check if spring should exist

---

### `/src/mesh/MeshPhysics.js`
**Purpose**: Simulates spring physics for elastic mesh deformation.

**Physics Update Loop**:
```javascript
update(deltaTime) {
  // 1. Apply spring forces
  for (spring of springs) {
    if (!spring.active) continue;
    
    currentLength = distance(spring.v1, spring.v2);
    displacement = currentLength - spring.restLength;
    force = springConstant * displacement;
    
    // Hooke's law: F = -kx
    spring.v1.vx += force * dx / currentLength;
    spring.v1.vy += force * dy / currentLength;
    spring.v2.vx -= force * dx / currentLength;
    spring.v2.vy -= force * dy / currentLength;
  }
  
  // 2. If morphing, attract vertices to targets
  if (morphing) {
    for (vertex of vertices) {
      dx = vertex.targetX - vertex.x;
      dy = vertex.targetY - vertex.y;
      vertex.vx += dx * targetAttractionStrength;
      vertex.vy += dy * targetAttractionStrength;
    }
  }
  
  // 3. Integrate velocities
  for (vertex of vertices) {
    vertex.vx *= damping;  // Friction
    vertex.vy *= damping;
    vertex.x += vertex.vx * deltaTime;
    vertex.y += vertex.vy * deltaTime;
  }
  
  // 4. Check for spring breaking/reconnection
  updateSprings();
}
```

**Spring Breaking**:
```javascript
updateSprings() {
  for (spring of springs) {
    distance = dist(spring.v1, spring.v2);
    
    if (spring.active && distance > breakThreshold) {
      spring.active = false;
      brokenSprings.push(spring);
      console.log('Spring broken');
    }
    else if (!spring.active && distance < reconnectThreshold) {
      spring.active = true;
      console.log('Spring reconnected');
    }
  }
}
```

**Morphing**:
```javascript
startMorphing(duration) {
  this.morphing = true;
  
  // Set target positions for all vertices
  for (vertex of vertices) {
    // Map vertex to target image position
    vertex.targetX = targetImageX;
    vertex.targetY = targetImageY;
  }
  
  // Over time, vertices will be pulled to targets by physics
}
```

---

## Transition Presets

### `/src/presets/PresetManager.js`
**Purpose**: Registry and lifecycle manager for animation presets.

**API**:
```javascript
register(id, preset)    // Add preset to registry
activate(id, options)   // Start preset animation
deactivate()           // Stop current preset
update(particles, dt)   // Per-frame update (delegates to active preset)
getActivePreset()      // Get current preset instance
```

**Preset Lifecycle**:
```
register() → activate() → initialize() → update() loop → deactivate()
```

---

### `/src/presets/Preset.js`
**Purpose**: Base class for all animation presets.

**Interface**:
```javascript
class Preset {
  constructor(name, description, config)
  
  initialize(particles, dimensions, options) {
    // Setup initial state
    this.isActive = true;
  }
  
  update(particles, deltaTime, dimensions) {
    // Per-frame logic - modify particle positions/velocities
  }
  
  transitionTo(particles, targets, duration) {
    // Handle transitions between states
  }
  
  deactivate() {
    // Cleanup
    this.isActive = false;
  }
}
```

**Custom Preset Example**:
```javascript
class MyCustomPreset extends Preset {
  update(particles, deltaTime) {
    // Apply custom physics
    for (particle of particles) {
      // Circular motion
      angle = Math.atan2(particle.y - centerY, particle.x - centerX);
      particle.vx = Math.cos(angle + Math.PI/2) * speed;
      particle.vy = Math.sin(angle + Math.PI/2) * speed;
      
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
    }
  }
}
```

---

### `/src/presets/HybridTransitionPreset.js`
**Purpose**: Multi-phase transition with explosion, recombination, and blend.

**Phases**:
```javascript
Phase 1: Explosion (800ms)
  - Apply random outward velocity
  - No target attraction yet

Phase 2: Recombination (2000ms)
  - Apply vacuum force toward targets
  - Add chaos (random jitter)
  - Gradually strengthen attraction

Phase 3: Blend (1500ms)
  - Continue movement to targets
  - Fade particle alpha
  - Crossfade to triangulation mesh
```

**Vacuum Force**:
```javascript
// "Space vacuum" - pulls particles toward targets
dx = particle.targetX - particle.x;
dy = particle.targetY - particle.y;
distance = sqrt(dx² + dy²);

force = vacuumStrength * distance;  // Stronger pull when farther away
particle.vx += force * dx / distance;
particle.vy += force * dy / distance;
```

**Chaos Addition**:
```javascript
// Adds organic randomness during recombination
chaosX = (Math.random() - 0.5) * recombinationChaos * 10;
chaosY = (Math.random() - 0.5) * recombinationChaos * 10;
particle.vx += chaosX;
particle.vy += chaosY;
```

---

### `/src/presets/AlienTransitionPreset.js`
**Purpose**: Liquid alien-like morphing with advanced effects.

**Features**:
1. **Opacity Masking**: Only creates particles where image alpha > threshold
2. **Ghost Outline**: Renders faint source image during transition
3. **Mesh Constraints**: Prevents spring overstretching/folding
4. **Wave Motion**: Sinusoidal particle displacement
5. **Viscosity**: Liquid-like damping

**Phases**:
```
Static → Disintegrate → Alien Morph → Reform → Blend
```

**Wave Effect**:
```javascript
updateAlienMorph(particles, deltaTime) {
  time = (Date.now() - startTime) / 1000;
  
  for (particle of particles) {
    // Sinusoidal wave based on position
    wave = Math.sin(time * 2 + particle.waveOffset);
    particle.vx += wave * alienIntensity * 5;
    
    // Rotational motion
    angle = time * particle.rotationSpeed;
    particle.vx += Math.cos(angle) * 2;
    particle.vy += Math.sin(angle) * 2;
    
    // Viscosity damping
    viscosity = 1.0 - liquidThickness * 0.3;
    particle.vx *= viscosity;
    particle.vy *= viscosity;
  }
}
```

**Mesh Constraints**:
```javascript
applyMeshConstraints(mesh) {
  for (spring of mesh.springs) {
    currentLength = distance(spring.v1, spring.v2);
    stretchRatio = currentLength / spring.restLength;
    
    if (stretchRatio > meshSpringLimit) {
      // Apply restoring force to pull vertices back
      overshoot = stretchRatio - meshSpringLimit;
      force = meshRestoringForce * overshoot;
      
      spring.v1.vx += dirX * force;
      spring.v1.vy += dirY * force;
      spring.v2.vx -= dirX * force;
      spring.v2.vy -= dirY * force;
    }
  }
}
```

---

### `/src/presets/BlobTransitionPreset.js`
**Purpose**: Transition using blob physics (mitosis/merging).

**Algorithm**:
```
1. Start with source image as single blob
2. Apply explosion → blob splits into multiple pieces
3. Pieces drift toward target positions
4. Blobs merge back together forming target image
```

---

### `/src/presets/SchoolOfFishPreset.js`
**Purpose**: Flocking behavior simulation (boids algorithm).

**Three Rules**:
```javascript
1. Separation: Avoid crowding neighbors
   for (other of nearbyParticles) {
     if (distance < separationRadius) {
       flee = direction away from other;
       particle.vx += flee.x;
       particle.vy += flee.y;
     }
   }

2. Alignment: Steer toward average heading of neighbors
   avgVelocity = average([neighbor.vx, neighbor.vy]);
   particle.vx += (avgVelocity.x - particle.vx) * alignmentStrength;

3. Cohesion: Steer toward average position of neighbors
   avgPosition = average([neighbor.x, neighbor.y]);
   particle.vx += (avgPosition.x - particle.x) * cohesionStrength;
```

---

## Data Flow & Interaction Diagrams

### Image Loading Flow
```
User uploads image
      ↓
HybridEngine.setImage(image)
      ↓
ParticleEngine.setImage(image)
      ↓
┌─────────────────┬──────────────────┐
│                 │                  │
v                 v                  v
ParticleSystem    Renderer        TriangulationMorph
.initializeFromImage  .loadImageTexture   .setImages()
      ↓                 ↓                  ↓
Extract pixels    Upload to GPU      Generate mesh
Create particles  Store texture      Find key points
Color from image  Create quad        Triangulate
      ↓                 ↓                  ↓
particles[]       WebGL texture     triangles[]
```

### Animation Loop Flow
```
requestAnimationFrame()
      ↓
ParticleEngine.update(deltaTime)
      ↓
┌─────────────┬──────────────┬─────────────────┐
│             │              │                 │
v             v              v                 v
PresetManager ParticleSystem MeshPhysics    BlobPhysics
.update()     .update()      .update()       .applySurfaceTension()
      ↓             ↓              ↓                 ↓
Modify        Apply          Calc spring     Calc cohesion
particles     velocity       forces          forces
      ↓             ↓              ↓                 ↓
      └─────────────┴──────────────┴─────────────────┘
                        ↓
              HybridEngine.renderHybrid()
                        ↓
      ┌─────────────────┼─────────────────┐
      │                 │                 │
      v                 v                 v
Renderer.render()  BlobRenderer     MeshRenderer
                   .render()        .render()
      │                 │                 │
      └─────────────────┴─────────────────┘
                        ↓
                GPU renders frame
                        ↓
                Display on screen
```

### Transition Flow (Hybrid)
```
User clicks "Start Transition"
      ↓
HybridEngine.startHybridTransition(img1, img2, config)
      ↓
1. Setup static image display
      ↓
2. Start disintegration effect
   - Image opacity: 1.0 → 0.0
   - Particle opacity: 0.0 → 1.0
   - Particles emerge from image pixels
      ↓
3. Activate HybridTransitionPreset
   - Phase: Explosion
   - Apply random velocities
      ↓
4. Preset phase: Recombination
   - Set target positions from img2
   - Apply vacuum force
   - Particles converge to target shape
      ↓
5. Preset phase: Blend
   - Fade particles: alpha → 0
   - Increase triangulation opacity: 0 → 1
   - Crossfade between rendering modes
      ↓
6. Transition complete
   - Display img2 as static image
   - Reset state
```

---

## File-by-File Reference

### `/src/HybridPageTransitionAPI.js`
**Purpose**: High-level API for page transitions.

**What it does**:
- Simplifies integration for developers
- Auto-captures page content as images (using html2canvas)
- Manages transition lifecycle
- Handles device performance optimization

**Key methods**:
- `initialize()` - Setup engine
- `transition(fromElement, toElement, options)` - Trigger page transition
- `setPreset(name)` - Choose animation style

**Usage example**:
```javascript
const api = new HybridPageTransitionAPI({
  particleCount: 2000,
  autoOptimize: true
});

await api.initialize();
await api.transition('#page1', '#page2', {
  explosionIntensity: 150,
  recombinationDuration: 2500
});
```

---

### `/src/utils/DevicePerformance.js`
**Purpose**: Detects device capabilities and adjusts settings.

**Detection logic**:
```javascript
score = 0;
score += navigator.hardwareConcurrency * 10;  // CPU cores
score += (window.devicePixelRatio > 1) ? 20 : 10;  // Retina display
score += (WebGL2) ? 30 : 0;  // WebGL 2 support

if (score > 80) return 'high';
else if (score > 40) return 'mid';
else return 'low';
```

**Adjustments**:
- High-end: 3000 particles, full resolution
- Mid-range: 2000 particles, 0.8x resolution
- Low-end: 1000 particles, 0.6x resolution

---

### `/src/triangulation/KeyPointManager.js`
**Purpose**: Extracts important points from images for triangulation.

**Two methods**:

1. **Grid method**:
   ```javascript
   generateGridKeyPoints(width, height, gridSize) {
     points = [];
     spacing = width / gridSize;
     for (x = 0; x < width; x += spacing) {
       for (y = 0; y < height; y += spacing) {
         points.push({x, y});
       }
     }
     return points;
   }
   ```

2. **Feature method** (edge detection):
   ```javascript
   generateFeatureKeyPoints(imageData, count) {
     edges = detectEdges(imageData);  // Sobel filter
     corners = detectCorners(edges);   // Harris corner detection
     return corners.slice(0, count);   // Top N corners
   }
   ```

---

### `/src/triangulation/DelaunayTriangulator.js`
**Purpose**: Converts point set into non-overlapping triangle mesh.

**Algorithm**: Bowyer-Watson incremental construction
```
1. Create super-triangle containing all points
2. For each point:
   a. Find triangles whose circumcircle contains point
   b. Delete those triangles
   c. Re-triangulate the polygon hole
3. Remove super-triangle
4. Return triangle list
```

**Properties**:
- No overlapping triangles
- Maximizes minimum angle (avoids slivers)
- Deterministic for given point set

---

## How Everything Works Together

### Scenario: User Uploads Two Images and Clicks "Start Transition"

**Step-by-step breakdown**:

```
1. IMAGE UPLOAD
   index.html → User selects files
   ↓
   Image loaded into memory (HTMLImageElement)
   ↓
   HybridEngine.setImage(image1)
   ↓
   ├─ Renderer.loadImageTexture(image1)
   │  └─ Upload to GPU as WebGL texture
   ├─ ParticleSystem.initializeFromImage(image1)
   │  └─ Sample pixels, create 2000 particles
   └─ TriangulationMorph.setImages(image1, null)
      └─ Generate keypoints + triangles for image1

2. INITIALIZE ENGINE
   HybridEngine.start()
   ↓
   Begin animation loop (requestAnimationFrame)
   ↓
   Render particles representing image1

3. USER CLICKS "START TRANSITION"
   index.html button click handler
   ↓
   HybridEngine.startHybridTransition(image1, image2, config)
   ↓
   Set up multi-phase transition:
   
   PHASE A: STATIC DISPLAY (500ms)
   ↓
   Render image1 as solid texture
   ↓
   
   PHASE B: DISINTEGRATION (1000ms)
   ↓
   ParticleEngine.startDisintegration()
   ├─ disintegrationState.progress: 0 → 1
   ├─ Image opacity: 1.0 → 0.0
   ├─ Particle opacity: 0.0 → 1.0
   └─ Particles gain slight random velocity
   ↓
   Renderer.render(particles, {
     imageOpacity: 1.0 - progress,
     particleOpacity: progress
   })
   ↓
   
   PHASE C: EXPLOSION (800ms)
   ↓
   HybridTransitionPreset.startExplosion()
   └─ Apply strong random velocities to all particles
   ↓
   
   PHASE D: RECOMBINATION (2000ms)
   ↓
   HybridTransitionPreset.startRecombination()
   ├─ Extract target positions from image2
   ├─ Assign each particle a target
   └─ Apply vacuum force physics:
       dx = targetX - x
       dy = targetY - y
       vx += dx * vacuumStrength
       vy += dy * vacuumStrength
   ↓
   Particles gradually form shape of image2
   ↓
   
   PHASE E: BLEND (1500ms)
   ↓
   HybridTransitionPreset.startBlend()
   ├─ Triangulation opacity: 0 → 1
   ├─ Particle opacity: 1 → 0
   └─ TriangulationRenderer.render(morphData, progress)
       - Render textured triangles
       - Morph from image1 to image2 texture
   ↓
   
   PHASE F: COMPLETE
   ↓
   Display image2 as solid texture
   Reset all state
   Enable reverse transition
```

### Rendering Decision Tree

Every frame, `HybridEngine.renderHybrid()` decides what to render:

```
IF staticImageState.isDisplaying:
  → Render solid image to WebGL canvas
  
ELSE IF meshTransition.isActive:
  → MeshRenderer.render(elasticMesh)
  → Show elastic mesh deformation
  
ELSE IF disintegrationState.isActive:
  → Dual rendering:
    ├─ Background: Fading image
    └─ Foreground: Appearing particles
  
ELSE IF triangulationConfig.mode === 'blob':
  → BlobRenderer.render(particles)
  → Draw organic metaball blobs
  
ELSE IF triangulationConfig.mode === 'triangulation':
  → TriangulationRenderer.render(morphData, progress)
  → Draw morphing triangles
  
ELSE IF triangulationConfig.mode === 'mesh':
  → MeshRenderer.render(elasticMesh, crossfade)
  → Draw elastic spring mesh
  
ELSE IF triangulationConfig.mode === 'hybrid':
  → Composite rendering:
    ├─ TriangulationRenderer.render(...) [background]
    └─ Renderer.render(particles) [foreground]
  → Blend both layers
  
ELSE:
  → Renderer.render(particles)
  → Basic particle rendering
```

---

## Summary

This WebGL Particle Engine is a sophisticated animation system with:

1. **Modular Architecture**: Clear separation between rendering, physics, and animation logic
2. **Multiple Rendering Modes**: Particles, triangulation, blobs, mesh - all GPU-accelerated
3. **Extensible Preset System**: Easy to add custom animations
4. **Complex State Management**: Handles multi-phase transitions with proper state machines
5. **Performance Optimization**: Dynamic buffer updates, batch rendering, device-aware scaling

**Key Design Patterns**:
- **Inheritance**: `HybridEngine extends ParticleEngine`
- **Composition**: Engine owns Renderer, ParticleSystem, PresetManager
- **Strategy Pattern**: Interchangeable presets for different animations
- **Observer Pattern**: Event callbacks for transition lifecycle
- **Factory Pattern**: Particle creation from various sources (random, grid, image)

**Data Flow**:
```
User Input → Engine → Preset → Particles → Physics → Renderer → WebGL → GPU → Screen
```

Each component has a single, well-defined responsibility, making the system maintainable and testable.
