/**
 * TriangulationRenderer - WebGL renderer for triangulated meshes
 * Renders morphing triangles with texture mapping
 */
export class TriangulationRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.textures = {};
    this.buffers = {};
    
    console.log('[TriangulationRenderer] Initializing...');
    this.init();
  }

  init() {
    // Get WebGL context (reuse if it exists)
    this.gl = this.canvas.getContext('webgl', { 
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    }) || this.canvas.getContext('experimental-webgl', {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });
    
    if (!this.gl) {
      console.error('[TriangulationRenderer] WebGL not supported');
      throw new Error('WebGL is not supported');
    }

    console.log('[TriangulationRenderer] WebGL context created');

    // Enable blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Create shader program
    this.createShaderProgram();
    
    // Create buffers
    this.createBuffers();
    
    console.log('[TriangulationRenderer] Initialization complete');
  }

  createShaderProgram() {
    console.log('[TriangulationRenderer] Creating shader program...');

    // Vertex shader for textured triangles
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      varying vec2 v_texCoord;
      
      void main() {
        // Apply transformation matrix
        vec3 position = u_matrix * vec3(a_position, 1.0);
        
        // Convert to clip space
        vec2 clipSpace = (position.xy / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader for texture mapping
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_alpha;
      
      varying vec2 v_texCoord;
      
      // Constants for coordinate validation
      const float COORD_MIN_THRESHOLD = -0.1;
      const float COORD_MAX_THRESHOLD = 1.1;
      const vec3 FALLBACK_COLOR = vec3(0.5, 0.5, 0.5);
      const float FALLBACK_ALPHA = 0.3;
      
      void main() {
        // Clamp texture coordinates to valid range [0, 1] to prevent artifacts
        vec2 clampedCoord = clamp(v_texCoord, 0.0, 1.0);
        
        // Check for invalid coordinates (out of reasonable bounds)
        // Note: NaN checks not available in WebGL 1.0, but clamping handles most cases
        if (any(lessThan(v_texCoord, vec2(COORD_MIN_THRESHOLD))) || any(greaterThan(v_texCoord, vec2(COORD_MAX_THRESHOLD)))) {
          // Render neutral gray for invalid coordinates instead of black
          gl_FragColor = vec4(FALLBACK_COLOR, u_alpha * FALLBACK_ALPHA);
        } else {
          vec4 texColor = texture2D(u_texture, clampedCoord);
          gl_FragColor = vec4(texColor.rgb, texColor.a * u_alpha);
        }
      }
    `;

    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.program);
      console.error('[TriangulationRenderer] Failed to link shader program:', info);
      throw new Error('Failed to link shader program');
    }

    // Get attribute and uniform locations
    this.locations = {
      position: this.gl.getAttribLocation(this.program, 'a_position'),
      texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord'),
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      matrix: this.gl.getUniformLocation(this.program, 'u_matrix'),
      texture: this.gl.getUniformLocation(this.program, 'u_texture'),
      alpha: this.gl.getUniformLocation(this.program, 'u_alpha')
    };

    console.log('[TriangulationRenderer] Shader program created successfully');
  }

  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      console.error('[TriangulationRenderer] Shader compilation failed:', info);
      this.gl.deleteShader(shader);
      throw new Error('Shader compilation failed');
    }

    return shader;
  }

  createBuffers() {
    this.buffers.position = this.gl.createBuffer();
    this.buffers.texCoord = this.gl.createBuffer();
    console.log('[TriangulationRenderer] Buffers created');
  }

  /**
   * Create texture from image
   * @param {HTMLImageElement} image 
   * @param {string} id - Texture identifier
   */
  createTexture(image, id) {
    console.log(`[TriangulationRenderer] Creating texture: ${id}`);
    
    // Validate image
    if (!image) {
      console.error(`[TriangulationRenderer] Invalid image provided for texture: ${id}`);
      return;
    }
    
    // Validate image dimensions
    if (!image.width || !image.height || image.width === 0 || image.height === 0) {
      console.error(`[TriangulationRenderer] Image has invalid dimensions: ${image.width}x${image.height}`);
      return;
    }
    
    // Check if image is loaded
    if (!image.complete) {
      console.warn(`[TriangulationRenderer] Image not fully loaded yet: ${id}`);
      console.warn(`[TriangulationRenderer] Skipping texture creation - ensure images are loaded before calling createTexture`);
      return;
    }
    
    console.log(`[TriangulationRenderer] Image validated: ${image.width}x${image.height}`);
    
    try {
      const texture = this.gl.createTexture();
      if (!texture) {
        console.error(`[TriangulationRenderer] Failed to create WebGL texture for: ${id}`);
        return;
      }
      
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      
      // Set texture parameters - use CLAMP_TO_EDGE to prevent wrapping artifacts
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      
      // Upload image to texture
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        image
      );
      
      // Check for WebGL errors
      const error = this.gl.getError();
      if (error !== this.gl.NO_ERROR) {
        console.error(`[TriangulationRenderer] WebGL error during texture creation: ${error}`);
        return;
      }
      
      this.textures[id] = {
        texture,
        width: image.width,
        height: image.height
      };
      
      console.log(`[TriangulationRenderer] Texture created successfully: ${id} (${image.width}x${image.height})`);
      console.log(`[TriangulationRenderer] Texture settings: CLAMP_TO_EDGE, LINEAR filtering`);
    } catch (error) {
      console.error(`[TriangulationRenderer] Exception during texture creation for ${id}:`, error);
      console.error(`[TriangulationRenderer] Stack trace:`, error.stack);
    }
  }

  /**
   * Render triangulated mesh with morphing
   * @param {Object} morphData - Triangulation morph data
   * @param {number} t - Interpolation factor (0 to 1)
   * @param {string} sourceTextureId - Source texture ID
   * @param {string} targetTextureId - Target texture ID
   */
  render(morphData, t, sourceTextureId, targetTextureId) {
    const { triangles, sourceKeyPoints, targetKeyPoints } = morphData;
    
    // Validate textures exist
    if (!this.textures[sourceTextureId]) {
      console.warn(`[TriangulationRenderer] Source texture not loaded: ${sourceTextureId}`);
      console.warn('[TriangulationRenderer] Available textures:', Object.keys(this.textures));
      return;
    }
    
    if (!this.textures[targetTextureId]) {
      console.warn(`[TriangulationRenderer] Target texture not loaded: ${targetTextureId}`);
      console.warn('[TriangulationRenderer] Available textures:', Object.keys(this.textures));
      return;
    }
    
    // Validate morphData
    if (!triangles || !sourceKeyPoints || !targetKeyPoints) {
      console.warn('[TriangulationRenderer] Invalid morph data');
      console.warn('[TriangulationRenderer] triangles:', triangles ? triangles.length : 'null');
      console.warn('[TriangulationRenderer] sourceKeyPoints:', sourceKeyPoints ? sourceKeyPoints.length : 'null');
      console.warn('[TriangulationRenderer] targetKeyPoints:', targetKeyPoints ? targetKeyPoints.length : 'null');
      return;
    }
    
    // Validate key point counts match
    if (sourceKeyPoints.length !== targetKeyPoints.length) {
      console.error('[TriangulationRenderer] Key point count mismatch:', sourceKeyPoints.length, 'vs', targetKeyPoints.length);
      return;
    }

    this.gl.useProgram(this.program);
    
    // Set resolution uniform
    this.gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    
    // Calculate interpolated positions
    const interpolatedPoints = sourceKeyPoints.map((sp, i) => {
      const tp = targetKeyPoints[i];
      return {
        x: sp.x + (tp.x - sp.x) * t,
        y: sp.y + (tp.y - sp.y) * t
      };
    });

    // Render source image with decreasing alpha
    if (t < 1.0) {
      this.renderMesh(
        triangles,
        interpolatedPoints,
        sourceKeyPoints,
        this.textures[sourceTextureId],
        1.0 - t
      );
    }

    // Render target image with increasing alpha
    if (t > 0.0) {
      this.renderMesh(
        triangles,
        interpolatedPoints,
        targetKeyPoints,
        this.textures[targetTextureId],
        t
      );
    }
  }

  /**
   * Render a single mesh
   * @param {Array} triangles - Triangle indices
   * @param {Array} positions - Current positions
   * @param {Array} texCoordPoints - Texture coordinate source points
   * @param {Object} textureInfo - Texture info
   * @param {number} alpha - Opacity
   */
  renderMesh(triangles, positions, texCoordPoints, textureInfo, alpha) {
    const { texture, width, height } = textureInfo;
    
    // Bind texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.locations.texture, 0);
    this.gl.uniform1f(this.locations.alpha, alpha);

    // Identity matrix (no transformation in this simple version)
    const matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.gl.uniformMatrix3fv(this.locations.matrix, false, matrix);

    // Build vertex data for all triangles
    const positionData = [];
    const texCoordData = [];
    let skippedTriangles = 0;

    for (const tri of triangles) {
      const [i0, i1, i2] = tri;
      
      // Validate triangle indices
      if (i0 >= positions.length || i1 >= positions.length || i2 >= positions.length ||
          i0 >= texCoordPoints.length || i1 >= texCoordPoints.length || i2 >= texCoordPoints.length) {
        console.warn(`[TriangulationRenderer] Invalid triangle indices: [${i0}, ${i1}, ${i2}], skipping`);
        skippedTriangles++;
        continue;
      }
      
      // Validate positions and texCoordPoints exist
      if (!positions[i0] || !positions[i1] || !positions[i2] ||
          !texCoordPoints[i0] || !texCoordPoints[i1] || !texCoordPoints[i2]) {
        console.warn(`[TriangulationRenderer] Missing position or texCoord data for triangle [${i0}, ${i1}, ${i2}], skipping`);
        skippedTriangles++;
        continue;
      }
      
      // Positions (interpolated world coordinates)
      positionData.push(
        positions[i0].x, positions[i0].y,
        positions[i1].x, positions[i1].y,
        positions[i2].x, positions[i2].y
      );
      
      // Texture coordinates (normalized 0-1) with clamping to ensure valid range
      const u0 = Math.max(0, Math.min(1, texCoordPoints[i0].x / width));
      const v0 = Math.max(0, Math.min(1, texCoordPoints[i0].y / height));
      const u1 = Math.max(0, Math.min(1, texCoordPoints[i1].x / width));
      const v1 = Math.max(0, Math.min(1, texCoordPoints[i1].y / height));
      const u2 = Math.max(0, Math.min(1, texCoordPoints[i2].x / width));
      const v2 = Math.max(0, Math.min(1, texCoordPoints[i2].y / height));
      
      texCoordData.push(u0, v0, u1, v1, u2, v2);
    }
    
    if (skippedTriangles > 0) {
      console.warn(`[TriangulationRenderer] Skipped ${skippedTriangles} invalid triangles out of ${triangles.length}`);
    }

    // Validate we have data to render
    if (positionData.length === 0 || texCoordData.length === 0) {
      console.warn('[TriangulationRenderer] No valid triangles to render');
      return;
    }
    
    // Validate data consistency
    if (positionData.length !== texCoordData.length) {
      console.error('[TriangulationRenderer] Position and texCoord data mismatch');
      return;
    }

    // Upload position data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positionData), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.position);
    this.gl.vertexAttribPointer(this.locations.position, 2, this.gl.FLOAT, false, 0, 0);

    // Upload texture coordinate data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoordData), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.texCoord);
    this.gl.vertexAttribPointer(this.locations.texCoord, 2, this.gl.FLOAT, false, 0, 0);

    // Draw triangles (vertices / 2 coordinates per vertex)
    const vertexCount = positionData.length / 2;
    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertexCount);
  }

  /**
   * Clear the canvas
   * @param {number} r - Red (0-1)
   * @param {number} g - Green (0-1)
   * @param {number} b - Blue (0-1)
   * @param {number} a - Alpha (0-1)
   */
  clear(r = 0, g = 0, b = 0, a = 1) {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Resize renderer
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    console.log(`[TriangulationRenderer] Resized to ${width}x${height}`);
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Delete textures
    for (const id in this.textures) {
      this.gl.deleteTexture(this.textures[id].texture);
    }
    this.textures = {};

    // Delete buffers
    for (const key in this.buffers) {
      this.gl.deleteBuffer(this.buffers[key]);
    }
    this.buffers = {};

    // Delete program
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }

    console.log('[TriangulationRenderer] Resources cleaned up');
  }
  
  /**
   * Debug utility: Get triangulation wireframe data for visualization
   * Returns data that can be rendered on a separate debug canvas
   * Note: Do not call this to render on the WebGL canvas as it would create a context conflict
   * 
   * @param {Array} triangles - Triangle indices
   * @param {Array} positions - Vertex positions
   * @returns {Object} Wireframe data {edges: [[x1, y1, x2, y2], ...], triangleCount: number}
   */
  getDebugWireframeData(triangles, positions) {
    if (!triangles || !positions || triangles.length === 0) {
      console.warn('[TriangulationRenderer] No triangulation data for debug wireframe');
      return { edges: [], triangleCount: 0 };
    }
    
    console.log(`[TriangulationRenderer] Generating debug wireframe data: ${triangles.length} triangles`);
    
    const edges = [];
    
    // Extract edges from each triangle
    for (const tri of triangles) {
      const [i0, i1, i2] = tri;
      
      if (i0 >= positions.length || i1 >= positions.length || i2 >= positions.length) {
        continue;
      }
      
      const p0 = positions[i0];
      const p1 = positions[i1];
      const p2 = positions[i2];
      
      if (!p0 || !p1 || !p2) {
        continue;
      }
      
      // Add three edges of the triangle
      edges.push([p0.x, p0.y, p1.x, p1.y]);
      edges.push([p1.x, p1.y, p2.x, p2.y]);
      edges.push([p2.x, p2.y, p0.x, p0.y]);
    }
    
    console.log('[TriangulationRenderer] Debug wireframe data generated:', edges.length, 'edges');
    return { edges, triangleCount: triangles.length };
  }
}
