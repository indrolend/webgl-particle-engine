/**
 * BlobImageTransitionPreset - Blob-based image transition with center explosion
 * 
 * Creates a transition where:
 * 1. Blob starts looking like image 1 (particles arranged and colored from image)
 * 2. Explodes from center point
 * 3. Elastically recombines to form image 2
 * 
 * The "blob looks exactly like the image" is achieved by:
 * - Dense particle sampling from image
 * - Particles colored from image pixels
 * - Blob rendering with high coverage
 * - Initial static pose before explosion
 */

import { Preset } from './Preset.js';

export class BlobImageTransitionPreset extends Preset {
  constructor(config = {}) {
    super('BlobImageTransition', config);
    
    // Phase durations (ms)
    this.phaseDurations = {
      staticImage1: config.staticImage1Duration || 800,    // Show image 1 statically
      blobFormation: config.blobFormationDuration || 400,  // Brief pause as blob
      explosion: config.explosionDuration || 600,          // Center explosion
      splatter: config.splatterDuration || 400,            // Outward splatter
      recombination: config.recombinationDuration || 1200, // Elastic pull back
      blobSettle: config.blobSettleDuration || 400,        // Settle into image 2 shape
      staticImage2: config.staticImage2Duration || 800     // Show image 2 statically
    };
    
    // Physics parameters
    this.explosionIntensity = config.explosionIntensity || 180;
    this.elasticStrength = config.elasticStrength || 0.12;  // Spring-like force
    this.damping = config.damping || 0.96;                 // Bounce damping
    this.centerX = 0;
    this.centerY = 0;
    
    // State tracking
    this.currentPhase = 'idle';
    this.phaseStartTime = 0;
    this.targetPositions = [];
    this.sourceImage = null;
    this.targetImage = null;
    
    console.log('[BlobImageTransitionPreset] Initialized with phases:', this.phaseDurations);
  }
  
  /**
   * Initialize the preset with images
   */
  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    this.targetPositions = options.targets || [];
    
    // Calculate center of canvas
    this.centerX = dimensions.width / 2;
    this.centerY = dimensions.height / 2;
    
