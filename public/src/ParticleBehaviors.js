/**
 * Particle Behaviors Module
 * Inspired by Proton particle library behaviors
 * Provides various particle behavior modes for complex animations
 */

export class ParticleBehavior {
  constructor(name) {
    this.name = name;
    this.enabled = true;
  }

  /**
   * Apply behavior to a particle
   * @param {Object} particle - Particle to apply behavior to
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Array} allParticles - All particles in the system
   */
  apply(particle, deltaTime, dimensions, allParticles) {
    // Override in subclass
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

/**
 * Attraction Behavior - Particles attract to a center point
 */
export class AttractionBehavior extends ParticleBehavior {
  constructor(centerX, centerY, strength = 50, radius = 200) {
    super('attraction');
    this.centerX = centerX;
    this.centerY = centerY;
    this.strength = strength;
    this.radius = radius;
  }

  apply(particle, deltaTime, dimensions) {
    const dx = this.centerX - particle.x;
    const dy = this.centerY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius && distance > 0) {
      const force = (this.strength * (this.radius - distance)) / this.radius;
      const ax = (dx / distance) * force * deltaTime;
      const ay = (dy / distance) * force * deltaTime;

      particle.vx += ax;
      particle.vy += ay;
    }
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }
}

/**
 * Repulsion Behavior - Particles repel from a center point
 */
export class RepulsionBehavior extends ParticleBehavior {
  constructor(centerX, centerY, strength = 50, radius = 200) {
    super('repulsion');
    this.centerX = centerX;
    this.centerY = centerY;
    this.strength = strength;
    this.radius = radius;
  }

  apply(particle, deltaTime, dimensions) {
    const dx = particle.x - this.centerX;
    const dy = particle.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius && distance > 0) {
      const force = (this.strength * (this.radius - distance)) / this.radius;
      const ax = (dx / distance) * force * deltaTime;
      const ay = (dy / distance) * force * deltaTime;

      particle.vx += ax;
      particle.vy += ay;
    }
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }
}

/**
 * Random Drift Behavior - Adds random movement to particles
 */
export class RandomDriftBehavior extends ParticleBehavior {
  constructor(strength = 10) {
    super('randomDrift');
    this.strength = strength;
  }

  apply(particle, deltaTime) {
    particle.vx += (Math.random() - 0.5) * this.strength * deltaTime;
    particle.vy += (Math.random() - 0.5) * this.strength * deltaTime;
  }
}

/**
 * Rotation Behavior - Rotates particles around a center point
 */
export class RotationBehavior extends ParticleBehavior {
  constructor(centerX, centerY, speed = 1) {
    super('rotation');
    this.centerX = centerX;
    this.centerY = centerY;
    this.speed = speed;
  }

  apply(particle, deltaTime, dimensions) {
    const dx = particle.x - this.centerX;
    const dy = particle.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const angle = Math.atan2(dy, dx);
      const newAngle = angle + (this.speed * deltaTime);
      
      particle.x = this.centerX + Math.cos(newAngle) * distance;
      particle.y = this.centerY + Math.sin(newAngle) * distance;
      
      // Update velocity to match tangential direction
      particle.vx = -Math.sin(newAngle) * distance * this.speed;
      particle.vy = Math.cos(newAngle) * distance * this.speed;
    }
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }
}

/**
 * Cyclone Behavior - Creates spiral/vortex motion
 */
export class CycloneBehavior extends ParticleBehavior {
  constructor(centerX, centerY, strength = 20, radius = 300) {
    super('cyclone');
    this.centerX = centerX;
    this.centerY = centerY;
    this.strength = strength;
    this.radius = radius;
  }

