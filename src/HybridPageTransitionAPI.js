/**
 * HybridPageTransitionAPI - High-level API for page transitions using WebGL particles
 * 
 * Features:
 * - Captures DOM states using html2canvas
 * - Manages particle count dynamically based on device performance
 * - Handles transition phases: disintegrate → explode → recombine
 * - Provides debug controls and performance optimization
 * - Includes WebGL fallback support (CSS transitions)
 */

import { HybridEngine } from './HybridEngine.js';
import { DevicePerformance } from './utils/DevicePerformance.js';

export class HybridPageTransitionAPI {
  constructor(config = {}) {
    console.log('[HybridPageTransitionAPI] Initializing...');
    
    // Configuration with defaults
    this.config = {
      // Canvas settings
      canvasId: config.canvasId || 'transition-canvas',
      canvasWidth: config.canvasWidth || window.innerWidth,
      canvasHeight: config.canvasHeight || window.innerHeight,
      
      // Performance settings
      autoOptimize: config.autoOptimize !== false,
      particleCount: config.particleCount || 2000,
      
      // Transition settings
      explosionDuration: config.explosionDuration || 800,
      recombinationDuration: config.recombinationDuration || 2000,
      explosionIntensity: config.explosionIntensity || 150,
      
      // html2canvas settings
      html2canvasOptions: config.html2canvasOptions || {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      
      // Debug settings
      debug: config.debug || false,
      showDebugPanel: config.showDebugPanel || false,
      
      // Fallback settings
      enableFallback: config.enableFallback !== false,
      fallbackDuration: config.fallbackDuration || 500,
      
      ...config
    };
    
    // Initialize performance detector
    this.performance = new DevicePerformance();
    
    // Apply performance optimizations if enabled
    if (this.config.autoOptimize) {
      this.optimizeForPerformance();
    }
    
    // Initialize state
    this.canvas = null;
    this.engine = null;
    this.isInitialized = false;
    this.isTransitioning = false;
    this.currentPage = null;
    this.nextPage = null;
    this.debugPanel = null;
    
    // Texture cache
    this.textureCache = new Map();
    
    // Fallback element
    this.fallbackOverlay = null;
    
    console.log('[HybridPageTransitionAPI] Configuration:', this.config);
    console.log('[HybridPageTransitionAPI] Performance level:', this.performance.performanceLevel);
  }

  /**
   * Initialize the API and create canvas
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('[HybridPageTransitionAPI] Already initialized');
      return;
    }
    
    console.log('[HybridPageTransitionAPI] Initializing canvas and engine...');
    
    // Check WebGL support
    if (!this.performance.capabilities.webgl) {
      console.warn('[HybridPageTransitionAPI] WebGL not supported, fallback mode enabled');
      this.config.enableFallback = true;
      this.initializeFallback();
      this.isInitialized = true;
      return;
    }
    
    // Create canvas
    this.canvas = this.createCanvas();
    
    // Initialize HybridEngine
    try {
      this.engine = new HybridEngine(this.canvas, {
        particleCount: this.config.particleCount,
        speed: 1.0,
        enableTriangulation: true,
        triangulationMode: 'hybrid',
        autoResize: true
      });
      
      console.log('[HybridPageTransitionAPI] Engine initialized successfully');
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Failed to initialize engine:', error);
      this.config.enableFallback = true;
      this.initializeFallback();
      this.isInitialized = true;
      return;
    }
    
    // Create debug panel if enabled
    if (this.config.showDebugPanel) {
      this.createDebugPanel();
    }
    
    this.isInitialized = true;
    console.log('[HybridPageTransitionAPI] Initialization complete');
  }

  /**
   * Create and setup canvas element
   * @returns {HTMLCanvasElement}
   */
  createCanvas() {
    let canvas = document.getElementById(this.config.canvasId);
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = this.config.canvasId;
      document.body.appendChild(canvas);
    }
    
    canvas.width = this.config.canvasWidth;
    canvas.height = this.config.canvasHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'none';
    
    return canvas;
  }

