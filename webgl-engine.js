/**
 * WebGL Engine - Wrapper for ParticleEngine and HybridEngine
 * Provides an alternative entry point and convenient exports
 * 
 * This module serves as a compatibility layer and convenient alias
 * for the main engine classes. See ./src/ParticleEngine.js and
 * ./src/HybridEngine.js for detailed API documentation.
 * 
 * @example
 * // Basic particle engine
 * import { ParticleEngine } from './webgl-engine.js';
 * 
 * const canvas = document.getElementById('canvas');
 * const engine = new ParticleEngine(canvas, { particleCount: 2000 });
 * 
 * // Initialize and morph between images
 * engine.initializeFromImage(image1);
 * engine.start();
 * engine.transitionToImage(image2, 2000);
 * 
 * @example
 * // Advanced hybrid engine with triangulation
 * import { HybridEngine } from './webgl-engine.js';
 * 
 * const canvas = document.getElementById('canvas');
 * const engine = new HybridEngine(canvas, { 
 *   particleCount: 2000,
 *   enableTriangulation: true 
 * });
 * 
 * // Use setImage and startHybridTransition
 * await engine.setImage(image1);
 * engine.start();
 * await engine.startHybridTransition(image1, image2);
 */

// Re-export ParticleEngine as the main engine
export { ParticleEngine } from './src/ParticleEngine.js';

// Export HybridEngine for advanced hybrid transitions
export { HybridEngine } from './src/HybridEngine.js';

// Also export related components for convenience
export { Renderer } from './src/Renderer.js';
export { ParticleSystem } from './src/ParticleSystem.js';

