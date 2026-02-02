/**
 * BlobTransitionPreset - Organic blob mesh transition with mitosis/merging
 * 
 * Implements a multi-phase blob transition:
 * 1. Static display - Source image as blob
 * 2. Disintegration - Blob dissolves
 * 3. Explosion - Single blob splits into multiple fragments (mitosis)
 * 4. Recombination - Fragments merge back together
 * 5. Blob morphing - Blob shape transitions to target
 * 6. Final static - Target image as blob
 */

import { Preset } from './Preset.js';

export class BlobTransitionPreset extends Preset {
  constructor(config = {}) {
    super('BlobTransition', config);
    
    // Phase durations (ms)
    this.phaseDurations = {
      static: config.staticDisplayDuration || 500,
      disintegration: config.disintegrationDuration || 1000,
      explosion: config.explosionTime || 1200,
      recombination: config.recombinationDuration || 2500,
      morphing: config.morphingDuration || 1500,
      finalStatic: config.finalStaticDuration || 500
    };
    
    // Physics parameters
    this.explosionIntensity = config.explosionIntensity || 150;
    this.surfaceTensionStrength = config.surfaceTension || 0.5;
    this.mitosisFactor = config.mitosisFactor || 0.5;
    this.vacuumStrength = config.vacuumStrength || 0.15;
    this.recombinationChaos = config.recombinationChaos || 0.3;
    
    // State tracking
    this.currentPhase = 'idle';
    this.phaseStartTime = 0;
    this.totalElapsed = 0;
    this.targetPositions = [];
    
    console.log('[BlobTransitionPreset] Initialized with phases:', this.phaseDurations);
  }
  
  /**
   * Start the blob transition
   */
  start(particles, dimensions) {
    super.start();
    this.currentPhase = 'static';
    this.phaseStartTime = Date.now();
    this.totalElapsed = 0;
    
    console.log('[BlobTransitionPreset] Starting blob transition');
  }
  
  /**
   * Update particles based on current phase
   */
  update(particles, deltaTime, dimensions) {
    if (!this.active) return;
    
    const now = Date.now();
    const phaseElapsed = now - this.phaseStartTime;
    this.totalElapsed += deltaTime * 1000;
    
    // Check if current phase is complete
    if (phaseElapsed >= this.phaseDurations[this.currentPhase]) {
      this.transitionToNextPhase(particles, dimensions);
      return;
    }
    
    // Calculate phase progress (0 to 1)
    const progress = phaseElapsed / this.phaseDurations[this.currentPhase];
    
    // Apply phase-specific behavior
    switch (this.currentPhase) {
      case 'static':
        // Keep particles in place
        this.updateStaticPhase(particles, progress);
        break;
        
      case 'disintegration':
        // Gradually add velocity
        this.updateDisintegrationPhase(particles, progress);
        break;
        
      case 'explosion':
        // Accelerate outward, encourage mitosis
        this.updateExplosionPhase(particles, progress, dimensions);
        break;
        
      case 'recombination':
        // Pull toward target positions, enable merging
        this.updateRecombinationPhase(particles, progress);
        break;
        
      case 'morphing':
        // Smooth transition to target shape
        this.updateMorphingPhase(particles, progress);
        break;
        
      case 'finalStatic':
        // Keep at target positions
        this.updateFinalStaticPhase(particles, progress);
        break;
    }
  }
  
  /**
   * Transition to the next phase
   */
  transitionToNextPhase(particles, dimensions) {
    const phases = ['static', 'disintegration', 'explosion', 'recombination', 'morphing', 'finalStatic'];
    const currentIndex = phases.indexOf(this.currentPhase);
    
    if (currentIndex < phases.length - 1) {
      this.currentPhase = phases[currentIndex + 1];
      this.phaseStartTime = Date.now();
      
      console.log(`[BlobTransitionPreset] Transitioning to phase: ${this.currentPhase}`);
      
      // Phase-specific initialization
      if (this.currentPhase === 'explosion') {
        this.initializeExplosionPhase(particles, dimensions);
      } else if (this.currentPhase === 'recombination') {
        this.initializeRecombinationPhase(particles, dimensions);
      }
    } else {
      // Transition complete
      console.log('[BlobTransitionPreset] Blob transition complete');
      this.stop();
    }
  }
  
