/**
 * Hybrid Transition Preset
 * Implements multi-phase particle transitions with explosion and recombination
 * 
 * Phases:
 * 1. Image to Particles: Particles originate from static image with adjustable density
 * 2. Explosion: Particles explode in random directions (controlled burst)
 * 3. Recombination: Particles recombine into second image shape (space vacuum behavior)
 * 4. Final Static: Display target image as solid
 */
import { Preset } from './Preset.js';

export class HybridTransitionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Hybrid Transition',
      'Advanced multi-phase transition with explosion and recombination effects',
      {
        // Phase 1: Image to Particles
        particleDensity: config.particleDensity || 1.0, // 0.1 to 2.0, controls sampling density
        
        // Phase 2: Explosion
        explosionIntensity: config.explosionIntensity || 150, // Explosion radius/force
        explosionTime: config.explosionTime || 800, // Duration in ms
        
        // Phase 3: Recombination (Space Vacuum)
        recombinationDuration: config.recombinationDuration || 2000, // Duration in ms
        recombinationChaos: config.recombinationChaos || 0.3, // 0 to 1, adds chaotic movement
        vacuumStrength: config.vacuumStrength || 0.15, // Gravitational pull strength
        
        // Phase 4: Final Static Display
        finalStaticDuration: config.finalStaticDuration || 1000, // Duration to show final image
        
        ...config
      }
    );

    this.phase = 'idle'; // idle, explosion, recombination, finalStatic
    this.phaseStartTime = 0;
    this.targets = null;
    this.sourceImage = null;
    this.targetImage = null;
    
    // Physics constants
    this.VACUUM_FORCE_MULTIPLIER = 0.1; // Controls the strength of vacuum force based on distance
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
   * Phase 2: Explosion - particles scatter outward in random directions
   * Creates a controlled, localized burst without easing
   */
  startExplosion(particles, dimensions) {
    console.log(`[HybridTransition] Starting explosion phase (${this.config.explosionTime}ms)`);
    this.phase = 'explosion';
    this.phaseStartTime = Date.now();

    particles.forEach(particle => {
      // Random explosion direction (no easing, direct velocity)
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * this.config.explosionIntensity;
      
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
    });
  }

  /**
   * Phase 3: Recombination - particles pulled toward target positions
   * Simulates space vacuum behavior with chaotic attraction
   */
  startRecombination(particles, targets) {
    console.log(`[HybridTransition] Starting recombination phase (${this.config.recombinationDuration}ms)`);
    this.phase = 'recombination';
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
          particle.targetSize = targets[i].size;
        } else {
          // Reuse targets for extra particles with slight offset
          const targetIndex = i % targets.length;
          const target = targets[targetIndex];
          particle.targetX = target.x + (Math.random() - 0.5) * 5;
          particle.targetY = target.y + (Math.random() - 0.5) * 5;
          particle.targetR = target.r;
          particle.targetG = target.g;
          particle.targetB = target.b;
          particle.targetSize = target.size;
        }
      });
    }
  }

  /**
   * Phase 4: Triangulation Blend - fade particles while enabling triangulation
   * This is coordinated with the HybridEngine to gradually show triangulation
   */
  startBlend(particles) {
    console.log(`[HybridTransition] Starting blend phase (${this.config.blendDuration}ms)`);
    this.phase = 'blend';
    this.phaseStartTime = Date.now();
    this.blendProgress = 0;
  }

  update(particles, deltaTime, dimensions) {
    const elapsedTime = Date.now() - this.phaseStartTime;

    switch (this.phase) {
      case 'explosion':
        this.updateExplosion(particles, deltaTime, dimensions, elapsedTime);
        break;
      case 'recombination':
        this.updateRecombination(particles, deltaTime, dimensions, elapsedTime);
        break;
      case 'finalStatic':
        this.updateFinalStatic(particles, deltaTime, dimensions, elapsedTime);
        break;
    }
  }

  updateExplosion(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.explosionTime, 1);

    particles.forEach(particle => {
      // Move with constant velocity (no easing)
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Apply slight damping toward end of explosion
      if (progress > 0.7) {
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      }

      // Keep particles within bounds (bounce)
      if (particle.x < 0 || particle.x > dimensions.width) {
        particle.vx *= -0.5;
        particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
      }
      if (particle.y < 0 || particle.y > dimensions.height) {
        particle.vy *= -0.5;
        particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
      }
    });

    // Check if explosion phase is complete
    if (progress >= 1 && this.targets) {
      this.startRecombination(particles, this.targets);
    }
  }

  updateRecombination(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.recombinationDuration, 1);
    
    // Use easing for natural gravitational feel
    const easedProgress = this.easeInOutCubic(progress);

    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        // Calculate direction to target (vacuum attraction)
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          // Apply vacuum force (stronger as we progress)
          const force = this.config.vacuumStrength * easedProgress;
          const forceX = (dx / distance) * force * distance * this.VACUUM_FORCE_MULTIPLIER;
          const forceY = (dy / distance) * force * distance * this.VACUUM_FORCE_MULTIPLIER;

          particle.vx += forceX;
          particle.vy += forceY;

          // Add chaotic movement for natural feel
          const chaos = this.config.recombinationChaos * (1 - easedProgress);
          particle.vx += (Math.random() - 0.5) * chaos * 50 * deltaTime;
          particle.vy += (Math.random() - 0.5) * chaos * 50 * deltaTime;

          // Apply velocity damping
          particle.vx *= 0.95;
          particle.vy *= 0.95;

          // Update position
          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;

          // Interpolate colors smoothly
          const colorBlend = easedProgress * 0.1;
          particle.r += (particle.targetR - particle.r) * colorBlend;
          particle.g += (particle.targetG - particle.g) * colorBlend;
          particle.b += (particle.targetB - particle.b) * colorBlend;
          
          // Interpolate size smoothly
          if (particle.targetSize !== undefined) {
            particle.size += (particle.targetSize - particle.size) * colorBlend;
          }
        } else {
          // Close enough to target, lock in place
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.vx *= 0.9;
          particle.vy *= 0.9;
        }
      }
    });

    // Check if recombination is complete
    if (progress >= 1) {
      this.startFinalStatic();
    }
  }

  /**
   * Phase 4: Final Static - display target image as solid static image
   */
  startFinalStatic() {
    console.log('[HybridTransition] Starting final static image display');
    this.phase = 'finalStatic';
    this.phaseStartTime = Date.now();
  }

  updateFinalStatic(particles, deltaTime, dimensions, elapsedTime) {
    // Keep particles hidden or at low alpha during final static display
    particles.forEach(particle => {
      particle.alpha = Math.max(0, particle.alpha - 0.05);
    });

    // After showing final static image for a duration, mark transition as complete
    const finalStaticDuration = this.config.finalStaticDuration || 2000; // Default 2 seconds
    if (elapsedTime >= finalStaticDuration) {
      console.log('[HybridTransition] Final static display complete - transition finished');
      this.phase = 'idle';
    }
  }

  /**
   * Set target image for recombination phase
   */
  setTargetImage(image, particleSystem) {
    this.targetImage = image;
    
    // Extract target positions from image
    if (particleSystem) {
      const particles = particleSystem.getParticles();
      const imageData = particleSystem.extractImageData(image, particles.length);
      this.targets = particleSystem.imageDataToTargets(imageData);
    }
  }

  /**
   * Transition to target (used by engine)
   */
  transitionTo(particles, targets, duration = 2000) {
    this.targets = targets;
    this.config.recombinationDuration = duration;
    
    // If not in explosion, start from beginning
    if (this.phase === 'idle') {
      this.startExplosion(particles, { width: 0, height: 0 });
    } else if (this.phase === 'explosion') {
      // Let explosion finish naturally
      return;
    } else if (this.phase === 'recombination' || this.phase === 'finalStatic') {
      // Already in later phases, adjust targets
      this.startRecombination(particles, targets);
    }
  }

  /**
   * Check if in final static phase
   */
  isInFinalStatic() {
    return this.phase === 'finalStatic';
  }

  /**
   * Get current phase
   */
  getCurrentPhase() {
    return this.phase;
  }

  // Easing functions
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
