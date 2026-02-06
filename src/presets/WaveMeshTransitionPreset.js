/**
 * WaveMeshTransitionPreset - Immersive page transitions with wavy mesh distortion
 * 
 * Inspired by: https://codepen.io/alphardex/pen/RwpajRj
 * 
 * Implements a 5-phase transition with sine wave displacement:
 * 1. Static Display - Source image as solid, flat mesh
 * 2. Wave In - Gradually apply sine wave distortion
 * 3. Wave Morph - Maintain wave distortion while crossfading texture
 * 4. Wave Out - Gradually remove wave distortion
 * 5. Static Target - Target image as solid, flat mesh
 * 
 * Features:
 * - Hardware-accelerated WebGL rendering
 * - Configurable wave parameters (amplitude, frequency, speed, direction)
 * - Smooth easing functions for natural motion
 * - Triangle mesh generation for efficient rendering
 */

import { Preset } from './Preset.js';

export class WaveMeshTransitionPreset extends Preset {
  constructor(config = {}) {
    super(
      'Wave Mesh Transition',
      'Immersive page transitions with wavy mesh distortion effects',
      {
        // Phase durations (ms)
        staticDuration: config.staticDuration || 500,
        waveInDuration: config.waveInDuration || 800,
        morphDuration: config.morphDuration || 1500,
        waveOutDuration: config.waveOutDuration || 800,
        staticTargetDuration: config.staticTargetDuration || 500,
        
        // Wave parameters
        waveAmplitude: config.amplitude || config.waveAmplitude || 20,
        waveFrequency: config.frequency || config.waveFrequency || 0.05,
        waveSpeed: config.speed || config.waveSpeed || 2.0,
        waveDirectionX: config.waveDirectionX || 1.0,
        waveDirectionY: config.waveDirectionY || 0.5,
        
        // Mesh grid configuration
        gridRows: config.gridRows || 20,
        gridCols: config.gridCols || 20,
        
        ...config
      }
    );
    
    // State tracking
    this.phase = 'idle'; // idle, static, waveIn, morph, waveOut, staticTarget
    this.phaseStartTime = 0;
    this.animationTime = 0;
    
    // Wave state
    this.currentAmplitude = 0;
    this.targetAmplitude = 0;
    
    // Morph state
    this.morphProgress = 0;
    
    // Mesh data
    this.meshGrid = null;
    this.triangles = null;
    this.sourceImage = null;
    this.targetImage = null;
    
    console.log('[WaveMeshTransition] Initialized with config:', this.config);
  }
  
  /**
   * Initialize the preset with source and target images
   */
  initialize(particles, dimensions, options = {}) {
    super.initialize(particles, dimensions, options);
    
    this.sourceImage = options.sourceImage || null;
    this.targetImage = options.targetImage || null;
    
    // Generate mesh grid
    this.generateMeshGrid(dimensions.width, dimensions.height);
    
    // Generate triangles for WebGL rendering
    this.generateTriangles();
    
    // Start with static display phase
    this.startPhase('static');
    
    console.log('[WaveMeshTransition] Initialized with grid:', 
      `${this.config.gridRows}x${this.config.gridCols} (${this.meshGrid.length} vertices, ${this.triangles.length / 3} triangles)`);
  }
  
