/**
 * UnifiedHybridTransitionPreset - Unified continuous physics-based particle transitions
 * 
 * Key Features:
 * - NO phase compartmentalization - continuous physics simulation
 * - Seamless state evolution using easing and interpolation
 * - Liquid-like blob dynamics throughout transition
 * - Gradient-based color mixing
 * - Watercolor-inspired fluid behavior
 * 
 * Replaces discrete phases with continuous state variables:
 * - explosionProgress: 0→1 (particles scatter)
 * - recombinationProgress: 0→1 (particles attract to target)
 * - blendProgress: 0→1 (particles fade, triangulation appears)
 */
import { Preset } from './Preset.js';
import { FerrofluidPhysics } from '../physics/FerrofluidPhysics.js';
import { ImageContainer } from '../physics/ImageContainer.js';
import { LiquidThicknessController } from '../utils/LiquidThicknessController.js';
import { GradientExtractor } from '../utils/GradientExtractor.js';

export class UnifiedHybridTransitionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Unified Hybrid Transition',
      'Continuous physics-based transition with liquid dynamics and gradient mixing',
      {
        // Liquid thickness parameter (0 = thin/water, 1 = thick/honey)
        liquidThickness: config.liquidThickness !== undefined ? config.liquidThickness : 0.5,
        
        // Transition timing (continuous, not discrete phases)
        totalDuration: config.totalDuration || 5000,  // Total transition duration (ms)
        
        // Timing weights for each stage (0-1, should sum to ~1.0)
        explosionWeight: config.explosionWeight || 0.2,      // 20% of duration
        recombinationWeight: config.recombinationWeight || 0.5, // 50% of duration
        blendWeight: config.blendWeight || 0.3,              // 30% of duration
        
        // Physics parameters (overridden by liquid thickness)
        explosionIntensity: config.explosionIntensity || 150,
        vacuumStrength: config.vacuumStrength || 0.15,
        recombinationChaos: config.recombinationChaos || 0.3,
        
        // Gradient and watercolor effects
        enableGradients: config.enableGradients !== false,
        watercolorIntensity: config.watercolorIntensity || 0.5,  // 0-1
        gradientMixing: config.gradientMixing !== false,
        
        // Container and ferrofluid physics
        enableContainer: config.enableContainer !== false,
        enableFerrofluid: config.enableFerrofluid !== false,
        
        ...config
      }
    );
    
    // Continuous state variables (no discrete phases)
    this.transitionStartTime = 0;
    this.isTransitioning = false;
    
    // Progress variables (all run simultaneously, interpolated by easing)
    this.explosionProgress = 0;
    this.recombinationProgress = 0;
    this.blendProgress = 0;
    
    // Target data
    this.targets = null;
    this.sourceImage = null;
    this.targetImage = null;
    this.gradientData = null;
    
    // Initialize liquid thickness controller
    this.liquidController = new LiquidThicknessController({
      liquidThickness: this.config.liquidThickness
    });
    
    // Initialize gradient extractor
    if (this.config.enableGradients) {
      this.gradientExtractor = new GradientExtractor();
    }
    
    // Initialize ferrofluid physics with liquid thickness
    if (this.config.enableFerrofluid) {
      const ferroConfig = this.liquidController.getFerrofluidConfig();
      this.ferrofluidPhysics = new FerrofluidPhysics({
        ...ferroConfig,
        enableDuringExplosion: true,
        enableDuringRecombination: true
      });
    }
    
    // Image containers
    this.sourceContainer = null;
    this.targetContainer = null;
    
    console.log('[UnifiedHybridTransition] Initialized with liquid thickness:', this.config.liquidThickness);
  }
  
  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    // Store images
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Extract gradient data from target image
    if (this.config.enableGradients && this.targetImage && this.gradientExtractor) {
      console.log('[UnifiedHybridTransition] Extracting gradient data from target image...');
      this.gradientData = this.gradientExtractor.extractGradientData(this.targetImage);
    }
    
    // Create image containers
    if (this.config.enableContainer && this.sourceImage) {
      this.sourceContainer = this.createImageContainer(this.sourceImage, dimensions);
    }
    
    // Start transition
    this.startTransition(particles);
  }
  
  /**
   * Create image container for particle containment
   */
  createImageContainer(image, dimensions) {
    const container = new ImageContainer({
      padding: 10,
      bounceStrength: 0.3,
      edgeSoftness: 8
    });
    
    const imageAspect = image.width / image.height;
    const canvasAspect = dimensions.width / dimensions.height;
    
    let scale, offsetX, offsetY;
    if (imageAspect > canvasAspect) {
      scale = (dimensions.width * 0.9) / image.width;
    } else {
      scale = (dimensions.height * 0.9) / image.height;
    }
    
    offsetX = (dimensions.width - image.width * scale) / 2;
    offsetY = (dimensions.height - image.height * scale) / 2;
    
    container.generateFromImage(image, dimensions, scale, { x: offsetX, y: offsetY });
    
    return container;
  }
  
  /**
   * Start unified transition (no discrete phases)
   */
  startTransition(particles) {
    console.log('[UnifiedHybridTransition] Starting continuous physics-based transition...');
    
    this.transitionStartTime = Date.now();
    this.isTransitioning = true;
    
    // Initialize particle velocities for explosion
    particles.forEach(particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * this.config.explosionIntensity;
      
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      
      // Store initial state for interpolation
      particle.initialX = particle.x;
      particle.initialY = particle.y;
      particle.initialR = particle.r;
      particle.initialG = particle.g;
      particle.initialB = particle.b;
      particle.initialSize = particle.size;
    });
  }
  
  /**
   * Set target positions for recombination
   */
  setTargets(targets) {
    this.targets = targets;
    
    // Create target container if available
    if (this.config.enableContainer && this.targetImage && this.dimensions) {
      this.targetContainer = this.createImageContainer(this.targetImage, this.dimensions);
    }
  }
  
  /**
   * Unified update - all physics run continuously with interpolated weights
   */
  update(particles, deltaTime, dimensions) {
    if (!this.isTransitioning) return;
    
    const elapsed = Date.now() - this.transitionStartTime;
    const totalDuration = this.config.totalDuration;
    const overallProgress = Math.min(elapsed / totalDuration, 1.0);
    
    // Calculate continuous progress values using easing
    this.updateProgressValues(overallProgress);
    
    // Apply unified physics to all particles
    particles.forEach(particle => {
      this.updateParticleUnified(particle, deltaTime, dimensions);
    });
    
    // Apply ferrofluid physics (active throughout entire transition)
    if (this.ferrofluidPhysics) {
      this.ferrofluidPhysics.update(particles, deltaTime, dimensions);
    }
    
    // Apply container constraints (blend between source and target)
    if (this.sourceContainer && this.recombinationProgress < 0.5) {
      this.sourceContainer.constrainParticles(particles);
    } else if (this.targetContainer && this.recombinationProgress >= 0.5) {
      this.targetContainer.constrainParticles(particles);
    }
    
    // Check if transition is complete
    if (overallProgress >= 1.0) {
      this.isTransitioning = false;
      console.log('[UnifiedHybridTransition] Transition complete');
    }
  }
  
  /**
   * Update continuous progress values with smooth easing
   */
  updateProgressValues(overallProgress) {
    const { explosionWeight, recombinationWeight, blendWeight } = this.config;
    
    // Normalize weights to ensure they sum to 1.0
    const totalWeight = explosionWeight + recombinationWeight + blendWeight;
    const normExplosionWeight = explosionWeight / totalWeight;
    const normRecombinationWeight = recombinationWeight / totalWeight;
    const normBlendWeight = blendWeight / totalWeight;
    
    // Calculate stage boundaries
    const explosionEnd = normExplosionWeight;
    const recombinationEnd = explosionEnd + normRecombinationWeight;
    const blendEnd = recombinationEnd + normBlendWeight; // Now used for validation
    
    // Explosion progress (0→1 during first stage, then stays at 1)
    if (overallProgress < explosionEnd) {
      this.explosionProgress = this.easeInOutCubic(overallProgress / explosionEnd);
    } else {
      this.explosionProgress = 1.0;
    }
    
    // Recombination progress (starts during explosion, peaks mid-transition)
    if (overallProgress < explosionEnd) {
      this.recombinationProgress = 0;
    } else if (overallProgress < recombinationEnd) {
      const localProgress = (overallProgress - explosionEnd) / normRecombinationWeight;
      this.recombinationProgress = this.easeInOutCubic(localProgress);
    } else {
      this.recombinationProgress = 1.0;
    }
    
    // Blend progress (starts near end, grows to 1)
    if (overallProgress < recombinationEnd) {
      this.blendProgress = 0;
    } else {
      const localProgress = (overallProgress - recombinationEnd) / normBlendWeight;
      this.blendProgress = this.easeInOutCubic(localProgress);
    }
  }
  
  /**
   * Update single particle with unified physics
   */
  updateParticleUnified(particle, deltaTime, dimensions) {
    // Explosion force (decreases as recombination increases)
    const explosionForce = this.explosionProgress * (1.0 - this.recombinationProgress * 0.7);
    
    // Update position with velocity
    particle.x += particle.vx * deltaTime * explosionForce;
    particle.y += particle.vy * deltaTime * explosionForce;
    
    // Apply velocity damping (increases with recombination)
    const damping = this.liquidController.getDamping();
    const dampingFactor = damping - (1.0 - damping) * this.recombinationProgress * 0.3;
    particle.vx *= dampingFactor;
    particle.vy *= dampingFactor;
    
    // Recombination attraction (vacuum-like force to target)
    if (this.targets && this.recombinationProgress > 0 && particle.targetX !== undefined) {
      const dx = particle.targetX - particle.x;
      const dy = particle.targetY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 1) {
        // Vacuum strength increases with recombination progress
        const vacuumForce = this.config.vacuumStrength * this.recombinationProgress;
        const forceX = (dx / distance) * vacuumForce * distance * 0.1;
        const forceY = (dy / distance) * vacuumForce * distance * 0.1;
        
        particle.vx += forceX;
        particle.vy += forceY;
        
        // Add chaotic motion (decreases with recombination progress)
        const chaos = this.config.recombinationChaos * (1.0 - this.recombinationProgress);
        particle.vx += (Math.random() - 0.5) * chaos * 50 * deltaTime;
        particle.vy += (Math.random() - 0.5) * chaos * 50 * deltaTime;
      }
    }
    
    // Boundary constraints with soft bounce
    if (particle.x < 0 || particle.x > dimensions.width) {
      particle.vx *= -0.5;
      particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
    }
    if (particle.y < 0 || particle.y > dimensions.height) {
      particle.vy *= -0.5;
      particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
    }
    
    // Color interpolation (gradient-aware if enabled)
    this.updateParticleColor(particle, dimensions);
    
    // Size interpolation
    this.updateParticleSize(particle);
    
    // Alpha/opacity for blend phase
    this.updateParticleAlpha(particle);
  }
  
  /**
   * Update particle color with gradient mixing
   */
  updateParticleColor(particle, dimensions) {
    if (!this.targets || particle.targetR === undefined) return;
    
    // Get gradient color if enabled
    let targetR = particle.targetR;
    let targetG = particle.targetG;
    let targetB = particle.targetB;
    
    if (this.config.enableGradients && this.gradientData && this.gradientExtractor) {
      const gradientColor = this.gradientExtractor.getColorAtPosition(
        particle.x,
        particle.y,
        this.gradientData,
        dimensions
      );
      
      // Mix gradient color with target color based on recombination progress
      const gradientMix = this.config.gradientMixing ? this.recombinationProgress * 0.5 : 0;
      targetR = targetR * (1 - gradientMix) + gradientColor.r * gradientMix;
      targetG = targetG * (1 - gradientMix) + gradientColor.g * gradientMix;
      targetB = targetB * (1 - gradientMix) + gradientColor.b * gradientMix;
    }
    
    // Smooth color interpolation with eased recombination progress
    const colorBlend = this.recombinationProgress * 0.15;
    particle.r += (targetR - particle.r) * colorBlend;
    particle.g += (targetG - particle.g) * colorBlend;
    particle.b += (targetB - particle.b) * colorBlend;
    
    // Store secondary color for gradient shader (if using gradient extractor)
    if (this.config.enableGradients && this.gradientData) {
      particle.gradientMix = this.recombinationProgress * 0.3;
      if (!particle.rSecondary) {
        particle.rSecondary = particle.r;
        particle.gSecondary = particle.g;
        particle.bSecondary = particle.b;
      }
      // Secondary color gradually shifts
      particle.rSecondary += (targetR - particle.rSecondary) * colorBlend * 0.5;
      particle.gSecondary += (targetG - particle.gSecondary) * colorBlend * 0.5;
      particle.bSecondary += (targetB - particle.bSecondary) * colorBlend * 0.5;
    }
  }
  
  /**
   * Update particle size
   */
  updateParticleSize(particle) {
    if (particle.targetSize === undefined) return;
    
    // Get size from liquid thickness controller
    const liquidSize = this.liquidController.getParticleSize();
    const targetSize = particle.targetSize * (liquidSize / 4.0); // Normalize to liquid thickness
    
    const sizeBlend = this.recombinationProgress * 0.1;
    particle.size += (targetSize - particle.size) * sizeBlend;
  }
  
  /**
   * Update particle alpha for blend phase
   */
  updateParticleAlpha(particle) {
    // Particles fade during blend phase
    const targetAlpha = 1.0 - (this.blendProgress * 0.7);
    // Use frame-rate independent interpolation
    const alphaBlendSpeed = 3.0; // Adjusts alpha 3x per second
    const blendRate = 1.0 - Math.exp(-alphaBlendSpeed * (1.0 / 60.0)); // Assuming ~60fps
    particle.alpha = particle.alpha + (targetAlpha - particle.alpha) * blendRate;
  }
  
  /**
   * Get current blend progress for engine coordination
   */
  getBlendProgress() {
    return this.blendProgress;
  }
  
  /**
   * Check if in final static phase (blend complete)
   */
  isInFinalStatic() {
    return !this.isTransitioning && this.blendProgress >= 1.0;
  }
  
  /**
   * Get watercolor intensity for shader
   */
  getWatercolorIntensity() {
    return this.config.watercolorIntensity;
  }
  
  /**
   * Easing function
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  deactivate() {
    super.deactivate();
    this.isTransitioning = false;
    this.explosionProgress = 0;
    this.recombinationProgress = 0;
    this.blendProgress = 0;
  }
}
