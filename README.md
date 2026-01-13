# WebGL Particle Transition Engine

A high-performance WebGL-based particle system with smooth animated transitions between different patterns. Features a simplified, user-friendly interface with View Transitions API integration for seamless visual effects.

## ✨ Features

- **WebGL Rendering**: Hardware-accelerated particle rendering for smooth 60 FPS performance
- **Multiple Patterns**: Grid, Circle, Spiral, and Random formations
- **Image-Based Particles**: Upload images and create particle formations from pixel data
- **Smooth Transitions**: Browser-native View Transitions API for seamless morphing
- **Gravity Physics**: Real-time gravity simulation affecting particle movement
- **Simplified Interface**: Clean, minimal controls for size, speed, and gravity
- **A/B Target System**: Select two targets and toggle between them with the MORPH button
- **Auto-Initialize**: Starts automatically with random particle pattern
- **Image Upload**: Dual image upload with preview and dimension display
- **Modular Design**: Clean, maintainable code structure in `src/` directory
- **Deployment Ready**: Optimized for GitHub Pages and Cloudflare Pages

## 🚀 Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/indrolend/webgl-particle-engine.git
cd webgl-particle-engine
```

2. Serve the files using a local web server (required for ES6 modules):
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000/debug.html
```

## 📖 Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Particle Engine Demo</title>
</head>
<body>
    <canvas id="canvas" width="1200" height="800"></canvas>
    
    <script type="module">
        import { ParticleEngine } from './src/ParticleEngine.js';
        
        const canvas = document.getElementById('canvas');
        const engine = new ParticleEngine(canvas, {
            particleCount: 1000,
            speed: 1.0
        });
        
        // Initialize with a pattern
        engine.initializeParticles('random');
        
        // Start the animation loop
        engine.start();
        
        // Transition to different patterns
        setTimeout(() => engine.transition('grid'), 2000);
        setTimeout(() => engine.transition('circle'), 5000);
        setTimeout(() => engine.transition('spiral'), 8000);
    </script>
</body>
</html>
```

### Configuration Options

```javascript
const engine = new ParticleEngine(canvas, {
    particleCount: 1000,  // Number of particles (100-5000)
    speed: 1.0,          // Speed multiplier (0.1-3.0)
    gravity: 0,          // Gravity force (-50 to 50, 0 = no gravity)
    autoResize: true,    // Automatically resize canvas
    minSize: 2,          // Minimum particle size
    maxSize: 8           // Maximum particle size
});
```

### Available Patterns

- **random**: Particles scattered randomly with random movement
- **grid**: Particles arranged in a uniform grid
- **circle**: Particles arranged in a circular formation
- **spiral**: Particles arranged in a spiral pattern
- **image**: Particles arranged based on uploaded image pixel data (see Image-Based Particles below)

### Animation Presets

The engine supports animation presets for complex particle behaviors:

#### School of Fish Preset

Create stunning flocking animations with three distinct phases:

```javascript
import { ParticleEngine } from './src/ParticleEngine.js';
import { SchoolOfFishPreset } from './src/presets/SchoolOfFishPreset.js';

const engine = new ParticleEngine(canvas, { particleCount: 1000 });

// Create and configure preset
const schoolOfFish = new SchoolOfFishPreset({
  explosionRadius: 300,      // How far particles scatter (100-500)
  swarmDuration: 3000,        // How long particles swarm (ms)
  alignmentStrength: 0.05,    // Steering towards neighbors' direction
  cohesionStrength: 0.02,     // Attraction to group center
  separationStrength: 0.08,   // Repulsion from close neighbors
  reformationDuration: 2000   // Transition time to target (ms)
});

// Register and activate
engine.registerPreset('schoolOfFish', schoolOfFish);
engine.activatePreset('schoolOfFish');
engine.start();

