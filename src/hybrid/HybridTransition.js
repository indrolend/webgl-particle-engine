/**
 * HybridTransition - Orchestrates jelly mesh transitions
 * 
 * Features:
 * - State machine for transition phases
 * - Expansion → Contraction → Morph orchestration
 * - FPS-based adaptive detail
 * - Image morphing during contraction
 * - Configurable edge break probability
 */

import { JellyMesh } from './JellyMesh.js';
import { JellyPhysics } from './JellyPhysics.js';

export class HybridTransition {
  constructor(config = {}) {
    this.config = {
      // Phase durations (ms)
      expansionDuration: config.expansionDuration || 800,
      contractionDuration: config.contractionDuration || 1200,
      morphDuration: config.morphDuration || 1000,
      
      // Explosion parameters
      explosionIntensity: config.explosionIntensity || 100,
      edgeBreakChance: config.edgeBreakChance || 0.3, // 0-1
      
      // Adaptive detail
      enableAdaptiveDetail: config.enableAdaptiveDetail !== false,
      targetFPS: config.targetFPS || 30,
      minDetailLevel: config.minDetailLevel || 0.3,
      maxDetailLevel: config.maxDetailLevel || 1.0,
      
      // Mesh extraction
      minVertexCount: config.minVertexCount || 20,
      maxVertexCount: config.maxVertexCount || 200,
      
      // Physics
      springStiffness: config.springStiffness || 0.5,
      breakTensionThreshold: config.breakTensionThreshold || 2.5,
      
      ...config
    };
    
    // Create subsystems
    this.jellyMesh = new JellyMesh({
      minVertexCount: this.config.minVertexCount,
      maxVertexCount: this.config.maxVertexCount,
      detailLevel: this.config.maxDetailLevel
    });
    
    this.jellyPhysics = new JellyPhysics({
      springStiffness: this.config.springStiffness,
      breakTensionThreshold: this.config.breakTensionThreshold,
      breakProbability: this.config.edgeBreakChance,
      explosionStrength: this.config.explosionIntensity
    });
    
    // Transition state
    this.state = 'idle'; // idle, expansion, contraction, morph
    this.stateStartTime = 0;
    this.currentMesh = null;
    this.targetMesh = null;
    this.currentImage = null;
    this.targetImage = null;
    this.morphProgress = 0;
    
    // FPS tracking for adaptive detail
    this.fpsHistory = [];
    this.lastFrameTime = 0;
    
    console.log('[HybridTransition] Initialized with config:', this.config);
  }
  
  /**
   * Start transition from one image to another
   */
  startTransition(fromImage, toImage) {
    console.log('[HybridTransition] Starting transition...');
    
    this.currentImage = fromImage;
    this.targetImage = toImage;
    
    // Extract mesh from source image
    this.currentMesh = this.jellyMesh.extractMesh(fromImage, 'source');
    
    if (!this.currentMesh) {
      console.error('[HybridTransition] Failed to extract source mesh');
      return false;
    }
    
    // Extract mesh from target image for morphing
    this.targetMesh = this.jellyMesh.extractMesh(toImage, 'target');
    
    if (!this.targetMesh) {
      console.error('[HybridTransition] Failed to extract target mesh');
      return false;
    }
    
    // Initialize physics
    this.jellyPhysics.initializeMesh(this.currentMesh);
    
    // Start expansion phase
    this.startExpansion();
    
    return true;
  }
  
  /**
   * Phase 1: Expansion - mesh explodes outward
   */
  startExpansion() {
    console.log('[HybridTransition] Starting expansion phase');
    
    this.state = 'expansion';
    this.stateStartTime = Date.now();
    
    // Apply explosion impulse
    this.jellyPhysics.applyExplosion(this.currentMesh, this.config.explosionIntensity);
  }
  
  /**
   * Phase 2: Contraction - mesh contracts back
   */
  startContraction() {
    console.log('[HybridTransition] Starting contraction phase');
    
    this.state = 'contraction';
    this.stateStartTime = Date.now();
  }
  
  /**
   * Phase 3: Morph - transition to target image shape
   */
  startMorph() {
    console.log('[HybridTransition] Starting morph phase');
    
    this.state = 'morph';
    this.stateStartTime = Date.now();
    this.morphProgress = 0;
  }
  
  /**
   * Update transition state
   */
  update(deltaTime, boundaries = null) {
    if (this.state === 'idle') {
      return {
        mesh: null,
        image: null,
        complete: true
      };
    }
    
    // Track FPS for adaptive detail
    if (this.config.enableAdaptiveDetail) {
      this.updateFPS();
    }
    
    const currentTime = Date.now();
    const elapsed = currentTime - this.stateStartTime;
    
    // Update physics
    if (this.currentMesh) {
      this.jellyPhysics.update(this.currentMesh, deltaTime, boundaries);
    }
    
    // State machine
    switch (this.state) {
      case 'expansion':
        return this.updateExpansion(elapsed, deltaTime);
        
      case 'contraction':
        return this.updateContraction(elapsed, deltaTime);
        
      case 'morph':
        return this.updateMorph(elapsed, deltaTime);
        
      default:
        return {
          mesh: this.currentMesh,
          image: this.currentImage,
          complete: false
        };
    }
  }
  
