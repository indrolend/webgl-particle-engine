/**
 * BlobSystem - Manages multiple colored blobs with outline particles
 * 
 * Key Features:
 * - Creates blobs from particles using color-based clustering
 * - Each blob has 10-15 outline particles
 * - Handles blob transitions and color changes
 * - Maintains single-color blobs
 */
import { Blob } from './Blob.js';

export class BlobSystem {
  constructor(config = {}) {
    this.blobs = [];
    this.config = {
      minBlobSize: config.minBlobSize || 8,          // Min particles per blob
      maxBlobSize: config.maxBlobSize || 15,         // Max particles per blob
      colorThreshold: config.colorThreshold || 0.2,  // Color similarity threshold
      targetBlobCount: config.targetBlobCount || 50  // Approximate number of blobs
    };
    
    console.log('[BlobSystem] Initialized with config:', this.config);
  }
  
  /**
   * Create blobs from a set of particles using color-based clustering
   */
  createBlobsFromParticles(particles) {
    console.log(`[BlobSystem] Creating blobs from ${particles.length} particles...`);
    
    this.blobs = [];
    
    if (particles.length === 0) return;
    
    // Use k-means clustering based on color and position
    const clusters = this.clusterParticlesByColor(particles);
    
    // Create blobs from clusters
    for (const cluster of clusters) {
      if (cluster.length < 3) continue; // Need at least 3 particles for a blob
      
      // Calculate average color for the blob
      let avgR = 0, avgG = 0, avgB = 0;
      for (const particle of cluster) {
        avgR += particle.r;
        avgG += particle.g;
        avgB += particle.b;
      }
      avgR /= cluster.length;
      avgG /= cluster.length;
      avgB /= cluster.length;
      
      // Select outline particles (evenly distributed around the cluster)
      const outlineParticles = this.selectOutlineParticles(cluster);
      
      // Create blob
      const blob = new Blob({
        r: avgR,
        g: avgG,
        b: avgB,
        outlineParticles: outlineParticles
      });
      
      this.blobs.push(blob);
    }
    
    console.log(`[BlobSystem] Created ${this.blobs.length} blobs`);
  }
  
  /**
   * Cluster particles by color similarity and spatial proximity
   */
  clusterParticlesByColor(particles) {
    const clusters = [];
    const assigned = new Set();
    
    // Sort particles by position for spatial coherence
    const sortedParticles = [...particles].sort((a, b) => {
      return (a.y * 10000 + a.x) - (b.y * 10000 + b.x);
    });
    
    for (const particle of sortedParticles) {
      if (assigned.has(particle)) continue;
      
      // Start a new cluster
      const cluster = [particle];
      assigned.add(particle);
      
      // Find nearby particles with similar colors
      for (const other of sortedParticles) {
        if (assigned.has(other)) continue;
        if (cluster.length >= this.config.maxBlobSize) break;
        
        // Check color similarity
        const colorDist = this.colorDistance(particle, other);
        if (colorDist > this.config.colorThreshold) continue;
        
        // Check spatial proximity
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const spatialDist = Math.sqrt(dx * dx + dy * dy);
        if (spatialDist > 100) continue; // Max distance threshold
        
        cluster.push(other);
        assigned.add(other);
      }
      
      if (cluster.length >= this.config.minBlobSize) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }
  
  /**
   * Calculate color distance between two particles
   */
  colorDistance(p1, p2) {
    const dr = p1.r - p2.r;
    const dg = p1.g - p2.g;
    const db = p1.b - p2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  
  /**
   * Select outline particles from a cluster
   * Chooses particles that best represent the boundary
   */
  selectOutlineParticles(cluster) {
    if (cluster.length <= this.config.maxBlobSize) {
      return cluster; // Use all particles if small enough
    }
    
    // Calculate cluster center
    let centerX = 0, centerY = 0;
    for (const p of cluster) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= cluster.length;
    centerY /= cluster.length;
    
    // Sort particles by angle from center
    const sorted = [...cluster].sort((a, b) => {
      const angleA = Math.atan2(a.y - centerY, a.x - centerX);
      const angleB = Math.atan2(b.y - centerY, b.x - centerX);
      return angleA - angleB;
    });
    
    // Select evenly spaced particles around the perimeter
    const outlineCount = Math.min(this.config.maxBlobSize, cluster.length);
    const step = sorted.length / outlineCount;
    const outline = [];
    
    for (let i = 0; i < outlineCount; i++) {
      const index = Math.floor(i * step);
      outline.push(sorted[index]);
    }
    
    return outline;
  }
  
  /**
   * Update all blobs
   */
  update(deltaTime) {
    for (const blob of this.blobs) {
      blob.updateOutlineParticles(deltaTime);
      blob.updateColor(deltaTime);
    }
  }
  
  /**
   * Get all triangles for rendering filled blobs
   */
  getAllTriangles() {
    const allTriangles = [];
    
    for (const blob of this.blobs) {
      const triangles = blob.getTriangles();
      allTriangles.push(...triangles);
    }
    
    return allTriangles;
  }
  
  /**
   * Get all outline particles for rendering
   */
  getAllOutlineParticles() {
    const allParticles = [];
    
    for (const blob of this.blobs) {
      allParticles.push(...blob.outlineParticles);
    }
    
    return allParticles;
  }
  
  /**
   * Transition blobs to new colors (for image transitions)
   */
  transitionBlobColors(targetColors) {
    // Assign each blob a target color from the palette
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      const targetColor = targetColors[i % targetColors.length];
      blob.setTargetColor(targetColor.r, targetColor.g, targetColor.b);
    }
  }
  
  /**
   * Get number of blobs
   */
  getBlobCount() {
    return this.blobs.length;
  }
}
