/**
 * DevicePerformance - Detects and optimizes based on device capabilities
 * Used to scale particle count and performance settings based on device performance
 */

export class DevicePerformance {
  constructor() {
    this.performanceLevel = this.detectPerformanceLevel();
    this.capabilities = this.detectCapabilities();
    
    console.log('[DevicePerformance] Performance level:', this.performanceLevel);
    console.log('[DevicePerformance] Capabilities:', this.capabilities);
  }

  /**
   * Detect device performance level
   * @returns {string} 'high', 'medium', or 'low'
   */
  detectPerformanceLevel() {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 2;
    
    // Check device memory (in GB)
    const memory = navigator.deviceMemory || 4;
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // High-end: Desktop with 8+ cores and 8+ GB RAM
    if (!isMobile && cores >= 8 && memory >= 8) {
      return 'high';
    }
    
    // Medium: Desktop with 4+ cores or 4+ GB RAM, or high-end mobile
    if ((!isMobile && (cores >= 4 || memory >= 4)) || (isMobile && cores >= 8)) {
      return 'medium';
    }
    
    // Low: Everything else (budget devices, old hardware)
    return 'low';
  }

  /**
   * Detect device capabilities
   * @returns {Object} Capability information
   */
  detectCapabilities() {
    return {
      webgl: this.hasWebGL(),
      webgl2: this.hasWebGL2(),
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      deviceMemory: navigator.deviceMemory || 'unknown',
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      maxTextureSize: this.getMaxTextureSize(),
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Check WebGL support
   * @returns {boolean}
   */
  hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Check WebGL2 support
   * @returns {boolean}
   */
  hasWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  /**
   * Get maximum texture size supported by WebGL
   * @returns {number}
   */
  getMaxTextureSize() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
      }
    } catch (e) {
      // Fallback
    }
    return 2048; // Safe fallback
  }

  /**
   * Get recommended particle count based on performance level
   * @param {number} baseCount - Base particle count
   * @returns {number} Optimized particle count
   */
  getOptimizedParticleCount(baseCount = 2000) {
    const multipliers = {
      high: 1.5,
      medium: 1.0,
      low: 0.5
    };
    
    const multiplier = multipliers[this.performanceLevel] || 1.0;
    return Math.floor(baseCount * multiplier);
  }

  /**
   * Get recommended canvas scale based on performance level
   * @returns {number} Scale factor (0.5 to 1.0)
   */
  getOptimizedCanvasScale() {
    const scales = {
      high: 1.0,
      medium: 0.8,
      low: 0.6
    };
    
    return scales[this.performanceLevel] || 0.8;
  }

  /**
   * Get recommended transition duration based on performance level
   * @param {number} baseDuration - Base duration in ms
   * @returns {number} Optimized duration in ms
   */
  getOptimizedTransitionDuration(baseDuration = 2000) {
    const multipliers = {
      high: 1.0,
      medium: 1.2,
      low: 1.5
    };
    
    const multiplier = multipliers[this.performanceLevel] || 1.0;
    return Math.floor(baseDuration * multiplier);
  }

  /**
   * Check if device can handle complex effects
   * @returns {boolean}
   */
  canHandleComplexEffects() {
    return this.performanceLevel === 'high' || this.performanceLevel === 'medium';
  }

  /**
   * Get performance profile for API configuration
   * @returns {Object} Performance profile with recommended settings
   */
  getPerformanceProfile() {
    const profiles = {
      high: {
        particleCount: 3000,
        canvasScale: 1.0,
        transitionDuration: 2000,
        explosionIntensity: 200,
        enableComplexEffects: true,
        textureMaxSize: 2048
      },
      medium: {
        particleCount: 2000,
        canvasScale: 0.8,
        transitionDuration: 2400,
        explosionIntensity: 150,
        enableComplexEffects: true,
        textureMaxSize: 1024
      },
      low: {
        particleCount: 1000,
        canvasScale: 0.6,
        transitionDuration: 3000,
        explosionIntensity: 100,
        enableComplexEffects: false,
        textureMaxSize: 512
      }
    };
    
    return profiles[this.performanceLevel] || profiles.medium;
  }

  /**
   * Log performance information
   */
  logPerformanceInfo() {
    console.group('[DevicePerformance] Performance Information');
    console.log('Performance Level:', this.performanceLevel);
    console.log('CPU Cores:', this.capabilities.hardwareConcurrency);
    console.log('Device Memory:', this.capabilities.deviceMemory, 'GB');
    console.log('WebGL Support:', this.capabilities.webgl);
    console.log('WebGL2 Support:', this.capabilities.webgl2);
    console.log('Max Texture Size:', this.capabilities.maxTextureSize);
    console.log('Pixel Ratio:', this.capabilities.pixelRatio);
    console.log('Is Mobile:', this.capabilities.isMobile);
    console.log('Recommended Profile:', this.getPerformanceProfile());
    console.groupEnd();
  }
}
