/**
 * HybridEngine - Extended ParticleEngine for page transitions
 * Handles multi-phase particle transitions with explosion, recombination, and blend effects
 */
import { ParticleEngine } from './ParticleEngine.js';
import { HybridTransitionPreset } from './presets/HybridTransitionPreset.js';

// Constants
const DEFAULT_STATIC_DISPLAY_DURATION = 500; // ms - how long to show static image before disintegration
const DEFAULT_DISINTEGRATION_DURATION = 1000; // ms - how long the disintegration effect takes

export class HybridEngine extends ParticleEngine {
  constructor(canvas, config = {}) {
    // Initialize parent ParticleEngine
    super(canvas, config);
    
    console.log('[HybridEngine] Initializing hybrid transition engine...');
    
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
      this.staticImageCanvas.style.width = this.canvas.clientWidth + 'px';
      this.staticImageCanvas.style.height = this.canvas.clientHeight + 'px';
      this.staticImageCanvas.style.left = this.canvas.offsetLeft + 'px';
      this.staticImageCanvas.style.top = this.canvas.offsetTop + 'px';
      this.canvas.parentElement.appendChild(this.staticImageCanvas);
    }
    
    console.log('[HybridEngine] Hybrid engine initialized');
  }

  /**
   * Initialize from image
   * @param {HTMLImageElement} image 
   * @param {Object} options 
   */
  initializeFromImage(image, options = {}) {
    console.log('[HybridEngine] Initializing from image...');
    
    // Initialize particles (parent behavior)
    super.initializeFromImage(image);
  }

  /**
   * Transition to image
   * @param {HTMLImageElement} image 
   * @param {number} duration 
   * @param {Object} options 
   */
  transitionToImage(image, duration = 2000, options = {}) {
    console.log('[HybridEngine] Transitioning to image...');
    
    // Start particle transition (parent behavior)
    super.transitionToImage(image, duration);
  }
        duration: duration,
        startTime: performance.now()
      };
      
      console.log('[HybridEngine] Triangulation transition started');
    }
  }

  /**
   * Enhanced animate method for page transitions
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
    
    // Update particles (preset or default)
    if (this.presetManager.hasActivePreset()) {
      const particles = this.particleSystem.getParticles();
      const dimensions = { width: this.canvas.width, height: this.canvas.height };
      this.presetManager.update(particles, deltaTime, dimensions);
    } else {
      this.particleSystem.update(deltaTime);
    }
    
    // Render particles
    this.render();
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Render method for page transitions
   */
  render() {
    // If displaying static image, render it and return
    if (this.staticImageState.isDisplaying && this.staticImageState.image) {
      this.renderStaticImage(this.staticImageState.image);
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
          this.renderStaticImage(this.hybridTransitionState.targetImage);
          return;
        }
      }
    }
    
    // Normal particle rendering
    const particles = this.particleSystem.getParticles();
    this.renderer.render(particles);
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
    
    // Update overlay canvas dimensions to match main canvas
    this.staticImageCanvas.width = this.canvas.width;
    this.staticImageCanvas.height = this.canvas.height;
    this.staticImageCanvas.style.width = this.canvas.clientWidth + 'px';
    this.staticImageCanvas.style.height = this.canvas.clientHeight + 'px';
    
    // Show the overlay canvas
    this.staticImageCanvas.style.display = 'block';
    
    // Get 2D context from overlay canvas
    const ctx = this.staticImageCanvas.getContext('2d');
    
    // Clear the overlay canvas completely (transparent background, no black fill)
    ctx.clearRect(0, 0, this.staticImageCanvas.width, this.staticImageCanvas.height);
    
    // Calculate grid dimensions matching particle system logic
    // This ensures the static image is the same size as the particulated image
    const maxParticles = this.particleSystem.config.particleCount;
    const aspectRatio = image.width / image.height;
    let gridWidth, gridHeight;
    
    if (aspectRatio >= 1) {
      gridWidth = Math.floor(Math.sqrt(maxParticles * aspectRatio));
      gridHeight = Math.floor(gridWidth / aspectRatio);
    } else {
      gridHeight = Math.floor(Math.sqrt(maxParticles / aspectRatio));
      gridWidth = Math.floor(gridHeight * aspectRatio);
    }
    
    // Apply same constraints as ParticleSystem
    const MIN_GRID_DIMENSION = 10;
    const MAX_GRID_DIMENSION = 200;
    gridWidth = Math.max(MIN_GRID_DIMENSION, Math.min(gridWidth, MAX_GRID_DIMENSION));
    gridHeight = Math.max(MIN_GRID_DIMENSION, Math.min(gridHeight, MAX_GRID_DIMENSION));
    
    // Calculate scaling to match particle system (using grid dimensions, not original image dimensions)
    const scaleX = this.staticImageCanvas.width / gridWidth;
    const scaleY = this.staticImageCanvas.height / gridHeight;
    const IMAGE_PADDING_FACTOR = 0.9; // Match ParticleSystem
    const scale = Math.min(scaleX, scaleY) * IMAGE_PADDING_FACTOR;
    
    const scaledWidth = gridWidth * scale;
    const scaledHeight = gridHeight * scale;
    
    // Center the image (matching particle system positioning)
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
   * Start hybrid transition with all phases:
   * 1. Static display → 2. Disintegration → 3. Explosion → 4. Recombination → 5. Blend
   * @param {HTMLImageElement} sourceImage - Source image (displayed as static first)
   * @param {HTMLImageElement} targetImage - Target image  
   * @param {Object} config - Transition configuration
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
    
    // Call parent destroy
    super.destroy();
    
    console.log('[HybridEngine] Hybrid engine destroyed');
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.HybridEngine = HybridEngine;
}
