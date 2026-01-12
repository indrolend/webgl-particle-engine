/**
 * WebGL Renderer for Particle Engine
 * Handles WebGL context initialization, shader compilation, and rendering
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.buffers = {};
    this.uniformLocations = {};
    
    this.init();
  }

  init() {
    console.log('[Renderer] Initializing WebGL context...');
    
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('[Renderer] WebGL not supported');
      throw new Error('WebGL is not supported in this browser');
    }
    
    console.log('[Renderer] WebGL context created successfully');
    
    // Set viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Enable blending for particle effects
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Compile shaders and create program
    this.createShaderProgram();
    
    console.log('[Renderer] Initialization complete');
  }

  createShaderProgram() {
    console.log('[Renderer] Creating shader program...');
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      
      void main() {
        // Convert from pixel coordinates to clip space (-1 to 1)
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;
    
    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      
      void main() {
        // Create circular particles
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }
        
        // Soft edges
        float alpha = v_color.a * (1.0 - smoothstep(0.3, 0.5, dist));
        gl_FragColor = vec4(v_color.rgb, alpha);
      }
    `;
    
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Create program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.program);
      console.error('[Renderer] Failed to link shader program:', info);
      throw new Error('Failed to link shader program: ' + info);
    }
    
    console.log('[Renderer] Shader program created successfully');
    
    // Get attribute and uniform locations
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.colorLocation = this.gl.getAttribLocation(this.program, 'a_color');
    this.sizeLocation = this.gl.getAttribLocation(this.program, 'a_size');
    this.uniformLocations.resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    
    // Create buffers
    this.buffers.position = this.gl.createBuffer();
    this.buffers.color = this.gl.createBuffer();
    this.buffers.size = this.gl.createBuffer();
    
    console.log('[Renderer] Buffers created');
  }

  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      const shaderType = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      console.error(`[Renderer] Failed to compile ${shaderType} shader:`, info);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile ${shaderType} shader: ` + info);
    }
    
    return shader;
  }

  render(particles) {
    const gl = this.gl;
    
    // Clear canvas
    gl.clearColor(0.05, 0.05, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (particles.length === 0) {
      return;
    }
    
    // Use program
    gl.useProgram(this.program);
    
    // Set resolution uniform
    gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
    
    // Prepare data arrays
    const positions = new Float32Array(particles.length * 2);
    const colors = new Float32Array(particles.length * 4);
    const sizes = new Float32Array(particles.length);
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      positions[i * 2] = particle.x;
      positions[i * 2 + 1] = particle.y;
      
      colors[i * 4] = particle.r;
      colors[i * 4 + 1] = particle.g;
      colors[i * 4 + 2] = particle.b;
      colors[i * 4 + 3] = particle.alpha;
      
      sizes[i] = particle.size;
    }
    
    // Update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.colorLocation);
    gl.vertexAttribPointer(this.colorLocation, 4, gl.FLOAT, false, 0, 0);
    
    // Update size buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.sizeLocation);
    gl.vertexAttribPointer(this.sizeLocation, 1, gl.FLOAT, false, 0, 0);
    
    // Draw particles
    gl.drawArrays(gl.POINTS, 0, particles.length);
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    console.log(`[Renderer] Resized to ${width}x${height}`);
  }

  destroy() {
    console.log('[Renderer] Cleaning up resources...');
    
    const gl = this.gl;
    
    // Delete buffers
    if (this.buffers.position) gl.deleteBuffer(this.buffers.position);
    if (this.buffers.color) gl.deleteBuffer(this.buffers.color);
    if (this.buffers.size) gl.deleteBuffer(this.buffers.size);
    
    // Delete program
    if (this.program) gl.deleteProgram(this.program);
    
    console.log('[Renderer] Cleanup complete');
  }
}
