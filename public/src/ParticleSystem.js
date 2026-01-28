/**
 * Particle System with Transition Support
 * Manages particles and their transitions between states
 * 
 * Key Features:
 * - Image-to-particle disintegration with turbulence and velocity
 * - Particle-to-image reintegration (reverse disintegration)
 * - Smooth transitions between formation patterns (grid, circle, spiral, random)
 * - Image morphing with color and position interpolation
 * - Easing functions for natural animation (easeInOutCubic)
 * - Dynamic particle size and opacity control
 * - Optimized image extraction and particle mapping
 */
export class ParticleSystem {
  constructor(config = {}) {
    this.particles = [];
    this.config = {
      particleCount: config.particleCount || 1000,
      speed: config.speed || 1.0,
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 8
    };
    
    this.width = 800;
    this.height = 600;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    
    // Smooth image-to-particle transition state
    this.isDisintegrating = false;
    this.isReintegrating = false;  // Track if we're reintegrating (reverse of disintegration)
    this.disintegrationProgress = 0;
    this.disintegrationDuration = 0;
    this.disintegrationStartTime = 0;
    
    // Transition and animation constants for image morphing optimization
    this.INTERPOLATION_FACTOR = 0.15;        // Enhanced from 0.1 for smoother convergence
    this.DRIFT_FACTOR = 0.1;                 // Reduced drift to maintain image structure
    this.MIN_INITIAL_VELOCITY_RANGE = 0.5;   // Minimal initial velocity for stable display
    
    // Image processing constants
    this.MIN_GRID_DIMENSION = 10;
    this.MAX_GRID_DIMENSION = 200;
    this.MIN_OPACITY_THRESHOLD = 0.1;
    this.IMAGE_PADDING_FACTOR = 0.9; // 90% to add padding
    this.PARTICLE_DISTRIBUTION_OFFSET = 2;
    
    console.log('[ParticleSystem] Initialized with config:', this.config);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    console.log(`[ParticleSystem] Dimensions set to ${width}x${height}`);
  }

