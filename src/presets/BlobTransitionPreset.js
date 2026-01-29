/**
 * BlobTransitionPreset - Blob-based transition with color clustering
 * 
 * Features:
 * - Particles form blob outlines (10-15 per blob)
 * - Blob interiors filled with solid color
 * - Each blob is single-colored (no mixing within blob)
 * - Explosion: blobs maintain image 1 colors
 * - Recombination: blobs transition to image 2 colors
 */
import { Preset } from './Preset.js';
import { BlobSystem } from '../BlobSystem.js';

export class BlobTransitionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Blob Transition',
      'Multi-colored blobs with filled interiors for smooth transitions',
      {
        // Blob configuration
        minBlobSize: config.minBlobSize || 8,
        maxBlobSize: config.maxBlobSize || 15,
        colorThreshold: config.colorThreshold || 0.15,
        
        // Phase timings
        explosionIntensity: config.explosionIntensity || 150,
        explosionTime: config.explosionTime || 800,
        recombinationDuration: config.recombinationDuration || 2000,
        blendDuration: config.blendDuration || 1500,
        
        // Physics
        recombinationChaos: config.recombinationChaos || 0.3,
        vacuumStrength: config.vacuumStrength || 0.15,
        
        ...config
      }
    );
    
    this.phase = 'idle'; // idle, explosion, recombination, blend
    this.phaseStartTime = 0;
    this.blobSystem = null;
    this.sourceImage = null;
    this.targetImage = null;
    this.sourceColors = [];
    this.targetColors = [];
  }
  
  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Create blob system from particles
    this.blobSystem = new BlobSystem({
      minBlobSize: this.config.minBlobSize,
      maxBlobSize: this.config.maxBlobSize,
      colorThreshold: this.config.colorThreshold
    });
    
    this.blobSystem.createBlobsFromParticles(particles);
    
    // Extract source colors from blobs
    this.sourceColors = this.blobSystem.blobs.map(blob => ({
      r: blob.r,
      g: blob.g,
      b: blob.b
    }));
    
    console.log(`[BlobTransitionPreset] Initialized with ${this.blobSystem.getBlobCount()} blobs`);
  }
  
  /**
   * Start explosion phase with blob colors from image 1
   */
  startExplosion(particles, dimensions) {
    console.log('[BlobTransitionPreset] Starting explosion with source colors');
    this.phase = 'explosion';
    this.phaseStartTime = Date.now();
    
    // Apply explosion velocities to all outline particles
    const allParticles = this.blobSystem.getAllOutlineParticles();
    for (const particle of allParticles) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * this.config.explosionIntensity;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
    }
  }
  
  /**
   * Start recombination with target image colors
   */
  startRecombination(particles, targets) {
    console.log('[BlobTransitionPreset] Starting recombination with target colors');
    this.phase = 'recombination';
    this.phaseStartTime = Date.now();
    
    // Extract target colors
    if (targets && targets.length > 0) {
      // Group targets by color to create target color palette
      this.targetColors = this.extractColorPalette(targets);
      
      // Assign target colors to blobs
      this.blobSystem.transitionBlobColors(this.targetColors);
      
      // Set target positions for outline particles
      const allParticles = this.blobSystem.getAllOutlineParticles();
      for (let i = 0; i < allParticles.length; i++) {
        const particle = allParticles[i];
        const target = targets[i % targets.length];
        particle.targetX = target.x;
        particle.targetY = target.y;
      }
    }
  }
  
  /**
   * Extract color palette from target particles
   */
  extractColorPalette(particles) {
    const palette = [];
    const colorMap = new Map();
    
    // Group similar colors
    for (const particle of particles) {
      const colorKey = `${Math.round(particle.r * 10)}_${Math.round(particle.g * 10)}_${Math.round(particle.b * 10)}`;
      
      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          r: particle.r,
          g: particle.g,
          b: particle.b,
          count: 1
        });
      } else {
        colorMap.get(colorKey).count++;
      }
    }
    
    // Convert to array and sort by frequency
    const colors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    
    return colors.slice(0, 50); // Top 50 colors
  }
  
  update(particles, deltaTime, dimensions) {
    const elapsedTime = Date.now() - this.phaseStartTime;
    
    // Update blob system
    if (this.blobSystem) {
      this.blobSystem.update(deltaTime);
    }
    
    switch (this.phase) {
      case 'explosion':
        this.updateExplosion(deltaTime, dimensions, elapsedTime);
        break;
      case 'recombination':
        this.updateRecombination(deltaTime, dimensions, elapsedTime);
        break;
      case 'blend':
        this.updateBlend(deltaTime, dimensions, elapsedTime);
        break;
    }
  }
  
  updateExplosion(deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.explosionTime, 1);
    
    const allParticles = this.blobSystem.getAllOutlineParticles();
    
    for (const particle of allParticles) {
      // Update positions
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Damping
      if (progress > 0.7) {
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      }
      
      // Boundary bounce
      if (particle.x < 0 || particle.x > dimensions.width) {
        particle.vx *= -0.5;
        particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
      }
      if (particle.y < 0 || particle.y > dimensions.height) {
        particle.vy *= -0.5;
        particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
      }
    }
  }
  
  updateRecombination(deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.recombinationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);
    
    const allParticles = this.blobSystem.getAllOutlineParticles();
    
    for (const particle of allParticles) {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
          // Vacuum force
          const force = this.config.vacuumStrength * easedProgress;
          const forceX = (dx / distance) * force * distance * 0.1;
          const forceY = (dy / distance) * force * distance * 0.1;
          
          particle.vx += forceX;
          particle.vy += forceY;
          
          // Chaos
          const chaos = this.config.recombinationChaos * (1 - easedProgress);
          particle.vx += (Math.random() - 0.5) * chaos * 50 * deltaTime;
          particle.vy += (Math.random() - 0.5) * chaos * 50 * deltaTime;
          
          // Damping
          particle.vx *= 0.95;
          particle.vy *= 0.95;
          
          // Update position
          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;
        }
      }
    }
  }
  
  updateBlend(deltaTime, dimensions, elapsedTime) {
    // Blend phase (if needed)
  }
  
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Get blob system for rendering
   */
  getBlobSystem() {
    return this.blobSystem;
  }
}
