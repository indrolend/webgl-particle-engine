/**
 * Blob - Represents a single-colored blob with outline particles and filled interior
 * 
 * Key Features:
 * - Each blob has 10-15 outline particles forming its boundary
 * - Interior is filled with solid color
 * - Single color per blob (no color mixing within blob)
 * - Supports transitions and morphing
 */
export class Blob {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    
    // Blob color (RGB values 0-1)
    this.r = config.r || 0;
    this.g = config.g || 0;
    this.b = config.b || 0;
    this.alpha = config.alpha !== undefined ? config.alpha : 1.0;
    
    // Outline particles (10-15 particles forming boundary)
    this.outlineParticles = config.outlineParticles || [];
    
    // Blob properties
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 0;
    
    // Target properties for transitions
    this.targetR = this.r;
    this.targetG = this.g;
    this.targetB = this.b;
    
    // Calculate initial center and radius
    if (this.outlineParticles.length > 0) {
      this.updateBounds();
    }
  }
  
  /**
   * Update blob center and radius based on outline particles
   */
  updateBounds() {
    if (this.outlineParticles.length === 0) return;
    
    // Calculate center
    let sumX = 0, sumY = 0;
    for (const particle of this.outlineParticles) {
      sumX += particle.x;
      sumY += particle.y;
    }
    this.centerX = sumX / this.outlineParticles.length;
    this.centerY = sumY / this.outlineParticles.length;
    
    // Calculate average radius
    let sumRadius = 0;
    for (const particle of this.outlineParticles) {
      const dx = particle.x - this.centerX;
      const dy = particle.y - this.centerY;
      sumRadius += Math.sqrt(dx * dx + dy * dy);
    }
    this.radius = sumRadius / this.outlineParticles.length;
  }
  
  /**
   * Add a particle to the blob outline
   */
  addOutlineParticle(particle) {
    this.outlineParticles.push(particle);
    this.updateBounds();
  }
  
  /**
   * Get triangles for rendering the filled interior
   * Uses triangle fan from center
   */
  getTriangles() {
    const triangles = [];
    const n = this.outlineParticles.length;
    
    if (n < 3) return triangles;
    
    // Sort particles by angle from center for proper ordering
    const sortedParticles = [...this.outlineParticles].sort((a, b) => {
      const angleA = Math.atan2(a.y - this.centerY, a.x - this.centerX);
      const angleB = Math.atan2(b.y - this.centerY, b.x - this.centerX);
      return angleA - angleB;
    });
    
    // Create triangle fan from center
    for (let i = 0; i < n; i++) {
      const p1 = sortedParticles[i];
      const p2 = sortedParticles[(i + 1) % n];
      
      triangles.push({
        vertices: [
          this.centerX, this.centerY,  // Center point
          p1.x, p1.y,                   // First outline point
          p2.x, p2.y                    // Second outline point
        ],
        color: [this.r, this.g, this.b, this.alpha]
      });
    }
    
    return triangles;
  }
  
  /**
   * Update blob color (for transitions)
   */
  updateColor(deltaTime, interpolationFactor = 0.1) {
    this.r += (this.targetR - this.r) * interpolationFactor;
    this.g += (this.targetG - this.g) * interpolationFactor;
    this.b += (this.targetB - this.b) * interpolationFactor;
  }
  
  /**
   * Set target color for smooth transitions
   */
  setTargetColor(r, g, b) {
    this.targetR = r;
    this.targetG = g;
    this.targetB = b;
  }
  
  /**
   * Update outline particle positions
   */
  updateOutlineParticles(deltaTime) {
    for (const particle of this.outlineParticles) {
      // Update particle physics
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Update particle colors to match blob color
      particle.r = this.r;
      particle.g = this.g;
      particle.b = this.b;
    }
    
    // Recalculate bounds
    this.updateBounds();
  }
  
  /**
   * Check if a point is inside the blob
   */
  containsPoint(x, y) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius * 1.2; // 20% margin
  }
}
