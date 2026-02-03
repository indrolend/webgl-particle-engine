/**
 * ElasticMesh - Elastic fishnet/diamond mesh for hybrid transitions
 * 
 * Generates a grid mesh covering the bounding rectangle of an image/pattern.
 * Each vertex is a particle with physics. Springs connect vertices if the path
 * between them crosses mostly opaque areas (alpha > threshold).
 * 
 * Features:
 * - Auto-generated mesh grid
 * - Alpha-aware spring connections (preserves holes)
 * - Configurable spring physics (elasticity, damping, break threshold)
 * - Explosion and morphing support
 */

export class ElasticMesh {
  /**
   * Create an elastic mesh
   * @param {Object} config - Configuration options
   * @param {number} config.width - Canvas width
   * @param {number} config.height - Canvas height
   * @param {number} config.gridDensity - Grid density (vertices per 100px)
   * @param {number} config.springConstant - Spring stiffness (0-1)
   * @param {number} config.damping - Velocity damping (0-1)
   * @param {number} config.breakThreshold - Distance for spring breaking
   * @param {number} config.alphaThreshold - Alpha threshold for connections (0-1)
   */
  constructor(config = {}) {
    this.config = {
      width: config.width || 800,
      height: config.height || 600,
      gridDensity: config.gridDensity || 1.5, // vertices per 100px
      springConstant: config.springConstant || 0.3,
      damping: config.damping || 0.95,
      breakThreshold: config.breakThreshold || 300,
      alphaThreshold: config.alphaThreshold || 0.5,
      restLengthMultiplier: config.restLengthMultiplier || 1.0,
      ...config
    };

    this.vertices = [];
    this.springs = [];
    this.brokenSprings = [];
    this.imageData = null;
    
    console.log('[ElasticMesh] Initialized with config:', this.config);
  }

