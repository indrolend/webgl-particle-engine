/**
 * BlobRenderer - Renders blobs with filled interiors and outline particles
 * 
 * Key Features:
 * - Renders filled blob interiors using triangles
 * - Renders outline particles as circles
 * - Supports smooth transitions
 * - Handles both blob fill and particle outline rendering
 */
export class BlobRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.particleProgram = null;
    this.fillProgram = null;
    this.buffers = {};
    
    this.init();
  }
  
  init() {
    console.log('[BlobRenderer] Initializing WebGL context...');
    
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('[BlobRenderer] WebGL not supported');
      throw new Error('WebGL is not supported in this browser');
    }
    
    console.log('[BlobRenderer] WebGL context created successfully');
    
    // Set viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Enable blending for smooth edges
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Initialize canvas with white background
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Create shader programs
    this.createParticleShaderProgram();
    this.createFillShaderProgram();
    
    console.log('[BlobRenderer] Initialization complete');
  }
  
  /**
   * Create shader program for rendering outline particles
   */
  createParticleShaderProgram() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      
      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        // Render as circles with soft edges
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        float alpha = smoothstep(0.5, 0.3, dist);
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;
    
    this.particleProgram = this.createProgram(vertexShaderSource, fragmentShaderSource);
    
    // Get locations
    this.particleLocations = {
      position: this.gl.getAttribLocation(this.particleProgram, 'a_position'),
      color: this.gl.getAttribLocation(this.particleProgram, 'a_color'),
      size: this.gl.getAttribLocation(this.particleProgram, 'a_size'),
      resolution: this.gl.getUniformLocation(this.particleProgram, 'u_resolution')
    };
    
    // Create buffers
    this.buffers.particlePosition = this.gl.createBuffer();
    this.buffers.particleColor = this.gl.createBuffer();
    this.buffers.particleSize = this.gl.createBuffer();
  }
  
  /**
   * Create shader program for rendering filled blob interiors
   */
  createFillShaderProgram() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      
      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;
    
    this.fillProgram = this.createProgram(vertexShaderSource, fragmentShaderSource);
    
    // Get locations
    this.fillLocations = {
      position: this.gl.getAttribLocation(this.fillProgram, 'a_position'),
      color: this.gl.getAttribLocation(this.fillProgram, 'a_color'),
      resolution: this.gl.getUniformLocation(this.fillProgram, 'u_resolution')
    };
    
    // Create buffers
    this.buffers.fillPosition = this.gl.createBuffer();
    this.buffers.fillColor = this.gl.createBuffer();
  }
  
  /**
   * Helper to create and link shader program
   */
  createProgram(vertexSource, fragmentSource) {
    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error('Failed to link shader program: ' + info);
    }
    
    return program;
  }
  
  /**
   * Compile a shader
   */
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('Failed to compile shader: ' + info);
    }
    
    return shader;
  }
  
  /**
   * Render blobs (filled interiors + outline particles)
   */
  renderBlobs(blobSystem) {
    // Clear canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // First render filled blob interiors
    this.renderBlobFills(blobSystem);
    
    // Then render outline particles on top
    this.renderOutlineParticles(blobSystem);
  }
  
  /**
   * Render filled blob interiors
   */
  renderBlobFills(blobSystem) {
    const triangles = blobSystem.getAllTriangles();
    if (triangles.length === 0) return;
    
    // Prepare data arrays
    const positions = [];
    const colors = [];
    
    for (const triangle of triangles) {
      // Add triangle vertices
      positions.push(...triangle.vertices);
      
      // Add color for each vertex
      for (let i = 0; i < 3; i++) {
        colors.push(...triangle.color);
      }
    }
    
    // Use fill shader program
    this.gl.useProgram(this.fillProgram);
    
    // Set resolution uniform
    this.gl.uniform2f(this.fillLocations.resolution, this.canvas.width, this.canvas.height);
    
    // Bind and fill position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.fillPosition);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.fillLocations.position);
    this.gl.vertexAttribPointer(this.fillLocations.position, 2, this.gl.FLOAT, false, 0, 0);
    
    // Bind and fill color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.fillColor);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.fillLocations.color);
    this.gl.vertexAttribPointer(this.fillLocations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    // Draw triangles
    this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length / 2);
  }
  
  /**
   * Render outline particles
   */
  renderOutlineParticles(blobSystem) {
    const particles = blobSystem.getAllOutlineParticles();
    if (particles.length === 0) return;
    
    // Prepare data arrays
    const positions = [];
    const colors = [];
    const sizes = [];
    
    for (const particle of particles) {
      positions.push(particle.x, particle.y);
      colors.push(particle.r, particle.g, particle.b, particle.alpha || 1.0);
      sizes.push(particle.size || 10);
    }
    
    // Use particle shader program
    this.gl.useProgram(this.particleProgram);
    
    // Set resolution uniform
    this.gl.uniform2f(this.particleLocations.resolution, this.canvas.width, this.canvas.height);
    
    // Bind and fill position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.particlePosition);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.particleLocations.position);
    this.gl.vertexAttribPointer(this.particleLocations.position, 2, this.gl.FLOAT, false, 0, 0);
    
    // Bind and fill color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.particleColor);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.particleLocations.color);
    this.gl.vertexAttribPointer(this.particleLocations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    // Bind and fill size buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.particleSize);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.particleLocations.size);
    this.gl.vertexAttribPointer(this.particleLocations.size, 1, this.gl.FLOAT, false, 0, 0);
    
    // Draw points
    this.gl.drawArrays(this.gl.POINTS, 0, particles.length);
  }
}
