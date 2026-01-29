/**
 * FerrofluidPhysics - Simulates ferrofluid-inspired particle dynamics
 * 
 * Key Features:
 * - Particle cohesion: nearby particles attract each other
 * - Surface tension: particles form blob-like clusters
 * - Attraction/repulsion: dynamic clustering behavior
 * - Performance-optimized spatial hashing for neighbor detection
 */
export class FerrofluidPhysics {
  constructor(config = {}) {
    this.config = {
      // Cohesion parameters - enhanced for thick liquid behavior
      cohesionRadius: config.cohesionRadius || 50,      // Increased from 30 for longer-range attraction
      cohesionStrength: config.cohesionStrength || 0.2,  // Increased from 0.1 for stronger clustering
      
      // Surface tension parameters - enhanced for blob formation
      surfaceTension: config.surfaceTension || 0.25,     // Increased from 0.15 for better blob cohesion
      
      // Attraction/repulsion parameters
      attractionStrength: config.attractionStrength || 0.3,  // Increased from 0.2
      repulsionDistance: config.repulsionDistance || 3,   // Decreased from 5 so particles pack closer
      repulsionStrength: config.repulsionStrength || 0.2,  // Decreased from 0.3 to allow tighter packing
      
      // Elastic physics parameters (water-in-space behavior)
      enableElastic: config.enableElastic !== false,    // Enable elastic blob physics
      springStiffness: config.springStiffness || 0.5,   // Spring force strength (0-2)
      damping: config.damping || 0.92,                  // Velocity damping (0.5-0.99)
      elasticSurfaceTension: config.elasticSurfaceTension || 0.3, // Elastic surface tension (0-1)
      pressureStrength: config.pressureStrength || 0.2,  // Volume preservation (0-1)
      
      // Performance optimization
      enableSpatialHashing: config.enableSpatialHashing !== false,
      cellSize: config.cellSize || 60,                   // Increased from 50 to match larger cohesion radius
      
      // Phase-specific settings
      enableDuringExplosion: config.enableDuringExplosion !== false,
      enableDuringRecombination: config.enableDuringRecombination !== false,
      
      ...config
    };
    
    // Spatial hash grid for efficient neighbor detection
    this.spatialHash = new Map();
    this.gridCellSize = this.config.cellSize;
    
    console.log('[FerrofluidPhysics] Initialized with config:', this.config);
  }
  
  /**
   * Build spatial hash grid for efficient neighbor queries
   * @param {Array} particles - Array of particles
   * @param {Object} dimensions - Canvas dimensions {width, height}
   */
  buildSpatialHash(particles, dimensions) {
    this.spatialHash.clear();
    
    particles.forEach((particle, index) => {
      const cellX = Math.floor(particle.x / this.gridCellSize);
      const cellY = Math.floor(particle.y / this.gridCellSize);
      const key = `${cellX},${cellY}`;
      
      if (!this.spatialHash.has(key)) {
        this.spatialHash.set(key, []);
      }
      this.spatialHash.get(key).push(index);
    });
  }
  
  /**
   * Get neighboring particles within cohesion radius
   * @param {Object} particle - Target particle
   * @param {Array} particles - All particles
   * @returns {Array} - Indices of neighboring particles
   */
  getNeighbors(particle, particles) {
    if (!this.config.enableSpatialHashing) {
      // Brute force approach (fallback)
      const neighbors = [];
      const radiusSq = this.config.cohesionRadius * this.config.cohesionRadius;
      
      for (let i = 0; i < particles.length; i++) {
        const other = particles[i];
        if (other === particle) continue;
        
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radiusSq) {
          neighbors.push(i);
        }
      }
      return neighbors;
    }
    
    // Spatial hashing approach (optimized)
    const cellX = Math.floor(particle.x / this.gridCellSize);
    const cellY = Math.floor(particle.y / this.gridCellSize);
    const neighbors = [];
    const radiusSq = this.config.cohesionRadius * this.config.cohesionRadius;
    
    // Check 9 neighboring cells (3x3 grid around particle)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cellParticles = this.spatialHash.get(key);
        
