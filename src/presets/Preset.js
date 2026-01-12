/**
 * Base Preset Class
 * All animation presets should extend this class
 */
export class Preset {
  constructor(name, description, config = {}) {
    this.name = name;
    this.description = description;
    this.config = config;
    this.isActive = false;
    this.startTime = 0;
  }

  /**
   * Called when the preset is activated
   * @param {Array} particles - Array of particle objects
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Object} options - Additional options
   */
  initialize(particles, dimensions, options = {}) {
    this.isActive = true;
    this.startTime = Date.now();
    console.log(`[Preset:${this.name}] Initialized`);
  }

  /**
   * Called every frame to update particle behavior
   * @param {Array} particles - Array of particle objects
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {Object} dimensions - Canvas dimensions {width, height}
   */
  update(particles, deltaTime, dimensions) {
    // Override in subclass
  }

  /**
   * Called when transitioning to a target (pattern or image)
   * @param {Array} particles - Array of particle objects
   * @param {Array} targets - Array of target positions/colors
   * @param {number} duration - Transition duration in milliseconds
   */
  transitionTo(particles, targets, duration = 2000) {
    // Override in subclass
  }

  /**
   * Clean up when preset is deactivated
   */
  deactivate() {
    this.isActive = false;
    console.log(`[Preset:${this.name}] Deactivated`);
  }

  /**
   * Update preset configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log(`[Preset:${this.name}] Config updated:`, this.config);
  }

  /**
   * Get current preset configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
