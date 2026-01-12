/**
 * Grid Pattern Generator
 * Creates particles arranged in a uniform grid formation
 */
export class GridPattern {
  /**
   * Generate grid pattern positions
   * @param {number} particleCount - Number of particles
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Array} Array of particle positions and colors
   */
  static generate(particleCount, width, height) {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(particleCount));
    const rows = Math.ceil(particleCount / cols);
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);
    
    for (let i = 0; i < particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spacingX * (col + 1);
      const y = spacingY * (row + 1);
      
      positions.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        r: 0.3 + (col / cols) * 0.7,
        g: 0.5,
        b: 0.8 - (row / rows) * 0.5
      });
    }
    
    return positions;
  }
}
