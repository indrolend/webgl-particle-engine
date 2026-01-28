/**
 * WebGL Renderer for Particle Engine
 * Handles WebGL context initialization, shader compilation, and rendering
 * Supports both solid image rendering and particle rendering with smooth transitions
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.imageProgram = null;
    this.buffers = {};
    this.uniformLocations = {};
    this.imageUniformLocations = {};
    this.texture = null;
    this.imageLoaded = false;
    
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
    
    // Initialize canvas with white background
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Compile shaders and create programs
    this.createShaderProgram();
    this.createImageShaderProgram();
    
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
        // Render as SQUARE tiles (mosaic effect) instead of circles
        // Simply output the color without circular masking
        gl_FragColor = vec4(v_color.rgb, v_color.a);
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

  createImageShaderProgram() {
    console.log('[Renderer] Creating image shader program...');
    
    // Vertex shader for rendering solid image
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;
    
    // Fragment shader for rendering solid image with opacity control
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform sampler2D u_image;
      uniform float u_opacity;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_image, v_texCoord);
        gl_FragColor = vec4(texColor.rgb, texColor.a * u_opacity);
      }
    `;
    
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Create program
    this.imageProgram = this.gl.createProgram();
    this.gl.attachShader(this.imageProgram, vertexShader);
    this.gl.attachShader(this.imageProgram, fragmentShader);
    this.gl.linkProgram(this.imageProgram);
    
    if (!this.gl.getProgramParameter(this.imageProgram, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.imageProgram);
      console.error('[Renderer] Failed to link image shader program:', info);
      throw new Error('Failed to link image shader program: ' + info);
    }
    
    console.log('[Renderer] Image shader program created successfully');
    
    // Get attribute and uniform locations
    this.imagePositionLocation = this.gl.getAttribLocation(this.imageProgram, 'a_position');
    this.imageTexCoordLocation = this.gl.getAttribLocation(this.imageProgram, 'a_texCoord');
    this.imageUniformLocations.image = this.gl.getUniformLocation(this.imageProgram, 'u_image');
    this.imageUniformLocations.opacity = this.gl.getUniformLocation(this.imageProgram, 'u_opacity');
    
    // Create buffers for image rendering
    this.buffers.imagePosition = this.gl.createBuffer();
    this.buffers.imageTexCoord = this.gl.createBuffer();
    
    // Setup image quad vertices (full screen)
    const positions = new Float32Array([
      -1, -1,  // bottom left
       1, -1,  // bottom right
      -1,  1,  // top left
       1,  1,  // top right
    ]);
    
    const texCoords = new Float32Array([
      0, 1,  // bottom left
      1, 1,  // bottom right
      0, 0,  // top left
      1, 0,  // top right
    ]);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.imagePosition);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.imageTexCoord);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    
    console.log('[Renderer] Image buffers created');
  }

  loadImageTexture(image, particleSystemConfig = null) {
    console.log('[Renderer] Loading image texture...');
    
    const gl = this.gl;
    
    // Create texture if it doesn't exist
    if (!this.texture) {
      this.texture = gl.createTexture();
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // Update image quad size to match particle system sizing
    if (particleSystemConfig) {
      this.updateImageQuadSize(image, particleSystemConfig);
    }
    
    this.imageLoaded = true;
    console.log('[Renderer] Image texture loaded successfully');
  }

  updateImageQuadSize(image, config) {
    console.log('[Renderer] Updating image quad size to match particles...');
    
    // Calculate grid dimensions matching particle system logic
    const maxParticles = config.particleCount || 5000;
    const aspectRatio = image.width / image.height;
    let gridWidth, gridHeight;
    
    if (aspectRatio >= 1) {
      gridWidth = Math.floor(Math.sqrt(maxParticles * aspectRatio));
      gridHeight = Math.floor(gridWidth / aspectRatio);
    } else {
      gridHeight = Math.floor(Math.sqrt(maxParticles / aspectRatio));
      gridWidth = Math.floor(gridHeight * aspectRatio);
    }
    
    // Apply same constraints as ParticleSystem
    const MIN_GRID_DIMENSION = 10;
    const MAX_GRID_DIMENSION = 200;
    gridWidth = Math.max(MIN_GRID_DIMENSION, Math.min(gridWidth, MAX_GRID_DIMENSION));
    gridHeight = Math.max(MIN_GRID_DIMENSION, Math.min(gridHeight, MAX_GRID_DIMENSION));
    
    // Calculate scaling to match particle system
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const scaleX = canvasWidth / gridWidth;
    const scaleY = canvasHeight / gridHeight;
    const IMAGE_PADDING_FACTOR = 0.9;
    const scale = Math.min(scaleX, scaleY) * IMAGE_PADDING_FACTOR;
    
    const scaledWidth = gridWidth * scale;
    const scaledHeight = gridHeight * scale;
    
    // Convert to NDC (Normalized Device Coordinates: -1 to 1)
    const ndcWidth = (scaledWidth / canvasWidth) * 2;
    const ndcHeight = (scaledHeight / canvasHeight) * 2;
    
    // Center the quad
    const left = -ndcWidth / 2;
    const right = ndcWidth / 2;
    const bottom = -ndcHeight / 2;
    const top = ndcHeight / 2;
    
    // Update position buffer with new quad size
    const positions = new Float32Array([
      left, bottom,   // bottom left
      right, bottom,  // bottom right
      left, top,      // top left
      right, top,     // top right
    ]);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.imagePosition);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    
    console.log('[Renderer] Image quad size updated to match particles');
  }

  renderImage(opacity = 1.0) {
    if (!this.imageLoaded || !this.texture) {
      // Image not loaded yet, skip rendering
      return;
    }
    
    const gl = this.gl;
    
    // Use image shader program
    gl.useProgram(this.imageProgram);
    
    // Set opacity uniform
    gl.uniform1f(this.imageUniformLocations.opacity, opacity);
    
    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.imageUniformLocations.image, 0);
    
    // Setup position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.imagePosition);
    gl.enableVertexAttribArray(this.imagePositionLocation);
    gl.vertexAttribPointer(this.imagePositionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Setup texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.imageTexCoord);
    gl.enableVertexAttribArray(this.imageTexCoordLocation);
    gl.vertexAttribPointer(this.imageTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Draw the quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

  render(particles, options = {}) {
    const gl = this.gl;
    const { imageOpacity = 0, particleOpacity = 1 } = options;
    
    // Clear canvas with white background for hybrid transitions
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Render solid image if opacity > 0
    if (imageOpacity > 0 && this.imageLoaded) {
      this.renderImage(imageOpacity);
    }
    
    // Render particles if opacity > 0 and particles exist
    if (particleOpacity > 0 && particles.length > 0) {
      this.renderParticles(particles, particleOpacity);
    }
  }

  renderParticles(particles, globalOpacity = 1.0) {
    const gl = this.gl;
    
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
      colors[i * 4 + 3] = particle.alpha * globalOpacity;
      
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
    if (this.buffers.imagePosition) gl.deleteBuffer(this.buffers.imagePosition);
    if (this.buffers.imageTexCoord) gl.deleteBuffer(this.buffers.imageTexCoord);
    
    // Delete texture
    if (this.texture) gl.deleteTexture(this.texture);
    
    // Delete programs
    if (this.program) gl.deleteProgram(this.program);
    if (this.imageProgram) gl.deleteProgram(this.imageProgram);
    
    console.log('[Renderer] Cleanup complete');
  }
}
