/**
 * HybridEngine - Extended ParticleEngine with triangulation morphing support
 * Combines particle-based and triangulation-based image morphing
 */
import { ParticleEngine } from './ParticleEngine.js';
import { TriangulationMorph } from './triangulation/TriangulationMorph.js';
import { TriangulationRenderer } from './triangulation/TriangulationRenderer.js';
import { HybridTransitionPreset } from './presets/HybridTransitionPreset.js';

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
    const mode = this.triangulationConfig.mode;
    const particles = this.particleSystem.getParticles();
    
    // Check if HybridTransitionPreset is active and get current phase info
    let dynamicTriangleOpacity = this.triangulationConfig.triangleOpacity;
    let dynamicParticleOpacity = this.triangulationConfig.particleOpacity;
    let currentPhase = 'idle';
    
    if (this.presetManager.hasActivePreset()) {
      const activePreset = this.presetManager.getActivePreset();
      if (activePreset && typeof activePreset.getBlendProgress === 'function') {
        const blendProgress = activePreset.getBlendProgress();
        currentPhase = activePreset.getCurrentPhase ? activePreset.getCurrentPhase() : 'idle';
        
        // Adjust opacity based on phase for seamless triangulation integration
        if (currentPhase === 'explosion') {
          // Start with triangulation visible, fade to particles
          dynamicTriangleOpacity = Math.max(0, 1.0 - (Date.now() - activePreset.phaseStartTime) / activePreset.config.explosionTime);
          dynamicParticleOpacity = Math.min(1.0, (Date.now() - activePreset.phaseStartTime) / (activePreset.config.explosionTime * 0.5));
        } else if (currentPhase === 'recombination') {
          // Particles only
          dynamicTriangleOpacity = 0;
          dynamicParticleOpacity = 1.0;
        } else if (currentPhase === 'blend') {
          // Fade particles, show triangulation
          dynamicTriangleOpacity = blendProgress;
          dynamicParticleOpacity = Math.max(0.1, 1.0 - blendProgress * 0.7);
        } else if (currentPhase === 'solidified') {
          // Full triangulation
          dynamicTriangleOpacity = 1.0;
          dynamicParticleOpacity = 0;
        } else if (currentPhase === 'reverseBlend') {
          // Triangulation fades, particles appear
          dynamicTriangleOpacity = blendProgress;
          dynamicParticleOpacity = Math.max(0.3, 1.0 - blendProgress * 0.5);
        } else if (currentPhase === 'reverseRecombination' || currentPhase === 'reverseExplosion') {
          // Particles only
          dynamicTriangleOpacity = 0;
          dynamicParticleOpacity = 1.0;
        } else if (currentPhase === 'solidify') {
          // Particles fade, triangulation shows
          const solidifyProgress = (Date.now() - activePreset.phaseStartTime) / activePreset.config.blendDuration;
          dynamicTriangleOpacity = Math.min(1.0, solidifyProgress);
          dynamicParticleOpacity = Math.max(0, 1.0 - solidifyProgress);
        } else if (blendProgress > 0) {
          // Fallback for blend progress
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
        this.triangulationImages.target &&
        dynamicTriangleOpacity > 0.01) {
      
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
    if ((mode === 'particles' || mode === 'hybrid') && dynamicParticleOpacity > 0.01) {
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
   * @param {HTMLImageElement} sourceImage - Source image
   * @param {HTMLImageElement} targetImage - Target image  
   * @param {Object} config - Transition configuration
   */
  startHybridTransition(sourceImage, targetImage, config = {}) {
    console.log('[HybridEngine] Starting hybrid transition with explosion and recombination...');
    
    // Initialize particles from source image at actual size (1:1 pixel mapping)
    // This preserves the original image dimensions and position
    console.log('[HybridEngine] Initializing particles from source image at actual size...');
    this.particleSystem.initializeFromImageActualSize(sourceImage);
    
    const preset = new HybridTransitionPreset(config);
    
    // Register and activate preset
    this.registerPreset('hybridTransition', preset);
    
    // Store images
    this.triangulationImages.source = sourceImage;
    this.triangulationImages.target = targetImage;
    
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
    
    // Extract target positions from target image at actual size (1:1 pixel mapping)
    const imageData = this.particleSystem.extractImageData(targetImage, this.particleSystem.getParticles().length);
    const targets = this.particleSystem.imageDataToTargetsActualSize(imageData);
    
    // Activate preset with target data
    const particles = this.particleSystem.getParticles();
    const dimensions = { width: this.canvas.width, height: this.canvas.height };
    this.activatePreset('hybridTransition', {
      sourceImage: sourceImage,
      targetImage: targetImage
    });
    
    // Set targets for recombination phase
    preset.targets = targets;
    
    console.log('[HybridEngine] Hybrid transition preset activated');
  }

  /**
   * Start reverse hybrid transition (back to source image)
   * @param {Object} config - Transition configuration
   */
  startReverseHybridTransition(config = {}) {
    console.log('[HybridEngine] Starting reverse hybrid transition...');
    
    const activePreset = this.presetManager.getActivePreset();
    if (!activePreset || typeof activePreset.startReverseTransition !== 'function') {
      console.warn('[HybridEngine] No active HybridTransitionPreset to reverse');
      return;
    }
    
    const particles = this.particleSystem.getParticles();
    
    // Swap source and target for reverse transition
    if (this.triangulationImages.source && this.triangulationImages.target) {
      const temp = this.triangulationImages.source;
      this.triangulationImages.source = this.triangulationImages.target;
      this.triangulationImages.target = temp;
      
      // Re-initialize triangulation morph for reverse
      this.triangulationMorph.setImages(
        this.triangulationImages.source,
        this.triangulationImages.target
      );
      
      this.triangulationRenderer.createTexture(this.triangulationImages.source, 'source');
      this.triangulationRenderer.createTexture(this.triangulationImages.target, 'target');
      
      // Restart triangulation transition
      this.triangulationTransition = {
        isActive: true,
        progress: 0,
        duration: config.blendDuration || 1500,
        startTime: performance.now()
      };
    }
    
    // Start reverse on preset
    activePreset.startReverseTransition(particles);
    
    console.log('[HybridEngine] Reverse hybrid transition started');
  }

  /**
   * Cycle between two images continuously
   * @param {HTMLImageElement} image1 
   * @param {HTMLImageElement} image2 
   * @param {Object} config 
   */
  startCycleTransition(image1, image2, config = {}) {
    console.log('[HybridEngine] Starting cycle transition...');
    
    const defaultConfig = {
      ...config,
      cycleDelay: config.cycleDelay || 1000 // Delay between cycles
    };
    
    // Store as instance properties for proper cleanup
    this.cycleDirection = 'forward';
    this.cycleTimeout = null;
    this.cycleImages = { image1, image2 };
    this.cycleConfig = defaultConfig;
    
    const cycleStep = () => {
      const activePreset = this.presetManager.getActivePreset();
      if (!activePreset) return;
      
      const currentPhase = activePreset.getCurrentPhase();
      
      // Wait for solidified or idle state before cycling
      if (currentPhase === 'solidified' || currentPhase === 'idle') {
        this.cycleTimeout = setTimeout(() => {
          if (this.cycleDirection === 'forward') {
            this.startReverseHybridTransition(this.cycleConfig);
            this.cycleDirection = 'reverse';
          } else {
            // Swap back and start forward
            const temp = this.triangulationImages.source;
            this.triangulationImages.source = this.triangulationImages.target;
            this.triangulationImages.target = temp;
            
            this.startHybridTransition(this.cycleImages.image1, this.cycleImages.image2, this.cycleConfig);
            this.cycleDirection = 'forward';
          }
          
          requestAnimationFrame(cycleStep);
        }, this.cycleConfig.cycleDelay);
      } else {
        // Still transitioning, check again
        requestAnimationFrame(cycleStep);
      }
    };
    
    // Start first transition
    this.startHybridTransition(image1, image2, defaultConfig);
    requestAnimationFrame(cycleStep);
    
    console.log('[HybridEngine] Cycle transition initiated');
  }

  /**
   * Stop cycle transition
   */
  stopCycleTransition() {
    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
      console.log('[HybridEngine] Cycle transition stopped');
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log('[HybridEngine] Destroying hybrid engine...');
    
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
