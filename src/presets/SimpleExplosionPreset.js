/**
 * SimpleExplosionPreset - Clean particle explosion and reconstruction
 * 
 * Based on CodePen effect (https://codepen.io/alphardex/pen/vYyVxXO)
 * Simple two-phase transition:
 * 1. Explosion: Image 1 explodes into particles
 * 2. Reconstruction: Particles reconstruct into Image 2
 * 
 * No triangulation blend - just pure particle animation
 */
import { Preset } from './Preset.js';

export class SimpleExplosionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Simple Explosion',
      'Clean particle explosion and reconstruction between images',
      {
        // Explosion phase
        explosionIntensity: config.explosionIntensity || 200, // Higher for more dramatic effect
        explosionDuration: config.explosionDuration || 1000, // Duration in ms
        explosionEasing: config.explosionEasing !== undefined ? config.explosionEasing : true,
        
        // Reconstruction phase  
        reconstructionDuration: config.reconstructionDuration || 1500, // Duration in ms
        reconstructionEasing: config.reconstructionEasing || 'easeOutCubic',
        attractionStrength: config.attractionStrength || 0.2, // Particle attraction force
        
        // Particle behavior
        particleFriction: config.particleFriction || 0.95, // Velocity damping
        colorTransitionSpeed: config.colorTransitionSpeed || 0.15, // How fast colors change
        
        ...config
      }
    );

    this.phase = 'idle'; // idle, explosion, reconstruction
    this.phaseStartTime = 0;
    this.targets = null;
    this.sourceImage = null;
    this.targetImage = null;
  }

  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    // Store source and target images if provided
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Start with explosion phase
    this.startExplosion(particles, dimensions);
  }

  /**
   * Phase 1: Explosion - particles explode outward from image 1
   */
  startExplosion(particles, dimensions) {
    console.log(`[SimpleExplosion] Starting explosion phase (${this.config.explosionDuration}ms)`);
    this.phase = 'explosion';
    this.phaseStartTime = Date.now();

    // Calculate center for directional explosion
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    particles.forEach(particle => {
      // Direction from center to particle
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Normalize direction and add randomness
      const dirX = dx / distance + (Math.random() - 0.5) * 0.3;
      const dirY = dy / distance + (Math.random() - 0.5) * 0.3;
      
      // Random speed with some variation
      const speed = (0.5 + Math.random() * 0.5) * this.config.explosionIntensity;
      
      particle.vx = dirX * speed;
      particle.vy = dirY * speed;
      
      // Store original position for reference
      particle.originalX = particle.x;
      particle.originalY = particle.y;
    });
  }

  /**
   * Phase 2: Reconstruction - particles reconstruct into image 2
   */
  startReconstruction(particles, targets) {
    console.log(`[SimpleExplosion] Starting reconstruction phase (${this.config.reconstructionDuration}ms)`);
    this.phase = 'reconstruction';
    this.phaseStartTime = Date.now();

    if (targets && targets.length > 0) {
      this.targets = targets;
      
      // Assign target positions to particles
      particles.forEach((particle, i) => {
        if (i < targets.length) {
          particle.targetX = targets[i].x;
          particle.targetY = targets[i].y;
          particle.targetR = targets[i].r;
          particle.targetG = targets[i].g;
          particle.targetB = targets[i].b;
          particle.targetSize = targets[i].size || particle.size;
        } else {
          // Reuse targets for extra particles
          const targetIndex = i % targets.length;
          const target = targets[targetIndex];
          particle.targetX = target.x;
          particle.targetY = target.y;
          particle.targetR = target.r;
          particle.targetG = target.g;
          particle.targetB = target.b;
          particle.targetSize = target.size || particle.size;
        }
      });
    }
  }

  update(particles, deltaTime, dimensions) {
    const elapsedTime = Date.now() - this.phaseStartTime;

    switch (this.phase) {
      case 'explosion':
        this.updateExplosion(particles, deltaTime, dimensions, elapsedTime);
        break;
      case 'reconstruction':
        this.updateReconstruction(particles, deltaTime, dimensions, elapsedTime);
        break;
    }
  }

  updateExplosion(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.explosionDuration, 1);
    
    // Apply easing if enabled
    const easedProgress = this.config.explosionEasing ? this.easeOutQuad(progress) : progress;

    particles.forEach(particle => {
      // Move particles with velocity
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Apply friction
      particle.vx *= this.config.particleFriction;
      particle.vy *= this.config.particleFriction;
      
      // Fade out slightly during explosion
      particle.alpha = 1.0 - (easedProgress * 0.2);
    });

    // Check if explosion phase is complete
    if (progress >= 1 && this.targets) {
      this.startReconstruction(particles, this.targets);
    }
  }

  updateReconstruction(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.reconstructionDuration, 1);
    
    // Use different easing for reconstruction
    let easedProgress;
    switch (this.config.reconstructionEasing) {
      case 'easeOutCubic':
        easedProgress = this.easeOutCubic(progress);
        break;
      case 'easeInOutCubic':
        easedProgress = this.easeInOutCubic(progress);
        break;
      default:
        easedProgress = progress;
    }

    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        // Calculate direction to target
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) {
          // Apply attraction force that increases with progress
          const force = this.config.attractionStrength * easedProgress;
          const forceX = (dx / distance) * force * distance;
          const forceY = (dy / distance) * force * distance;

          particle.vx += forceX;
          particle.vy += forceY;
          
          // Apply friction
          particle.vx *= this.config.particleFriction;
          particle.vy *= this.config.particleFriction;

          // Update position
          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;
        } else {
          // Snap to target when very close
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.vx = 0;
          particle.vy = 0;
        }

        // Interpolate colors smoothly
        const colorSpeed = this.config.colorTransitionSpeed;
        particle.r += (particle.targetR - particle.r) * colorSpeed;
        particle.g += (particle.targetG - particle.g) * colorSpeed;
        particle.b += (particle.targetB - particle.b) * colorSpeed;
        
        // Interpolate size
        if (particle.targetSize !== undefined) {
          particle.size += (particle.targetSize - particle.size) * colorSpeed;
        }
        
        // Fade back in during reconstruction
        const targetAlpha = 0.8 + (easedProgress * 0.2);
        particle.alpha += (targetAlpha - particle.alpha) * 0.1;
      }
    });

    // Check if reconstruction is complete
    if (progress >= 1) {
      console.log('[SimpleExplosion] Reconstruction complete');
      this.phase = 'idle';
      this.isActive = false;
    }
  }

  /**
   * Set target positions for reconstruction
   */
  setTargets(targets) {
    this.targets = targets;
  }

  /**
   * Check if transition is complete
   */
  isComplete() {
    return this.phase === 'idle' && !this.isActive;
  }

  /**
   * Get current phase
   */
  getCurrentPhase() {
    return this.phase;
  }

  // Easing functions
  easeOutQuad(t) {
    return t * (2 - t);
  }

  easeOutCubic(t) {
    return (--t) * t * t + 1;
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  deactivate() {
    super.deactivate();
    this.phase = 'idle';
    this.targets = null;
  }
}
