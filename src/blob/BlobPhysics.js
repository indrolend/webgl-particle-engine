/**
 * BlobPhysics - Physics simulation for organic blob behavior
 * 
 * Implements:
 * - Surface tension forces (attraction between nearby particles)
 * - Cohesion forces (keep blob particles together)
 * - Elasticity (blob deformation and recovery)
 * - Blob splitting detection and management
 * - Blob merging logic
 */

export class BlobPhysics {
  constructor(config = {}) {
    this.config = {
      // Surface tension parameters
      surfaceTension: config.surfaceTension || 0.5,     // Strength of attraction (0-1)
      tensionRadius: config.tensionRadius || 100,        // Distance for tension effect
      
      // Cohesion parameters
      cohesionStrength: config.cohesionStrength || 0.3,  // Pull toward blob center (0-1)
      cohesionRadius: config.cohesionRadius || 120,      // Max distance for cohesion
      
      // Elasticity parameters
      elasticity: config.elasticity || 0.7,              // Bounce/recovery (0-1)
      damping: config.damping || 0.95,                   // Velocity damping (0-1)
      
      // Splitting/merging thresholds
      splitThreshold: config.splitThreshold || 150,      // Distance to split blob
      mergeThreshold: config.mergeThreshold || 80,       // Distance to merge blobs
      minBlobSize: config.minBlobSize || 3,              // Min particles per blob
      
      // Mitosis-specific
      mitosisFactor: config.mitosisFactor || 0.5,        // Controls splitting tendency (0-1)
      
      ...config
    };
    
    console.log('[BlobPhysics] Initialized with config:', this.config);
  }
  
