/**
 * HybridPageTransitionAPI - High-level API for page transitions using WebGL particles
 * 
 * Features:
 * - Captures DOM states using html2canvas
 * - Manages particle count dynamically based on device performance
 * - Handles transition phases: disintegrate → explode → recombine
 * - Provides debug controls and performance optimization
 * - Includes WebGL fallback support (CSS transitions)
 * - Event-driven lifecycle hooks for observability
 * - Streamlined transitionToPage() API for easy integration
 */

import { HybridEngine } from './HybridEngine.js';
import { DevicePerformance } from './utils/DevicePerformance.js';
import { TransitionEventEmitter } from './utils/TransitionEventEmitter.js';

export class HybridPageTransitionAPI {
  // Log level constants for performance
  static LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
  
  constructor(config = {}) {
    this._log('info', 'Initializing...');
    
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
      logLevel: config.logLevel || 'info', // 'debug', 'info', 'warn', 'error'
      
      // Fallback settings
      enableFallback: config.enableFallback !== false,
      fallbackDuration: config.fallbackDuration || 500,
      
      ...config
    };
    
    // Initialize event emitter for lifecycle hooks
    this.events = new TransitionEventEmitter();
    
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
    this.currentPhase = null;
    this.transitionStartTime = null;
    
    // Texture cache
    this.textureCache = new Map();
    
    // Fallback element
    this.fallbackOverlay = null;
    
