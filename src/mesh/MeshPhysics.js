/**
 * MeshPhysics - Physics simulation for elastic mesh
 * 
 * Handles:
 * - Spring forces with configurable stiffness
 * - Damping and elasticity
 * - Spring breaking and reconnection
 * - Overshoot/sloshing for organic feel
 * - Contraction and morphing to target positions
 */

export class MeshPhysics {
  /**
   * Create mesh physics simulator
   * @param {ElasticMesh} mesh - The mesh to simulate
   * @param {Object} config - Physics configuration
   */
  constructor(mesh, config = {}) {
    this.mesh = mesh;
    this.config = {
      springConstant: config.springConstant || 0.3,
      damping: config.damping || 0.95,
      breakThreshold: config.breakThreshold || 300,
      reconnectThreshold: config.reconnectThreshold || 80,
      maxVelocity: config.maxVelocity || 50,
      targetAttractionStrength: config.targetAttractionStrength || 0.1,
      overshootFactor: config.overshootFactor || 0.15,
      ...config
    };

    this.time = 0;
    this.morphing = false;
    this.morphProgress = 0;
    
    console.log('[MeshPhysics] Initialized with config:', this.config);
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Apply spring forces
    this.applySpringForces();
    
    // Apply target attraction if morphing
    if (this.morphing) {
      this.applyTargetAttraction();
    }
    
    // Integrate velocities with damping
    this.integrateVelocities(deltaTime);
    
    // Check for spring breaking and reconnection
    this.updateSprings();
  }