  createParticle(x, y, vx, vy, options = {}) {
    return {
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy || 0,
      r: options.r !== undefined ? options.r : Math.random(),
      g: options.g !== undefined ? options.g : Math.random(),
      b: options.b !== undefined ? options.b : Math.random(),
      alpha: options.alpha !== undefined ? options.alpha : 1.0,
      size: options.size || (this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize)),
      life: options.life !== undefined ? options.life : 1.0,
      targetX: x,
      targetY: y,
      targetR: options.r !== undefined ? options.r : Math.random(),
      targetG: options.g !== undefined ? options.g : Math.random(),
      targetB: options.b !== undefined ? options.b : Math.random()
    };
  }

  initializeRandom() {
    console.log(`[ParticleSystem] Initializing ${this.config.particleCount} random particles...`);
    
    this.particles = [];
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() - 0.5) * 2 * this.config.speed;
      
      this.particles.push(this.createParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        {
          r: Math.random() * 0.5 + 0.5,
          g: Math.random() * 0.5 + 0.3,
          b: Math.random() * 0.8 + 0.2
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles`);
  }

  initializeGrid() {
    console.log(`[ParticleSystem] Initializing particles in grid formation...`);
    
    this.particles = [];
    const cols = Math.ceil(Math.sqrt(this.config.particleCount));
    const rows = Math.ceil(this.config.particleCount / cols);
    const spacingX = this.width / (cols + 1);
    const spacingY = this.height / (rows + 1);
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spacingX * (col + 1);
      const y = spacingY * (row + 1);
      
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: 0.3 + (col / cols) * 0.7,
          g: 0.5,
          b: 0.8 - (row / rows) * 0.5
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in ${cols}x${rows} grid`);
  }

  initializeCircle() {
    console.log(`[ParticleSystem] Initializing particles in circle formation...`);
    
    this.particles = [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const angle = (i / this.config.particleCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const hue = i / this.config.particleCount;
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: Math.abs(Math.cos(hue * Math.PI * 2)),
          g: Math.abs(Math.sin(hue * Math.PI * 2)),
          b: Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2))
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in circle formation`);
  }

  initializeSpiral() {
    console.log(`[ParticleSystem] Initializing particles in spiral formation...`);
    
    this.particles = [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const t = i / this.config.particleCount;
      const angle = t * Math.PI * 8; // 4 full rotations
      const radius = t * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: 0.8 - t * 0.4,
          g: 0.4 + t * 0.4,
          b: 0.9
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in spiral formation`);
  }

  /**
   * Extract pixel data from an image with fixed grid sampling for particle representation
   * 
   * This method uses a fixed grid resolution for consistent particle count and performance:
   * - Uses fixed grid resolution instead of variable sampling
   * - Maintains aspect ratio for accurate image representation
   * - Filters low-opacity pixels to reduce unnecessary particles
   * - Dynamically calculates particle size to fill gaps in sparse grids
   * - Preserves color fidelity for seamless transitions
   * 
   * @param {HTMLImageElement} image - The source image element
   * @param {number} maxParticles - Maximum number of particles (used to determine grid resolution)
   * @returns {Object} Contains pixels array, image dimensions, and calculated particle size
   */
  extractImageData(image, maxParticles = 5000) {
    console.log('[ParticleSystem] Extracting image data with fixed grid sampling...');
    
    // Create offscreen canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate fixed grid dimensions based on target particle count while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let gridWidth, gridHeight;
    
    if (aspectRatio >= 1) {
      // Landscape or square: scale width first
      gridWidth = Math.floor(Math.sqrt(maxParticles * aspectRatio));
      gridHeight = Math.floor(gridWidth / aspectRatio);
    } else {
      // Portrait: scale height first
      gridHeight = Math.floor(Math.sqrt(maxParticles / aspectRatio));
      gridWidth = Math.floor(gridHeight * aspectRatio);
    }
    
    // Enforce dimension constraints for optimal performance and quality
    gridWidth = Math.max(this.MIN_GRID_DIMENSION, Math.min(gridWidth, this.MAX_GRID_DIMENSION));
    gridHeight = Math.max(this.MIN_GRID_DIMENSION, Math.min(gridHeight, this.MAX_GRID_DIMENSION));
    
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    
    // Draw scaled image with high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, gridWidth, gridHeight);
    
    // Extract pixel data
    const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
    const data = imageData.data;
    
    const pixels = [];
    
    // Sample pixels from the fixed grid, filtering by opacity
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const a = data[idx + 3] / 255;
        
        // Filter out low-opacity pixels to reduce unnecessary particles
        if (a > this.MIN_OPACITY_THRESHOLD) {
          pixels.push({
            x: x,
            y: y,
            r: r,
            g: g,
            b: b,
            alpha: a
          });
        }
      }
    }
    
    // Calculate particle size based on grid resolution and canvas dimensions
    // Larger particles fill gaps when grid is sparse
    const scaleX = this.width / gridWidth;
    const scaleY = this.height / gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Dynamic particle size calculation:
    // - Base size is proportional to grid cell size (scale)
    // - Increased multiplier (1.2) ensures dense coverage with overlap
    // - Clamp between min/max for consistency
    const calculatedParticleSize = Math.max(
      this.config.minSize, 
      Math.min(this.config.maxSize, scale * 1.2)
    );
    
    console.log(`[ParticleSystem] Fixed grid: ${gridWidth}x${gridHeight}, Extracted ${pixels.length} visible pixels`);
    console.log(`[ParticleSystem] Original image: ${image.width}x${image.height}, Aspect ratio: ${aspectRatio.toFixed(2)}`);
    console.log(`[ParticleSystem] Calculated particle size: ${calculatedParticleSize.toFixed(2)} (scale: ${scale.toFixed(2)})`);
    
    return {
      pixels: pixels,
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      originalWidth: image.width,
      originalHeight: image.height,
      particleSize: calculatedParticleSize  // Add calculated size to return value
    };
  }

  /**
   * Initialize particles from an image for the first display
   * 
   * This creates the initial particle formation that represents the source image.
   * Particles are positioned and colored to accurately represent the image pixels.
   * Uses dynamically calculated particle size from extractImageData for dense coverage.
   * 
   * @param {HTMLImageElement} image - The source image element
   */
  initializeFromImage(image) {
    console.log('[ParticleSystem] Initializing particles from image for display...');
    
    const imageData = this.extractImageData(image, this.config.particleCount);
    const pixels = imageData.pixels;
    
    this.particles = [];
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scaleX = this.width / imageData.gridWidth;
    const scaleY = this.height / imageData.gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Calculate offset to center the image on canvas
    const offsetX = (this.width - imageData.gridWidth * scale) / 2;
    const offsetY = (this.height - imageData.gridHeight * scale) / 2;
    
    // Use dynamically calculated particle size from extractImageData
    // This ensures dense coverage with minimal sparsity
    const particleSize = imageData.particleSize;
    
    // Create particles with minimal initial velocity for stable image display
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const x = offsetX + pixel.x * scale;
      const y = offsetY + pixel.y * scale;
      
      this.particles.push(this.createParticle(
        x, y, 
        (Math.random() - 0.5) * this.MIN_INITIAL_VELOCITY_RANGE,  // Minimal x velocity
        (Math.random() - 0.5) * this.MIN_INITIAL_VELOCITY_RANGE,  // Minimal y velocity
        {
          r: pixel.r,
          g: pixel.g,
          b: pixel.b,
          alpha: pixel.alpha,
          size: particleSize
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles representing the image with size ${particleSize.toFixed(2)}`);
  }

  /**
   * Transition particles to a target image with seamless morphing
   * 
   * This method creates smooth, visually appealing transitions between images by:
   * - Mapping particles to target image pixels
   * - Interpolating both position and color
   * - Handling particle count mismatches gracefully
   * - Maintaining aspect ratio and centering
   * - Adjusting particle sizes proportionally to image scale using calculated size
   * 
   * @param {HTMLImageElement} image - The target image to morph into
   * @param {number} duration - Transition duration in milliseconds (default: 2000ms)
   */
  transitionToImage(image, duration = 2000) {
    console.log(`[ParticleSystem] Starting seamless transition to target image (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const imageData = this.extractImageData(image, this.particles.length);
    const pixels = imageData.pixels;
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scaleX = this.width / imageData.gridWidth;
    const scaleY = this.height / imageData.gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Calculate offset to center the target image
    const offsetX = (this.width - imageData.gridWidth * scale) / 2;
    const offsetY = (this.height - imageData.gridHeight * scale) / 2;
    
    // Use dynamically calculated particle size from extractImageData
    const targetParticleSize = imageData.particleSize;
    
    // Handle particle-to-pixel mapping for seamless transitions
    if (this.particles.length > pixels.length) {
      // More particles than pixels: distribute particles across available pixels
      console.log(`[ParticleSystem] Distributing ${this.particles.length} particles across ${pixels.length} pixels...`);
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const pixelIndex = i % pixels.length;
        const pixel = pixels[pixelIndex];
        
        const x = offsetX + pixel.x * scale;
        const y = offsetY + pixel.y * scale;
        
        // Distribute particles with increasing offsets to avoid stacking
        // Logic: When we have more particles than pixels, we cycle through pixels
        // For each "round" through the pixel array, increase the random offset
        // Example: particles 0-999 use pixels 0-499 with offset 0
        //          particles 1000-1999 use pixels 0-499 with offset 2
        //          particles 2000-2999 use pixels 0-499 with offset 4, etc.
        const distributionFactor = Math.floor(i / pixels.length);  // Which "round" through pixels
        const randomOffset = distributionFactor * this.PARTICLE_DISTRIBUTION_OFFSET;
        
        particle.targetX = x + (Math.random() - 0.5) * randomOffset;
        particle.targetY = y + (Math.random() - 0.5) * randomOffset;
        particle.targetR = pixel.r;
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
        particle.targetSize = targetParticleSize;
      }
    } else {
      // Equal or fewer particles than pixels: direct 1-to-1 mapping
      console.log(`[ParticleSystem] Mapping ${this.particles.length} particles to image pixels...`);
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const pixel = pixels[i];
        
        const x = offsetX + pixel.x * scale;
        const y = offsetY + pixel.y * scale;
        
        particle.targetX = x;
        particle.targetY = y;
        particle.targetR = pixel.r;
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
        particle.targetSize = targetParticleSize;
      }
    }
    
    console.log(`[ParticleSystem] Target positions, colors, and sizes set for seamless morphing (size: ${targetParticleSize.toFixed(2)})`);
  }
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
        particle.targetSize = targetParticleSize;
      }
    }
    
    console.log(`[ParticleSystem] Target positions, colors, and sizes set for seamless morphing (size: ${targetParticleSize.toFixed(2)})`);
  }

  /**
   * Start the disintegration effect from solid image to particles
   * @param {number} duration - Duration of the disintegration in milliseconds
   */
  startDisintegration(duration = 2000) {
    console.log(`[ParticleSystem] Starting disintegration effect (${duration}ms)...`);
    
    this.isDisintegrating = true;
    this.disintegrationProgress = 0;
    this.disintegrationDuration = duration;
    this.disintegrationStartTime = Date.now();
    
    // Initialize particle dispersion targets once, outside the loop
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Store initial particle positions as targets (only if not already set)
      if (particle.initialX === undefined) {
        particle.initialX = particle.x;
        particle.initialY = particle.y;
        particle.initialSize = particle.size;
      }
    }
    
    // Set dispersion targets for all particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Set dispersion targets with easing
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 200; // Particles will disperse 50-250 pixels
      
      particle.disperseX = particle.initialX + Math.cos(angle) * distance;
      particle.disperseY = particle.initialY + Math.sin(angle) * distance;
      particle.disperseSize = particle.initialSize * (0.5 + Math.random() * 1.0); // Varying sizes
    }
  }

  /**
   * Stop the disintegration effect
   */
  stopDisintegration() {
    this.isDisintegrating = false;
    this.isReintegrating = false;
    this.disintegrationProgress = 0;
    console.log('[ParticleSystem] Disintegration stopped');
  }

  /**
   * Start the reintegration effect from particles back to solid image
   * This reverses the disintegration process, bringing particles back to their original positions
   * 
   * Note: Stores current particle positions as dispersion targets before reintegrating.
   * This ensures particles smoothly return from wherever they currently are.
   * 
   * @param {number} duration - Duration of the reintegration in milliseconds
   */
  startReintegration(duration = 2000) {
    console.log(`[ParticleSystem] Starting reintegration effect (${duration}ms)...`);
    
    // If particles have initial positions stored, we can reintegrate
    if (this.particles.length > 0 && this.particles[0].initialX !== undefined) {
      this.isDisintegrating = true; // Use same mechanism but in reverse
      this.disintegrationDuration = duration;
      this.disintegrationStartTime = Date.now();
      this.disintegrationProgress = 1.0; // Start at fully dispersed (1.0) and go to 0
      
      // Store current positions as dispersion targets for smooth animation
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.disperseX = particle.x;
        particle.disperseY = particle.y;
        particle.disperseSize = particle.size;
      }
      
      // Mark this as a reverse transition
      this.isReintegrating = true;
      
      console.log('[ParticleSystem] Reintegration: Stored current positions, returning to initial positions');
    } else {
      console.warn('[ParticleSystem] Cannot reintegrate - no initial positions stored. Call startDisintegration first.');
    }
  }

  /**
   * Get the current disintegration progress (0.0 to 1.0)
   */
  getDisintegrationProgress() {
    return this.disintegrationProgress;
  }

  /**
   * Set disintegration progress manually (0.0 to 1.0)
   * Useful for external control via slider
   */
  setDisintegrationProgress(progress) {
    this.disintegrationProgress = Math.max(0, Math.min(1, progress));
    
    if (progress > 0 && !this.isDisintegrating) {
      this.isDisintegrating = true;
    } else if (progress <= 0) {
      this.isDisintegrating = false;
    }
  }

  _startTransition(duration) {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionStartTime = Date.now();
  }

  transitionToGrid(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to grid (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const cols = Math.ceil(Math.sqrt(this.particles.length));
    const rows = Math.ceil(this.particles.length / cols);
    const spacingX = this.width / (cols + 1);
    const spacingY = this.height / (rows + 1);
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      particle.targetX = spacingX * (col + 1);
      particle.targetY = spacingY * (row + 1);
      particle.targetR = 0.3 + (col / cols) * 0.7;
      particle.targetG = 0.5;
      particle.targetB = 0.8 - (row / rows) * 0.5;
    }
  }

  transitionToCircle(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to circle (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const angle = (i / this.particles.length) * Math.PI * 2;
      
      particle.targetX = centerX + Math.cos(angle) * radius;
      particle.targetY = centerY + Math.sin(angle) * radius;
      
      const hue = i / this.particles.length;
      particle.targetR = Math.abs(Math.cos(hue * Math.PI * 2));
      particle.targetG = Math.abs(Math.sin(hue * Math.PI * 2));
      particle.targetB = Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2));
    }
  }

  transitionToSpiral(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to spiral (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const t = i / this.particles.length;
      const angle = t * Math.PI * 8;
      const radius = t * maxRadius;
      
      particle.targetX = centerX + Math.cos(angle) * radius;
      particle.targetY = centerY + Math.sin(angle) * radius;
      particle.targetR = 0.8 - t * 0.4;
      particle.targetG = 0.4 + t * 0.4;
      particle.targetB = 0.9;
    }
  }

  transitionToRandom(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to random (${duration}ms)...`);
    
    this._startTransition(duration);
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      particle.targetX = Math.random() * this.width;
      particle.targetY = Math.random() * this.height;
      particle.targetR = Math.random() * 0.5 + 0.5;
      particle.targetG = Math.random() * 0.5 + 0.3;
      particle.targetB = Math.random() * 0.8 + 0.2;
    }
  }

  update(deltaTime) {
    // Update disintegration/reintegration progress
    if (this.isDisintegrating && this.disintegrationDuration > 0) {
      const elapsed = Date.now() - this.disintegrationStartTime;
      
      if (this.isReintegrating) {
        // For reintegration, progress goes from 1.0 down to 0.0
        this.disintegrationProgress = Math.max(1.0 - (elapsed / this.disintegrationDuration), 0);
        
        if (this.disintegrationProgress <= 0) {
          this.isDisintegrating = false;
          this.isReintegrating = false;
          console.log('[ParticleSystem] Reintegration complete');
        }
      } else {
        // For disintegration, progress goes from 0.0 up to 1.0
        this.disintegrationProgress = Math.min(elapsed / this.disintegrationDuration, 1);
        
        if (this.disintegrationProgress >= 1) {
          this.isDisintegrating = false;
          console.log('[ParticleSystem] Disintegration complete');
        }
      }
    }
    
    // Update transition progress
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        console.log('[ParticleSystem] Transition complete');
      }
    }
    
    // Update particles with optimized interpolation for image morphing
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Handle disintegration effect
      if (this.disintegrationProgress > 0) {
        const t = this.easeInOutCubic(this.disintegrationProgress);
        
        // Interpolate position from initial to dispersed
        if (particle.initialX !== undefined && particle.disperseX !== undefined) {
          particle.x = particle.initialX + (particle.disperseX - particle.initialX) * t;
          particle.y = particle.initialY + (particle.disperseY - particle.initialY) * t;
          
          // Size transition: start small, grow to dispersed size
          if (particle.initialSize !== undefined && particle.disperseSize !== undefined) {
            particle.size = particle.initialSize + (particle.disperseSize - particle.initialSize) * t;
          }
          
          // Particle opacity increases during disintegration
          particle.alpha = 0.3 + 0.7 * t; // Start at 30%, grow to 100%
        }
      } else if (this.isTransitioning) {
        // Enhanced easing function for smoother image transitions
        // Using ease-in-out-cubic provides a more natural, fluid morph effect
        const t = this.easeInOutCubic(this.transitionProgress);
        
        // Adaptive interpolation using class constant for consistency
        // This creates a smooth acceleration and deceleration effect
        const factor = t * this.INTERPOLATION_FACTOR;
        
        // Interpolate position with enhanced smoothness
        particle.x = particle.x + (particle.targetX - particle.x) * factor;
        particle.y = particle.y + (particle.targetY - particle.y) * factor;
        
        // Interpolate color with synchronized timing for seamless visual transition
        particle.r = particle.r + (particle.targetR - particle.r) * factor;
        particle.g = particle.g + (particle.targetG - particle.g) * factor;
        particle.b = particle.b + (particle.targetB - particle.b) * factor;
        
        // Interpolate size if target size is defined
        if (particle.targetSize !== undefined) {
          particle.size = particle.size + (particle.targetSize - particle.size) * factor;
        }
      } else {
        // Free movement with reduced drift to maintain image structure
        particle.x += particle.vx * deltaTime * this.config.speed * this.DRIFT_FACTOR;
        particle.y += particle.vy * deltaTime * this.config.speed * this.DRIFT_FACTOR;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > this.width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(this.width, particle.x));
        }
        if (particle.y < 0 || particle.y > this.height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(this.height, particle.y));
        }
      }
    }
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getParticles() {
    return this.particles;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[ParticleSystem] Config updated:', this.config);
  }

  /**
   * Generate target positions for a pattern
   * @param {string} pattern - Pattern name ('grid', 'circle', 'spiral', 'random')
   * @param {number} count - Number of targets to generate
   * @returns {Array} Array of target objects {x, y, r, g, b}
   */
  generateTargets(pattern, count) {
    const targets = [];
    
    switch (pattern) {
      case 'grid':
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const spacingX = this.width / (cols + 1);
        const spacingY = this.height / (rows + 1);
        
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          targets.push({
            x: spacingX * (col + 1),
            y: spacingY * (row + 1),
            r: 0.3 + (col / cols) * 0.7,
            g: 0.5,
            b: 0.8 - (row / rows) * 0.5
          });
        }
        break;
        
      case 'circle':
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.35;
        
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const hue = i / count;
          targets.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            r: Math.abs(Math.cos(hue * Math.PI * 2)),
            g: Math.abs(Math.sin(hue * Math.PI * 2)),
            b: Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2))
          });
        }
        break;
        
      case 'spiral':
        const spiralCenterX = this.width / 2;
        const spiralCenterY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) * 0.4;
        
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const angle = t * Math.PI * 8;
          const r = t * maxRadius;
          targets.push({
            x: spiralCenterX + Math.cos(angle) * r,
            y: spiralCenterY + Math.sin(angle) * r,
            r: 0.8 - t * 0.4,
            g: 0.4 + t * 0.4,
            b: 0.9
          });
        }
        break;
        
      case 'random':
      default:
        for (let i = 0; i < count; i++) {
          targets.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            r: Math.random() * 0.5 + 0.5,
            g: Math.random() * 0.5 + 0.3,
            b: Math.random() * 0.8 + 0.2
          });
        }
        break;
    }
    
    return targets;
  }

  /**
   * Convert image data to target array for preset-based transitions
   * 
   * This helper method transforms extracted image pixel data into a format
   * suitable for the preset system's transition mechanisms. It maintains
   * aspect ratio and proper centering.
   * Uses dynamically calculated particle size for dense coverage.
   * 
   * @param {Object} imageData - Image data object from extractImageData()
   * @returns {Array} Array of target objects with {x, y, r, g, b, size} properties
   */
  imageDataToTargets(imageData) {
    const targets = [];
    const pixels = imageData.pixels;
    
    // Calculate scaling to fit canvas while preserving aspect ratio
    const scaleX = this.width / imageData.gridWidth;
    const scaleY = this.height / imageData.gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Calculate offset to center the image on canvas
    const offsetX = (this.width - imageData.gridWidth * scale) / 2;
    const offsetY = (this.height - imageData.gridHeight * scale) / 2;
    
    // Use dynamically calculated particle size from extractImageData
    const targetParticleSize = imageData.particleSize;
    
    // Transform each pixel into a target position with color and size
    for (let pixel of pixels) {
      targets.push({
        x: offsetX + pixel.x * scale,
        y: offsetY + pixel.y * scale,
        r: pixel.r,
        g: pixel.g,
        b: pixel.b,
        size: targetParticleSize
      });
    }
    
    return targets;
  }
}
