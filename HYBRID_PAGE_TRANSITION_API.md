# HybridPageTransitionAPI Documentation

## Overview

The `HybridPageTransitionAPI` provides a high-level interface for creating stunning particle-based page transitions using WebGL. It handles DOM capture, texture management, performance optimization, and provides a clean API for seamless page transitions with explosion and recombination effects.

## Features

- ✨ **DOM Capture**: Automatically captures page states using html2canvas
- 💥 **Multi-Phase Transitions**: Disintegrate → Explode → Recombine → Blend
- 🚀 **Performance Optimization**: Automatically adjusts settings based on device capabilities
- 🎮 **Debug Controls**: Real-time parameter adjustment via debug panel
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔄 **WebGL Fallback**: Graceful CSS-based fallback for non-WebGL browsers
- 🎯 **Modular Design**: Clean, maintainable architecture

## Installation

### Via NPM

```bash
npm install html2canvas
```

Then import the API in your project:

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';
```

### Via CDN

Include html2canvas in your HTML:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

## Quick Start

### Basic Setup

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

// Create API instance
const transitionAPI = new HybridPageTransitionAPI({
    autoOptimize: true,
    showDebugPanel: true
});

// Initialize
await transitionAPI.initialize();

// Transition between pages
await transitionAPI.transition(
    document.getElementById('page1'),
    document.getElementById('page2')
);
```

### Using Pre-Rendered Images

If you don't want to use html2canvas, you can transition between pre-rendered images:

```javascript
const img1 = new Image();
img1.src = 'page1.png';

const img2 = new Image();
img2.src = 'page2.png';

await transitionAPI.transitionImages(img1, img2);
```

## Configuration Options

### Constructor Options

```javascript
const transitionAPI = new HybridPageTransitionAPI({
    // Canvas settings
    canvasId: 'transition-canvas',           // Canvas element ID
    canvasWidth: window.innerWidth,          // Canvas width
    canvasHeight: window.innerHeight,        // Canvas height
    
    // Performance settings
    autoOptimize: true,                      // Auto-optimize based on device
    particleCount: 2000,                     // Number of particles
    
    // Transition settings
    explosionDuration: 800,                  // Explosion phase duration (ms)
    recombinationDuration: 2000,             // Recombination duration (ms)
    explosionIntensity: 150,                 // Explosion force (50-300)
    
    // html2canvas settings
    html2canvasOptions: {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    },
    
    // Debug settings
    debug: true,                             // Enable debug logging
    showDebugPanel: true,                    // Show debug control panel
    
    // Fallback settings
    enableFallback: true,                    // Enable CSS fallback
    fallbackDuration: 500                    // Fallback transition duration (ms)
});
```

## API Methods

### `initialize()`

Initialize the API and create the canvas.

```javascript
await transitionAPI.initialize();
```

**Returns**: `Promise<void>`

---

### `transition(currentElement, nextElement, options)`

Transition from current page element to next page element using DOM capture.

```javascript
await transitionAPI.transition(
    document.getElementById('page1'),
    document.getElementById('page2'),
    {
        staticDisplayDuration: 300,      // Static display before transition (ms)
        disintegrationDuration: 800,     // Disintegration effect duration (ms)
        explosionTime: 700,              // Explosion duration (ms)
        recombinationDuration: 1800,     // Recombination duration (ms)
        blendDuration: 1200,             // Blend to final state (ms)
        finalStaticDuration: 300         // Static display after transition (ms)
    }
);
```

**Parameters**:
- `currentElement` (HTMLElement|string): Current page element or selector
- `nextElement` (HTMLElement|string): Next page element or selector
- `options` (Object): Optional transition parameters

**Returns**: `Promise<void>`

---

### `transitionImages(currentImage, nextImage, options)`

Transition between pre-rendered images or canvas elements.

```javascript
await transitionAPI.transitionImages(img1, img2, {
    explosionTime: 700,
    recombinationDuration: 1800
});
```

**Parameters**:
- `currentImage` (HTMLImageElement|HTMLCanvasElement): Current page image
- `nextImage` (HTMLImageElement|HTMLCanvasElement): Next page image
- `options` (Object): Optional transition parameters

**Returns**: `Promise<void>`

---

### `updateConfig(config)`

Update API configuration dynamically.

```javascript
transitionAPI.updateConfig({
    particleCount: 3000,
    explosionIntensity: 200
});
```

**Parameters**:
- `config` (Object): Configuration updates

---

### `optimizeForPerformance()`

Manually trigger performance optimization.

```javascript
transitionAPI.optimizeForPerformance();
```

Called automatically when `autoOptimize` is enabled.

---

### `getConfig()`

Get current configuration.

```javascript
const config = transitionAPI.getConfig();
console.log(config.particleCount); // 2000
```

**Returns**: `Object` - Current configuration

---

### `getPerformanceInfo()`

Get device performance information.

```javascript
const perfInfo = transitionAPI.getPerformanceInfo();
console.log(perfInfo.level);        // 'high', 'medium', or 'low'
console.log(perfInfo.capabilities); // WebGL support, etc.
console.log(perfInfo.profile);      // Recommended settings
```

**Returns**: `Object` - Performance information

---

### `clearCache()`

Clear texture cache.

```javascript
transitionAPI.clearCache();
```

---

### `destroy()`

Clean up resources and destroy the API instance.

```javascript
transitionAPI.destroy();
```

## Transition Phases

The API implements a multi-phase transition system:

### 1. Static Display
Shows the source page briefly before starting the transition.
- Duration: `staticDisplayDuration` (default: 300ms)

