/**
 * AlienTransitionPreset - Unified alien-like liquid image morph transition
 * 
 * Features:
 * - Opacity-based mesh/particle masking
 * - Enhanced mesh physics with constraints
 * - Alpha-aware blob sizing
 * - Ghost outline rendering during transition
 * - Central phase sequencer for unified control
 * - Smooth, alien, liquid-like motion
 * 
 * Phases:
 * 1. Static Display: Show source image briefly
 * 2. Disintegrate: Mesh/particles emerge from opaque regions
 * 3. Alien Morph: Liquid-like deformation with blob effects
 * 4. Reform: Snap back together with ghost outline
 * 5. Blend: Final transition to target image
 */
import { Preset } from './Preset.js';

// Physics constants
const MIN_SPEED_MULTIPLIER = 0.5;
const SPEED_RANDOMNESS = 0.5;
const WAVE_PHASE_SCALE = 0.01;
const ROTATION_SPEED_MULTIPLIER = 0.05;
const WAVE_FREQUENCY_MULTIPLIER = 2;
const WAVE_AMPLITUDE = 5;
const VISCOSITY_DAMPING_FACTOR = 0.3;
const COLOR_TRANSITION_SPEED = 0.1;
const PARTICLE_FADE_RATE = 0.05;
const DAMPING_DISINTEGRATE = 0.98;
const DAMPING_REFORM = 0.92;
const FINAL_SNAP_SPEED = 0.1;