  /**
   * Update expansion phase
   */
  updateExpansion(elapsed, deltaTime) {
    const progress = Math.min(elapsed / this.config.expansionDuration, 1.0);
    
    // Check if expansion is complete
    if (progress >= 1.0) {
      this.startContraction();
    }
    
    return {
      mesh: this.currentMesh,
      image: this.currentImage,
      phase: 'expansion',
      progress: progress,
      complete: false
    };
  }
  
  /**
   * Update contraction phase
   */
  updateContraction(elapsed, deltaTime) {
    const progress = Math.min(elapsed / this.config.contractionDuration, 1.0);
    
    // Apply contraction force
    const contractionStrength = 0.5 * progress;
    this.jellyPhysics.applyContraction(this.currentMesh, contractionStrength);
    
    // Check if contraction is complete
    if (progress >= 1.0) {
      this.startMorph();
    }
    
    return {
      mesh: this.currentMesh,
      image: this.currentImage,
      phase: 'contraction',
      progress: progress,
      complete: false
    };
  }
  
  /**
   * Update morph phase
   */
  updateMorph(elapsed, deltaTime) {
    const progress = Math.min(elapsed / this.config.morphDuration, 1.0);
    this.morphProgress = progress;
    
    // Morph mesh vertices toward target positions
    if (this.currentMesh && this.targetMesh) {
      this.morphMeshes(progress);
    }
    
    // Check if morph is complete
    if (progress >= 1.0) {
      console.log('[HybridTransition] Transition complete');
      this.state = 'idle';
      
      return {
        mesh: this.targetMesh,
        image: this.targetImage,
        phase: 'morph',
        progress: 1.0,
        complete: true
      };
    }
    
    return {
      mesh: this.currentMesh,
      image: this.currentImage,
      targetImage: this.targetImage,
      morphProgress: progress,
      phase: 'morph',
      progress: progress,
      complete: false
    };
  }
  
  /**
   * Morph current mesh toward target mesh
   */
  morphMeshes(progress) {
    const source = this.currentMesh.perimeter;
    const target = this.targetMesh.perimeter;
    
    // Handle different vertex counts
    const minLength = Math.min(source.length, target.length);
    
    for (let i = 0; i < minLength; i++) {
      const s = source[i];
      const tIdx = Math.floor((i / source.length) * target.length);
      const t = target[tIdx];
      
      // Interpolate position
      const targetX = s.x + (t.x - s.x) * progress;
      const targetY = s.y + (t.y - s.y) * progress;
      
      // Apply as velocity for smooth transition
      s.vx += (targetX - s.x) * 0.1;
      s.vy += (targetY - s.y) * 0.1;
    }
  }
  
  /**
   * Update FPS tracking
   */
  updateFPS() {
    const currentTime = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameDuration = currentTime - this.lastFrameTime;
      const fps = 1000 / frameDuration;
      
      this.fpsHistory.push(fps);
      
      // Keep last 30 frames
      if (this.fpsHistory.length > 30) {
        this.fpsHistory.shift();
      }
      
      // Adjust detail if FPS drops
      const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      
      if (avgFPS < this.config.targetFPS) {
        this.reduceDetail();
      }
    }
    
    this.lastFrameTime = currentTime;
  }
  
  /**
   * Reduce mesh detail when FPS drops
   */
  reduceDetail() {
    const currentDetail = this.jellyMesh.config.detailLevel;
    const newDetail = Math.max(this.config.minDetailLevel, currentDetail * 0.9);
    
    if (newDetail !== currentDetail) {
      console.log(`[HybridTransition] Reducing detail: ${currentDetail.toFixed(2)} → ${newDetail.toFixed(2)}`);
      this.jellyMesh.setDetailLevel(newDetail);
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      progress: this.morphProgress,
      meshStats: this.jellyPhysics.getStats(),
      detailLevel: this.jellyMesh.config.detailLevel,
      fps: this.getAverageFPS()
    };
  }
  
  /**
   * Get average FPS
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }
  
  /**
   * Get current mesh for rendering
   */
  getCurrentMesh() {
    return this.currentMesh;
  }
  
  /**
   * Get current image for rendering
   */
  getCurrentImage() {
    return this.currentImage;
  }
  
  /**
   * Check if transition is active
   */
  isActive() {
    return this.state !== 'idle';
  }
  
  /**
   * Reset transition
   */
  reset() {
    this.state = 'idle';
    this.stateStartTime = 0;
    this.currentMesh = null;
    this.targetMesh = null;
    this.currentImage = null;
    this.targetImage = null;
    this.morphProgress = 0;
    this.fpsHistory = [];
    this.lastFrameTime = 0;
    
    this.jellyPhysics.reset();
    this.jellyMesh.clearCache();
    
    console.log('[HybridTransition] Reset');
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    // Update subsystems
    if (newConfig.minVertexCount !== undefined || newConfig.maxVertexCount !== undefined) {
      this.jellyMesh.config.minVertexCount = this.config.minVertexCount;
      this.jellyMesh.config.maxVertexCount = this.config.maxVertexCount;
    }
    
    if (newConfig.springStiffness !== undefined) {
      this.jellyPhysics.config.springStiffness = this.config.springStiffness;
    }
    
    if (newConfig.breakTensionThreshold !== undefined) {
      this.jellyPhysics.config.breakTensionThreshold = this.config.breakTensionThreshold;
    }
    
    if (newConfig.edgeBreakChance !== undefined) {
      this.jellyPhysics.config.breakProbability = this.config.edgeBreakChance;
    }
    
    console.log('[HybridTransition] Configuration updated:', newConfig);
  }
}
