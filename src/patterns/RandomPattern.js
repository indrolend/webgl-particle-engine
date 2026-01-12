/**
 * Random Pattern Generator
 * Creates particles scattered randomly across the canvas
 */
export class RandomPattern {
  /**
   * Generate random pattern positions
   * @param {number} particleCount - Number of particles
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} speed - Movement speed for random velocities
   * @returns {Array} Array of particle positions and colors
   */
  static generate(particleCount, width, height, speed = 1.0) {
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() - 0.5) * 2 * speed;
      
      positions.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        r: Math.random() * 0.5 + 0.5,
        g: Math.random() * 0.5 + 0.3,
        b: Math.random() * 0.8 + 0.2
      });
    }
    
    return positions;
  }
}
