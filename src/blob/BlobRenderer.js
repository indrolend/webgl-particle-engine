/**
 * BlobRenderer - Organic blob/metaball rendering system
 * 
 * Renders particles as connected blob meshes with surface tension
 * Uses marching squares algorithm to generate smooth organic boundaries
 * Supports multiple independent blobs for splitting/merging effects
 */

export class BlobRenderer {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.buffers = {};
    this.uniformLocations = {};
    
    // Blob rendering configuration
    this.config = {
      threshold: 0.5,                                 // Lower threshold for more visible blobs (was 1.0)
      influenceRadius: config.influenceRadius || 40,  // Smaller radius for better-sized blobs (was 80)
      resolution: config.resolution || 3,             // Finer resolution for smoother edges (was 4)
      surfaceTension: config.surfaceTension || 0.5,   // Surface smoothness (0-1)
      fillOpacity: config.fillOpacity || 0.95,        // Higher opacity for visibility (was 0.85)
      edgeSoftness: config.edgeSoftness || 0.15,      // Edge fade amount
      ...config
    };
    
    // Marching squares lookup table for edge generation
    this.initMarchingSquaresTable();
    
    // Spatial grid for blob detection and splitting
    this.spatialGrid = new Map();
    this.blobs = []; // Array of independent blob groups
    
