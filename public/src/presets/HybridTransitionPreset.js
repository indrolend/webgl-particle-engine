/**
 * Hybrid Transition Preset
 * Implements multi-phase particle transitions with explosion, recombination, and triangulation blend
 * 
 * Phases:
 * 1. Image to Particles: Particles originate from static image with adjustable density
 * 2. Explosion: Particles explode in random directions (controlled burst)
 * 3. Recombination: Particles recombine into second image shape (space vacuum behavior)
 * 4. Triangulation Blend: Gradual transition from particles to triangulation mode
 * 
 * Enhanced with:
 * - Ferrofluid-inspired particle dynamics for cohesion and blob-like clustering
 * - Image container physics for particle containment during transitions
 */
import { Preset } from './Preset.js';
import { FerrofluidPhysics } from '../physics/FerrofluidPhysics.js';
import { ImageContainer } from '../physics/ImageContainer.js';

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
        
        // Ferrofluid physics settings
        enableFerrofluid: config.enableFerrofluid !== false, // Enable ferrofluid physics
        cohesionStrength: config.cohesionStrength || 0.05, // Particle cohesion strength
        surfaceTension: config.surfaceTension || 0.1, // Surface tension for blob formation
        
        // Container physics settings
        enableContainer: config.enableContainer !== false, // Enable container physics
        containerPadding: config.containerPadding || 10, // Container padding in pixels
        
        // Elastic blob physics settings
        enableElastic: config.enableElastic !== false, // Enable elastic blob physics
        springStiffness: config.springStiffness || 0.5, // Spring force strength (0-2)
        damping: config.damping || 0.92, // Velocity damping (0.5-0.99)
        elasticSurfaceTension: config.elasticSurfaceTension || 0.3, // Elastic surface tension (0-1)
        pressureStrength: config.pressureStrength || 0.2, // Volume preservation (0-1)
        
        ...config
      }
    );

    this.phase = 'idle'; // idle, explosion, recombination, blend
    this.phaseStartTime = 0;
    this.targets = null;
    this.sourceImage = null;
    this.targetImage = null;
    this.blendProgress = 0;
    
    // Physics constants
    this.VACUUM_FORCE_MULTIPLIER = 0.1; // Controls the strength of vacuum force based on distance
    this.ALPHA_BLEND_RATE = 0.05; // Controls smoothness of particle fade during blend phase
    
    // Initialize ferrofluid physics
    if (this.config.enableFerrofluid) {
      this.ferrofluidPhysics = new FerrofluidPhysics({
        cohesionRadius: 50,  // Increased for longer-range attraction
        cohesionStrength: this.config.cohesionStrength,
        surfaceTension: this.config.surfaceTension,
        attractionStrength: 0.3,  // Increased for stronger clustering
        repulsionDistance: 3,  // Decreased for tighter packing
        repulsionStrength: 0.2,  // Decreased to allow closer particles
        enableDuringExplosion: true,
        enableDuringRecombination: true,
        // Elastic physics parameters
        enableElastic: this.config.enableElastic,
        springStiffness: this.config.springStiffness,
        damping: this.config.damping,
        elasticSurfaceTension: this.config.elasticSurfaceTension,
        pressureStrength: this.config.pressureStrength
      });
    } else {
      this.ferrofluidPhysics = null;
    }
    
    // Initialize image containers
    this.sourceContainer = null;
    this.targetContainer = null;
  }

  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    // Store source and target images if provided
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Create image containers if enabled
    if (this.config.enableContainer && this.sourceImage) {
      this.sourceContainer = new ImageContainer({
        padding: this.config.containerPadding,
        bounceStrength: 0.3,
        edgeSoftness: 8
      });
      
      // Calculate image position and scale on canvas
      const imageAspect = this.sourceImage.width / this.sourceImage.height;
      const canvasAspect = dimensions.width / dimensions.height;
      let scale, offsetX, offsetY;
      
      if (imageAspect > canvasAspect) {
        scale = (dimensions.width * 0.9) / this.sourceImage.width;
      } else {
        scale = (dimensions.height * 0.9) / this.sourceImage.height;
      }
      
      offsetX = (dimensions.width - this.sourceImage.width * scale) / 2;
      offsetY = (dimensions.height - this.sourceImage.height * scale) / 2;
      
      this.sourceContainer.generateFromImage(
        this.sourceImage,
        dimensions,
        scale,
        { x: offsetX, y: offsetY }
      );
      
      console.log('[HybridTransition] Source container created');
    }
    
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
   * Enhanced with target image container and ferrofluid physics
   */
  startRecombination(particles, targets) {
    console.log(`[HybridTransition] Starting recombination phase (${this.config.recombinationDuration}ms)`);
    this.phase = 'recombination';
    this.phaseStartTime = Date.now();

    if (targets && targets.length > 0) {
      this.targets = targets;
      
      // Create target container if available
      if (this.config.enableContainer && this.targetImage && this.dimensions) {
        this.targetContainer = new ImageContainer({
          padding: this.config.containerPadding,
          bounceStrength: 0.3,
          edgeSoftness: 8
        });
        
        // Calculate target image position and scale on canvas
        const imageAspect = this.targetImage.width / this.targetImage.height;
        const canvasAspect = this.dimensions.width / this.dimensions.height;
        let scale, offsetX, offsetY;
        
        if (imageAspect > canvasAspect) {
          scale = (this.dimensions.width * 0.9) / this.targetImage.width;
        } else {
          scale = (this.dimensions.height * 0.9) / this.targetImage.height;
        }
        
        offsetX = (this.dimensions.width - this.targetImage.width * scale) / 2;
        offsetY = (this.dimensions.height - this.targetImage.height * scale) / 2;
        
        this.targetContainer.generateFromImage(
          this.targetImage,
          this.dimensions,
          scale,
          { x: offsetX, y: offsetY }
        );
        
        console.log('[HybridTransition] Target container created');
      }
      
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
      case 'blend':
        this.updateBlend(particles, deltaTime, dimensions, elapsedTime);
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
    
    // Apply ferrofluid physics during explosion for blob-like behavior
    if (this.ferrofluidPhysics) {
      this.ferrofluidPhysics.update(particles, deltaTime, dimensions, 'explosion');
    }
    
    // Apply container constraints during explosion
    if (this.sourceContainer && this.config.enableContainer) {
      this.sourceContainer.constrainParticles(particles);
    }

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
    
    // Apply ferrofluid physics during recombination for cohesive blob formation
    if (this.ferrofluidPhysics) {
      this.ferrofluidPhysics.update(particles, deltaTime, dimensions, 'recombination');
    }
    
    // Apply target container constraints during recombination
    if (this.targetContainer && this.config.enableContainer) {
      this.targetContainer.constrainParticles(particles);
    }

    // Check if recombination is complete
    if (progress >= 1) {
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
      
      // Continue size convergence
      if (particle.targetSize !== undefined) {
        particle.size += (particle.targetSize - particle.size) * 0.05;
      }
    });

    // Check if blend is complete
    if (progress >= 1) {
      console.log('[HybridTransition] Blend complete - showing final static image');
      this.startFinalStatic();
    }
  }

  /**
   * Phase 5: Final Static - display target image as solid static image
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
    } else if (this.phase === 'recombination' || this.phase === 'blend') {
      // Already in later phases, adjust targets
      this.startRecombination(particles, targets);
    }
  }

  /**
   * Get current blend progress (0 to 1)
   * Used by HybridEngine to coordinate triangulation opacity
   */
  getBlendProgress() {
    return this.phase === 'blend' ? this.blendProgress : 0;
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
    this.blendProgress = 0;
  }
}
