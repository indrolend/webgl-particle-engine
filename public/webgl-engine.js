/**
 * WebGL Engine - Wrapper for ParticleEngine
 * Provides an alternative entry point and convenient exports
 * 
 * This module serves as a compatibility layer and convenient alias
 * for the main ParticleEngine class. See ./src/ParticleEngine.js
 * for detailed API documentation.
 * 
 * @example
 * import { ParticleEngine } from './webgl-engine.js';
 * 
 * const canvas = document.getElementById('canvas');
 * const engine = new ParticleEngine(canvas, { particleCount: 2000 });
 * 
 * // Initialize and morph between images
 * engine.initializeFromImage(image1);
 * engine.start();
 * engine.transitionToImage(image2, 2000);
 */

// Re-export ParticleEngine as the main engine
export { ParticleEngine } from './src/ParticleEngine.js';

// Also export related components for convenience
export { Renderer } from './src/Renderer.js';
export { ParticleSystem } from './src/ParticleSystem.js';

