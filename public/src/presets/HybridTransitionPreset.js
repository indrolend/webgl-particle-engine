/**
 * Hybrid Transition Preset
 * Implements multi-phase particle transitions with explosion, recombination, and triangulation blend
 * 
 * Phases:
 * 1. Image to Particles: Particles originate from static image with adjustable density
 * 2. Explosion: Particles explode in random directions (controlled burst)
 * 3. Recombination: Particles recombine into second image shape (space vacuum behavior)
 * 4. Triangulation Blend: Gradual transition from particles to triangulation mode
 */
import { Preset } from './Preset.js';

// Phase constants
const PHASE = {
  IDLE: 'idle',
  EXPLOSION: 'explosion',
  RECOMBINATION: 'recombination',
  BLEND: 'blend',
  SOLIDIFIED: 'solidified',
  REVERSE_BLEND: 'reverseBlend',
  REVERSE_RECOMBINATION: 'reverseRecombination',
  REVERSE_EXPLOSION: 'reverseExplosion',
  SOLIDIFY: 'solidify'
};

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
        
        // Phase 4: Triangulation Blend
        blendDuration: config.blendDuration || 1500, // Duration in ms
        particleFadeRate: config.particleFadeRate || 0.7, // How fast particles fade
        
        ...config
      }
    );

    this.phase = PHASE.IDLE; // Current phase
    this.phaseStartTime = 0;
    this.targets = null;
    this.sourceImage = null;
    this.targetImage = null;
    this.blendProgress = 0;
    this.direction = 'forward'; // 'forward' or 'reverse'
    
    // State snapshots for reversing
    this.stateSnapshots = {
      preExplosion: null,
      postExplosion: null,
      postRecombination: null,
      postBlend: null
    };
    
    // Physics constants
    this.VACUUM_FORCE_MULTIPLIER = 0.1; // Controls the strength of vacuum force based on distance
    this.ALPHA_BLEND_RATE = 0.05; // Controls smoothness of particle fade during blend phase
  }

  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    // Store source and target images if provided
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Capture pre-explosion state
    this.captureState(particles, 'preExplosion');
    
    // Start with explosion phase
    this.direction = 'forward';
    this.startExplosion(particles, dimensions);
  }

  /**
   * Capture current particle state for potential reversal
   */
  captureState(particles, snapshotName) {
    this.stateSnapshots[snapshotName] = particles.map(p => ({
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      alpha: p.alpha,
      r: p.r,
      g: p.g,
      b: p.b,
      targetX: p.targetX,
      targetY: p.targetY,
      targetR: p.targetR,
      targetG: p.targetG,
      targetB: p.targetB
    }));
  }

  /**
   * Phase 2: Explosion - particles scatter outward in random directions
   * Creates a controlled, localized burst without easing
   */
  startExplosion(particles, dimensions) {
    console.log(`[HybridTransition] Starting explosion phase (${this.config.explosionTime}ms)`);
    this.phase = PHASE.EXPLOSION;
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
    this.phase = PHASE.RECOMBINATION;
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
        } else {
          // Reuse targets for extra particles with slight offset
          const targetIndex = i % targets.length;
          const target = targets[targetIndex];
          particle.targetX = target.x + (Math.random() - 0.5) * 5;
          particle.targetY = target.y + (Math.random() - 0.5) * 5;
          particle.targetR = target.r;
          particle.targetG = target.g;
          particle.targetB = target.b;
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
    this.phase = PHASE.BLEND;
    this.phaseStartTime = Date.now();
    this.blendProgress = 0;
  }

  update(particles, deltaTime, dimensions) {
    const elapsedTime = Date.now() - this.phaseStartTime;

    switch (this.phase) {
      case PHASE.EXPLOSION:
        this.updateExplosion(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.RECOMBINATION:
        this.updateRecombination(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.BLEND:
        this.updateBlend(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.REVERSE_BLEND:
        this.updateReverseBlend(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.REVERSE_RECOMBINATION:
        this.updateReverseRecombination(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.REVERSE_EXPLOSION:
        this.updateReverseExplosion(particles, deltaTime, dimensions, elapsedTime);
        break;
      case PHASE.SOLIDIFY:
        this.updateSolidify(particles, deltaTime, dimensions, elapsedTime);
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
      this.captureState(particles, 'postExplosion');
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
      this.captureState(particles, 'postRecombination');
      this.startBlend(particles);
    }
  }

  updateBlend(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.blendDuration, 1);
    this.blendProgress = progress;

    // Fade particles out during blend
    const targetAlpha = 1.0 - (progress * this.config.particleFadeRate);
    
    particles.forEach(particle => {
      // Smoothly adjust alpha
      particle.alpha = particle.alpha + (targetAlpha - particle.alpha) * this.ALPHA_BLEND_RATE;
      
      // Keep particles in final position with minimal drift
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        
        particle.x += dx * 0.1;
        particle.y += dy * 0.1;
      }
      
      // Continue color convergence
      if (particle.targetR !== undefined) {
        particle.r += (particle.targetR - particle.r) * 0.05;
        particle.g += (particle.targetG - particle.g) * 0.05;
        particle.b += (particle.targetB - particle.b) * 0.05;
      }
    });

    // Check if blend is complete
    if (progress >= 1) {
      this.captureState(particles, 'postBlend');
      console.log('[HybridTransition] Blend complete - transition finished');
      this.phase = PHASE.SOLIDIFIED;
    }
  }

  /**
   * REVERSE PHASES - Bidirectional Transition Support
   */

  /**
   * Reverse Phase 1: Start reverse blend (triangulation → particles)
   * Particles fade back in while triangulation fades out
   */
  startReverseBlend(particles) {
    console.log(`[HybridTransition] Starting reverse blend phase (${this.config.blendDuration}ms)`);
    this.phase = PHASE.REVERSE_BLEND;
    this.phaseStartTime = Date.now();
    this.blendProgress = 0;
    this.direction = 'reverse';
  }

  updateReverseBlend(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.blendDuration, 1);
    this.blendProgress = 1.0 - progress; // Invert for reverse

    // Fade particles back in during reverse blend
    const targetAlpha = 0.3 + (progress * 0.7); // From faded to fully visible
    
    particles.forEach(particle => {
      // Smoothly adjust alpha
      particle.alpha = particle.alpha + (targetAlpha - particle.alpha) * this.ALPHA_BLEND_RATE;
      
      // Keep particles in position with minimal drift
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        
        particle.x += dx * 0.1;
        particle.y += dy * 0.1;
      }
    });

    // Check if reverse blend is complete
    if (progress >= 1) {
      console.log('[HybridTransition] Reverse blend complete - particles visible');
      this.startReverseRecombination(particles);
    }
  }

  /**
   * Reverse Phase 2: Reverse recombination (particles scatter from target positions)
   */
  startReverseRecombination(particles) {
    console.log(`[HybridTransition] Starting reverse recombination phase (${this.config.recombinationDuration}ms)`);
    this.phase = PHASE.REVERSE_RECOMBINATION;
    this.phaseStartTime = Date.now();
    
    // Add outward velocities to scatter particles
    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        const dx = particle.x - particle.targetX;
        const dy = particle.y - particle.targetY;
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.1;
        
        // Apply gentle outward force
        const speed = this.config.explosionIntensity * 0.3;
        particle.vx = (dx / distance) * speed * (0.5 + Math.random() * 0.5);
        particle.vy = (dy / distance) * speed * (0.5 + Math.random() * 0.5);
      }
    });
  }

  updateReverseRecombination(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.recombinationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);

    particles.forEach(particle => {
      // Move particles outward
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Apply damping as we progress
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // Add slight chaos for natural movement
      const chaos = this.config.recombinationChaos * easedProgress;
      particle.vx += (Math.random() - 0.5) * chaos * 30 * deltaTime;
      particle.vy += (Math.random() - 0.5) * chaos * 30 * deltaTime;

      // Keep within bounds
      if (particle.x < 0 || particle.x > dimensions.width) {
        particle.vx *= -0.5;
        particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
      }
      if (particle.y < 0 || particle.y > dimensions.height) {
        particle.vy *= -0.5;
        particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
      }
    });

    // Check if reverse recombination is complete
    if (progress >= 1) {
      console.log('[HybridTransition] Reverse recombination complete');
      this.startReverseExplosion(particles);
    }
  }

  /**
   * Reverse Phase 3: Reverse explosion (particles move back to source positions)
   */
  startReverseExplosion(particles) {
    console.log(`[HybridTransition] Starting reverse explosion phase (${this.config.explosionTime}ms)`);
    this.phase = PHASE.REVERSE_EXPLOSION;
    this.phaseStartTime = Date.now();
    
    // Restore pre-explosion targets if available
    if (this.stateSnapshots.preExplosion) {
      particles.forEach((particle, i) => {
        if (i < this.stateSnapshots.preExplosion.length) {
          const snapshot = this.stateSnapshots.preExplosion[i];
          particle.targetX = snapshot.x;
          particle.targetY = snapshot.y;
          particle.targetR = snapshot.r;
          particle.targetG = snapshot.g;
          particle.targetB = snapshot.b;
        }
      });
    }
  }

  updateReverseExplosion(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.explosionTime, 1);
    const easedProgress = this.easeInOutCubic(progress);

    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        // Pull particles back to source positions
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const force = 0.2 * easedProgress;
          const forceX = (dx / distance) * force * distance * 0.15;
          const forceY = (dy / distance) * force * distance * 0.15;

          particle.vx += forceX;
          particle.vy += forceY;
          particle.vx *= 0.92;
          particle.vy *= 0.92;

          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;

          // Interpolate colors back to source
          const colorBlend = easedProgress * 0.1;
          particle.r += (particle.targetR - particle.r) * colorBlend;
          particle.g += (particle.targetG - particle.g) * colorBlend;
          particle.b += (particle.targetB - particle.b) * colorBlend;
        } else {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.vx = 0;
          particle.vy = 0;
        }
      }
    });

    // Check if reverse explosion is complete
    if (progress >= 1) {
      console.log('[HybridTransition] Reverse explosion complete');
      this.startSolidify(particles);
    }
  }

  /**
   * Final Phase: Solidify (particles → static image with triangulation)
   */
  startSolidify(particles) {
    console.log(`[HybridTransition] Starting solidify phase (${this.config.blendDuration}ms)`);
    this.phase = PHASE.SOLIDIFY;
    this.phaseStartTime = Date.now();
    this.blendProgress = 0;
  }

  updateSolidify(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.blendDuration, 1);
    this.blendProgress = progress;

    // Lock particles in place and prepare for full triangulation
    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
        particle.vx = 0;
        particle.vy = 0;
      }
      
      // Ensure full color match
      if (particle.targetR !== undefined) {
        particle.r = particle.targetR;
        particle.g = particle.targetG;
        particle.b = particle.targetB;
      }
      
      // Full alpha
      particle.alpha = 1.0;
    });

    // Check if solidification is complete
    if (progress >= 1) {
      console.log('[HybridTransition] Solidification complete - back to static image');
      this.phase = PHASE.IDLE;
    }
  }

  /**
   * Start reverse transition from solidified state back to source
   */
  startReverseTransition(particles) {
    if (this.phase === PHASE.SOLIDIFIED || this.phase === PHASE.IDLE) {
      this.startReverseBlend(particles);
    } else {
      console.warn('[HybridTransition] Can only start reverse from solidified/idle state');
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
    if (this.phase === PHASE.IDLE) {
      this.startExplosion(particles, { width: 0, height: 0 });
    } else if (this.phase === 'explosion') {
      // Let explosion finish naturally
      return;
    } else if (this.phase === 'recombination' || this.phase === PHASE.BLEND) {
      // Already in later phases, adjust targets
      this.startRecombination(particles, targets);
    }
  }

  /**
   * Get current blend progress (0 to 1)
   * Used by HybridEngine to coordinate triangulation opacity
   */
  getBlendProgress() {
    if (this.phase === PHASE.BLEND) {
      return this.blendProgress;
    } else if (this.phase === 'reverseBlend') {
      return this.blendProgress; // Already inverted in update
    } else if (this.phase === 'solidify') {
      return 1.0 - this.blendProgress; // Invert for solidify
    } else if (this.phase === PHASE.SOLIDIFIED) {
      return 1.0; // Full triangulation
    }
    return 0;
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
    this.phase = PHASE.IDLE;
    this.targets = null;
    this.blendProgress = 0;
  }
}
