/**
 * HybridEngine - Extended ParticleEngine with triangulation morphing support
 * Combines particle-based and triangulation-based image morphing
 */
import { ParticleEngine } from './ParticleEngine.js';
import { TriangulationMorph } from './triangulation/TriangulationMorph.js';
import { TriangulationRenderer } from './triangulation/TriangulationRenderer.js';
import { HybridTransitionPreset } from './presets/HybridTransitionPreset.js';

// Constants
const DEFAULT_STATIC_DISPLAY_DURATION = 500; // ms - how long to show static image before atomization

export class HybridEngine extends ParticleEngine {
  constructor(canvas, config = {}) {
    // Initialize parent ParticleEngine
    super(canvas, {
      ...config,
      enableTriangulation: config.enableTriangulation !== false
    });
    
    console.log('[HybridEngine] Initializing hybrid rendering system...');
    
    // Triangulation-specific configuration
    this.triangulationConfig = {
      enabled: config.enableTriangulation !== false,
      mode: config.triangulationMode || 'hybrid', // 'particles', 'triangulation', or 'hybrid'
      keyPointMethod: config.keyPointMethod || 'grid', // 'grid' or 'feature'
      gridSize: config.gridSize || 8,
      featurePointCount: config.featurePointCount || 64,
      blendMode: config.blendMode || 'crossfade', // 'crossfade' or 'overlay'
      particleOpacity: config.particleOpacity !== undefined ? config.particleOpacity : 0.5,
      triangleOpacity: config.triangleOpacity !== undefined ? config.triangleOpacity : 0.5
    };
    
    // Initialize triangulation components
    this.triangulationMorph = null;
    this.triangulationRenderer = null;
    this.triangulationImages = {
      source: null,
      target: null
    };
    this.triangulationTransition = {
      isActive: false,
      progress: 0,
      duration: 0,
      startTime: 0
    };
    
    // Hybrid transition state for bidirectional support
    this.hybridTransitionState = null;
    
    // Static image display state
    this.staticImageState = {
      isDisplaying: false,
      image: null,
      startTime: 0,
      displayDuration: 0
    };
    
    // Create overlay canvas for static image display
    this.staticImageCanvas = document.createElement('canvas');
    this.staticImageCanvas.style.position = 'absolute';
    this.staticImageCanvas.style.pointerEvents = 'none';
    this.staticImageCanvas.style.display = 'none';
    
    // Position overlay canvas on top of main canvas
    if (this.canvas.parentElement) {
      // Match main canvas dimensions and position
      this.staticImageCanvas.width = this.canvas.width;
      this.staticImageCanvas.height = this.canvas.height;
      this.staticImageCanvas.style.left = this.canvas.offsetLeft + 'px';
      this.staticImageCanvas.style.top = this.canvas.offsetTop + 'px';
      this.canvas.parentElement.appendChild(this.staticImageCanvas);
    }
    
    // Reusable Map for storing original alpha values (optimization)
    this.originalAlphasCache = new Map();
    
    if (this.triangulationConfig.enabled) {
      this.initializeTriangulation();
    }
    
    console.log('[HybridEngine] Hybrid engine initialized');
    console.log('[HybridEngine] Triangulation config:', this.triangulationConfig);
  }

  /**
   * Initialize triangulation components
   */
  initializeTriangulation() {
    console.log('[HybridEngine] Initializing triangulation system...');
    
    try {
      this.triangulationMorph = new TriangulationMorph({
        keyPointMethod: this.triangulationConfig.keyPointMethod,
        gridSize: this.triangulationConfig.gridSize,
        featurePointCount: this.triangulationConfig.featurePointCount
      });
      
      this.triangulationRenderer = new TriangulationRenderer(this.canvas);
      
      console.log('[HybridEngine] Triangulation system initialized');
    } catch (error) {
      console.error('[HybridEngine] Failed to initialize triangulation:', error);
      this.triangulationConfig.enabled = false;
    }
  }

  /**
   * Set rendering mode
   * @param {string} mode - 'particles', 'triangulation', or 'hybrid'
   */
  setRenderMode(mode) {
    if (['particles', 'triangulation', 'hybrid'].includes(mode)) {
      this.triangulationConfig.mode = mode;
      console.log(`[HybridEngine] Render mode set to: ${mode}`);
    } else {
      console.warn(`[HybridEngine] Invalid render mode: ${mode}`);
    }
  }

