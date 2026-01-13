/**
 * Preset Manager
 * Manages loading, registration, and switching of animation presets
 */
export class PresetManager {
  constructor() {
    this.presets = new Map();
    this.activePreset = null;
    console.log('[PresetManager] Initialized');
  }

  /**
   * Register a new preset
   * @param {string} id - Unique identifier for the preset
   * @param {Preset} preset - Preset instance
   */
  registerPreset(id, preset) {
    if (this.presets.has(id)) {
      console.warn(`[PresetManager] Preset '${id}' already registered, overwriting`);
    }
    this.presets.set(id, preset);
    console.log(`[PresetManager] Registered preset: ${id} (${preset.name})`);
  }

  /**
   * Unregister a preset
   * @param {string} id - Preset identifier
   */
  unregisterPreset(id) {
    if (this.presets.has(id)) {
      const preset = this.presets.get(id);
      if (this.activePreset === preset) {
        this.deactivateCurrentPreset();
      }
      this.presets.delete(id);
      console.log(`[PresetManager] Unregistered preset: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get a preset by ID
   * @param {string} id - Preset identifier
   * @returns {Preset|null} Preset instance or null
   */
  getPreset(id) {
    return this.presets.get(id) || null;
  }

  /**
   * Get all registered presets
   * @returns {Array} Array of {id, preset} objects
   */
  getAllPresets() {
    const presetList = [];
    for (const [id, preset] of this.presets.entries()) {
      presetList.push({ id, preset });
    }
    return presetList;
  }

  /**
   * Activate a preset
   * @param {string} id - Preset identifier
   * @param {Array} particles - Array of particle objects
   * @param {Object} dimensions - Canvas dimensions
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  activatePreset(id, particles, dimensions, options = {}) {
    const preset = this.presets.get(id);
    
    if (!preset) {
      console.error(`[PresetManager] Preset '${id}' not found`);
      return false;
    }

    // Deactivate current preset if any
    this.deactivateCurrentPreset();

    // Activate new preset
    this.activePreset = preset;
    preset.initialize(particles, dimensions, options);
    console.log(`[PresetManager] Activated preset: ${id}`);
    return true;
  }

  /**
   * Deactivate the current preset
   */
  deactivateCurrentPreset() {
    if (this.activePreset) {
      this.activePreset.deactivate();
      console.log(`[PresetManager] Deactivated preset: ${this.activePreset.name}`);
      this.activePreset = null;
    }
  }

  /**
   * Update the active preset
   * @param {Array} particles - Array of particle objects
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {Object} dimensions - Canvas dimensions
   */
  update(particles, deltaTime, dimensions) {
    if (this.activePreset && this.activePreset.isActive) {
      this.activePreset.update(particles, deltaTime, dimensions);
    }
  }

  /**
   * Transition the active preset to a target
   * @param {Array} particles - Array of particle objects
   * @param {Array} targets - Array of target positions/colors
   * @param {number} duration - Transition duration in milliseconds
   */
  transitionTo(particles, targets, duration = 2000) {
    if (this.activePreset && this.activePreset.isActive) {
      this.activePreset.transitionTo(particles, targets, duration);
    }
  }

  /**
   * Check if a preset is currently active
   * @returns {boolean} True if a preset is active
   */
  hasActivePreset() {
    return this.activePreset !== null && this.activePreset.isActive;
  }

  /**
   * Get the currently active preset
   * @returns {Preset|null} Active preset or null
   */
  getActivePreset() {
    return this.activePreset;
  }

  /**
   * Get the ID of the currently active preset
   * @returns {string|null} Active preset ID or null
   */
  getActivePresetId() {
    if (!this.activePreset) return null;
    
    for (const [id, preset] of this.presets.entries()) {
      if (preset === this.activePreset) {
        return id;
      }
    }
    return null;
  }
}