// Transition to shapes
engine.transitionPresetTo('pattern', 'circle', 2000);
```

**Phases:**
1. **Explosion**: Particles scatter outward randomly
2. **Swarming**: Flocking behavior (alignment, cohesion, separation)
3. **Reformation**: Smooth transition to target shape/image

### API Methods

#### `initializeParticles(pattern)`
Initialize particles with a specific pattern.
```javascript
engine.initializeParticles('grid');
```

#### `initializeFromImage(image)`
Initialize particles from an uploaded image.
```javascript
const img = new Image();
img.onload = () => {
    engine.initializeFromImage(img);
};
img.src = 'path/to/image.png';
```

#### `transition(pattern, duration)`
Smoothly transition to a new pattern.
```javascript
engine.transition('circle', 2000); // 2 second transition
```

#### `transitionToImage(image, duration)`
Smoothly transition particles to an uploaded image.
```javascript
const img = new Image();
img.onload = () => {
    engine.transitionToImage(img, 2000); // 2 second transition
};
img.src = 'path/to/image.png';
```

#### `start()`
Start the animation loop.
```javascript
engine.start();
```

#### `stop()`
Stop the animation loop.
```javascript
engine.stop();
```

#### `registerPreset(id, preset)`
Register a new animation preset.
```javascript
const myPreset = new SchoolOfFishPreset({ ... });
engine.registerPreset('myPreset', myPreset);
```

#### `activatePreset(id, options)`
Activate a registered preset.
```javascript
engine.activatePreset('schoolOfFish');
```

#### `deactivatePreset()`
Deactivate the current preset and return to default behavior.
```javascript
engine.deactivatePreset();
```

#### `transitionPresetTo(type, target, duration)`
Transition active preset to a pattern or image.
```javascript
// Transition to pattern
engine.transitionPresetTo('pattern', 'circle', 2000);

// Transition to image
engine.transitionPresetTo('image', imageElement, 2000);
```

#### `getPresets()`
Get all registered presets.
```javascript
const presets = engine.getPresets();
```

#### `updateConfig(config)`
Update engine configuration at runtime.
```javascript
engine.updateConfig({
    particleCount: 2000,
    speed: 1.5
});
```

#### `resize(width, height)`
Manually resize the canvas.
```javascript
engine.resize(1920, 1080);
```

#### `getParticleCount()`
Get the current number of particles.
```javascript
const count = engine.getParticleCount();
```

#### `getFPS()`
Get the current frames per second.
```javascript
const fps = engine.getFPS();
```

#### `destroy()`
Clean up resources and stop the engine.
```javascript
engine.destroy();
```

## 🖼️ Image-Based Particles

The engine supports creating particle formations from uploaded images. This feature extracts pixel data from images and maps particles to visible pixels, creating stunning visual effects.

### Features

- **Automatic Grid Optimization**: Images are automatically sampled to an optimal grid size (10x10 to 200x200) based on particle count
- **Aspect Ratio Preservation**: Images maintain their aspect ratio when rendered as particles
- **Performance Optimized**: Large images are downsampled for efficient particle rendering
- **Opacity Filtering**: Only pixels with sufficient opacity (>0.1) are included
- **Smooth Transitions**: Morph between different images with color and position interpolation
- **Intelligent Distribution**: When particle count exceeds pixel count, particles are distributed with slight random offsets

### Usage Example

```javascript
// Create engine
const engine = new ParticleEngine(canvas, {
    particleCount: 1000,
    speed: 1.0
});

// Load first image
const image1 = new Image();
image1.onload = () => {
    engine.initializeFromImage(image1);
    engine.start();
};
image1.src = 'image1.png';

