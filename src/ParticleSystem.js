/**
 * Particle System with Transition Support
 * Manages particles and their transitions between states
 */
import { Particle } from './particles/Particle.js';
import { GridPattern } from './patterns/GridPattern.js';
import { CirclePattern } from './patterns/CirclePattern.js';
import { SpiralPattern } from './patterns/SpiralPattern.js';
import { RandomPattern } from './patterns/RandomPattern.js';
import { easeInOutCubic } from './utils/easing.js';

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
    const size = options.size || (this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize));
    return new Particle(x, y, vx, vy, { ...options, size });
  }

  initializeRandom() {
    console.log(`[ParticleSystem] Initializing ${this.config.particleCount} random particles...`);
    
    this.particles = [];
    const positions = RandomPattern.generate(this.config.particleCount, this.width, this.height, this.config.speed);
    
    for (const pos of positions) {
      this.particles.push(this.createParticle(pos.x, pos.y, pos.vx, pos.vy, {
        r: pos.r,
        g: pos.g,
        b: pos.b
      }));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles`);
  }

  initializeGrid() {
    console.log(`[ParticleSystem] Initializing particles in grid formation...`);
    
    this.particles = [];
    const positions = GridPattern.generate(this.config.particleCount, this.width, this.height);
    
    for (const pos of positions) {
      this.particles.push(this.createParticle(pos.x, pos.y, pos.vx, pos.vy, {
        r: pos.r,
        g: pos.g,
        b: pos.b
      }));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in grid`);
  }

  initializeCircle() {
    console.log(`[ParticleSystem] Initializing particles in circle formation...`);
    
    this.particles = [];
    const positions = CirclePattern.generate(this.config.particleCount, this.width, this.height);
    
    for (const pos of positions) {
      this.particles.push(this.createParticle(pos.x, pos.y, pos.vx, pos.vy, {
        r: pos.r,
        g: pos.g,
        b: pos.b
      }));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in circle formation`);
  }

  initializeSpiral() {
    console.log(`[ParticleSystem] Initializing particles in spiral formation...`);
    
    this.particles = [];
    const positions = SpiralPattern.generate(this.config.particleCount, this.width, this.height);
    
    for (const pos of positions) {
      this.particles.push(this.createParticle(pos.x, pos.y, pos.vx, pos.vy, {
        r: pos.r,
        g: pos.g,
        b: pos.b
      }));
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
    
    const positions = GridPattern.generate(this.particles.length, this.width, this.height);
    
    // Safety check: ensure positions array matches particle count
    const minLength = Math.min(this.particles.length, positions.length);
    
    for (let i = 0; i < minLength; i++) {
      const particle = this.particles[i];
      const pos = positions[i];
      
      particle.setTarget(pos.x, pos.y);
      particle.setTargetColor(pos.r, pos.g, pos.b);
    }
  }

  transitionToCircle(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to circle (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const positions = CirclePattern.generate(this.particles.length, this.width, this.height);
    
    // Safety check: ensure positions array matches particle count
    const minLength = Math.min(this.particles.length, positions.length);
    
    for (let i = 0; i < minLength; i++) {
      const particle = this.particles[i];
      const pos = positions[i];
      
      particle.setTarget(pos.x, pos.y);
      particle.setTargetColor(pos.r, pos.g, pos.b);
    }
  }

  transitionToSpiral(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to spiral (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const positions = SpiralPattern.generate(this.particles.length, this.width, this.height);
    
    // Safety check: ensure positions array matches particle count
    const minLength = Math.min(this.particles.length, positions.length);
    
    for (let i = 0; i < minLength; i++) {
      const particle = this.particles[i];
      const pos = positions[i];
      
      particle.setTarget(pos.x, pos.y);
      particle.setTargetColor(pos.r, pos.g, pos.b);
    }
  }

  transitionToRandom(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to random (${duration}ms)...`);
    
    this._startTransition(duration);
    
    const positions = RandomPattern.generate(this.particles.length, this.width, this.height, this.config.speed);
    
    // Safety check: ensure positions array matches particle count
    const minLength = Math.min(this.particles.length, positions.length);
    
    for (let i = 0; i < minLength; i++) {
      const particle = this.particles[i];
      const pos = positions[i];
      
      particle.setTarget(pos.x, pos.y);
      particle.setTargetColor(pos.r, pos.g, pos.b);
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
        const t = easeInOutCubic(this.transitionProgress);
        const factor = t * this.INTERPOLATION_FACTOR;
        
        // Interpolate using Particle class method
        particle.interpolate(factor);
      } else {
        // Free movement using Particle class method
        particle.updatePosition(deltaTime, this.config.speed);
        particle.bounceOffEdges(this.width, this.height);
      }
    }
  }

  getParticles() {
    return this.particles;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[ParticleSystem] Config updated:', this.config);
  }
}
