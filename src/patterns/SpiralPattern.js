/**
 * Spiral Pattern Generator
 * Creates particles arranged in a spiral formation
 */
export class SpiralPattern {
  /**
   * Generate spiral pattern positions
   * @param {number} particleCount - Number of particles
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Array} Array of particle positions and colors
   */
  static generate(particleCount, width, height) {
    const positions = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 8; // 4 full rotations
      const radius = t * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      positions.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        r: 0.8 - t * 0.4,
        g: 0.4 + t * 0.4,
        b: 0.9
      });
    }
    
    return positions;
  }
}
