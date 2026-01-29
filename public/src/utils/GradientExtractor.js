/**
 * GradientExtractor - Extracts dominant colors and creates gradient approximations from images
 * 
 * Key Features:
 * - Analyzes images to extract dominant color regions
 * - Creates gradient maps for smooth color transitions
 * - Supports spatial color clustering for blob-based rendering
 * - Optimized for real-time gradient approximation
 */
export class GradientExtractor {
  constructor(config = {}) {
    this.config = {
      // Grid-based sampling for gradient extraction
      gridResolution: config.gridResolution || 16, // NxN grid for sampling
      
      // Color quantization
      colorBuckets: config.colorBuckets || 8, // Reduce color space for clustering
      
      // Gradient smoothing
      smoothingRadius: config.smoothingRadius || 2, // Pixels to average for smoothing
      
      // Dominant color extraction
      minColorFrequency: config.minColorFrequency || 0.02, // Min 2% of pixels
      maxColors: config.maxColors || 12, // Max dominant colors to extract
      
      ...config
    };
    
    console.log('[GradientExtractor] Initialized with config:', this.config);
  }
  
  /**
   * Extract dominant colors from an image with spatial information
   * @param {HTMLImageElement|HTMLCanvasElement} image - Source image
   * @returns {Object} Gradient data with dominant colors and spatial map
   */
  extractGradientData(image) {
    console.log('[GradientExtractor] Extracting gradient data from image...');
    
    // Create temporary canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Step 1: Create spatial color map using grid sampling
    const colorMap = this.createSpatialColorMap(pixels, canvas.width, canvas.height);
    
    // Step 2: Extract dominant colors from the entire image
    const dominantColors = this.extractDominantColors(pixels, canvas.width, canvas.height);
    
    // Step 3: Create gradient regions by mapping spatial areas to dominant colors
    const gradientRegions = this.createGradientRegions(colorMap, dominantColors);
    
    console.log(`[GradientExtractor] Extracted ${dominantColors.length} dominant colors`);
    
    return {
      dominantColors: dominantColors,
      colorMap: colorMap,
      gradientRegions: gradientRegions,
      width: canvas.width,
      height: canvas.height
    };
  }
  
  /**
   * Create a spatial color map by sampling the image in a grid pattern
   * @param {Uint8ClampedArray} pixels - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} 2D array of average colors per grid cell
   */
  createSpatialColorMap(pixels, width, height) {
    const gridRes = this.config.gridResolution;
    const cellWidth = Math.floor(width / gridRes);
    const cellHeight = Math.floor(height / gridRes);
    const colorMap = [];
    
    for (let gy = 0; gy < gridRes; gy++) {
      const row = [];
      for (let gx = 0; gx < gridRes; gx++) {
        // Calculate average color for this grid cell
        let r = 0, g = 0, b = 0, count = 0;
        
        const startX = gx * cellWidth;
        const startY = gy * cellHeight;
        const endX = Math.min(startX + cellWidth, width);
        const endY = Math.min(startY + cellHeight, height);
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * width + x) * 4;
            const alpha = pixels[i + 3] / 255;
            
            // Skip transparent pixels
            if (alpha < 0.1) continue;
            
            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
            count++;
          }
        }
        
