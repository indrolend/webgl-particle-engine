/**
 * Particle Class
 * Represents an individual particle with its properties and state
 */
export class Particle {
  constructor(x, y, vx, vy, options = {}) {
    // Position
    this.x = x;
    this.y = y;
    
    // Velocity
    this.vx = vx || 0;
    this.vy = vy || 0;
    
    // Color (RGB values 0-1)
    this.r = options.r !== undefined ? options.r : Math.random();
    this.g = options.g !== undefined ? options.g : Math.random();
    this.b = options.b !== undefined ? options.b : Math.random();
    this.alpha = options.alpha !== undefined ? options.alpha : 1.0;
    
    // Size
    this.size = options.size || 4;
    
    // Life (for particle effects)
    this.life = options.life !== undefined ? options.life : 1.0;
    
    // Target properties for transitions
    this.targetX = x;
    this.targetY = y;
    this.targetR = this.r;
    this.targetG = this.g;
    this.targetB = this.b;
  }

  /**
   * Set target position for transitions
   */
  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Set target color for transitions
   */
  setTargetColor(r, g, b) {
    this.targetR = r;
    this.targetG = g;
    this.targetB = b;
  }

  /**
   * Update particle position
   */
  updatePosition(deltaTime, speed) {
    this.x += this.vx * deltaTime * speed;
    this.y += this.vy * deltaTime * speed;
  }

  /**
   * Interpolate towards target position and color
   */
  interpolate(factor) {
    this.x = this.x + (this.targetX - this.x) * factor;
    this.y = this.y + (this.targetY - this.y) * factor;
    this.r = this.r + (this.targetR - this.r) * factor;
    this.g = this.g + (this.targetG - this.g) * factor;
    this.b = this.b + (this.targetB - this.b) * factor;
  }

  /**
   * Bounce off edges
   */
  bounceOffEdges(width, height) {
    if (this.x < 0 || this.x > width) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(width, this.x));
    }
    if (this.y < 0 || this.y > height) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(height, this.y));
    }
  }
}