  /**
   * Initialize CSS fallback for non-WebGL browsers
   */
  initializeFallback() {
    console.log('[HybridPageTransitionAPI] Initializing CSS fallback...');
    
    this.fallbackOverlay = document.createElement('div');
    this.fallbackOverlay.id = 'page-transition-fallback';
    this.fallbackOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: black;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity ${this.config.fallbackDuration}ms ease-in-out;
      display: none;
    `;
    
    document.body.appendChild(this.fallbackOverlay);
    console.log('[HybridPageTransitionAPI] CSS fallback initialized');
  }

  /**
   * Optimize settings based on device performance
   */
  optimizeForPerformance() {
    console.log('[HybridPageTransitionAPI] Optimizing for device performance...');
    
    const profile = this.performance.getPerformanceProfile();
    
    // Apply optimized settings
    this.config.particleCount = profile.particleCount;
    this.config.explosionIntensity = profile.explosionIntensity;
    this.config.transitionDuration = profile.transitionDuration;
    
    // Adjust html2canvas scale
    this.config.html2canvasOptions.scale = profile.canvasScale;
    
    console.log('[HybridPageTransitionAPI] Optimized settings:', {
      particleCount: this.config.particleCount,
      explosionIntensity: this.config.explosionIntensity,
      canvasScale: profile.canvasScale
    });
  }

  /**
   * Capture DOM element as texture using html2canvas
   * @param {HTMLElement} element - Element to capture
   * @param {string} cacheKey - Optional cache key
   * @returns {Promise<HTMLCanvasElement>}
   */
  async captureDOMAsTexture(element, cacheKey = null) {
    console.log('[HybridPageTransitionAPI] Capturing DOM element as texture...');
    
    // Check cache
    if (cacheKey && this.textureCache.has(cacheKey)) {
      console.log('[HybridPageTransitionAPI] Using cached texture:', cacheKey);
      return this.textureCache.get(cacheKey);
    }
    
    try {
      // Dynamically import html2canvas
      const html2canvas = await this.loadHtml2Canvas();
      
      // Capture element
      const canvas = await html2canvas(element, this.config.html2canvasOptions);
      
      console.log('[HybridPageTransitionAPI] DOM captured successfully:', {
        width: canvas.width,
        height: canvas.height
      });
      
      // Cache if key provided
      if (cacheKey) {
        this.textureCache.set(cacheKey, canvas);
      }
      
      return canvas;
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Failed to capture DOM:', error);
      throw error;
    }
  }

  /**
   * Load html2canvas library dynamically
   * @returns {Promise<Function>}
   */
  async loadHtml2Canvas() {
    if (window.html2canvas) {
      return window.html2canvas;
    }
    
    // Check if html2canvas is available via npm module
    try {
      // Try importing as ES module (if bundled)
      const module = await import('html2canvas');
      window.html2canvas = module.default || module;
      return window.html2canvas;
    } catch (e) {
      // Module not available
    }
    
    // Try to load from CDN as fallback
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      // Add SRI for security
      script.integrity = 'sha512-Hjbb7ILvQ4VbJVLXzaS8EG3b4lfJcpuaCdRfRGZEi0f3rNwMkGw7f8lLg+QCTD3CLNU6p6lUxdH0R2fTJtFT7A==';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        resolve(window.html2canvas);
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas. Please include html2canvas in your page or install it via npm: npm install html2canvas'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Transition using pre-rendered images or canvas elements
   * @param {HTMLImageElement|HTMLCanvasElement} currentImage - Current page as image/canvas
   * @param {HTMLImageElement|HTMLCanvasElement} nextImage - Next page as image/canvas
   * @param {Object} options - Transition options
   * @returns {Promise<void>}
   */
  async transitionImages(currentImage, nextImage, options = {}) {
    if (this.isTransitioning) {
      console.warn('[HybridPageTransitionAPI] Transition already in progress');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log('[HybridPageTransitionAPI] Starting image transition...');
    this.isTransitioning = true;
    
    // Use fallback if WebGL not available
    if (this.config.enableFallback && !this.engine) {
      // Simple fade transition
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isTransitioning = false;
      return;
    }
    
    try {
      // Show canvas
      this.canvas.style.display = 'block';
      
      // Merge options with config
      const transitionConfig = {
        staticDisplayDuration: options.staticDisplayDuration || 500,
        disintegrationDuration: options.disintegrationDuration || 1000,
        explosionIntensity: options.explosionIntensity || this.config.explosionIntensity,
        explosionTime: options.explosionTime || this.config.explosionDuration,
        recombinationDuration: options.recombinationDuration || this.config.recombinationDuration,
        recombinationChaos: options.recombinationChaos || 0.3,
        vacuumStrength: options.vacuumStrength || 0.15,
        blendDuration: options.blendDuration || 1500,
        particleFadeRate: options.particleFadeRate || 0.7,
        finalStaticDuration: options.finalStaticDuration || 500
      };
      
      // Start hybrid transition
      this.engine.startHybridTransition(currentImage, nextImage, transitionConfig);
      
      // Calculate total duration
      const totalDuration = 
        transitionConfig.staticDisplayDuration +
        transitionConfig.disintegrationDuration +
        transitionConfig.explosionTime +
        transitionConfig.recombinationDuration +
        transitionConfig.blendDuration +
        transitionConfig.finalStaticDuration;
      
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, totalDuration));
      
      // Hide canvas
      this.canvas.style.display = 'none';
      
      console.log('[HybridPageTransitionAPI] Image transition complete');
      
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Image transition failed:', error);
      this.canvas.style.display = 'none';
    }
    
    this.isTransitioning = false;
  }

  /**
   * Transition from current page to next page
   * @param {HTMLElement|string} currentElement - Current page element or selector
   * @param {HTMLElement|string} nextElement - Next page element or selector
   * @param {Object} options - Transition options
   * @returns {Promise<void>}
   */
  async transition(currentElement, nextElement, options = {}) {
    if (this.isTransitioning) {
      console.warn('[HybridPageTransitionAPI] Transition already in progress');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log('[HybridPageTransitionAPI] Starting page transition...');
    this.isTransitioning = true;
    
    // Resolve elements
    const current = typeof currentElement === 'string' 
      ? document.querySelector(currentElement) 
      : currentElement;
    const next = typeof nextElement === 'string' 
      ? document.querySelector(nextElement) 
      : nextElement;
    
    if (!current || !next) {
      console.error('[HybridPageTransitionAPI] Invalid elements provided');
      this.isTransitioning = false;
      return;
    }
    
    // Use fallback if WebGL not available
    if (this.config.enableFallback && !this.engine) {
      await this.fallbackTransition(current, next);
      this.isTransitioning = false;
      return;
    }
    
    try {
      // Capture both pages as textures
      console.log('[HybridPageTransitionAPI] Capturing pages...');
      const [currentTexture, nextTexture] = await Promise.all([
        this.captureDOMAsTexture(current),
        this.captureDOMAsTexture(next)
      ]);
      
      // Convert canvases to images
      const currentImage = await this.canvasToImage(currentTexture);
      const nextImage = await this.canvasToImage(nextTexture);
      
      // Show canvas
      this.canvas.style.display = 'block';
      
      // Hide page elements during transition
      current.style.display = 'none';
      next.style.display = 'none';
      
      // Merge options with config
      const transitionConfig = {
        staticDisplayDuration: options.staticDisplayDuration || 500,
        disintegrationDuration: options.disintegrationDuration || 1000,
        explosionIntensity: options.explosionIntensity || this.config.explosionIntensity,
        explosionTime: options.explosionTime || this.config.explosionDuration,
        recombinationDuration: options.recombinationDuration || this.config.recombinationDuration,
        recombinationChaos: options.recombinationChaos || 0.3,
        vacuumStrength: options.vacuumStrength || 0.15,
        blendDuration: options.blendDuration || 1500,
        particleFadeRate: options.particleFadeRate || 0.7,
        finalStaticDuration: options.finalStaticDuration || 500
      };
      
      // Start hybrid transition
      this.engine.startHybridTransition(currentImage, nextImage, transitionConfig);
      
      // Calculate total duration
      const totalDuration = 
        transitionConfig.staticDisplayDuration +
        transitionConfig.disintegrationDuration +
        transitionConfig.explosionTime +
        transitionConfig.recombinationDuration +
        transitionConfig.blendDuration +
        transitionConfig.finalStaticDuration;
      
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, totalDuration));
      
      // Hide canvas and show next page
      this.canvas.style.display = 'none';
      next.style.display = '';
      
      console.log('[HybridPageTransitionAPI] Transition complete');
      
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Transition failed:', error);
      
      // Fallback to instant transition
      current.style.display = 'none';
      next.style.display = '';
      this.canvas.style.display = 'none';
    }
    
    this.isTransitioning = false;
  }

  /**
   * Fallback transition using CSS
   * @param {HTMLElement} current - Current page element
   * @param {HTMLElement} next - Next page element
   * @returns {Promise<void>}
   */
  async fallbackTransition(current, next) {
    console.log('[HybridPageTransitionAPI] Using CSS fallback transition...');
    
    if (!this.fallbackOverlay) {
      // Instant transition if fallback not initialized
      current.style.display = 'none';
      next.style.display = '';
      return;
    }
    
    // Show overlay
    this.fallbackOverlay.style.display = 'block';
    
    // Fade in
    await new Promise(resolve => {
      setTimeout(() => {
        this.fallbackOverlay.style.opacity = '1';
        setTimeout(resolve, this.config.fallbackDuration);
      }, 10);
    });
    
    // Switch pages
    current.style.display = 'none';
    next.style.display = '';
    
    // Fade out
    await new Promise(resolve => {
      setTimeout(() => {
        this.fallbackOverlay.style.opacity = '0';
        setTimeout(() => {
          this.fallbackOverlay.style.display = 'none';
          resolve();
        }, this.config.fallbackDuration);
      }, 10);
    });
  }

  /**
   * Convert canvas to image
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<HTMLImageElement>}
   */
  canvasToImage(canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL();
    });
  }

  /**
   * Update configuration dynamically
   * @param {Object} config - Configuration updates
   */
  updateConfig(config) {
    console.log('[HybridPageTransitionAPI] Updating configuration...');
    
    Object.assign(this.config, config);
    
    // Update engine if available
    if (this.engine) {
      if (config.particleCount !== undefined) {
        this.engine.updateConfig({ particleCount: config.particleCount });
      }
    }
    
    console.log('[HybridPageTransitionAPI] Configuration updated');
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get performance information
   * @returns {Object}
   */
  getPerformanceInfo() {
    return {
      level: this.performance.performanceLevel,
      capabilities: this.performance.capabilities,
      profile: this.performance.getPerformanceProfile()
    };
  }

  /**
   * Clear texture cache
   */
  clearCache() {
    console.log('[HybridPageTransitionAPI] Clearing texture cache...');
    this.textureCache.clear();
  }

  /**
   * Create debug panel for real-time controls
   */
  createDebugPanel() {
    console.log('[HybridPageTransitionAPI] Creating debug panel...');
    
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'hybrid-transition-debug-panel';
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;
    
    this.debugPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 14px;">Transition Debug Panel</h3>
      
      <div style="margin-bottom: 10px;">
        <label>Particle Count: <span id="debug-particle-count">${this.config.particleCount}</span></label>
        <input type="range" id="debug-particle-slider" min="500" max="5000" step="100" value="${this.config.particleCount}" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 10px;">
        <label>Explosion Duration: <span id="debug-explosion-duration">${this.config.explosionDuration}</span>ms</label>
        <input type="range" id="debug-explosion-slider" min="300" max="2000" step="100" value="${this.config.explosionDuration}" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 10px;">
        <label>Recombination Duration: <span id="debug-recombination-duration">${this.config.recombinationDuration}</span>ms</label>
        <input type="range" id="debug-recombination-slider" min="1000" max="4000" step="100" value="${this.config.recombinationDuration}" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 10px;">
        <label>Explosion Intensity: <span id="debug-intensity">${this.config.explosionIntensity}</span></label>
        <input type="range" id="debug-intensity-slider" min="50" max="300" step="10" value="${this.config.explosionIntensity}" style="width: 100%;">
      </div>
      
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">
        <div><strong>Performance:</strong> ${this.performance.performanceLevel}</div>
        <div><strong>WebGL:</strong> ${this.performance.capabilities.webgl ? 'Yes' : 'No'}</div>
        <div><strong>Status:</strong> <span id="debug-status">Idle</span></div>
      </div>
      
      <button id="debug-toggle" style="margin-top: 10px; padding: 5px 10px; width: 100%;">Hide Panel</button>
    `;
    
    document.body.appendChild(this.debugPanel);
    
    // Setup event listeners
    this.setupDebugControls();
  }

