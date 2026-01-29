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
    
    // Elastic physics properties
    this.restLengths = [];           // Rest distances between adjacent particles
    this.restArea = 0;               // Target area for volume preservation
    this.springStiffness = config.springStiffness || 0.5;      // Spring force strength
    this.damping = config.damping || 0.92;                     // Velocity damping
    this.surfaceTension = config.surfaceTension || 0.3;        // Surface tension strength
    this.pressureStrength = config.pressureStrength || 0.2;    // Volume preservation strength
    this.enableElastic = config.enableElastic !== false;       // Enable elastic physics
    
    // Calculate initial center and radius
    if (this.outlineParticles.length > 0) {
      this.updateBounds();
      this.initializeElasticProperties();
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
    if (this.enableElastic) {
      // Apply elastic physics
      this.applyElasticForces(deltaTime);
    }
    
    for (const particle of this.outlineParticles) {
      // Update particle physics
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Apply damping
      if (this.enableElastic) {
        particle.vx *= this.damping;
        particle.vy *= this.damping;
      }
      
      // Update particle colors to match blob color
      particle.r = this.r;
      particle.g = this.g;
      particle.b = this.b;
    }
    
    // Recalculate bounds
    this.updateBounds();
  }
  
  /**
   * Initialize elastic properties (rest lengths, rest area)
   */
  initializeElasticProperties() {
    const n = this.outlineParticles.length;
    if (n < 3) return;
    
    // Calculate rest lengths between adjacent particles
    this.restLengths = [];
    for (let i = 0; i < n; i++) {
      const p1 = this.outlineParticles[i];
      const p2 = this.outlineParticles[(i + 1) % n];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      this.restLengths.push(Math.sqrt(dx * dx + dy * dy));
    }
    
    // Calculate rest area using polygon formula
    this.restArea = this.calculateArea();
  }
  
  /**
   * Calculate blob area using shoelace formula
   */
  calculateArea() {
    const n = this.outlineParticles.length;
    if (n < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < n; i++) {
      const p1 = this.outlineParticles[i];
      const p2 = this.outlineParticles[(i + 1) % n];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }
  
  /**
   * Apply elastic forces to outline particles
   */
  applyElasticForces(deltaTime) {
    const n = this.outlineParticles.length;
    if (n < 3) return;
    
    // 1. Spring forces (maintain shape)
    this.applySpringForces();
    
    // 2. Surface tension (minimize perimeter)
    this.applySurfaceTension();
    
    // 3. Volume preservation (maintain area)
    this.applyVolumePressure();
  }
  
  /**
   * Apply spring forces between adjacent outline particles
   */
  applySpringForces() {
    const n = this.outlineParticles.length;
    
    for (let i = 0; i < n; i++) {
      const p1 = this.outlineParticles[i];
      const p2 = this.outlineParticles[(i + 1) % n];
      const restLength = this.restLengths[i];
      
      // Calculate current distance
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength < 0.001) continue; // Avoid division by zero
      
      // Calculate spring force (Hooke's law)
      const displacement = currentLength - restLength;
      const force = this.springStiffness * displacement;
      
      // Apply force to both particles
      const fx = (dx / currentLength) * force;
      const fy = (dy / currentLength) * force;
      
      p1.vx += fx * 0.5;
      p1.vy += fy * 0.5;
      p2.vx -= fx * 0.5;
      p2.vy -= fy * 0.5;
    }
    
    // Add diagonal springs for stability
    for (let i = 0; i < n; i++) {
      const p1 = this.outlineParticles[i];
      const p2 = this.outlineParticles[(i + 2) % n]; // Skip one particle
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength < 0.001) continue;
      
      // Diagonal springs are weaker
      const targetLength = this.radius * 1.5;
      const displacement = currentLength - targetLength;
      const force = this.springStiffness * 0.3 * displacement;
      
      const fx = (dx / currentLength) * force;
      const fy = (dy / currentLength) * force;
      
      p1.vx += fx * 0.5;
      p1.vy += fy * 0.5;
      p2.vx -= fx * 0.5;
      p2.vy -= fy * 0.5;
    }
  }
  
  /**
   * Apply surface tension forces (pull particles toward center)
   */
  applySurfaceTension() {
    const n = this.outlineParticles.length;
    
    for (const particle of this.outlineParticles) {
      // Vector from particle to center
      const dx = this.centerX - particle.x;
      const dy = this.centerY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 0.001) continue;
      
      // Apply inward force proportional to distance
      const force = this.surfaceTension * (distance - this.radius * 0.8) / distance;
      
      particle.vx += dx * force;
      particle.vy += dy * force;
    }
  }
  
  /**
   * Apply volume preservation forces (maintain blob area)
   */
  applyVolumePressure() {
    const currentArea = this.calculateArea();
    if (currentArea < 0.001 || this.restArea < 0.001) return;
    
    // Calculate pressure based on area difference
    const areaDiff = this.restArea - currentArea;
    const pressure = this.pressureStrength * areaDiff / this.restArea;
    
    const n = this.outlineParticles.length;
    
    // Apply outward/inward pressure forces
    for (let i = 0; i < n; i++) {
      const particle = this.outlineParticles[i];
      
      // Calculate normal vector (perpendicular to edge)
      const prev = this.outlineParticles[(i - 1 + n) % n];
      const next = this.outlineParticles[(i + 1) % n];
      
      // Edge vectors
      const dx1 = particle.x - prev.x;
      const dy1 = particle.y - prev.y;
      const dx2 = next.x - particle.x;
      const dy2 = next.y - particle.y;
      
      // Average normal (perpendicular to edges)
      const nx = -(dy1 + dy2) / 2;
      const ny = (dx1 + dx2) / 2;
      const normalLength = Math.sqrt(nx * nx + ny * ny);
      
      if (normalLength < 0.001) continue;
      
      // Apply pressure force along normal
      const forceMagnitude = pressure * 50; // Scale factor
      particle.vx += (nx / normalLength) * forceMagnitude;
      particle.vy += (ny / normalLength) * forceMagnitude;
    }
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
