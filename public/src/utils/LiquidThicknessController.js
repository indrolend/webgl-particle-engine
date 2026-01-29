/**
 * LiquidThicknessController - Manages liquid thickness parameter and its effects
 * 
 * Key Features:
 * - Single parameter control for fluid-like behavior
 * - Maps thickness to particle density, elasticity, and size
 * - Thicker liquids: fewer points, more elasticity, rigid behavior
 * - Thinner liquids: more points, less elasticity, flexible animations
 */
export class LiquidThicknessController {
  constructor(config = {}) {
    this.config = {
      // Default liquid thickness (0 = very thin/water, 1 = very thick/honey)
      liquidThickness: config.liquidThickness !== undefined ? config.liquidThickness : 0.5,
      
      // Base particle count (will be adjusted by thickness)
      baseParticleCount: config.baseParticleCount || 2000,
      
      // Particle density range (multiplier based on thickness)
      minDensityMultiplier: config.minDensityMultiplier || 0.3,  // Thin liquid
      maxDensityMultiplier: config.maxDensityMultiplier || 1.5,  // Thick liquid
      
      // Elasticity range
      minElasticity: config.minElasticity || 0.1,  // Thin (flexible)
      maxElasticity: config.maxElasticity || 0.9,  // Thick (rigid)
      
      // Spring stiffness range
      minSpringStiffness: config.minSpringStiffness || 0.2,  // Thin
      maxSpringStiffness: config.maxSpringStiffness || 0.8,  // Thick
      
      // Damping range (velocity retention)
      minDamping: config.minDamping || 0.85,  // Thin (less damping, more flow)
      maxDamping: config.maxDamping || 0.98,  // Thick (more damping, less flow)
      
      // Surface tension range
      minSurfaceTension: config.minSurfaceTension || 0.1,  // Thin
      maxSurfaceTension: config.maxSurfaceTension || 0.5,  // Thick
      
      // Cohesion strength range
      minCohesionStrength: config.minCohesionStrength || 0.05,  // Thin
      maxCohesionStrength: config.maxCohesionStrength || 0.3,   // Thick
      
      // Particle size range
      minParticleSize: config.minParticleSize || 2,   // Thin
      maxParticleSize: config.maxParticleSize || 8,   // Thick
      
      ...config
    };
    
    console.log('[LiquidThicknessController] Initialized with thickness:', this.config.liquidThickness);
  }
  
  /**
   * Set liquid thickness value (0-1)
   * @param {number} thickness - Thickness value (0 = thin, 1 = thick)
   */
  setThickness(thickness) {
    this.config.liquidThickness = Math.max(0, Math.min(1, thickness));
    console.log('[LiquidThicknessController] Thickness set to:', this.config.liquidThickness);
  }
  
  /**
   * Get current liquid thickness
   * @returns {number} Current thickness value (0-1)
   */
  getThickness() {
    return this.config.liquidThickness;
  }
  
  /**
   * Calculate particle count based on liquid thickness
   * Thicker liquids = fewer particles (inverse relationship)
   * @returns {number} Particle count
   */
  getParticleCount() {
    const thickness = this.config.liquidThickness;
    
    // Inverse relationship: thicker = fewer particles
    const densityMultiplier = this.lerp(
      this.config.maxDensityMultiplier,  // Thin liquid (more particles)
      this.config.minDensityMultiplier,  // Thick liquid (fewer particles)
      thickness
    );
    
    return Math.round(this.config.baseParticleCount * densityMultiplier);
  }
  
