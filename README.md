# WebGL Particle Transition Engine

A high-performance WebGL-based particle system with smooth animated transitions between different patterns. Features a modular architecture with detailed logging and a comprehensive debug interface.

## ✨ Features

- **WebGL Rendering**: Hardware-accelerated particle rendering for smooth performance
- **Multiple Patterns**: Grid, Circle, Spiral, and Random formations
- **Smooth Transitions**: Animated transitions between patterns with easing
- **Configurable**: Adjustable particle count, speed, and size
- **Debug Interface**: Interactive HTML panel with real-time controls and logging
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

### API Methods

#### `initializeParticles(pattern)`
Initialize particles with a specific pattern.
```javascript
engine.initializeParticles('grid');
```

#### `transition(pattern, duration)`
Smoothly transition to a new pattern.
```javascript
engine.transition('circle', 2000); // 2 second transition
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

## 🎮 Debug Interface

The `debug.html` file provides an interactive interface for testing and debugging:

### Features:
- **Configuration Panel**: Adjust particle count and speed with sliders
- **Pattern Initialization**: Test different initial patterns
- **Transition Controls**: Trigger transitions between patterns
- **Engine Controls**: Start, stop, and reconfigure the engine
- **Real-time Info**: View particle count and FPS
- **Debug Log**: See detailed console output in the UI

### Controls:
1. **Initialize Engine**: Create a new engine instance with current settings
2. **Pattern Buttons**: Initialize particles in specific formations
3. **Transition Buttons**: Smoothly animate to different patterns
4. **Start/Stop**: Control the animation loop
5. **Apply Config**: Update engine with new configuration
6. **Clear Log**: Clear the debug console output

## 🏗️ Project Structure

```
webgl-particle-engine/
├── src/
│   ├── ParticleEngine.js   # Main engine coordinator
│   ├── ParticleSystem.js   # Particle management and transitions
│   └── Renderer.js         # WebGL rendering
├── public/                 # Static assets (if needed)
├── debug.html             # Interactive debug interface
└── README.md              # Documentation
```

## 🎨 Architecture

### ParticleEngine.js
Main engine class that coordinates the renderer and particle system. Handles:
- Initialization and configuration
- Animation loop management
- FPS tracking
- High-level API

### ParticleSystem.js
Manages particle states and transitions. Features:
- Multiple pattern generators
- Smooth transition animations with easing
- Particle physics and movement
- Configurable parameters

### Renderer.js
WebGL rendering implementation. Handles:
- WebGL context setup
- Shader compilation and linking
- Buffer management
- Efficient particle rendering

## 🌐 Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select the branch to deploy (e.g., `main`)
4. Save and wait for deployment
5. Access at: `https://yourusername.github.io/webgl-particle-engine/debug.html`

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: (none)
   - **Build output directory**: `/`
3. Deploy and access your site

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
