/**
 * HybridEngine - Extended ParticleEngine with blob mesh transitions
 * Combines particle-based, blob mesh, and triangulation-based image morphing
 * Implements organic blob transitions with mitosis-like splitting/merging
 */
import { ParticleEngine } from './ParticleEngine.js';
import { TriangulationMorph } from './triangulation/TriangulationMorph.js';
import { TriangulationRenderer } from './triangulation/TriangulationRenderer.js';
import { HybridTransitionPreset } from './presets/HybridTransitionPreset.js';
import { BlobRenderer, BlobPhysics } from './blob/index.js';
import { ElasticMesh, MeshPhysics, MeshRenderer } from './mesh/index.js';

// Constants
const DEFAULT_STATIC_DISPLAY_DURATION = 500; // ms - how long to show static image before disintegration
const DEFAULT_DISINTEGRATION_DURATION = 1000; // ms - how long the disintegration effect takes

export class HybridEngine extends ParticleEngine {
  constructor(canvas, config = {}) {
    // Initialize parent ParticleEngine
    super(canvas, {
      ...config,
      enableTriangulation: config.enableTriangulation !== false
    });
    
    console.log('[HybridEngine] Initializing hybrid rendering system...');
    
    // Blob rendering configuration
    this.blobConfig = {
      enabled: config.enableBlobRendering !== false, // Enable blob rendering by default
      threshold: config.blobThreshold || 1.0,
      influenceRadius: config.blobInfluenceRadius || 80,
      resolution: config.blobResolution || 4,
      surfaceTension: config.surfaceTension || 0.5,
      fillOpacity: config.blobFillOpacity || 0.85,
      edgeSoftness: config.blobEdgeSoftness || 0.15,
      // Physics
      cohesionStrength: config.cohesionStrength || 0.3,
      elasticity: config.elasticity || 0.7,
      mitosisFactor: config.mitosisFactor || 0.5,
      splitThreshold: config.splitThreshold || 150,
      mergeThreshold: config.mergeThreshold || 80
    };
    
    // Triangulation-specific configuration
    this.triangulationConfig = {
      enabled: config.enableTriangulation !== false,
      mode: config.triangulationMode || 'hybrid', // 'particles', 'triangulation', 'hybrid', 'blob', or 'mesh'
      keyPointMethod: config.keyPointMethod || 'grid', // 'grid' or 'feature'
      gridSize: config.gridSize || 8,
      featurePointCount: config.featurePointCount || 64,
      blendMode: config.blendMode || 'crossfade', // 'crossfade' or 'overlay'
      particleOpacity: config.particleOpacity !== undefined ? config.particleOpacity : 0.5,
      triangleOpacity: config.triangleOpacity !== undefined ? config.triangleOpacity : 0.5
    };
    
    // Elastic mesh configuration
    this.meshConfig = {
      enabled: config.enableMesh || false,
      gridDensity: config.meshGridDensity || 1.5, // vertices per 100px
      springConstant: config.meshSpringConstant || 0.3,
      damping: config.meshDamping || 0.95,
      breakThreshold: config.meshBreakThreshold || 300,
      alphaThreshold: config.meshAlphaThreshold || 0.5,
      explosionStrength: config.meshExplosionStrength || 100,
      showMesh: config.showMesh || false,
      showVertices: config.showVertices || false
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
    
    // Initialize blob components
    this.blobRenderer = null;
    this.blobPhysics = null;
    
    // Initialize mesh components
    this.elasticMesh = null;
    this.meshPhysics = null;
    this.meshRenderer = null;
    this.meshTransition = {
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
    
    // Disintegration state (for smooth solid-to-particle transition)
    this.disintegrationState = {
      isActive: false,
      progress: 0,
      startTime: 0,
      duration: 0,
      sourceImage: null
    };
    
    // Reusable Map for storing original alpha values (optimization)
    this.originalAlphasCache = new Map();
    
    // Track last rendered static image to avoid reloading texture
    this.lastRenderedStaticImage = null;
    
    if (this.triangulationConfig.enabled) {
      this.initializeTriangulation();
    }
    
    if (this.blobConfig.enabled) {
      this.initializeBlobRendering();
    }
    
    if (this.meshConfig.enabled || this.triangulationConfig.mode === 'mesh') {
      this.initializeElasticMesh();
    }
    
    console.log('[HybridEngine] Hybrid engine initialized');
    console.log('[HybridEngine] Triangulation config:', this.triangulationConfig);
    console.log('[HybridEngine] Blob config:', this.blobConfig);
    console.log('[HybridEngine] Mesh config:', this.meshConfig);
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
   * Initialize blob rendering components
   */
  initializeBlobRendering() {
    console.log('[HybridEngine] Initializing blob rendering system...');
    
    try {
      this.blobRenderer = new BlobRenderer(this.canvas, {
        threshold: this.blobConfig.threshold,
        influenceRadius: this.blobConfig.influenceRadius,
        resolution: this.blobConfig.resolution,
        surfaceTension: this.blobConfig.surfaceTension,
        fillOpacity: this.blobConfig.fillOpacity,
        edgeSoftness: this.blobConfig.edgeSoftness
      });
      
      this.blobPhysics = new BlobPhysics({
        surfaceTension: this.blobConfig.surfaceTension,
        tensionRadius: this.blobConfig.influenceRadius,
        cohesionStrength: this.blobConfig.cohesionStrength,
        elasticity: this.blobConfig.elasticity,
        mitosisFactor: this.blobConfig.mitosisFactor,
        splitThreshold: this.blobConfig.splitThreshold,
        mergeThreshold: this.blobConfig.mergeThreshold
      });
      
      console.log('[HybridEngine] Blob rendering system initialized');
    } catch (error) {
      console.error('[HybridEngine] Failed to initialize blob rendering:', error);
      this.blobConfig.enabled = false;
    }
  }

  /**
   * Initialize elastic mesh components
   */
  initializeElasticMesh() {
    console.log('[HybridEngine] Initializing elastic mesh system...');
    
    try {
      this.elasticMesh = new ElasticMesh({
        width: this.canvas.width,
        height: this.canvas.height,
        gridDensity: this.meshConfig.gridDensity,
        springConstant: this.meshConfig.springConstant,
        damping: this.meshConfig.damping,
        breakThreshold: this.meshConfig.breakThreshold,
        alphaThreshold: this.meshConfig.alphaThreshold
      });
      
      this.meshPhysics = new MeshPhysics(this.elasticMesh, {
        springConstant: this.meshConfig.springConstant,
        damping: this.meshConfig.damping,
        breakThreshold: this.meshConfig.breakThreshold
      });
      
      // Reuse WebGL context from renderer if available, otherwise create new one
      let gl = this.renderer?.gl;
      if (!gl) {
        gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!gl) {
          throw new Error('WebGL not supported');
        }
      }
      
      this.meshRenderer = new MeshRenderer(gl, {
        showMesh: this.meshConfig.showMesh,
        showVertices: this.meshConfig.showVertices
      });
      
      this.meshConfig.enabled = true;
      console.log('[HybridEngine] Elastic mesh system initialized');
    } catch (error) {
      console.error('[HybridEngine] Failed to initialize elastic mesh:', error);
      this.meshConfig.enabled = false;
    }
  }

  /**
   * Set rendering mode
   * @param {string} mode - 'particles', 'triangulation', 'hybrid', 'blob', or 'mesh'
   */
  setRenderMode(mode) {
    if (['particles', 'triangulation', 'hybrid', 'blob', 'mesh'].includes(mode)) {
      this.triangulationConfig.mode = mode;
      
      // Initialize mesh system if switching to mesh mode
      if (mode === 'mesh' && !this.meshConfig.enabled) {
        this.initializeElasticMesh();
      }
      
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
   * Set image for the engine (alias for initializeFromImage)
   * @param {HTMLImageElement} image - The image to load
   * @param {Object} options - Optional configuration
   * @returns {Promise<void>}
   */
  async setImage(image, options = {}) {
    return new Promise((resolve) => {
      this.initializeFromImage(image, options);
      resolve();
    });
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
        // Time to start disintegration
        console.log('[HybridEngine] Static image display complete, starting disintegration...');
        this.staticImageState.isDisplaying = false;
        
        // Hide the static image overlay
        this.hideStaticImage();
        
        // Initialize particles from the static image
        this.initializeFromImage(this.staticImageState.image);
        
        // Start disintegration effect instead of immediate transition
        if (this.staticImageState.disintegrationDuration && this.staticImageState.disintegrationDuration > 0) {
          this.disintegrationState = {
            isActive: true,
            progress: 0,
            startTime: currentTime,
            duration: this.staticImageState.disintegrationDuration,
            sourceImage: this.staticImageState.image
          };
          
          // Load image texture for dual rendering with particle system config
          this.renderer.loadImageTexture(this.staticImageState.image, this.particleSystem.config);
          
          // Initialize particle dispersion targets
          this.particleSystem.startDisintegration(this.staticImageState.disintegrationDuration);
        } else {
          // No disintegration, start transition immediately
          if (this.staticImageState.onComplete) {
            this.staticImageState.onComplete();
          }
        }
      }
    }
    
    // Update disintegration progress
    if (this.disintegrationState.isActive && this.disintegrationState.duration > 0) {
      const elapsed = currentTime - this.disintegrationState.startTime;
      const progress = Math.min(elapsed / this.disintegrationState.duration, 1.0);
      this.disintegrationState.progress = progress;
      
      // Update particle system disintegration
      this.particleSystem.setDisintegrationProgress(progress);
      
      if (progress >= 1.0) {
        // Disintegration complete, start the hybrid transition preset
        console.log('[HybridEngine] Disintegration complete, starting transition...');
        this.disintegrationState.isActive = false;
        
        if (this.staticImageState.onComplete) {
          this.staticImageState.onComplete();
        }
      }
    }
    
    // Update triangulation transition
    if (this.triangulationConfig.enabled) {
      this.updateTriangulationTransition(currentTime);
    }
    
    // Update mesh transition
    if (this.meshTransition.isActive) {
      this.updateMeshTransition(currentTime, deltaTime);
    }
    
    // Update particles (preset or default)
    if (this.presetManager.hasActivePreset()) {
      const particles = this.particleSystem.getParticles();
      const dimensions = { width: this.canvas.width, height: this.canvas.height };
      this.presetManager.update(particles, deltaTime, dimensions);
    } else {
      this.particleSystem.update(deltaTime);
    }
    
    // Apply blob physics if enabled and in blob mode
    if (this.blobConfig.enabled && this.blobPhysics && this.triangulationConfig.mode === 'blob') {
      const particles = this.particleSystem.getParticles();
      const boundaries = {
        minX: 0,
        minY: 0,
        maxX: this.canvas.width,
        maxY: this.canvas.height
      };
      this.blobPhysics.update(particles, deltaTime, boundaries);
    }
    
    // Render based on mode
    this.renderHybrid();
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Update mesh transition state
   * @param {number} currentTime - Current timestamp
   * @param {number} deltaTime - Time delta in seconds
   */
  updateMeshTransition(currentTime, deltaTime) {
    if (!this.meshTransition.isActive) return;
    
    const { phase, phaseStart, phases, config } = this.meshTransition;
    const elapsed = currentTime - phaseStart;
    
    // Handle different phases
    switch (phase) {
      case 'staticDisplay':
        if (elapsed >= phases.staticDisplay) {
          console.log('[HybridEngine] Mesh: Static display complete, starting explosion');
          this.meshTransition.phase = 'explosion';
          this.meshTransition.phaseStart = currentTime;
          
          // Trigger explosion
          const intensity = config.explosionIntensity || this.meshConfig.explosionStrength || 100;
          this.meshPhysics.applyExplosion(intensity, {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
          });
        }
        break;
        
      case 'explosion':
        // Update physics during explosion
        this.meshPhysics.update(deltaTime);
        
        if (elapsed >= phases.explosion) {
          console.log('[HybridEngine] Mesh: Explosion complete, settling');
          this.meshTransition.phase = 'settle';
          this.meshTransition.phaseStart = currentTime;
        }
        break;
        
      case 'settle':
        // Continue physics, let springs stabilize
        this.meshPhysics.update(deltaTime);
        
        if (elapsed >= phases.settle) {
          console.log('[HybridEngine] Mesh: Settling complete, starting morph');
          this.meshTransition.phase = 'morph';
          this.meshTransition.phaseStart = currentTime;
          
          // Start morphing to target
          this.meshPhysics.startMorphing(phases.morph);
        }
        break;
        
      case 'morph':
        // Update physics with target attraction
        this.meshPhysics.update(deltaTime);
        
        if (elapsed >= phases.morph) {
          console.log('[HybridEngine] Mesh: Morphing complete, starting blend');
          this.meshTransition.phase = 'blend';
          this.meshTransition.phaseStart = currentTime;
          this.meshPhysics.stopMorphing();
        }
        break;
        
      case 'blend':
        // Continue physics and crossfade textures
        this.meshPhysics.update(deltaTime);
        this.meshTransition.progress = Math.min(elapsed / phases.blend, 1.0);
        
        if (elapsed >= phases.blend) {
          console.log('[HybridEngine] Mesh: Transition complete');
          this.meshTransition.isActive = false;
          
          if (this.meshTransition.onComplete) {
            this.meshTransition.onComplete();
          }
        }
        break;
    }
  }

  /**
   * Hybrid rendering combining particles and triangulation
   */
  renderHybrid() {
    // If displaying static image, render it directly to WebGL canvas
    if (this.staticImageState.isDisplaying && this.staticImageState.image) {
      this.renderStaticImageToWebGL(this.staticImageState.image);
      return;
    }
    
    // If mesh transition is active, render mesh
    if (this.meshTransition.isActive && this.elasticMesh && this.meshRenderer) {
      const crossfadeProgress = this.meshTransition.phase === 'blend' ? this.meshTransition.progress : 0;
      this.meshRenderer.render(this.elasticMesh, crossfadeProgress);
      return;
    }
    
    // If in disintegration phase, render with dual rendering (fading image + appearing particles)
    if (this.disintegrationState.isActive) {
      const progress = this.disintegrationState.progress;
      const imageOpacity = 1.0 - progress; // Image fades out
      const particleOpacity = progress; // Particles fade in
      
      const particles = this.particleSystem.getParticles();
      this.renderer.render(particles, {
        imageOpacity: imageOpacity,
        particleOpacity: particleOpacity
      });
      return;
    }
    
    // Check if in final static phase (show target image as static)
    if (this.presetManager.hasActivePreset()) {
      const activePreset = this.presetManager.getActivePreset();
      if (activePreset && typeof activePreset.isInFinalStatic === 'function' && activePreset.isInFinalStatic()) {
        // Display target image as solid static image
        if (this.hybridTransitionState && this.hybridTransitionState.targetImage) {
          // Render directly to WebGL canvas
          this.renderStaticImageToWebGL(this.hybridTransitionState.targetImage);
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
    
    // Render blobs (if enabled and in blob mode)
    if (mode === 'blob' && this.blobConfig.enabled && this.blobRenderer) {
      // Render particles as organic blob mesh
      this.blobRenderer.render(particles, this.canvas.width, this.canvas.height);
      return; // Skip particle rendering when in blob mode
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
   * Render a static image directly to the WebGL canvas
   * @param {HTMLImageElement} image - The image to render
   */
  renderStaticImageToWebGL(image) {
    // Load the image texture if not already loaded or if it's a different image
    if (!this.renderer.imageLoaded || this.lastRenderedStaticImage !== image) {
      this.renderer.loadImageTexture(image, this.particleSystem.config);
      this.lastRenderedStaticImage = image;
    }
    
    // Clear the WebGL canvas and render the image at full opacity
    const gl = this.renderer.gl;
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.renderer.renderImage(1.0);
  }
  
  /**
   * Hide the static image (no longer needed as we render directly to WebGL)
   * Keeping this method for backwards compatibility
   */
  hideStaticImage() {
    // Method retained for compatibility but no longer does anything
    // Static images are now rendered directly to WebGL canvas
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
   * Main API method for hybrid mesh transitions
   * Supports particle, blob, triangulation, and elastic mesh modes
   * 
   * @param {HTMLImageElement} source - Source image
   * @param {HTMLImageElement} target - Target image
   * @param {Object} options - Transition options
   * @param {string} options.mode - Transition mode: 'particles', 'blob', 'triangulation', 'mesh', or 'hybrid'
   * @param {number} options.explosionIntensity - Explosion strength (for particles and mesh)
   * @param {number} options.recombinationDuration - Duration of recombination phase
   * @param {number} options.blendDuration - Duration of final blend
   * @param {Object} options.meshConfig - Mesh-specific configuration
   * @returns {Promise<void>}
   * 
   * @example
   * // Use elastic mesh transition
   * await engine.hybridTransition(image1, image2, {
   *   mode: 'mesh',
   *   explosionIntensity: 150,
   *   meshConfig: {
   *     gridDensity: 2.0,
   *     springConstant: 0.4,
   *     showMesh: true
   *   }
   * });
   */
  async hybridTransition(source, target, options = {}) {
    const mode = options.mode || this.triangulationConfig.mode || 'hybrid';
    
    console.log(`[HybridEngine] Starting hybrid transition in ${mode} mode`);
    
    // Handle mesh-specific transition
    if (mode === 'mesh') {
      return this.startMeshTransition(source, target, options);
    }
    
    // Default to existing hybrid transition for other modes
    return this.startHybridTransition(source, target, options);
  }

  /**
   * Helper method to extract image data from an image
   * @param {HTMLImageElement} image - Image to extract data from
   * @returns {ImageData} - Image data
   */
  extractImageData(image) {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Start elastic mesh transition
   * @param {HTMLImageElement} sourceImage - Source image
   * @param {HTMLImageElement} targetImage - Target image
   * @param {Object} config - Transition configuration
   * @returns {Promise<void>}
   */
  async startMeshTransition(sourceImage, targetImage, config = {}) {
    console.log('[HybridEngine] Starting elastic mesh transition...');
    
    // Initialize mesh if not already initialized
    if (!this.meshConfig.enabled) {
      this.initializeElasticMesh();
    }
    
    if (!this.elasticMesh || !this.meshPhysics || !this.meshRenderer) {
      console.error('[HybridEngine] Mesh system not available');
      return;
    }
    
    // Apply mesh configuration overrides
    if (config.meshConfig) {
      this.meshConfig = { ...this.meshConfig, ...config.meshConfig };
      this.elasticMesh.updateConfig(this.meshConfig);
      this.meshPhysics.updateConfig(this.meshConfig);
      this.meshRenderer.updateConfig(this.meshConfig);
    }
    
    // Extract image data using helper method
    const sourceImageData = this.extractImageData(sourceImage);
    const targetImageData = this.extractImageData(targetImage);
    
    // Generate mesh from source image
    const particleCount = config.particleCount || this.config.particleCount || 2000;
    this.elasticMesh.generateMesh(sourceImageData, particleCount);
    
    // Set target positions from target image
    this.elasticMesh.setTargetPositions(targetImageData);
    
    // Load textures for rendering
    this.meshRenderer.loadTexture(sourceImage, 'source');
    this.meshRenderer.loadTexture(targetImage, 'target');
    
    // Start mesh transition phases
    const phases = {
      staticDisplay: config.staticDisplayDuration || 500,
      explosion: config.explosionTime || 800,
      settle: config.settleDuration || 1000,
      morph: config.recombinationDuration || 2500,
      blend: config.blendDuration || 2000
    };
    
    this.meshTransition = {
      isActive: true,
      progress: 0,
      phase: 'staticDisplay',
      phaseStart: performance.now(),
      phases: phases,
      config: config
    };
    
    console.log('[HybridEngine] Mesh transition initialized, phases:', phases);
    
    // Return promise that resolves when transition completes
    return new Promise(resolve => {
      this.meshTransition.onComplete = resolve;
    });
  }

  /**
   * Start hybrid transition with all phases - implements seamless transitions between solid images and particles
   * 
   * This method orchestrates the complete hybrid particle transition pipeline:
   * 1. **Static Display**: Shows source image as solid for brief period
   * 2. **Disintegration**: Image dissolves into particles with velocity and turbulence
   * 3. **Explosion**: Particles scatter outward in random directions
   * 4. **Recombination**: Particles reassemble into target image with vacuum-like attraction
   * 5. **Blend**: Particles fade while triangulation rendering increases for seamless final image
   * 6. **Final Static**: Target image displayed as solid
   * 
   * @param {HTMLImageElement} sourceImage - Source image (displayed as static first)
   * @param {HTMLImageElement} targetImage - Target image to transition to
   * @param {Object} config - Transition configuration with following options:
   * @param {number} [config.staticDisplayDuration=500] - Duration to display source image (ms)
   * @param {number} [config.disintegrationDuration=1000] - Duration of image-to-particle disintegration (ms)
   * @param {number} [config.explosionIntensity=150] - Strength of particle explosion (50-300)
   * @param {number} [config.explosionTime=800] - Duration of explosion phase (ms)
   * @param {number} [config.recombinationDuration=2000] - Duration of particle recombination (ms)
   * @param {number} [config.recombinationChaos=0.3] - Amount of chaotic motion during recombination (0-1)
   * @param {number} [config.vacuumStrength=0.15] - Strength of vacuum attraction to target positions
   * @param {number} [config.blendDuration=1500] - Duration of particle-to-triangulation blend (ms)
   * @param {number} [config.particleFadeRate=0.7] - Rate at which particles fade during blend (0-1)
   * @param {number} [config.finalStaticDuration=500] - Duration to display final static image (ms)
   * 
   * @example
   * // Basic usage with defaults
   * engine.startHybridTransition(image1, image2);
   * 
   * @example
   * // Custom configuration
   * engine.startHybridTransition(image1, image2, {
   *   staticDisplayDuration: 700,
   *   disintegrationDuration: 1200,
   *   explosionIntensity: 200,
   *   recombinationDuration: 2500,
   *   blendDuration: 1800
   * });
   */
  startHybridTransition(sourceImage, targetImage, config = {}) {
    console.log('[HybridEngine] Starting hybrid transition with disintegration effect...');
    
    // Store images for bidirectional support
    this.triangulationImages.source = sourceImage;
    this.triangulationImages.target = targetImage;
    this.hybridTransitionState = {
      sourceImage: sourceImage,
      targetImage: targetImage,
      config: config
    };
    
    // Set up static image display and disintegration phases
    const staticDisplayDuration = config.staticDisplayDuration || DEFAULT_STATIC_DISPLAY_DURATION;
    const disintegrationDuration = config.disintegrationDuration || DEFAULT_DISINTEGRATION_DURATION;
    
    this.staticImageState = {
      isDisplaying: true,
      image: sourceImage,
      startTime: performance.now(),
      displayDuration: staticDisplayDuration,
      disintegrationDuration: disintegrationDuration,
      onComplete: () => {
        // After static display and disintegration, start the particle transition
        this.startParticleTransition(sourceImage, targetImage, config);
      }
    };
    
    console.log(`[HybridEngine] Phase 1: Static display for ${staticDisplayDuration}ms`);
    console.log(`[HybridEngine] Phase 2: Disintegration for ${disintegrationDuration}ms`);
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
