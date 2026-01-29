/**
 * GradientShaderProgram - Enhanced shader for gradient and watercolor effects
 * 
 * Key Features:
 * - Multi-color gradient rendering for blobs
 * - Watercolor-style blending with soft edges
 * - Smooth color interpolation between particles
 * - GPU-optimized gradient calculations
 */
export class GradientShaderProgram {
  constructor(gl) {
    this.gl = gl;
    this.program = null;
    this.uniformLocations = {};
    this.attributeLocations = {};
    
    this.initializeShaders();
  }
  
  /**
   * Initialize gradient shader program
   */
  initializeShaders() {
    console.log('[GradientShaderProgram] Initializing gradient shaders...');
    
    // Enhanced vertex shader with secondary color support for gradients
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute vec4 a_colorSecondary;  // For gradient effects
      attribute float a_size;
      attribute float a_gradientMix;    // How much to mix colors (0-1)
      
      uniform vec2 u_resolution;
      uniform float u_watercolorEffect;  // Watercolor intensity (0-1)
      
      varying vec4 v_color;
      varying vec4 v_colorSecondary;
      varying float v_gradientMix;
      varying float v_watercolorEffect;
      
      void main() {
        // Convert from pixel coordinates to clip space (-1 to 1)
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        
        // Pass colors and gradient info to fragment shader
        v_color = a_color;
        v_colorSecondary = a_colorSecondary;
        v_gradientMix = a_gradientMix;
        v_watercolorEffect = u_watercolorEffect;
      }
    `;
    
    // Enhanced fragment shader with gradient and watercolor effects
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying vec4 v_colorSecondary;
      varying float v_gradientMix;
      varying float v_watercolorEffect;
      
      // Watercolor wash function - creates soft, irregular edges
      float watercolorWash(vec2 coord, float dist) {
        // Add subtle noise-like variation for watercolor effect
        float noise = fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
        float variation = noise * 0.1 * v_watercolorEffect;
        
        // Softer, more organic falloff
        float adjustedDist = dist + variation;
        return smoothstep(0.5 + variation * 0.3, 0.2 - variation * 0.2, adjustedDist);
      }
      
      // Gradient mixing with radial distribution
      vec4 mixGradient(vec4 color1, vec4 color2, float mixFactor, vec2 coord) {
        // Use point coordinate for radial gradient
        float radialDist = length(coord - vec2(0.5));
        
        // Mix colors based on radial distance and gradient mix factor
        float gradientT = radialDist * mixFactor;
        gradientT = clamp(gradientT, 0.0, 1.0);
        
        // Smooth color interpolation
        return mix(color1, color2, gradientT);
      }
      
      void main() {
        // Calculate distance from center of point sprite
        vec2 coord = gl_PointCoord;
        vec2 center = vec2(0.5);
        float dist = length(coord - center);
        
        // Apply gradient mixing if secondary color is present
        vec4 finalColor = v_color;
        if (v_gradientMix > 0.0) {
          finalColor = mixGradient(v_color, v_colorSecondary, v_gradientMix, coord);
        }
        
        // Apply watercolor wash effect for soft, organic edges
        float alpha;
        if (v_watercolorEffect > 0.0) {
          alpha = watercolorWash(coord, dist);
        } else {
          // Standard smooth circular falloff
          alpha = smoothstep(0.5, 0.3, dist);
        }
        
        // Output final color with alpha
        gl_FragColor = vec4(finalColor.rgb, finalColor.a * alpha);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Create and link program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.program);
      console.error('[GradientShaderProgram] Failed to link program:', info);
      throw new Error('Failed to link gradient shader program: ' + info);
    }
    
    // Get attribute locations
    this.attributeLocations.position = this.gl.getAttribLocation(this.program, 'a_position');
    this.attributeLocations.color = this.gl.getAttribLocation(this.program, 'a_color');
    this.attributeLocations.colorSecondary = this.gl.getAttribLocation(this.program, 'a_colorSecondary');
    this.attributeLocations.size = this.gl.getAttribLocation(this.program, 'a_size');
    this.attributeLocations.gradientMix = this.gl.getAttribLocation(this.program, 'a_gradientMix');
    
    // Get uniform locations
    this.uniformLocations.resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.uniformLocations.watercolorEffect = this.gl.getUniformLocation(this.program, 'u_watercolorEffect');
    
    console.log('[GradientShaderProgram] Gradient shaders initialized successfully');
  }
  
  /**
   * Compile a shader
   * @param {string} source - Shader source code
   * @param {number} type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @returns {WebGLShader} Compiled shader
   */
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      const typeName = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      console.error(`[GradientShaderProgram] Failed to compile ${typeName} shader:`, info);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile ${typeName} shader: ` + info);
    }
    
    return shader;
  }
  
  /**
   * Use this shader program for rendering
   */
  use() {
    this.gl.useProgram(this.program);
  }
  
  /**
   * Set resolution uniform
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setResolution(width, height) {
    this.gl.uniform2f(this.uniformLocations.resolution, width, height);
  }
  
  /**
   * Set watercolor effect intensity
   * @param {number} intensity - Watercolor effect intensity (0-1)
   */
  setWatercolorEffect(intensity) {
    this.gl.uniform1f(this.uniformLocations.watercolorEffect, intensity);
  }
  
  /**
   * Get program
   * @returns {WebGLProgram} The shader program
   */
  getProgram() {
    return this.program;
  }
  
  /**
   * Get attribute locations
   * @returns {Object} Attribute locations
   */
  getAttributeLocations() {
    return this.attributeLocations;
  }
  
  /**
   * Get uniform locations
   * @returns {Object} Uniform locations
   */
  getUniformLocations() {
    return this.uniformLocations;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }
}
