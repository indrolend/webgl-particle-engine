/**
 * WebGL Particle Transition Engine
 * Main engine class that coordinates rendering and particle system updates
 */
import { Renderer } from '../renderer/Renderer.js';
import { ParticleSystem } from '../ParticleSystem.js';

export class ParticleEngine {
  constructor(canvas, config = {}) {
    console.log('[ParticleEngine] Initializing Particle Transition Engine...');
    
    this.canvas = canvas;
    this.config = {
      particleCount: config.particleCount || 1000,
      speed: config.speed || 1.0,
      autoResize: config.autoResize !== false,
      ...config
    };
    
    this.isRunning = false;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    
    // Initialize renderer
    try {
      this.renderer = new Renderer(canvas);
      console.log('[ParticleEngine] Renderer initialized');
    } catch (error) {
      console.error('[ParticleEngine] Failed to initialize renderer:', error);
      throw error;
    }
    
    // Initialize particle system
    this.particleSystem = new ParticleSystem({
      particleCount: this.config.particleCount,
      speed: this.config.speed
    });
    this.particleSystem.setDimensions(canvas.width, canvas.height);
    console.log('[ParticleEngine] Particle system initialized');
    
    // Setup auto-resize if enabled
    if (this.config.autoResize) {
      this.setupAutoResize();
    }
    
    console.log('[ParticleEngine] Initialization complete');
    console.log('[ParticleEngine] Config:', this.config);
  }

  setupAutoResize() {
    const resizeHandler = () => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.resize(width, height);
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    resizeHandler(); // Initial resize
    
    console.log('[ParticleEngine] Auto-resize enabled');
  }

  resize(width, height) {
    console.log(`[ParticleEngine] Resizing to ${width}x${height}`);
    this.renderer.resize(width, height);
    this.particleSystem.setDimensions(width, height);
  }

  initializeParticles(pattern = 'random') {
    console.log(`[ParticleEngine] Initializing particles with pattern: ${pattern}`);
    
    switch (pattern) {
      case 'random':
        this.particleSystem.initializeRandom();
        break;
      case 'grid':
        this.particleSystem.initializeGrid();
        break;
      case 'circle':
        this.particleSystem.initializeCircle();
        break;
      case 'spiral':
        this.particleSystem.initializeSpiral();
        break;
      default:
        console.warn(`[ParticleEngine] Unknown pattern: ${pattern}, using random`);
        this.particleSystem.initializeRandom();
    }
    
    console.log('[ParticleEngine] Particles initialized');
  }

  /**
   * Initialize particles from an image
   * @param {HTMLImageElement} image - The image element
   */
  initializeFromImage(image) {
    console.log('[ParticleEngine] Initializing particles from image...');
    this.particleSystem.initializeFromImage(image);
    console.log('[ParticleEngine] Particles initialized from image');
  }

  transition(pattern, duration = 2000) {
    console.log(`[ParticleEngine] Transitioning to ${pattern} (${duration}ms)`);
    
    switch (pattern) {
      case 'grid':
        this.particleSystem.transitionToGrid(duration);
        break;
      case 'circle':
        this.particleSystem.transitionToCircle(duration);
        break;
      case 'spiral':
        this.particleSystem.transitionToSpiral(duration);
        break;
      case 'random':
        this.particleSystem.transitionToRandom(duration);
        break;
      default:
        console.warn(`[ParticleEngine] Unknown pattern: ${pattern}`);
    }
  }

  /**
   * Transition particles to an image
   * @param {HTMLImageElement} image - The target image element
   * @param {number} duration - Transition duration in milliseconds
   */
  transitionToImage(image, duration = 2000) {
    console.log('[ParticleEngine] Transitioning to image...');
    this.particleSystem.transitionToImage(image, duration);
  }

  start() {
    if (this.isRunning) {
      console.warn('[ParticleEngine] Engine already running');
      return;
    }
    
    console.log('[ParticleEngine] Starting animation loop...');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsUpdateTime = this.lastTime;
    this.frameCount = 0;
    this.animate();
  }

  stop() {
    console.log('[ParticleEngine] Stopping animation loop...');
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
    
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Render particles
    const particles = this.particleSystem.getParticles();
    this.renderer.render(particles);
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  updateConfig(newConfig) {
    console.log('[ParticleEngine] Updating configuration:', newConfig);
    
    if (newConfig.particleCount !== undefined || newConfig.speed !== undefined) {
      this.particleSystem.updateConfig(newConfig);
    }
    
    this.config = { ...this.config, ...newConfig };
  }

  getParticleCount() {
    return this.particleSystem.getParticles().length;
  }

  getFPS() {
    return this.fps;
  }

  destroy() {
    console.log('[ParticleEngine] Destroying engine...');
    
    this.stop();
    this.renderer.destroy();
    
    console.log('[ParticleEngine] Engine destroyed');
  }
}

// Legacy browser support - export to window for non-module scripts
// Note: This is maintained for backward compatibility with debug.html
// Consider migrating to full ES6 module usage in all scripts
if (typeof window !== 'undefined') {
  window.ParticleEngine = ParticleEngine;
}