  /**
   * Generate mesh grid from dimensions
   */
  generateMeshGrid(width, height) {
    const rows = this.config.gridRows;
    const cols = this.config.gridCols;
    const grid = [];
    
    const cellWidth = width / (cols - 1);
    const cellHeight = height / (rows - 1);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        grid.push({
          // Original position (for texture coordinates)
          originalX: x,
          originalY: y,
          // Current position (with wave distortion applied)
          currentX: x,
          currentY: y,
          // Grid indices
          row: row,
          col: col
        });
      }
    }
    
    this.meshGrid = grid;
  }
  
  /**
   * Generate triangle indices for mesh rendering
   * Creates two triangles per grid cell
   */
  generateTriangles() {
    const rows = this.config.gridRows;
    const cols = this.config.gridCols;
    const triangles = [];
    
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const topLeft = row * cols + col;
        const topRight = topLeft + 1;
        const bottomLeft = (row + 1) * cols + col;
        const bottomRight = bottomLeft + 1;
        
        // First triangle (top-left, top-right, bottom-left)
        triangles.push(topLeft, topRight, bottomLeft);
        
        // Second triangle (top-right, bottom-right, bottom-left)
        triangles.push(topRight, bottomRight, bottomLeft);
      }
    }
    
    this.triangles = triangles;
  }
  
  /**
   * Start a specific phase
   */
  startPhase(phase) {
    console.log(`[WaveMeshTransition] Starting phase: ${phase}`);
    this.phase = phase;
    this.phaseStartTime = Date.now();
    
    // Set amplitude targets for wave phases
    if (phase === 'waveIn') {
      this.targetAmplitude = this.config.waveAmplitude;
    } else if (phase === 'waveOut') {
      this.targetAmplitude = 0;
    }
  }
  
  /**
   * Update wave mesh animation
   */
  update(particles, deltaTime, dimensions) {
    if (!this.isActive) return;
    
    // Update animation time
    this.animationTime += deltaTime * this.config.waveSpeed;
    
    const elapsedTime = Date.now() - this.phaseStartTime;
    
    // Phase-specific updates
    switch (this.phase) {
      case 'static':
        this.updateStaticPhase(elapsedTime);
        break;
      case 'waveIn':
        this.updateWaveInPhase(elapsedTime);
        break;
      case 'morph':
        this.updateMorphPhase(elapsedTime);
        break;
      case 'waveOut':
        this.updateWaveOutPhase(elapsedTime);
        break;
      case 'staticTarget':
        this.updateStaticTargetPhase(elapsedTime);
        break;
    }
    
    // Apply wave displacement to mesh vertices
    this.applyWaveDisplacement();
  }
  
  /**
   * Phase 1: Static Display
   */
  updateStaticPhase(elapsedTime) {
    // Keep amplitude at zero (no waves)
    this.currentAmplitude = 0;
    
    if (elapsedTime >= this.config.staticDuration) {
      this.startPhase('waveIn');
    }
  }
  
  /**
   * Phase 2: Wave In
   */
  updateWaveInPhase(elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.waveInDuration, 1);
    const easedProgress = this.easeInOutQuad(progress);
    
    // Gradually increase amplitude
    this.currentAmplitude = easedProgress * this.targetAmplitude;
    
    if (progress >= 1) {
      this.startPhase('morph');
      this.morphProgress = 0;
    }
  }
  
  /**
   * Phase 3: Wave Morph
   */
  updateMorphPhase(elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.morphDuration, 1);
    
    // Maintain full wave amplitude
    this.currentAmplitude = this.targetAmplitude;
    
    // Update morph progress for texture crossfade
    this.morphProgress = this.easeInOutCubic(progress);
    
    if (progress >= 1) {
      this.startPhase('waveOut');
    }
  }
  
  /**
   * Phase 4: Wave Out
   */
  updateWaveOutPhase(elapsedTime) {
    const progress = Math.min(elapsedTime / this.config.waveOutDuration, 1);
    const easedProgress = this.easeInOutQuad(progress);
    
    // Gradually decrease amplitude
    this.currentAmplitude = (1 - easedProgress) * this.config.waveAmplitude;
    
    if (progress >= 1) {
      this.startPhase('staticTarget');
    }
  }
  
  /**
   * Phase 5: Static Target
   */
  updateStaticTargetPhase(elapsedTime) {
    // Keep amplitude at zero (no waves)
    this.currentAmplitude = 0;
    
    if (elapsedTime >= this.config.staticTargetDuration) {
      console.log('[WaveMeshTransition] Transition complete');
      this.phase = 'idle';
      this.isActive = false;
    }
  }
  
  /**
   * Apply sine wave displacement to mesh vertices
   * Based on the formula:
   * waveX = sin((x * frequency * directionX) + (y * frequency * 0.2) + time) * amplitude
   * waveY = sin((y * frequency * directionY) + (x * frequency * 0.3) + time * 1.3) * amplitude * 0.7
   */
  applyWaveDisplacement() {
    if (!this.meshGrid) return;
    
    const amplitude = this.currentAmplitude;
    const frequency = this.config.waveFrequency;
    const time = this.animationTime;
    const dirX = this.config.waveDirectionX;
    const dirY = this.config.waveDirectionY;
    
    for (let i = 0; i < this.meshGrid.length; i++) {
      const vertex = this.meshGrid[i];
      const x = vertex.originalX;
      const y = vertex.originalY;
      
      // Calculate wave displacement
      const waveX = Math.sin((x * frequency * dirX) + (y * frequency * 0.2) + time) * amplitude;
      const waveY = Math.sin((y * frequency * dirY) + (x * frequency * 0.3) + time * 1.3) * amplitude * 0.7;
      
      // Apply displacement
      vertex.currentX = x + waveX;
      vertex.currentY = y + waveY;
    }
  }
  
  /**
   * Get mesh grid for rendering
   */
  getMeshGrid() {
    return this.meshGrid;
  }
  
  /**
   * Get triangles for rendering
   */
  getTriangles() {
    return this.triangles;
  }
  
  /**
   * Get current morph progress (0 to 1)
   */
  getMorphProgress() {
    return this.morphProgress;
  }
  
  /**
   * Get current phase
   */
  getCurrentPhase() {
    return this.phase;
  }
  
  /**
   * Check if transition is complete
   */
  isComplete() {
    return this.phase === 'idle' && !this.isActive;
  }
  
  /**
   * Easing function: ease in-out quadratic
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  /**
   * Easing function: ease in-out cubic
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Clean up resources
   */
  deactivate() {
    super.deactivate();
    this.phase = 'idle';
    this.currentAmplitude = 0;
    this.targetAmplitude = 0;
    this.morphProgress = 0;
    this.animationTime = 0;
    console.log('[WaveMeshTransition] Deactivated');
  }
}
