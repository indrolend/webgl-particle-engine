/**
 * MeshRenderer - WebGL renderer for elastic mesh with textured triangles
 * 
 * Features:
 * - Textured triangle mesh rendering
 * - Cross-fading between source and target textures
 * - Debug visualization (mesh lines, vertices)
 * - Efficient batched rendering
 */

export class MeshRenderer {
  /**
   * Create mesh renderer
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {Object} config - Renderer configuration
   */
  constructor(gl, config = {}) {
    this.gl = gl;
    this.config = {
      showMesh: config.showMesh || false,
      showVertices: config.showVertices || false,
      meshLineWidth: config.meshLineWidth || 1,
      vertexSize: config.vertexSize || 3,
      ...config
    };

    this.sourceTexture = null;
    this.targetTexture = null;
    this.crossfadeProgress = 0;

    this.initShaders();
    this.initBuffers();
    
    console.log('[MeshRenderer] Initialized');
  }

  /**
   * Initialize WebGL shaders
   */
  initShaders() {
    const gl = this.gl;

    // Vertex shader for textured mesh
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        // Convert from pixel coordinates to clip space (-1 to 1)
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;

    // Fragment shader for textured mesh with crossfade
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform sampler2D u_sourceTexture;
      uniform sampler2D u_targetTexture;
      uniform float u_crossfade;
      uniform bool u_hasTexture;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        if (u_hasTexture) {
          vec4 sourceColor = texture2D(u_sourceTexture, v_texCoord);
          vec4 targetColor = texture2D(u_targetTexture, v_texCoord);
          gl_FragColor = mix(sourceColor, targetColor, u_crossfade);
        } else {
          gl_FragColor = v_color;
        }
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('[MeshRenderer] Program link failed:', gl.getProgramInfoLog(this.program));
      return;
    }

    // Get attribute and uniform locations
    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      sourceTexture: gl.getUniformLocation(this.program, 'u_sourceTexture'),
      targetTexture: gl.getUniformLocation(this.program, 'u_targetTexture'),
      crossfade: gl.getUniformLocation(this.program, 'u_crossfade'),
      hasTexture: gl.getUniformLocation(this.program, 'u_hasTexture')
    };
  }

  /**
   * Compile a WebGL shader
   * @param {number} type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param {string} source - Shader source code
   * @returns {WebGLShader} - Compiled shader
   */
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[MeshRenderer] Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Initialize vertex buffers
   */
  initBuffers() {
    const gl = this.gl;

    this.positionBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
  }

  /**
   * Load image as WebGL texture
   * @param {HTMLImageElement} image - Image to load
   * @param {string} slot - 'source' or 'target'
   */
  loadTexture(image, slot = 'source') {
    const gl = this.gl;
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (slot === 'source') {
      this.sourceTexture = texture;
    } else {
      this.targetTexture = texture;
    }

    console.log(`[MeshRenderer] Loaded ${slot} texture`);
  }

  /**
   * Render the elastic mesh
   * @param {ElasticMesh} mesh - The mesh to render
   * @param {number} crossfadeProgress - Crossfade progress (0-1)
   */
  render(mesh, crossfadeProgress = 0) {
    const gl = this.gl;
    this.crossfadeProgress = crossfadeProgress;

    // Clear canvas
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render textured triangles
    if (this.sourceTexture) {
      this.renderTexturedMesh(mesh);
    }

    // Render debug overlays
    if (this.config.showMesh) {
      this.renderMeshLines(mesh);
    }

    if (this.config.showVertices) {
      this.renderVertices(mesh);
    }
  }

  /**
   * Render textured mesh triangles
   * @param {ElasticMesh} mesh - The mesh to render
   */
  renderTexturedMesh(mesh) {
    const gl = this.gl;
    
    // Build triangle data from springs
    const positions = [];
    const texCoords = [];
    const colors = [];

    // Create triangles from the mesh grid
    // For each quad in the grid, create two triangles
    const vertexMap = new Map();
    mesh.vertices.forEach(v => {
      vertexMap.set(`${v.row},${v.col}`, v);
    });

    for (const vertex of mesh.vertices) {
      const { row, col } = vertex;
      
      // Try to form a quad with neighbors
      const v1 = vertex;
      const v2 = vertexMap.get(`${row},${col + 1}`);
      const v3 = vertexMap.get(`${row + 1},${col + 1}`);
      const v4 = vertexMap.get(`${row + 1},${col}`);

      if (v2 && v3 && v4) {
        // Triangle 1: v1, v2, v3
        this.addTriangle(positions, texCoords, colors, v1, v2, v3);
        // Triangle 2: v1, v3, v4
        this.addTriangle(positions, texCoords, colors, v1, v3, v4);
      }
    }

    if (positions.length === 0) return;

    // Use shader program
    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform2f(this.locations.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.locations.crossfade, this.crossfadeProgress);
    gl.uniform1i(this.locations.hasTexture, 1);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.uniform1i(this.locations.sourceTexture, 0);

    if (this.targetTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
      gl.uniform1i(this.locations.targetTexture, 1);
    }

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.texCoord);
    gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.color);
    gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

    // Draw triangles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  }

  /**
   * Add a triangle to the rendering buffers
   * @param {Array} positions - Position array
   * @param {Array} texCoords - Texture coordinate array
   * @param {Array} colors - Color array
   * @param {Object} v1 - First vertex
   * @param {Object} v2 - Second vertex
   * @param {Object} v3 - Third vertex
   */
  addTriangle(positions, texCoords, colors, v1, v2, v3) {
    // Positions
    positions.push(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
    
    // Texture coordinates
    texCoords.push(v1.u, v1.v, v2.u, v2.v, v3.u, v3.v);
    
    // Colors (for fallback rendering)
    colors.push(
      v1.color.r, v1.color.g, v1.color.b, v1.color.a,
      v2.color.r, v2.color.g, v2.color.b, v2.color.a,
      v3.color.r, v3.color.g, v3.color.b, v3.color.a
    );
  }

  /**
   * Render mesh lines for debugging
   * @param {ElasticMesh} mesh - The mesh to render
   */
  renderMeshLines(mesh) {
    // Use 2D context for debug rendering (simpler)
    const canvas = this.gl.canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = this.config.meshLineWidth;

    for (const spring of mesh.springs) {
      if (!spring.active) continue;

      ctx.beginPath();
      ctx.moveTo(spring.v1.x, spring.v1.y);
      ctx.lineTo(spring.v2.x, spring.v2.y);
      ctx.stroke();
    }

    // Draw broken springs in red
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    for (const spring of mesh.brokenSprings) {
      ctx.beginPath();
      ctx.moveTo(spring.v1.x, spring.v1.y);
      ctx.lineTo(spring.v2.x, spring.v2.y);
      ctx.stroke();
    }
  }

  /**
   * Render vertices for debugging
   * @param {ElasticMesh} mesh - The mesh to render
   */
  renderVertices(mesh) {
    const canvas = this.gl.canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';

    for (const vertex of mesh.vertices) {
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, this.config.vertexSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  /**
   * Clean up WebGL resources
   */
  dispose() {
    const gl = this.gl;
    
    if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);
    if (this.targetTexture) gl.deleteTexture(this.targetTexture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.program) gl.deleteProgram(this.program);
    
    console.log('[MeshRenderer] Disposed');
  }
}