  /**
   * Setup debug panel controls
   */
  setupDebugControls() {
    const particleSlider = document.getElementById('debug-particle-slider');
    const explosionSlider = document.getElementById('debug-explosion-slider');
    const recombinationSlider = document.getElementById('debug-recombination-slider');
    const intensitySlider = document.getElementById('debug-intensity-slider');
    const toggleButton = document.getElementById('debug-toggle');
    
    if (particleSlider) {
      particleSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('debug-particle-count').textContent = value;
        this.updateConfig({ particleCount: value });
      });
    }
    
    if (explosionSlider) {
      explosionSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('debug-explosion-duration').textContent = value;
        this.updateConfig({ explosionDuration: value });
      });
    }
    
    if (recombinationSlider) {
      recombinationSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('debug-recombination-duration').textContent = value;
        this.updateConfig({ recombinationDuration: value });
      });
    }
    
    if (intensitySlider) {
      intensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('debug-intensity').textContent = value;
        this.updateConfig({ explosionIntensity: value });
      });
    }
    
    if (toggleButton) {
      let isVisible = true;
      toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;
        this.debugPanel.style.display = isVisible ? 'block' : 'none';
        if (!isVisible) {
          // Create small toggle button
          const miniToggle = document.createElement('button');
          miniToggle.id = 'debug-mini-toggle';
          miniToggle.textContent = 'Debug';
          miniToggle.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          `;
          miniToggle.addEventListener('click', () => {
            this.debugPanel.style.display = 'block';
            miniToggle.remove();
          });
          document.body.appendChild(miniToggle);
        } else {
          const miniToggle = document.getElementById('debug-mini-toggle');
          if (miniToggle) miniToggle.remove();
        }
      });
    }
  }

  /**
   * Update debug status
   * @param {string} status - Status message
   */
  updateDebugStatus(status) {
    const statusElement = document.getElementById('debug-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  /**
   * Destroy API and clean up resources
   */
  destroy() {
    console.log('[HybridPageTransitionAPI] Destroying...');
    
    try {
      if (this.engine) {
        this.engine.destroy();
      }
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Error destroying engine:', error);
    }
    
    try {
      if (this.canvas && this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Error removing canvas:', error);
    }
    
    try {
      if (this.debugPanel && this.debugPanel.parentElement) {
        this.debugPanel.parentElement.removeChild(this.debugPanel);
      }
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Error removing debug panel:', error);
    }
    
    try {
      if (this.fallbackOverlay && this.fallbackOverlay.parentElement) {
        this.fallbackOverlay.parentElement.removeChild(this.fallbackOverlay);
      }
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Error removing fallback overlay:', error);
    }
    
    try {
      this.clearCache();
    } catch (error) {
      console.error('[HybridPageTransitionAPI] Error clearing cache:', error);
    }
    
    this.isInitialized = false;
    console.log('[HybridPageTransitionAPI] Destroyed');
  }
}
