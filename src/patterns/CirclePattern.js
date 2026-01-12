/**
 * Circle Pattern Generator
 * Creates particles arranged in a circular formation
 */
export class CirclePattern {
  /**
   * Generate circle pattern positions
   * @param {number} particleCount - Number of particles
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Array} Array of particle positions and colors
   */
  static generate(particleCount, width, height) {
    const positions = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const hue = i / particleCount;
      positions.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        r: Math.abs(Math.cos(hue * Math.PI * 2)),
        g: Math.abs(Math.sin(hue * Math.PI * 2)),
        b: Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2))
      });
    }
    
    return positions;
  }
}