  /**
   * Apply surface tension forces between nearby particles
   * Creates smooth, organic blob surface
   */
  applySurfaceTension(particles) {
    const radiusSq = this.config.tensionRadius * this.config.tensionRadius;
    const strength = this.config.surfaceTension;
    
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      let forceX = 0;
      let forceY = 0;
      let neighborCount = 0;
      
      // Check all other particles within tension radius
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        
        const p2 = particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radiusSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          
          // Attraction force (inverse square law, like surface tension)
          const force = strength * (1 - dist / this.config.tensionRadius);
          
          forceX += (dx / dist) * force;
          forceY += (dy / dist) * force;
          neighborCount++;
        }
      }
      
      // Apply averaged force
      if (neighborCount > 0) {
        p1.vx += forceX / neighborCount;
        p1.vy += forceY / neighborCount;
      }
    }
  }
  
  /**
   * Apply cohesion forces - pull particles toward blob center
   * Keeps blob together as a unified mass
   */
  applyCohesion(particles) {
    if (particles.length === 0) return;
    
    // Calculate center of mass
    let centerX = 0;
    let centerY = 0;
    
    for (const p of particles) {
      centerX += p.x;
      centerY += p.y;
    }
    
    centerX /= particles.length;
    centerY /= particles.length;
    
    // Apply force toward center
    const strength = this.config.cohesionStrength;
    
    for (const p of particles) {
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < this.config.cohesionRadius * this.config.cohesionRadius) {
        const dist = Math.sqrt(distSq);
        if (dist > 1) {
          // Gentle pull toward center
          const force = strength * (dist / this.config.cohesionRadius);
          p.vx += (dx / dist) * force * 0.1;
          p.vy += (dy / dist) * force * 0.1;
        }
      }
    }
  }
  
  /**
   * Apply elasticity - particles bounce and recover
   */
  applyElasticity(particles, boundaries = null) {
    const elasticity = this.config.elasticity;
    
    for (const p of particles) {
      // Apply damping to velocity
      p.vx *= this.config.damping;
      p.vy *= this.config.damping;
      
      // Boundary collisions with elasticity
      if (boundaries) {
        const { minX, minY, maxX, maxY } = boundaries;
        
        // Left/right boundaries
        if (p.x < minX) {
          p.x = minX;
          p.vx *= -elasticity;
        } else if (p.x > maxX) {
          p.x = maxX;
          p.vx *= -elasticity;
        }
        
        // Top/bottom boundaries
        if (p.y < minY) {
          p.y = minY;
          p.vy *= -elasticity;
        } else if (p.y > maxY) {
          p.y = maxY;
          p.vy *= -elasticity;
        }
      }
    }
  }
  
  /**
   * Update all physics for a particle system
   */
  update(particles, deltaTime = 1.0, boundaries = null) {
    // Apply surface tension to create organic blob shape
    this.applySurfaceTension(particles);
    
    // Apply cohesion to keep blob together
    this.applyCohesion(particles);
    
    // Apply elasticity and damping
    this.applyElasticity(particles, boundaries);
    
    // Update positions based on velocities
    for (const p of particles) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
    }
  }
  
  /**
   * Detect if a blob should split (mitosis)
   * Returns array of particle groups if split should occur
   */
  detectMitosis(particles) {
    if (particles.length < this.config.minBlobSize * 2) {
      return null; // Too small to split
    }
    
    // Calculate blob dispersion (average distance from center)
    let centerX = 0, centerY = 0;
    for (const p of particles) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= particles.length;
    centerY /= particles.length;
    
    let avgDist = 0;
    for (const p of particles) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      avgDist += Math.sqrt(dx * dx + dy * dy);
    }
    avgDist /= particles.length;
    
    // Check if dispersion exceeds split threshold
    const shouldSplit = avgDist > this.config.splitThreshold * this.config.mitosisFactor;
    
    if (!shouldSplit) return null;
    
    // Perform k-means clustering (k=2) to split into two groups
    const clusters = this.clusterParticles(particles, 2);
    
    // Validate cluster sizes
    const validClusters = clusters.filter(c => c.length >= this.config.minBlobSize);
    
    if (validClusters.length < 2) return null;
    
    console.log(`[BlobPhysics] Mitosis detected! Splitting ${particles.length} particles into ${validClusters.length} blobs`);
    
    return validClusters;
  }
  
  /**
   * Simple k-means clustering for blob splitting
   */
  clusterParticles(particles, k) {
    if (particles.length < k) return [particles];
    
    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * particles.length);
      centroids.push({ x: particles[idx].x, y: particles[idx].y });
    }
    
    let assignments = new Array(particles.length);
    
    // Run k-means iterations
    const maxIterations = 10;
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign particles to nearest centroid
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let minDist = Infinity;
        let nearestIdx = 0;
        
        for (let j = 0; j < k; j++) {
          const dx = p.x - centroids[j].x;
          const dy = p.y - centroids[j].y;
          const dist = dx * dx + dy * dy;
          
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = j;
          }
        }
        
        assignments[i] = nearestIdx;
      }
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        let sumX = 0, sumY = 0, count = 0;
        
        for (let j = 0; j < particles.length; j++) {
          if (assignments[j] === i) {
            sumX += particles[j].x;
            sumY += particles[j].y;
            count++;
          }
        }
        
        if (count > 0) {
          centroids[i].x = sumX / count;
          centroids[i].y = sumY / count;
        }
      }
    }
    
    // Group particles by cluster using stored assignments
    const clusters = Array.from({ length: k }, () => []);
    for (let i = 0; i < particles.length; i++) {
      clusters[assignments[i]].push(particles[i]);
    }
    
    return clusters;
  }
  
  /**
   * Check if two blobs should merge
   */
  shouldMergeBlobs(blob1, blob2) {
    if (blob1.length === 0 || blob2.length === 0) return false;
    
    // Calculate centers of both blobs
    const center1 = this.calculateCenter(blob1);
    const center2 = this.calculateCenter(blob2);
    
    // Calculate distance between centers
    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < this.config.mergeThreshold;
  }
  
  /**
   * Calculate center of mass for particles
   */
  calculateCenter(particles) {
    let x = 0, y = 0;
    for (const p of particles) {
      x += p.x;
      y += p.y;
    }
    return {
      x: x / particles.length,
      y: y / particles.length
    };
  }
  
  /**
   * Merge multiple blobs into one
   */
  mergeBlobs(blobs) {
    if (blobs.length <= 1) return blobs;
    
    // Find blobs that should merge
    const merged = [];
    const toMerge = new Set();
    
    for (let i = 0; i < blobs.length; i++) {
      if (toMerge.has(i)) continue;
      
      let currentBlob = [...blobs[i]];
      toMerge.add(i);
      let foundMerge = true;
      
      // Keep looking for blobs to merge with current blob
      while (foundMerge) {
        foundMerge = false;
        
        for (let j = 0; j < blobs.length; j++) {
          if (toMerge.has(j)) continue;
          
          if (this.shouldMergeBlobs(currentBlob, blobs[j])) {
            currentBlob = [...currentBlob, ...blobs[j]];
            toMerge.add(j);
            foundMerge = true;
            console.log(`[BlobPhysics] Merging blobs: ${blobs[i].length} + ${blobs[j].length} particles`);
          }
        }
      }
      
      merged.push(currentBlob);
    }
    
    return merged;
  }
  
  /**
   * Apply blob-specific forces during explosion phase
   * Adds extra separation to encourage splitting
   */
  applyExplosionForces(particles, intensity = 1.0) {
    // Push particles away from center more aggressively
    const center = this.calculateCenter(particles);
    
    for (const p of particles) {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        const force = intensity * this.config.mitosisFactor * 0.5;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }
  }
  
  /**
   * Apply blob-specific forces during recombination
   * Enhanced cohesion for merging effect
   */
  applyRecombinationForces(particles, targetPositions) {
    // Standard cohesion
    this.applyCohesion(particles);
    
    // Additional pull toward target positions
    for (let i = 0; i < particles.length && i < targetPositions.length; i++) {
      const p = particles[i];
      const target = targetPositions[i];
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        const force = 0.05; // Gentle pull toward target
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }
  }
}