    this._log('debug', 'Configuration:', this.config);
    this._log('info', `Performance level: ${this.performance.performanceLevel}`);
  }

  /**
   * Structured logging helper with log levels
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  _log(level, message, data = null) {
    const logLevels = HybridPageTransitionAPI.LOG_LEVELS;
    const configLevel = logLevels[this.config.logLevel] || 1;
    const messageLevel = logLevels[level] || 1;
    
    if (messageLevel < configLevel) {
      return;
    }
    
    const prefix = '[HybridPageTransitionAPI]';
    const logData = data ? [message, data] : [message];
    
    switch (level) {
      case 'debug':
        if (this.config.debug) {
          console.log(prefix, ...logData);
        }
        break;
      case 'info':
        console.log(prefix, ...logData);
        break;
      case 'warn':
        console.warn(prefix, ...logData);
        break;
      case 'error':
        console.error(prefix, ...logData);
        break;
    }
  }

  /**
   * Emit phase event and log
   * @param {string} phase - Phase name
   * @param {string} action - 'start' or 'end'
   * @param {Object} data - Additional data
   */
  _emitPhase(phase, action, data = {}) {
    const eventName = action === 'start' ? 'phaseStart' : 'phaseEnd';
    const eventData = { phase, timestamp: Date.now(), ...data };
    
    this.currentPhase = action === 'start' ? phase : null;
    this.events.emit(eventName, eventData);
    
    const actionText = action === 'start' ? 'Starting' : 'Completed';
    this._log('debug', `${actionText} ${phase} phase`, data);
  }

  /**
   * Initialize the API and create canvas
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      this._log('warn', 'Already initialized');
      return;
    }
    
    this._log('info', 'Initializing canvas and engine...');
    this.events.emit('initializeStart', { timestamp: Date.now() });
    
    // Check WebGL support
    if (!this.performance.capabilities.webgl) {
      this._log('warn', 'WebGL not supported, fallback mode enabled');
      this.config.enableFallback = true;
      this.initializeFallback();
      this.isInitialized = true;
      this.events.emit('initializeComplete', { 
        timestamp: Date.now(), 
        webglSupported: false 
      });
      return;
    }
    
    // Create canvas
    this.canvas = this.createCanvas();
    
    // Initialize HybridEngine
    try {
      this.engine = new HybridEngine(this.canvas, {
        particleCount: this.config.particleCount,
        speed: 1.0,
        autoResize: true
      });
      
      this._log('info', 'Engine initialized successfully');
    } catch (error) {
      this._log('error', 'Failed to initialize engine:', error);
      this.config.enableFallback = true;
      this.initializeFallback();
      this.isInitialized = true;
      this.events.emit('initializeError', { 
        timestamp: Date.now(), 
        error: error.message 
      });
      return;
    }
    
    // Create debug panel if enabled
    if (this.config.showDebugPanel) {
      this.createDebugPanel();
    }
    
    this.isInitialized = true;
    this._log('info', 'Initialization complete');
    this.events.emit('initializeComplete', { 
      timestamp: Date.now(), 
      webglSupported: true 
    });
  }

  /**
   * Streamlined API for page transitions - Easy integration for websites
   * 
   * This is the recommended method for most use cases. It provides:
   * - Simple, clear parameter names
   * - Sensible defaults for all settings
   * - Automatic element resolution (accepts selectors or elements)
   * - Built-in error handling with meaningful messages
   * - Lifecycle hooks for observability
   * - Automatic fallback for non-WebGL browsers
   * 
   * @param {Object} params - Transition parameters
   * @param {HTMLElement|string} params.currentPage - Current page element or CSS selector
   * @param {HTMLElement|string} params.nextPage - Next page element or CSS selector
   * @param {Function} [params.onComplete] - Callback when transition completes
   * @param {Function} [params.onError] - Callback if transition fails
   * @param {Object} [params.config] - Optional configuration overrides
   * @returns {Promise<void>}
   * 
   * @example
   * // Basic usage
   * await api.transitionToPage({
   *   currentPage: '#page1',
   *   nextPage: '#page2'
   * });
   * 
   * @example
   * // With callbacks
   * await api.transitionToPage({
   *   currentPage: document.getElementById('home'),
   *   nextPage: document.getElementById('about'),
   *   onComplete: () => console.log('Transition done!'),
   *   onError: (error) => console.error('Failed:', error)
   * });
   * 
   * @example
   * // With custom configuration
   * await api.transitionToPage({
   *   currentPage: '#page1',
   *   nextPage: '#page2',
   *   config: {
   *     explosionIntensity: 200,
   *     particleCount: 3000
   *   }
   * });
   */
  async transitionToPage({ currentPage, nextPage, onComplete = null, onError = null, config = {} }) {
    // Validate required parameters
    if (!currentPage || !nextPage) {
      const error = new Error('transitionToPage() requires both currentPage and nextPage parameters');
      this._log('error', error.message);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
    
    // Check if transition already in progress
    if (this.isTransitioning) {
      const error = new Error('A transition is already in progress. Please wait for it to complete.');
      this._log('warn', error.message);
      
      if (onError) {
        onError(error);
      }
      
      return;
    }
    
    // Initialize if needed
    if (!this.isInitialized) {
      this._log('info', 'Auto-initializing API for first transition...');
      try {
        await this.initialize();
      } catch (initError) {
        const error = new Error(`Failed to initialize: ${initError.message}`);
        this._log('error', error.message);
        
        if (onError) {
          onError(error);
        }
        
        throw error;
      }
    }
    
    // Resolve page elements
    let currentElement, nextElement;
    
    try {
      currentElement = typeof currentPage === 'string' 
        ? document.querySelector(currentPage) 
        : currentPage;
      
      nextElement = typeof nextPage === 'string' 
        ? document.querySelector(nextPage) 
        : nextPage;
      
      // Validate elements exist
      if (!currentElement) {
        throw new Error(`Current page element not found: ${typeof currentPage === 'string' ? currentPage : 'provided DOM element is invalid'}`);
      }
      
      if (!nextElement) {
        throw new Error(`Next page element not found: ${typeof nextPage === 'string' ? nextPage : 'provided DOM element is invalid'}`);
      }
      
      // Validate elements are in the DOM
      if (!document.body.contains(currentElement)) {
        throw new Error('Current page element is not in the document');
      }
      
      if (!document.body.contains(nextElement)) {
        throw new Error('Next page element is not in the document');
      }
      
    } catch (error) {
      this._log('error', 'Page resolution failed:', error.message);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
    
    // Apply config overrides if provided
    const originalConfig = config && Object.keys(config).length > 0 
      ? JSON.parse(JSON.stringify(this.config))  // Deep clone
      : null;
      
    if (config && Object.keys(config).length > 0) {
      this._log('debug', 'Applying config overrides:', config);
      Object.assign(this.config, config);
    }
    
    try {
      // Use the existing transition method internally
      await this.transition(currentElement, nextElement, config);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
      this._log('info', 'Page transition completed successfully');
      
    } catch (error) {
      this._log('error', 'Page transition failed:', error.message);
      
      // Call onError callback if provided
      if (onError) {
        onError(error);
      }
      
      throw error;
      
    } finally {
      // Restore original config if overrides were applied
      if (originalConfig) {
        this.config = originalConfig;
      }
    }
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
    this._log('info', 'Initializing CSS fallback...');
    
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
    this._log('info', 'CSS fallback initialized');
  }

  /**
   * Optimize settings based on device performance
   */
  optimizeForPerformance() {
    this._log('info', 'Optimizing for device performance...');
    
    const profile = this.performance.getPerformanceProfile();
    
    // Apply optimized settings
    this.config.particleCount = profile.particleCount;
    this.config.explosionIntensity = profile.explosionIntensity;
    this.config.transitionDuration = profile.transitionDuration;
    
    // Adjust html2canvas scale
    this.config.html2canvasOptions.scale = profile.canvasScale;
    
    this._log('info', 'Optimized settings applied', {
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
    this._log('debug', 'Capturing DOM element as texture...');
    
    // Check cache
    if (cacheKey && this.textureCache.has(cacheKey)) {
      this._log('debug', `Using cached texture: ${cacheKey}`);
      return this.textureCache.get(cacheKey);
    }
    
    try {
      // Dynamically import html2canvas
      const html2canvas = await this.loadHtml2Canvas();
      
      // Capture element
      const canvas = await html2canvas(element, this.config.html2canvasOptions);
      
      this._log('debug', 'DOM captured successfully', {
        width: canvas.width,
        height: canvas.height
      });
      
      // Cache if key provided
      if (cacheKey) {
        this.textureCache.set(cacheKey, canvas);
      }
      
      return canvas;
    } catch (error) {
      this._log('error', 'Failed to capture DOM:', error.message);
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
      this._log('warn', 'Transition already in progress');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this._log('info', 'Starting image transition...');
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    
    // Emit transition start event
    this.events.emit('transitionStart', { 
      timestamp: this.transitionStartTime,
      type: 'image'
    });
    
    // Use fallback if WebGL not available
    if (this.config.enableFallback && !this.engine) {
      this._log('info', 'Using fallback transition (WebGL not available)');
      // Simple fade transition
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isTransitioning = false;
      this.events.emit('transitionComplete', { 
        timestamp: Date.now(),
        duration: Date.now() - this.transitionStartTime,
        fallback: true
      });
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
      
      // Calculate total duration
      const totalDuration = 
        transitionConfig.staticDisplayDuration +
        transitionConfig.disintegrationDuration +
        transitionConfig.explosionTime +
        transitionConfig.recombinationDuration +
        transitionConfig.blendDuration +
        transitionConfig.finalStaticDuration;
      
      this._log('debug', 'Transition configuration', { transitionConfig, totalDuration });
      
      // Start hybrid transition
      this.engine.startHybridTransition(currentImage, nextImage, transitionConfig);
      
      // Track phases with timings
      await this._trackTransitionPhases(transitionConfig);
      
      // Hide canvas
      this.canvas.style.display = 'none';
      
      this._log('info', 'Image transition complete');
      
      // Emit completion event
      this.events.emit('transitionComplete', { 
        timestamp: Date.now(),
        duration: Date.now() - this.transitionStartTime,
        fallback: false
      });
      
    } catch (error) {
      this._log('error', 'Image transition failed:', error.message);
      this.canvas.style.display = 'none';
      
      // Emit error event
      this.events.emit('transitionError', { 
        timestamp: Date.now(),
        error: error.message,
        duration: Date.now() - this.transitionStartTime
      });
      
      throw error;
    } finally {
      this.isTransitioning = false;
      this.currentPhase = null;
    }
  }

  /**
   * Track and emit events for each transition phase
   * @param {Object} config - Transition configuration
   * @returns {Promise<void>}
   * @private
   */
  async _trackTransitionPhases(config) {
    const phases = [
      { name: 'staticDisplay', duration: config.staticDisplayDuration },
      { name: 'disintegration', duration: config.disintegrationDuration },
      { name: 'explosion', duration: config.explosionTime },
      { name: 'recombination', duration: config.recombinationDuration },
      { name: 'blend', duration: config.blendDuration },
      { name: 'finalStatic', duration: config.finalStaticDuration }
    ];
    
    for (const phase of phases) {
      // Emit phase start
      this._emitPhase(phase.name, 'start', { duration: phase.duration });
      
      // Wait for phase duration
      await new Promise(resolve => setTimeout(resolve, phase.duration));
      
      // Emit phase end
      this._emitPhase(phase.name, 'end', { duration: phase.duration });
    }
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
      this._log('warn', 'Transition already in progress');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this._log('info', 'Starting page transition...');
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    
    // Emit transition start event
    this.events.emit('transitionStart', { 
      timestamp: this.transitionStartTime,
      type: 'page'
    });
    
    // Resolve elements
    const current = typeof currentElement === 'string' 
      ? document.querySelector(currentElement) 
      : currentElement;
    const next = typeof nextElement === 'string' 
      ? document.querySelector(nextElement) 
      : nextElement;
    
    if (!current || !next) {
      const error = new Error('Invalid elements provided for transition');
      this._log('error', error.message);
      this.isTransitioning = false;
      
      this.events.emit('transitionError', { 
        timestamp: Date.now(),
        error: error.message
      });
      
      throw error;
    }
    
    // Use fallback if WebGL not available
    if (this.config.enableFallback && !this.engine) {
      await this.fallbackTransition(current, next);
      this.isTransitioning = false;
      
      this.events.emit('transitionComplete', { 
        timestamp: Date.now(),
        duration: Date.now() - this.transitionStartTime,
        fallback: true
      });
      
      return;
    }
    
    try {
      // Emit capture phase start
      this._emitPhase('capture', 'start');
      
      // Capture both pages as textures
      this._log('info', 'Capturing pages...');
      const [currentTexture, nextTexture] = await Promise.all([
        this.captureDOMAsTexture(current),
        this.captureDOMAsTexture(next)
      ]);
      
      // Convert canvases to images
      const currentImage = await this.canvasToImage(currentTexture);
      const nextImage = await this.canvasToImage(nextTexture);
      
      // Emit capture phase end
      this._emitPhase('capture', 'end');
      
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
      
      // Track phases
      await this._trackTransitionPhases(transitionConfig);
      
      // Hide canvas and show next page
      this.canvas.style.display = 'none';
      next.style.display = '';
      
      this._log('info', 'Transition complete');
      
      // Emit completion event
      this.events.emit('transitionComplete', { 
        timestamp: Date.now(),
        duration: Date.now() - this.transitionStartTime,
        fallback: false
      });
      
    } catch (error) {
      this._log('error', 'Transition failed:', error.message);
      
      // Fallback to instant transition
      current.style.display = 'none';
      next.style.display = '';
      this.canvas.style.display = 'none';
      
      // Emit error event
      this.events.emit('transitionError', { 
        timestamp: Date.now(),
        error: error.message,
        duration: Date.now() - this.transitionStartTime
      });
      
      throw error;
    } finally {
      this.isTransitioning = false;
      this.currentPhase = null;
    }
  }

  /**
   * Fallback transition using CSS
   * @param {HTMLElement} current - Current page element
   * @param {HTMLElement} next - Next page element
   * @returns {Promise<void>}
   */
  async fallbackTransition(current, next) {
    this._log('info', 'Using CSS fallback transition...');
    
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
    this._log('info', 'Updating configuration...', config);
    
    Object.assign(this.config, config);
    
    // Update engine if available
    if (this.engine) {
      if (config.particleCount !== undefined) {
        this.engine.updateConfig({ particleCount: config.particleCount });
      }
    }
    
    this._log('debug', 'Configuration updated');
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
    this._log('debug', 'Clearing texture cache...');
    this.textureCache.clear();
  }

  /**
   * Create debug panel for real-time controls
   */
  createDebugPanel() {
    this._log('info', 'Creating debug panel...');
    
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
    this._log('info', 'Destroying...');
    
    try {
      if (this.engine) {
        this.engine.destroy();
      }
    } catch (error) {
      this._log('error', 'Error destroying engine:', error.message);
    }
    
    try {
      if (this.canvas && this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
    } catch (error) {
      this._log('error', 'Error removing canvas:', error.message);
    }
    
    try {
      if (this.debugPanel && this.debugPanel.parentElement) {
        this.debugPanel.parentElement.removeChild(this.debugPanel);
      }
    } catch (error) {
      this._log('error', 'Error removing debug panel:', error.message);
    }
    
    try {
      if (this.fallbackOverlay && this.fallbackOverlay.parentElement) {
        this.fallbackOverlay.parentElement.removeChild(this.fallbackOverlay);
      }
    } catch (error) {
      this._log('error', 'Error removing fallback overlay:', error.message);
    }
    
    try {
      this.clearCache();
    } catch (error) {
      this._log('error', 'Error clearing cache:', error.message);
    }
    
    try {
      // Remove all event listeners
      this.events.removeAllListeners();
    } catch (error) {
      this._log('error', 'Error removing event listeners:', error.message);
    }
    
    this.isInitialized = false;
    this._log('info', 'Destroyed');
  }

  /**
   * Register an event listener
   * @param {string} event - Event name ('transitionStart', 'transitionComplete', 'transitionError', 'phaseStart', 'phaseEnd')
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * // Listen for transition start
   * const unsubscribe = api.on('transitionStart', (data) => {
   *   console.log('Transition started at', data.timestamp);
   * });
   * 
   * // Later: unsubscribe
   * unsubscribe();
   */
  on(event, callback) {
    return this.events.on(event, callback);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * // Listen for next transition completion only
   * api.once('transitionComplete', (data) => {
   *   console.log('First transition done in', data.duration, 'ms');
   * });
   */
  once(event, callback) {
    return this.events.once(event, callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * 
   * @example
   * const myCallback = (data) => console.log(data);
   * api.on('phaseStart', myCallback);
   * // Later...
   * api.off('phaseStart', myCallback);
   */
  off(event, callback) {
    this.events.off(event, callback);
  }

  /**
   * Get current transition phase
   * @returns {string|null} Current phase name or null if not transitioning
   */
  getCurrentPhase() {
    return this.currentPhase;
  }

  /**
   * Check if a transition is currently in progress
   * @returns {boolean} True if transitioning
   */
  isTransitionInProgress() {
    return this.isTransitioning;
  }

  /**
   * Get transition duration (time since transition started)
   * @returns {number|null} Duration in milliseconds or null if not transitioning
   */
  getTransitionDuration() {
    if (!this.isTransitioning || !this.transitionStartTime) {
      return null;
    }
    
    return Date.now() - this.transitionStartTime;
  }
}
