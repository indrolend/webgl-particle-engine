/**
 * AlienTransitionEngine - Simplified engine for alien jelly/liquid mesh transitions
 * 
 * Focuses solely on elastic mesh with blob rendering for organic transitions.
 * Phases: static → explode → snap back (with color blend) → final
 * No particle system, no presets, no triangulation - just pure mesh physics.
 */

import { ElasticMesh } from './mesh/ElasticMesh.js';
import { MeshPhysics } from './mesh/MeshPhysics.js';
import { BlobRenderer } from './blob/BlobRenderer.js';
import { Renderer } from './Renderer.js';

export class AlienTransitionEngine {
  /**
   * Create alien transition engine
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering
   * @param {Object} config - Configuration options
   */
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      // Mesh configuration
      gridDensity: config.gridDensity || 1.5, // vertices per 100px
      springConstant: config.springConstant || 0.3,
      damping: config.damping || 0.95,
      breakThreshold: config.breakThreshold || 300,
      reconnectThreshold: config.reconnectThreshold || 80,
      alphaThreshold: config.alphaThreshold || 0.5,
      
      // Blob rendering configuration
      blobThreshold: config.blobThreshold || 1.0,
      blobInfluenceRadius: config.blobInfluenceRadius || 80,
      blobResolution: config.blobResolution || 4,
      fillOpacity: config.fillOpacity || 0.85,
      edgeSoftness: config.edgeSoftness || 0.15,
      
      // Transition timing (milliseconds)
      staticDuration: config.staticDuration || 500,
      explodeDuration: config.explodeDuration || 800,
      snapBackDuration: config.snapBackDuration || 2000,
      blendDuration: config.blendDuration || 1500,
      finalDuration: config.finalDuration || 500,
      
      // Physics parameters
      explosionIntensity: config.explosionIntensity || 120,
      snapSpeed: config.snapSpeed || 0.25,
      
