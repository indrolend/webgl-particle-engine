/**
 * KeyPointManager - Manages key point detection for triangulation
 * Supports both manual key points and automatic feature detection
 */
export class KeyPointManager {
  constructor() {
    this.keyPoints = [];
    console.log('[KeyPointManager] Initialized');
  }

  /**
   * Generate automatic grid-based key points for an image
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} gridSize - Number of points per row/column (default: 8)
   * @returns {Array} Array of key points [{x, y}, ...]
   */
  generateGridKeyPoints(width, height, gridSize = 8) {
    console.log(`[KeyPointManager] Generating ${gridSize}x${gridSize} grid key points for ${width}x${height}`);
    
    const points = [];
    
    // Add corner points first (essential for boundary)
    points.push({ x: 0, y: 0 });
    points.push({ x: width, y: 0 });
    points.push({ x: width, y: height });
    points.push({ x: 0, y: height });
    
    // Add edge points
    for (let i = 1; i < gridSize - 1; i++) {
      const t = i / (gridSize - 1);
      // Top edge
      points.push({ x: t * width, y: 0 });
      // Bottom edge
      points.push({ x: t * width, y: height });
      // Left edge
      points.push({ x: 0, y: t * height });
      // Right edge
      points.push({ x: width, y: t * height });
    }
    
    // Add interior grid points
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        points.push({
          x: (i / (gridSize - 1)) * width,
          y: (j / (gridSize - 1)) * height
        });
      }
    }
    
    this.keyPoints = points;
    console.log(`[KeyPointManager] Generated ${points.length} key points`);
    return points;
  }

  /**
   * Generate key points based on image features (simplified version)
   * Uses edge detection and sampling for feature-rich areas
   * @param {ImageData} imageData - Image data to analyze
   * @param {number} targetCount - Target number of key points
   * @returns {Array} Array of key points
   */
  generateFeatureKeyPoints(imageData, targetCount = 64) {
    console.log(`[KeyPointManager] Generating ${targetCount} feature-based key points`);
    
    const { width, height, data } = imageData;
    const points = [];
    
    // Always add corners
    points.push({ x: 0, y: 0 });
    points.push({ x: width - 1, y: 0 });
    points.push({ x: width - 1, y: height - 1 });
    points.push({ x: 0, y: height - 1 });
    
    // Calculate edge strength for each pixel
    const edgeMap = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Sobel operator for edge detection
        const gx = (
          -data[idx - 4 - width * 4] - 2 * data[idx - width * 4] - data[idx + 4 - width * 4] +
          data[idx - 4 + width * 4] + 2 * data[idx + width * 4] + data[idx + 4 + width * 4]
        );
        
        const gy = (
          -data[idx - 4 - width * 4] - 2 * data[idx - 4] - data[idx - 4 + width * 4] +
          data[idx + 4 - width * 4] + 2 * data[idx + 4] + data[idx + 4 + width * 4]
        );
        
        edgeMap[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    // Sample points based on edge strength
    const remainingCount = targetCount - 4;
    const cellSize = Math.max(10, Math.floor(Math.sqrt((width * height) / remainingCount)));
    
    for (let y = cellSize; y < height - cellSize; y += cellSize) {
      for (let x = cellSize; x < width - cellSize; x += cellSize) {
        // Find strongest edge in this cell
        let maxEdge = 0;
        let maxX = x;
        let maxY = y;
        
        for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
          for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
            const edge = edgeMap[(y + dy) * width + (x + dx)];
            if (edge > maxEdge) {
              maxEdge = edge;
              maxX = x + dx;
              maxY = y + dy;
            }
          }
        }
        
        points.push({ x: maxX, y: maxY });
        
        if (points.length >= targetCount) break;
      }
      if (points.length >= targetCount) break;
    }
    
    this.keyPoints = points;
    console.log(`[KeyPointManager] Generated ${points.length} feature-based key points`);
    return points;
  }

  /**
   * Set manual key points
   * @param {Array} points - Array of {x, y} points
   */
  setManualKeyPoints(points) {
    this.keyPoints = [...points];
    console.log(`[KeyPointManager] Set ${points.length} manual key points`);
    return this.keyPoints;
  }

  /**
   * Get current key points
   */
  getKeyPoints() {
    return this.keyPoints;
  }

  /**
   * Clear all key points
   */
  clear() {
    this.keyPoints = [];
    console.log('[KeyPointManager] Cleared all key points');
  }
}