  apply(particle, deltaTime, dimensions) {
    const dx = particle.x - this.centerX;
    const dy = particle.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius && distance > 0) {
      const force = (this.strength * (this.radius - distance)) / this.radius;
      
      // Tangential force (rotation)
      const angle = Math.atan2(dy, dx);
      const tangentialX = -Math.sin(angle) * force * deltaTime;
      const tangentialY = Math.cos(angle) * force * deltaTime;
      
      // Radial force (pull towards center)
      const radialX = -(dx / distance) * force * 0.3 * deltaTime;
      const radialY = -(dy / distance) * force * 0.3 * deltaTime;
      
      particle.vx += tangentialX + radialX;
      particle.vy += tangentialY + radialY;
    }
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }
}

/**
 * Collision Behavior - Particles bounce off boundaries
 */
export class CollisionBehavior extends ParticleBehavior {
  constructor(elasticity = 0.8) {
    super('collision');
    this.elasticity = elasticity; // 0 = no bounce, 1 = perfect bounce
  }

  apply(particle, deltaTime, dimensions) {
    // Left and right boundaries
    if (particle.x < 0) {
      particle.x = 0;
      particle.vx = Math.abs(particle.vx) * this.elasticity;
    } else if (particle.x > dimensions.width) {
      particle.x = dimensions.width;
      particle.vx = -Math.abs(particle.vx) * this.elasticity;
    }

    // Top and bottom boundaries
    if (particle.y < 0) {
      particle.y = 0;
      particle.vy = Math.abs(particle.vy) * this.elasticity;
    } else if (particle.y > dimensions.height) {
      particle.y = dimensions.height;
      particle.vy = -Math.abs(particle.vy) * this.elasticity;
    }
  }
}

/**
 * Color Behavior - Animates particle colors over time
 */
export class ColorBehavior extends ParticleBehavior {
  constructor(colors = null, duration = 2000) {
    super('color');
    this.colors = colors || [
      { r: 1.0, g: 0.0, b: 0.0 },
      { r: 0.0, g: 1.0, b: 0.0 },
      { r: 0.0, g: 0.0, b: 1.0 }
    ];
    this.duration = duration;
    this.time = 0;
  }

  apply(particle, deltaTime) {
    this.time += deltaTime * 1000; // Convert to ms
    const phase = (this.time % this.duration) / this.duration;
    const colorIndex = Math.floor(phase * this.colors.length);
    const nextColorIndex = (colorIndex + 1) % this.colors.length;
    const localPhase = (phase * this.colors.length) % 1;

    const color1 = this.colors[colorIndex];
    const color2 = this.colors[nextColorIndex];

    particle.r = color1.r + (color2.r - color1.r) * localPhase;
    particle.g = color1.g + (color2.g - color1.g) * localPhase;
    particle.b = color1.b + (color2.b - color1.b) * localPhase;
  }
}

/**
 * Behavior Manager - Manages multiple behaviors for particles
 */
export class BehaviorManager {
  constructor() {
    this.behaviors = [];
  }

  addBehavior(behavior) {
    this.behaviors.push(behavior);
    console.log(`[BehaviorManager] Added behavior: ${behavior.name}`);
  }

  removeBehavior(behaviorName) {
    this.behaviors = this.behaviors.filter(b => b.name !== behaviorName);
    console.log(`[BehaviorManager] Removed behavior: ${behaviorName}`);
  }

  clearBehaviors() {
    this.behaviors = [];
    console.log('[BehaviorManager] Cleared all behaviors');
  }

  getBehavior(behaviorName) {
    return this.behaviors.find(b => b.name === behaviorName);
  }

  /**
   * Apply all active behaviors to a particle
   */
  applyBehaviors(particle, deltaTime, dimensions, allParticles) {
    for (const behavior of this.behaviors) {
      if (behavior.enabled) {
        behavior.apply(particle, deltaTime, dimensions, allParticles);
      }
    }
  }

  /**
   * Apply all active behaviors to all particles
   */
  applyToAll(particles, deltaTime, dimensions) {
    for (const particle of particles) {
      this.applyBehaviors(particle, deltaTime, dimensions, particles);
    }
  }
}
