/**
 * School of Fish Animation Preset
 * Implements explosion, swarming (flocking), and reformation behaviors
 */
import { Preset } from './Preset.js';

export class SchoolOfFishPreset extends Preset {
  constructor(config = {}) {
    super(
      'School of Fish',
      'Particles explode, swarm with flocking behavior, and reform into shapes',
      {
        // Explosion parameters
        explosionRadius: config.explosionRadius || 300,
        explosionDuration: config.explosionDuration || 1000,
        
        // Swarming parameters
        swarmDuration: config.swarmDuration || 3000,
        alignmentStrength: config.alignmentStrength || 0.05,
        cohesionStrength: config.cohesionStrength || 0.02,
        separationStrength: config.separationStrength || 0.08,
        separationDistance: config.separationDistance || 30,
        neighborDistance: config.neighborDistance || 100,
        maxSpeed: config.maxSpeed || 200,
        swarmRandomness: config.swarmRandomness || 0.5,
        
        // Reformation parameters
        reformationDuration: config.reformationDuration || 2000,
        reformationEasing: config.reformationEasing || 'easeInOutCubic',
        
        ...config
      }
    );

    this.phase = 'idle'; // idle, explosion, swarming, reformation
    this.phaseStartTime = 0;
    this.targets = null;
    this.originalPositions = [];
  }

  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    // Store original positions
    this.originalPositions = particles.map(p => ({
      x: p.x,
      y: p.y
    }));