    console.log('[BlobImageTransitionPreset] Initialized with images, center:', this.centerX, this.centerY);
  }
  
  /**
   * Start the transition
   */
  start(particles, dimensions) {
    super.start();
    this.currentPhase = 'staticImage1';
    this.phaseStartTime = Date.now();
    
    // Store initial positions as source positions
    this.sourcePositions = particles.map(p => ({ x: p.x, y: p.y }));
    
    console.log('[BlobImageTransitionPreset] Starting blob image transition');
  }
  
  /**
   * Update particles based on current phase
   */
  update(particles, deltaTime, dimensions) {
    if (!this.active) return;
    
    const now = Date.now();
    const phaseElapsed = now - this.phaseStartTime;
    
    // Check if current phase is complete
    if (phaseElapsed >= this.phaseDurations[this.currentPhase]) {
      this.transitionToNextPhase(particles, dimensions);
      return;
    }
    
    // Calculate phase progress (0 to 1)
    const progress = phaseElapsed / this.phaseDurations[this.currentPhase];
    
    // Apply phase-specific behavior
    switch (this.currentPhase) {
      case 'staticImage1':
        this.updateStaticImage1(particles, progress);
        break;
        
      case 'blobFormation':
        this.updateBlobFormation(particles, progress);
        break;
        
      case 'explosion':
        this.updateExplosion(particles, progress, dimensions);
        break;
        
      case 'splatter':
        this.updateSplatter(particles, progress);
        break;
        
      case 'recombination':
        this.updateRecombination(particles, progress);
        break;
        
      case 'blobSettle':
        this.updateBlobSettle(particles, progress);
        break;
        
      case 'staticImage2':
        this.updateStaticImage2(particles, progress);
        break;
    }
  }
  
  /**
   * Transition to next phase
   */
  transitionToNextPhase(particles, dimensions) {
    const phases = ['staticImage1', 'blobFormation', 'explosion', 'splatter', 'recombination', 'blobSettle', 'staticImage2'];
    const currentIndex = phases.indexOf(this.currentPhase);
    
    if (currentIndex < phases.length - 1) {
      this.currentPhase = phases[currentIndex + 1];
      this.phaseStartTime = Date.now();
      
      console.log(`[BlobImageTransitionPreset] Phase: ${this.currentPhase}`);
      
      // Phase-specific initialization
      if (this.currentPhase === 'explosion') {
        this.initializeExplosion(particles, dimensions);
      }
    } else {
      console.log('[BlobImageTransitionPreset] Transition complete');
      this.stop();
    }
  }
  
  /**
   * Static Image 1 - particles held in source image positions
   */
  updateStaticImage1(particles, progress) {
    // Keep particles still at source positions
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const source = this.sourcePositions[i];
      
      if (source) {
        // Strong damping to hold position
        p.vx *= 0.85;
        p.vy *= 0.85;
        
        // Pull to source position
        const dx = source.x - p.x;
        const dy = source.y - p.y;
        p.vx += dx * 0.1;
        p.vy += dy * 0.1;
      }
    }
  }
  
  /**
   * Blob Formation - brief pause to establish blob appearance
   */
  updateBlobFormation(particles, progress) {
    // Minimal movement, blob renderer shows the cohesive shape
    for (const p of particles) {
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
  }
  
  /**
   * Initialize explosion from center
   */
  initializeExplosion(particles, dimensions) {
    console.log('[BlobImageTransitionPreset] EXPLOSION from center:', this.centerX, this.centerY);
    
    // Apply radial explosion force from center
    for (const p of particles) {
      const dx = p.x - this.centerX;
      const dy = p.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        // Radial direction with randomness for organic feel
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
        const speed = (0.5 + Math.random() * 0.5) * this.explosionIntensity;
        
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      } else {
        // Particles at center get random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = this.explosionIntensity;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    }
  }
  
  /**
   * Explosion phase - maintain outward momentum
   */
  updateExplosion(particles, progress, dimensions) {
    // Add slight chaos during explosion
    const chaosStrength = 0.8 * (1 - progress);
    
    for (const p of particles) {
      // Add chaos
      p.vx += (Math.random() - 0.5) * chaosStrength;
      p.vy += (Math.random() - 0.5) * chaosStrength;
      
      // Light damping
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
  }
  
  /**
   * Splatter phase - particles continue outward with damping
   */
  updateSplatter(particles, progress) {
    // Gradual damping as splatter completes
    const dampingFactor = 0.98 - progress * 0.05;
    
    for (const p of particles) {
      p.vx *= dampingFactor;
      p.vy *= dampingFactor;
    }
  }
  
  /**
   * Recombination - elastic pull back to target positions (like Stretch Armstrong)
   */
  updateRecombination(particles, progress) {
    const eased = this.easeInOutCubic(progress);
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = this.targetPositions[i];
      
      if (!target) continue;
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0.1) {
        // Elastic spring force - stronger when further away
        const force = this.elasticStrength * eased * dist * 0.01;
        p.vx += (dx / dist) * force * dist;
        p.vy += (dy / dist) * force * dist;
      }
      
      // Bouncy damping (not too much, to maintain elastic feel)
      p.vx *= this.damping;
      p.vy *= this.damping;
      
      // Gradually transition colors to target
      if (target.r !== undefined) {
        p.r += (target.r - p.r) * 0.05 * eased;
        p.g += (target.g - p.g) * 0.05 * eased;
        p.b += (target.b - p.b) * 0.05 * eased;
      }
    }
  }
  
  /**
   * Blob Settle - final settling into target shape
   */
  updateBlobSettle(particles, progress) {
    const eased = this.easeInOutCubic(progress);
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = this.targetPositions[i];
      
      if (!target) continue;
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      
      // Strong pull to exact position
      p.vx += dx * 0.15 * eased;
      p.vy += dy * 0.15 * eased;
      
      // Heavy damping for settling
      p.vx *= 0.9;
      p.vy *= 0.9;
      
      // Finalize colors
      if (target.r !== undefined) {
        p.r += (target.r - p.r) * 0.1;
        p.g += (target.g - p.g) * 0.1;
        p.b += (target.b - p.b) * 0.1;
      }
    }
  }
  
  /**
   * Static Image 2 - hold at target positions
   */
  updateStaticImage2(particles, progress) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = this.targetPositions[i];
      
      if (target) {
        // Very strong damping and position locking
        p.vx *= 0.8;
        p.vy *= 0.8;
        
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        p.vx += dx * 0.2;
        p.vy += dy * 0.2;
      }
    }
  }
  
  /**
   * Check if in final static phase
   */
  isInFinalStatic() {
    return this.currentPhase === 'staticImage2';
  }
  
  /**
   * Check if showing static image 1
   */
  isInStaticImage1() {
    return this.currentPhase === 'staticImage1';
  }
  
  /**
   * Get current phase
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
    this.sourcePositions = [];
  }
}