// Later, transition to second image
const image2 = new Image();
image2.onload = () => {
    engine.transitionToImage(image2, 2000); // 2 second transition
};
image2.src = 'image2.png';
```

### Debug Interface

The debug interface (`debug.html`) includes a dedicated **Image Upload** section where you can:
1. Upload two images using file input controls
2. Preview uploaded images with dimensions displayed
3. Initialize particles from Image 1
4. Smoothly transition to Image 2
5. View debug logs showing extraction and particle creation details

## 🎮 Simplified Debug Interface

The `debug.html` file provides a clean, minimalist interface for particle control:

### Features:
- **Particle Controls**: 
  - Size adjustment (1-20)
  - Speed multiplier (0.1-3.0)
  - Gravity control (-50 to 50)
- **A/B Target System**: Select two targets (patterns or images) and toggle between them
- **Transition Targets**: Grid, Circle, Spiral, Random patterns
- **Image Upload**: Upload and preview two images for particle transitions
- **MORPH Button**: Large, centered button to trigger transitions between selected targets
- **Real-time Info**: View particle count and FPS
- **Auto-Initialize**: Engine starts automatically with random pattern

### How to Use:
1. **Adjust Controls**: Use sliders to modify particle size, speed, and gravity in real-time
2. **Select Targets**: Click pattern or image buttons to cycle through target selections (A → B → Both → None)
3. **Upload Images**: Choose image files to use as transition targets
4. **Press MORPH**: Click the large pink MORPH button to transition between selected A/B targets
5. **Watch Performance**: Monitor FPS and particle count in the info panel

### View Transitions API Integration:
The interface uses the browser-native View Transitions API for smooth, seamless transitions between states. When supported by the browser, transitions are hardware-accelerated for optimal performance.

## 🏗️ Project Structure

```
webgl-particle-engine/
├── src/
│   ├── ParticleEngine.js          # Main engine coordinator
│   ├── ParticleSystem.js          # Particle management and transitions
│   ├── Renderer.js                # WebGL rendering
│   ├── ViewTransitionsHelper.js   # View Transitions API integration
│   └── presets/                   # Animation presets
│       ├── Preset.js              # Base preset class
│       ├── PresetManager.js       # Preset management system
│       ├── SchoolOfFishPreset.js  # School of Fish implementation
│       └── index.js               # Module exports
├── examples/                      # Example implementations
│   └── school-of-fish-demo.html
├── public/                        # Static assets (if needed)
├── debug.html                    # Simplified interactive interface
├── index.html                    # Landing page
└── README.md                     # Documentation
```

## 🎨 Architecture

### ParticleEngine.js
Main engine class that coordinates the renderer and particle system. Handles:
- Initialization and configuration
- Animation loop management
- Preset management and lifecycle
- FPS tracking
- High-level API

### ParticleSystem.js
Manages particle states and transitions. Features:
- Multiple pattern generators
- Smooth transition animations with easing
- Particle physics and movement with gravity support
- Preset-compatible target generation
- Configurable parameters

### Renderer.js
WebGL rendering implementation. Handles:
- WebGL context setup
- Shader compilation and linking
- Buffer management
- Efficient particle rendering

### ViewTransitionsHelper.js
Browser-native View Transitions API integration:
- Feature detection and fallback support
- Smooth cross-fade transitions between states
- Particle animation synchronization with DOM updates
- Optimized for performance with hardware acceleration

### Presets System
Modular animation preset architecture:
- **Preset.js**: Abstract base class defining preset lifecycle
- **PresetManager.js**: Centralized preset registration and activation
- **SchoolOfFishPreset.js**: Flocking algorithm implementation with explosion, swarming, and reformation phases
- Easily extensible for custom behaviors

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select the branch to deploy (e.g., `main`)
4. Save and wait for deployment
5. Access at: `https://yourusername.github.io/webgl-particle-engine/debug.html`

### Cloudflare Pages

#### Quick Deploy with Wrangler CLI:
```bash
# Build the project
./build.sh

# Deploy to Cloudflare Pages
npx wrangler pages deploy ./public --project-name=webgl-particle-engine
```

#### Git Integration (Auto-deploy):
1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `./build.sh`
   - **Build output directory**: `public`
3. Deploy and access your site

See [DEPLOYMENT.md](DEPLOYMENT.md) for advanced deployment options including Workers integration.

### Static Hosting

The project consists of static files and can be hosted on any web server:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- Any web server supporting static files

**Important**: Ensure your server supports ES6 modules and serves files with correct MIME types.

## 🐛 Debugging

### Enable Detailed Logging

The engine includes comprehensive logging throughout. All log messages are prefixed with their source:
- `[ParticleEngine]`: Main engine events
- `[Renderer]`: WebGL and rendering events
- `[ParticleSystem]`: Particle management events

### Common Issues

**1. WebGL not supported**
- Ensure you're using a modern browser with WebGL support
- Check if hardware acceleration is enabled

**2. ES6 module errors**
- Must serve files through a web server (not `file://` protocol)
- Ensure server sends correct MIME types for `.js` files

**3. Performance issues**
- Reduce particle count for better performance
- Check browser console for errors
- Monitor FPS in the debug interface

## 🎯 Performance

- Efficiently renders up to 5000 particles at 60 FPS on modern hardware
- Hardware-accelerated WebGL rendering
- Optimized shader code for particle effects
- Dynamic buffer updates for smooth animations

## 📊 Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (WebGL 1.0)
- Mobile browsers: Supported (may have performance limitations)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🔗 Links

- **Repository**: https://github.com/indrolend/webgl-particle-engine
- **Issues**: https://github.com/indrolend/webgl-particle-engine/issues

## 💡 Tips

- Start with fewer particles (500-1000) and increase based on performance
- Use longer transition durations (2000-3000ms) for smoother effects
- The debug interface is great for experimentation and demos
- Check the browser console for detailed logging output
