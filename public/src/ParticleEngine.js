/**
 * WebGL Particle Transition Engine
 * Main engine class that coordinates rendering and particle system updates
 */
import { Renderer } from './Renderer.js';
import { ParticleSystem } from './ParticleSystem.js';
import { PresetManager } from './presets/PresetManager.js';

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
    
    // Initialize preset manager
    this.presetManager = new PresetManager();
    console.log('[ParticleEngine] Preset manager initialized');
    
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
    
    // Load the image texture for solid rendering with particle system config
    this.renderer.loadImageTexture(image, this.particleSystem.config);
    
    console.log('[ParticleEngine] Particles initialized from image');
  }

  /**
   * Set image for the engine (alias for initializeFromImage)
   * @param {HTMLImageElement} image - The image to load
   * @returns {Promise<void>}
   */
  async setImage(image) {
    return new Promise((resolve) => {
      this.initializeFromImage(image);
      resolve();
    });
  }

  /**
   * Start disintegration effect from solid image to particles
   * @param {HTMLImageElement} image - The image element
   * @param {number} duration - Disintegration duration in milliseconds (0 means no auto-animation)
   */
  initializeFromSolidImage(image, duration = 2000) {
    console.log('[ParticleEngine] Initializing from solid image with disintegration...');
    
    // Initialize particles (they will be hidden initially by opacity)
    this.particleSystem.initializeFromImage(image);
    
    // Load the image texture for solid rendering with particle system config
    this.renderer.loadImageTexture(image, this.particleSystem.config);
    
    // Start the disintegration effect only if duration > 0
    if (duration > 0) {
      this.particleSystem.startDisintegration(duration);
      console.log('[ParticleEngine] Solid image loaded, disintegration will start automatically');
    } else {
      console.log('[ParticleEngine] Solid image loaded, no auto-animation (duration = 0)');
    }
  }

  /**
   * Start the disintegration effect manually
   * @param {number} duration - Duration in milliseconds
   */
  startDisintegration(duration = 2000) {
    console.log('[ParticleEngine] Starting disintegration effect...');
    this.particleSystem.startDisintegration(duration);
  }

  /**
   * Stop the disintegration effect
   */
  stopDisintegration() {
    this.particleSystem.stopDisintegration();
  }

  /**
   * Get the current disintegration progress
   * @returns {number} Progress value from 0.0 to 1.0
   */
  getDisintegrationProgress() {
    return this.particleSystem.getDisintegrationProgress();
  }

  /**
   * Set disintegration progress manually
   * @param {number} progress - Progress value from 0.0 to 1.0
   */
  setDisintegrationProgress(progress) {
    this.particleSystem.setDisintegrationProgress(progress);
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
    
    // Update preset if active
    if (this.presetManager.hasActivePreset()) {
      const particles = this.particleSystem.getParticles();
      const dimensions = { width: this.canvas.width, height: this.canvas.height };
      this.presetManager.update(particles, deltaTime, dimensions);
    } else {
      // Update particle system (default behavior)
      this.particleSystem.update(deltaTime);
    }
    
    // Render particles with transition control
    const particles = this.particleSystem.getParticles();
    const disintegrationProgress = this.particleSystem.getDisintegrationProgress();
    
    // Calculate opacity for image and particles based on disintegration progress
    // At progress 0: image is 100% visible, particles are 0% visible
    // At progress 1: image is 0% visible, particles are 100% visible
    const imageOpacity = 1.0 - disintegrationProgress;
    const particleOpacity = disintegrationProgress;
    
    this.renderer.render(particles, {
      imageOpacity: imageOpacity,
      particleOpacity: particleOpacity
    });
    
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

  /**
   * Register a preset
   * @param {string} id - Unique identifier for the preset
   * @param {Preset} preset - Preset instance
   */
  registerPreset(id, preset) {
    this.presetManager.registerPreset(id, preset);
  }

  /**
   * Activate a preset
   * @param {string} id - Preset identifier
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  activatePreset(id, options = {}) {
    const particles = this.particleSystem.getParticles();
    const dimensions = { width: this.canvas.width, height: this.canvas.height };
    return this.presetManager.activatePreset(id, particles, dimensions, options);
  }

  /**
   * Deactivate the current preset
   */
  deactivatePreset() {
    this.presetManager.deactivateCurrentPreset();
  }

  /**
   * Get all registered presets
   * @returns {Array} Array of preset info objects
   */
  getPresets() {
    return this.presetManager.getAllPresets();
  }

  /**
   * Get the active preset ID
   * @returns {string|null} Active preset ID or null
   */
  getActivePresetId() {
    return this.presetManager.getActivePresetId();
  }

  /**
   * Transition preset to a target pattern or image
   * @param {string} targetType - 'pattern' or 'image'
   * @param {any} target - Pattern name or image element
   * @param {number} duration - Transition duration
   */
  transitionPresetTo(targetType, target, duration = 2000) {
    const particles = this.particleSystem.getParticles();
    let targets = [];

    if (targetType === 'pattern') {
      // Generate target positions based on pattern
      targets = this.particleSystem.generateTargets(target, particles.length);
    } else if (targetType === 'image') {
      // Extract image data and create targets
      const imageData = this.particleSystem.extractImageData(target, particles.length);
      targets = this.particleSystem.imageDataToTargets(imageData);
    }

    if (targets.length > 0) {
      this.presetManager.transitionTo(particles, targets, duration);
    }
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
    this.presetManager.deactivateCurrentPreset();
    this.renderer.destroy();
    
    console.log('[ParticleEngine] Engine destroyed');
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ParticleEngine = ParticleEngine;
}