  /**
   * Get elasticity value based on liquid thickness
   * Thicker liquids = more elastic/rigid behavior
   * @returns {number} Elasticity value (0-1)
   */
  getElasticity() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minElasticity, this.config.maxElasticity, thickness);
  }
  
  /**
   * Get spring stiffness based on liquid thickness
   * Thicker liquids = stiffer springs
   * @returns {number} Spring stiffness value
   */
  getSpringStiffness() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minSpringStiffness, this.config.maxSpringStiffness, thickness);
  }
  
  /**
   * Get damping value based on liquid thickness
   * Thicker liquids = more damping (resist motion)
   * @returns {number} Damping value (0.5-0.99)
   */
  getDamping() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minDamping, this.config.maxDamping, thickness);
  }
  
  /**
   * Get surface tension based on liquid thickness
   * Thicker liquids = higher surface tension
   * @returns {number} Surface tension value
   */
  getSurfaceTension() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minSurfaceTension, this.config.maxSurfaceTension, thickness);
  }
  
  /**
   * Get cohesion strength based on liquid thickness
   * Thicker liquids = stronger cohesion between particles
   * @returns {number} Cohesion strength value
   */
  getCohesionStrength() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minCohesionStrength, this.config.maxCohesionStrength, thickness);
  }
  
  /**
   * Get particle size based on liquid thickness
   * Thicker liquids = larger particles
   * @returns {number} Particle size
   */
  getParticleSize() {
    const thickness = this.config.liquidThickness;
    return this.lerp(this.config.minParticleSize, this.config.maxParticleSize, thickness);
  }
  
  /**
   * Get all physics parameters as a config object
   * @returns {Object} Complete physics configuration based on current thickness
   */
  getPhysicsConfig() {
    return {
      liquidThickness: this.config.liquidThickness,
      particleCount: this.getParticleCount(),
      elasticity: this.getElasticity(),
      springStiffness: this.getSpringStiffness(),
      damping: this.getDamping(),
      surfaceTension: this.getSurfaceTension(),
      cohesionStrength: this.getCohesionStrength(),
      particleSize: this.getParticleSize()
    };
  }
  
  /**
   * Get blob configuration based on liquid thickness
   * @returns {Object} Blob-specific configuration
   */
  getBlobConfig() {
    const thickness = this.config.liquidThickness;
    
    return {
      minBlobSize: Math.round(this.lerp(5, 12, thickness)),    // Thick = larger min blobs
      maxBlobSize: Math.round(this.lerp(12, 20, thickness)),   // Thick = larger max blobs
      colorThreshold: this.lerp(0.25, 0.15, thickness),        // Thick = tighter color grouping
      enableElastic: true,
      springStiffness: this.getSpringStiffness(),
      damping: this.getDamping(),
      surfaceTension: this.getSurfaceTension(),
      pressureStrength: this.lerp(0.1, 0.3, thickness)         // Thick = more pressure
    };
  }
  
  /**
   * Get ferrofluid physics configuration based on liquid thickness
   * @returns {Object} Ferrofluid physics configuration
   */
  getFerrofluidConfig() {
    const thickness = this.config.liquidThickness;
    
    return {
      cohesionRadius: this.lerp(40, 60, thickness),           // Thick = larger cohesion radius
      cohesionStrength: this.getCohesionStrength(),
      surfaceTension: this.getSurfaceTension(),
      attractionStrength: this.lerp(0.2, 0.4, thickness),     // Thick = stronger attraction
      repulsionDistance: this.lerp(4, 2, thickness),          // Thick = tighter packing
      repulsionStrength: this.lerp(0.25, 0.15, thickness),    // Thick = less repulsion
      enableElastic: true,
      springStiffness: this.getSpringStiffness(),
      damping: this.getDamping(),
      elasticSurfaceTension: this.getSurfaceTension(),
      pressureStrength: this.lerp(0.15, 0.3, thickness)       // Thick = more volume preservation
    };
  }
  
  /**
   * Linear interpolation helper
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Get a descriptive label for current thickness
   * @returns {string} Human-readable thickness description
   */
  getThicknessLabel() {
    const thickness = this.config.liquidThickness;
    
    if (thickness < 0.2) return 'Very Thin (Water-like)';
    if (thickness < 0.4) return 'Thin (Light Oil)';
    if (thickness < 0.6) return 'Medium (Syrup)';
    if (thickness < 0.8) return 'Thick (Honey)';
    return 'Very Thick (Molasses)';
  }
}