  /**
   * Static phase - particles at rest
   */
  updateStaticPhase(particles, progress) {
    for (const p of particles) {
      // Dampen any existing velocity
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
  }
  
  /**
   * Disintegration phase - add turbulence
   */
  updateDisintegrationPhase(particles, progress) {
    const eased = this.easeInOutCubic(progress);
    
    for (const p of particles) {
      // Add increasing random velocity
      const turbulence = eased * 2.0;
      p.vx += (Math.random() - 0.5) * turbulence;
      p.vy += (Math.random() - 0.5) * turbulence;
    }
  }
  
  /**
   * Initialize explosion phase
   */
  initializeExplosionPhase(particles, dimensions) {
    // Calculate center of mass
    let centerX = 0, centerY = 0;
    for (const p of particles) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= particles.length;
    centerY /= particles.length;
    
    // Apply explosion force from center
    for (const p of particles) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        // Radial explosion with some randomness
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        const speed = (0.3 + Math.random() * 0.7) * this.explosionIntensity;
        
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    }
    
    console.log('[BlobTransitionPreset] Explosion initialized - encouraging mitosis');
  }
  
  /**
   * Explosion phase - maintain outward momentum
   */
  updateExplosionPhase(particles, progress, dimensions) {
    // Add slight chaos
    const chaosStrength = 0.5 * (1 - progress);
    
    for (const p of particles) {
      p.vx += (Math.random() - 0.5) * chaosStrength;
      p.vy += (Math.random() - 0.5) * chaosStrength;
      
      // Gradual damping toward end of phase
      if (progress > 0.7) {
        const damping = 0.98 - (progress - 0.7) * 0.1;
        p.vx *= damping;
        p.vy *= damping;
      }
    }
  }
  
  /**
   * Initialize recombination phase
   */
  initializeRecombinationPhase(particles, dimensions) {
    // Store target positions (could be different formation)
    this.targetPositions = particles.map(p => ({
      x: p.x,
      y: p.y
    }));
    
    console.log('[BlobTransitionPreset] Recombination initialized - enabling blob merging');
  }
  
  /**
   * Recombination phase - pull particles together
   */
  updateRecombinationPhase(particles, progress) {
    const eased = this.easeInOutCubic(progress);
    const vacuumForce = this.vacuumStrength * eased * 0.15;
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = this.targetPositions[i];
      
      if (!target) continue;
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        // Pull toward target
        const force = vacuumForce * dist;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        
        // Add chaos
        const chaos = this.recombinationChaos * (1 - eased);
        p.vx += (Math.random() - 0.5) * chaos;
        p.vy += (Math.random() - 0.5) * chaos;
      }
      
      // Apply damping
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }
  
  /**
   * Morphing phase - smooth shape transition
   */
  updateMorphingPhase(particles, progress) {
    const eased = this.easeInOutCubic(progress);
    
    // Smoothly interpolate to target positions
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = this.targetPositions[i];
      
      if (!target) continue;
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      
      // Strong pull to exact target
      const pullStrength = 0.1 * eased;
      p.vx += dx * pullStrength;
      p.vy += dy * pullStrength;
      
      // Heavy damping
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }
  
  /**
   * Final static phase - hold position
   */
  updateFinalStaticPhase(particles, progress) {
    for (const p of particles) {
      // Strong damping to settle
      p.vx *= 0.85;
      p.vy *= 0.85;
    }
  }
  
  /**
   * Check if in final static phase
   */
  isInFinalStatic() {
    return this.currentPhase === 'finalStatic';
  }
  
  /**
   * Get current phase name
   */
  getCurrentPhase() {
    return this.currentPhase;
  }
  
  /**
   * Easing function
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Stop the preset
   */
  stop() {
    super.stop();
    this.currentPhase = 'idle';
    this.targetPositions = [];
  }
}
