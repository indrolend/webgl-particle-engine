/**
 * JellyMesh - Mesh extraction from image alpha channel
 * 
 * Features:
 * - Perimeter extraction using marching squares
 * - Adaptive point sampling for visual smoothness
 * - Interior triangulation with UV mapping
 * - Mesh result caching for performance
 */

export class JellyMesh {
  constructor(config = {}) {
    this.config = {
      // Adaptive mesh detail
      minVertexCount: config.minVertexCount || 20,
      maxVertexCount: config.maxVertexCount || 200,
      detailLevel: config.detailLevel || 0.5, // 0-1, controls point density
      
      // Marching squares parameters
      alphaThreshold: config.alphaThreshold || 128, // 0-255
      simplifyTolerance: config.simplifyTolerance || 2.0, // Douglas-Peucker tolerance
      
      // UV and triangulation
      enableUVs: config.enableUVs !== false,
      
      ...config
    };
    
    // Cache for extracted meshes
    this.meshCache = new Map();
    
    console.log('[JellyMesh] Initialized with config:', this.config);
  }
  
  /**
   * Extract mesh from image
   * @param {HTMLImageElement|HTMLCanvasElement} image 
   * @param {string} cacheKey - Optional cache key
   * @returns {Object} Mesh data with vertices, triangles, and UVs
   */
  extractMesh(image, cacheKey = null) {
    // Check cache
    if (cacheKey && this.meshCache.has(cacheKey)) {
      console.log('[JellyMesh] Using cached mesh:', cacheKey);
      return this.meshCache.get(cacheKey);
    }
    
    console.log('[JellyMesh] Extracting mesh from image...');
    
    // Get image data
    const imageData = this.getImageData(image);
    
    // Extract perimeter using marching squares
    const perimeter = this.extractPerimeter(imageData);
    
    if (perimeter.length < 3) {
      console.warn('[JellyMesh] Perimeter too small, returning null');
      return null;
    }
    
    // Simplify perimeter if needed
    const simplified = this.simplifyPerimeter(perimeter);
    
    // Adapt vertex count to current detail level
    const adaptedPerimeter = this.adaptVertexCount(simplified);
    
    // Triangulate interior
    const triangles = this.triangulate(adaptedPerimeter);
    
    // Generate UVs
    const uvs = this.config.enableUVs ? this.generateUVs(adaptedPerimeter, image.width, image.height) : null;
    
    const mesh = {
      perimeter: adaptedPerimeter,
      triangles: triangles,
      uvs: uvs,
      bounds: this.calculateBounds(adaptedPerimeter),
      centroid: this.calculateCentroid(adaptedPerimeter)
    };
    
    // Cache result
    if (cacheKey) {
      this.meshCache.set(cacheKey, mesh);
    }
    
    console.log(`[JellyMesh] Mesh extracted: ${adaptedPerimeter.length} vertices, ${triangles.length} triangles`);
    
    return mesh;
  }
  
  /**
   * Get image data from image or canvas
   */
  getImageData(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  /**
   * Extract perimeter using marching squares algorithm
   */
  extractPerimeter(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const threshold = this.config.alphaThreshold;
    
    // Create binary grid based on alpha values
    const grid = new Array(height);
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4 + 3; // Alpha channel
        grid[y][x] = data[idx] >= threshold ? 1 : 0;
      }
    }
    