### 2. Disintegration
Smooth fade from solid image to particles with radial dispersion.
- Duration: `disintegrationDuration` (default: 800ms)
- Effect: Image opacity 100% → 0%, Particle opacity 0% → 100%

### 3. Explosion
Particles scatter in random directions with adjustable intensity.
- Duration: `explosionTime` (default: 700ms)
- Intensity: `explosionIntensity` (default: 150)

### 4. Recombination
Particles are pulled together to form the target image shape.
- Duration: `recombinationDuration` (default: 1800ms)
- Uses vacuum force physics for realistic movement

### 5. Blend
Gradual crossfade from particle rendering to triangulation rendering.
- Duration: `blendDuration` (default: 1200ms)

### 6. Final Static
Shows the target page in its final state.
- Duration: `finalStaticDuration` (default: 300ms)

## Performance Optimization

The API includes a `DevicePerformance` module that automatically detects device capabilities and adjusts settings:

### Performance Levels

**High-End Devices** (Desktop with 8+ cores, 8+ GB RAM):
- Particle Count: 3000
- Canvas Scale: 1.0
- Transition Duration: 2000ms
- Explosion Intensity: 200

**Medium Devices** (Desktop with 4+ cores or 4+ GB RAM):
- Particle Count: 2000
- Canvas Scale: 0.8
- Transition Duration: 2400ms
- Explosion Intensity: 150

**Low-End Devices** (Budget hardware, older devices):
- Particle Count: 1000
- Canvas Scale: 0.6
- Transition Duration: 3000ms
- Explosion Intensity: 100

### Manual Optimization

```javascript
// Get recommended settings for current device
const profile = transitionAPI.getPerformanceInfo().profile;

// Apply custom settings
transitionAPI.updateConfig({
    particleCount: profile.particleCount,
    explosionIntensity: profile.explosionIntensity
});
```

## Debug Panel

When `showDebugPanel: true`, a real-time control panel is displayed with:

- **Particle Count Slider**: Adjust particle count (500-5000)
- **Explosion Duration Slider**: Adjust explosion time (300-2000ms)
- **Recombination Duration Slider**: Adjust recombination time (1000-4000ms)
- **Explosion Intensity Slider**: Adjust explosion force (50-300)
- **Performance Info**: Current device performance level
- **WebGL Status**: WebGL support indicator
- **Status Display**: Current API status

All changes are applied in real-time.

## WebGL Fallback

The API includes automatic fallback for browsers without WebGL support:

### CSS Fade Transition

When WebGL is not available, the API uses a simple CSS-based fade transition:

```javascript
// Fallback is automatic, but you can configure it
const transitionAPI = new HybridPageTransitionAPI({
    enableFallback: true,
    fallbackDuration: 500  // Fade duration in ms
});
```

The fallback provides a smooth user experience while maintaining functionality.

## Examples

### Example 1: Simple Page Transition

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

const api = new HybridPageTransitionAPI({
    autoOptimize: true
});

await api.initialize();

// Transition on button click
document.getElementById('nextBtn').addEventListener('click', async () => {
    await api.transition('#page1', '#page2');
});
```

### Example 2: Custom Transition Settings

```javascript
const api = new HybridPageTransitionAPI({
    particleCount: 3000,
    explosionIntensity: 200,
    showDebugPanel: true
});

await api.initialize();

await api.transition('#current-page', '#next-page', {
    explosionTime: 1000,
    recombinationDuration: 2500,
    explosionIntensity: 250
});
```

### Example 3: Pre-Rendered Images

```javascript
const api = new HybridPageTransitionAPI();
await api.initialize();

// Create page snapshots
const canvas1 = document.createElement('canvas');
const ctx1 = canvas1.getContext('2d');
// ... render page 1 to canvas1

const canvas2 = document.createElement('canvas');
const ctx2 = canvas2.getContext('2d');
// ... render page 2 to canvas2

// Transition between canvases
await api.transitionImages(canvas1, canvas2);
```

### Example 4: With Performance Monitoring

```javascript
const api = new HybridPageTransitionAPI({
    debug: true,
    showDebugPanel: true
});

await api.initialize();

// Check performance
const perf = api.getPerformanceInfo();
console.log('Device Performance:', perf.level);
console.log('Recommended particles:', perf.profile.particleCount);

// Log before transition
console.log('Starting transition...');
await api.transition('#page1', '#page2');
console.log('Transition complete!');
```

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (WebGL 1.0)
- **Mobile Browsers**: Supported with performance adjustments
- **Non-WebGL Browsers**: CSS fallback

## Best Practices

1. **Use Auto-Optimization**: Enable `autoOptimize: true` for best performance across devices
2. **Cache Textures**: Reuse captured textures when possible
3. **Test on Mobile**: Always test on mobile devices for performance
4. **Adjust Particle Count**: Lower particle counts for better performance on low-end devices
5. **Monitor Console**: Enable `debug: true` during development
6. **Use Pre-Rendered Images**: For better performance, pre-render pages as images instead of using html2canvas

## Troubleshooting

### html2canvas fails to load

**Solution**: Ensure html2canvas is properly included in your project:

```javascript
// Install via npm
npm install html2canvas

// Or include via CDN
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### Transitions are slow on mobile

**Solution**: Enable auto-optimization or manually reduce particle count:

```javascript
const api = new HybridPageTransitionAPI({
    autoOptimize: true,
    particleCount: 1000  // Lower for mobile
});
```

### WebGL context lost

**Solution**: The API handles context loss automatically, but you can reinitialize if needed:

```javascript
transitionAPI.destroy();
transitionAPI = new HybridPageTransitionAPI(config);
await transitionAPI.initialize();
```

## License

MIT License - See project LICENSE file for details.