  /**
   * Generate mesh grid based on image data
   * @param {ImageData} imageData - Image data for alpha checking
   * @param {number} particleCount - Optional target particle count for density adjustment
   */
  generateMesh(imageData, particleCount = null) {
    this.imageData = imageData;
    this.vertices = [];
    this.springs = [];
    this.brokenSprings = [];

    const { width, height, gridDensity } = this.config;

    // Calculate grid spacing based on density
    // If particleCount provided, adjust density to match
    let spacing;
    if (particleCount) {
      const totalArea = width * height;
      const targetSpacing = Math.sqrt(totalArea / particleCount);
      spacing = Math.max(20, Math.min(100, targetSpacing));
    } else {
      spacing = 100 / gridDensity;
    }

    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    console.log(`[ElasticMesh] Generating ${cols}x${rows} grid (spacing: ${spacing.toFixed(1)}px)`);

    // Generate vertices in grid pattern
    const vertexMap = new Map(); // Map for quick lookup by grid position
    let vertexIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + spacing / 2;
        const y = row * spacing + spacing / 2;

        // Keep within bounds
        if (x < width && y < height) {
          const vertex = {
            id: vertexIndex++,
            x: x,
            y: y,
            initialX: x,
            initialY: y,
            targetX: x,
            targetY: y,
            vx: 0,
            vy: 0,
            mass: 1.0,
            fixed: false,
            row: row,
            col: col,
            u: x / width,  // Texture coordinate
            v: y / height,
            color: this.sampleColor(imageData, x, y)
          };

          this.vertices.push(vertex);
          vertexMap.set(`${row},${col}`, vertex);
        }
      }
    }

    // Generate springs connecting adjacent vertices
    // Check 4 directions: right, down, diagonal-right, diagonal-left
    const directions = [
      { dr: 0, dc: 1 },   // right
      { dr: 1, dc: 0 },   // down
      { dr: 1, dc: 1 },   // diagonal-right
      { dr: 1, dc: -1 }   // diagonal-left
    ];

    for (const vertex of this.vertices) {
      const { row, col } = vertex;

      for (const dir of directions) {
        const neighborRow = row + dir.dr;
        const neighborCol = col + dir.dc;
        const neighbor = vertexMap.get(`${neighborRow},${neighborCol}`);

        if (neighbor) {
          // Check if path between vertices crosses opaque area
          if (this.shouldConnect(vertex, neighbor, imageData)) {
            const dx = neighbor.x - vertex.x;
            const dy = neighbor.y - vertex.y;
            const restLength = Math.sqrt(dx * dx + dy * dy) * this.config.restLengthMultiplier;

            this.springs.push({
              v1: vertex,
              v2: neighbor,
              restLength: restLength,
              active: true
            });
          }
        }
      }
    }

    console.log(`[ElasticMesh] Generated ${this.vertices.length} vertices, ${this.springs.length} springs`);
  }

  /**
   * Determine if two vertices should be connected based on alpha values along path
   * @param {Object} v1 - First vertex
   * @param {Object} v2 - Second vertex
   * @param {ImageData} imageData - Image data
   * @returns {boolean} - True if should connect
   */
  shouldConnect(v1, v2, imageData) {
    const samples = 5; // Number of sample points along the path
    let opaqueCount = 0;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = Math.floor(v1.x + (v2.x - v1.x) * t);
      const y = Math.floor(v1.y + (v2.y - v1.y) * t);

      const alpha = this.getAlpha(imageData, x, y);
      if (alpha > this.config.alphaThreshold) {
        opaqueCount++;
      }
    }

    // Connect if majority of samples are opaque
    return opaqueCount / (samples + 1) > 0.6;
  }

  /**
   * Get alpha value at position
   * @param {ImageData} imageData - Image data
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - Alpha value (0-1)
   */
  getAlpha(imageData, x, y) {
    const { width, height } = imageData;
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return 0;
    }

    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    return imageData.data[index + 3] / 255;
  }

  /**
   * Sample color at position
   * @param {ImageData} imageData - Image data
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} - RGBA color
   */
  sampleColor(imageData, x, y) {
    const { width, height } = imageData;
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return { r: 1, g: 1, b: 1, a: 0 };
    }

    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    return {
      r: imageData.data[index] / 255,
      g: imageData.data[index + 1] / 255,
      b: imageData.data[index + 2] / 255,
      a: imageData.data[index + 3] / 255
    };
  }

  /**
   * Apply explosion force to mesh
   * @param {number} intensity - Explosion strength
   * @param {Object} center - Optional explosion center {x, y}
   */
  explode(intensity = 100, center = null) {
    const explosionCenter = center || {
      x: this.config.width / 2,
      y: this.config.height / 2
    };

    for (const vertex of this.vertices) {
      const dx = vertex.x - explosionCenter.x;
      const dy = vertex.y - explosionCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy) + 1;

      // Radial force from center
      const force = intensity / distance;
      const angle = Math.atan2(dy, dx);

      vertex.vx += Math.cos(angle) * force;
      vertex.vy += Math.sin(angle) * force;

      // Add some randomness for organic feel
      vertex.vx += (Math.random() - 0.5) * intensity * 0.3;
      vertex.vy += (Math.random() - 0.5) * intensity * 0.3;
    }

    console.log(`[ElasticMesh] Explosion applied (intensity: ${intensity})`);
  }

  /**
   * Set target positions for morphing
   * @param {ImageData} targetImage - Target image data
   */
  setTargetPositions(targetImage) {
    // Update target positions based on new image
    // For now, keep same positions but update colors
    for (const vertex of this.vertices) {
      vertex.targetX = vertex.initialX;
      vertex.targetY = vertex.initialY;
      vertex.targetColor = this.sampleColor(targetImage, vertex.initialX, vertex.initialY);
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    console.log('[ElasticMesh] Config updated:', newConfig);
  }

  /**
   * Get vertex at position (for mouse interaction)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Selection radius
   * @returns {Object|null} - Vertex or null
   */
  getVertexAt(x, y, radius = 20) {
    for (const vertex of this.vertices) {
      const dx = vertex.x - x;
      const dy = vertex.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < radius) {
        return vertex;
      }
    }
    return null;
  }

  /**
   * Get mesh statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      vertexCount: this.vertices.length,
      springCount: this.springs.length,
      activeSpringCount: this.springs.filter(s => s.active).length,
      brokenSpringCount: this.brokenSprings.length
    };
  }
}
