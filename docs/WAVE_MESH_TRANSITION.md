# Wave Mesh Transition

> Immersive page transitions with wavy mesh distortion effects using hardware-accelerated WebGL rendering.

## Overview

The Wave Mesh Transition creates stunning, fluid page transitions by applying sine wave distortions to a textured mesh. Inspired by the CodePen demo at https://codepen.io/alphardex/pen/RwpajRj, this transition provides a unique, immersive experience perfect for modern web applications.

**Key Features:**
- 🌊 Dynamic sine wave displacement
- 🎨 Smooth texture crossfading
- ⚡ Hardware-accelerated WebGL rendering
- 🎛️ Highly configurable wave parameters
- 🎬 5-phase transition system
- 📱 Responsive and performant

## Visual Description

The transition creates a liquid, wave-like effect where the source image gradually distorts with animated sine waves, morphs into the target image while maintaining the wave motion, and then settles back to a flat target image. The effect is similar to viewing images through rippling water.

## Phase Breakdown

### Phase 1: Static Display (500ms default)
- Displays the source image as a solid, flat textured mesh
- No wave distortion applied
- Provides a brief moment of stability before the transition begins

### Phase 2: Wave In (800ms default)
- Gradually applies sine wave distortion to the mesh
- Amplitude ramps from 0 to maximum using smooth easing
- Creates animated sine waves based on vertex position and time
- Distortion follows the formula:
  \`\`\`
  waveX = sin((x * frequency * directionX) + (y * frequency * 0.2) + time) * amplitude
  waveY = sin((y * frequency * directionY) + (x * frequency * 0.3) + time * 1.3) * amplitude * 0.7
  \`\`\`

### Phase 3: Wave Morph (1500ms default)
- Maintains full wave distortion throughout
- Crossfades texture from source to target image
- Continues animating waves for dynamic motion
- Smooth color interpolation between images

### Phase 4: Wave Out (800ms default)
- Gradually removes wave distortion
- Amplitude ramps from maximum to 0 using smooth easing
- Mesh returns to flat, undistorted state

### Phase 5: Static Target (500ms default)
- Displays target image as solid, flat mesh
- No wave distortion
- Provides closure to the transition

## API Reference

### Using HybridEngine Directly

\`\`\`javascript
import { HybridEngine } from './src/HybridEngine.js';

// Initialize engine
const canvas = document.getElementById('canvas');
const engine = new HybridEngine(canvas, {
  enableWaveMesh: true,
  waveAmplitude: 20,
  waveFrequency: 0.05,
  waveSpeed: 2.0
});

// Start wave mesh transition
await engine.startWaveMeshTransition(sourceImage, targetImage, {
  staticDuration: 500,
  waveInDuration: 800,
  morphDuration: 1500,
  waveOutDuration: 800,
  staticTargetDuration: 500,
  amplitude: 20,
  frequency: 0.05,
  speed: 2.0,
  gridRows: 20,
  gridCols: 20,
  waveDirectionX: 1.0,
  waveDirectionY: 0.5
});
\`\`\`

### Using HybridPageTransitionAPI

\`\`\`javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

// Initialize API
const api = new HybridPageTransitionAPI({
  canvasId: 'transition-canvas',
  particleCount: 2000
});

await api.initialize();

// Perform wave mesh transition between page elements
await api.waveMeshPageTransition(
  document.getElementById('page1'),
  document.getElementById('page2'),
  {
    staticDuration: 500,
    waveInDuration: 800,
    morphDuration: 1500,
    waveOutDuration: 800,
    staticTargetDuration: 500,
    amplitude: 30,
    frequency: 0.04,
    speed: 2.5,
    gridRows: 25,
    gridCols: 25
  }
);
\`\`\`

## Configuration Options

### Phase Durations

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`staticDuration\` | number | 500 | Duration of initial static display (ms) |
| \`waveInDuration\` | number | 800 | Duration of wave in phase (ms) |
| \`morphDuration\` | number | 1500 | Duration of morph phase with texture crossfade (ms) |
| \`waveOutDuration\` | number | 800 | Duration of wave out phase (ms) |
| \`staticTargetDuration\` | number | 500 | Duration of final static display (ms) |

### Wave Parameters

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`amplitude\` | number | 20 | Wave height in pixels (higher = more pronounced waves) |
| \`frequency\` | number | 0.05 | Wave density (higher = more waves) |
| \`speed\` | number | 2.0 | Animation speed multiplier (higher = faster motion) |
| \`waveDirectionX\` | number | 1.0 | Horizontal wave direction and intensity |
| \`waveDirectionY\` | number | 0.5 | Vertical wave direction and intensity |

### Mesh Grid

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`gridRows\` | number | 20 | Number of rows in mesh grid (higher = smoother but slower) |
| \`gridCols\` | number | 20 | Number of columns in mesh grid (higher = smoother but slower) |

## Performance Considerations

### Mesh Grid Density

The \`gridRows\` and \`gridCols\` parameters control the mesh density:
- **Low density (10x10)**: 200 triangles, best for low-end devices
- **Medium density (20x20)**: 800 triangles, balanced performance (default)
- **High density (40x40)**: 3200 triangles, best for high-end devices

Higher density provides smoother waves but requires more GPU processing.

### Performance Targets

On modern devices with decent GPUs:
- **60 FPS** with 20x20 grid (800 triangles)
- **60 FPS** with 30x30 grid (1800 triangles)
- **45-60 FPS** with 40x40 grid (3200 triangles)

On mobile devices:
- **60 FPS** with 15x15 grid (450 triangles)
- **45-60 FPS** with 20x20 grid (800 triangles)

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 56+ (full support)
- ✅ Firefox 51+ (full support)
- ✅ Safari 11+ (full support)
- ✅ Edge 79+ (full support)
- ✅ Opera 43+ (full support)

### Requirements

- **WebGL 1.0** support (required)
- **Hardware acceleration** enabled (recommended)
- **ES6 modules** support

## Credits

Inspired by the beautiful wave mesh effect created by alphardex:
https://codepen.io/alphardex/pen/RwpajRj