  /**
   * Apply spring forces between connected vertices
   */
  applySpringForces() {
    const { springConstant } = this.config;

    for (const spring of this.mesh.springs) {
      if (!spring.active) continue;

      const { v1, v2, restLength } = spring;
      
      // Calculate current distance
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength < 0.001) continue; // Avoid division by zero
      
      // Spring force: F = -k * (currentLength - restLength)
      const displacement = currentLength - restLength;
      const force = springConstant * displacement;
      
      // Normalize direction
      const dirX = dx / currentLength;
      const dirY = dy / currentLength;
      
      // Apply force to both vertices (Newton's third law)
      const fx = dirX * force;
      const fy = dirY * force;
      
      if (!v1.fixed) {
        v1.vx += fx / v1.mass;
        v1.vy += fy / v1.mass;
      }
      
      if (!v2.fixed) {
        v2.vx -= fx / v2.mass;
        v2.vy -= fy / v2.mass;
      }
    }
  }

  /**
   * Apply attraction towards target positions (for morphing)
   */
  applyTargetAttraction() {
    const { targetAttractionStrength, overshootFactor } = this.config;
    
    for (const vertex of this.mesh.vertices) {
      if (vertex.fixed) continue;
      
      const dx = vertex.targetX - vertex.x;
      const dy = vertex.targetY - vertex.y;
      
      // Attract to target position
      vertex.vx += dx * targetAttractionStrength;
      vertex.vy += dy * targetAttractionStrength;
      
      // Add overshoot for sloshing effect
      // This creates a liquid/organic feel by allowing momentum to carry past target
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 50) {
        const overshoot = Math.sin(this.time * 3) * overshootFactor;
        vertex.vx += dx * overshoot;
        vertex.vy += dy * overshoot;
      }
    }
  }

  /**
   * Integrate velocities and update positions
   * @param {number} deltaTime - Time step in seconds
   */
  integrateVelocities(deltaTime) {
    const { damping, maxVelocity } = this.config;
    const { width, height } = this.mesh.config;

    for (const vertex of this.mesh.vertices) {
      if (vertex.fixed) continue;

      // Apply damping
      vertex.vx *= damping;
      vertex.vy *= damping;

      // Clamp velocity
      const speed = Math.sqrt(vertex.vx * vertex.vx + vertex.vy * vertex.vy);
      if (speed > maxVelocity) {
        const scale = maxVelocity / speed;
        vertex.vx *= scale;
        vertex.vy *= scale;
      }

      // Update position
      vertex.x += vertex.vx * deltaTime * 60; // Scale by 60 for frame-rate independence
      vertex.y += vertex.vy * deltaTime * 60;

      // Boundary constraints (soft)
      const boundaryMargin = 50;
      if (vertex.x < -boundaryMargin) {
        vertex.x = -boundaryMargin;
        vertex.vx *= -0.5;
      } else if (vertex.x > width + boundaryMargin) {
        vertex.x = width + boundaryMargin;
        vertex.vx *= -0.5;
      }

      if (vertex.y < -boundaryMargin) {
        vertex.y = -boundaryMargin;
        vertex.vy *= -0.5;
      } else if (vertex.y > height + boundaryMargin) {
        vertex.y = height + boundaryMargin;
        vertex.vy *= -0.5;
      }
    }
  }

  /**
   * Update spring states (breaking and reconnection)
   */
  updateSprings() {
    const { breakThreshold, reconnectThreshold } = this.config;

    // Check active springs for breaking
    for (const spring of this.mesh.springs) {
      if (!spring.active) continue;

      const dx = spring.v2.x - spring.v1.x;
      const dy = spring.v2.y - spring.v1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Break spring if stretched too far
      if (distance > breakThreshold) {
        spring.active = false;
        this.mesh.brokenSprings.push(spring);
        console.log(`[MeshPhysics] Spring broken (distance: ${distance.toFixed(1)})`);
      }
    }

    // Check broken springs for reconnection
    for (let i = this.mesh.brokenSprings.length - 1; i >= 0; i--) {
      const spring = this.mesh.brokenSprings[i];

      const dx = spring.v2.x - spring.v1.x;
      const dy = spring.v2.y - spring.v1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Reconnect if vertices are close enough
      if (distance < reconnectThreshold) {
        spring.active = true;
        this.mesh.brokenSprings.splice(i, 1);
        console.log(`[MeshPhysics] Spring reconnected (distance: ${distance.toFixed(1)})`);
      }
    }
  }

  /**
   * Start morphing towards target positions
   * @param {number} duration - Morph duration in milliseconds
   */
  startMorphing(duration = 2000) {
    this.morphing = true;
    this.morphProgress = 0;
    this.morphDuration = duration;
    this.morphStartTime = this.time;
    console.log(`[MeshPhysics] Started morphing (duration: ${duration}ms)`);
  }

  /**
   * Stop morphing
   */
  stopMorphing() {
    this.morphing = false;
    console.log('[MeshPhysics] Stopped morphing');
  }

  /**
   * Apply explosion force to all vertices
   * @param {number} intensity - Explosion intensity
   * @param {Object} center - Explosion center {x, y}
   */
  applyExplosion(intensity, center) {
    this.mesh.explode(intensity, center);
  }

  /**
   * Apply force to a vertex (for mouse interaction)
   * @param {Object} vertex - Vertex to affect
   * @param {number} fx - Force x component
   * @param {number} fy - Force y component
   */
  applyForceToVertex(vertex, fx, fy) {
    if (!vertex.fixed) {
      vertex.vx += fx / vertex.mass;
      vertex.vy += fy / vertex.mass;
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    console.log('[MeshPhysics] Config updated:', newConfig);
  }

  /**
   * Reset all velocities
   */
  resetVelocities() {
    for (const vertex of this.mesh.vertices) {
      vertex.vx = 0;
      vertex.vy = 0;
    }
  }

  /**
   * Get physics statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    let totalKineticEnergy = 0;
    let maxSpeed = 0;

    for (const vertex of this.mesh.vertices) {
      const speed = Math.sqrt(vertex.vx * vertex.vx + vertex.vy * vertex.vy);
      totalKineticEnergy += 0.5 * vertex.mass * speed * speed;
      maxSpeed = Math.max(maxSpeed, speed);
    }

    return {
      kineticEnergy: totalKineticEnergy,
      maxSpeed: maxSpeed,
      morphing: this.morphing,
      morphProgress: this.morphProgress
    };
  }
}
