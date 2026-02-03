/**
 * JellyPhysics - Spring-mass physics simulation for jelly mesh
 * 
 * Features:
 * - Spring connections between perimeter points
 * - Impulse/explosion from centroid
 * - Edge breaking on high tension
 * - Piece rejoin mechanics
 * - Fade-out for distant/timeout pieces
 */

export class JellyPhysics {
  constructor(config = {}) {
    this.config = {
      // Spring parameters
      springStiffness: config.springStiffness || 0.5, // 0-1
      springDamping: config.springDamping || 0.95,
      restLengthFactor: config.restLengthFactor || 1.0,
      
      // Body dynamics
      bodyType: config.bodyType || 'soft', // 'soft' or 'stiff'
      mass: config.mass || 1.0,
      
      // Explosion/impulse
      explosionStrength: config.explosionStrength || 100,
      explosionFromCentroid: config.explosionFromCentroid !== false,
      
      // Edge breaking
      enableEdgeBreaking: config.enableEdgeBreaking !== false,
      breakTensionThreshold: config.breakTensionThreshold || 2.5, // Multiple of rest length
      breakProbability: config.breakProbability || 0.3, // 0-1
      
      // Rejoin mechanics
      enableRejoin: config.enableRejoin !== false,
      rejoinDistance: config.rejoinDistance || 20,
      rejoinTimeout: config.rejoinTimeout || 3000, // ms
      
      // Fade-out
      fadeDistance: config.fadeDistance || 200,
      fadeTimeout: config.fadeTimeout || 5000, // ms
      
      ...config
    };
    
    // Physics state
    this.springs = [];
    this.brokenEdges = new Set();
    this.pieces = []; // Separated mesh pieces
    this.pieceTimestamps = new Map();
    
    console.log('[JellyPhysics] Initialized with config:', this.config);
  }
  
  /**
   * Initialize physics for a mesh
   */
  initializeMesh(mesh) {
    if (!mesh || !mesh.perimeter) {
      console.warn('[JellyPhysics] Invalid mesh');
      return;
    }
    
    console.log('[JellyPhysics] Initializing physics for mesh...');
    
    // Add velocity and physics properties to vertices
    mesh.perimeter.forEach((v, i) => {
      v.vx = v.vx || 0;
      v.vy = v.vy || 0;
      v.mass = this.config.mass;
      v.index = i;
      v.alpha = v.alpha || 1.0;
    });
    
    // Create springs between adjacent vertices
    this.springs = [];
    for (let i = 0; i < mesh.perimeter.length; i++) {
      const v1 = mesh.perimeter[i];
      const v2 = mesh.perimeter[(i + 1) % mesh.perimeter.length];
      
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const restLength = Math.sqrt(dx * dx + dy * dy) * this.config.restLengthFactor;
      
      this.springs.push({
        v1Index: i,
        v2Index: (i + 1) % mesh.perimeter.length,
        restLength: restLength,
        broken: false
      });
    }
    
    // Adjust stiffness based on body type
    if (this.config.bodyType === 'stiff') {
      this.config.springStiffness = Math.min(1.0, this.config.springStiffness * 1.5);
    }
    
    // Reset broken edges and pieces
    this.brokenEdges.clear();
    this.pieces = [];
    this.pieceTimestamps.clear();
    
    console.log(`[JellyPhysics] Initialized ${this.springs.length} springs`);
  }
  