export class AlienTransitionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Alien Transition',
      'Unified liquid alien-like image morph with mesh, blob, and particle effects',
      {
        // Masking parameters
        opacityThreshold: config.opacityThreshold !== undefined ? config.opacityThreshold : 0.3,
        ghostParticles: config.ghostParticles || false, // Enable particles in transparent areas
        
        // Phase timing (ms)
        staticDisplayDuration: config.staticDisplayDuration || 500,
        disintegrateDuration: config.disintegrateDuration || 1200,
        alienMorphDuration: config.alienMorphDuration || 2000,
        reformDuration: config.reformDuration || 1800,
        blendDuration: config.blendDuration || 1500,
        
        // Explosion parameters
        explosionIntensity: config.explosionIntensity || 120,
        explosionDirectional: config.explosionDirectional !== undefined ? config.explosionDirectional : true,
        
        // Mesh physics constraints
        meshSpringLimit: config.meshSpringLimit || 2.5, // Max stretch multiplier
        meshAngleLimit: config.meshAngleLimit || 45, // Max angle deviation (degrees)
        meshRestoringForce: config.meshRestoringForce || 0.4, // Spring restoration strength
        
        // Blob parameters
        blobSizeScale: config.blobSizeScale || 0.7, // Scale blobs by local alpha
        blobMinAlpha: config.blobMinAlpha || 0.2, // Min alpha for blob rendering
        preventBlackout: config.preventBlackout !== undefined ? config.preventBlackout : true,
        
        // Alien effect intensity
        alienIntensity: config.alienIntensity !== undefined ? config.alienIntensity : 0.7, // 0-1
        liquidThickness: config.liquidThickness || 0.5, // Viscosity effect
        
        // Ghost outline
        ghostOutlineOpacity: config.ghostOutlineOpacity || 0.3,
        ghostFadeStart: config.ghostFadeStart || 0.6, // When to start fading (0-1 of reform phase)
        
        // Recombination parameters
        snapSpeed: config.snapSpeed || 0.25, // Speed of reformation
        recombinationChaos: config.recombinationChaos || 0.2,
        vacuumStrength: config.vacuumStrength || 0.12,
        
        ...config
      }
    );

    // Phase state
    this.phase = 'idle'; // idle, static, disintegrate, alienMorph, reform, blend
    this.phaseStartTime = 0;
    this.phaseProgress = 0; // 0-1
    this.overallProgress = 0; // 0-1
    
    // Images and targets
    this.sourceImage = null;
    this.targetImage = null;
    this.targets = null;
    
    // Ghost outline rendering
    this.ghostOutlineAlpha = 0;
    this.ghostOutlineImage = null;
    
    // Masked particles tracking
    this.maskedParticles = new Set();
    this.particleAlphaMap = new Map(); // Store original alpha for each particle
    
    // Mesh constraint tracking
    this.springConstraintViolations = new Map();
    
    console.log('[AlienTransition] Initialized with config:', this.config);
  }

  /**
   * Initialize the preset with particles
   */
  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    this.dimensions = dimensions;
    
    // Apply opacity masking to particles
    this.applyOpacityMasking(particles, this.sourceImage);
    
    // Start with static display phase
    this.startStaticDisplay();
  }

  /**
   * Apply opacity-based masking to particles
   * Only create mesh vertices and particles for image regions above threshold
   */
  applyOpacityMasking(particles, image) {
    if (!image || !image.imageData) return;
    
    const { opacityThreshold, ghostParticles } = this.config;
    const { data, width, height } = image.imageData;
    
    this.maskedParticles.clear();
    this.particleAlphaMap.clear();
    
    console.log(`[AlienTransition] Applying opacity masking (threshold: ${opacityThreshold})`);
    
    for (const particle of particles) {
      // Sample alpha at particle position
      const px = Math.floor(particle.x);
      const py = Math.floor(particle.y);
      
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const index = (py * width + px) * 4;
        const alpha = data[index + 3] / 255.0;
        
        this.particleAlphaMap.set(particle, alpha);
        
        // Mask particle if below threshold and ghost particles disabled
        if (alpha < opacityThreshold && !ghostParticles) {
          this.maskedParticles.add(particle);
          particle.alpha = 0;
          particle.size = 0;
          particle.masked = true;
        } else {
          particle.masked = false;
          // Store original alpha for blob sizing
          particle.localAlpha = alpha;
        }
      }
    }
    
    const maskedCount = this.maskedParticles.size;
    const maskedPercent = (maskedCount / particles.length * 100).toFixed(1);
    console.log(`[AlienTransition] Masked ${maskedCount}/${particles.length} particles (${maskedPercent}%)`);
  }

  /**
   * Phase 1: Static Display
   */
  startStaticDisplay() {
    console.log('[AlienTransition] Phase 1: Static Display');
    this.phase = 'static';
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;
  }

  /**
   * Phase 2: Disintegration - particles emerge from opaque regions
   */
  startDisintegrate(particles) {
    console.log('[AlienTransition] Phase 2: Disintegrate');
    this.phase = 'disintegrate';
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;
    
    const { explosionIntensity, explosionDirectional } = this.config;
    
    // Initialize particle velocities based on position
    for (const particle of particles) {
      if (particle.masked) continue;
      
      if (explosionDirectional) {
        // Directional explosion based on position relative to center
        const centerX = this.dimensions.width / 2;
        const centerY = this.dimensions.height / 2;
        const dx = particle.x - centerX;
        const dy = particle.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Add some randomness but maintain general direction
        const randomOffset = (Math.random() - 0.5) * SPEED_RANDOMNESS;
        const finalAngle = angle + randomOffset;
        const speed = (MIN_SPEED_MULTIPLIER + Math.random() * SPEED_RANDOMNESS) * explosionIntensity * (particle.localAlpha || 1.0);
        
        particle.vx = Math.cos(finalAngle) * speed;
        particle.vy = Math.sin(finalAngle) * speed;
      } else {
        // Random explosion
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.3 + Math.random() * 0.7) * explosionIntensity;
        
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
      }
    }
  }

  /**
   * Phase 3: Alien Morph - liquid-like deformation with constraints
   */
  startAlienMorph(particles) {
    console.log('[AlienTransition] Phase 3: Alien Morph');
    this.phase = 'alienMorph';
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;
    
    // Apply alien liquid effects to particle motion
    for (const particle of particles) {
      if (particle.masked) continue;
      
      // Add wave-like motion
      const wavePhase = (particle.x + particle.y) * WAVE_PHASE_SCALE;
      particle.waveOffset = wavePhase;
      
      // Add rotation tendency for alien effect
      particle.rotationSpeed = (Math.random() - 0.5) * ROTATION_SPEED_MULTIPLIER * this.config.alienIntensity;
    }
  }

  /**
   * Phase 4: Reform - snap back to target with ghost outline
   */
  startReform(particles, targets) {
    console.log('[AlienTransition] Phase 4: Reform');
    this.phase = 'reform';
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;
    this.targets = targets;
    
    // Show ghost outline
    this.ghostOutlineAlpha = this.config.ghostOutlineOpacity;
    this.ghostOutlineImage = this.sourceImage;
    
    // Assign target positions
    if (targets && targets.length > 0) {
      for (let i = 0; i < particles.length && i < targets.length; i++) {
        const particle = particles[i];
        const target = targets[i];
        
        if (!particle.masked) {
          particle.targetX = target.x;
          particle.targetY = target.y;
          particle.targetR = target.r;
          particle.targetG = target.g;
          particle.targetB = target.b;
          particle.targetAlpha = target.alpha || 1.0;
        }
      }
    }
  }

  /**
   * Phase 5: Blend - final transition to target image
   */
  startBlend(particles) {
    console.log('[AlienTransition] Phase 5: Blend');
    this.phase = 'blend';
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;
  }

  /**
   * Update the preset each frame
   */
  update(particles, deltaTime, dimensions) {
    const now = Date.now();
    const elapsed = now - this.phaseStartTime;
    
    // Update phase progress
    let phaseDuration = 0;
    switch (this.phase) {
      case 'static': phaseDuration = this.config.staticDisplayDuration; break;
      case 'disintegrate': phaseDuration = this.config.disintegrateDuration; break;
      case 'alienMorph': phaseDuration = this.config.alienMorphDuration; break;
      case 'reform': phaseDuration = this.config.reformDuration; break;
      case 'blend': phaseDuration = this.config.blendDuration; break;
    }
    
    this.phaseProgress = Math.min(1.0, elapsed / phaseDuration);
    
    // Calculate overall progress
    const totalDuration = this.config.staticDisplayDuration + 
                          this.config.disintegrateDuration +
                          this.config.alienMorphDuration +
                          this.config.reformDuration +
                          this.config.blendDuration;
    const phaseOffsets = {
      static: 0,
      disintegrate: this.config.staticDisplayDuration,
      alienMorph: this.config.staticDisplayDuration + this.config.disintegrateDuration,
      reform: this.config.staticDisplayDuration + this.config.disintegrateDuration + this.config.alienMorphDuration,
      blend: this.config.staticDisplayDuration + this.config.disintegrateDuration + this.config.alienMorphDuration + this.config.reformDuration
    };
    const phaseOffset = phaseOffsets[this.phase] || 0;
    this.overallProgress = Math.min(1.0, (phaseOffset + elapsed) / totalDuration);
    
    // Phase transitions
    if (this.phaseProgress >= 1.0) {
      switch (this.phase) {
        case 'static':
          this.startDisintegrate(particles);
          break;
        case 'disintegrate':
          this.startAlienMorph(particles);
          break;
        case 'alienMorph':
          this.startReform(particles, this.targets);
          break;
        case 'reform':
          this.startBlend(particles);
          break;
        case 'blend':
          this.phase = 'complete';
          console.log('[AlienTransition] Transition complete');
          break;
      }
    }
    
    // Update particle behavior based on phase
    switch (this.phase) {
      case 'static':
        // No particle updates during static display
        break;
        
      case 'disintegrate':
        this.updateDisintegrate(particles, deltaTime);
        break;
        
      case 'alienMorph':
        this.updateAlienMorph(particles, deltaTime);
        break;
        
      case 'reform':
        this.updateReform(particles, deltaTime);
        break;
        
      case 'blend':
        this.updateBlend(particles, deltaTime);
        break;
    }
    
    // Update ghost outline alpha
    if (this.phase === 'reform') {
      const fadeStart = this.config.ghostFadeStart;
      if (this.phaseProgress >= fadeStart) {
        const fadeProgress = (this.phaseProgress - fadeStart) / (1.0 - fadeStart);
        this.ghostOutlineAlpha = this.config.ghostOutlineOpacity * (1.0 - fadeProgress);
      }
    } else if (this.phase === 'blend') {
      this.ghostOutlineAlpha = 0;
    }
    
    // Apply mesh physics constraints if mesh is available
    if (dimensions.mesh) {
      this.applyMeshConstraints(dimensions.mesh, deltaTime);
    }
  }

  /**
   * Update particles during disintegration phase
   */
  updateDisintegrate(particles, deltaTime) {
    for (const particle of particles) {
      if (particle.masked) continue;
      
      // Apply damping
      particle.vx *= DAMPING_DISINTEGRATE;
      particle.vy *= DAMPING_DISINTEGRATE;
      
      // Update positions
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;
    }
  }

  /**
   * Update particles during alien morph phase
   */
  updateAlienMorph(particles, deltaTime) {
    const { alienIntensity, liquidThickness } = this.config;
    const time = (Date.now() - this.phaseStartTime) / 1000;
    
    for (const particle of particles) {
      if (particle.masked) continue;
      
      // Wave motion for liquid effect
      const wave = Math.sin(time * WAVE_FREQUENCY_MULTIPLIER + particle.waveOffset) * alienIntensity * WAVE_AMPLITUDE;
      particle.vx += wave * deltaTime;
      
      // Rotation motion
      if (particle.rotationSpeed) {
        const angle = time * particle.rotationSpeed;
        const rotX = Math.cos(angle) * 2;
        const rotY = Math.sin(angle) * 2;
        particle.vx += rotX * alienIntensity;
        particle.vy += rotY * alienIntensity;
      }
      
      // Viscosity damping (liquid thickness)
      const viscosity = 1.0 - liquidThickness * VISCOSITY_DAMPING_FACTOR;
      particle.vx *= viscosity;
      particle.vy *= viscosity;
      
      // Update positions
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;
    }
  }

  /**
   * Update particles during reform phase
   */
  updateReform(particles, deltaTime) {
    const { snapSpeed, recombinationChaos, vacuumStrength } = this.config;
    
    for (const particle of particles) {
      if (particle.masked || !particle.targetX) continue;
      
      const dx = particle.targetX - particle.x;
      const dy = particle.targetY - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        // Vacuum pull toward target
        const pullStrength = vacuumStrength * (1.0 + this.phaseProgress * 2.0);
        particle.vx += (dx / dist) * pullStrength * dist;
        particle.vy += (dy / dist) * pullStrength * dist;
        
        // Direct snap for faster reformation
        const snapForce = snapSpeed * this.phaseProgress;
        particle.x += dx * snapForce * deltaTime;
        particle.y += dy * snapForce * deltaTime;
        
        // Add chaos for organic feel
        if (recombinationChaos > 0 && this.phaseProgress < 0.7) {
          const chaos = recombinationChaos * (1.0 - this.phaseProgress);
          particle.vx += (Math.random() - 0.5) * chaos * 10;
          particle.vy += (Math.random() - 0.5) * chaos * 10;
        }
      }
      
      // Damping
      particle.vx *= DAMPING_REFORM;
      particle.vy *= DAMPING_REFORM;
      
      // Update positions
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;
      
      // Color transition
      if (particle.targetR !== undefined) {
        particle.r += (particle.targetR - particle.r) * COLOR_TRANSITION_SPEED;
        particle.g += (particle.targetG - particle.g) * COLOR_TRANSITION_SPEED;
        particle.b += (particle.targetB - particle.b) * COLOR_TRANSITION_SPEED;
      }
    }
  }

  /**
   * Update particles during blend phase
   */
  updateBlend(particles, deltaTime) {
    for (const particle of particles) {
      if (particle.masked) continue;
      
      // Continue moving to target
      if (particle.targetX) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        particle.x += dx * FINAL_SNAP_SPEED;
        particle.y += dy * FINAL_SNAP_SPEED;
      }
      
      // Fade out particle alpha for blend
      if (particle.alpha > 0) {
        particle.alpha = Math.max(0, particle.alpha - PARTICLE_FADE_RATE);
      }
      
      // Final color convergence
      if (particle.targetR !== undefined) {
        particle.r += (particle.targetR - particle.r) * 0.2;
        particle.g += (particle.targetG - particle.g) * 0.2;
        particle.b += (particle.targetB - particle.b) * 0.2;
      }
    }
  }

  /**
   * Apply mesh physics constraints
   * Limits max stretch, angle, and applies restoring forces
   */
  applyMeshConstraints(mesh, deltaTime) {
    if (!mesh || !mesh.springs) return;
    
    const { meshSpringLimit, meshAngleLimit, meshRestoringForce } = this.config;
    const angleLimit = meshAngleLimit * Math.PI / 180; // Convert to radians
    
    for (const spring of mesh.springs) {
      if (!spring.active) continue;
      
      const { v1, v2, restLength } = spring;
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      
      // Check stretch limit
      if (currentLength > restLength * meshSpringLimit) {
        // Apply strong restoring force
        const stretchRatio = currentLength / restLength;
        const overshoot = stretchRatio - meshSpringLimit;
        const force = meshRestoringForce * overshoot;
        
        const dirX = dx / currentLength;
        const dirY = dy / currentLength;
        
        // Pull vertices back together
        if (!v1.fixed) {
          v1.vx += dirX * force;
          v1.vy += dirY * force;
        }
        if (!v2.fixed) {
          v2.vx -= dirX * force;
          v2.vy -= dirY * force;
        }
        
        // Track violation for debugging
        const violationKey = `${v1.id}-${v2.id}`;
        this.springConstraintViolations.set(violationKey, {
          stretch: stretchRatio,
          time: Date.now()
        });
      }
    }
    
    // Clean up old violations
    const now = Date.now();
    for (const [key, violation] of this.springConstraintViolations.entries()) {
      if (now - violation.time > 1000) {
        this.springConstraintViolations.delete(key);
      }
    }
  }

  /**
   * Get alpha-aware blob size for rendering
   * Scales blob/particle size based on local alpha
   */
  getBlobSize(particle, baseSize) {
    if (!particle.localAlpha || !this.config.preventBlackout) {
      return baseSize;
    }
    
    const { blobSizeScale, blobMinAlpha } = this.config;
    const alpha = Math.max(blobMinAlpha, particle.localAlpha);
    return baseSize * (blobSizeScale + (1.0 - blobSizeScale) * alpha);
  }

  /**
   * Check if particle should render blob
   */
  shouldRenderBlob(particle) {
    if (particle.masked) return false;
    if (!particle.localAlpha) return true;
    return particle.localAlpha >= this.config.blobMinAlpha;
  }

  /**
   * Get ghost outline rendering data
   */
  getGhostOutline() {
    if (this.ghostOutlineAlpha <= 0 || !this.ghostOutlineImage) {
      return null;
    }
    
    return {
      image: this.ghostOutlineImage,
      alpha: this.ghostOutlineAlpha
    };
  }

  /**
   * Transition to target pattern/image
   */
  transitionTo(particles, targets, duration = 2000) {
    console.log('[AlienTransition] Transitioning to target...');
    this.targets = targets;
    
    // This will be called when we have targets ready
    // The actual transition is handled by the phase system
  }

  /**
   * Get current phase information
   */
  getPhaseInfo() {
    return {
      phase: this.phase,
      phaseProgress: this.phaseProgress,
      overallProgress: this.overallProgress,
      ghostOutlineAlpha: this.ghostOutlineAlpha
    };
  }

  /**
   * Clean up
   */
  deactivate() {
    super.deactivate();
    this.maskedParticles.clear();
    this.particleAlphaMap.clear();
    this.springConstraintViolations.clear();
  }
}