    // Start explosion phase
    this.startExplosion(particles, dimensions);
  }

  /**
   * Phase 1: Explosion - particles scatter outward
   */
  startExplosion(particles, dimensions) {
    console.log(`[SchoolOfFish] Starting explosion phase (${this.config.explosionDuration}ms)`);
    this.phase = 'explosion';
    this.phaseStartTime = Date.now();

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    particles.forEach(particle => {
      // Random explosion direction
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 0.5) * this.config.explosionRadius;
      
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      
      // Store explosion target
      particle.explosionTargetX = particle.x + particle.vx;
      particle.explosionTargetY = particle.y + particle.vy;
    });
  }

  /**
   * Phase 2: Swarming - flocking behavior
   */
  startSwarming(particles, dimensions) {
    console.log(`[SchoolOfFish] Starting swarming phase (${this.config.swarmDuration}ms)`);
    this.phase = 'swarming';
    this.phaseStartTime = Date.now();

    // Initialize velocities if not set
    particles.forEach(particle => {
      if (!particle.vx && !particle.vy) {
        const angle = Math.random() * Math.PI * 2;
        particle.vx = Math.cos(angle) * 50;
        particle.vy = Math.sin(angle) * 50;
      }
    });
  }

  /**
   * Phase 3: Reformation - transition to target shape/image
   */
  startReformation(particles, targets) {
    console.log(`[SchoolOfFish] Starting reformation phase (${this.config.reformationDuration}ms)`);
    this.phase = 'reformation';
    this.phaseStartTime = Date.now();

    if (targets && targets.length > 0) {
      this.targets = targets;
      
      // Assign targets to particles
      particles.forEach((particle, i) => {
        if (i < targets.length) {
          particle.targetX = targets[i].x;
          particle.targetY = targets[i].y;
          particle.targetR = targets[i].r;
          particle.targetG = targets[i].g;
          particle.targetB = targets[i].b;
        } else {
          // Reuse targets for extra particles
          const targetIndex = i % targets.length;
          const target = targets[targetIndex];
          particle.targetX = target.x + (Math.random() - 0.5) * 5;
          particle.targetY = target.y + (Math.random() - 0.5) * 5;
          particle.targetR = target.r;
          particle.targetG = target.g;
          particle.targetB = target.b;
        }
      });
    }
  }

  update(particles, deltaTime, dimensions) {
    const elapsedTime = Date.now() - this.phaseStartTime;

    switch (this.phase) {
      case 'explosion':
        this.updateExplosion(particles, deltaTime, dimensions, elapsedTime);
        break;
      case 'swarming':
        this.updateSwarming(particles, deltaTime, dimensions, elapsedTime);
        break;
      case 'reformation':
        this.updateReformation(particles, deltaTime, dimensions, elapsedTime);
        break;
    }
  }

  updateExplosion(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.explosionDuration, 1);
    const easedProgress = this.easeOutQuad(progress);

    particles.forEach(particle => {
      // Move towards explosion target
      particle.x += particle.vx * deltaTime * (1 - easedProgress * 0.8);
      particle.y += particle.vy * deltaTime * (1 - easedProgress * 0.8);

      // Wrap around edges
      particle.x = (particle.x + dimensions.width) % dimensions.width;
      particle.y = (particle.y + dimensions.height) % dimensions.height;
    });

    // Check if explosion phase is complete
    if (progress >= 1) {
      this.startSwarming(particles, dimensions);
    }
  }

  updateSwarming(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.swarmDuration, 1);

    // Apply flocking behavior
    particles.forEach((particle, i) => {
      const neighbors = this.findNeighbors(particle, particles, this.config.neighborDistance);

      if (neighbors.length > 0) {
        // Calculate flocking forces
        const alignment = this.calculateAlignment(particle, neighbors);
        const cohesion = this.calculateCohesion(particle, neighbors);
        const separation = this.calculateSeparation(particle, neighbors);

        // Apply forces
        particle.vx += alignment.x * this.config.alignmentStrength * deltaTime * 60;
        particle.vy += alignment.y * this.config.alignmentStrength * deltaTime * 60;
        
        particle.vx += cohesion.x * this.config.cohesionStrength * deltaTime * 60;
        particle.vy += cohesion.y * this.config.cohesionStrength * deltaTime * 60;
        
        particle.vx += separation.x * this.config.separationStrength * deltaTime * 60;
        particle.vy += separation.y * this.config.separationStrength * deltaTime * 60;
      }

      // Add some randomness
      particle.vx += (Math.random() - 0.5) * this.config.swarmRandomness * deltaTime * 60;
      particle.vy += (Math.random() - 0.5) * this.config.swarmRandomness * deltaTime * 60;

      // Limit speed
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > this.config.maxSpeed) {
        particle.vx = (particle.vx / speed) * this.config.maxSpeed;
        particle.vy = (particle.vy / speed) * this.config.maxSpeed;
      }

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Wrap around edges
      particle.x = (particle.x + dimensions.width) % dimensions.width;
      particle.y = (particle.y + dimensions.height) % dimensions.height;
    });

    // Check if swarming phase is complete
    if (progress >= 1 && this.targets) {
      this.startReformation(particles, this.targets);
    }
  }

  updateReformation(particles, deltaTime, dimensions, elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.reformationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);

    particles.forEach(particle => {
      if (particle.targetX !== undefined && particle.targetY !== undefined) {
        // Interpolate to target position
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        
        particle.x += dx * easedProgress * 0.1;
        particle.y += dy * easedProgress * 0.1;

        // Interpolate colors
        if (particle.targetR !== undefined) {
          particle.r += (particle.targetR - particle.r) * easedProgress * 0.1;
          particle.g += (particle.targetG - particle.g) * easedProgress * 0.1;
          particle.b += (particle.targetB - particle.b) * easedProgress * 0.1;
        }

        // Slow down velocities
        particle.vx *= 0.95;
        particle.vy *= 0.95;
      }
    });

    // Check if reformation is complete
    if (progress >= 1) {
      console.log('[SchoolOfFish] Reformation complete');
      this.phase = 'idle';
    }
  }

  /**
   * Flocking Algorithm: Find neighbors within a certain distance
   */
  findNeighbors(particle, particles, distance) {
    const neighbors = [];
    const distanceSquared = distance * distance;

    for (let other of particles) {
      if (other === particle) continue;

      const dx = other.x - particle.x;
      const dy = other.y - particle.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < distanceSquared) {
        neighbors.push(other);
      }
    }

    return neighbors;
  }

  /**
   * Flocking Algorithm: Alignment - steer towards average heading of neighbors
   */
  calculateAlignment(particle, neighbors) {
    let avgVx = 0;
    let avgVy = 0;

    neighbors.forEach(neighbor => {
      avgVx += neighbor.vx || 0;
      avgVy += neighbor.vy || 0;
    });

    if (neighbors.length > 0) {
      avgVx /= neighbors.length;
      avgVy /= neighbors.length;

      // Return steering force
      return {
        x: avgVx - (particle.vx || 0),
        y: avgVy - (particle.vy || 0)
      };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Flocking Algorithm: Cohesion - steer towards average position of neighbors
   */
  calculateCohesion(particle, neighbors) {
    let avgX = 0;
    let avgY = 0;

    neighbors.forEach(neighbor => {
      avgX += neighbor.x;
      avgY += neighbor.y;
    });

    if (neighbors.length > 0) {
      avgX /= neighbors.length;
      avgY /= neighbors.length;

      // Return steering force towards center
      return {
        x: avgX - particle.x,
        y: avgY - particle.y
      };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Flocking Algorithm: Separation - steer away from neighbors that are too close
   */
  calculateSeparation(particle, neighbors) {
    let steerX = 0;
    let steerY = 0;
    const separationDistSquared = this.config.separationDistance * this.config.separationDistance;

    neighbors.forEach(neighbor => {
      const dx = particle.x - neighbor.x;
      const dy = particle.y - neighbor.y;
      const distSquared = dx * dx + dy * dy;

      if (distSquared < separationDistSquared && distSquared > 0) {
        // Steer away, stronger when closer
        const dist = Math.sqrt(distSquared);
        steerX += dx / dist;
        steerY += dy / dist;
      }
    });

    return { x: steerX, y: steerY };
  }

  /**
   * Transition to a target shape or image
   */
  transitionTo(particles, targets, duration = 2000) {
    this.targets = targets;
    this.config.reformationDuration = duration;
    
    // If currently in explosion or swarming, transition immediately
    if (this.phase === 'explosion' || this.phase === 'swarming') {
      this.startReformation(particles, targets);
    } else if (this.phase === 'idle') {
      // Start from explosion again
      this.startExplosion(particles, { width: 0, height: 0 });
    }
  }

  // Easing functions
  easeOutQuad(t) {
    return t * (2 - t);
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  deactivate() {
    super.deactivate();
    this.phase = 'idle';
    this.targets = null;
    this.originalPositions = [];
  }
}