  /**
   * Apply impulse/explosion from centroid
   */
  applyExplosion(mesh, intensity = null) {
    if (!mesh || !mesh.perimeter || !mesh.centroid) {
      return;
    }
    
    const strength = intensity !== null ? intensity : this.config.explosionStrength;
    const centroid = mesh.centroid;
    
    console.log(`[JellyPhysics] Applying explosion with strength ${strength}`);
    
    mesh.perimeter.forEach(v => {
      const dx = v.x - centroid.x;
      const dy = v.y - centroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0.1) {
        const force = strength / (dist + 1);
        v.vx += (dx / dist) * force;
        v.vy += (dy / dist) * force;
      } else {
        // Random direction for vertices at centroid
        const angle = Math.random() * Math.PI * 2;
        v.vx += Math.cos(angle) * strength;
        v.vy += Math.sin(angle) * strength;
      }
    });
  }
  
  /**
   * Update physics simulation
   */
  update(mesh, deltaTime, boundaries = null) {
    if (!mesh || !mesh.perimeter) {
      return;
    }
    
    const vertices = mesh.perimeter;
    
    // Apply spring forces
    this.applySpringForces(vertices);
    
    // Update velocities and positions
    for (const v of vertices) {
      // Apply damping
      v.vx *= this.config.springDamping;
      v.vy *= this.config.springDamping;
      
      // Update position
      v.x += v.vx * deltaTime;
      v.y += v.vy * deltaTime;
      
      // Boundary collisions
      if (boundaries) {
        this.handleBoundaryCollision(v, boundaries);
      }
    }
    
    // Check for edge breaking
    if (this.config.enableEdgeBreaking) {
      this.checkEdgeBreaking(vertices);
    }
    
    // Update pieces (separated mesh fragments)
    if (this.pieces.length > 0) {
      this.updatePieces(deltaTime, boundaries);
    }
    
    // Check for rejoin
    if (this.config.enableRejoin && this.pieces.length > 0) {
      this.checkRejoin(mesh);
    }
  }
  
  /**
   * Apply spring forces between connected vertices
   */
  applySpringForces(vertices) {
    for (const spring of this.springs) {
      if (spring.broken) continue;
      
      const v1 = vertices[spring.v1Index];
      const v2 = vertices[spring.v2Index];
      
      if (!v1 || !v2) continue;
      
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 0.001) continue;
      
      // Spring force (Hooke's law)
      const displacement = dist - spring.restLength;
      const force = displacement * this.config.springStiffness;
      
      const forceX = (dx / dist) * force;
      const forceY = (dy / dist) * force;
      
      // Apply forces to both vertices
      v1.vx += forceX / v1.mass;
      v1.vy += forceY / v1.mass;
      v2.vx -= forceX / v2.mass;
      v2.vy -= forceY / v2.mass;
    }
  }
  
  /**
   * Check for edge breaking based on tension
   */
  checkEdgeBreaking(vertices) {
    const currentTime = Date.now();
    
    for (const spring of this.springs) {
      if (spring.broken) continue;
      
      const v1 = vertices[spring.v1Index];
      const v2 = vertices[spring.v2Index];
      
      if (!v1 || !v2) continue;
      
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Check if tension exceeds threshold
      const tension = dist / spring.restLength;
      
      if (tension > this.config.breakTensionThreshold) {
        // Probabilistic breaking
        if (Math.random() < this.config.breakProbability) {
          console.log(`[JellyPhysics] Breaking edge ${spring.v1Index}-${spring.v2Index} (tension: ${tension.toFixed(2)})`);
          
          spring.broken = true;
          this.brokenEdges.add(`${spring.v1Index}-${spring.v2Index}`);
          
          // Create separate piece if this breaks the mesh
          this.detectAndCreatePieces(vertices);
        }
      }
    }
  }
  
  /**
   * Detect separated pieces after edge breaking
   */
  detectAndCreatePieces(vertices) {
    // Simple implementation: if enough edges are broken, separate into pieces
    const brokenCount = this.springs.filter(s => s.broken).length;
    const totalCount = this.springs.length;
    
    if (brokenCount > totalCount * 0.3) {
      console.log('[JellyPhysics] Mesh fragmented into pieces');
      
      // Group connected vertices
      const visited = new Set();
      const newPieces = [];
      
      for (let i = 0; i < vertices.length; i++) {
        if (visited.has(i)) continue;
        
        const piece = this.floodFillPiece(i, vertices, visited);
        if (piece.length > 0) {
          newPieces.push(piece);
          this.pieceTimestamps.set(piece, Date.now());
        }
      }
      
      if (newPieces.length > 1) {
        this.pieces = newPieces;
        console.log(`[JellyPhysics] Created ${this.pieces.length} pieces`);
      }
    }
  }
  
  /**
   * Flood fill to find connected vertices
   */
  floodFillPiece(startIndex, vertices, visited) {
    const piece = [];
    const queue = [startIndex];
    visited.add(startIndex);
    
    while (queue.length > 0) {
      const idx = queue.shift();
      piece.push(vertices[idx]);
      
      // Check connected springs
      for (const spring of this.springs) {
        if (spring.broken) continue;
        
        let nextIdx = -1;
        if (spring.v1Index === idx && !visited.has(spring.v2Index)) {
          nextIdx = spring.v2Index;
        } else if (spring.v2Index === idx && !visited.has(spring.v1Index)) {
          nextIdx = spring.v1Index;
        }
        
        if (nextIdx >= 0) {
          visited.add(nextIdx);
          queue.push(nextIdx);
        }
      }
    }
    
    return piece;
  }
  
  /**
   * Update separated pieces
   */
  updatePieces(deltaTime, boundaries) {
    const currentTime = Date.now();
    const piecesToRemove = [];
    
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const timestamp = this.pieceTimestamps.get(piece);
      
      // Check timeout
      if (currentTime - timestamp > this.config.fadeTimeout) {
        piecesToRemove.push(i);
        continue;
      }
      
      // Update piece physics
      for (const v of piece) {
        v.vx *= this.config.springDamping;
        v.vy *= this.config.springDamping;
        v.x += v.vx * deltaTime;
        v.y += v.vy * deltaTime;
        
        if (boundaries) {
          this.handleBoundaryCollision(v, boundaries);
        }
        
        // Fade out based on distance or timeout
        const elapsed = currentTime - timestamp;
        const fadeProgress = elapsed / this.config.fadeTimeout;
        v.alpha = Math.max(0, 1.0 - fadeProgress);
      }
    }
    
    // Remove faded pieces
    for (let i = piecesToRemove.length - 1; i >= 0; i--) {
      const idx = piecesToRemove[i];
      const piece = this.pieces[idx];
      this.pieceTimestamps.delete(piece);
      this.pieces.splice(idx, 1);
      console.log(`[JellyPhysics] Removed faded piece ${idx}`);
    }
  }
  
  /**
   * Check if pieces can rejoin
   */
  checkRejoin(mesh) {
    if (this.pieces.length < 2) return;
    
    const mainMesh = mesh.perimeter;
    const rejoinedPieces = [];
    
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      
      // Calculate piece centroid
      let cx = 0, cy = 0;
      for (const v of piece) {
        cx += v.x;
        cy += v.y;
      }
      cx /= piece.length;
      cy /= piece.length;
      
      // Calculate main mesh centroid
      let mx = 0, my = 0;
      for (const v of mainMesh) {
        mx += v.x;
        my += v.y;
      }
      mx /= mainMesh.length;
      my /= mainMesh.length;
      
      // Check distance
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.config.rejoinDistance) {
        console.log(`[JellyPhysics] Piece ${i} rejoining main mesh (distance: ${dist.toFixed(2)})`);
        rejoinedPieces.push(i);
        
        // Merge piece back into main mesh
        for (const v of piece) {
          v.alpha = 1.0;
        }
      }
    }
    
    // Remove rejoined pieces
    for (let i = rejoinedPieces.length - 1; i >= 0; i--) {
      const idx = rejoinedPieces[i];
      const piece = this.pieces[idx];
      this.pieceTimestamps.delete(piece);
      this.pieces.splice(idx, 1);
    }
    
    // Rebuild springs if pieces rejoined
    if (rejoinedPieces.length > 0) {
      this.rebuildSprings(mesh);
    }
  }
  
  /**
   * Rebuild springs after rejoin
   */
  rebuildSprings(mesh) {
    // Mark broken springs as reconnected
    for (const spring of this.springs) {
      if (spring.broken) {
        const key = `${spring.v1Index}-${spring.v2Index}`;
        if (this.brokenEdges.has(key)) {
          spring.broken = false;
          this.brokenEdges.delete(key);
          console.log(`[JellyPhysics] Reconnected edge ${key}`);
        }
      }
    }
  }
  
  /**
   * Handle boundary collisions
   */
  handleBoundaryCollision(vertex, boundaries) {
    const { minX, minY, maxX, maxY } = boundaries;
    const elasticity = 0.7;
    
    if (vertex.x < minX) {
      vertex.x = minX;
      vertex.vx *= -elasticity;
    } else if (vertex.x > maxX) {
      vertex.x = maxX;
      vertex.vx *= -elasticity;
    }
    
    if (vertex.y < minY) {
      vertex.y = minY;
      vertex.vy *= -elasticity;
    } else if (vertex.y > maxY) {
      vertex.y = maxY;
      vertex.vy *= -elasticity;
    }
  }
  
  /**
   * Apply contraction force (pull vertices toward centroid)
   */
  applyContraction(mesh, strength = 0.1) {
    if (!mesh || !mesh.centroid) return;
    
    const centroid = mesh.centroid;
    
    for (const v of mesh.perimeter) {
      const dx = centroid.x - v.x;
      const dy = centroid.y - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0.1) {
        v.vx += (dx / dist) * strength * dist * 0.01;
        v.vy += (dy / dist) * strength * dist * 0.01;
      }
    }
  }
  
  /**
   * Get physics statistics
   */
  getStats() {
    const brokenCount = this.springs.filter(s => s.broken).length;
    
    return {
      totalSprings: this.springs.length,
      brokenSprings: brokenCount,
      pieces: this.pieces.length,
      brokenEdges: this.brokenEdges.size
    };
  }
  
  /**
   * Reset physics state
   */
  reset() {
    this.springs = [];
    this.brokenEdges.clear();
    this.pieces = [];
    this.pieceTimestamps.clear();
    console.log('[JellyPhysics] Physics reset');
  }
}
