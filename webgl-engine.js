/**
 * WebGL Engine - Wrapper for ParticleEngine
 * Provides an alternative entry point and convenient exports
 * 
 * This module serves as a compatibility layer and convenient alias
 * for the main ParticleEngine class.
 */

// Re-export ParticleEngine as the main engine
export { ParticleEngine } from './src/ParticleEngine.js';

// Also export related components for convenience
export { Renderer } from './src/Renderer.js';
export { ParticleSystem } from './src/ParticleSystem.js';

/**
 * ParticleEngine Class
 * 
 * Main WebGL particle engine for creating and transitioning particles between images.
 * 
 * Features:
 * - Loading two images as textures
 * - Generating and transitioning particles between images
 * - Basic animation loop for morphing
 * - Hardware-accelerated WebGL rendering
 * 
 * Usage Example:
 * ```javascript
 * import { ParticleEngine } from './webgl-engine.js';
 * 
 * const canvas = document.getElementById('canvas');
 * const engine = new ParticleEngine(canvas, {
 *     particleCount: 2000,
 *     speed: 1.0
 * });
 * 
 * // Load and initialize from first image
 * const img1 = new Image();
 * img1.onload = () => {
 *     engine.initializeFromImage(img1);
 *     engine.start();
 * };
 * img1.src = 'image1.png';
 * 
 * // Transition to second image
 * const img2 = new Image();
 * img2.onload = () => {
 *     engine.transitionToImage(img2, 2000); // 2 second transition
 * };
 * img2.src = 'image2.png';
 * ```
 */