    console.log('[BlobRenderer] Initializing blob rendering system...');
    this.init();
  }
  
  init() {
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('[BlobRenderer] WebGL not supported');
      throw new Error('WebGL is not supported');
    }
    
    console.log('[BlobRenderer] WebGL context created');
    
    // Enable blending for organic appearance
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Create shader program
    this.createShaderProgram();
    
    console.log('[BlobRenderer] Initialization complete');
  }
  
  /**
   * Initialize marching squares lookup table
   * Maps 4-corner configurations to edge vertices
   */
  initMarchingSquaresTable() {
    // Marching squares creates 16 possible configurations (2^4 corners)
    // Each configuration defines edges connecting corners
    this.marchingSquaresTable = [
      [], // 0000 - no edges
      [[0, 3]], // 0001 - bottom-left
      [[0, 1]], // 0010 - top-left
      [[1, 3]], // 0011 - left edge
      [[1, 2]], // 0100 - top-right
      [[0, 1], [2, 3]], // 0101 - diagonal
      [[0, 2]], // 0110 - top edge
      [[2, 3]], // 0111 - top-right corner out
      [[2, 3]], // 1000 - bottom-right
      [[0, 2]], // 1001 - right edge
      [[0, 3], [1, 2]], // 1010 - diagonal
      [[1, 2]], // 1011 - bottom-left corner out
      [[1, 3]], // 1100 - bottom edge
      [[0, 1]], // 1101 - bottom-right corner out
      [[0, 3]], // 1110 - top-left corner out
      []  // 1111 - all inside, no edges
    ];
  }
  
  /**
   * Create WebGL shader program for blob rendering
   */
  createShaderProgram() {
    console.log('[BlobRenderer] Creating blob shader program...');
    
    // Vertex shader for blob mesh
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_intensity; // Surface field intensity
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      varying float v_intensity;
      
      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
        v_intensity = a_intensity;
      }
    `;
    
    // Fragment shader with smooth edges and surface tension effect
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying float v_intensity;
      
      uniform float u_edgeSoftness;
      
      void main() {
        // Smooth edge falloff based on intensity
        float alpha = smoothstep(0.0, u_edgeSoftness, v_intensity);
        alpha = alpha * v_color.a;
        
        // Apply color with smooth alpha
        gl_FragColor = vec4(v_color.rgb, alpha);
      }
    `;
    
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Create and link program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('[BlobRenderer] Program linking failed:', this.gl.getProgramInfoLog(this.program));
      throw new Error('Failed to link blob shader program');
    }
    
    // Get attribute and uniform locations
    this.attribLocations = {
      position: this.gl.getAttribLocation(this.program, 'a_position'),
      color: this.gl.getAttribLocation(this.program, 'a_color'),
      intensity: this.gl.getAttribLocation(this.program, 'a_intensity')
    };
    
    this.uniformLocations = {
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      edgeSoftness: this.gl.getUniformLocation(this.program, 'u_edgeSoftness')
    };
    
    // Create buffers
    this.createBuffers();
    
    console.log('[BlobRenderer] Blob shader program created successfully');
  }
  
  /**
   * Compile a shader
   */
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('[BlobRenderer] Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      throw new Error('Failed to compile blob shader');
    }
    
    return shader;
  }
  
  /**
   * Create WebGL buffers
   */
  createBuffers() {
    this.buffers.position = this.gl.createBuffer();
    this.buffers.color = this.gl.createBuffer();
    this.buffers.intensity = this.gl.createBuffer();
    
    console.log('[BlobRenderer] Buffers created');
  }
  
  /**
   * Calculate metaball field value at a point
   * Sum of influence from all particles with improved formula for liquid-like appearance
   */
  calculateFieldValue(x, y, particles) {
    let fieldValue = 0;
    const radius = this.config.influenceRadius;
    const radiusSq = radius * radius;
    
    for (const particle of particles) {
      const dx = x - particle.x;
      const dy = y - particle.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < radiusSq && distSq > 0.1) {
        // Improved metaball formula for smoother, more liquid-like blobs
        // Using a falloff curve that creates better blob shapes
        const dist = Math.sqrt(distSq);
        const normalizedDist = dist / radius;
        
        // Smooth falloff function (1 - normalized distance)^3
        // This creates more organic, flowing blob boundaries
        const falloff = Math.pow(1 - normalizedDist, 3);
        const particleSize = (particle.size || 1.0);
        
        fieldValue += falloff * particleSize * 2.0; // Increased multiplier for stronger field
      }
    }
    
    return fieldValue;
  }
  
  /**
   * Detect and group particles into separate blobs using flood fill
   */
  detectBlobs(particles) {
    if (!particles || particles.length === 0) return [];
    
    const visited = new Set();
    const blobs = [];
    const connectionThreshold = this.config.influenceRadius * 1.5;
    
    // Helper: check if two particles are connected
    const areConnected = (p1, p2) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < connectionThreshold;
    };
    
    // Flood fill to find connected components
    const floodFill = (startIdx) => {
      const blob = [];
      const queue = [startIdx];
      visited.add(startIdx);
      
      while (queue.length > 0) {
        const idx = queue.shift();
        blob.push(particles[idx]);
        
        // Check all other particles for connections
        for (let i = 0; i < particles.length; i++) {
          if (!visited.has(i) && areConnected(particles[idx], particles[i])) {
            visited.add(i);
            queue.push(i);
          }
        }
      }
      
      return blob;
    };
    
    // Find all blobs
    for (let i = 0; i < particles.length; i++) {
      if (!visited.has(i)) {
        const blob = floodFill(i);
        if (blob.length > 0) {
          blobs.push(blob);
        }
      }
    }
    
    return blobs;
  }
  
  /**
   * Generate blob mesh using marching squares algorithm
   */
  generateBlobMesh(particles) {
    if (!particles || particles.length === 0) {
      return { vertices: [], colors: [], intensities: [] };
    }
    
    const vertices = [];
    const colors = [];
    const intensities = [];
    
    // Find bounding box of particles
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const p of particles) {
      minX = Math.min(minX, p.x - this.config.influenceRadius);
      minY = Math.min(minY, p.y - this.config.influenceRadius);
      maxX = Math.max(maxX, p.x + this.config.influenceRadius);
      maxY = Math.max(maxY, p.y + this.config.influenceRadius);
    }
    
    // Ensure bounds are within canvas
    minX = Math.max(0, minX);
    minY = Math.max(0, minY);
    maxX = Math.min(this.canvas.width, maxX);
    maxY = Math.min(this.canvas.height, maxY);
    
    const gridRes = this.config.resolution;
    
    // Calculate average color of blob
    let avgR = 0, avgG = 0, avgB = 0, avgAlpha = 0;
    for (const p of particles) {
      avgR += p.r || 0;
      avgG += p.g || 0;
      avgB += p.b || 0;
      avgAlpha += p.alpha || 1;
    }
    avgR /= particles.length;
    avgG /= particles.length;
    avgB /= particles.length;
    avgAlpha /= particles.length;
    
    // March through grid and generate mesh
    for (let gy = minY; gy < maxY - gridRes; gy += gridRes) {
      for (let gx = minX; gx < maxX - gridRes; gx += gridRes) {
        // Sample field at 4 corners of grid cell
        const corners = [
          { x: gx, y: gy },           // Top-left
          { x: gx + gridRes, y: gy }, // Top-right
          { x: gx + gridRes, y: gy + gridRes }, // Bottom-right
          { x: gx, y: gy + gridRes }  // Bottom-left
        ];
        
        const fieldValues = corners.map(c => this.calculateFieldValue(c.x, c.y, particles));
        
        // Calculate average field value
        const avgField = (fieldValues[0] + fieldValues[1] + fieldValues[2] + fieldValues[3]) / 4;
        
        // Fill cells that are inside the blob (avgField above threshold)
        // This creates the filled blob appearance
        if (avgField > this.config.threshold * 0.3) {
          const cellVertices = this.generateCellGeometry(
            gx, gy, gridRes, fieldValues, avgR, avgG, avgB, avgAlpha
          );
          
          vertices.push(...cellVertices.positions);
          colors.push(...cellVertices.colors);
          intensities.push(...cellVertices.intensities);
        }
      }
    }
    
    return { vertices, colors, intensities };
  }
  
  /**
   * Generate geometry for a single marching squares cell
   * Creates filled blob appearance with smooth edges
   */
  generateCellGeometry(x, y, size, fieldValues, r, g, b, alpha) {
    const positions = [];
    const colors = [];
    const intensities = [];
    
    // Cell center for filling
    const cx = x + size / 2;
    const cy = y + size / 2;
    
    // Calculate average field value
    const avgField = (fieldValues[0] + fieldValues[1] + fieldValues[2] + fieldValues[3]) / 4;
    
    // If field is significantly above threshold, fill this cell
    // Using a lower threshold multiplier (0.3) to capture more of the blob
    if (avgField > this.config.threshold * 0.3) {
      // Create two triangles for a filled quad
      // Triangle 1: top-left, top-right, bottom-right
      positions.push(x, y, x + size, y, x + size, y + size);
      // Triangle 2: top-left, bottom-right, bottom-left
      positions.push(x, y, x + size, y + size, x, y + size);
      
      // Calculate intensity based on field strength
      // Higher field = more opaque
      const intensity = Math.min(avgField / this.config.threshold, 1.0);
      const cellAlpha = alpha * this.config.fillOpacity * intensity;
      
      // Apply color and intensity for all 6 vertices
      for (let i = 0; i < 6; i++) {
        colors.push(r, g, b, cellAlpha);
        intensities.push(intensity);
      }
    }
    
    return { positions, colors, intensities };
  }
  
  /**
   * Render blobs from particles
   * Uses a hybrid approach: render particle cores first, then blend with metaball surface
   */
  render(particles, canvasWidth, canvasHeight) {
    if (!particles || particles.length === 0) return;
    
    // Detect separate blobs
    this.blobs = this.detectBlobs(particles);
    
    // Clear canvas to black opaque background
    this.gl.viewport(0, 0, canvasWidth, canvasHeight);
    this.gl.clearColor(0, 0, 0, 1); // Black background
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use the shader program
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uniformLocations.resolution, canvasWidth, canvasHeight);
    this.gl.uniform1f(this.uniformLocations.edgeSoftness, this.config.edgeSoftness);
    
    // First pass: Render all particles as circles to establish blob cores
    this.renderParticleCircles(particles, canvasWidth, canvasHeight);
    
    // Second pass: Render each blob mesh for smooth organic boundaries
    for (const blob of this.blobs) {
      this.renderBlob(blob, canvasWidth, canvasHeight);
    }
  }
  
  /**
   * Render particles as filled circles to create blob cores
   */
  renderParticleCircles(particles, canvasWidth, canvasHeight) {
    const vertices = [];
    const colors = [];
    const intensities = [];
    
    const circleRes = 16; // Number of segments per circle
    const radius = this.config.influenceRadius * 0.5; // Circle radius
    
    for (const p of particles) {
      const r = p.r || 1.0;
      const g = p.g || 1.0;
      const b = p.b || 1.0;
      const alpha = (p.alpha || 1.0) * this.config.fillOpacity;
      
      // Generate circle as triangle fan
      const cx = p.x;
      const cy = p.y;
      
      for (let i = 0; i < circleRes; i++) {
        const angle1 = (i / circleRes) * Math.PI * 2;
        const angle2 = ((i + 1) / circleRes) * Math.PI * 2;
        
        // Triangle: center, point1, point2
        vertices.push(cx, cy);
        vertices.push(cx + Math.cos(angle1) * radius, cy + Math.sin(angle1) * radius);
        vertices.push(cx + Math.cos(angle2) * radius, cy + Math.sin(angle2) * radius);
        
        // Colors for each vertex
        for (let j = 0; j < 3; j++) {
          colors.push(r, g, b, alpha);
          intensities.push(1.0);
        }
      }
    }
    
    if (vertices.length === 0) return;
    
    // Upload and render
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.position);
    this.gl.vertexAttribPointer(this.attribLocations.position, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.color);
    this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.intensity);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(intensities), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.intensity);
    this.gl.vertexAttribPointer(this.attribLocations.intensity, 1, this.gl.FLOAT, false, 0, 0);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
  }
  
  /**
   * Render a single blob
   */
  renderBlob(particles, canvasWidth, canvasHeight) {
    if (particles.length === 0) return;
    
    // Generate blob mesh
    const mesh = this.generateBlobMesh(particles);
    
    if (mesh.vertices.length === 0) return;
    
    // Use shader program
    this.gl.useProgram(this.program);
    
    // Set uniforms
    this.gl.uniform2f(this.uniformLocations.resolution, canvasWidth, canvasHeight);
    this.gl.uniform1f(this.uniformLocations.edgeSoftness, this.config.edgeSoftness);
    
    // Upload position data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.position);
    this.gl.vertexAttribPointer(this.attribLocations.position, 2, this.gl.FLOAT, false, 0, 0);
    
    // Upload color data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.colors), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.color);
    this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    // Upload intensity data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.intensity);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.intensities), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.attribLocations.intensity);
    this.gl.vertexAttribPointer(this.attribLocations.intensity, 1, this.gl.FLOAT, false, 0, 0);
    
    // Draw triangles
    this.gl.drawArrays(this.gl.TRIANGLES, 0, mesh.vertices.length / 2);
  }
  
  /**
   * Get number of detected blobs (for mitosis detection)
   */
  getBlobCount() {
    return this.blobs.length;
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.buffers.position) this.gl.deleteBuffer(this.buffers.position);
      if (this.buffers.color) this.gl.deleteBuffer(this.buffers.color);
      if (this.buffers.intensity) this.gl.deleteBuffer(this.buffers.intensity);
    }
    console.log('[BlobRenderer] Resources disposed');
  }
}
