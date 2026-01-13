/**
 * TriangulationMorph - Core triangulation-based image morphing system
 * Handles mesh generation, affine transformations, and morphing between images
 */
import { KeyPointManager } from './KeyPointManager.js';
import { DelaunayTriangulator } from './DelaunayTriangulator.js';

export class TriangulationMorph {
  constructor(config = {}) {
    this.config = {
      keyPointMethod: config.keyPointMethod || 'grid', // 'grid' or 'feature'
      gridSize: config.gridSize || 8,
      featurePointCount: config.featurePointCount || 64,
      ...config
    };
    
    this.keyPointManager = new KeyPointManager();
    this.triangulator = new DelaunayTriangulator();
    
    this.sourceImage = null;
    this.targetImage = null;
    this.sourceKeyPoints = [];
    this.targetKeyPoints = [];
    this.triangles = [];
    
    console.log('[TriangulationMorph] Initialized with config:', this.config);
  }

  /**
   * Set source and target images for morphing
   * @param {HTMLImageElement} sourceImage 
   * @param {HTMLImageElement} targetImage 
   */
  setImages(sourceImage, targetImage) {
    console.log('[TriangulationMorph] Setting source and target images');
    
    this.sourceImage = sourceImage;
    this.targetImage = targetImage;
    
    // Generate key points for both images
    this.generateKeyPoints();
    
    // Generate triangulation
    this.generateTriangulation();
  }

  /**
   * Generate key points for both images
   */
  generateKeyPoints() {
    if (!this.sourceImage || !this.targetImage) {
      console.error('[TriangulationMorph] Images not set');
      return;
    }

    console.log('[TriangulationMorph] Generating key points');

    // For simplicity, we use the same grid structure for both images
    // In a more advanced implementation, we could detect features independently
    if (this.config.keyPointMethod === 'grid') {
      this.sourceKeyPoints = this.keyPointManager.generateGridKeyPoints(
        this.sourceImage.width,
        this.sourceImage.height,
        this.config.gridSize
      );
      
      // Generate corresponding points for target image (scaled to target dimensions)
      const scaleX = this.targetImage.width / this.sourceImage.width;
      const scaleY = this.targetImage.height / this.sourceImage.height;
      
      this.targetKeyPoints = this.sourceKeyPoints.map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }));
    } else if (this.config.keyPointMethod === 'feature') {
      // Extract image data for feature detection
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Process source image
      canvas.width = this.sourceImage.width;
      canvas.height = this.sourceImage.height;
      ctx.drawImage(this.sourceImage, 0, 0);
      const sourceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      this.sourceKeyPoints = this.keyPointManager.generateFeatureKeyPoints(
        sourceImageData,
        this.config.featurePointCount
      );
      
      // Process target image
      canvas.width = this.targetImage.width;
      canvas.height = this.targetImage.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.targetImage, 0, 0);
      const targetImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      this.targetKeyPoints = this.keyPointManager.generateFeatureKeyPoints(
        targetImageData,
        this.config.featurePointCount
      );
    }

    console.log(`[TriangulationMorph] Generated ${this.sourceKeyPoints.length} key points`);
  }

  /**
   * Generate Delaunay triangulation from key points
   */
  generateTriangulation() {
    if (this.sourceKeyPoints.length === 0) {
      console.error('[TriangulationMorph] No key points available');
      return;
    }

    console.log('[TriangulationMorph] Generating triangulation');
    this.triangles = this.triangulator.triangulate(this.sourceKeyPoints);
    console.log(`[TriangulationMorph] Generated ${this.triangles.length} triangles`);
  }

  /**
   * Calculate affine transformation matrix from source triangle to target triangle
   * @param {Array} srcTri - Source triangle points [[x1,y1], [x2,y2], [x3,y3]]
   * @param {Array} dstTri - Destination triangle points [[x1,y1], [x2,y2], [x3,y3]]
   * @returns {Array} 3x3 transformation matrix
   */
  calculateAffineTransform(srcTri, dstTri) {
    // Convert to homogeneous coordinates and solve for transformation matrix
    const [[x1, y1], [x2, y2], [x3, y3]] = srcTri;
    const [[u1, v1], [u2, v2], [u3, v3]] = dstTri;

    // Create matrix equation: [dst] = M * [src]
    // M = [a b c]
    //     [d e f]
    //     [0 0 1]

    const det = (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    
    if (Math.abs(det) < 1e-10) {
      // Degenerate triangle, return identity
      return [1, 0, 0, 0, 1, 0];
    }

    const a = ((u1 - u3) * (y2 - y3) - (u2 - u3) * (y1 - y3)) / det;
    const b = ((x1 - x3) * (u2 - u3) - (x2 - x3) * (u1 - u3)) / det;
    const c = u3 - a * x3 - b * y3;

    const d = ((v1 - v3) * (y2 - y3) - (v2 - v3) * (y1 - y3)) / det;
    const e = ((x1 - x3) * (v2 - v3) - (x2 - x3) * (v1 - v3)) / det;
    const f = v3 - d * x3 - e * y3;

    return [a, b, c, d, e, f];
  }

  /**
   * Get interpolated key points for morphing animation
   * @param {number} t - Interpolation factor (0 = source, 1 = target)
   * @returns {Array} Interpolated key points
   */
  getInterpolatedKeyPoints(t) {
    if (this.sourceKeyPoints.length !== this.targetKeyPoints.length) {
      console.error('[TriangulationMorph] Key point count mismatch');
      return this.sourceKeyPoints;
    }

    return this.sourceKeyPoints.map((srcPoint, i) => {
      const tgtPoint = this.targetKeyPoints[i];
      return {
        x: srcPoint.x + (tgtPoint.x - srcPoint.x) * t,
        y: srcPoint.y + (tgtPoint.y - srcPoint.y) * t
      };
    });
  }

  /**
   * Get triangulation data for rendering
   * @returns {Object} { triangles, keyPoints }
   */
  getTriangulationData() {
    return {
      triangles: this.triangles,
      sourceKeyPoints: this.sourceKeyPoints,
      targetKeyPoints: this.targetKeyPoints
    };
  }

  /**
   * Update configuration
   * @param {Object} newConfig 
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[TriangulationMorph] Config updated:', this.config);
    
    // Regenerate if images are set
    if (this.sourceImage && this.targetImage) {
      this.generateKeyPoints();
      this.generateTriangulation();
    }
  }
}
