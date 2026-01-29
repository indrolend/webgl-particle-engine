/**
 * ImageContainer - Generates and manages containers around images for particle physics
 * 
 * Key Features:
 * - Extracts image boundaries from alpha channel
 * - Creates bounding containers for particle containment
 * - Handles particle collision detection with container walls
 * - Dynamically scales containers for different images
 */
export class ImageContainer {
  constructor(config = {}) {
    this.config = {
      // Container detection parameters
      alphaThreshold: config.alphaThreshold || 0.1,     // Minimum alpha for edge detection
      padding: config.padding || 10,                     // Padding around image bounds (pixels)
      
      // Collision parameters
      bounceStrength: config.bounceStrength || 0.5,     // Bounce velocity multiplier
      edgeSoftness: config.edgeSoftness || 5,           // Soft edge distance (pixels)
      
      ...config
    };
    
    // Container bounds
    this.bounds = {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0
    };
    
    // Edge map for precise collision detection
    this.edgeMap = null;
    this.resolution = 10; // Grid resolution for edge map
    
    console.log('[ImageContainer] Initialized with config:', this.config);
  }
  
  /**
   * Generate container from image
   * Analyzes image alpha channel to find content boundaries
   * @param {HTMLImageElement} image - Source image
   * @param {Object} canvasSize - Canvas dimensions {width, height}
   * @param {number} scale - Scale factor for image on canvas
   * @param {Object} offset - Image offset on canvas {x, y}
   */
  generateFromImage(image, canvasSize, scale = 1.0, offset = {x: 0, y: 0}) {
    console.log('[ImageContainer] Generating container from image...');
    
    // Create temporary canvas to analyze image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const ctx = tempCanvas.getContext('2d');
    
    // Draw image to canvas
    ctx.drawImage(image, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    
    // Find content boundaries (based on alpha channel)
    let minX = image.width;
    let maxX = 0;
    let minY = image.height;
    let maxY = 0;
    
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const index = (y * image.width + x) * 4;
        const alpha = data[index + 3] / 255;
        
        if (alpha > this.config.alphaThreshold) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Apply padding
    minX = Math.max(0, minX - this.config.padding);
    maxX = Math.min(image.width, maxX + this.config.padding);
    minY = Math.max(0, minY - this.config.padding);
    maxY = Math.min(image.height, maxY + this.config.padding);
    
    // Transform to canvas coordinates
    this.bounds = {
      minX: offset.x + minX * scale,
      maxX: offset.x + maxX * scale,
      minY: offset.y + minY * scale,
      maxY: offset.y + maxY * scale,
      width: (maxX - minX) * scale,
      height: (maxY - minY) * scale,
      centerX: offset.x + ((minX + maxX) / 2) * scale,
      centerY: offset.y + ((minY + maxY) / 2) * scale
    };
    
    console.log('[ImageContainer] Container bounds:', this.bounds);
    
    // Generate edge map for precise collision detection
    this.generateEdgeMap(imageData, minX, maxX, minY, maxY, scale, offset);
  }
  
  /**
   * Generate edge map for precise collision detection
   * @param {ImageData} imageData - Image data
   * @param {number} minX - Min X boundary
   * @param {number} maxX - Max X boundary
   * @param {number} minY - Min Y boundary
   * @param {number} maxY - Max Y boundary
   * @param {number} scale - Scale factor
   * @param {Object} offset - Image offset
   */
  generateEdgeMap(imageData, minX, maxX, minY, maxY, scale, offset) {
    const width = maxX - minX;
    const height = maxY - minY;
    const gridWidth = Math.ceil(width / this.resolution);
    const gridHeight = Math.ceil(height / this.resolution);
    
    this.edgeMap = {
      grid: new Array(gridWidth * gridHeight).fill(false),
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      cellSize: this.resolution * scale,
      offsetX: offset.x + minX * scale,
      offsetY: offset.y + minY * scale
    };
    
    const data = imageData.data;
    const imgWidth = imageData.width;
    
    // Sample image at grid resolution
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const imgX = Math.floor(minX + gx * this.resolution);
        const imgY = Math.floor(minY + gy * this.resolution);
        
        if (imgX >= 0 && imgX < imgWidth && imgY >= 0 && imgY < imageData.height) {
          const index = (imgY * imgWidth + imgX) * 4;
          const alpha = data[index + 3] / 255;
          
          if (alpha > this.config.alphaThreshold) {
            this.edgeMap.grid[gy * gridWidth + gx] = true;
          }
        }
      }
    }
  }
  
  /**
   * Check if a point is inside the container
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - True if inside container
   */
  isInside(x, y) {
    // Basic bounds check
    if (x < this.bounds.minX || x > this.bounds.maxX || 
        y < this.bounds.minY || y > this.bounds.maxY) {
      return false;
    }
    
    // Detailed edge map check (if available)
    if (this.edgeMap) {
      const gx = Math.floor((x - this.edgeMap.offsetX) / this.edgeMap.cellSize);
      const gy = Math.floor((y - this.edgeMap.offsetY) / this.edgeMap.cellSize);
      
      if (gx >= 0 && gx < this.edgeMap.gridWidth && 
          gy >= 0 && gy < this.edgeMap.gridHeight) {
        return this.edgeMap.grid[gy * this.edgeMap.gridWidth + gx];
      }
    }
    
    return true;
  }
  
  /**
   * Apply container collision to a particle
   * Keeps particles within container bounds with bounce effect
   * @param {Object} particle - Particle to constrain
   */
  constrainParticle(particle) {
    const edgeSoftness = this.config.edgeSoftness;
    const bounceStr = this.config.bounceStrength;
    
    // X-axis constraints with soft edges
    if (particle.x < this.bounds.minX + edgeSoftness) {
      const penetration = (this.bounds.minX + edgeSoftness - particle.x) / edgeSoftness;
      particle.vx += penetration * 10;
      if (particle.x < this.bounds.minX) {
        particle.x = this.bounds.minX;
        particle.vx = Math.abs(particle.vx) * bounceStr;
      }
    } else if (particle.x > this.bounds.maxX - edgeSoftness) {
      const penetration = (particle.x - (this.bounds.maxX - edgeSoftness)) / edgeSoftness;
      particle.vx -= penetration * 10;
      if (particle.x > this.bounds.maxX) {
        particle.x = this.bounds.maxX;
        particle.vx = -Math.abs(particle.vx) * bounceStr;
      }
    }
    
    // Y-axis constraints with soft edges
    if (particle.y < this.bounds.minY + edgeSoftness) {
      const penetration = (this.bounds.minY + edgeSoftness - particle.y) / edgeSoftness;
      particle.vy += penetration * 10;
      if (particle.y < this.bounds.minY) {
        particle.y = this.bounds.minY;
        particle.vy = Math.abs(particle.vy) * bounceStr;
      }
    } else if (particle.y > this.bounds.maxY - edgeSoftness) {
      const penetration = (particle.y - (this.bounds.maxY - edgeSoftness)) / edgeSoftness;
      particle.vy -= penetration * 10;
      if (particle.y > this.bounds.maxY) {
        particle.y = this.bounds.maxY;
        particle.vy = -Math.abs(particle.vy) * bounceStr;
      }
    }
  }
  
  /**
   * Apply container constraints to all particles
   * @param {Array} particles - Array of particles
   */
  constrainParticles(particles) {
    particles.forEach(particle => {
      this.constrainParticle(particle);
    });
  }
  
  /**
   * Scale container to fit a new image
   * Used during recombination to adjust particle space
   * @param {number} targetWidth - Target container width
   * @param {number} targetHeight - Target container height
   * @param {Object} targetCenter - Target center position {x, y}
   */
  scaleTo(targetWidth, targetHeight, targetCenter = null) {
    const scaleX = targetWidth / this.bounds.width;
    const scaleY = targetHeight / this.bounds.height;
    
    // Use center for scaling if provided
    const centerX = targetCenter ? targetCenter.x : this.bounds.centerX;
    const centerY = targetCenter ? targetCenter.y : this.bounds.centerY;
    
    // Calculate new bounds maintaining aspect ratio
    const newWidth = this.bounds.width * scaleX;
    const newHeight = this.bounds.height * scaleY;
    
    this.bounds = {
      minX: centerX - newWidth / 2,
      maxX: centerX + newWidth / 2,
      minY: centerY - newHeight / 2,
      maxY: centerY + newHeight / 2,
      width: newWidth,
      height: newHeight,
      centerX: centerX,
      centerY: centerY
    };
    
    console.log('[ImageContainer] Scaled container to:', this.bounds);
  }
  
  /**
   * Get container bounds
   * @returns {Object} - Container bounds
   */
  getBounds() {
    return { ...this.bounds };
  }
  
  /**
   * Draw container bounds (for debugging)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Stroke color
   */
  drawDebug(ctx, color = '#ff0000') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.bounds.minX,
      this.bounds.minY,
      this.bounds.width,
      this.bounds.height
    );
    
    // Draw center point
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.bounds.centerX, this.bounds.centerY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Update configuration dynamically
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[ImageContainer] Configuration updated:', this.config);
  }
  
  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