  /**
   * Initialize from image with hybrid support
   * @param {HTMLImageElement} image 
   * @param {Object} options 
   */
  initializeFromImage(image, options = {}) {
    console.log('[HybridEngine] Initializing from image with hybrid support...');
    
    // Initialize particles (parent behavior)
    super.initializeFromImage(image);
    
    // Store as source image for triangulation
    if (this.triangulationConfig.enabled) {
      this.triangulationImages.source = image;
      console.log('[HybridEngine] Source image stored for triangulation');
    }
  }

  /**
   * Transition to image with hybrid support
   * @param {HTMLImageElement} image 
   * @param {number} duration 
   * @param {Object} options 
   */
  transitionToImage(image, duration = 2000, options = {}) {
    console.log('[HybridEngine] Transitioning to image with hybrid support...');
    
    // Start particle transition (parent behavior)
    super.transitionToImage(image, duration);
    
    // Setup triangulation transition
    if (this.triangulationConfig.enabled && this.triangulationImages.source) {
      this.triangulationImages.target = image;
      
      // Initialize triangulation morph
      this.triangulationMorph.setImages(
        this.triangulationImages.source,
        this.triangulationImages.target
      );
      
      // Create textures
      this.triangulationRenderer.createTexture(this.triangulationImages.source, 'source');
      this.triangulationRenderer.createTexture(this.triangulationImages.target, 'target');
      
      // Start triangulation transition
      this.triangulationTransition = {
        isActive: true,
        progress: 0,
        duration: duration,
        startTime: performance.now()
      };
      
      console.log('[HybridEngine] Triangulation transition started');
    }
  }

  /**
   * Update triangulation transition progress
   * @param {number} currentTime 
   */
  updateTriangulationTransition(currentTime) {
    if (!this.triangulationTransition.isActive) {
      return;
    }
    
    const elapsed = currentTime - this.triangulationTransition.startTime;
    const progress = Math.min(elapsed / this.triangulationTransition.duration, 1.0);
    
    this.triangulationTransition.progress = progress;
    
    if (progress >= 1.0) {
      this.triangulationTransition.isActive = false;
      // Swap source and target for next transition
      this.triangulationImages.source = this.triangulationImages.target;
      console.log('[HybridEngine] Triangulation transition complete');
    }
  }

