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
    
    // Interpolation factor for smooth transitions
    this.INTERPOLATION_FACTOR = 0.1;
    
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
   * Extract pixel data from an image
   * @param {HTMLImageElement} image - The image element
   * @param {number} maxParticles - Maximum number of particles to create
   * @returns {Object} - Contains pixels array and dimensions
   */
  extractImageData(image, maxParticles = 5000) {
    console.log('[ParticleSystem] Extracting image data...');
    
    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate grid dimensions to limit particle count
    const aspectRatio = image.width / image.height;
    let gridWidth, gridHeight;
    
    if (aspectRatio >= 1) {
      // Landscape or square
      gridWidth = Math.floor(Math.sqrt(maxParticles * aspectRatio));
      gridHeight = Math.floor(gridWidth / aspectRatio);
    } else {
      // Portrait
      gridHeight = Math.floor(Math.sqrt(maxParticles / aspectRatio));
      gridWidth = Math.floor(gridHeight * aspectRatio);
    }
    
    // Ensure minimum dimensions
    gridWidth = Math.max(this.MIN_GRID_DIMENSION, Math.min(gridWidth, this.MAX_GRID_DIMENSION));
    gridHeight = Math.max(this.MIN_GRID_DIMENSION, Math.min(gridHeight, this.MAX_GRID_DIMENSION));
    
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    
    // Draw scaled image
    ctx.drawImage(image, 0, 0, gridWidth, gridHeight);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
    const data = imageData.data;
    
    const pixels = [];
    
    // Sample pixels from the grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const a = data[idx + 3] / 255;
        
        // Only include pixels with sufficient opacity
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
    
    console.log(`[ParticleSystem] Extracted ${pixels.length} pixels from ${gridWidth}x${gridHeight} grid`);
    
    return {
      pixels: pixels,
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      originalWidth: image.width,
      originalHeight: image.height
    };
  }

  /**
   * Initialize particles from an image
   * @param {HTMLImageElement} image - The image element
   */
  initializeFromImage(image) {
    console.log('[ParticleSystem] Initializing particles from image...');
    
    const imageData = this.extractImageData(image, this.config.particleCount);
    const pixels = imageData.pixels;
    
    this.particles = [];
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scaleX = this.width / imageData.gridWidth;
    const scaleY = this.height / imageData.gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Calculate offset to center the image
    const offsetX = (this.width - imageData.gridWidth * scale) / 2;
    const offsetY = (this.height - imageData.gridHeight * scale) / 2;
    
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const x = offsetX + pixel.x * scale;
      const y = offsetY + pixel.y * scale;
      
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: pixel.r,
          g: pixel.g,
          b: pixel.b,
          alpha: pixel.alpha
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles from image`);
  }

  /**
   * Transition particles to an image
   * @param {HTMLImageElement} image - The target image element
   * @param {number} duration - Transition duration in milliseconds
   */
  transitionToImage(image, duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to image (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const imageData = this.extractImageData(image, this.particles.length);
    const pixels = imageData.pixels;
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scaleX = this.width / imageData.gridWidth;
    const scaleY = this.height / imageData.gridHeight;
    const scale = Math.min(scaleX, scaleY) * this.IMAGE_PADDING_FACTOR;
    
    // Calculate offset to center the image
    const offsetX = (this.width - imageData.gridWidth * scale) / 2;
    const offsetY = (this.height - imageData.gridHeight * scale) / 2;
    
    // If we have more particles than pixels, distribute them
    if (this.particles.length > pixels.length) {
      console.log(`[ParticleSystem] More particles (${this.particles.length}) than pixels (${pixels.length}), distributing...`);
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const pixelIndex = i % pixels.length;
        const pixel = pixels[pixelIndex];
        
        const x = offsetX + pixel.x * scale;
        const y = offsetY + pixel.y * scale;
        
        // Add slight random offset when reusing pixels
        const randomOffset = (i / pixels.length) * this.PARTICLE_DISTRIBUTION_OFFSET;
        
        particle.targetX = x + (Math.random() - 0.5) * randomOffset;
        particle.targetY = y + (Math.random() - 0.5) * randomOffset;
        particle.targetR = pixel.r;
        particle.targetG = pixel.g;
        particle.targetB = pixel.b;
      }
    } else {
      // Map particles to pixels
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
      }
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
    // Update transition progress
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        console.log('[ParticleSystem] Transition complete');
      }
    }
    
    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (this.isTransitioning) {
        // Smooth easing function (ease-in-out)
        const t = this.easeInOutCubic(this.transitionProgress);
        const factor = t * this.INTERPOLATION_FACTOR;
        
        // Interpolate position
        particle.x = particle.x + (particle.targetX - particle.x) * factor;
        particle.y = particle.y + (particle.targetY - particle.y) * factor;
        
        // Interpolate color
        particle.r = particle.r + (particle.targetR - particle.r) * factor;
        particle.g = particle.g + (particle.targetG - particle.g) * factor;
        particle.b = particle.b + (particle.targetB - particle.b) * factor;
      } else {
        // Free movement
        particle.x += particle.vx * deltaTime * this.config.speed;
        particle.y += particle.vy * deltaTime * this.config.speed;
        
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
}