        if (cellParticles) {
          for (const idx of cellParticles) {
            const other = particles[idx];
            if (other === particle) continue;
            
            const deltaX = other.x - particle.x;
            const deltaY = other.y - particle.y;
            const distSq = deltaX * deltaX + deltaY * deltaY;
            
            if (distSq < radiusSq) {
              neighbors.push(idx);
            }
          }
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * Apply cohesion force between particles
   * Particles attract each other to form blob-like clusters
   * @param {Array} particles - Array of particles
   * @param {number} deltaTime - Time delta for physics calculation
   */
  applyCohesion(particles, deltaTime) {
    const cohesionStrength = this.config.cohesionStrength * deltaTime;
    const surfaceTension = this.config.surfaceTension * deltaTime;
    
    particles.forEach((particle, i) => {
      const neighbors = this.getNeighbors(particle, particles);
      
      if (neighbors.length === 0) return;
      
      // Calculate average position of neighbors (center of mass)
      let avgX = 0;
      let avgY = 0;
      
      neighbors.forEach(idx => {
        const neighbor = particles[idx];
        avgX += neighbor.x;
        avgY += neighbor.y;
      });
      
      avgX /= neighbors.length;
      avgY /= neighbors.length;
      
      // Apply cohesion force toward center of mass
      const dx = avgX - particle.x;
      const dy = avgY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.1) {
        const force = cohesionStrength * (distance / this.config.cohesionRadius);
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
      
      // Apply surface tension (strengthens blob formation)
      const tensionForce = surfaceTension * neighbors.length / 10;
      particle.vx += (dx / (distance + 1)) * tensionForce;
      particle.vy += (dy / (distance + 1)) * tensionForce;
    });
  }
  
  /**
   * Apply attraction/repulsion forces between particles
   * Creates dynamic ferrofluid behavior
   * @param {Array} particles - Array of particles
   * @param {number} deltaTime - Time delta for physics calculation
   */
  applyAttractionRepulsion(particles, deltaTime) {
    const attractionStr = this.config.attractionStrength * deltaTime;
    const repulsionStr = this.config.repulsionStrength * deltaTime;
    const repulsionDistSq = this.config.repulsionDistance * this.config.repulsionDistance;
    
    particles.forEach((particle, i) => {
      const neighbors = this.getNeighbors(particle, particles);
      
      neighbors.forEach(idx => {
        const neighbor = particles[idx];
        
        const dx = neighbor.x - particle.x;
        const dy = neighbor.y - particle.y;
        const distSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distSq);
        
        if (distance < 0.1) return; // Avoid division by zero
        
        // Repulsion at very close distances
        if (distSq < repulsionDistSq) {
          const force = repulsionStr * (1 - distance / this.config.repulsionDistance);
          particle.vx -= (dx / distance) * force;
          particle.vy -= (dy / distance) * force;
        } 
        // Attraction at medium distances
        else {
          const force = attractionStr * (distance / this.config.cohesionRadius);
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      });
    });
  }
  
  /**
   * Apply elastic spring forces between nearby particles
   * Creates water-in-space elastic behavior
   * @param {Array} particles - Array of particles
   * @param {number} deltaTime - Time delta for physics calculation
   */
  applyElasticForces(particles, deltaTime) {
    if (!this.config.enableElastic) return;
    
    const springStiffness = this.config.springStiffness * deltaTime;
    const damping = this.config.damping;
    const elasticTension = this.config.elasticSurfaceTension * deltaTime;
    
    particles.forEach((particle, i) => {
      const neighbors = this.getNeighbors(particle, particles);
      
      if (neighbors.length === 0) return;
      
      // Calculate center of local cluster
      let centerX = 0;
      let centerY = 0;
      neighbors.forEach(idx => {
        const neighbor = particles[idx];
        centerX += neighbor.x;
        centerY += neighbor.y;
      });
      centerX /= neighbors.length;
      centerY /= neighbors.length;
      
      // Apply spring forces to maintain relative positions
      neighbors.forEach(idx => {
        const neighbor = particles[idx];
        const dx = neighbor.x - particle.x;
        const dy = neighbor.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1 || distance > this.config.cohesionRadius) return;
        
        // Spring force (Hooke's law approximation)
        // Tries to maintain ideal distance between particles
        const idealDistance = this.config.cohesionRadius * 0.4; // Target spacing
        const displacement = distance - idealDistance;
        const force = springStiffness * displacement * 0.5;
        
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      });
      
      // Elastic surface tension - pull toward local center
      const dx = centerX - particle.x;
      const dy = centerY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.1) {
        const force = elasticTension * (distance / this.config.cohesionRadius);
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
      
      // Apply velocity damping for realistic motion
      particle.vx *= damping;
      particle.vy *= damping;
    });
  }
  
  /**
   * Apply volume preservation forces
   * Simulates incompressible fluid behavior
   * @param {Array} particles - Array of particles
   * @param {number} deltaTime - Time delta for physics calculation
   */
  applyVolumePressure(particles, deltaTime) {
    if (!this.config.enableElastic || !this.config.pressureStrength) return;
    
    const pressureStr = this.config.pressureStrength * deltaTime;
    
    particles.forEach((particle, i) => {
      const neighbors = this.getNeighbors(particle, particles);
      
      if (neighbors.length === 0) return;
      
      // Calculate local density (number of neighbors)
      const density = neighbors.length;
      const idealDensity = 8; // Target number of neighbors for proper spacing
      
      // Pressure based on density difference
      const densityDiff = density - idealDensity;
      
      if (Math.abs(densityDiff) < 0.1) return;
      
      // Apply pressure forces
      // If too dense (densityDiff > 0), push outward
      // If too sparse (densityDiff < 0), pull inward
      neighbors.forEach(idx => {
        const neighbor = particles[idx];
        const dx = neighbor.x - particle.x;
        const dy = neighbor.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) return;
        
        // Push away if too dense, pull together if too sparse
        const force = -pressureStr * densityDiff * 0.1;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      });
    });
  }
  
  /**
   * Apply all ferrofluid physics forces
   * @param {Array} particles - Array of particles
   * @param {number} deltaTime - Time delta for physics calculation
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {string} phase - Current transition phase ('explosion', 'recombination', etc.)
   */
  update(particles, deltaTime, dimensions, phase = 'idle') {
    // Check if ferrofluid physics should be applied for this phase
    if (phase === 'explosion' && !this.config.enableDuringExplosion) {
      return;
    }
    if (phase === 'recombination' && !this.config.enableDuringRecombination) {
      return;
    }
    
    // Build spatial hash for efficient neighbor queries
    if (this.config.enableSpatialHashing) {
      this.buildSpatialHash(particles, dimensions);
    }
    
    // Apply ferrofluid forces
    this.applyCohesion(particles, deltaTime);
    this.applyAttractionRepulsion(particles, deltaTime);
    
    // Apply elastic forces if enabled
    if (this.config.enableElastic) {
      this.applyElasticForces(particles, deltaTime);
      this.applyVolumePressure(particles, deltaTime);
    }
  }
  
  /**
   * Update configuration dynamically
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.gridCellSize = this.config.cellSize;
    console.log('[FerrofluidPhysics] Configuration updated:', this.config);
  }
  
  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