    // Find starting point on perimeter
    let startX = -1, startY = -1;
    outerLoop: for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        if (grid[y][x] === 1 && (x === 0 || y === 0 || grid[y-1][x] === 0 || grid[y][x-1] === 0)) {
          startX = x;
          startY = y;
          break outerLoop;
        }
      }
    }
    
    if (startX === -1) {
      console.warn('[JellyMesh] No perimeter found');
      return [];
    }
    
    // Trace perimeter using Moore neighborhood
    const perimeter = [];
    const visited = new Set();
    let x = startX, y = startY;
    let prevDir = 0; // 0=right, 1=down, 2=left, 3=up
    
    // Moore neighborhood directions (8-connected)
    const dirs = [
      [1, 0],   // right
      [1, 1],   // down-right
      [0, 1],   // down
      [-1, 1],  // down-left
      [-1, 0],  // left
      [-1, -1], // up-left
      [0, -1],  // up
      [1, -1]   // up-right
    ];
    
    let iterations = 0;
    const maxIterations = width * height; // Safety limit
    
    do {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
        perimeter.push({ x, y });
        visited.add(key);
      }
      
      // Look for next boundary pixel
      let found = false;
      for (let i = 0; i < dirs.length; i++) {
        const dir = (prevDir + i) % dirs.length;
        const nx = x + dirs[dir][0];
        const ny = y + dirs[dir][1];
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] === 1) {
          x = nx;
          y = ny;
          prevDir = dir;
          found = true;
          break;
        }
      }
      
      if (!found) break;
      
      iterations++;
      if (iterations > maxIterations) {
        console.warn('[JellyMesh] Perimeter tracing exceeded max iterations');
        break;
      }
      
    } while (x !== startX || y !== startY);
    
    return perimeter;
  }
  
  /**
   * Simplify perimeter using Douglas-Peucker algorithm
   */
  simplifyPerimeter(points) {
    if (points.length < 3) return points;
    
    const tolerance = this.config.simplifyTolerance;
    
    function perpendicularDistance(point, lineStart, lineEnd) {
      const dx = lineEnd.x - lineStart.x;
      const dy = lineEnd.y - lineStart.y;
      const mag = Math.sqrt(dx * dx + dy * dy);
      
      if (mag < 0.001) return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      );
      
      const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
      const intersectX = lineStart.x + u * dx;
      const intersectY = lineStart.y + u * dy;
      
      return Math.sqrt(
        Math.pow(point.x - intersectX, 2) + Math.pow(point.y - intersectY, 2)
      );
    }
    
    function douglasPeucker(points, start, end, tolerance) {
      if (end - start < 2) return [start, end];
      
      let maxDist = 0;
      let maxIdx = start;
      
      for (let i = start + 1; i < end; i++) {
        const dist = perpendicularDistance(points[i], points[start], points[end]);
        if (dist > maxDist) {
          maxDist = dist;
          maxIdx = i;
        }
      }
      
      if (maxDist < tolerance) {
        return [start, end];
      }
      
      const left = douglasPeucker(points, start, maxIdx, tolerance);
      const right = douglasPeucker(points, maxIdx, end, tolerance);
      
      return [...left.slice(0, -1), ...right];
    }
    
    const indices = douglasPeucker(points, 0, points.length - 1, tolerance);
    return indices.map(i => points[i]);
  }
  
  /**
   * Adapt vertex count based on detail level
   */
  adaptVertexCount(points) {
    const targetCount = Math.floor(
      this.config.minVertexCount + 
      (this.config.maxVertexCount - this.config.minVertexCount) * this.config.detailLevel
    );
    
    if (points.length <= targetCount) {
      return points;
    }
    
    // Downsample to target count
    const step = points.length / targetCount;
    const adapted = [];
    
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(i * step);
      adapted.push(points[idx]);
    }
    
    return adapted;
  }
  
  /**
   * Triangulate interior using ear clipping algorithm
   */
  triangulate(perimeter) {
    if (perimeter.length < 3) return [];
    
    // Simple ear clipping triangulation
    const vertices = [...perimeter];
    const triangles = [];
    
    while (vertices.length > 3) {
      let earFound = false;
      
      for (let i = 0; i < vertices.length; i++) {
        const prev = vertices[(i - 1 + vertices.length) % vertices.length];
        const curr = vertices[i];
        const next = vertices[(i + 1) % vertices.length];
        
        if (this.isEar(prev, curr, next, vertices)) {
          triangles.push([
            { ...prev },
            { ...curr },
            { ...next }
          ]);
          
          vertices.splice(i, 1);
          earFound = true;
          break;
        }
      }
      
      if (!earFound) {
        console.warn('[JellyMesh] Triangulation failed - no ear found');
        break;
      }
    }
    
    // Add final triangle
    if (vertices.length === 3) {
      triangles.push([
        { ...vertices[0] },
        { ...vertices[1] },
        { ...vertices[2] }
      ]);
    }
    
    return triangles;
  }
  
  /**
   * Check if a vertex forms an ear (convex and contains no other vertices)
   */
  isEar(prev, curr, next, vertices) {
    // Check if triangle is convex
    const cross = (next.x - curr.x) * (prev.y - curr.y) - (next.y - curr.y) * (prev.x - curr.x);
    if (cross <= 0) return false;
    
    // Check if any other vertex is inside this triangle
    for (const v of vertices) {
      if (v === prev || v === curr || v === next) continue;
      
      if (this.pointInTriangle(v, prev, curr, next)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if point is inside triangle
   */
  pointInTriangle(p, a, b, c) {
    const sign = (p1, p2, p3) => {
      return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    };
    
    const d1 = sign(p, a, b);
    const d2 = sign(p, b, c);
    const d3 = sign(p, c, a);
    
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    
    return !(hasNeg && hasPos);
  }
  
  /**
   * Generate UV coordinates for texture mapping
   */
  generateUVs(perimeter, imageWidth, imageHeight) {
    return perimeter.map(p => ({
      u: p.x / imageWidth,
      v: p.y / imageHeight
    }));
  }
  
  /**
   * Calculate bounding box
   */
  calculateBounds(perimeter) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const p of perimeter) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    
    return { minX, minY, maxX, maxY };
  }
  
  /**
   * Calculate centroid of perimeter
   */
  calculateCentroid(perimeter) {
    let sumX = 0, sumY = 0;
    
    for (const p of perimeter) {
      sumX += p.x;
      sumY += p.y;
    }
    
    return {
      x: sumX / perimeter.length,
      y: sumY / perimeter.length
    };
  }
  
  /**
   * Update mesh detail level (for FPS-based adaptation)
   */
  setDetailLevel(level) {
    this.config.detailLevel = Math.max(0, Math.min(1, level));
    console.log('[JellyMesh] Detail level updated:', this.config.detailLevel);
  }
  
  /**
   * Clear mesh cache
   */
  clearCache() {
    this.meshCache.clear();
    console.log('[JellyMesh] Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.meshCache.size,
      keys: Array.from(this.meshCache.keys())
    };
  }
}