      ...config
    };
    
    // Initialize components
    this.renderer = new Renderer(canvas);
    this.elasticMesh = new ElasticMesh({
      width: canvas.width,
      height: canvas.height,
      gridDensity: this.config.gridDensity,
      springConstant: this.config.springConstant,
      damping: this.config.damping,
      breakThreshold: this.config.breakThreshold,
      alphaThreshold: this.config.alphaThreshold
    });
    this.meshPhysics = new MeshPhysics(this.elasticMesh, {
      springConstant: this.config.springConstant,
      damping: this.config.damping,
      breakThreshold: this.config.breakThreshold,
      reconnectThreshold: this.config.reconnectThreshold,
      targetAttractionStrength: this.config.snapSpeed
    });
    this.blobRenderer = new BlobRenderer(canvas, {
      threshold: this.config.blobThreshold,
      influenceRadius: this.config.blobInfluenceRadius,
      resolution: this.config.blobResolution,
      fillOpacity: this.config.fillOpacity,
      edgeSoftness: this.config.edgeSoftness
    });
    
    // Transition state
    this.transitionState = {
      active: false,
      phase: 'idle', // idle, static, explode, snapback, blend, final
      phaseStartTime: 0,
      sourceImage: null,
      targetImage: null,
      sourceImageData: null,
      targetImageData: null
    };
    
    // Animation state
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    
    console.log('[AlienTransitionEngine] Initialized', this.config);
  }
  
  /**
   * Start a transition from source to target image
   * @param {HTMLImageElement} sourceImage - Source image
   * @param {HTMLImageElement} targetImage - Target image
   * @param {Object} options - Override configuration for this transition
   * @returns {Promise} Resolves when transition completes
   */
  async transition(sourceImage, targetImage, options = {}) {
    // Merge options with config
    const transConfig = { ...this.config, ...options };
    
    console.log('[AlienTransitionEngine] Starting transition');
    
    // Stop any existing transition
    this.stop();
    
    // Extract image data
    this.transitionState.sourceImageData = this.extractImageData(sourceImage);
    this.transitionState.targetImageData = this.extractImageData(targetImage);
    this.transitionState.sourceImage = sourceImage;
    this.transitionState.targetImage = targetImage;
    
    // Generate mesh from source image
    this.elasticMesh.generateMesh(this.transitionState.sourceImageData);
    
    // Set target positions from target image
    this.elasticMesh.setTargetPositions(this.transitionState.targetImageData);
    
    // Start transition state machine
    this.transitionState.active = true;
    this.transitionState.phase = 'static';
    this.transitionState.phaseStartTime = performance.now();
    
    // Start animation loop
    this.start();
    
    // Return promise that resolves when complete
    return new Promise((resolve) => {
      this.transitionState.onComplete = resolve;
    });
  }
  
  /**
   * Extract ImageData from an image
   * @param {HTMLImageElement} image - Image to extract from
   * @returns {ImageData} Image data
   */
  extractImageData(image) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    
    // Calculate scaling to fit canvas
    const scale = Math.min(
      this.canvas.width / image.width,
      this.canvas.height / image.height
    );
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const offsetX = (this.canvas.width - scaledWidth) / 2;
    const offsetY = (this.canvas.height - scaledHeight) / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw image
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Get image data
    return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  }
  
  /**
   * Start the animation loop
   */
  start() {
    if (this.animationFrameId) return;
    
    this.lastFrameTime = performance.now();
    this.animate();
  }
  
  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.transitionState.active = false;
  }
  
  /**
   * Animation loop
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Update transition state machine
    this.updateTransition(currentTime, deltaTime);
    
    // Update physics
    if (this.transitionState.active && this.transitionState.phase !== 'static' && this.transitionState.phase !== 'final') {
      this.meshPhysics.update(deltaTime);
    }
    
    // Render
    this.render();
  }
  
  /**
   * Update transition state machine
   * @param {number} currentTime - Current time in milliseconds
   * @param {number} deltaTime - Delta time in seconds
   */
  updateTransition(currentTime, deltaTime) {
    if (!this.transitionState.active) return;
    
    const elapsed = currentTime - this.transitionState.phaseStartTime;
    const { phase } = this.transitionState;
    
    switch (phase) {
      case 'static':
        // Show static source image
        if (elapsed >= this.config.staticDuration) {
          console.log('[AlienTransitionEngine] Phase: explode');
          this.transitionState.phase = 'explode';
          this.transitionState.phaseStartTime = currentTime;
          
          // Trigger explosion
          this.elasticMesh.explode(this.config.explosionIntensity);
        }
        break;
        
      case 'explode':
        // Let mesh explode and scatter
        if (elapsed >= this.config.explodeDuration) {
          console.log('[AlienTransitionEngine] Phase: snapback');
          this.transitionState.phase = 'snapback';
          this.transitionState.phaseStartTime = currentTime;
          
          // Start morphing to target
          this.meshPhysics.startMorphing(this.config.snapBackDuration);
        }
        break;
        
      case 'snapback':
        // Mesh snaps back to target shape with color blend
        if (elapsed >= this.config.snapBackDuration) {
          console.log('[AlienTransitionEngine] Phase: blend');
          this.transitionState.phase = 'blend';
          this.transitionState.phaseStartTime = currentTime;
          
          this.meshPhysics.stopMorphing();
        }
        break;
        
      case 'blend':
        // Final color blend and settling
        if (elapsed >= this.config.blendDuration) {
          console.log('[AlienTransitionEngine] Phase: final');
          this.transitionState.phase = 'final';
          this.transitionState.phaseStartTime = currentTime;
        }
        break;
        
      case 'final':
        // Show final static image
        if (elapsed >= this.config.finalDuration) {
          console.log('[AlienTransitionEngine] Transition complete');
          this.transitionState.phase = 'idle';
          this.transitionState.active = false;
          
          if (this.transitionState.onComplete) {
            this.transitionState.onComplete();
          }
        }
        break;
    }
  }
  
  /**
   * Render current frame
   */
  render() {
    const { phase } = this.transitionState;
    
    // Clear canvas
    const gl = this.renderer.gl;
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (phase === 'idle' || !this.transitionState.active) {
      return;
    }
    
    if (phase === 'static') {
      // Render static source image
      if (this.transitionState.sourceImage) {
        this.renderStaticImage(this.transitionState.sourceImage);
      }
    } else if (phase === 'final') {
      // Render static target image
      if (this.transitionState.targetImage) {
        this.renderStaticImage(this.transitionState.targetImage);
      }
    } else {
      // During transition phases, render background image so users can see what's transitioning
      this.renderTransitionBackground();
      
      // Then render blob mesh on top for the jelly effect
      this.renderMeshAsBlobs();
    }
  }
  
  /**
   * Render background image during transition phases
   */
  renderTransitionBackground() {
    const { phase } = this.transitionState;
    
    if (phase === 'explode') {
      // Show source image during explosion
      if (this.transitionState.sourceImage) {
        this.renderStaticImage(this.transitionState.sourceImage);
      }
    } else if (phase === 'snapback') {
      // Crossfade from source to target during snapback
      const elapsed = performance.now() - this.transitionState.phaseStartTime;
      const progress = Math.min(elapsed / this.config.snapBackDuration, 1.0);
      
      // Render source image first
      if (this.transitionState.sourceImage && progress < 1.0) {
        if (!this.renderer.imageLoaded || this.renderer.lastLoadedImage !== this.transitionState.sourceImage) {
          this.renderer.loadImageTexture(this.transitionState.sourceImage);
          this.renderer.lastLoadedImage = this.transitionState.sourceImage;
        }
        this.renderer.renderImage(1.0 - progress);
      }
      
      // Render target image on top with increasing opacity
      if (this.transitionState.targetImage && progress > 0) {
        if (!this.renderer.imageLoaded || this.renderer.lastLoadedImage !== this.transitionState.targetImage) {
          this.renderer.loadImageTexture(this.transitionState.targetImage);
          this.renderer.lastLoadedImage = this.transitionState.targetImage;
        }
        this.renderer.renderImage(progress);
      }
    } else if (phase === 'blend') {
      // Show target image during blend phase
      if (this.transitionState.targetImage) {
        this.renderStaticImage(this.transitionState.targetImage);
      }
    }
  }
  
  /**
   * Render a static image to the canvas
   * @param {HTMLImageElement} image - Image to render
   */
  renderStaticImage(image) {
    // Load texture if needed
    if (!this.renderer.imageLoaded || this.renderer.lastLoadedImage !== image) {
      this.renderer.loadImageTexture(image);
      this.renderer.lastLoadedImage = image;
    }
    
    // Render at full opacity
    this.renderer.renderImage(1.0);
  }
  
  /**
   * Render mesh vertices as blob (solid fill)
   */
  renderMeshAsBlobs() {
    // Convert mesh vertices to blob particles
    const particles = this.elasticMesh.vertices.map(v => {
      // Calculate blend progress during snapback and blend phases
      let color = v.color;
      if (this.transitionState.phase === 'blend' && v.targetColor) {
        const elapsed = performance.now() - this.transitionState.phaseStartTime;
        const blendProgress = Math.min(elapsed / this.config.blendDuration, 1.0);
        
        // Blend colors
        color = {
          r: v.color.r + (v.targetColor.r - v.color.r) * blendProgress,
          g: v.color.g + (v.targetColor.g - v.color.g) * blendProgress,
          b: v.color.b + (v.targetColor.b - v.color.b) * blendProgress,
          a: v.color.a + (v.targetColor.a - v.color.a) * blendProgress
        };
      }
      
      return {
        x: v.x,
        y: v.y,
        r: color.r,
        g: color.g,
        b: color.b,
        alpha: color.a,
        size: 1.0 // Size for metaball calculation
      };
    });
    
    // Render using blob renderer (solid fill)
    this.blobRenderer.render(particles, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    console.log('[AlienTransitionEngine] Destroying...');
    this.stop();
    
    if (this.renderer) {
      this.renderer.destroy();
    }
    
    if (this.blobRenderer) {
      this.blobRenderer.dispose();
    }
    
    console.log('[AlienTransitionEngine] Destroyed');
  }
  
  /**
   * Get current mesh statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      mesh: this.elasticMesh.getStats(),
      physics: this.meshPhysics.getStats(),
      blobs: this.blobRenderer.getBlobCount(),
      phase: this.transitionState.phase
    };
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.AlienTransitionEngine = AlienTransitionEngine;
}