  /**
   * Enhanced animate method with hybrid rendering
   */
  animate() {
    if (!this.isRunning) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
    
    // Check if static image display is complete
    if (this.staticImageState.isDisplaying) {
      const elapsed = currentTime - this.staticImageState.startTime;
      if (elapsed >= this.staticImageState.displayDuration) {
        // Time to atomize into particles
        console.log('[HybridEngine] Static image display complete, atomizing into particles...');
        this.staticImageState.isDisplaying = false;
        
        // Hide the static image overlay
        this.hideStaticImage();
        
        // Initialize particles from the static image
        this.initializeFromImage(this.staticImageState.image);
        
        // Start the hybrid transition preset
        if (this.staticImageState.onComplete) {
          this.staticImageState.onComplete();
        }
      }
    }
    
    // Update triangulation transition
    if (this.triangulationConfig.enabled) {
      this.updateTriangulationTransition(currentTime);
    }
    
    // Update particles (preset or default)
    if (this.presetManager.hasActivePreset()) {
      const particles = this.particleSystem.getParticles();
      const dimensions = { width: this.canvas.width, height: this.canvas.height };
      this.presetManager.update(particles, deltaTime, dimensions);
    } else {
      this.particleSystem.update(deltaTime);
    }
    
    // Render based on mode
    this.renderHybrid();
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Hybrid rendering combining particles and triangulation
   */
  renderHybrid() {
    // If displaying static image, render it and return
    if (this.staticImageState.isDisplaying && this.staticImageState.image) {
      this.renderStaticImage(this.staticImageState.image);
      return;
    }
    
    // Check if in final static phase (show target image as static)
    if (this.presetManager.hasActivePreset()) {
      const activePreset = this.presetManager.getActivePreset();
      if (activePreset && typeof activePreset.isInFinalStatic === 'function' && activePreset.isInFinalStatic()) {
        // Display target image as solid static image
        if (this.hybridTransitionState && this.hybridTransitionState.targetImage) {
          this.renderStaticImage(this.hybridTransitionState.targetImage);
          return;
        }
      }
    }
    
    const mode = this.triangulationConfig.mode;
    const particles = this.particleSystem.getParticles();
    
    // Check if HybridTransitionPreset is active and in blend phase
    let dynamicTriangleOpacity = this.triangulationConfig.triangleOpacity;
    let dynamicParticleOpacity = this.triangulationConfig.particleOpacity;
    
    if (this.presetManager.hasActivePreset()) {
      const activePreset = this.presetManager.getActivePreset();
      if (activePreset && typeof activePreset.getBlendProgress === 'function') {
        const blendProgress = activePreset.getBlendProgress();
        if (blendProgress > 0) {
          // During blend phase, increase triangulation opacity as particles fade
          dynamicTriangleOpacity = blendProgress;
          dynamicParticleOpacity = Math.max(0.1, 1.0 - blendProgress * 0.7);
        }
      }
    }
    
    // Render triangulation (if enabled and active)
    if (this.triangulationConfig.enabled && 
        (mode === 'triangulation' || mode === 'hybrid') &&
        this.triangulationMorph &&
        this.triangulationMorph.isReady() &&
        this.triangulationImages.source &&
        this.triangulationImages.target) {
      
      const morphData = this.triangulationMorph.getTriangulationData();
      let progress = this.triangulationTransition.progress;
      
      // Apply easing for smooth transition
      progress = this.easeInOutCubic(progress);
      
      // Apply dynamic opacity during blend phase
      if (this.triangulationRenderer && typeof this.triangulationRenderer.setOpacity === 'function') {
        this.triangulationRenderer.setOpacity(dynamicTriangleOpacity);
      }
      
      this.triangulationRenderer.clear(0, 0, 0, 0);
      this.triangulationRenderer.render(morphData, progress, 'source', 'target');
    } else if (this.triangulationConfig.enabled && 
               (mode === 'triangulation' || mode === 'hybrid') &&
               (!this.triangulationMorph || !this.triangulationMorph.isReady())) {
      // Triangulation not ready - clear to prevent artifacts
      this.triangulationRenderer.clear(0, 0, 0, 0);
    }
    
    // Render particles (if enabled)
    if (mode === 'particles' || mode === 'hybrid') {
      // Adjust particle opacity in hybrid mode
      if (mode === 'hybrid' && this.triangulationConfig.enabled) {
        // Clear and reuse cache for original alpha values
        this.originalAlphasCache.clear();
        particles.forEach((p, i) => {
          this.originalAlphasCache.set(i, p.alpha);
          p.alpha = p.alpha * dynamicParticleOpacity;
        });
      }
      
      this.renderer.render(particles);
      
      // Restore original alpha values
      if (mode === 'hybrid' && this.triangulationConfig.enabled) {
        particles.forEach((p, i) => {
          p.alpha = this.originalAlphasCache.get(i);
        });
      }
    }
  }

  /**
   * Render a static image on an overlay canvas (for pre-explosion display)
   * Uses a 2D canvas overlay to display the image clearly and reliably
   * @param {HTMLImageElement} image - The image to render
   */
  renderStaticImage(image) {
    if (!this.staticImageCanvas) {
      return;
    }
    
    // Show the overlay canvas
    this.staticImageCanvas.style.display = 'block';
    
    // Get 2D context from overlay canvas
    const ctx = this.staticImageCanvas.getContext('2d');
    
    // Clear the overlay canvas
    ctx.clearRect(0, 0, this.staticImageCanvas.width, this.staticImageCanvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.staticImageCanvas.width, this.staticImageCanvas.height);
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scaleX = this.staticImageCanvas.width / image.width;
    const scaleY = this.staticImageCanvas.height / image.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // Use same padding factor as particles
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    // Center the image
    const offsetX = (this.staticImageCanvas.width - scaledWidth) / 2;
    const offsetY = (this.staticImageCanvas.height - scaledHeight) / 2;
    
    // Draw the centered image
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
  }
  
  /**
   * Hide the static image overlay canvas
   */
  hideStaticImage() {
    if (this.staticImageCanvas) {
      this.staticImageCanvas.style.display = 'none';
    }
  }

  /**
   * Easing function for smooth transitions
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased progress
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update hybrid configuration
   * @param {Object} newConfig 
   */
  updateTriangulationConfig(newConfig) {
    this.triangulationConfig = { ...this.triangulationConfig, ...newConfig };
    console.log('[HybridEngine] Triangulation config updated:', this.triangulationConfig);
    
    // Update triangulation morph if needed
    if (this.triangulationMorph && (newConfig.keyPointMethod || newConfig.gridSize || newConfig.featurePointCount)) {
      this.triangulationMorph.updateConfig({
        keyPointMethod: this.triangulationConfig.keyPointMethod,
        gridSize: this.triangulationConfig.gridSize,
        featurePointCount: this.triangulationConfig.featurePointCount
      });
    }
  }

  /**
   * Get current triangulation configuration
   * @returns {Object}
   */
  getTriangulationConfig() {
    return { ...this.triangulationConfig };
  }

  /**
   * Start hybrid transition with explosion and recombination
   * Now starts with a static image display before atomizing into particles
   * @param {HTMLImageElement} sourceImage - Source image (displayed as static first)
   * @param {HTMLImageElement} targetImage - Target image  
   * @param {Object} config - Transition configuration
   */
  startHybridTransition(sourceImage, targetImage, config = {}) {
    console.log('[HybridEngine] Starting hybrid transition with static image display...');
    
    // Store images for bidirectional support
    this.triangulationImages.source = sourceImage;
    this.triangulationImages.target = targetImage;
    this.hybridTransitionState = {
      sourceImage: sourceImage,
      targetImage: targetImage,
      config: config
    };
    
    // Set up static image display (show for a brief moment before atomizing)
    const staticDisplayDuration = config.staticDisplayDuration || DEFAULT_STATIC_DISPLAY_DURATION;
    this.staticImageState = {
      isDisplaying: true,
      image: sourceImage,
      startTime: performance.now(),
      displayDuration: staticDisplayDuration,
      onComplete: () => {
        // After static display, start the particle transition
        this.startParticleTransition(sourceImage, targetImage, config);
      }
    };
    
    console.log(`[HybridEngine] Displaying static image for ${staticDisplayDuration}ms before atomization...`);
  }

  /**
   * Internal method to start the particle-based transition after static image display
   * @param {HTMLImageElement} sourceImage - Source image
   * @param {HTMLImageElement} targetImage - Target image  
   * @param {Object} config - Transition configuration
   */
  startParticleTransition(sourceImage, targetImage, config) {
    console.log('[HybridEngine] Starting particle transition phase...');
    
    const preset = new HybridTransitionPreset(config);
    
    // Register and activate preset
    this.registerPreset('hybridTransition', preset);
    
    // Initialize triangulation morph for blend phase
    if (this.triangulationMorph) {
      this.triangulationMorph.setImages(sourceImage, targetImage);
      this.triangulationRenderer.createTexture(sourceImage, 'source');
      this.triangulationRenderer.createTexture(targetImage, 'target');
      
      // Start triangulation transition for blend phase
      this.triangulationTransition = {
        isActive: true,
        progress: 0,
        duration: config.blendDuration || 1500,
        startTime: performance.now()
      };
    }
    
    // Extract target positions from target image
    const imageData = this.particleSystem.extractImageData(targetImage, this.particleSystem.getParticles().length);
    const targets = this.particleSystem.imageDataToTargets(imageData);
    
    // Activate preset with target data
    const particles = this.particleSystem.getParticles();
    const dimensions = { width: this.canvas.width, height: this.canvas.height };
    this.activatePreset('hybridTransition', {
      sourceImage: sourceImage,
      targetImage: targetImage
    });
    
    // Set targets for recombination phase
    preset.targets = targets;
    
    console.log('[HybridEngine] Hybrid transition preset activated - particles will now explode');
  }

  /**
   * Reverse the hybrid transition (go back from target to source)
   * @param {Object} config - Optional configuration overrides
   */
  reverseHybridTransition(config = {}) {
    console.log('[HybridEngine] Reversing hybrid transition...');
    
    if (!this.hybridTransitionState) {
      console.warn('[HybridEngine] No hybrid transition state found, cannot reverse');
      return;
    }
    
    // Swap source and target images for reverse transition
    const sourceImage = this.hybridTransitionState.targetImage;
    const targetImage = this.hybridTransitionState.sourceImage;
    
    // Merge with stored config
    const mergedConfig = {
      ...this.hybridTransitionState.config,
      ...config
    };
    
    // Start new transition with swapped images
    this.startHybridTransition(sourceImage, targetImage, mergedConfig);
    
    console.log('[HybridEngine] Reverse hybrid transition started');
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log('[HybridEngine] Destroying hybrid engine...');
    
    // Clean up static image overlay canvas
    if (this.staticImageCanvas && this.staticImageCanvas.parentElement) {
      this.staticImageCanvas.parentElement.removeChild(this.staticImageCanvas);
      this.staticImageCanvas = null;
    }
    
    // Clean up triangulation
    if (this.triangulationRenderer) {
      this.triangulationRenderer.destroy();
    }
    
    // Call parent destroy
    super.destroy();
    
    console.log('[HybridEngine] Hybrid engine destroyed');
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.HybridEngine = HybridEngine;
}
