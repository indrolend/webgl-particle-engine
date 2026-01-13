/**
 * View Transitions API Utility
 * Provides cross-browser support for the View Transitions API
 * with fallback for unsupported browsers
 */

export class ViewTransitionsHelper {
  constructor() {
    this.isSupported = this.checkSupport();
    console.log(`[ViewTransitions] API supported: ${this.isSupported}`);
  }

  /**
   * Check if View Transitions API is supported
   * @returns {boolean} True if supported
   */
  checkSupport() {
    return 'startViewTransition' in document;
  }

  /**
   * Execute a transition with View Transitions API
   * Falls back to direct execution if not supported
   * @param {Function} callback - Function to execute during transition
   * @param {Object} options - Transition options
   * @returns {Promise} Promise that resolves when transition completes
   */
  async transition(callback, options = {}) {
    if (!this.isSupported) {
      // Fallback: execute callback directly
      console.log('[ViewTransitions] API not supported, using fallback');
      await callback();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const transition = document.startViewTransition(async () => {
          await callback();
        });

        transition.finished.then(() => {
          console.log('[ViewTransitions] Transition completed');
          resolve();
        }).catch((error) => {
          console.error('[ViewTransitions] Transition failed:', error);
          reject(error);
        });
      } catch (error) {
        console.error('[ViewTransitions] Failed to start transition:', error);
        reject(error);
      }
    });
  }

  /**
   * Prepare element for view transition
   * @param {HTMLElement} element - Element to prepare
   * @param {string} name - View transition name
   */
  prepareElement(element, name) {
    if (!element) return;
    
    if (this.isSupported) {
      element.style.viewTransitionName = name;
      console.log(`[ViewTransitions] Element prepared with name: ${name}`);
    }
  }

  /**
   * Remove view transition from element
   * @param {HTMLElement} element - Element to clean up
   */
  cleanupElement(element) {
    if (!element) return;
    
    if (this.isSupported && element.style.viewTransitionName) {
      element.style.viewTransitionName = '';
    }
  }

  /**
   * Create a cross-document transition (for navigation)
   * Note: This requires browser support for cross-document transitions
   * @param {string} url - Target URL
   */
  navigateWithTransition(url) {
    if (!this.isSupported) {
      // Fallback: normal navigation
      window.location.href = url;
      return;
    }

    // Check for cross-document transition support
    if ('navigation' in window && window.navigation.addEventListener) {
      console.log('[ViewTransitions] Attempting cross-document transition');
      window.location.href = url;
    } else {
      console.log('[ViewTransitions] Cross-document transitions not supported');
      window.location.href = url;
    }
  }

  /**
   * Apply transition CSS rules
   */
  static applyTransitionStyles() {
    if (!document.querySelector('#view-transition-styles')) {
      const style = document.createElement('style');
      style.id = 'view-transition-styles';
      style.textContent = `
        /* View Transition Default Styles */
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 0.3s;
        }

        /* Custom particle transition */
        ::view-transition-old(particle-canvas),
        ::view-transition-new(particle-canvas) {
          animation-duration: 0.5s;
        }

        /* Smooth cross-fade */
        ::view-transition-old(root) {
          animation: fade-out 0.3s ease-out;
        }

        ::view-transition-new(root) {
          animation: fade-in 0.3s ease-in;
        }

        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

/**
 * Integrate View Transitions with Particle Engine
 * @param {ParticleEngine} engine - Particle engine instance
 * @param {ViewTransitionsHelper} viewTransitions - View transitions helper
 * @returns {Object} Enhanced engine with view transitions
 */
export function integrateViewTransitions(engine, viewTransitions) {
  if (!engine || !viewTransitions) {
    console.error('[ViewTransitions] Invalid parameters for integration');
    return engine;
  }

  // Enhance transition methods
  const originalTransition = engine.transition.bind(engine);
  const originalTransitionToImage = engine.transitionToImage.bind(engine);

  engine.transition = async function(pattern, duration = 2000) {
    console.log('[ViewTransitions] Enhanced transition to pattern:', pattern);
    
    await viewTransitions.transition(() => {
      originalTransition(pattern, duration);
      // Wait for transition to start
      return new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  engine.transitionToImage = async function(image, duration = 2000) {
    console.log('[ViewTransitions] Enhanced transition to image');
    
    await viewTransitions.transition(() => {
      originalTransitionToImage(image, duration);
      // Wait for transition to start
      return new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  console.log('[ViewTransitions] Integration complete');
  return engine;
}
