/**
 * Particle System with Transition Support
 * Manages particles and their transitions between states
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
    
    // Transition timing constants
    this.TRANSITION_ACTIVE_DURATION = 0.6; // 60% active movement window
    this.TRANSITION_MAX_DELAY = 0.4; // 40% maximum delay for staggered effect
    this.TRANSITION_INTERPOLATION_BOOST = 2; // Multiplier for more responsive transitions
    this.CONVERGENCE_DURATION_MS = 3000; // Initial convergence animation duration
    
    // Dispersal effect constants
    this.DISPERSAL_DISTANCE_MULTIPLIER = 50; // How far particles scatter initially
    this.NOISE_COORDINATE_SCALE = 0.1; // Scale factor for noise coordinate calculation
    
    // Noise generation constant (large prime-like number for good distribution)
    this.NOISE_MULTIPLIER = 43758.5453123;
    
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
      targetB: options.b !== undefined ? options.b : Math.random(),
      // Enhanced transition properties for dispersal effect
      originX: options.originX !== undefined ? options.originX : x,
      originY: options.originY !== undefined ? options.originY : y,
      noiseValue: options.noiseValue !== undefined ? options.noiseValue : Math.random(),
      transitionDelay: options.transitionDelay !== undefined ? options.transitionDelay : 0
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
   * Simple noise function for pseudo-random values
   * Used for particle dispersal and transition timing
   */
  noise(p) {
    const fl = Math.floor(p);
    const fc = p - fl;
    const rand1 = this.rand(fl);
    const rand2 = this.rand(fl + 1.0);
    return rand1 + (rand2 - rand1) * fc;
  }

  /**
   * Pseudo-random number generator for consistent noise
   */
  rand(n) {
    return Math.abs(Math.sin(n * this.NOISE_MULTIPLIER) % 1.0);
  }

  /**
   * Calculate dispersed position for particle dispersal effect
   * Particles start from far away positions and converge to form images
   */
  calculateDispersedPosition(x, y, width, height) {
    // Create directional variation based on position
    const modX = (x % 2) >= 1 ? 1 : -1;
    const modY = (y % 2) >= 1 ? 1 : -1;
    
    // Use noise for organic dispersal pattern
    const noiseX = this.noise(x * this.NOISE_COORDINATE_SCALE) * this.DISPERSAL_DISTANCE_MULTIPLIER * modX;
    const noiseY = this.noise(y * this.NOISE_COORDINATE_SCALE) * this.DISPERSAL_DISTANCE_MULTIPLIER * modY;
    
    return {
      x: x + noiseX,
      y: y + noiseY
    };
  }

  /**
   * Calculate noise-based transition delay for a particle
   * Used to create staggered, wave-like transitions
   */
  calculateParticleTransitionDelay(pixel) {
    const noiseValue = this.noise(pixel.x * this.NOISE_COORDINATE_SCALE + pixel.y * this.NOISE_COORDINATE_SCALE);
    return noiseValue * this.TRANSITION_MAX_DELAY;
  }

  /**
   * Extract pixel data from an image with optimized sampling for particle representation
   * 
   * This method intelligently samples images to create high-quality particle formations:
   * - Maintains aspect ratio for accurate image representation
   * - Optimizes grid size based on particle count for efficiency
   * - Filters low-opacity pixels to focus on visible content
   * - Preserves color fidelity for seamless transitions
   * 
   * @param {HTMLImageElement} image - The source image element
   * @param {number} maxParticles - Maximum number of particles to create
   * @returns {Object} Contains pixels array and image dimensions
   */
  extractImageData(image, maxParticles = 5000) {
    console.log('[ParticleSystem] Extracting image data for particle mapping...');
    
    // Create offscreen canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate optimal grid dimensions to match particle count while maintaining aspect ratio
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
    
    // Sample pixels from the grid, preserving color and position data
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const a = data[idx + 3] / 255;
        
        // Only include pixels with sufficient opacity for visible representation
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
    
    console.log(`[ParticleSystem] Extracted ${pixels.length} visible pixels from ${gridWidth}x${gridHeight} grid`);
    console.log(`[ParticleSystem] Original image: ${image.width}x${image.height}, Aspect ratio: ${aspectRatio.toFixed(2)}`);
    
    return {
      pixels: pixels,
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      originalWidth: image.width,
      originalHeight: image.height
    };
  }

  /**
   * Initialize particles from an image with dispersal effect
   * 
   * This creates particles that start from scattered positions and will
   * converge to form the image. This creates a dramatic entrance effect.
   * 
   * @param {HTMLImageElement} image - The source image element
   */
  initializeFromImage(image) {
    console.log('[ParticleSystem] Initializing particles from image with dispersal effect...');
    
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
    
    // Create particles with dispersed starting positions
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const targetX = offsetX + pixel.x * scale;
      const targetY = offsetY + pixel.y * scale;
      
      // Calculate dispersed starting position
      const dispersed = this.calculateDispersedPosition(
        targetX, targetY, this.width, this.height
      );
      
      // Generate noise value for this particle (used for transition delay)
      const noiseValue = this.noise(pixel.x * this.NOISE_COORDINATE_SCALE + pixel.y * this.NOISE_COORDINATE_SCALE);
      
      this.particles.push(this.createParticle(
        dispersed.x, dispersed.y,  // Start from dispersed position
        (Math.random() - 0.5) * this.MIN_INITIAL_VELOCITY_RANGE,
        (Math.random() - 0.5) * this.MIN_INITIAL_VELOCITY_RANGE,
        {
          r: pixel.r,
          g: pixel.g,
          b: pixel.b,
          alpha: pixel.alpha,
          originX: dispersed.x,
          originY: dispersed.y,
          noiseValue: noiseValue,
          transitionDelay: 0
        }
      ));
      
      // Set target to the actual image position
      const particle = this.particles[this.particles.length - 1];
      particle.targetX = targetX;
      particle.targetY = targetY;
    }
    
    // Automatically start transition to converge particles into image
    console.log(`[ParticleSystem] Created ${this.particles.length} dispersed particles`);
    console.log('[ParticleSystem] Starting automatic convergence transition...');
    this._startTransition(this.CONVERGENCE_DURATION_MS);
  }

  /**
   * Transition particles to a target image with enhanced dispersal effect
   * 
   * This method creates dramatic transitions between images by:
   * - First dispersing particles outward
   * - Then converging them to the new image formation
   * - Using staggered timing for wave-like transitions
   * - Interpolating both position and color smoothly
   * 
   * @param {HTMLImageElement} image - The target image to morph into
   * @param {number} duration - Transition duration in milliseconds (default: 2000ms)
   */
  transitionToImage(image, duration = 2000) {
    console.log(`[ParticleSystem] Starting enhanced transition to target image (${duration}ms)...`);
    
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
    
    // Handle particle-to-pixel mapping with enhanced dispersal effect
    if (this.particles.length > pixels.length) {
      // More particles than pixels: distribute particles across available pixels
      console.log(`[ParticleSystem] Distributing ${this.particles.length} particles across ${pixels.length} pixels...`);
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const pixelIndex = i % pixels.length;
        const pixel = pixels[pixelIndex];
        
        const targetX = offsetX + pixel.x * scale;
        const targetY = offsetY + pixel.y * scale;
        
        // Calculate dispersed intermediate position for transition effect
        const dispersed = this.calculateDispersedPosition(
          targetX, targetY, this.width, this.height
        );
        
        // Update particle origin to current position (for dispersal phase)
        particle.originX = particle.x;
        particle.originY = particle.y;
        
        // Set dispersed position as intermediate target
        // The update loop will handle the two-phase transition
        const distributionFactor = Math.floor(i / pixels.length);
        const randomOffset = distributionFactor * this.PARTICLE_DISTRIBUTION_OFFSET;
        
        particle.targetX = targetX + (Math.random() - 0.5) * randomOffset;
        particle.targetY = targetY + (Math.random() - 0.5) * randomOffset;
        particle.targetR = pixel.r;
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
        
        // Update noise value and delay for staggered effect
        particle.noiseValue = this.noise(pixel.x * this.NOISE_COORDINATE_SCALE + pixel.y * this.NOISE_COORDINATE_SCALE);
        particle.transitionDelay = particle.noiseValue * this.TRANSITION_MAX_DELAY;
      }
    } else {
      // Equal or fewer particles than pixels: direct 1-to-1 mapping
      console.log(`[ParticleSystem] Mapping ${this.particles.length} particles to image pixels...`);
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const pixel = pixels[i];
        
        const targetX = offsetX + pixel.x * scale;
        const targetY = offsetY + pixel.y * scale;
        
        // Update particle origin for dispersal phase
        particle.originX = particle.x;
        particle.originY = particle.y;
        
        particle.targetX = targetX;
        particle.targetY = targetY;
        particle.targetR = pixel.r;
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
        
        // Update noise value and delay for staggered effect
        particle.noiseValue = this.noise(pixel.x * this.NOISE_COORDINATE_SCALE + pixel.y * this.NOISE_COORDINATE_SCALE);
        particle.transitionDelay = particle.noiseValue * this.TRANSITION_MAX_DELAY;
      }
    }
    
    console.log('[ParticleSystem] Target positions and colors set for enhanced morphing');
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
    // Update transition progress
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        console.log('[ParticleSystem] Transition complete');
      }
    }
    
    // Update particles with enhanced staggered interpolation
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (this.isTransitioning) {
        // Calculate per-particle progress with staggered delay
        // This creates a wave-like transition effect
        const duration = this.TRANSITION_ACTIVE_DURATION; // Active transition duration
        const delay = particle.transitionDelay || 0; // Delay based on noise
        const end = delay + duration;
        
        // Smoothstep function for smooth acceleration/deceleration
        const rawProgress = Math.max(0, Math.min(1, 
          (this.transitionProgress - delay) / (end - delay)
        ));
        
        // Apply easing to the particle's individual progress
        const particleProgress = this.smoothStep(rawProgress);
        
        // Enhanced easing for smoother transitions
        const t = this.easeInOutCubic(particleProgress);
        
        // Adaptive interpolation with configurable boost for responsive movement
        const factor = t * this.INTERPOLATION_FACTOR * this.TRANSITION_INTERPOLATION_BOOST;
        
        // Interpolate position with enhanced smoothness
        particle.x = particle.x + (particle.targetX - particle.x) * factor;
        particle.y = particle.y + (particle.targetY - particle.y) * factor;
        
        // Interpolate color with synchronized timing for seamless visual transition
        particle.r = particle.r + (particle.targetR - particle.r) * factor;
        particle.g = particle.g + (particle.targetG - particle.g) * factor;
        particle.b = particle.b + (particle.targetB - particle.b) * factor;
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

  /**
   * Smooth step function for natural easing
   * Similar to GLSL smoothstep
   */
  smoothStep(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
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
   * 
   * @param {Object} imageData - Image data object from extractImageData()
   * @returns {Array} Array of target objects with {x, y, r, g, b} properties
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
    
    // Transform each pixel into a target position with color
    for (let pixel of pixels) {
      targets.push({
        x: offsetX + pixel.x * scale,
        y: offsetY + pixel.y * scale,
        r: pixel.r,
        g: pixel.g,
        b: pixel.b
      });
    }
    
    return targets;
  }
}
