/**
 * TransitionEventEmitter - Simple event emitter for transition lifecycle hooks
 * 
 * Supported events:
 * - transitionStart: Fired when transition begins
 * - transitionComplete: Fired when transition completes
 * - transitionError: Fired when transition fails
 * - phaseStart: Fired when a phase begins (with phase name)
 * - phaseEnd: Fired when a phase ends (with phase name)
 * - phaseProgress: Fired during phase execution (with progress 0-1)
 */

export class TransitionEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    
    return this.on(event, wrappedCallback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    
    // Clean up empty arrays
    if (callbacks.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    
    // Call all listeners
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[TransitionEventEmitter] Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   * @param {string} event - Optional event name
   */
  removeAllListeners(event = null) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    if (!this.listeners.has(event)) {
      return 0;
    }
    
    return this.listeners.get(event).length;
  }

  /**
   * Get all event names that have listeners
   * @returns {Array<string>} Event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
}