        if (count > 0) {
          row.push({
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            x: gx,
            y: gy
          });
        } else {
          // Default to white for empty cells
          row.push({ r: 255, g: 255, b: 255, x: gx, y: gy });
        }
      }
      colorMap.push(row);
    }
    
    return colorMap;
  }
  
  /**
   * Extract dominant colors from the entire image using color frequency analysis
   * @param {Uint8ClampedArray} pixels - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} Array of dominant colors with frequency data
   */
  extractDominantColors(pixels, width, height) {
    const colorFrequency = new Map();
    const bucketSize = 256 / this.config.colorBuckets;
    const totalPixels = width * height;
    
    // Count color frequencies with quantization
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3] / 255;
      
      // Skip transparent pixels
      if (alpha < 0.1) continue;
      
      // Quantize color to reduce color space
      const r = Math.floor(pixels[i] / bucketSize) * bucketSize;
      const g = Math.floor(pixels[i + 1] / bucketSize) * bucketSize;
      const b = Math.floor(pixels[i + 2] / bucketSize) * bucketSize;
      
      const key = `${r},${g},${b}`;
      colorFrequency.set(key, (colorFrequency.get(key) || 0) + 1);
    }
    
    // Sort colors by frequency
    const sortedColors = Array.from(colorFrequency.entries())
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return {
          r: r,
          g: g,
          b: b,
          frequency: count / totalPixels,
          count: count
        };
      })
      .filter(color => color.frequency >= this.config.minColorFrequency)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, this.config.maxColors);
    
    return sortedColors;
  }
  
  /**
   * Create gradient regions by clustering spatial cells with dominant colors
   * @param {Array} colorMap - 2D spatial color map
   * @param {Array} dominantColors - Array of dominant colors
   * @returns {Array} Array of gradient regions with color assignments
   */
  createGradientRegions(colorMap, dominantColors) {
    const regions = [];
    
    // Assign each grid cell to the nearest dominant color
    for (let y = 0; y < colorMap.length; y++) {
      for (let x = 0; x < colorMap[y].length; x++) {
        const cellColor = colorMap[y][x];
        
        // Find nearest dominant color
        let nearestColor = dominantColors[0];
        let minDistance = Infinity;
        
        for (const domColor of dominantColors) {
          const distance = this.colorDistance(cellColor, domColor);
          if (distance < minDistance) {
            minDistance = distance;
            nearestColor = domColor;
          }
        }
        
        regions.push({
          gridX: x,
          gridY: y,
          cellColor: cellColor,
          dominantColor: nearestColor,
          distance: minDistance
        });
      }
    }
    
    return regions;
  }
  
  /**
   * Calculate Euclidean distance between two colors
   * @param {Object} color1 - First color {r, g, b}
   * @param {Object} color2 - Second color {r, g, b}
   * @returns {number} Color distance
   */
  colorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  
  /**
   * Get color for a specific particle position based on gradient data
   * @param {number} x - Particle x position (canvas coordinates)
   * @param {number} y - Particle y position (canvas coordinates)
   * @param {Object} gradientData - Gradient data from extractGradientData
   * @param {Object} canvasDimensions - Canvas dimensions {width, height}
   * @returns {Object} Interpolated color {r, g, b}
   */
  getColorAtPosition(x, y, gradientData, canvasDimensions) {
    const { colorMap, width, height } = gradientData;
    const gridRes = this.config.gridResolution;
    
    // Normalize position to image space
    const imageX = (x / canvasDimensions.width) * width;
    const imageY = (y / canvasDimensions.height) * height;
    
    // Convert to grid coordinates
    const gridX = Math.floor((imageX / width) * gridRes);
    const gridY = Math.floor((imageY / height) * gridRes);
    
    // Clamp to grid bounds
    const clampedX = Math.max(0, Math.min(gridRes - 1, gridX));
    const clampedY = Math.max(0, Math.min(gridRes - 1, gridY));
    
    // Return color from grid cell
    if (colorMap[clampedY] && colorMap[clampedY][clampedX]) {
      return colorMap[clampedY][clampedX];
    }
    
    // Fallback to white
    return { r: 255, g: 255, b: 255 };
  }
  
  /**
   * Apply gradient smoothing using neighboring cells
   * @param {Array} colorMap - 2D spatial color map
   * @returns {Array} Smoothed color map
   */
  smoothGradient(colorMap) {
    const smoothed = [];
    const radius = this.config.smoothingRadius;
    
    for (let y = 0; y < colorMap.length; y++) {
      const row = [];
      for (let x = 0; x < colorMap[y].length; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        // Average with neighbors
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < colorMap.length &&
                nx >= 0 && nx < colorMap[ny].length) {
              const neighbor = colorMap[ny][nx];
              r += neighbor.r;
              g += neighbor.g;
              b += neighbor.b;
              count++;
            }
          }
        }
        
        row.push({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
          x: x,
          y: y
        });
      }
      smoothed.push(row);
    }
    
    return smoothed;
  }
}
